/**
 * frontend/src/services/api.js
 * =============================
 * API client layer for communicating with the FastAPI backend.
 *
 * Notice:
 * Using relative paths ('/api/...') leverages Vite's proxy configured in vite.config.js,
 * falling back to direct http://localhost:8000 when needed.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Checks backend health and availability.
 * @returns {Promise<{status: string, service: string, version: string}>}
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    });
    if (!response.ok) {
      throw new Error(`Health check returned status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn('Backend currently unreachable:', error);
    return null;
  }
}

/**
 * Sends the PDF file and Job Description to the backend for analysis.
 *
 * @param {File} file - Selected PDF resume file
 * @param {string} jobDescription - Raw text of the target job description
 * @returns {Promise<object>} AnalysisResponse from FastAPI
 */
export async function analyzeResume(file, jobDescription) {
  // 1. Client-side sanity checks
  if (!file) {
    throw new Error('Please select a PDF resume file to upload.');
  }

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Invalid file type: Only PDF documents (.pdf) are supported.');
  }

  const MAX_BYTES = 5 * 1024 * 1024; // 5MB
  if (file.size > MAX_BYTES) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the 5MB limit.`);
  }

  if (!jobDescription || !jobDescription.trim()) {
    throw new Error('Please enter or paste the target job description.');
  }

  // 2. Build multipart/form-data payload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('job_description', jobDescription.trim());

  // 3. Send HTTP POST request
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  // 4. Handle non-200 HTTP responses
  if (!response.ok) {
    let errorDetail = `Server responded with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // Fallback if response isn't JSON
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}
