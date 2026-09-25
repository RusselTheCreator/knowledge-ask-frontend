import { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { FileUpload } from './components/FileUpload';
import { FileList } from './components/FileList';
import { AskQuestion } from './components/AskQuestion';
import { authService } from './services/auth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(authService.getUser());
  const [refreshFiles, setRefreshFiles] = useState(0);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setUser(authService.getUser());
  };

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleUploadSuccess = () => {
    setRefreshFiles(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return <Auth onSuccess={handleAuthSuccess} />;
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.logo}>Knowledge Ask</h1>
          <div style={styles.userSection}>
            <span style={styles.userName}>{user?.name}</span>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        <div style={styles.container}>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Upload Document</h2>
            <FileUpload onSuccess={handleUploadSuccess} />
          </section>

          <section style={styles.section}>
            <FileList refresh={refreshFiles} />
          </section>

          <section style={styles.section}>
            <AskQuestion />
          </section>
        </div>
      </main>

      <footer style={styles.footer}>
        <div style={styles.container}>
          <p style={styles.footerText}>
            Knowledge Ask - Powered by RAG (Retrieval-Augmented Generation)
          </p>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#f5f7fa',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userName: {
    fontSize: '16px',
    fontWeight: '500',
  },
  logoutButton: {
    background: 'rgba(255,255,255,0.2)',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  main: {
    flex: 1,
    padding: '40px 24px',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
  },
  section: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#333',
  },
  footer: {
    background: 'white',
    borderTop: '1px solid #e0e0e0',
    padding: '20px 24px',
  },
  footerText: {
    margin: 0,
    textAlign: 'center' as const,
    color: '#666',
    fontSize: '14px',
  },
};

export default App;
