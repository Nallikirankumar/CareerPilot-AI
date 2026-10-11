"""
backend/app/services/matcher.py
===============================
Rule-based skill extraction and explainable comparison engine.

Why rule-based matching for Phase 1?
1. Deterministic & Explainable: As an AI & ML student, you know that machine learning
   models can hallucinate or output scores without clear explanations. A rule-based
   foundation provides 100% transparency: if a skill is in both lists, it matches;
   if not, it is missing.
2. Fast & Resource-Efficient: Zero GPU or external cloud API required.
3. Baseline for Future Phases: In later phases, you can layer embeddings (BERT/SentenceTransformers)
   or LLMs on top of this reliable baseline to measure accuracy improvements.
"""

import re
from typing import Set, Tuple
from app.services.skill_taxonomy import SKILL_ALIASES
from app.schemas.analysis import SkillMatchResult


def _compile_skill_pattern(alias: str) -> re.Pattern:
    """
    Helper to compile a regex pattern that safely matches a skill keyword.
    
    Why special handling?
    Keywords like 'c++', 'c#', '.net', 'node.js', and 'ci/cd' contain non-word characters.
    Standard Python regex word boundaries (\\b) treat '+' or '.' as boundaries, which breaks
    matches for 'c++'. We use lookaround / delimiter boundaries for such symbols.
    """
    escaped = re.escape(alias)
    # If the alias contains characters other than letters, numbers, and spaces
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


def match_skills(resume_text: str, job_description_text: str) -> SkillMatchResult:
    """
    Compares skills in the resume text with skills required in the job description.

    Calculates:
    - Matched Skills: intersection of resume skills and JD skills
    - Missing Skills: skills in JD not found in resume
    - Match Percentage: (len(matched) / len(jd_skills)) * 100

    Returns:
    -------
    SkillMatchResult
        Complete breakdown with human-readable explanation and transparent methodology.
    """
    resume_skills_set = extract_skills_from_text(resume_text)
    jd_skills_set = extract_skills_from_text(job_description_text)

    matched_set = resume_skills_set.intersection(jd_skills_set)
    missing_set = jd_skills_set.difference(resume_skills_set)

    matched_list = sorted(list(matched_set))
    missing_list = sorted(list(missing_set))
    resume_list = sorted(list(resume_skills_set))
    jd_list = sorted(list(jd_skills_set))

    total_jd = len(jd_list)
    total_matched = len(matched_list)

    if total_jd > 0:
        match_percentage = round((total_matched / total_jd) * 100.0, 1)
        explanation = (
            f"The job description requires {total_jd} recognized technical skill(s). "
            f"Your resume matches {total_matched} of them ({match_percentage}%). "
            f"You are missing {len(missing_list)} skill(s) mentioned in the target role."
        )
    else:
        # Edge case: No recognized skills in the JD
        match_percentage = 0.0
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

    return SkillMatchResult(
        matched_skills=matched_list,
        missing_skills=missing_list,
        resume_skills=resume_list,
        job_description_skills=jd_list,
        match_percentage=match_percentage,
        methodology="Rule-based keyword and token pattern matching",
        explanation=explanation
    )
