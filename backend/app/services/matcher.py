"""
backend/app/services/matcher.py
===============================
Rule-based skill extraction, evidence snippet harvesting, and explainable comparison engine.

Why rule-based matching for CareerPilot AI?
1. Deterministic & Explainable: 100% transparency — no black-box hallucinations.
   Every match is backed by extracted evidence snippets from the actual resume text.
2. Fast & Resource-Efficient: Zero GPU or external cloud API required.
3. Baseline for Future Phases: Serves as a deterministic baseline to measure
   future local semantic/embedding models against.
"""

import re
from typing import Dict, List, Set, Tuple
from app.services.skill_taxonomy import (
    SKILL_ALIASES,
    get_skill_category,
    get_all_categories,
)
from app.schemas.analysis import SkillMatchResult, CategoryBreakdown
from app.services.semantic_ai import semantic_engine


def _compile_skill_pattern(alias: str) -> re.Pattern:
    """
    Helper to compile a regex pattern that safely matches a skill keyword.
    
    Keywords like 'c++', 'c#', '.net', 'node.js', and 'ci/cd' contain non-word characters.
    Standard Python regex word boundaries (\\b) treat '+' or '.' as boundaries, which breaks
    matches for 'c++'. We use lookaround / delimiter boundaries for such symbols.
    """
    escaped = re.escape(alias)
    has_symbols = bool(re.search(r"[+#./]", alias))
    if has_symbols:
        # Match if preceded and followed by whitespace, punctuation, or start/end of string
        pattern_str = rf"(?:^|[\s,;()\[\]{{}}/'\"]){escaped}(?:$|[\s,;()\[\]{{}}/'\"])"
    else:
        # Standard word boundary for clean alphabetic phrases (e.g. 'python', 'machine learning')
        pattern_str = rf"\b{escaped}\b"
        
    return re.compile(pattern_str, re.IGNORECASE)


# Precompile all regex patterns at startup for maximum throughput
COMPILED_PATTERNS = [
    (alias, canonical, _compile_skill_pattern(alias))
    for alias, canonical in sorted(
        SKILL_ALIASES.items(),
        key=lambda item: len(item[0]),
        reverse=True  # Match multi-word terms first (e.g. 'natural language processing' before 'nlp')
    )
]


def extract_skills_from_text(text: str) -> Set[str]:
    """
    Extracts all recognized technical skills from raw text and maps them to canonical names.

    Parameters:
    ----------
    text : str
        The raw input text (resume text or job description).

    Returns:
    -------
    Set[str]
        A set of canonical skill names detected in the text (e.g., {'Python', 'React', 'Docker'}).
    """
    if not text or not text.strip():
        return set()

    detected_skills: Set[str] = set()

    # Search against our compiled taxonomy patterns
    for _alias, canonical, pattern in COMPILED_PATTERNS:
        if pattern.search(text):
            detected_skills.add(canonical)

    return detected_skills


def extract_skills_with_evidence(text: str) -> Tuple[Set[str], Dict[str, List[str]]]:
    """
    Extracts recognized skills and extracts the surrounding sentences/bullet points
    as evidence snippets to prove where each skill was found in the candidate resume.

    Returns:
    -------
    Tuple[Set[str], Dict[str, List[str]]]
        (detected_skills_set, {canonical_skill: [evidence_snippet_1, ...]})
    """
    if not text or not text.strip():
        return set(), {}

    detected_skills: Set[str] = set()
    evidence_map: Dict[str, List[str]] = {}

    # 1. Normalize line breaks and clean text into candidate lines/sentences
    cleaned_lines: List[str] = []
    raw_lines = text.replace("\r\n", "\n").split("\n")
    for raw_line in raw_lines:
        line = raw_line.strip()
        # Strip common leading bullet symbols (*, -, •, ▪, >, etc.)
        line = re.sub(r"^[\s*•▪\-–—>·]+\s*", "", line).strip()
        if len(line) >= 5:
            # Further split lines if multiple complete sentences exist in a single line
            sub_sentences = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9])", line)
            for sub in sub_sentences:
                clean_sub = sub.strip()
                if len(clean_sub) >= 5:
                    cleaned_lines.append(clean_sub)

    # 2. Match each compiled pattern against lines to capture evidence
    for _alias, canonical, pattern in COMPILED_PATTERNS:
        for line in cleaned_lines:
            if pattern.search(line):
                detected_skills.add(canonical)
                if canonical not in evidence_map:
                    evidence_map[canonical] = []

                # Format snippet: truncate to 160 characters if overly long
                snippet = line if len(line) <= 160 else line[:157] + "..."
                if snippet not in evidence_map[canonical] and len(evidence_map[canonical]) < 3:
                    evidence_map[canonical].append(snippet)

    # 3. Fallback check: ensure any skill detected in raw text is not missed
    raw_detected = extract_skills_from_text(text)
    for skill in raw_detected:
        detected_skills.add(skill)
        if skill not in evidence_map:
            evidence_map[skill] = [f"Mentioned in resume text as '{skill}'"]

    return detected_skills, evidence_map


