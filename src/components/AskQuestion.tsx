import { useState, useEffect } from 'react';
import { askService } from '../services/ask';
import type { Ask } from '../types';
import type { ApiError } from '../services/api';

export function AskQuestion() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Ask[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await askService.history();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const result = await askService.ask({ question: question.trim() });
      setHistory([result, ...history]);
      setQuestion('');
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Ask a Question</h2>
      
      {error && <div style={styles.error}>{error}</div>}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your uploaded documents..."
          style={styles.textarea}
          rows={3}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !question.trim()} style={styles.button}>
          {loading ? 'Getting Answer...' : 'Ask Question'}
        </button>
      </form>

      <div style={styles.history}>
        <h3 style={styles.historyTitle}>Question History</h3>
        
        {loadingHistory ? (
          <div style={styles.message}>Loading history...</div>
        ) : history.length === 0 ? (
          <div style={styles.message}>No questions asked yet. Ask your first question above!</div>
        ) : (
          <div style={styles.historyList}>
            {history.map((item) => (
              <div key={item.id} style={styles.historyItem}>
                <div style={styles.questionSection}>
                  <strong style={styles.label}>Q:</strong>
                  <p style={styles.questionText}>{item.question}</p>
                </div>
                
                <div style={styles.answerSection}>
                  <strong style={styles.label}>A:</strong>
                  <p style={styles.answerText}>{item.answer}</p>
                </div>
                
                {item.sources && item.sources.length > 0 && (
                  <div style={styles.sourcesSection}>
                    <strong style={styles.label}>Sources:</strong>
                    <div style={styles.sources}>
                      {item.sources.map((source, idx) => (
                        <div key={idx} style={styles.source}>
                          <div style={styles.sourceHeader}>
                            <span style={styles.sourceName}>{source.filename}</span>
                            <span style={styles.similarity}>
                              {(() => {
                                const similarity = source.similarity;
                                if (typeof similarity !== 'number' || isNaN(similarity)) {
                                  return '—';
                                }
                                const percentage = Math.round(similarity * 100);
                                const clamped = Math.max(0, Math.min(100, percentage));
                                return `${clamped}% match`;
                              })()}
                            </span>
                          </div>
                          <p style={styles.sourceText}>{source.chunkText}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p style={styles.timestamp}>
                  {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
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
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    marginBottom: '32px',
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '16px',
    fontFamily: 'inherit',
    resize: 'vertical' as const,
    outline: 'none',
  },
  button: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  history: {
    marginTop: '40px',
  },
  historyTitle: {
    fontSize: '18px',
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
  historyList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  historyItem: {
    background: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    padding: '20px',
  },
  questionSection: {
    marginBottom: '16px',
  },
  answerSection: {
    marginBottom: '16px',
  },
  sourcesSection: {
    marginBottom: '12px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#667eea',
    display: 'block',
    marginBottom: '8px',
  },
  questionText: {
    fontSize: '16px',
    color: '#333',
    margin: 0,
    lineHeight: '1.5',
  },
  answerText: {
    fontSize: '16px',
    color: '#444',
    margin: 0,
    lineHeight: '1.6',
  },
  sources: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  source: {
    background: '#f8f9fa',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
  },
  sourceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sourceName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#495057',
  },
  similarity: {
    fontSize: '12px',
    color: '#6c757d',
    background: '#e9ecef',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  sourceText: {
    fontSize: '14px',
    color: '#6c757d',
    margin: 0,
    lineHeight: '1.5',
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: '13px',
    color: '#999',
    margin: '12px 0 0 0',
    textAlign: 'right' as const,
  },
};
