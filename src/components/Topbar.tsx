import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';
import { cities } from '../data/seedData';

export const Topbar: React.FC = () => {
  const {
    currentUser,
    store,
    updateStore,
    filters,
    setFilters,
    navigate,
    openAuthPrompt,
    getActiveDisplayName
  } = useApp();

  const handleCitySelect = (selectedCity: string) => {
    updateStore(s => ({ ...s, city: selectedCity }));
    setFilters(f => ({
      ...f,
      city: selectedCity,
      cityOpen: false,
      search: '',
      category: 'all'
    }));
    navigate('discover');
  };

  const hasUnseenNotifs = store.notifications.some(n => !n.seen);
  const displayName = getActiveDisplayName();
  const initials = displayName
    .split(' ')
    .map(x => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="topbar">
      <div className="mobile-brand" onClick={() => navigate('discover')} style={{ cursor: 'pointer' }}>
        <div className="wordmark">
          <span className="brand-symbol">
            s<span>✳</span>
          </span>
          <span className="word-text">
            scene<span className="word-dot">.</span>hai<span className="word-q">?</span>
          </span>
        </div>
      </div>

      <div className="location-block">
        <span className="location-prefix">YOUR CITY</span>
        <button
          type="button"
          className="location-button"
          onClick={() => setFilters(f => ({ ...f, cityOpen: !f.cityOpen }))}
        >
          <Icon name="pin" size={16} /> <strong>{filters.city}</strong>{' '}
          <Icon name="chevron" size={14} />
        </button>

        {filters.cityOpen && (
          <div className="city-menu">
            {[...cities, 'All Pakistan'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => handleCitySelect(c)}
              >
                <span>{c}</span>
                {filters.city === c && <Icon name="check" size={15} />}
              </button>
            ))}
          </div>
        )}
      </div>

      <span className="topbar-spacer"></span>

      <span className="demo-label">
        {currentUser ? '● CONNECTED' : '● GUEST MODE'}
      </span>

      <button
        type="button"
        className="icon-button notif-button"
        onClick={() => navigate('inbox')}
        aria-label="Notifications"
      >
        <Icon name="bell" size={21} />
        {hasUnseenNotifs && <span className="red-dot"></span>}
      </button>

      {currentUser ? (
        currentUser.photoURL ? (
          <button
            type="button"
            className="profile-avatar has-photo"
            onClick={() => navigate('profile')}
            aria-label="Profile"
          >
            <img
              src={currentUser.photoURL}
              alt="Profile"
              referrerPolicy="no-referrer"
              className="topbar-avatar-img"
            />
          </button>
        ) : (
          <button
            type="button"
            className="profile-avatar"
            onClick={() => navigate('profile')}
            aria-label="Profile"
          >
            {initials}
          </button>
        )
      ) : (
        <button
          type="button"
          className="guest-signin-btn"
          onClick={() =>
            openAuthPrompt('Sign in with your Google account to access all features')
          }
          aria-label="Sign in with Google"
        >
          <Icon name="user" size={15} /> <span>Sign in</span>
        </button>
      )}
    </header>
  );
};
