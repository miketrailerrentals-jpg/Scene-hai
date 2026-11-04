import React from 'react';
import { useApp } from '../context/AppContext';
import { InAppNotification } from '../types';
import { Icon } from '../icons';

export const InboxView: React.FC = () => {
  const {
    currentUser,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    filters,
    setFilters,
    navigate,
    showToast,
    openAuthPrompt
  } = useApp();

  const activeTab = filters.inboxTab === 'unread' ? 'unread' : 'all';

  const notifs = notifications.filter(
    n => activeTab === 'all' || (activeTab === 'unread' && !n.read)
  );

  const handleMarkAllRead = async () => {
    if (unreadNotificationCount === 0) return;
    await markAllNotificationsAsRead();
    showToast('All notifications marked as read');
  };

  const handleNotificationClick = async (n: InAppNotification) => {
    if (!n.read) {
      await markNotificationAsRead(n.id);
    }
    if (n.actionRoute) {
      navigate(n.actionRoute);
    }
  };

  const getSymbol = (type: InAppNotification['type']) => {
    switch (type) {
      case 'join_request_received':
        return '📩';
      case 'join_request_resubmitted':
        return '🔄';
      case 'request_approved':
        return '🎉';
      case 'request_declined':
        return '✋';
      case 'participant_removed':
        return '⚠️';
      case 'scene_cancelled':
        return '🚫';
      default:
        return '⚡';
    }
  };

  const getTypeBadge = (type: InAppNotification['type']) => {
    switch (type) {
      case 'join_request_received':
        return 'Host · New Request';
      case 'join_request_resubmitted':
        return 'Host · Re-submitted';
      case 'request_approved':
        return 'Approved Attendee';
      case 'request_declined':
        return 'Declined Request';
      case 'participant_removed':
        return 'Removed Attendee';
      case 'scene_cancelled':
        return 'Scene Cancelled';
      default:
        return 'Update';
    }
  };

  return (
    <div className="view">
      <div className="page-title-top">
        <span className="tiny-overline">STAY IN THE LOOP</span>
        <h1>
          What's new<span className="asterisk">?</span>
        </h1>
        <p>Real-time updates on your scenes, approvals, and join requests.</p>
      </div>

      {!currentUser ? (
        <div className="profile-guest-card">
          <div className="profile-guest-badge">🔔</div>
          <h2>Sign in to view notifications</h2>
          <p>
            Connect your Google account to get real-time in-app updates when explorers request to join your scenes, or when hosts review your requests.
          </p>
          <button
            type="button"
            className="google-auth-btn primary"
            onClick={() => openAuthPrompt('Sign in to view your real-time notifications')}
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          <div className="inbox-head">
            <div className="tabs compact-tabs">
              <button
                type="button"
                className={activeTab === 'all' ? 'active' : ''}
                onClick={() => setFilters(f => ({ ...f, inboxTab: 'all' }))}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                className={activeTab === 'unread' ? 'active' : ''}
                onClick={() => setFilters(f => ({ ...f, inboxTab: 'unread' }))}
              >
                Unread ({unreadNotificationCount})
              </button>
            </div>
            {unreadNotificationCount > 0 && (
              <button type="button" className="text-link" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifs.length > 0 ? (
              notifs.map(n => (
                <div
                  key={n.id}
                  className={`notification-card ${!n.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(n);
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="notification-symbol">{getSymbol(n.type)}</span>
                  <div>
                    <div className="notif-title">{n.title}</div>
                    <p>{n.body}</p>
                    <small>
                      {n.ago} · {n.timeFormatted} · <strong>{getTypeBadge(n.type)}</strong>
                    </small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!n.read && (
                      <>
                        <button
                          type="button"
                          className="icon-button"
                          style={{ width: '28px', height: '28px' }}
                          title="Mark as read"
                          aria-label="Mark as read"
                          onClick={e => {
                            e.stopPropagation();
                            markNotificationAsRead(n.id);
                          }}
                        >
                          <Icon name="check" size={13} />
                        </button>
                        <span className="notification-unread-dot" title="Unread"></span>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <span>✳</span>
                <h3>{activeTab === 'unread' ? 'You are all caught up' : 'No notifications yet'}</h3>
                <p>
                  {activeTab === 'unread'
                    ? 'No unread updates right now. Check back after hosts or participants interact with your scenes.'
                    : 'When you create scenes or submit join requests, real-time Firestore updates will appear here.'}
                </p>
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
            <Icon name="check" size={14} /> Live in-app notifications synced in real time from Cloud Firestore.
          </div>
        </>
      )}
    </div>
  );
};
