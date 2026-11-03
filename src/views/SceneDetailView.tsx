import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';
import { categories } from '../data/seedData';
import { dateFor, dateLabel, dateShort, price, remain } from '../utils';

export const SceneDetailView: React.FC<{ sceneId: string }> = ({ sceneId }) => {
  const {
    allScenes,
    currentUser,
    store,
    updateStore,
    myJoinRequests,
    checkMyJoinRequest,
    submitJoinRequest,
    withdrawJoinRequest,
    leaveScene,
    joinRequestLoading,
    openEditScene,
    cancelHostScene,
    navigate,
    goBack,
    showToast
  } = useApp();

  const [privateVenue, setPrivateVenue] = useState<string | null>(null);

  const scene = allScenes.find(s => s.id === sceneId);

  const reqStatus = scene?.isFirestore && currentUser ? myJoinRequests[scene.id] : null;
  const isPending =
    (scene?.isFirestore && currentUser && reqStatus === 'pending') ||
    (!scene?.isFirestore && !!scene && store.requested.includes(scene.id));
  const isJoined =
    (!!scene && store.joined.includes(scene.id)) ||
    Boolean(scene?.isFirestore && currentUser && reqStatus === 'approved');
  const isHosting = !!scene?.isMine;

  useEffect(() => {
    if (scene?.isFirestore && currentUser && !scene.isMine) {
      checkMyJoinRequest(sceneId);
    }
  }, [scene?.isFirestore, scene?.isMine, currentUser, sceneId, checkMyJoinRequest]);

  useEffect(() => {
    let isMounted = true;
    if (scene?.isFirestore && db && (isHosting || isJoined)) {
      const locRef = doc(db, 'scenes', scene.id, 'privateDetails', 'location');
      getDoc(locRef)
        .then(snap => {
          if (isMounted && snap.exists() && snap.data().venue) {
            setPrivateVenue(snap.data().venue);
          }
        })
        .catch(() => {
          // If privateDetails doesn't exist or is not set, fallback to scene.venue
        });
    } else {
      setPrivateVenue(null);
    }
    return () => {
      isMounted = false;
    };
  }, [scene?.id, scene?.isFirestore, isHosting, isJoined]);

  if (!scene) {
    return (
      <div className="view empty-state">
        <h1>Scene not found</h1>
        <p>It might have been removed.</p>
        <button
          type="button"
          className="button dark"
          onClick={() => navigate('discover')}
        >
          Back home <Icon name="arrow" size={17} />
        </button>
      </div>
    );
  }

  const isCancelled = scene.status === 'cancelled';
  const hasEnded = dateFor(scene).getTime() <= Date.now();
  const spotsLeft = remain(scene);

  const catObj = categories.find(c => c.id === scene.category);

  const handleShare = () => {
    const url = `${window.location.origin}/#/scene/${encodeURIComponent(scene.id)}`;
    const text = `${scene.title} — check out this scene on Scene Hai?`;
    if (navigator.share) {
      navigator.share({ title: text, text, url }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(url)
        .then(() => showToast('Link copied!'))
        .catch(() => window.prompt('Copy this demo link:', url));
    } else {
      window.prompt('Copy this demo link:', url);
    }
  };

  const handleReport = () => {
    const reason = window.prompt('Report this scene (demo only). What concerns you?');
    if (reason && reason.trim()) {
      updateStore(s => ({
        ...s,
        reports: [
          ...s.reports,
          { sceneId: scene.id, reason: reason.trim(), createdAt: new Date().toISOString() }
        ]
      }));
      showToast('Report saved locally. No moderator was notified.');
    }
  };

  const handleBlockHost = () => {
    if (
      !scene.isMine &&
      window.confirm(`Hide scenes from ${scene.host} on this device?`)
    ) {
      updateStore(s => ({
        ...s,
        blockedHosts: [...s.blockedHosts, scene.host]
      }));
      navigate('discover');
      showToast('Host hidden on this device');
    }
  };

  const handleCancelDemoRequest = () => {
    updateStore(s => ({
      ...s,
      requested: s.requested.filter(x => x !== scene.id)
    }));
    showToast('Request cancelled');
  };

  let actionButtonNode: React.ReactNode = null;
  if (isCancelled) {
    actionButtonNode = (
      <button
        type="button"
        className="button action-join"
        disabled
        style={{ background: '#ede8e1', color: '#857e8d' }}
      >
        Scene cancelled
      </button>
    );
  } else if (hasEnded) {
    actionButtonNode = (
      <button
        type="button"
        className="button action-join"
        disabled
        style={{ background: '#ede8e1', color: '#857e8d' }}
      >
        Scene ended
      </button>
    );
  } else if (isHosting) {
    actionButtonNode = (
      <button
        type="button"
        className="button action-join"
        onClick={() => openEditScene(scene.id)}
      >
        <Icon name="edit" size={16} /> Edit scene
      </button>
    );
  } else if (scene.isFirestore) {
    if (!currentUser) {
      actionButtonNode = (
        <button
          type="button"
          className="button action-join"
          onClick={() => submitJoinRequest(scene.id)}
        >
          Request to join <Icon name="arrow" size={18} />
        </button>
      );
    } else if (reqStatus === 'approved') {
      actionButtonNode = (
        <div className="request-status-bar">
          <button
            type="button"
            className="button action-join"
            disabled
            style={{ background: '#d8fa65', color: '#1f2140', flex: 1 }}
          >
            <Icon name="check" size={16} /> You're Going
          </button>
          <button
            type="button"
            className="button button-withdraw host-action-btn-danger"
            onClick={() => leaveScene(scene.id)}
            disabled={joinRequestLoading}
            title="Leave this scene and release your spot"
          >
            {joinRequestLoading ? '...' : 'Leave scene'}
          </button>
        </div>
      );
    } else if (reqStatus === 'pending') {
      actionButtonNode = (
        <div className="request-status-bar">
          <button type="button" className="button action-join pending-btn" disabled>
            <span className="request-pending-pill">● PENDING</span>
            <span>Request Pending</span>
          </button>
          <button
            type="button"
            className="button button-withdraw"
            onClick={() => withdrawJoinRequest(scene.id)}
            disabled={joinRequestLoading}
          >
            {joinRequestLoading ? '...' : 'Withdraw'}
          </button>
        </div>
      );
    } else if (reqStatus === 'declined') {
      actionButtonNode = (
        <button
          type="button"
          className="button action-join"
          disabled
          style={{ background: '#ede8e1', color: '#9b1c1c' }}
        >
          <Icon name="close" size={16} /> Request Declined
        </button>
      );
    } else if (reqStatus === 'removed') {
      actionButtonNode = (
        <button
          type="button"
          className="button action-join"
          disabled
          style={{ background: '#ede8e1', color: '#9b1c1c' }}
        >
          <Icon name="close" size={16} /> Removed by Host
        </button>
      );
    } else if (reqStatus === 'left') {
      actionButtonNode = (
        <button
          type="button"
          className="button action-join"
          disabled
          style={{ background: '#ede8e1', color: '#7a7585' }}
        >
          You Left this Scene
        </button>
      );
    } else if (reqStatus === 'withdrawn') {
      if (spotsLeft > 0) {
        actionButtonNode = (
          <button
            type="button"
            className="button action-join"
            onClick={() => submitJoinRequest(scene.id)}
            disabled={joinRequestLoading}
          >
            {joinRequestLoading ? 'Submitting...' : 'Request to join again'}{' '}
            <Icon name="arrow" size={18} />
          </button>
        );
      } else {
        actionButtonNode = (
          <button type="button" className="button action-join" disabled>
            Scene full
          </button>
        );
      }
    } else if (spotsLeft > 0) {
      actionButtonNode = (
        <button
          type="button"
          className="button action-join"
          onClick={() => submitJoinRequest(scene.id)}
          disabled={joinRequestLoading}
        >
          {joinRequestLoading ? 'Submitting...' : 'Request to join'}{' '}
          <Icon name="arrow" size={18} />
        </button>
      );
    } else {
      actionButtonNode = (
        <button type="button" className="button action-join" disabled>
          Scene full
        </button>
      );
    }
  } else if (isJoined) {
    actionButtonNode = (
      <button
        type="button"
        className="button action-join"
        onClick={() => navigate(`chat/${scene.id}`)}
      >
        Open scene chat <Icon name="message" size={18} />
      </button>
    );
  } else if (isPending) {
    actionButtonNode = (
      <button
        type="button"
        className="button action-join requested-action"
        onClick={handleCancelDemoRequest}
      >
        Request sent ✓ · Cancel
      </button>
    );
  } else if (spotsLeft > 0) {
    actionButtonNode = (
      <button
        type="button"
        className="button action-join"
        onClick={() => submitJoinRequest(scene.id)}
      >
        Request to join <Icon name="arrow" size={18} />
      </button>
    );
  } else {
    actionButtonNode = (
      <button type="button" className="button action-join" disabled>
        Scene full
      </button>
    );
  }

  return (
    <div className="view detail-view">
      {/* Top Bar Controls */}
      <div className="detail-top">
        <button
          type="button"
          className="round-control"
          onClick={goBack}
          aria-label="Go back"
        >
          <Icon name="back" size={20} />
        </button>
        <span>THE SCENE</span>
        <button
          type="button"
          className="round-control"
          onClick={handleShare}
          aria-label="Share scene"
        >
          <Icon name="share" size={19} />
        </button>
      </div>

      {/* Cover Image */}
      <div className="detail-cover">
        <img src={`/assets/${scene.image}.svg`} alt="" loading="lazy" />
        <span className="detail-date-sticker">{dateShort(scene)}</span>
      </div>

      {/* Body Content */}
      <div className="detail-body">
        {isCancelled && (
          <div className="cancelled-banner">
            <Icon name="info" size={18} />{' '}
            <span>
              <strong>This scene has been cancelled by the host.</strong> It is no
              longer accepting RSVPs or join requests.
            </span>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}
        >
          <span className={`mini-tag mini-${scene.category}`}>
            {catObj?.emoji || '✳'} {catObj?.label || 'Scene'}
          </span>
          {scene.isFirestore ? (
            <span className="live-indicator-pill">● LIVE CLOUD SCENE</span>
          ) : scene.isDemo ? (
            <span
              className="card-status demo-status"
              style={{
                position: 'static',
                display: 'inline-block',
                padding: '3px 8px',
                fontSize: '10px'
              }}
            >
              Demo Sample
            </span>
          ) : null}
        </div>

        <h1>{scene.title}</h1>

        {scene.isFirestore && currentUser && !isHosting && reqStatus === 'approved' && (
          <div
            style={{
              background: '#eaf8e6',
              border: '1px solid #c3eec0',
              color: '#1f651b',
              padding: '12px 16px',
              borderRadius: '14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <Icon name="check" size={18} />
              <span><strong>You're confirmed for this scene!</strong> Host has approved your spot.</span>
            </div>
            <button
              type="button"
              className="button button-withdraw host-action-btn-danger"
              onClick={() => leaveScene(scene.id)}
              disabled={joinRequestLoading}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              {joinRequestLoading ? '...' : 'Leave scene'}
            </button>
          </div>
        )}

        {scene.isFirestore && currentUser && !isHosting && reqStatus === 'pending' && (
          <div
            style={{
              background: '#fdf9e8',
              border: '1px solid #f6e8b4',
              color: '#7a6207',
              padding: '12px 16px',
              borderRadius: '14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <span className="spinner" style={{ width: '13px', height: '13px' }}></span>
              <span><strong>Request Pending:</strong> Waiting for host approval.</span>
            </div>
            <button
              type="button"
              className="button button-withdraw"
              onClick={() => withdrawJoinRequest(scene.id)}
              disabled={joinRequestLoading}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              {joinRequestLoading ? '...' : 'Withdraw'}
            </button>
          </div>
        )}

        {scene.isFirestore && currentUser && !isHosting && reqStatus === 'declined' && (
          <div
            style={{
              background: '#fdf2f2',
              border: '1px solid #f9d2d2',
              color: '#9b1c1c',
              padding: '12px 16px',
              borderRadius: '14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <Icon name="close" size={16} />
            <span><strong>Request Declined.</strong> The host was unable to accept this request.</span>
          </div>
        )}

        {scene.isFirestore && currentUser && !isHosting && reqStatus === 'removed' && (
          <div
            style={{
              background: '#fdf2f2',
              border: '1px solid #f9d2d2',
              color: '#9b1c1c',
              padding: '12px 16px',
              borderRadius: '14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <Icon name="close" size={16} />
            <span><strong>Removed by Host.</strong> You are no longer on the participant list for this meetup.</span>
          </div>
        )}

        {scene.isFirestore && currentUser && !isHosting && reqStatus === 'left' && (
          <div
            style={{
              background: '#f6f5f8',
              border: '1px solid #e5e2ea',
              color: '#5e5a6a',
              padding: '12px 16px',
              borderRadius: '14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px'
            }}
          >
            <Icon name="info" size={16} />
            <span><strong>You Left this Scene.</strong> Your spot was released back to the event.</span>
          </div>
        )}

        <div className="detail-meta-list">
          <div>
            <Icon name="calendar" size={19} />
            <div>
              <strong>{dateLabel(scene)}</strong>
              <small>Asia/Karachi local time</small>
            </div>
          </div>
          <div>
            <Icon name="pin" size={19} />
            <div>
              <strong>
                {scene.area}, {scene.city}
              </strong>
              <small>
                {isHosting || isJoined
                  ? privateVenue || (scene.venue && scene.venue !== 'Meetup spot shared after approval' ? scene.venue : 'Meetup spot will be shared by host')
                  : 'Exact meetup location shared after approval'}
              </small>
            </div>
          </div>
          <div>
            <Icon name="users" size={19} />
            <div>
              <strong>
                {scene.going} confirmed going · {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} available
              </strong>
              <small>
                {scene.isFirestore
                  ? `Total capacity: ${scene.spots} (Host + ${scene.spots - 1} guests)`
                  : 'Host approves join requests'}
              </small>
            </div>
          </div>
        </div>

        <div className="detail-price-box">
          <div>
            <small>{scene.budgetType}</small>
            <strong>{price(scene)}</strong>
          </div>
          <span>
            {scene.budget === 0
              ? 'No entry fee listed'
              : 'Confirm any costs with the host'}
          </span>
        </div>

        <section className="detail-section">
          <h2>What's the scene?</h2>
          <p>{scene.description}</p>
          <div className="tag-list">
            {(scene.tags || []).map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </section>

        <section className="detail-section">
          <h2>Meet your host</h2>
          <div className="host-row">
            <span className={`avatar avatar-${scene.hostTone}`}>{scene.initials}</span>
            <span>
              <strong>{scene.host}</strong>
              <small>
                {scene.isFirestore
                  ? 'Verified Host · Cloud Member'
                  : 'Community host · Demo profile'}
              </small>
            </span>
            <div className="host-chip">{isHosting ? 'YOU' : 'HOST'}</div>
          </div>
        </section>

        <div className="safety-note detail-safety">
          <Icon name="shield" size={20} />{' '}
          <span>
            <strong>Real people, real-world safety.</strong> First meetups work best
            in public spaces. Report anything uncomfortable. Never send money to
            strangers to secure a spot.
          </span>
        </div>

        <div className="detail-report-actions">
          {isHosting && (
            <button type="button" onClick={() => openEditScene(scene.id)}>
              <Icon name="edit" size={14} /> Edit scene details
            </button>
          )}
          {isHosting && !isCancelled && (
            <button
              type="button"
              className="host-action-btn-danger"
              onClick={() => cancelHostScene(scene.id)}
            >
              <Icon name="close" size={14} /> Cancel scene
            </button>
          )}
          <button type="button" onClick={handleReport}>
            <Icon name="info" size={14} /> Report scene
          </button>
          {!isHosting && (
            <button type="button" onClick={handleBlockHost}>
              <Icon name="close" size={14} /> Hide this host
            </button>
          )}
          <button type="button" onClick={() => navigate('safety')}>
            Safety guide <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="detail-action-bar">
        <div>
          <small>{scene.budgetType}</small>
          <strong>{price(scene)}</strong>
        </div>
        {actionButtonNode}
      </div>
    </div>
  );
};
