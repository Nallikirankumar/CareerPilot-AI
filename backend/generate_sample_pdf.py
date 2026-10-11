"""
Script to generate a clean, realistic sample resume PDF for testing CareerPilot AI.
"""

import os
import pymupdf

def generate_sample_resume():
    os.makedirs("samples", exist_ok=True)
    pdf_path = os.path.join("samples", "sample_resume.pdf")

    doc = pymupdf.open()
    page = doc.new_page(width=612, height=792)  # Standard US Letter

    text = """ALEX SHARMA
B.Tech in Computer Science and Engineering (AI & ML Specialization)
Email: alex.sharma@example.com | GitHub: github.com/alexsharma | LinkedIn: linkedin.com/in/alexsharma

SUMMARY
Enthusiastic final-year CSE student with strong foundations in Python development, FastAPI, 
modern frontend engineering with React, and applied Machine Learning. Passionate about building 
scalable full-stack web applications and AI-driven platforms.

TECHNICAL SKILLS
• Programming Languages: Python, JavaScript, SQL, C++
• Web & Backend: FastAPI, React, REST API, HTML, CSS
• AI & Machine Learning: Machine Learning, Scikit-learn, Pandas, NumPy, Deep Learning
• Databases & Storage: PostgreSQL, SQLite
• DevOps & Tools: Docker, Git, GitHub, Linux, Postman
• Core Computer Science: Data Structures, Algorithms, Object-Oriented Programming, DBMS

PROJECTS
CareerPilot AI — Resume Analyzer & Career Preparation Platform
• Developed an in-memory PDF parsing pipeline using PyMuPDF and FastAPI.
• Engineered a rule-based skill comparison engine with transparent scoring and zero file execution.
• Built an interactive responsive dashboard with React and Vite.

Predictive Churn Classifier
• Built supervised Machine Learning models using Scikit-learn and Pandas.
• Performed data preprocessing, feature engineering, and cross-validation to optimize accuracy.

EDUCATION
Bachelor of Technology in Computer Science and Engineering (AI & ML)
CGPA: 8.9 / 10.0 (Graduating 2026)
"""

    # Insert text cleanly on the page
    rect = fitz.Rect(54, 54, 558, 738)
    page.insert_textbox(rect, text, fontsize=11, fontname="helv", align=0)

    doc.save(pdf_path)
    doc.close()
    print(f"Sample resume created successfully at: {pdf_path}")

if __name__ == "__main__":
    generate_sample_resume()
