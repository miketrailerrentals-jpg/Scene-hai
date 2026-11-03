import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon, GoogleLogo } from '../icons';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    currentRoute,
    navigate,
    openAuthPrompt,
    logout,
    getActiveDisplayName
  } = useApp();

  const activeTab = currentRoute.startsWith('scene/')
    ? 'explore'
    : currentRoute.startsWith('chat/')
    ? 'my-scenes'
    : currentRoute;

  const navLinks = [
    { route: 'discover', label: 'Discover', icon: 'home' },
    { route: 'explore', label: 'Explore', icon: 'compass' },
    { route: 'create', label: 'Create a scene', icon: 'plus' },
    { route: 'my-scenes', label: 'My scenes', icon: 'calendar' },
    { route: 'inbox', label: 'Notifications', icon: 'bell' },
    { route: 'community', label: 'Communities', icon: 'users' },
    { route: 'profile', label: 'My profile', icon: 'user' }
  ];

  const handleNavClick = (route: string) => {
    if (route === 'create' && !currentUser) {
      openAuthPrompt('Sign in with Google to create and host your own scene', {
        type: 'navigate',
        route: 'create'
      });
      return;
    }
    navigate(route);
  };

  const displayName = getActiveDisplayName();
  const initials = displayName
    .split(' ')
    .map(x => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="wordmark" onClick={() => navigate('discover')} style={{ cursor: 'pointer' }}>
          <span className="brand-symbol">
            s<span>✳</span>
          </span>
          <span className="word-text">
            scene<span className="word-dot">.</span>hai<span className="word-q">?</span>
          </span>
        </div>
        <span>Plan Kam, Scene Zyada!</span>
      </div>

      <div className="nav-label">YOUR SPACE</div>

      <nav className="desktop-nav" aria-label="Main navigation">
        {navLinks.map(link => {
          const isActive = activeTab === link.route;
          return (
            <button
              key={link.route}
              type="button"
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => handleNavClick(link.route)}
              aria-label={link.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="nav-icon">
                <Icon name={link.icon} size={21} />
              </span>
              <span>{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-hype">
          <span>✨ </span>
          <strong>Something good is happening.</strong>
          <p>Get out there and make a memory.</p>
          <button type="button" onClick={() => handleNavClick('create')}>
            Start a scene <Icon name="arrow" size={17} />
          </button>
        </div>

        {currentUser ? (
          <div className="sidebar-user-card">
            <div className="sidebar-user-avatar">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={displayName}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{displayName}</span>
              <span className="sidebar-user-email">{currentUser.email}</span>
            </div>
            <button
              type="button"
              className="btn-signout"
              onClick={logout}
              style={{ border: 0, background: 'none', padding: '6px', cursor: 'pointer' }}
              title="Sign out"
              aria-label="Sign out"
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        ) : (
          <div className="sidebar-guest-card">
            <p>
              Signed in as <b>Guest</b>
            </p>
            <button
              type="button"
              className="google-auth-btn"
              onClick={() => openAuthPrompt('Sign in with your Google account to access all features')}
            >
              <GoogleLogo />
              <span>Sign in</span>
            </button>
          </div>
        )}

        <div className="sidebar-legal">
          SCENE HAI? © 2026 <span>·</span> FIREBASE AUTH
        </div>
      </div>
    </aside>
  );
};
