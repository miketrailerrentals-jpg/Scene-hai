import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';

export const SafetyView: React.FC = () => {
  const { navigate } = useApp();

  return (
    <div className="view">
      <div className="page-title-top">
        <span className="tiny-overline">GOOD VIBES. CLEAR BOUNDARIES.</span>
        <h1>
          Safety first<span className="asterisk"> ✳</span>
        </h1>
        <p>Great plans are fun. Safe plans are non-negotiable.</p>
      </div>

      <div className="safety-banner">
        <Icon name="shield" size={34} />
        <div>
          <strong>Meet smart. Stay in control.</strong>
          <p>
            Approval-based meetups, reporting and blocking belong at the heart of
            Scene Hai?.
          </p>
        </div>
      </div>

      <div className="safety-guides">
        <div>
          <span>📍</span>
          <h3>Keep first meetups public</h3>
          <p>Choose well-known locations. Tell someone you trust where you're going.</p>
        </div>
        <div>
          <span>🙅</span>
          <h3>Respect a no</h3>
          <p>Hosts and participants can decline requests and leave events without pressure.</p>
        </div>
        <div>
          <span>🔒</span>
          <h3>Protect personal details</h3>
          <p>Exact meeting points and contact numbers should only go to approved participants.</p>
        </div>
        <div>
          <span>🚩</span>
          <h3>Report or block</h3>
          <p>Use the scene's report and hide controls. In this prototype actions stay local and are not reviewed by moderators.</p>
        </div>
      </div>

      <div className="small-empty">
        <strong>Design prototype disclaimer:</strong> This is not an operating trust-and-safety service. Real reporting, blocking, identity controls and moderation require a secured backend and human review.
      </div>

      <button
        type="button"
        className="button dark"
        onClick={() => navigate('discover')}
      >
        Discover scenes <Icon name="arrow" size={16} />
      </button>
    </div>
  );
};
