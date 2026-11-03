import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon, GoogleLogo } from '../icons';
import { categories } from '../data/seedData';
import { dateShort, saveUserProfile } from '../utils';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../firebase';

export const ProfileView: React.FC = () => {
  const {
    currentUser,
    activeProfile,
    profileLoading,
    store,
    updateStore,
    allScenes,
    navigate,
    openAuthPrompt,
    openEditProfile,
    logout,
    getActiveDisplayName
  } = useApp();

  const handleInterestToggle = (id: string) => {
    if (!currentUser) {
      openAuthPrompt('Sign in with Google to customize your interests and personal mix');
      return;
    }
    const current = store.interests || [];
    const next = current.includes(id)
      ? current.filter(x => x !== id)
      : [...current, id];

    updateStore(s => ({ ...s, interests: next }));

    if (activeProfile) {
      const updated = { ...activeProfile, interests: next };
      saveUserProfile(currentUser.uid, updated);
    }

    if (db && currentUser) {
      const userDocRef = doc(db, 'users', currentUser.uid);
      updateDoc(userDocRef, {
        interests: next,
        updatedAt: serverTimestamp()
      }).catch(err => handleFirestoreError(err, 'updateInterests'));
    }
  };

  const savedScenesList = store.saved
    .map(id => allScenes.find(s => s.id === id))
    .filter(Boolean) as any[];

  if (!currentUser) {
    return (
      <div className="view">
        <div className="page-title-top">
          <span className="tiny-overline">YOUR CORNER</span>
          <h1>
            Your space<span className="asterisk">✳</span>
          </h1>
          <p>Connect with real people and make real plans.</p>
        </div>

        <div className="profile-guest-card">
          <div className="profile-guest-badge">s✳</div>
          <h2>Welcome to Scene Hai?</h2>
          <p>
            Sign in with your Google account to create and host scenes, RSVP to
            local hangouts, chat with attendees, and save your favorite vibes.
          </p>
          <button
            type="button"
            className="google-auth-btn primary"
            onClick={() =>
              openAuthPrompt('Sign in with your Google account to access all features')
            }
            style={{ maxWidth: '320px', margin: '0 auto' }}
          >
            <GoogleLogo />
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="profile-metrics">
          <div>
            <strong>0</strong>
            <small>Scenes joined</small>
          </div>
          <div>
            <strong>0</strong>
            <small>Scenes hosted</small>
          </div>
          <div>
            <strong>{store.saved.length}</strong>
            <small>Saved in browser</small>
          </div>
        </div>

        <section className="profile-section">
          <div className="profile-section-head">
            <div>
              <span className="tiny-overline">YOUR PERSONAL MIX</span>
              <h2>Things you're into</h2>
            </div>
            <small>Sign in to customize</small>
          </div>
          <div className="interest-grid">
            {categories
              .filter(c => c.id !== 'all')
              .map(c => {
                const isSel = store.interests.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`interest ${isSel ? 'selected' : ''}`}
                    onClick={() => handleInterestToggle(c.id)}
                  >
                    {c.emoji} {c.label} {isSel && <Icon name="check" size={15} />}
                  </button>
                );
              })}
          </div>
        </section>

        <section className="profile-section">
          <div className="profile-section-head">
            <div>
              <span className="tiny-overline">SAVED IN THIS BROWSER</span>
              <h2>Saved scenes</h2>
            </div>
          </div>
          {savedScenesList.length ? (
            <div className="saved-list">
              {savedScenesList.map(s => (
                <div key={s.id} className="my-row">
                  <div
                    className="my-image"
                    onClick={() => navigate(`scene/${s.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={`/assets/${s.image}.svg`} alt="" loading="lazy" />
                  </div>
                  <div className="my-info">
                    <span>
                      {s.area} · {dateShort(s)}
                    </span>
                    <h3>{s.title}</h3>
                    <small>
                      Saved · {s.going}/{s.spots} going
                    </small>
                    <div className="my-actions">
                      <button
                        type="button"
                        onClick={() => navigate(`scene/${s.id}`)}
                      >
                        View scene <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="small-empty">
              Nothing saved yet. Tap the ♡ on a scene to keep it here.
            </div>
          )}
        </section>

        <div className="profile-quick-links">
          <button type="button" onClick={() => navigate('community')}>
            <Icon name="users" size={20} />{' '}
            <span>
              <b>Friends & groups</b>
              <small>Find your kind of people</small>
            </span>
            <Icon name="arrow" size={17} />
          </button>
          <button type="button" onClick={() => navigate('safety')}>
            <Icon name="shield" size={20} />{' '}
            <span>
              <b>Safety centre</b>
              <small>Reports, blocking & meetup tips</small>
            </span>
            <Icon name="arrow" size={17} />
          </button>
        </div>

        <div className="profile-footer-note">
          Made for getting off your phone (ironically).
          <br />
          <b>Scene Hai?</b> · Plan Kam, Scene Zyada!
        </div>
      </div>
    );
  }

  const name = getActiveDisplayName();
  const email = currentUser.email || '';
  const city = activeProfile?.city || store.city || 'Lahore';
  const area = activeProfile?.area || '';
  const bio = activeProfile?.bio || '';
  const initials = name
    .split(' ')
    .map(x => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hostedCount = allScenes.filter(s => s.isMine).length;
  const joinedCount = store.joined.length;

  return (
    <div className="view">
      <div className="page-title-top">
        <span className="tiny-overline">THE PERSON BEHIND THE PLANS</span>
        <h1>
          Your corner<span className="asterisk">✳</span>
        </h1>
        <p>Show up as yourself. That's the whole point.</p>
      </div>

      <div className="profile-banner">
        <div className="profile-decoration">✳</div>
        {currentUser.photoURL ? (
          <div className="profile-large-avatar has-photo">
            <img
              src={currentUser.photoURL}
              alt={name}
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="profile-large-avatar">{initials}</div>
        )}

        <h2>{name}</h2>
        <div className="profile-location-row">
          <span>
            <Icon name="pin" size={15} /> {area ? `${area}, ${city}` : city}
          </span>
          <span className="bullet">·</span>
          <span>{email}</span>
        </div>

        {bio && <p className="profile-bio-text">“{bio}”</p>}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
          {profileLoading ? (
            <span
              style={{
                fontSize: '11px',
                color: '#5a5468',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span className="spinner"></span> Syncing with Cloud Firestore...
            </span>
          ) : (
            <div className="firestore-sync-badge">
              <Icon name="shield" size={13} />{' '}
              <span>Cloud Profile · Synced to Firestore</span>
            </div>
          )}
        </div>

        <div className="profile-btn-row">
          <button
            type="button"
            className="profile-edit"
            onClick={openEditProfile}
          >
            <Icon name="edit" size={15} /> Edit profile
          </button>
          <button
            type="button"
            className="profile-edit btn-signout"
            onClick={logout}
          >
            <Icon name="logout" size={15} /> Sign out
          </button>
        </div>
      </div>

      <div className="profile-metrics">
        <div>
          <strong>{joinedCount}</strong>
          <small>Scenes joined</small>
        </div>
        <div>
          <strong>{hostedCount}</strong>
          <small>Scenes hosted</small>
        </div>
        <div>
          <strong>{store.saved.length}</strong>
          <small>Saved</small>
        </div>
      </div>

      <section className="profile-section">
        <div className="profile-section-head">
          <div>
            <span className="tiny-overline">YOUR PERSONAL MIX</span>
            <h2>Things you're into</h2>
          </div>
          <small>Tap to change</small>
        </div>
        <div className="interest-grid">
          {categories
            .filter(c => c.id !== 'all')
            .map(c => {
              const isSel = store.interests.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`interest ${isSel ? 'selected' : ''}`}
                  onClick={() => handleInterestToggle(c.id)}
                >
                  {c.emoji} {c.label} {isSel && <Icon name="check" size={15} />}
                </button>
              );
            })}
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-head">
          <div>
            <span className="tiny-overline">YOUR LITTLE COLLECTION</span>
            <h2>Saved scenes</h2>
          </div>
        </div>
        {savedScenesList.length ? (
          <div className="saved-list">
            {savedScenesList.map(s => (
              <div key={s.id} className="my-row">
                <div
                  className="my-image"
                  onClick={() => navigate(`scene/${s.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <img src={`/assets/${s.image}.svg`} alt="" loading="lazy" />
                </div>
                <div className="my-info">
                  <span>
                    {s.area} · {dateShort(s)}
                  </span>
                  <h3>{s.title}</h3>
                  <small>
                    Saved · {s.going}/{s.spots} going
                  </small>
                  <div className="my-actions">
                    <button
                      type="button"
                      onClick={() => navigate(`scene/${s.id}`)}
                    >
                      View scene <Icon name="arrow" size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="small-empty">
            Nothing saved yet. Tap the ♡ on a scene to keep it here.
          </div>
        )}
      </section>

      <div className="profile-quick-links">
        <button type="button" onClick={() => navigate('community')}>
          <Icon name="users" size={20} />{' '}
          <span>
            <b>Friends & groups</b>
            <small>Find your kind of people</small>
          </span>
          <Icon name="arrow" size={17} />
        </button>
        <button type="button" onClick={() => navigate('safety')}>
          <Icon name="shield" size={20} />{' '}
          <span>
            <b>Safety centre</b>
            <small>Reports, blocking & meetup tips</small>
          </span>
          <Icon name="arrow" size={17} />
        </button>
      </div>

      <div className="profile-footer-note">
        Made for getting off your phone (ironically).
        <br />
        <b>Scene Hai?</b> · Plan Kam, Scene Zyada!
      </div>
    </div>
  );
};
