import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';
import { groups, people } from '../data/seedData';

export const CommunityView: React.FC = () => {
  const { filters, store, updateStore, showToast } = useApp();

  const visibleGroups = groups.filter(
    g => filters.city === 'All Pakistan' || g.city === filters.city
  );

  const handleGroupToggle = (groupId: string) => {
    updateStore(s => {
      const already = s.groupsJoined.includes(groupId);
      const groupsJoined = already
        ? s.groupsJoined.filter(x => x !== groupId)
        : [...s.groupsJoined, groupId];
      showToast(already ? 'Left demo group' : 'Joined demo group! ✳');
      return { ...s, groupsJoined };
    });
  };

  const handleFriendToggle = (name: string) => {
    updateStore(s => {
      const already = s.friendsRequested.includes(name);
      const friendsRequested = already
        ? s.friendsRequested.filter(x => x !== name)
        : [...s.friendsRequested, name];
      showToast(
        already
          ? 'Connection request cancelled'
          : 'Connection requested in demo mode'
      );
      return { ...s, friendsRequested };
    });
  };

  const handleInviteFriend = () => {
    const link = window.location.origin;
    if (navigator.share) {
      navigator
        .share({
          title: 'Scene Hai?',
          text: 'Plan kam, scene zyada! Discover Scene Hai?',
          url: link
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard
        .writeText(link)
        .then(() => showToast('App link copied!'))
        .catch(() => window.prompt('Copy this demo link:', link));
    } else {
      window.prompt('Copy this demo link:', link);
    }
  };

  return (
    <div className="view">
      <div className="page-title-top">
        <span className="tiny-overline">THE GOOD KIND OF GROUP CHAT</span>
        <h1>
          Find your <em>people.</em> <span className="asterisk">✳</span>
        </h1>
        <p>Make friends before you make plans.</p>
      </div>

      <div className="community-hero">
        <div>
          <span>✳ BETTER TOGETHER</span>
          <h2>
            From hellos
            <br />
            to hangouts.
            <br />
            That's the scene.
          </h2>
          <p>Find interest-based communities around your city.</p>
        </div>
        <span className="community-emoji">👋</span>
      </div>

      {/* Communities */}
      <div className="section-heading">
        <div>
          <div className="section-kicker">YOUR KIND OF CROWD</div>
          <h2>Communities</h2>
        </div>
      </div>

      <div className="groups-grid">
        {visibleGroups.map(g => {
          const isJoined = store.groupsJoined.includes(g.id);
          return (
            <div key={g.id} className="group-card">
              <div className={`group-emoji ${g.tone}`}>{g.emoji}</div>
              <div className="group-card-body">
                <h3>{g.name}</h3>
                <p>{g.desc}</p>
                <span>
                  <Icon name="users" size={13} /> {g.members} members · {g.city}
                </span>
              </div>
              <button
                type="button"
                className={`group-join ${isJoined ? 'joined' : ''}`}
                onClick={() => handleGroupToggle(g.id)}
              >
                {isJoined ? 'Joined ✓' : 'Join group +'}
              </button>
            </div>
          );
        })}
      </div>

      {!visibleGroups.length && (
        <div className="small-empty">No demo communities for this city yet.</div>
      )}

      {/* Meet the crowd */}
      <div className="section-heading">
        <div>
          <div className="section-kicker">YOU MIGHT CLICK</div>
          <h2>Meet the crowd</h2>
        </div>
      </div>

      <div className="people-grid">
        {people.map(p => {
          const isRequested = store.friendsRequested.includes(p.name);
          return (
            <div key={p.name} className="person-card">
              <span className={`avatar avatar-${p.tone} person-avatar`}>
                {p.initials}
              </span>
              <strong>{p.name}</strong>
              <small>{p.vibe}</small>
              <button
                type="button"
                className={isRequested ? 'requested' : ''}
                onClick={() => handleFriendToggle(p.name)}
              >
                {isRequested ? 'Requested ✓' : 'Connect +'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="community-bottom">
        <p>
          <strong>Bring a friend, make a friend.</strong>
          <br />
          Share Scene Hai? with your crew.
        </p>
        <button
          type="button"
          className="button dark"
          onClick={handleInviteFriend}
        >
          Invite a friend <Icon name="share" size={17} />
        </button>
      </div>

      <p className="form-disclaimer">
        Demo only: group joins and connection requests are stored on this device.
      </p>
    </div>
  );
};
