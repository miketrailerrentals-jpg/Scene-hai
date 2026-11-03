import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon, GoogleLogo } from '../../icons';
import firebaseConfig from '../../../firebase-applet-config.json';

export const AuthModal: React.FC = () => {
  const { authModal, closeAuthPrompt, loginWithGoogle } = useApp();
  const [copied, setCopied] = useState(false);

  if (!authModal.open) return null;

  const currentDomain =
    authModal.unauthorizedDomain || (typeof window !== 'undefined' ? window.location.hostname : '');
  const consoleSettingsUrl = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`;

  const copyDomain = () => {
    if (navigator.clipboard && currentDomain) {
      navigator.clipboard.writeText(currentDomain);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className="auth-modal-backdrop"
      onClick={closeAuthPrompt}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="auth-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <button
          type="button"
          className="auth-modal-close"
          onClick={closeAuthPrompt}
          aria-label="Close dialog"
        >
          <Icon name="close" size={18} />
        </button>
        <div className="auth-modal-brand">
          <div className="brand-symbol">
            s<span>✳</span>
          </div>
          <strong style={{ font: '850 16px var(--display)' }}>Scene Hai?</strong>
        </div>
        <h2 id="auth-modal-title" className="auth-modal-title">
          Sign in to continue
        </h2>
        <p className="auth-modal-desc">
          {authModal.reason ||
            'Sign in with your Google account to create scenes, join meetups, and connect with people.'}
        </p>

        <button
          type="button"
          className="google-auth-btn primary"
          onClick={() => loginWithGoogle()}
          disabled={authModal.loading}
        >
          {authModal.loading ? (
            <span>Connecting to Google...</span>
          ) : (
            <>
              <GoogleLogo />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {authModal.unauthorizedDomain ? (
          <div
            className="unauthorized-domain-card"
            style={{
              marginTop: 16,
              padding: '14px 16px',
              background: '#fffbe6',
              border: '1.5px solid #ffe58f',
              borderRadius: 14,
              textAlign: 'left',
              fontSize: 12,
              color: '#614700',
              lineHeight: 1.5
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 800,
                color: '#d46b08',
                marginBottom: 6
              }}
            >
              <Icon name="info" size={16} />
              <span>Domain Authorization Required</span>
            </div>
            <p style={{ margin: '0 0 8px 0', fontSize: 12 }}>
              Firebase Authentication requires your current app domain to be added to Authorized
              domains in the Firebase Console:
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                border: '1px solid #ffe7ba',
                borderRadius: 8,
                padding: '6px 10px',
                fontFamily: 'monospace',
                fontSize: 11,
                marginBottom: 10,
                wordBreak: 'break-all'
              }}
            >
              <span>{currentDomain}</span>
              <button
                type="button"
                onClick={copyDomain}
                style={{
                  background: copied ? '#52c41a' : '#1f2140',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '4px 9px',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginLeft: 8,
                  whiteSpace: 'nowrap'
                }}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, lineHeight: 1.6 }}>
              <li>
                Open{' '}
                <a
                  href={consoleSettingsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#d46b08', fontWeight: 700, textDecoration: 'underline' }}
                >
                  Firebase Console &gt; Auth &gt; Settings
                </a>
              </li>
              <li>
                Under <strong>Authorized domains</strong>, click <strong>Add domain</strong>
              </li>
              <li>
                Paste <code>{currentDomain}</code> and click <strong>Save</strong>
              </li>
            </ol>
          </div>
        ) : authModal.error ? (
          <div className="auth-error-box">
            <Icon name="info" size={16} /> <span>{authModal.error}</span>
          </div>
        ) : null}

        <div className="auth-hint-text">
          Secure authentication via Google Firebase. No password required.
        </div>
      </div>
    </div>
  );
};
