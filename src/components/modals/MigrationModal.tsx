import React from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../icons';

export const MigrationModal: React.FC = () => {
  const {
    currentUser,
    migrationModal,
    closeMigrationModal,
    handleProfileMigration
  } = useApp();

  if (!migrationModal.open || !currentUser) return null;
  const d = migrationModal.localData || ({} as any);

  return (
    <div
      className="auth-modal-backdrop edit-profile-backdrop"
      onClick={closeMigrationModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="migration-modal-title"
    >
      <div
        className="edit-profile-modal"
        style={{ maxWidth: '480px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="edit-profile-header">
          <div className="edit-profile-header-text">
            <span className="tiny-overline">CLOUD SYNC · ONE-TIME</span>
            <h2 id="migration-modal-title" className="edit-profile-title">
              Import local profile? ✳
            </h2>
            <p className="edit-profile-desc">
              We found profile customizations saved on this browser.
            </p>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closeMigrationModal}
            aria-label="Close dialog"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="edit-profile-scroll-body" style={{ padding: '18px 24px' }}>
          <div className="import-modal-preview">
            <div>
              <strong>Display Name:</strong>{' '}
              <span>{d.displayName || currentUser.displayName || 'Scene Explorer'}</span>
            </div>
            {d.bio && (
              <div>
                <strong>Bio:</strong> <span>“{d.bio}”</span>
              </div>
            )}
            <div>
              <strong>City:</strong> <span>{d.city || 'Lahore'}</span>{' '}
              {d.area ? `· <span>${d.area}</span>` : ''}
            </div>
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.6, color: '#6b677a', margin: 0 }}>
            Would you like to import these saved details into your Cloud Firestore profile, or start fresh with your default Google Account profile?
          </p>
        </div>

        <div className="edit-profile-actions" style={{ padding: '14px 24px 18px', gap: '8px' }}>
          <button
            type="button"
            className="button edit-cancel-btn"
            onClick={closeMigrationModal}
            disabled={migrationModal.loading}
          >
            Not now
          </button>
          <button
            type="button"
            className="button edit-cancel-btn"
            onClick={() => handleProfileMigration(false)}
            disabled={migrationModal.loading}
          >
            Use Google Defaults
          </button>
          <button
            type="button"
            className="button submit-button edit-save-btn"
            onClick={() => handleProfileMigration(true)}
            disabled={migrationModal.loading}
          >
            {migrationModal.loading ? (
              <>
                <span className="spinner"></span> <span>Saving...</span>
              </>
            ) : (
              <>
                Import to Cloud <Icon name="check" size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
