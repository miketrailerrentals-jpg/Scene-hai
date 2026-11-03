import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';
import { categories, cities } from '../data/seedData';

export const CreateView: React.FC = () => {
  const {
    currentUser,
    createScene,
    createSceneLoading,
    filters,
    navigate
  } = useApp();

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('sports');
  const [city, setCity] = useState(filters.city || 'Lahore');
  const [area, setArea] = useState('');
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('18:00');
  const [spots, setSpots] = useState(8);
  const [budget, setBudget] = useState(0);
  const [privacy, setPrivacy] = useState('public');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdId = await createScene({
      title,
      desc,
      cat,
      city,
      area,
      venue,
      date,
      time,
      spots,
      budget,
      privacy
    });
    if (createdId) {
      navigate(`scene/${createdId}`);
    }
  };

  return (
    <div className="view form-page">
      <div className="page-title-top">
        <span className="tiny-overline">THE GROUP CHAT CAN WAIT</span>
        <h1>
          Make a <em>scene.</em> <span className="asterisk">✳</span>
        </h1>
        <p>You bring the idea. We bring the people.</p>
      </div>

      {!currentUser && (
        <div
          className="safety-note"
          style={{
            background: '#fff3e0',
            border: '1px solid #ffe0b2',
            color: '#b26a00',
            marginBottom: '24px'
          }}
        >
          <Icon name="lock" size={20} />{' '}
          <span>
            <strong>Guest Mode.</strong> You can draft your scene now. When you tap
            "Publish my scene", you will be prompted to sign in with Google.
          </span>
        </div>
      )}

      <div className="create-banner">
        <div>
          <span>✦ YOUR PLAN, YOUR RULES</span>
          <strong>
            It starts with
            <br />
            one good idea.
          </strong>
        </div>
        <span className="create-banner-emoji">⚡</span>
      </div>

      <form id="create-form" className="scene-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="scene-title">
            What's the plan? <b>*</b>
          </label>
          <input
            id="scene-title"
            name="title"
            maxLength={70}
            minLength={5}
            required
            placeholder="e.g. Late-night chai in Gulberg"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <small>Give it a name people actually want to click (5–70 characters).</small>
        </div>

        <div className="form-group">
          <label>
            Pick a vibe <b>*</b>
          </label>
          <div className="create-category-grid">
            {categories
              .filter(c => c.id !== 'all')
              .map(c => (
                <label key={c.id} className="create-category-option">
                  <input
                    type="radio"
                    name="category"
                    value={c.id}
                    checked={cat === c.id}
                    onChange={() => setCat(c.id)}
                  />
                  <span>
                    <i>{c.emoji}</i>
                    {c.label}
                  </span>
                </label>
              ))}
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="scene-city">
              City <b>*</b>
            </label>
            <select
              id="scene-city"
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
          <div className="form-group">
            <label htmlFor="scene-area">
              Area <b>*</b>
            </label>
            <input
              id="scene-area"
              name="area"
              required
              maxLength={60}
              placeholder="e.g. Gulberg"
              value={area}
              onChange={e => setArea(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="scene-date">
              Date <b>*</b>
            </label>
            <input
              id="scene-date"
              name="date"
              type="date"
              required
              min={new Date().toLocaleDateString('en-CA')}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="scene-time">
              Time (Asia/Karachi) <b>*</b>
            </label>
            <input
              id="scene-time"
              name="time"
              type="time"
              required
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="scene-spots">
              Maximum people <b>*</b>
            </label>
            <input
              id="scene-spots"
              name="spots"
              type="number"
              required
              min={2}
              max={100}
              value={spots}
              onChange={e => setSpots(Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="scene-budget">Estimated PKR / person</label>
            <input
              id="scene-budget"
              name="budget"
              type="number"
              min={0}
              max={500000}
              value={budget}
              onChange={e => setBudget(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="scene-desc">
            Tell people what to expect <b>*</b>
          </label>
          <textarea
            id="scene-desc"
            name="description"
            required
            minLength={15}
            maxLength={500}
            rows={4}
            placeholder="What's the vibe, what should they bring, and who is welcome?"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <small>15 to 500 characters.</small>
        </div>

        <div className="form-group">
          <label htmlFor="scene-venue">Meetup details</label>
          <input
            id="scene-venue"
            name="venue"
            maxLength={100}
            placeholder="e.g. Cafe in Gulberg (shared after approval)"
            value={venue}
            onChange={e => setVenue(e.target.value)}
          />
          <small>For safety, share general meetup landmarks.</small>
        </div>

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

        <div className="safety-note">
          <Icon name="shield" size={20} />{' '}
          <span>
            <strong>Keep it safe.</strong> Meet in public spaces, respect boundaries,
            and never share sensitive personal details in a public description.
          </span>
        </div>

        <button
          className="button submit-button"
          type="submit"
          disabled={createSceneLoading}
        >
          {createSceneLoading ? (
            <>
              <span className="spinner"></span> <span>Publishing to Firestore...</span>
            </>
          ) : (
            <>
              Publish my scene <Icon name="arrow" size={18} />
            </>
          )}
        </button>

        <p className="form-disclaimer">
          {currentUser
            ? 'Live: your scene will be published directly to Cloud Firestore.'
            : 'Sign in with Google to publish your scene live.'}
        </p>
      </form>
    </div>
  );
};
