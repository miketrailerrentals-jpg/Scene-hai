import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';

export const MobileNav: React.FC = () => {
  const { currentRoute, navigate, currentUser, openAuthPrompt } = useApp();

  const activeTab = currentRoute.startsWith('scene/')
    ? 'explore'
    : currentRoute.startsWith('chat/')
    ? 'my-scenes'
    : currentRoute;

  const handleCreate = () => {
    if (!currentUser) {
      openAuthPrompt('Sign in with Google to create and host your own scene', {
        type: 'navigate',
        route: 'create'
      });
      return;
    }
    navigate('create');
  };

  return (
    <nav className="mobile-nav" aria-label="Bottom navigation">
      <button
        type="button"
        className={`nav-link ${activeTab === 'discover' ? 'active' : ''}`}
        onClick={() => navigate('discover')}
        aria-label="Home"
      >
        <span className="nav-icon">
          <Icon name="home" size={21} />
        </span>
        <span>Home</span>
      </button>

      <button
        type="button"
        className={`nav-link ${activeTab === 'explore' ? 'active' : ''}`}
        onClick={() => navigate('explore')}
        aria-label="Explore"
      >
        <span className="nav-icon">
          <Icon name="compass" size={21} />
        </span>
        <span>Explore</span>
      </button>

      <button
        type="button"
        className="mobile-create"
        onClick={handleCreate}
        aria-label="Create a scene"
      >
        <span>
          <Icon name="plus" size={26} />
        </span>
        <small>Create</small>
      </button>

      <button
        type="button"
        className={`nav-link ${activeTab === 'my-scenes' ? 'active' : ''}`}
        onClick={() => navigate('my-scenes')}
        aria-label="My scenes"
      >
        <span className="nav-icon">
          <Icon name="calendar" size={21} />
        </span>
        <span>My scenes</span>
      </button>

      <button
        type="button"
        className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => navigate('profile')}
        aria-label="Profile"
      >
        <span className="nav-icon">
          <Icon name="user" size={21} />
        </span>
        <span>Profile</span>
      </button>
    </nav>
  );
};
