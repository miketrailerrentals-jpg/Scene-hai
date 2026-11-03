import React from 'react';
import { useApp } from '../context/AppContext';
import { Scene } from '../types';
import { Icon } from '../icons';
import { categories } from '../data/seedData';
import { dateLabel, dateShort, price, remain } from '../utils';

export const SceneCard: React.FC<{ scene: Scene; kind?: 'normal' | 'wide' }> = ({
  scene,
  kind = 'normal'
}) => {
  const {
    currentUser,
    myJoinRequests,
    store,
    updateStore,
    openAuthPrompt,
    navigate,
    showToast
  } = useApp();

  const isPending =
    (scene.isFirestore && currentUser && myJoinRequests[scene.id] === 'pending') ||
    (!scene.isFirestore && store.requested.includes(scene.id));
  const isJoined = store.joined.includes(scene.id);
  const isCancelled = scene.status === 'cancelled';
  const isSaved = store.saved.includes(scene.id);

  const catObj = categories.find(c => c.id === scene.category);

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      openAuthPrompt('Sign in with Google to save scenes to your profile', {
        type: 'save',
        id: scene.id
      });
      return;
    }
    updateStore(s => {
      const on = s.saved.includes(scene.id);
      const saved = on ? s.saved.filter(x => x !== scene.id) : [...s.saved, scene.id];
      showToast(on ? 'Removed from saved' : 'Saved for later ♡');
      return { ...s, saved };
    });
  };

  const handleClick = () => {
    navigate(`scene/${scene.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className={`scene-card ${kind === 'wide' ? 'wide-scene' : ''} ${isCancelled ? 'is-cancelled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      aria-label={`View ${scene.title}`}
    >
      <div className="scene-media">
        <img
          src={`/assets/${scene.image}.svg`}
          alt={`${scene.category} illustration`}
          loading="lazy"
        />
        <div className="scene-media-top">
          <span className={`mini-tag mini-${scene.category}`}>
            {catObj?.emoji || '✳'} {catObj?.label || 'Scene'}
          </span>
          <button
            type="button"
            className={`save-button ${isSaved ? 'is-saved' : ''}`}
            onClick={handleSave}
            aria-label={isSaved ? 'Remove saved scene' : 'Save scene'}
          >
            <Icon name="heart" size={18} />
          </button>
        </div>
        <span className="scene-date">{dateShort(scene)}</span>
      </div>

      <div className="scene-info">
        <div className="scene-meta">
          <Icon name="pin" size={13} /> {scene.area} <span className="bullet">·</span> {dateLabel(scene)}
        </div>
        <h3>{scene.title}</h3>
        <div className="scene-bottom">
          <div className="scene-people">
            <span className="avatar-stack">
              <span className="avatar avatar-pink tiny">HS</span>
              <span className="avatar avatar-blue tiny">ZR</span>
              <span className="avatar avatar-yellow tiny">AK</span>
              <span className="avatar avatar-green tiny">MK</span>
            </span>
            <span>
              {scene.going} going · <b>{remain(scene)} spots left</b>
            </span>
          </div>
          <span className="scene-price">
            {price(scene)}{' '}
            <small>{scene.budgetType === 'Free entry' ? '' : '/ person'}</small>
          </span>
        </div>
      </div>

      {isCancelled && <span className="card-status cancelled-status">Cancelled</span>}
      {!isCancelled && scene.isFirestore && <span className="card-status live-status">● Live</span>}
      {!isCancelled && scene.isDemo && <span className="card-status demo-status">Demo</span>}

      {isPending && (
        <span className="card-status" style={{ right: 'auto', left: '14px' }}>
          Requested
        </span>
      )}
      {isJoined && (
        <span className="card-status joined-status" style={{ right: 'auto', left: '14px' }}>
          Joined ✓
        </span>
      )}
    </article>
  );
};
