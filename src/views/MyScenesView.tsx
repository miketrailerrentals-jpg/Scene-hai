import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon, GoogleLogo } from '../icons';
import { dateShort, remain } from '../utils';

export const MyScenesView: React.FC = () => {
  const {
    allScenes,
    myHostedScenes,
    filters,
    setFilters,
    currentUser,
    myJoinRequests,
    hostJoinRequests,
    approvedParticipants,
    hostJoinRequestsLoading,
    joinRequestLoading,
    myHostedLoading,
    approveJoinRequest,
    declineJoinRequest,
    removeParticipant,
    leaveScene,
    navigate,
    openEditScene,
    cancelHostScene,
    openAuthPrompt,
    showToast
  } = useApp();

  const hosted = myHostedScenes.length
    ? myHostedScenes
    : allScenes.filter(s => s.isMine);

  const joined = allScenes.filter(
    s => Boolean(s.isFirestore && currentUser && myJoinRequests[s.id] === 'approved')
  );

  const pendingCount = currentUser ? hostJoinRequests.length : 0;

  const handleShare = (scene: any) => {
    const url = `${window.location.origin}/#/scene/${encodeURIComponent(scene.id)}`;
    const text = `${scene.title} — check out this scene on Scene Hai?`;
    if (navigator.share) {
      navigator.share({ title: text, text, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => showToast('Link copied!'))
        .catch(() => window.prompt('Copy this link:', url));
    } else {
      window.prompt('Copy this link:', url);
    }
  };

  const renderMyItem = (s: any, tag: 'Going' | 'Hosting') => {
    const isCancelled = s.status === 'cancelled';
    const isApprovedAttendee = Boolean(
      s.isFirestore && currentUser && myJoinRequests[s.id] === 'approved'
    );
    const spotsLeft = remain(s);

    return (
      <div key={s.id} className={`my-row ${isCancelled ? 'is-cancelled' : ''}`}>
        <div
          className="my-image"
          onClick={() => navigate(`scene/${s.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <img src={`/assets/${s.image || 'futsal'}.svg`} alt="" loading="lazy" />
        </div>
        <div className="my-info">
          <span>
            {s.area} · {dateShort(s)}{' '}
            {s.isFirestore && (
              <b style={{ color: '#206a2e', fontSize: '10px' }}>· LIVE CLOUD</b>
            )}
          </span>
          <h3>{s.title}</h3>
          <small>
            {isCancelled && <b style={{ color: '#c62828' }}>Cancelled · </b>}
            {tag} · {s.going}/{s.spots} going ({spotsLeft}{' '}
            {spotsLeft === 1 ? 'spot' : 'spots'} left)
          </small>
          <div className="my-actions">
            <button type="button" onClick={() => navigate(`scene/${s.id}`)}>
              View scene <Icon name="arrow" size={14} />
            </button>
            {tag === 'Going' && (
              <>
                <button type="button" onClick={() => navigate(`chat/${s.id}`)}>
                  <Icon name="message" size={15} /> Chat
                </button>
                {isApprovedAttendee && (
                  <button
                    type="button"
                    className="host-action-btn-danger"
                    onClick={() => leaveScene(s.id)}
                    disabled={joinRequestLoading}
                    title="Leave scene and release your spot"
                  >
                    Leave scene
                  </button>
                )}
              </>
            )}
            {tag === 'Hosting' && (
              <>
                <button type="button" onClick={() => openEditScene(s.id)}>
                  <Icon name="edit" size={14} /> Edit
                </button>
                {!isCancelled && (
                  <button
                    type="button"
                    className="host-action-btn-danger"
                    onClick={() => cancelHostScene(s.id)}
                  >
                    <Icon name="close" size={14} /> Cancel
                  </button>
                )}
                <button type="button" onClick={() => handleShare(s)}>
                  <Icon name="share" size={14} /> Share
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="view">
      <div className="page-title-top">
        <span className="tiny-overline">YOUR PEOPLE, YOUR PLANS</span>
        <h1>
          My scenes<span className="asterisk">✳</span>
        </h1>
        <p>All the good stuff you've got going on.</p>
      </div>

      {!currentUser && (
        <div
          className="guest-warning-card"
          style={{
            background: '#fffbe6',
            border: '1.5px solid #ffe58f',
            borderRadius: 16,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <div>
            <strong
              style={{
                display: 'block',
                fontSize: 14,
                color: '#873800',
                marginBottom: 4
              }}
            >
              Browsing as Guest
            </strong>
            <span style={{ fontSize: 12, color: '#ad4e00' }}>
              Sign in with your Google account to view your hosted scenes, track your
              RSVPs, and review attendee requests.
            </span>
          </div>
          <button
            type="button"
            className="google-auth-btn primary"
            onClick={() =>
              openAuthPrompt('Sign in to view your scenes and RSVPs')
            }
            style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: 13 }}
          >
            <GoogleLogo />
            <span>Sign in with Google</span>
          </button>
        </div>
      )}

      <div className="my-stats">
        <div>
          <strong>{joined.length}</strong>
          <span>Joined</span>
        </div>
        <div>
          <strong>{hosted.length}</strong>
          <span>Hosting</span>
        </div>
        <div>
          <strong>{pendingCount}</strong>
          <span>Requests to review</span>
        </div>
      </div>

      <div className="tabs">
        {[
          ['going', `Going (${joined.length})`],
          ['hosting', `Hosting (${hosted.length})`],
          ['requests', `Requests (${pendingCount})`]
        ].map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={filters.myTab === k ? 'active' : ''}
            onClick={() => setFilters(f => ({ ...f, myTab: k }))}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="my-content">
        {filters.myTab === 'going' &&
          (joined.length ? (
            joined.map(s => renderMyItem(s, 'Going'))
          ) : (
            <div className="empty-state">
              <span>✳</span>
              <h3>Nothing on your calendar yet</h3>
              <p>
                {currentUser
                  ? 'Explore scenes in your city and request to join a meetup.'
                  : 'Sign in to see scenes you have joined, or explore what is happening.'}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'center',
                  marginTop: 12,
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  className="button dark"
                  onClick={() => navigate('explore')}
                >
                  Explore scenes <Icon name="arrow" size={16} />
                </button>
                {!currentUser && (
                  <button
                    type="button"
                    className="button"
                    onClick={() =>
                      openAuthPrompt('Sign in to view your joined scenes')
                    }
                  >
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>
          ))}

        {filters.myTab === 'hosting' &&
          (myHostedLoading ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b677a'
              }}
            >
              <span className="spinner"></span> Loading your hosted scenes from Cloud...
            </div>
          ) : hosted.length ? (
            hosted.map(s => renderMyItem(s, 'Hosting'))
          ) : (
            <div className="empty-state">
              <span>✳</span>
              <h3>You haven't hosted a scene yet</h3>
              <p>
                {currentUser
                  ? 'Good plans start with someone. Host a futsal match, chai meetup, or jam session.'
                  : 'Sign in with your Google account to create and manage hosted scenes.'}
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'center',
                  marginTop: 12,
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  className="button dark"
                  onClick={() => navigate('create')}
                >
                  Create a scene <Icon name="arrow" size={16} />
                </button>
                {!currentUser && (
                  <button
                    type="button"
                    className="button"
                    onClick={() =>
                      openAuthPrompt('Sign in to manage your hosted scenes')
                    }
                  >
                    Sign in with Google
                  </button>
                )}
              </div>
            </div>
          ))}

        {filters.myTab === 'requests' &&
          (!currentUser ? (
            <div className="empty-state">
              <span>✳</span>
              <h3>Sign in to manage requests</h3>
              <p>
                Host approvals and attendee participant management require signing in with your Google account.
              </p>
              <button
                type="button"
                className="button dark"
                onClick={() =>
                  openAuthPrompt('Sign in to review requests for your scenes')
                }
              >
                Sign in with Google <Icon name="arrow" size={16} />
              </button>
            </div>
          ) : hostJoinRequestsLoading ? (
            <div
              style={{
                padding: '40px',
                textAlign: 'center',
                color: '#6b677a'
              }}
            >
              <span className="spinner"></span> Loading requests and participants...
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '28px' }}>
              {/* 1. Pending Requests Section */}
              <div>
                <h2 className="requests-title">
                  Waiting for your okay ({hostJoinRequests.length})
                </h2>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#777385',
                    margin: '4px 0 14px'
                  }}
                >
                  Review pending requests from explorers who want to join your hosted scenes.
                </p>

                {hostJoinRequests.length ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {hostJoinRequests.map(q => {
                      const targetScene = allScenes.find(s => s.id === q.sceneId);
                      const spotsLeft = targetScene ? remain(targetScene) : 0;
                      const isFull = spotsLeft <= 0;

                      return (
                        <div key={q.id} className="request-card">
                          <span className="avatar avatar-blue">{q.initials}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong>{q.name} wants to join</strong>
                            <span>
                              {q.sceneTitle} · {q.ago}
                            </span>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '6px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <span className="request-pending-pill">
                                ● PENDING REVIEW
                              </span>
                              {isFull ? (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: '#c62828',
                                    fontWeight: 800
                                  }}
                                >
                                  ⚠️ Scene full ({targetScene?.going}/{targetScene?.spots})
                                </span>
                              ) : (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    color: '#2e7d32',
                                    fontWeight: 700
                                  }}
                                >
                                  {spotsLeft}{' '}
                                  {spotsLeft === 1 ? 'spot' : 'spots'} available
                                </span>
                              )}
                            </div>

                            <div
                              className="request-actions"
                              style={{ marginTop: '12px', flexWrap: 'wrap' }}
                            >
                              <button
                                type="button"
                                className="accept-btn"
                                onClick={() =>
                                  approveJoinRequest(q.sceneId, q.requesterId)
                                }
                                disabled={joinRequestLoading || isFull}
                                title={
                                  isFull
                                    ? 'Event is full'
                                    : 'Approve participant spot'
                                }
                              >
                                <Icon name="check" size={15} />
                                {joinRequestLoading
                                  ? '...'
                                  : isFull
                                  ? 'Event full'
                                  : 'Approve'}
                              </button>
                              <button
                                type="button"
                                className="decline-btn"
                                onClick={() =>
                                  declineJoinRequest(q.sceneId, q.requesterId)
                                }
                                disabled={joinRequestLoading}
                              >
                                {joinRequestLoading ? '...' : 'Decline'}
                              </button>
                              <button
                                type="button"
                                className="view-scene-sub-btn"
                                onClick={() => navigate(`scene/${q.sceneId}`)}
                              >
                                View scene <Icon name="arrow" size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="small-empty">
                    No pending requests to review. You're all caught up!
                  </div>
                )}
              </div>

              {/* 2. Confirmed Participants Section */}
              <div
                style={{
                  borderTop: '1px solid var(--line)',
                  paddingTop: '24px'
                }}
              >
                <h2 className="requests-title">
                  Approved Participants ({approvedParticipants.length})
                </h2>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#777385',
                    margin: '4px 0 14px'
                  }}
                >
                  Confirmed attendees across all your hosted scenes. You can remove a participant if needed to release their spot.
                </p>

                {approvedParticipants.length ? (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {approvedParticipants.map(q => (
                      <div
                        key={q.id}
                        className="request-card"
                        style={{ background: '#fff' }}
                      >
                        <span className="avatar avatar-green">{q.initials}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '10px',
                              flexWrap: 'wrap'
                            }}
                          >
                            <strong>{q.name}</strong>
                            <span
                              className="request-pending-pill"
                              style={{
                                background: '#e8f5e9',
                                color: '#2e7d32',
                                borderColor: '#c8e6c9'
                              }}
                            >
                              ● CONFIRMED PARTICIPANT
                            </span>
                          </div>
                          <span
                            style={{
                              marginTop: '4px',
                              display: 'block',
                              color: '#777385',
                              fontSize: '11px'
                            }}
                          >
                            {q.sceneTitle}
                          </span>
                          <div
                            className="request-actions"
                            style={{ marginTop: '12px', flexWrap: 'wrap' }}
                          >
                            <button
                              type="button"
                              className="decline-btn host-action-btn-danger"
                              onClick={() =>
                                removeParticipant(q.sceneId, q.requesterId)
                              }
                              disabled={joinRequestLoading}
                              title="Remove participant from this scene and release spot"
                            >
                              <Icon name="close" size={13} />
                              {joinRequestLoading ? '...' : 'Remove participant'}
                            </button>
                            <button
                              type="button"
                              className="view-scene-sub-btn"
                              onClick={() => navigate(`scene/${q.sceneId}`)}
                            >
                              View scene <Icon name="arrow" size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="small-empty">
                    No approved participants yet. When you approve join requests, confirmed attendees will appear here.
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};
