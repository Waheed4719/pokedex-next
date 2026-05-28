'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Heart, Volume2, Sparkles, AlertTriangle, 
  GitBranch, Swords, ChevronsRight, Mars, Venus
} from 'lucide-react';
import { 
  fetchPokemonDetails, fetchPokemonSpecies, fetchEvolutionChain,
  getPokemonSprite, getEnglishFlavorText
} from '../utils/api.js';

export default function PokemonDetail({ id, onClose, isFav, onFavToggle }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pokemon, setPokemon] = useState(null);
  const [species, setSpecies] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState(null);
  
  const [activeTab, setActiveTab] = useState('about');
  const [isShiny, setIsShiny] = useState(false);
  const [isPlayingCry, setIsPlayingCry] = useState(false);
  
  const audioRef = useRef(null);
  const detailCardRef = useRef(null);

  // Load details on mount or ID change
  useEffect(() => {
    let active = true;
    async function loadDetails() {
      setLoading(true);
      setError(false);
      try {
        const detailsData = await fetchPokemonDetails(id);
        const speciesData = await fetchPokemonSpecies(id);
        let evoChain = null;
        if (speciesData.evolution_chain?.url) {
          evoChain = await fetchEvolutionChain(speciesData.evolution_chain.url);
        }
        
        if (active) {
          setPokemon(detailsData);
          setSpecies(speciesData);
          setEvolutionChain(evoChain);
          setLoading(false);
          
          // Auto-play cry
          if (detailsData.cries?.latest) {
            setTimeout(() => {
              if (active) playCry(detailsData.cries.latest);
            }, 300);
          }
        }
      } catch (err) {
        console.error('Error loading Pokemon detail:', err);
        if (active) {
          setError(true);
          setLoading(false);
        }
      }
    }
    
    loadDetails();
    
    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [id]);

  // Focus detail container for accessibility
  useEffect(() => {
    if (!loading && !error && detailCardRef.current) {
      detailCardRef.current.focus();
    }
  }, [loading, error]);

  const playCry = (url) => {
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setIsPlayingCry(true);
    setTimeout(() => setIsPlayingCry(false), 800);

    audioRef.current = new Audio(url);
    audioRef.current.volume = 0.4;
    audioRef.current.play().catch(e => console.log('Audio playback blocked:', e));
  };

  if (loading) {
    return (
      <div className="detail-overlay active" onClick={onClose}>
        <div className="detail-container" onClick={e => e.stopPropagation()}>
          <div className="loader-container">
            <div className="pokeball-loader" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-overlay active" onClick={onClose}>
        <div className="detail-container card-glass error-panel" onClick={e => e.stopPropagation()}>
          <button className="close-btn" onClick={onClose} aria-label="Close details">
            <ArrowLeft /> Back
          </button>
          <AlertTriangle className="error-icon" size={48} />
          <h3>Failed to Load Details</h3>
          <p>Something went wrong while communicating with PokéAPI.</p>
        </div>
      </div>
    );
  }

  const primaryType = pokemon.types[0].type.name;
  const padId = String(pokemon.id).padStart(3, '0');
  const name = pokemon.name.replace('-', ' ');
  const spriteUrl = getPokemonSprite(pokemon, isShiny);

  return (
    <div className="detail-overlay active" onClick={onClose}>
      <div 
        className="detail-container card-glass" 
        onClick={e => e.stopPropagation()}
        style={{ '--p-color': `var(--type-${primaryType})` }}
        tabIndex="-1"
        ref={detailCardRef}
      >
        {/* Header navigation bar */}
        <div className="detail-header-bar">
          <button className="back-btn" onClick={onClose} aria-label="Go Back">
            <ArrowLeft size={18} /> Back
          </button>
          <button 
            className={`detail-fav-btn ${isFav ? 'active' : ''}`} 
            onClick={() => onFavToggle(pokemon.id)}
            aria-label="Favorite"
          >
            <Heart fill={isFav ? 'currentColor' : 'none'} size={18} />
          </button>
        </div>

        {/* Visual Showcase */}
        <div className="detail-visual-section">
          <div className="visual-glow" />
          <div className="sprite-stage">
            <img className="detail-sprite" src={spriteUrl} alt={name} />
          </div>
          
          <div className="pokemon-identity">
            <span className="detail-id">#{padId}</span>
            <h2 className="detail-name capitalize">{name}</h2>
            <div className="detail-types">
              {pokemon.types.map((t) => (
                <span key={t.type.name} className={`type-pill badge-${t.type.name}`}>
                  {t.type.name}
                </span>
              ))}
            </div>
          </div>

          <div className="detail-quick-controls">
            {/* Audio Cry */}
            {pokemon.cries?.latest && (
              <button 
                className={`control-circle-btn ${isPlayingCry ? 'playing' : ''}`}
                onClick={() => playCry(pokemon.cries.latest)}
                title="Play Cry"
              >
                <Volume2 size={18} />
              </button>
            )}

            {/* Shiny Sprite Toggle */}
            <button 
              className={`control-circle-btn ${isShiny ? 'active' : ''}`}
              onClick={() => setIsShiny(!isShiny)}
              title="Toggle Shiny"
            >
              <Sparkles size={18} />
            </button>
          </div>
        </div>

        {/* Tab Controls and Panels */}
        <div className="detail-info-section">
          <nav className="detail-tabs">
            <button 
              className={`tab-link ${activeTab === 'about' ? 'active' : ''}`} 
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button 
              className={`tab-link ${activeTab === 'stats' ? 'active' : ''}`} 
              onClick={() => setActiveTab('stats')}
            >
              Stats
            </button>
            <button 
              className={`tab-link ${activeTab === 'evolution' ? 'active' : ''}`} 
              onClick={() => setActiveTab('evolution')}
            >
              Evolution
            </button>
            <button 
              className={`tab-link ${activeTab === 'moves' ? 'active' : ''}`} 
              onClick={() => setActiveTab('moves')}
            >
              Moves
            </button>
          </nav>

          <div className="tab-content-panel">
            {activeTab === 'about' && (
              <AboutTab pokemon={pokemon} species={species} />
            )}
            
            {activeTab === 'stats' && (
              <StatsTab pokemon={pokemon} />
            )}
            
            {activeTab === 'evolution' && (
              <EvolutionTab chain={evolutionChain} pokemonId={pokemon.id} />
            )}
            
            {activeTab === 'moves' && (
              <MovesTab pokemon={pokemon} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Subcomponents for tabs to keep layout organized and clean
function AboutTab({ pokemon, species }) {
  const desc = getEnglishFlavorText(species);
  const height = pokemon.height / 10;
  const weight = pokemon.weight / 10;

  const genusEntry = species.genera.find(g => g.language.name === 'en');
  const category = genusEntry ? genusEntry.genus : 'Unknown';

  const abilities = pokemon.abilities
    .map(a => `${a.ability.name.replace('-', ' ')}${a.is_hidden ? ' (Hidden)' : ''}`)
    .join(', ');

  const renderGenderRatio = () => {
    if (species.gender_rate === -1) {
      return <span className="genderless">Genderless</span>;
    }
    const femalePct = (species.gender_rate / 8) * 100;
    const malePct = 100 - femalePct;
    return (
      <>
        <span className="gender-male"><Mars size={14} style={{ display: 'inline', marginRight: 2 }} /> {malePct}%</span>
        <span style={{ margin: '0 4px' }}>/</span>
        <span className="gender-female"><Venus size={14} style={{ display: 'inline', marginRight: 2 }} /> {femalePct}%</span>
      </>
    );
  };

  return (
    <div className="tab-pane active">
      <p className="flavor-text">"{desc}"</p>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-label">Height</span>
          <span className="metric-value">{height.toFixed(1)} m</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Weight</span>
          <span className="metric-value">{weight.toFixed(1)} kg</span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Category</span>
          <span className="metric-value text-small">{category}</span>
        </div>
      </div>

      <div className="info-list">
        <div className="info-item">
          <span className="info-label">Abilities</span>
          <span className="info-value capitalize text-small">{abilities}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Gender Ratio</span>
          <span className="info-value gender-ratio-val">{renderGenderRatio()}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Base Happiness</span>
          <span className="info-value">{species.base_happiness !== undefined ? species.base_happiness : 'N/A'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Catch Rate</span>
          <span className="info-value">{species.capture_rate !== undefined ? species.capture_rate : 'N/A'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Growth Rate</span>
          <span className="info-value capitalize">{species.growth_rate?.name.replace('-', ' ') || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}

function StatsTab({ pokemon }) {
  const statNames = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed'
  };

  let totalBST = 0;
  const primaryType = pokemon.types[0].type.name;

  return (
    <div className="tab-pane active">
      <div className="stats-list">
        {pokemon.stats.map((s) => {
          const name = statNames[s.stat.name] || s.stat.name;
          const val = s.base_stat;
          totalBST += val;
          const pct = (val / 255) * 100;

          return (
            <div key={s.stat.name} className="stat-row">
              <span className="stat-name">{name}</span>
              <span className="stat-val">{val}</span>
              <div className="stat-bar-container">
                <div 
                  className="stat-bar-fill" 
                  style={{ 
                    width: `${pct}%`, 
                    backgroundColor: `var(--type-${primaryType})` 
                  }} 
                />
              </div>
            </div>
          );
        })}
        <div className="stat-row total-row">
          <span className="stat-name">Total BST</span>
          <span className="stat-val">{totalBST}</span>
          <div className="stat-bar-container invisible" />
        </div>
      </div>
    </div>
  );
}

function EvolutionTab({ chain }) {
  if (!chain || chain.length <= 1) {
    return (
      <div className="tab-pane active centered-empty">
        <GitBranch className="empty-icon" size={32} />
        <p>This Pokémon does not evolve.</p>
      </div>
    );
  }

  return (
    <div className="tab-pane active">
      <div className="evolution-chain-layout">
        {chain.map((stage, idx) => {
          const isLast = idx === chain.length - 1;
          const nextStage = chain[idx + 1];
          const triggerInfo = nextStage ? (stage.evolutions.find(e => e.id === nextStage.id)?.trigger || 'Level Up') : '';

          return (
            <React.Fragment key={stage.id}>
              <div className="evo-node">
                <div className="evo-sprite-wrapper">
                  <img 
                    className="evo-sprite" 
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${stage.id}.gif`} 
                    onError={(e) => {
                      e.target.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${stage.id}.png`;
                    }}
                    alt={stage.name} 
                  />
                </div>
                <span className="evo-name capitalize">{stage.name}</span>
              </div>
              
              {!isLast && (
                <div className="evo-arrow">
                  <ChevronsRight size={18} />
                  <span className="evo-trigger">{triggerInfo}</span>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function MovesTab({ pokemon }) {
  const levelUpMoves = pokemon.moves
    .filter((m) => {
      const lvlDetail = m.version_group_details.find(
        (d) => d.move_learn_method.name === 'level-up'
      );
      return !!lvlDetail;
    })
    .map((m) => {
      const lvlDetail = m.version_group_details.find(
        (d) => d.move_learn_method.name === 'level-up'
      );
      return {
        name: m.move.name.replace('-', ' '),
        level: lvlDetail ? lvlDetail.level_learned_at : 0,
      };
    })
    .sort((a, b) => a.level - b.level);

  if (levelUpMoves.length === 0) {
    return (
      <div className="tab-pane active centered-empty">
        <Swords className="empty-icon" size={32} />
        <p>No moves available.</p>
      </div>
    );
  }

  return (
    <div className="tab-pane active">
      <h4 className="moves-header">Level Up Moves</h4>
      <div className="moves-grid">
        {levelUpMoves.map((m, idx) => (
          <div key={idx} className="move-card">
            <span className="move-level">{m.level === 0 ? 'Start' : `Lvl ${m.level}`}</span>
            <span className="move-name capitalize" title={m.name}>{m.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
