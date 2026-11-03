import React from 'react';
import { useApp } from '../context/AppContext';
import { Icon } from '../icons';
import { dateFor, dateShort } from '../utils';

export const RightRail: React.FC = () => {
  const { allScenes, filters, navigate, currentUser, openAuthPrompt } = useApp();

  const upcoming = allScenes
    .filter(s => s.city === filters.city)
    .sort((a, b) => dateFor(a).getTime() - dateFor(b).getTime())
    .slice(0, 3);

  const handleMakeScene = () => {
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
    <aside className="right-rail">
      <div className="right-rail-head">
        <span className="tiny-overline">YOUR SOCIAL ERA</span>
        <h2>
          Less scrolling.
          <br />
          More stories.
        </h2>
        <div className="side-squiggle">✳</div>
        <p>Your next great memory is probably one good plan away.</p>
        <button type="button" className="rail-cta" onClick={handleMakeScene}>
          Make a scene <Icon name="arrow" size={17} />
        </button>
      </div>

      <section className="rail-panel">
        <div className="rail-section-title">
          <strong>Coming up around you</strong>
          <span>✦</span>
        </div>
        {upcoming.length ? (
          upcoming.map(s => (
            <button
              key={s.id}
              type="button"
              className="mini-event"
              onClick={() => navigate(`scene/${s.id}`)}
            >
              <span className="mini-event-thumb">
                <img src={`/assets/${s.image || 'futsal'}.svg`} alt="" loading="lazy" />
              </span>
              <span>
                <b>{s.title}</b>
                <small>
                  {dateShort(s)} · {s.area}
                </small>
              </span>
              <Icon name="arrow" size={15} />
            </button>
          ))
        ) : (
          <div style={{ fontSize: '12px', color: 'var(--muted)', padding: '12px 4px', lineHeight: 1.5 }}>
            No upcoming scenes in {filters.city} yet. Be the first to start one!
          </div>
        )}
      </section>

      <div className="rail-footer">
        Made for real people, real plans, real life. <span>✳</span>
        <br />
        Scene Hai? · Design preview
      </div>
    </aside>
  );
};
