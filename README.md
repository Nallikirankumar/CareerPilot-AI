# CareerPilot AI 🚀
**AI-Powered Resume Analyzer & Career Preparation Platform**  
*Phase 1: Deterministic In-Memory PDF Parser & Transparent Rule-Based Skill Matcher*

---

## 📌 Project Overview
**CareerPilot AI** bridges the gap between student resumes and modern tech job descriptions. Built specifically for engineering students and aspiring developers, it analyzes candidate resumes against target job postings, extracts technical competencies, highlights missing skill gaps, and computes an explainable match score.

### 🛡️ Phase 1 Architecture Principles
1. **Zero Execution of Uploaded Files**: Uploaded PDFs are parsed strictly as passive byte streams. No executable scripts, macros, or system calls are executed.
2. **In-Memory Privacy**: Resumes are read into RAM (`io.BytesIO`) and immediately discarded after analysis. No files are stored permanently on disk or in a database in Phase 1.
3. **Double Boundary Validation**:
   - **Client-Side**: Rejects non-PDF files and files exceeding 5MB before network transfer.
   - **Server-Side**: Inspects PDF magic bytes (`%PDF-`), enforces the 5MB size limit, and catches corrupted or encrypted documents safely.
4. **Transparent, Deterministic Matching**: Avoids deceptive "black box" claims. Skill matching uses an honest, explainable token & canonical taxonomy matching algorithm:
   $$\text{Match Percentage} = \left(\frac{\text{Matching Skills}}{\text{Total Job Description Skills}}\right) \times 100$$

---

## 🏗️ Project Structure & File Guide

```
CareerPilot AI/
├── backend/
│   ├── app/
│   │   ├── __init__.py                  # Root backend package marker
│   │   ├── main.py                      # FastAPI app, CORS setup & /api/analyze endpoint
│   │   ├── schemas/
│   │   │   ├── __init__.py              # Schema package marker
│   │   │   └── analysis.py              # Pydantic data models for request/response contracts
│   │   └── services/
│   │       ├── __init__.py              # Services package marker
│   │       ├── pdf_parser.py            # PyMuPDF in-memory text extractor & security guards
│   │       ├── skill_taxonomy.py        # Curated technical taxonomy & alias normalization
│   │       └── matcher.py               # Deterministic rule-based matching engine
│   ├── tests/
│   │   ├── __init__.py                  # Test suite marker
│   │   ├── test_api.py                  # Integration tests for FastAPI endpoints
│   │   ├── test_matcher.py              # Unit tests for keyword extraction & scoring
│   │   └── test_pdf_parser.py           # Unit tests for PyMuPDF extraction & boundary conditions
│   ├── samples/
│   │   └── sample_resume.pdf            # Sample test resume PDF for instant local testing
│   ├── generate_sample_pdf.py           # Helper script to generate synthetic test resumes
│   ├── verify_sample.py                 # End-to-end verification script
│   └── requirements.txt                 # Backend Python dependencies
├── frontend/
│   ├── index.html                       # Entry HTML with modern typography & meta tags
│   ├── vite.config.js                   # Vite configuration with proxy to port 8000
│   ├── package.json                     # Frontend scripts and dependencies
│   └── src/
│       ├── main.jsx                     # React root mount
│       ├── App.jsx                      # Main dashboard orchestration and state management
│       ├── index.css                    # Modern dark glassmorphic design system
│       ├── components/
│       │   ├── Navbar.jsx               # Header bar with real-time API connection badge
│       │   ├── ResumeUpload.jsx         # Drag-and-drop PDF uploader with size guards
│       │   ├── JobDescriptionInput.jsx  # JD textarea with sample presets & char counter
│       │   ├── MatchResults.jsx         # Match percentage gauge, skill tags & text inspector
│       │   └── ErrorAlert.jsx           # User-friendly warning banners
│       └── services/
│           └── api.js                   # Fetch API wrapper for backend endpoints
├── .gitignore                           # Comprehensive exclusion of venv, node_modules, secrets
└── README.md                            # Complete setup & beginner-friendly documentation
```

---

## 📖 Beginner-Friendly File Explanations

| File | Purpose (In Simple Terms) |
| :--- | :--- |
| `backend/app/main.py` | The "receptionist" of your backend. Sets up the FastAPI web server, configures CORS so React can talk to it, and defines the `/api/analyze` and `/api/health` routes. |
| `backend/app/schemas/analysis.py` | Defines the exact "blueprint" for data entering and leaving the API using Pydantic. Guarantees type safety and generates Swagger UI docs at `/docs`. |
| `backend/app/services/pdf_parser.py` | The "document reader". Uses PyMuPDF to extract text from PDF bytes in RAM without saving them to your hard drive. Blocks fake PDFs and large files. |
| `backend/app/services/skill_taxonomy.py` | The "dictionary of skills". Normalizes variations (e.g. mapping `react.js`, `reactjs`, and `React` to canonical `React`). |
| `backend/app/services/matcher.py` | The "comparison engine". Extracts detected skills, performs set operations (intersection for matches, difference for missing), and computes the match score. |
| `frontend/src/App.jsx` | The "brain" of the frontend. Holds React state for the uploaded file, job description, loading spinner, error banners, and analysis results. |
| `frontend/src/index.css` | The "styling system". Custom CSS variables, smooth gradients, responsive flex/grid layouts, and glassmorphic card containers. |
| `frontend/src/services/api.js` | The "messenger". Sends `multipart/form-data` requests from React to FastAPI and extracts user-friendly error messages if anything fails. |

---

## ⚡ Quickstart: Running on Windows PowerShell

### 1. Backend Setup & Startup
Open your first **Windows PowerShell** terminal:

```powershell
# Navigate to the project root
cd "C:\CareerPilot AI"

# Activate the virtual environment
.\backend\venv\Scripts\Activate.ps1

# Run the FastAPI server with live-reload
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --app-dir backend
```
> The API will be live at: **`http://127.0.0.1:8000`**  
> Interactive Swagger API docs: **`http://127.0.0.1:8000/docs`**

---

### 2. Running Automated Backend Tests
In PowerShell (with virtual environment activated):

```powershell
cd "C:\CareerPilot AI"
.\backend\venv\Scripts\python -m pytest backend/tests/ -v
```
> Runs all 14 unit and integration tests covering PDF parsing, security bounds, regex matching, and API endpoints.

---

### 3. Frontend Setup & Startup
Open a **second Windows PowerShell** terminal:

```powershell
# Navigate to the frontend directory
cd "C:\CareerPilot AI\frontend"

# Start the Vite development server
npm run dev
```
> Open your browser and navigate to: **`http://localhost:5173`**

---

## 🧪 Testing with the Built-In Sample Resume
A pre-generated sample resume is available at:
`backend\samples\sample_resume.pdf`

1. Open `http://localhost:5173` in your browser.
2. In the **Resume Document** section, upload or drop `backend\samples\sample_resume.pdf`.
3. Click any **Quick Preset** button (e.g. `+ Full-Stack Developer` or `+ AI / ML Engineer`).
4. Click **Analyze Resume Alignment**.
5. Observe the match score, matching skills (green), missing skills (rose), and click the **PyMuPDF Extracted Text Inspector** to view the raw extracted text!
