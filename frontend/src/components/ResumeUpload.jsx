import React, { useRef, useState } from 'react';

export default function ResumeUpload({ file, onFileSelect, onFileRemove, onError }) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    // Check extension and MIME type
    const isPdf =
      selectedFile.name.toLowerCase().endsWith('.pdf') ||
      selectedFile.type === 'application/pdf';

    if (!isPdf) {
      onError('Invalid file format. Please upload a genuine PDF resume (.pdf).');
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      onError(`File exceeds the 5MB size limit (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB).`);
      return;
    }

    if (selectedFile.size === 0) {
      onError('The selected file is empty (0 bytes).');
      return;
    }

    onFileSelect(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">
          <span className="card-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </span>
          Resume Document (PDF)
        </div>
      </div>

      {!file ? (
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,application/pdf"
            style={{ display: 'none' }}
          />

          <svg className="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>

          <div className="upload-title">Drop your resume PDF here, or click to browse</div>
          <div className="upload-hint">Supported format: PDF only • Max size: 5MB • Processed strictly in-memory</div>
        </div>
      ) : (
        <div className="file-selected-box">
          <div className="file-info">
            <span className="file-badge-pdf">PDF</span>
            <div>
              <div className="file-name" title={file.name}>{file.name}</div>
              <div className="file-size">{formatFileSize(file.size)}</div>
            </div>
          </div>
          <button
            type="button"
            className="btn-remove"
            onClick={onFileRemove}
            title="Remove selected PDF"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
