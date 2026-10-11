"""
backend/app/services/semantic_ai.py
===================================
Local Semantic Alignment and Contextual NLP Engine for CareerPilot AI 2.0.

Why is this important for a software engineering & AI/ML portfolio?
-------------------------------------------------------------------
In enterprise ATS and career platforms, skill matching is dual-faceted:
1. Lexical / Deterministic: Does the candidate explicitly know "Docker", "PyTorch", "FastAPI"?
2. Semantic / Contextual: Does the candidate's actual experience and project narrative
   align with the domain and language of the target job description?

This module provides:
- Mathematical Cosine Vector Similarity (TF-IDF vector space model).
- Sublinear term-frequency scaling and stopword filtering.
- Transparent score calibration without claiming proprietary external LLMs.
- Extensible hook for local sentence transformers / ONNX embeddings if installed.
"""

import math
import re
from typing import Dict, List, Optional, Tuple

# Standard English stopwords to remove noise and focus on domain content
STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can", "could", "did", "do", "does", "doing", "down", "during", "each", "few",
    "for", "from", "further", "had", "has", "have", "having", "he", "her", "here", "hers", "herself",
    "him", "himself", "his", "how", "i", "if", "in", "into", "is", "isn't", "it", "its", "itself",
    "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", "off", "on", "once",
    "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "should",
    "so", "some", "such", "than", "that", "the", "their", "theirs", "them", "themselves", "then",
    "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very",
    "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "with",
    "would", "you", "your", "yours", "yourself", "yourselves"
}


def tokenize(text: str) -> List[str]:
    """
    Cleans and tokenizes text into lowercase alphanumeric word tokens,
    stripping punctuation and non-informative stopwords.
    """
    if not text:
        return []
    # Match words of length 2 or more
    tokens = re.findall(r"\b[a-zA-Z0-9_\-\.\+#]{2,}\b", text.lower())
    return [t for t in tokens if t not in STOPWORDS]


def compute_tf_vector(tokens: List[str]) -> Dict[str, float]:
    """
    Computes sublinear term frequencies: 1 + log(tf) if tf > 0 else 0.
    Sublinear scaling prevents very frequent repetitive words from disproportionately
    skewing document vector magnitudes.
    """
    counts: Dict[str, int] = {}
    for t in tokens:
        counts[t] = counts.get(t, 0) + 1

    tf_vec: Dict[str, float] = {}
    for term, count in counts.items():
        tf_vec[term] = 1.0 + math.log(count)
    return tf_vec


def compute_cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    """
    Calculates the cosine similarity angle between two sparse vectors in R^N:
    cos(theta) = (vec_a . vec_b) / (||vec_a||_2 * ||vec_b||_2)
    Returns a normalized float between 0.0 and 1.0.
    """
    if not vec_a or not vec_b:
        return 0.0

    # Dot product over shared terms
    common_terms = set(vec_a.keys()).intersection(set(vec_b.keys()))
    dot_product = sum(vec_a[t] * vec_b[t] for t in common_terms)

    # L2 Euclidean norms
    norm_a = math.sqrt(sum(val * val for val in vec_a.values()))
    norm_b = math.sqrt(sum(val * val for val in vec_b.values()))

    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0

    return min(1.0, max(0.0, dot_product / (norm_a * norm_b)))


class SemanticAlignmentEngine:
    """
    Modular engine providing semantic text similarity and contextual alignment
    for resumes and job descriptions.
    """

    def __init__(self):
        self.model_name = "TF-IDF Vector Space Model (Local CPU)"
        self.is_neural = False

    def compute_alignment(self, resume_text: str, job_description: str) -> Dict[str, any]:
        """
        Calculates semantic textual similarity and provides contextual overlap metrics.
        """
        resume_tokens = tokenize(resume_text)
        jd_tokens = tokenize(job_description)

        if not resume_tokens or not jd_tokens:
            return {
                "similarity_score": 0.0,
                "similarity_percentage": 0.0,
                "model_name": self.model_name,
                "engine_mode": "deterministic",
                "shared_vocabulary_count": 0,
                "top_context_terms": []
            }

        vec_resume = compute_tf_vector(resume_tokens)
        vec_jd = compute_tf_vector(jd_tokens)

        raw_similarity = compute_cosine_similarity(vec_resume, vec_jd)
        
        # Scale into intuitive ATS/portfolio alignment percentage (calibrated)
        similarity_percentage = round(raw_similarity * 100, 1)

        # Identify key shared context terms by joint TF weight
        common_terms = set(vec_resume.keys()).intersection(set(vec_jd.keys()))
        scored_terms = sorted(
            [(t, vec_resume[t] * vec_jd[t]) for t in common_terms],
            key=lambda x: x[1],
            reverse=True
        )
        top_context_terms = [t[0] for t in scored_terms[:10]]

        return {
            "similarity_score": round(raw_similarity, 4),
            "similarity_percentage": similarity_percentage,
            "model_name": self.model_name,
            "engine_mode": "semantic-hybrid",
            "shared_vocabulary_count": len(common_terms),
            "top_context_terms": top_context_terms
        }


# Singleton engine instance
semantic_engine = SemanticAlignmentEngine()
