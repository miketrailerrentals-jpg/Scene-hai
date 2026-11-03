import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../icons';
import { cities } from '../../data/seedData';

export const EditProfileModal: React.FC = () => {
  const {
    currentUser,
    activeProfile,
    editProfileModal,
    closeEditProfile,
    saveProfile,
    getActiveDisplayName
  } = useApp();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('Lahore');
  const [area, setArea] = useState('');

  useEffect(() => {
    if (editProfileModal.open) {
      setDisplayName(editProfileModal.formData.displayName);
      setBio(editProfileModal.formData.bio);
      setCity(editProfileModal.formData.city || 'Lahore');
      setArea(editProfileModal.formData.area);
    }
  }, [editProfileModal.open, editProfileModal.formData]);

  if (!editProfileModal.open || !currentUser) return null;

  const googleName = currentUser.displayName || 'Scene Explorer';
  const googleEmail = currentUser.email || '';
  const currentDisplayName = getActiveDisplayName();
  const initials = (currentDisplayName || googleName)
    .split(' ')
    .map(x => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveProfile({
      displayName,
      bio,
      city,
      area
    });
  };

  return (
    <div
      className="auth-modal-backdrop edit-profile-backdrop"
      onClick={closeEditProfile}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-profile-title"
    >
      <div className="edit-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-profile-header">
          <div className="edit-profile-header-text">
            <span className="tiny-overline">YOUR CORNER</span>
            <h2 id="edit-profile-title" className="edit-profile-title">
              Edit profile ✳
            </h2>
            <p className="edit-profile-desc">
              Personalize how other members see you across Scene Hai?
            </p>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closeEditProfile}
            aria-label="Close dialog"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form id="edit-profile-form" className="edit-profile-form" onSubmit={handleSubmit}>
          <div className="edit-profile-scroll-body">
            {/* Google Profile Card */}
            <div className="edit-profile-google-card">
              <div className="edit-profile-google-avatar">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={googleName}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div className="edit-profile-google-info">
                <span className="edit-profile-google-badge">
                  <Icon name="shield" size={12} /> Connected Google Account
                </span>
                <span className="edit-profile-google-name">{googleName}</span>
                <span className="edit-profile-google-email">{googleEmail}</span>
              </div>
            </div>

            {editProfileModal.saveError && (
              <div className="modal-error-banner">
                <span>{editProfileModal.saveError}</span>
              </div>
            )}

            {/* Display Name */}
            <div
              className={`form-group ${
                editProfileModal.errors.displayName ? 'has-error' : ''
              }`}
            >
              <div className="label-with-counter">
                <label htmlFor="edit-profile-name">
                  Display name <b>*</b>
                </label>
                <span className="char-counter">{displayName.length}/50</span>
              </div>
              <input
                id="edit-profile-name"
                name="displayName"
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How your name appears to other members"
              />
              {editProfileModal.errors.displayName && (
                <span className="form-error-msg">{editProfileModal.errors.displayName}</span>
              )}
              <small>This is the name visible on scenes you host and join.</small>
            </div>

            {/* Bio */}
            <div
              className={`form-group ${editProfileModal.errors.bio ? 'has-error' : ''}`}
            >
              <div className="label-with-counter">
                <label htmlFor="edit-profile-bio">
                  Short bio <span className="label-hint">(optional)</span>
                </label>
                <span id="bio-counter" className="char-counter">
                  {bio.length}/160
                </span>
              </div>
              <textarea
                id="edit-profile-bio"
                name="bio"
                rows={3}
                maxLength={160}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="What brings you out, favorite vibes, or a fun fact..."
              />
              {editProfileModal.errors.bio && (
                <span className="form-error-msg">{editProfileModal.errors.bio}</span>
              )}
              <small>Tell people a little about yourself (up to 160 characters).</small>
            </div>

            {/* City */}
            <div
              className={`form-group ${editProfileModal.errors.city ? 'has-error' : ''}`}
            >
              <label htmlFor="edit-profile-city">
                City <b>*</b>
              </label>
              <select
                id="edit-profile-city"
                name="city"
                value={city}
                onChange={e => setCity(e.target.value)}
              >
                {cities.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {editProfileModal.errors.city && (
                <span className="form-error-msg">{editProfileModal.errors.city}</span>
              )}
            </div>

            {/* Area */}
            <div className="form-group">
              <label htmlFor="edit-profile-area">
                Area / Neighborhood <span className="label-hint">(optional)</span>
              </label>
              <input
                id="edit-profile-area"
                name="area"
                type="text"
                maxLength={60}
                value={area}
                onChange={e => setArea(e.target.value)}
                placeholder="e.g. Gulberg, DHA Phase 5, F-7"
              />
              <small>Helps you discover scenes and meetups closer to you.</small>
            </div>

            {/* Cloud notice */}
            <div className="edit-profile-cloud-notice">
              <Icon name="shield" size={17} />
              <span>
                Changes are saved to Google Cloud Firestore and reflected across all your
                hosted and joined scenes.
              </span>
            </div>
          </div>

          <div className="edit-profile-actions">
            <button
              type="button"
              className="button edit-cancel-btn"
              onClick={closeEditProfile}
              disabled={editProfileModal.loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button submit-button edit-save-btn"
              disabled={editProfileModal.loading}
            >
              {editProfileModal.loading ? (
                <>
                  <span className="spinner"></span> <span>Saving to Cloud...</span>
                </>
              ) : (
                <>
                  Save Changes <Icon name="check" size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
