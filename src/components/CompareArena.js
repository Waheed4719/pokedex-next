'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Swords, Search, BarChart3, Sliders } from 'lucide-react';
import { fetchAllPokemonIndex, fetchPokemonDetails, getPokemonSprite } from '../utils/api.js';

export default function CompareArena() {
  const [pokemonList, setPokemonList] = useState([]);
  const [pokemonA, setPokemonA] = useState(null);
  const [pokemonB, setPokemonB] = useState(null);
  
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  useEffect(() => {
    async function loadIndex() {
      const list = await fetchAllPokemonIndex();
      setPokemonList(list);
    }
    loadIndex();
  }, []);

  return (
    <div className="compare-container">
      <header className="compare-header">
        <h2 class="section-title"><Swords size={28} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} /> Pokémon Arena</h2>
        <p class="section-subtitle">Select two Pokémon to compare their stats and dimensions side-by-side</p>
      </header>

      <div className="compare-slots">
        {/* Slot A */}
        <div className="compare-slot">
          <PokemonSearchInput 
            pokemonList={pokemonList} 
            onSelect={async (id) => {
              setLoadingA(true);
              try {
                const details = await fetchPokemonDetails(id);
                setPokemonA(details);
              } catch (e) {
                console.error(e);
              } finally {
                setLoadingA(false);
              }
            }}
            placeholder="Search first Pokémon..."
          />
          <PokemonCompareDisplay pokemon={pokemonA} loading={loadingA} label="Choose Pokémon 1" />
        </div>

        <div className="vs-divider">
          <span>VS</span>
        </div>

        {/* Slot B */}
        <div className="compare-slot">
          <PokemonSearchInput 
            pokemonList={pokemonList} 
            onSelect={async (id) => {
              setLoadingB(true);
              try {
                const details = await fetchPokemonDetails(id);
                setPokemonB(details);
              } catch (e) {
                console.error(e);
              } finally {
                setLoadingB(false);
              }
            }}
            placeholder="Search second Pokémon..."
          />
          <PokemonCompareDisplay pokemon={pokemonB} loading={loadingB} label="Choose Pokémon 2" />
        </div>
      </div>

      {/* Comparison Dashboard */}
      {pokemonA && pokemonB && (
        <ComparisonDashboard pokemonA={pokemonA} pokemonB={pokemonB} />
      )}
    </div>
  );
}

