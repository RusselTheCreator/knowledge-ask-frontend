import { useState, useRef } from 'react';
import { filesService } from '../services/files';

interface FileUploadProps {
  onSuccess: () => void;
}

export function FileUpload({ onSuccess }: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList) => {
    setError(null);
    setLoading(true);
    const fileArray = Array.from(files);
    const totalFiles = fileArray.length;
    const errors: string[] = [];
    let successCount = 0;
    
    // Process files sequentially with per-file error handling
    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      setUploadProgress(`Uploading ${i + 1} of ${totalFiles}: ${file.name}`);
      
      try {
        await filesService.upload(file);
        successCount++;
      } catch (err) {
        // Extract the actual error message from API response
        let errorMessage = 'Upload failed';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null) {
          const apiErr = err as any;
          errorMessage = apiErr.message || apiErr.error || 'Upload failed';
        }
        // Show filename and actual API error message
        const errorMsg = `${file.name}: ${errorMessage}`;
        errors.push(errorMsg);
      }
    }
    
    setLoading(false);
    setUploadProgress('');
    
    // Display errors if any, but still call onSuccess if at least one succeeded
    if (errors.length > 0) {
      setError(errors.join('\n'));
    }
    
    if (successCount > 0) {
      onSuccess();
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div style={styles.container}>
      {error && <div style={styles.error}>{error}</div>}
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleChange}
        disabled={loading}
        style={styles.fileInput}
        accept=".pdf,.txt,.md,.docx,.csv,.xlsx,.png,.jpg,.jpeg"
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
          <>
            <p style={styles.text}>Uploading...</p>
            {uploadProgress && <p style={styles.subtext}>{uploadProgress}</p>}
          </>
        ) : (
          <>
            <p style={styles.text}>
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p style={styles.subtext}>
              PDF, TXT, MD, DOCX, CSV, XLSX (max 10MB per file)
            </p>
            <p style={{ ...styles.subtext, fontSize: '12px', marginTop: '4px' }}>
              Multiple files supported • Images (PNG, JPG) not yet supported for processing
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
    whiteSpace: 'pre-wrap' as const,
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