def parse_job_description_sections(jd_text: str) -> Tuple[Set[str], Set[str]]:
    """
    Parses a job description to separate Required / Minimum skills from Preferred / Bonus skills.
    
    Returns:
    -------
    Tuple[Set[str], Set[str]]
        (required_skills, preferred_skills)
    """
    if not jd_text or not jd_text.strip():
        return set(), set()

    all_jd_skills = extract_skills_from_text(jd_text)
    if not all_jd_skills:
        return set(), set()

    # Look for common section headers indicating preferred/bonus requirements
    preferred_header_pattern = re.compile(
        r"(?:(?:preferred|desired|nice\s+to\s+have|good\s+to\s+have|bonus|plus(?:es)?)\b.*?:?)",
        re.IGNORECASE
    )

    lines = jd_text.replace("\r\n", "\n").split("\n")
    required_lines: List[str] = []
    preferred_lines: List[str] = []

    in_preferred_section = False

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if line looks like a preferred header
        if preferred_header_pattern.search(stripped) and len(stripped) < 80:
            in_preferred_section = True
            continue

        # Check if line switches back to general / company info
        if in_preferred_section and re.search(r"(?:about\s+us|benefits|perks|responsibilities)\b.*?:?", stripped, re.IGNORECASE) and len(stripped) < 80:
            in_preferred_section = False

        if in_preferred_section:
            preferred_lines.append(stripped)
        else:
            required_lines.append(stripped)

    # If preferred lines were found, extract skills from each section
    if preferred_lines:
        pref_text = " ".join(preferred_lines)
        req_text = " ".join(required_lines)

        pref_skills = extract_skills_from_text(pref_text)
        req_skills = extract_skills_from_text(req_text)

        # If a skill appears in both, prioritize it as required
        pref_skills = pref_skills.difference(req_skills)

        # Any remaining skills from all_jd_skills belong to required
        req_skills = all_jd_skills.difference(pref_skills)

        return req_skills, pref_skills

    # If no preferred section header was detected, treat all skills as required
    return all_jd_skills, set()


def categorize_skills(
    matched_skills: List[str],
    missing_skills: List[str],
    resume_skills: List[str],
    jd_skills: List[str]
) -> Dict[str, CategoryBreakdown]:
    """
    Groups skills into structured domain categories defined in the skill taxonomy.
    """
    categories = get_all_categories()
    categorized: Dict[str, CategoryBreakdown] = {}

    matched_set = set(matched_skills)
    missing_set = set(missing_skills)
    resume_set = set(resume_skills)
    jd_set = set(jd_skills)

    for cat in categories:
        cat_matched = sorted([s for s in matched_set if get_skill_category(s) == cat])
        cat_missing = sorted([s for s in missing_set if get_skill_category(s) == cat])
        cat_resume = sorted([s for s in resume_set if get_skill_category(s) == cat])
        cat_jd = sorted([s for s in jd_set if get_skill_category(s) == cat])

        # Include category only if at least one skill is present
        if cat_matched or cat_missing or cat_resume or cat_jd:
            categorized[cat] = CategoryBreakdown(
                matched=cat_matched,
                missing=cat_missing,
                resume=cat_resume,
                job_description=cat_jd
            )

    return categorized


