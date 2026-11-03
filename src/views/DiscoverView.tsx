import React from 'react';
import { useApp } from '../context/AppContext';
import { SceneCard } from '../components/SceneCard';
import { Icon } from '../icons';
import { categories } from '../data/seedData';
import { dateLabel, dateShort, price, remain } from '../utils';

export const DiscoverView: React.FC = () => {
  const {
    matchingScenes,
    filters,
    setFilters,
    navigate,
    fetchDiscoveryScenes,
    fetchMyHostedScenes,
    fetchHostJoinRequests,
    scenesLoading,
    currentUser,
    openAuthPrompt,
    showToast
  } = useApp();

  const featuredScene = matchingScenes.find(s => s.feature) || matchingScenes[0];
  const todays = matchingScenes.filter(
    s => dateShort(s) === 'TODAY' && s.id !== featuredScene?.id
  );
  const more = matchingScenes
    .filter(s => s.id !== featuredScene?.id && !todays.some(t => t.id === s.id))
    .slice(0, 4);

  const handleRefresh = async () => {
    fetchDiscoveryScenes();
    if (currentUser) {
      fetchMyHostedScenes().then(() => fetchHostJoinRequests());
    }
    showToast('Syncing scenes from Cloud... ✳');
  };

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
    <div className="view discover-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-tag">
            <span>✳</span> PLAN KAM, SCENE ZYADA!
          </div>
          <h1>
            Good plans.
            <br />
            <em>Better</em> people
            <span className="hero-period">.</span>
          </h1>
          <p>
            Aaj kya scene hai? Meet your people, find your vibe, and make plans
            worth leaving home for.
          </p>
        </div>
        <div className="hero-doodles" aria-hidden="true">
          <span className="doodle-star">✳</span>
          <span className="doodle-orbit">↗</span>
          <span className="doodle-burst">✦</span>
        </div>
      </section>

      {/* Search Box */}
      <div className="search-box">
        <Icon name="search" size={21} />
        <input
          id="search-home"
          aria-label="Search activities"
          placeholder="Search futsal, chai, Gulberg..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        <button
          type="button"
          aria-label="Explore results"
          onClick={() => navigate('explore')}
        >
          <Icon name="arrow" size={19} />
        </button>
      </div>

      {/* Category Strip */}
      <div className="categories-header">
        <span className="tiny-overline">PICK YOUR VIBE</span>
        <span className="swipe-note">
          Swipe to explore <Icon name="arrow" size={14} />
        </span>
      </div>

      <div className="category-strip" aria-label="Filter scenes by category">
        {categories.map(c => (
          <button
            key={c.id}
            type="button"
            className={`category-pill ${filters.category === c.id ? 'selected' : ''}`}
            onClick={() => setFilters(f => ({ ...f, category: c.id }))}
          >
            <span className={`category-emoji ${c.tone}`}>{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Scene of the Day Heading */}
      <div className="section-heading">
        <div>
          <div className="section-kicker">
            <span className="red-circle"></span> NOT TO MISS
          </div>
          <h2>The scene of the day</h2>
        </div>
        <button
          type="button"
          className="refresh-scenes-btn"
          onClick={handleRefresh}
          title="Sync scenes from Cloud Firestore"
        >
          <Icon name="spark" size={14} />{' '}
          <span>{scenesLoading ? 'Syncing...' : 'Live sync'}</span>
        </button>
      </div>

      {/* Spotlight / Featured */}
      {featuredScene ? (
        <div className={`spotlight ${featuredScene.category}`}>
          <div className="spotlight-info">
            <span className="featured-eyebrow">
              <span className="spark-tiny">✳</span> THE SPOTLIGHT
            </span>
            <h2>{featuredScene.title}</h2>
            <p>
              {featuredScene.area}, {featuredScene.city} <span>·</span>{' '}
              {dateLabel(featuredScene)}
            </p>
            <div className="featured-foot">
              <span className="featured-price">
                {price(featuredScene)} <small>/ person</small>
              </span>
              <button
                type="button"
                className="spotlight-button"
                onClick={() => navigate(`scene/${featuredScene.id}`)}
                aria-label={`Explore ${featuredScene.title}`}
              >
                Explore scene <Icon name="arrow" size={17} />
              </button>
            </div>
          </div>
          <div className="spotlight-visual">
            <img
              src={`/assets/${featuredScene.image}.svg`}
              alt={featuredScene.title}
            />
            <span className="sticker sticker-rotate">
              {remain(featuredScene)} SPOTS
              <br />
              LEFT!
            </span>
          </div>
        </div>
      ) : (
        <div className="empty-state">
          No scenes match this search. Try another vibe.
        </div>
      )}

      {/* Happening Today */}
      <div className="section-heading">
        <div>
          <div className="section-kicker">MADE FOR RIGHT NOW</div>
          <h2>
            Happening today <span className="heading-emoji">🔥</span>
          </h2>
        </div>
        <button
          type="button"
          className="text-link"
          onClick={() => {
            setFilters(f => ({ ...f, when: 'today' }));
            navigate('explore');
          }}
        >
          See all <Icon name="arrow" size={16} />
        </button>
      </div>

      <div className="cards-grid">
        {(todays.length ? todays : more.slice(0, 2)).length ? (
          (todays.length ? todays : more.slice(0, 2)).map(s => (
            <SceneCard key={s.id} scene={s} />
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', padding: '16px', background: 'var(--paper)', borderRadius: '16px', border: '1px dashed var(--line)', color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>
            No other scenes scheduled for today in {filters.city}. Check out upcoming scenes or start your own!
          </div>
        )}
      </div>

      {/* Break Banner */}
      <div className="break-banner">
        <div>
          <span>GOT A PLAN?</span>
          <h3>
            Be the reason
            <br />
            people show up.
          </h3>
          <button type="button" onClick={handleCreate}>
            Create your scene <Icon name="arrow" size={18} />
          </button>
        </div>
        <div className="banner-art" aria-hidden="true">
          <span>☕</span>
          <span>⚡</span>
          <span>🎮</span>
          <span>✳</span>
        </div>
      </div>

      {/* More to explore */}
      <div className="section-heading">
        <div>
          <div className="section-kicker">KEEP THE GOOD TIMES ROLLING</div>
          <h2>More to explore</h2>
        </div>
        <button
          type="button"
          className="text-link"
          onClick={() => navigate('explore')}
        >
          See all <Icon name="arrow" size={16} />
        </button>
      </div>

      <div className="cards-grid">
        {more.slice(0, 4).length ? (
          more.slice(0, 4).map(s => (
            <SceneCard key={s.id} scene={s} />
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', padding: '16px', background: 'var(--paper)', borderRadius: '16px', border: '1px dashed var(--line)', color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>
            Looking for more plans in {filters.city}? Tap <b>Create your scene</b> above to start a hangout.
          </div>
        )}
      </div>
    </div>
  );
};
