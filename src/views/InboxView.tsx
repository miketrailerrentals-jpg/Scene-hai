import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';

export const InboxView: React.FC = () => {
  const { store, updateStore, filters, setFilters, navigate, showToast } = useApp();

  const notifs = store.notifications.filter(
    n => filters.inboxTab === 'all' || (filters.inboxTab === 'unread' && !n.seen)
  );

  const handleMarkAllRead = () => {
    updateStore(s => ({
      ...s,
      notifications: s.notifications.map(n => ({ ...n, seen: true }))
    }));
    showToast('All caught up!');
  };

  return (
    <div className="view">
      <div className="page-title-top">
        <span className="tiny-overline">STAY IN THE LOOP</span>
        <h1>
          What's new<span className="asterisk">?</span>
        </h1>
        <p>Plans change. Good vibes don't.</p>
      </div>

      <div className="inbox-head">
        <div className="tabs compact-tabs">
          <button
            type="button"
            className={filters.inboxTab === 'all' ? 'active' : ''}
            onClick={() => setFilters(f => ({ ...f, inboxTab: 'all' }))}
          >
            All
          </button>
          <button
            type="button"
            className={filters.inboxTab === 'unread' ? 'active' : ''}
            onClick={() => setFilters(f => ({ ...f, inboxTab: 'unread' }))}
          >
            Unread
          </button>
        </div>
        <button type="button" className="text-link" onClick={handleMarkAllRead}>
          Mark all read
        </button>
      </div>

      <div className="notification-list">
        {notifs.length ? (
          notifs.map(n => (
            <div
              key={n.id}
              className={`notification-card ${!n.seen ? 'unread' : ''}`}
            >
              <span className="notification-symbol">
                {n.type === 'safety' ? '🛡️' : n.type === 'approval' ? '🎉' : '⚡'}
              </span>
              <div>
                <div className="notif-title">{n.title}</div>
                <p>{n.body}</p>
                <small>
                  {n.ago} ·{' '}
                  {n.type === 'welcome'
                    ? 'Getting started'
                    : n.type === 'safety'
                    ? 'Safety'
                    : 'Update'}
                </small>
              </div>
              {!n.seen && <span className="notification-unread-dot"></span>}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <span>✳</span>
            <h3>You are all caught up</h3>
            <p>No unread updates right now.</p>
            <button
              type="button"
              className="button dark"
              onClick={() => navigate('explore')}
            >
              Find a scene <Icon name="arrow" size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="inbox-hint">
        <Icon name="info" size={16} /> These are sample notifications. Live notifications require a backend.
      </div>
    </div>
  );
};
