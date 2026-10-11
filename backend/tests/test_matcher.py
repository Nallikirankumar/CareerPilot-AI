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
