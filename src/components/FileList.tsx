import { useState, useEffect } from 'react';
import { filesService } from '../services/files';
import type { File } from '../types';
import type { ApiError } from '../services/api';

interface FileListProps {
  refresh: number;
}

export function FileList({ refresh }: FileListProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await filesService.list();
      setFiles(data);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [refresh]);

  const handleDownload = async (file: File) => {
    try {
      const blob = await filesService.download(file.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const apiError = err as ApiError;
      alert(`Download failed: ${apiError.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    setDeletingId(id);
    try {
      await filesService.delete(id);
      await loadFiles();
    } catch (err) {
      const apiError = err as ApiError;
      alert(`Delete failed: ${apiError.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status: File['status']) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'processing': return '#ffc107';
      case 'failed':
      case 'error': return '#dc3545';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return <div style={styles.message}>Loading files...</div>;
  }

  if (error) {
    return <div style={{ ...styles.message, color: '#c33' }}>{error}</div>;
  }

  if (files.length === 0) {
    return <div style={styles.message}>No files uploaded yet. Upload a file to get started!</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Your Files</h2>
      <div style={styles.grid}>
        {files.map((file) => (
          <div key={file.id} style={styles.card}>
            <div style={styles.cardHeader}>
              <div>
                <h3 style={styles.filename}>{file.originalName}</h3>
                <div style={styles.meta}>
                  <span style={{ ...styles.badge, background: getStatusColor(file.status) }}>
                    {file.status}
                  </span>
                  <span style={styles.metaText}>{formatBytes(file.size)}</span>
                  <span style={styles.metaText}>{file.chunkCount} chunks</span>
                </div>
                {(file.status === 'failed' || file.status === 'error') && file.errorMessage && (
                  <div style={styles.errorMessage}>
                    {file.errorMessage}
                  </div>
                )}
              </div>
            </div>
            
            <p style={styles.date}>{formatDate(file.uploadedAt)}</p>
            
            <div style={styles.actions}>
              <button
                onClick={() => handleDownload(file)}
                style={styles.button}
              >
                Download
              </button>
              <button
                onClick={() => handleDelete(file.id)}
                disabled={deletingId === file.id}
                style={{ ...styles.button, ...styles.deleteButton }}
              >
                {deletingId === file.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: '32px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#333',
  },
  message: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#666',
    fontSize: '16px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '16px',
    transition: 'box-shadow 0.2s',
  },
  cardHeader: {
    marginBottom: '12px',
  },
  filename: {
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    color: '#333',
    wordBreak: 'break-word' as const,
  },
  meta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize' as const,
  },
  metaText: {
    fontSize: '13px',
    color: '#666',
  },
  date: {
    fontSize: '13px',
    color: '#999',
    margin: '0 0 12px 0',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  button: {
    flex: 1,
    padding: '10px',
    border: '1px solid #667eea',
    background: 'white',
    color: '#667eea',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deleteButton: {
    borderColor: '#dc3545',
    color: '#dc3545',
  },
  errorMessage: {
    marginTop: '8px',
    padding: '8px',
    background: '#fee',
    color: '#c33',
    fontSize: '12px',
    borderRadius: '4px',
    wordBreak: 'break-word' as const,
  },
};
