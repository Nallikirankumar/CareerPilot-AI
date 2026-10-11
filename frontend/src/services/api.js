/**
 * frontend/src/services/api.js
 * =============================
 * Unified API client layer for CareerPilot AI 2.0.
 * Handles authentication, resume analysis, persistent records, and application pipeline.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function getAuthToken() {
  return localStorage.getItem('careerpilot_jwt_token');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('careerpilot_jwt_token', token);
  } else {
    localStorage.removeItem('careerpilot_jwt_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('careerpilot_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('careerpilot_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('careerpilot_user');
  }
}

export function clearAuth() {
  localStorage.removeItem('careerpilot_jwt_token');
  localStorage.removeItem('careerpilot_user');
}

export function getAuthHeaders() {
  const token = getAuthToken();
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Checks backend health and readiness.
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
 * Registers a new user account.
 */
export async function registerUser({ email, password, fullName, targetRole }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      full_name: fullName || null,
      target_role: targetRole || 'Software Engineer'
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Registration failed (${response.status})`);
  }

  const data = await response.json();
  setAuthToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

/**
 * Logs in an existing user.
 */
export async function loginUser({ email, password }) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Incorrect email or password.');
  }

  const data = await response.json();
  setAuthToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

/**
 * Retrieves the profile of the current authenticated user.
 */
export async function getUserProfile() {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return null;

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: 'GET',
    headers
  });

  if (!response.ok) {
    clearAuth();
    return null;
  }

  const user = await response.json();
  setStoredUser(user);
  return user;
}

/**
 * Sends the PDF file and Job Description to the backend for analysis.
 * Automatically attaches Authorization header if user is logged in.
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

  // 3. Attach auth headers if logged in
  const headers = getAuthHeaders();

  // 4. Send HTTP POST request
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers,
    body: formData,
  });

  // 5. Handle non-200 HTTP responses
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

/**
 * Retrieves saved analyses from the database for the current user.
 */
export async function getSavedAnalyses() {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return [];

  const response = await fetch(`${API_BASE_URL}/api/analyses`, {
    method: 'GET',
    headers
  });

  if (!response.ok) return [];
  return await response.json();
}

/**
 * Retrieves job applications from the database for the authenticated user.
 */
export async function getApplications() {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return null;

  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    method: 'GET',
    headers
  });

  if (!response.ok) return null;
  return await response.json();
}

/**
 * Creates a new job application in the database for the authenticated user.
 */
export async function createApplication(appData) {
  const headers = {
    ...getAuthHeaders(),
    'Content-Type': 'application/json'
  };

  const response = await fetch(`${API_BASE_URL}/api/applications`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      company: appData.company,
      role: appData.role,
      status: appData.status || 'Applied',
      applied_date: appData.appliedDate || null,
      follow_up_date: appData.followUpDate || null,
      notes: appData.notes || null
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to create application.');
  }

  return await response.json();
}

/**
 * Updates an existing job application in the database.
 */
export async function updateApplication(id, appData) {
  const headers = {
    ...getAuthHeaders(),
    'Content-Type': 'application/json'
  };

  const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({
      company: appData.company,
      role: appData.role,
      status: appData.status,
      applied_date: appData.appliedDate,
      follow_up_date: appData.followUpDate,
      notes: appData.notes
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update application.');
  }

  return await response.json();
}

/**
 * Deletes a job application from the database.
 */
export async function deleteApplication(id) {
  const headers = getAuthHeaders();

  const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete application.');
  }

  return true;
}

