"""
backend/app/services/skill_taxonomy.py
======================================
Curated technical skill taxonomy and canonical alias map for CareerPilot AI.

Why a taxonomy?
In real-world text mining and NLP, candidate resumes and job postings often
refer to the same skill in different ways (e.g., "React.js" vs "React",
"Postgres" vs "PostgreSQL", "Sklearn" vs "Scikit-learn").

This module provides:
1. CANONICAL_SKILLS: Normalized dictionary of technical skills grouped by domain.
2. SKILL_ALIASES: Fast lookup map linking common variants/acronyms to their canonical name.
"""

from typing import Dict, List, Set

# Organized taxonomy categorized by domain
SKILL_TAXONOMY: Dict[str, List[str]] = {
    "Programming Languages": [
        "Python", "Java", "C++", "C#", "C", "JavaScript", "TypeScript", "Go",
        "Rust", "SQL", "HTML", "CSS", "R", "PHP", "Ruby", "Swift", "Kotlin", "Bash", "Shell"
    ],
    "AI, Machine Learning & Data Science": [
        "Machine Learning", "Deep Learning", "Artificial Intelligence",
        "PyTorch", "TensorFlow", "Keras", "Scikit-learn", "Pandas", "NumPy",
        "SciPy", "OpenCV", "NLP", "Natural Language Processing",
        "Computer Vision", "Hugging Face", "Transformers", "LLMs",
        "Large Language Models", "Generative AI", "RAG", "LangChain",
        "Data Analysis", "Data Visualization", "Matplotlib", "Seaborn",
        "Feature Engineering", "Model Evaluation"
    ],
    "Web & Backend Frameworks": [
        "FastAPI", "Flask", "Django", "React", "Next.js", "Node.js", "Express",
        "Vue.js", "Angular", "Spring Boot", "ASP.NET", ".NET", "Tailwind CSS",
        "Bootstrap", "Redux", "REST API", "GraphQL"
    ],
    "Databases & Storage": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle",
        "Cassandra", "Elasticsearch", "Firebase", "Supabase"
    ],
    "Cloud, DevOps & Tools": [
        "Git", "GitHub", "GitLab", "Docker", "Kubernetes", "AWS", "Amazon Web Services",
        "Azure", "GCP", "Google Cloud", "CI/CD", "Linux", "Terraform",
        "Postman", "Nginx", "Jira", "Vite"
    ],
    "Core CS Fundamentals": [
        "Data Structures", "Algorithms", "Object-Oriented Programming", "OOP",
        "System Design", "Operating Systems", "DBMS", "Computer Networks",
        "Software Engineering", "Agile", "Scrum"
    ]
}

# Aliases map lowercase variants directly to canonical display names
SKILL_ALIASES: Dict[str, str] = {
    # Languages
    "python": "Python",
    "java": "Java",
    "c++": "C++",
    "cpp": "C++",
    "c#": "C#",
    "csharp": "C#",
    "c": "C",
    "javascript": "JavaScript",
    "js": "JavaScript",
    "typescript": "TypeScript",
    "ts": "TypeScript",
    "golang": "Go",
    "go": "Go",
    "rust": "Rust",
    "sql": "SQL",
    "html": "HTML",
    "html5": "HTML",
    "css": "CSS",
    "css3": "CSS",
    "bash": "Bash",
    "shell": "Shell",

    # AI / ML
    "machine learning": "Machine Learning",
    "ml": "Machine Learning",
    "deep learning": "Deep Learning",
    "dl": "Deep Learning",
    "artificial intelligence": "Artificial Intelligence",
    "ai": "Artificial Intelligence",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "keras": "Keras",
    "scikit-learn": "Scikit-learn",
    "scikit learn": "Scikit-learn",
    "sklearn": "Scikit-learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "scipy": "SciPy",
    "opencv": "OpenCV",
    "nlp": "Natural Language Processing",
    "natural language processing": "Natural Language Processing",
    "computer vision": "Computer Vision",
    "cv": "Computer Vision",
    "hugging face": "Hugging Face",
    "huggingface": "Hugging Face",
    "transformers": "Transformers",
    "llm": "LLMs",
    "llms": "LLMs",
    "large language models": "LLMs",
    "generative ai": "Generative AI",
    "genai": "Generative AI",
    "rag": "RAG",
    "langchain": "LangChain",
    "matplotlib": "Matplotlib",
    "seaborn": "Seaborn",
    "data analysis": "Data Analysis",
    "data visualization": "Data Visualization",

    # Web & Frameworks
    "fastapi": "FastAPI",
    "flask": "Flask",
    "django": "Django",
    "react": "React",
    "react.js": "React",
    "reactjs": "React",
    "next.js": "Next.js",
    "nextjs": "Next.js",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "node": "Node.js",
    "express": "Express",
    "express.js": "Express",
    "expressjs": "Express",
    "vue": "Vue.js",
    "vue.js": "Vue.js",
    "vuejs": "Vue.js",
    "angular": "Angular",
    "spring boot": "Spring Boot",
    "springboot": "Spring Boot",
    ".net": ".NET",
    "dotnet": ".NET",
    "tailwind": "Tailwind CSS",
    "tailwind css": "Tailwind CSS",
    "tailwindcss": "Tailwind CSS",
    "rest api": "REST API",
    "rest apis": "REST API",
    "restful": "REST API",
    "restful api": "REST API",
    "graphql": "GraphQL",

    # Databases
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "mongo": "MongoDB",
    "redis": "Redis",
    "sqlite": "SQLite",
    "sqlite3": "SQLite",
    "elasticsearch": "Elasticsearch",
    "firebase": "Firebase",
    "supabase": "Supabase",

    # Cloud & Tools
    "git": "Git",
    "github": "GitHub",
    "gitlab": "GitLab",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "aws": "AWS",
    "amazon web services": "AWS",
    "azure": "Azure",
    "gcp": "Google Cloud",
    "google cloud": "Google Cloud",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "linux": "Linux",
    "postman": "Postman",
    "vite": "Vite",

    # CS Fundamentals
    "data structures": "Data Structures",
    "dsa": "Data Structures",
    "algorithms": "Algorithms",
    "object-oriented programming": "Object-Oriented Programming",
    "oop": "Object-Oriented Programming",
    "oops": "Object-Oriented Programming",
    "system design": "System Design",
    "operating systems": "Operating Systems",
    "os": "Operating Systems",
    "dbms": "DBMS",
    "computer networks": "Computer Networks",
    "cn": "Computer Networks"
}


def get_all_canonical_skills() -> Set[str]:
    """Return all unique canonical skill names."""
    skills = set()
    for cat_skills in SKILL_TAXONOMY.values():
        skills.update(cat_skills)
    return skills