function PokemonSearchInput({ pokemonList, onSelect, placeholder }) {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = (id) => {
    onSelect(id);
    setQuery('');
    setShowDropdown(false);
  };

  const filtered = query.trim()
    ? pokemonList.filter(
        (p) => p.name.includes(query.toLowerCase()) || String(p.id) === query
      ).slice(0, 8)
    : [];

  return (
    <div className="search-box-container" ref={containerRef}>
      <div className="input-wrapper">
        <Search className="search-icon" size={18} />
        <input 
          type="text" 
          placeholder={placeholder} 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          autoComplete="off"
        />
      </div>
      
      {showDropdown && query.trim() && (
        <div className="autocomplete-dropdown active">
          {filtered.length === 0 ? (
            <div className="autocomplete-item empty">No Pokémon found</div>
          ) : (
            filtered.map((p) => (
              <div 
                key={p.id} 
                className="autocomplete-item" 
                onClick={() => handleItemClick(p.id)}
              >
                <span className="p-id">#{String(p.id).padStart(3, '0')}</span>
                <span className="p-name capitalize">{p.name.replace('-', ' ')}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PokemonCompareDisplay({ pokemon, loading, label }) {
  if (loading) {
    return (
      <div className="pokemon-display-panel">
        <div className="loader-container">
          <div className="pokeball-loader" />
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="pokemon-display-panel">
        <div className="empty-slot-placeholder">
          <div className="placeholder-art">?</div>
          <p>{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="pokemon-display-panel"
      style={{ borderTop: `4px solid var(--type-${pokemon.types[0].type.name})` }}
    >
      <div className="pokemon-compare-details">
        <div className="sprite-container-compare">
          <img className="compare-sprite" src={getPokemonSprite(pokemon)} alt={pokemon.name} />
        </div>
        <h3 className="compare-pokemon-name capitalize">{pokemon.name.replace('-', ' ')}</h3>
        <span className="compare-pokemon-id">#{String(pokemon.id).padStart(3, '0')}</span>
        <div className="types-row-compare">
          {pokemon.types.map((t) => (
            <span key={t.type.name} className={`type-pill badge-${t.type.name}`}>
              {t.type.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonDashboard({ pokemonA, pokemonB }) {
  const statNames = {
    hp: 'HP',
    attack: 'Attack',
    defense: 'Defense',
    'special-attack': 'Sp. Atk',
    'special-defense': 'Sp. Def',
    speed: 'Speed'
  };

  const getStatsMap = (pokemon) => {
    const map = {};
    pokemon.stats.forEach((s) => {
      map[s.stat.name] = s.base_stat;
    });
    return map;
  };

  const statsA = getStatsMap(pokemonA);
  const statsB = getStatsMap(pokemonB);

  const totalA = Object.values(statsA).reduce((sum, val) => sum + val, 0);
  const totalB = Object.values(statsB).reduce((sum, val) => sum + val, 0);

  const heightA = pokemonA.height / 10;
  const weightA = pokemonA.weight / 10;
  const heightB = pokemonB.height / 10;
  const weightB = pokemonB.weight / 10;

  const abilsA = pokemonA.abilities.map(a => a.ability.name.replace('-', ' ')).join(', ');
  const abilsB = pokemonB.abilities.map(a => a.ability.name.replace('-', ' ')).join(', ');

  const typeA = pokemonA.types[0].type.name;
  const typeB = pokemonB.types[0].type.name;

  return (
    <div className="comparison-dashboard">
      <div className="dashboard-section card-glass">
        <h3 className="dashboard-title"><BarChart3 size={18} style={{ display: 'inline', marginRight: 6 }} /> Base Stats Comparison</h3>
        <div className="compare-stats-table">
          {Object.entries(statNames).map(([key, label]) => {
            const valA = statsA[key] || 0;
            const valB = statsB[key] || 0;
            const maxVal = 255;
            
            const pctA = (valA / maxVal) * 100;
            const pctB = (valB / maxVal) * 100;

            const isWinnerA = valA > valB;
            const isWinnerB = valB > valA;

            return (
              <div key={key} className="compare-stat-row">
                <div className="stat-meta">
                  <span className="stat-name">{label}</span>
                </div>
                <div className="compare-bar-wrapper">
                  {/* Slot A Bar */}
                  <div className="compare-bar-side left-side">
                    <span className={`stat-value ${isWinnerA ? 'winner' : ''}`}>{valA}</span>
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${pctA}%`, 
                          background: `var(--type-${typeA})`,
                          boxShadow: `0 0 10px var(--type-${typeA}-alpha)`
                        }} 
                      />
                    </div>
                  </div>
                  
                  {/* Slot B Bar */}
                  <div className="compare-bar-side right-side">
                    <div className="bar-container">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          width: `${pctB}%`, 
                          background: `var(--type-${typeB})`,
                          boxShadow: `0 0 10px var(--type-${typeB}-alpha)`
                        }} 
                      />
                    </div>
                    <span className={`stat-value ${isWinnerB ? 'winner' : ''}`}>{valB}</span>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="compare-stat-row total-row">
            <div className="stat-meta">
              <span className="stat-name">Total BST</span>
            </div>
            <div className="compare-bar-wrapper">
              <div className="compare-bar-side left-side">
                <span className={`stat-value ${totalA > totalB ? 'winner' : ''}`}>{totalA}</span>
              </div>
              <div className="compare-bar-side right-side">
                <span className={`stat-value ${totalB > totalA ? 'winner' : ''}`}>{totalB}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-section card-glass">
        <h3 className="dashboard-title"><Sliders size={18} style={{ display: 'inline', marginRight: 6 }} /> Key Attributes</h3>
        <div className="compare-attrib-grid">
          <div className="attrib-row">
            <div className="attrib-label">Height</div>
            <div className={`attrib-val left-side ${heightA > heightB ? 'text-highlight' : ''}`}>{heightA.toFixed(1)} m</div>
            <div className={`attrib-val right-side ${heightB > heightA ? 'text-highlight' : ''}`}>{heightB.toFixed(1)} m</div>
          </div>
          <div className="attrib-row">
            <div className="attrib-label">Weight</div>
            <div className={`attrib-val left-side ${weightA > weightB ? 'text-highlight' : ''}`}>{weightA.toFixed(1)} kg</div>
            <div className={`attrib-val right-side ${weightB > weightA ? 'text-highlight' : ''}`}>{weightB.toFixed(1)} kg</div>
          </div>
          <div className="attrib-row">
            <div className="attrib-label">Abilities</div>
            <div className="attrib-val left-side text-small capitalize">{abilsA}</div>
            <div className="attrib-val right-side text-small capitalize">{abilsB}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
