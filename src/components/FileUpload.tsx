import { useState, useRef } from 'react';
import { filesService } from '../services/files';
import type { ApiError } from '../services/api';

interface FileUploadProps {
  onSuccess: () => void;
}

export function FileUpload({ onSuccess }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);

    try {
      await filesService.upload(file);
      onSuccess();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}
      
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleChange}
        disabled={loading}
        style={styles.fileInput}
        accept=".pdf,.txt,.md,.docx,.csv"
      />
      
      <div
        style={{
          ...styles.dropzone,
          ...(dragActive ? styles.dropzoneActive : {}),
          ...(loading ? styles.dropzoneLoading : {}),
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !loading && fileInputRef.current?.click()}
      >
        <svg style={styles.icon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        {loading ? (
          <p style={styles.text}>Uploading...</p>
        ) : (
          <>
            <p style={styles.text}>
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p style={styles.subtext}>
              PDF, TXT, MD, DOCX, or CSV (max 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginBottom: '24px',
  },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  dropzone: {
    border: '2px dashed #ddd',
    borderRadius: '8px',
    padding: '40px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: '#fafafa',
  },
  dropzoneActive: {
    borderColor: '#667eea',
    background: '#f0f4ff',
  },
  dropzoneLoading: {
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  fileInput: {
    display: 'none',
  },
  icon: {
    width: '48px',
    height: '48px',
    margin: '0 auto 16px',
    color: '#667eea',
  },
  text: {
    fontSize: '16px',
    color: '#333',
    margin: '0 0 8px 0',
  },
  subtext: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
  },
};
