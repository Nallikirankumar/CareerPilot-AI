"""
backend/tests/test_matcher.py
=============================
Unit tests for rule-based skill extraction and explainable matching.
"""

from app.services.matcher import extract_skills_from_text, match_skills


def test_extract_skills_standard():
    """Verify that common programming languages and frameworks are extracted."""
    text = "Proficient in Python, React, PostgreSQL, and Docker."
    skills = extract_skills_from_text(text)

    assert "Python" in skills
    assert "React" in skills
    assert "PostgreSQL" in skills
    assert "Docker" in skills


def test_extract_skills_with_special_symbols():
    """Verify that skills with symbols like C++, C#, .NET, and Node.js are matched cleanly."""
    text = "Building microservices using C++, C#, .NET, Node.js, and CI/CD pipelines."
    skills = extract_skills_from_text(text)

    assert "C++" in skills
    assert "C#" in skills
    assert ".NET" in skills
    assert "Node.js" in skills
    assert "CI/CD" in skills


def test_match_skills_full_overlap():
    """Verify 100% match when resume contains all required skills."""
    resume_text = "Skills: Python, FastAPI, Docker, Git, Machine Learning"
    jd_text = "Looking for a developer with Python and FastAPI experience."

    result = match_skills(resume_text, jd_text)

    assert result.match_percentage == 100.0
    assert "Python" in result.matched_skills
    assert "FastAPI" in result.matched_skills
    assert len(result.missing_skills) == 0


def test_match_skills_partial_overlap():
    """Verify partial match and missing skills calculation."""
    resume_text = "Experienced in Python and SQL."
    jd_text = "Requires Python, SQL, Docker, and Kubernetes."

    result = match_skills(resume_text, jd_text)

    # 2 out of 4 skills matched = 50.0%
    assert result.match_percentage == 50.0
    assert sorted(result.matched_skills) == ["Python", "SQL"]
    assert sorted(result.missing_skills) == ["Docker", "Kubernetes"]
    assert "2 of them (50.0%)" in result.explanation


def test_match_skills_empty_jd():
    """Verify safe handling when job description has no recognized technical skills."""
    resume_text = "Experience with Python and React."
    jd_text = "Looking for a punctual team player who arrives on time."

    result = match_skills(resume_text, jd_text)

    assert result.match_percentage == 0.0
    assert len(result.job_description_skills) == 0
    assert len(result.matched_skills) == 0
    assert "could not detect any standard technical skills" in result.explanation


def test_evidence_snippets_extraction():
    """Verify that evidence snippets capture the actual bullet points where skills appear."""
    resume_text = (
        "Project Experience:\n"
        "• Engineered microservice APIs with FastAPI and Docker for 50k users.\n"
        "• Analyzed big data using Pandas and trained predictive Machine Learning models.\n"
    )
    jd_text = "Requires FastAPI, Docker, and Pandas."

    result = match_skills(resume_text, jd_text)

    assert "FastAPI" in result.evidence_snippets
    assert "Docker" in result.evidence_snippets
    assert "Pandas" in result.evidence_snippets

    fastapi_snippets = result.evidence_snippets["FastAPI"]
    assert len(fastapi_snippets) > 0
    assert "Engineered microservice APIs with FastAPI and Docker" in fastapi_snippets[0]


def test_categorized_skills_breakdown():
    """Verify that skills are categorized into standard domains like Languages and Frameworks."""
    resume_text = "Experienced in Python, FastAPI, PostgreSQL, and Git."
    jd_text = "Looking for Python, FastAPI, PostgreSQL, Docker, and React."

    result = match_skills(resume_text, jd_text)

    assert "Programming Languages" in result.categorized_skills
    assert "Web & Backend Frameworks" in result.categorized_skills
    assert "Databases & Storage" in result.categorized_skills

    lang_cat = result.categorized_skills["Programming Languages"]
    assert "Python" in lang_cat.matched

    web_cat = result.categorized_skills["Web & Backend Frameworks"]
    assert "FastAPI" in web_cat.matched
    assert "React" in web_cat.missing


def test_required_vs_preferred_weighted_scoring():
    """Verify that job postings with Required and Preferred sections use 85% / 15% weighted scoring."""
    resume_text = "Proficient in Python and FastAPI."
    jd_text = (
        "Job Title: Backend Developer\n\n"
        "Basic Qualifications / Requirements:\n"
        "- Strong Python and FastAPI experience.\n\n"
        "Preferred Qualifications / Nice to Have:\n"
        "- Experience with Kubernetes and Redis.\n"
    )

    result = match_skills(resume_text, jd_text)

    # Required: Python, FastAPI (matched 2/2 = 100%)
    # Preferred: Kubernetes, Redis (matched 0/2 = 0%)
    # Weighted score: 100% * 85% + 0% * 15% = 85.0%
    assert sorted(result.required_skills) == ["FastAPI", "Python"]
    assert sorted(result.preferred_skills) == ["Kubernetes", "Redis"]
    assert result.match_percentage == 85.0
    assert "85% required / 15% preferred" in result.methodology


def test_duplicate_skills_do_not_inflate_score():
    """Verify that mentioning a skill multiple times in the resume does not artificially inflate scores."""
    resume_text = (
        "I love Python. Python is great. Python in project 1, Python in project 2. "
        "Also know FastAPI."
    )
    jd_text = "Requirements: Python, FastAPI, and Docker."

    result = match_skills(resume_text, jd_text)

    # 2 out of 3 skills matched = 66.7%
    assert result.match_percentage == 66.7
    assert result.matched_skills.count("Python") == 1