def match_skills(resume_text: str, job_description_text: str) -> SkillMatchResult:
    """
    Compares skills in the resume text with skills required in the job description.

    Calculates:
    - Matched Skills: intersection of resume skills and JD skills
    - Missing Skills: skills in JD not found in resume
    - Required vs Preferred separation (with 85% / 15% weighted scoring when applicable)
    - Evidence snippets linking detected resume skills to specific bullet points
    - Categorized skill breakdown by domain (Languages, Cloud, AI/ML, etc.)

    Returns:
    -------
    SkillMatchResult
        Complete breakdown with evidence, categorization, and explainable methodology.
    """
    resume_skills_set, evidence_map = extract_skills_with_evidence(resume_text)
    required_set, preferred_set = parse_job_description_sections(job_description_text)
    jd_skills_set = required_set.union(preferred_set)

    # In case JD has no sections detected
    if not jd_skills_set:
        jd_skills_set = extract_skills_from_text(job_description_text)
        required_set = jd_skills_set.copy()
        preferred_set = set()

    matched_set = resume_skills_set.intersection(jd_skills_set)
    missing_set = jd_skills_set.difference(resume_skills_set)

    matched_list = sorted(list(matched_set))
    missing_list = sorted(list(missing_set))
    resume_list = sorted(list(resume_skills_set))
    jd_list = sorted(list(jd_skills_set))
    required_list = sorted(list(required_set))
    preferred_list = sorted(list(preferred_set))

    total_jd = len(jd_list)
    total_matched = len(matched_list)

    # Score calculation & methodology explanation
    if total_jd > 0:
        if preferred_list and required_list:
            # Weighted scoring when job description specifies both required and preferred skills
            req_matched = len(required_set.intersection(resume_skills_set))
            pref_matched = len(preferred_set.intersection(resume_skills_set))

            req_pct = (req_matched / len(required_list)) if required_list else 0.0
            pref_pct = (pref_matched / len(preferred_list)) if preferred_list else 0.0

            # 85% weight for required skills, 15% bonus weight for preferred qualifications
            match_percentage = round((req_pct * 85.0) + (pref_pct * 15.0), 1)
            methodology = "Weighted rule-based matching (85% required / 15% preferred)"
            explanation = (
                f"The job description specifies {len(required_list)} required and {len(preferred_list)} preferred skill(s). "
                f"Your resume matches {req_matched} required skill(s) and {pref_matched} preferred skill(s), "
                f"yielding an estimated alignment score of {match_percentage}%. "
                f"You have {len(missing_list)} remaining skill gap(s)."
            )
        else:
            # Standard unweighted ratio
            match_percentage = round((total_matched / total_jd) * 100.0, 1)
            methodology = "Rule-based keyword and token pattern matching"
            explanation = (
                f"The job description requires {total_jd} recognized technical skill(s). "
                f"Your resume matches {total_matched} of them ({match_percentage}%). "
                f"You are missing {len(missing_list)} skill(s) mentioned in the target role."
            )
    else:
        # Edge case: No recognized skills in the JD
        match_percentage = 0.0
        methodology = "Rule-based keyword and token pattern matching"
        if total_matched == 0 and len(resume_list) > 0:
            explanation = (
                f"We found {len(resume_list)} skills on your resume, but could not detect any "
                f"standard technical skills in the provided job description. "
                f"Try pasting a more detailed job posting with technical requirements."
            )
        else:
            explanation = (
                "No technical skills could be recognized in the provided job description."
            )

    categorized = categorize_skills(
        matched_skills=matched_list,
        missing_skills=missing_list,
        resume_skills=resume_list,
        jd_skills=jd_list
    )

    return SkillMatchResult(
        matched_skills=matched_list,
        missing_skills=missing_list,
        resume_skills=resume_list,
        job_description_skills=jd_list,
        required_skills=required_list,
        preferred_skills=preferred_list,
        categorized_skills=categorized,
        evidence_snippets=evidence_map,
        match_percentage=match_percentage,
        methodology=methodology,
        explanation=explanation
    )

