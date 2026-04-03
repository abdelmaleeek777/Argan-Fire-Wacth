import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header
        style={{
          position: isLanding ? 'absolute' : 'relative',
          top: 0,
          left: 0,
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 2rem',
          backgroundColor: isLanding ? 'transparent' : '#1a4d2e',
          color: 'white',
          zIndex: 10,
          boxShadow: isLanding ? 'none' : '0 4px 12px rgba(0,0,0,0.1)',
          transition: 'background-color 0.3s',
          boxSizing: 'border-box',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 600 }}>
          🌳 Argan-Fire Watch
        </h1>
        <nav>
          <Link
            to="/"
            style={{
              color: 'white',
              marginLeft: '2rem',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '1.1rem',
              transition: 'opacity 0.2s',
              opacity: 0.9,
            }}
            onMouseEnter={(e) => (e.target.style.opacity = 1)}
            onMouseLeave={(e) => (e.target.style.opacity = 0.9)}
          >
            Accueil
          </Link>
          <Link
            to="/login"
            style={{
              color: 'white',
              marginLeft: '2rem',
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: '1.1rem',
              transition: 'opacity 0.2s',
              opacity: 0.9,
            }}
            onMouseEnter={(e) => (e.target.style.opacity = 1)}
            onMouseLeave={(e) => (e.target.style.opacity = 0.9)}
          >
            Connexion
          </Link>
        </nav>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer
        style={{
          backgroundColor: '#f4f7f2',
          padding: '1.5rem',
          textAlign: 'center',
          color: '#2d5a3a',
          borderTop: '1px solid #cde0d0',
          fontSize: '0.95rem',
        }}
      >
        <p style={{ margin: 0 }}>
          © 2025 Argan-Fire Watch — Protection des coopératives d’arganiers
        </p>
      </footer>
    </div>
  );
};

export default Layout;