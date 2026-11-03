import React from 'react';
import { useApp } from '../context/AppContext';
import { SceneCard } from '../components/SceneCard';
import { Icon } from '../icons';
import { categories } from '../data/seedData';

export const ExploreView: React.FC = () => {
  const {
    matchingScenes,
    filters,
    setFilters,
    fetchDiscoveryScenes,
    scenesLoading,
    scenesError
  } = useApp();

  const timeOptions = [
    { id: 'any', label: 'Anytime' },
    { id: 'today', label: 'Today' },
    { id: 'weekend', label: 'Weekend' },
    { id: 'free', label: 'Free only' }
  ];

  const handleResetFilters = () => {
    setFilters(f => ({
      ...f,
      when: 'any',
      category: 'all',
      search: ''
    }));
  };

  return (
    <div className="view">
      <div className="page-title-top">
        <span className="tiny-overline">FIND YOUR NEXT STORY</span>
        <h1>
          Explore <span className="asterisk">✳</span>
        </h1>
        <p>Your city. Your people. Your kind of plans.</p>
      </div>

      {/* Search Bar */}
      <div className="search-box explore-search">
        <Icon name="search" size={20} />
        <input
          id="search-explore"
          aria-label="Search scenes"
          placeholder="Activities, areas, people..."
          value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
        />
        {filters.search && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setFilters(f => ({ ...f, search: '' }))}
          >
            <Icon name="close" size={17} />
          </button>
        )}
      </div>

      {/* Filter by Category */}
      <div className="filter-heading">
        <Icon name="filter" size={16} /> FILTER BY VIBE
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

      {/* Time Strip */}
      <div className="time-strip">
        {timeOptions.map(opt => (
          <button
            key={opt.id}
            type="button"
            className={`time-chip ${filters.when === opt.id ? 'selected' : ''}`}
            onClick={() => setFilters(f => ({ ...f, when: opt.id }))}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Results Header */}
      <div className="results-head">
        <h2>{matchingScenes.length} scenes to explore</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="refresh-scenes-btn"
            onClick={() => fetchDiscoveryScenes()}
          >
            <Icon name="spark" size={14} />{' '}
            <span>{scenesLoading ? 'Refreshing...' : 'Refresh live'}</span>
          </button>
          <span>{filters.city}</span>
        </div>
      </div>

      {scenesError && (
        <div className="modal-error-banner" style={{ marginBottom: '16px' }}>
          <span>{scenesError}</span>
          <button type="button" onClick={() => fetchDiscoveryScenes()}>
            Retry
          </button>
        </div>
      )}

      {/* Cards Grid */}
      <div className="cards-grid explore-grid">
        {matchingScenes.map(s => (
          <SceneCard key={s.id} scene={s} />
        ))}
      </div>

      {!matchingScenes.length && (
        <div className="empty-state">
          <span>🔎</span>
          <h3>No scenes this time.</h3>
          <p>Try a different category, city or search.</p>
          <button
            type="button"
            className="button dark"
            onClick={handleResetFilters}
          >
            Clear filters <Icon name="arrow" size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
