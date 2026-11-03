import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Icon } from '../../icons';
import { categories, cities } from '../../data/seedData';

export const EditSceneModal: React.FC = () => {
  const { editSceneModal, closeEditScene, saveEditedScene } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('sports');
  const [city, setCity] = useState('Lahore');
  const [area, setArea] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [spots, setSpots] = useState(8);
  const [budget, setBudget] = useState(0);
  const [privacy, setPrivacy] = useState('public');

  useEffect(() => {
    if (editSceneModal.open && editSceneModal.formData) {
      setTitle(editSceneModal.formData.title || '');
      setDescription(editSceneModal.formData.description || '');
      setCategory(editSceneModal.formData.category || 'sports');
      setCity(editSceneModal.formData.city || 'Lahore');
      setArea(editSceneModal.formData.area || '');
      setVenue(editSceneModal.formData.venue || '');
      setDate(editSceneModal.formData.date || '');
      setTime(editSceneModal.formData.time || '18:00');
      setSpots(editSceneModal.formData.spots || 8);
      setBudget(editSceneModal.formData.budget || 0);
      setPrivacy(editSceneModal.formData.privacy || 'public');
    }
  }, [editSceneModal.open, editSceneModal.formData]);

  if (!editSceneModal.open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveEditedScene({
      title,
      description,
      category,
      city,
      area,
      venue,
      date,
      time,
      spots,
      budget,
      privacy
    });
  };

  return (
    <div
      className="auth-modal-backdrop edit-profile-backdrop"
      onClick={closeEditScene}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-scene-title"
    >
      <div className="edit-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-profile-header">
          <div className="edit-profile-header-text">
            <span className="tiny-overline">HOST CONTROLS</span>
            <h2 id="edit-scene-title" className="edit-profile-title">
              Edit scene details ✳
            </h2>
            <p className="edit-profile-desc">
              Update timing, location, or information for your attendees.
            </p>
          </div>
          <button
            type="button"
            className="auth-modal-close"
            onClick={closeEditScene}
            aria-label="Close dialog"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        <form id="edit-scene-form" className="edit-profile-form" onSubmit={handleSubmit}>
          <div className="edit-profile-scroll-body">
            {editSceneModal.error && (
              <div className="modal-error-banner">
                <span>{editSceneModal.error}</span>
              </div>
            )}

            {/* Title */}
            <div
              className={`form-group ${
                editSceneModal.errors.title ? 'has-error' : ''
              }`}
            >
              <div className="label-with-counter">
                <label htmlFor="edit-scene-title-input">
                  Plan title <b>*</b>
                </label>
                <span className="char-counter">{title.length}/70</span>
              </div>
              <input
                id="edit-scene-title-input"
                name="title"
                type="text"
                required
                minLength={5}
                maxLength={70}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
              {editSceneModal.errors.title && (
                <span className="form-error-msg">{editSceneModal.errors.title}</span>
              )}
            </div>

            {/* Category */}
            <div className="form-group">
              <label>Pick a vibe</label>
              <div className="create-category-grid">
                {categories
                  .filter(c => c.id !== 'all')
                  .map(c => (
                    <label key={c.id} className="create-category-option">
                      <input
                        type="radio"
                        name="category"
                        value={c.id}
                        checked={category === c.id}
                        onChange={() => setCategory(c.id)}
                      />
                      <span>
                        <i>{c.emoji}</i>
                        {c.label}
                      </span>
                    </label>
                  ))}
              </div>
            </div>

            {/* City & Area */}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="edit-scene-city">City *</label>
                <select
                  id="edit-scene-city"
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
              </div>
              <div
                className={`form-group ${
                  editSceneModal.errors.area ? 'has-error' : ''
                }`}
              >
                <label htmlFor="edit-scene-area">Area / Neighborhood *</label>
                <input
                  id="edit-scene-area"
                  name="area"
                  type="text"
                  required
                  maxLength={60}
                  value={area}
                  onChange={e => setArea(e.target.value)}
                />
                {editSceneModal.errors.area && (
                  <span className="form-error-msg">{editSceneModal.errors.area}</span>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="edit-scene-date">Date *</label>
                <input
                  id="edit-scene-date"
                  name="date"
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-scene-time">Time (Asia/Karachi) *</label>
                <input
                  id="edit-scene-time"
                  name="time"
                  type="time"
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                />
              </div>
            </div>

            {/* Spots & Budget */}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="edit-scene-spots">Maximum spots *</label>
                <input
                  id="edit-scene-spots"
                  name="spots"
                  type="number"
                  min={2}
                  max={100}
                  required
                  value={spots}
                  onChange={e => setSpots(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label htmlFor="edit-scene-budget">Estimated PKR / person</label>
                <input
                  id="edit-scene-budget"
                  name="budget"
                  type="number"
                  min={0}
                  max={500000}
                  value={budget}
                  onChange={e => setBudget(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Description */}
            <div
              className={`form-group ${
                editSceneModal.errors.description ? 'has-error' : ''
              }`}
            >
              <div className="label-with-counter">
                <label htmlFor="edit-scene-desc">Description *</label>
                <span className="char-counter">{description.length}/500</span>
              </div>
              <textarea
                id="edit-scene-desc"
                name="description"
                rows={4}
                required
                minLength={15}
                maxLength={500}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              {editSceneModal.errors.description && (
                <span className="form-error-msg">
                  {editSceneModal.errors.description}
                </span>
              )}
            </div>

            {/* Venue */}
            <div className="form-group">
              <label htmlFor="edit-scene-venue">Meetup details (landmark)</label>
              <input
                id="edit-scene-venue"
                name="venue"
                maxLength={100}
                value={venue}
                onChange={e => setVenue(e.target.value)}
              />
            </div>

            {/* Privacy */}
            <div className="form-group">
              <label>Privacy</label>
              <div className="privacy-options">
                <label>
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={privacy === 'public'}
                    onChange={() => setPrivacy('public')}
                  />
                  <span>
                    <Icon name="users" size={17} />
                    <strong>Public scene</strong>
                    <small>Visible in discovery; you approve requests.</small>
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={privacy === 'private'}
                    onChange={() => setPrivacy('private')}
                  />
                  <span>
                    <Icon name="lock" size={17} />
                    <strong>Private scene</strong>
                    <small>Accessible only by invitation link.</small>
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="edit-profile-actions">
            <button
              type="button"
              className="button edit-cancel-btn"
              onClick={closeEditScene}
              disabled={editSceneModal.loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button submit-button edit-save-btn"
              disabled={editSceneModal.loading}
            >
              {editSceneModal.loading ? (
                <>
                  <span className="spinner"></span> <span>Saving...</span>
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
