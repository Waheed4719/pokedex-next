'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, Swords, Search, X, Layers, Tag, Frown
} from 'lucide-react';

import { 
  fetchAllPokemonIndex, fetchPokemonDetails, fetchPokemonByType 
} from '../utils/api.js';
import { getFavorites, toggleFavorite } from '../utils/favorites.js';
import PokemonCard from '../components/PokemonCard.js';
import PokemonDetail from '../components/PokemonDetail.js';
import CompareArena from '../components/CompareArena.js';

const PAGE_SIZE = 24;

const GEN_RANGES = {
  all: { start: 1, end: 1025 },
  gen1: { start: 1, end: 151 },
  gen2: { start: 152, end: 251 },
  gen3: { start: 252, end: 386 },
  gen4: { start: 387, end: 493 },
  gen5: { start: 494, end: 649 },
  gen6: { start: 650, end: 721 },
  gen7: { start: 722, end: 809 },
  gen8: { start: 810, end: 905 },
  gen9: { start: 906, end: 1025 }
};

export default function Home() {
  const [viewMode, setViewMode] = useState('grid');
  const [favoriteOnlyMode, setFavoriteOnlyMode] = useState(false);
  const [activeGen, setActiveGen] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');

  const [allPokemonIndex, setAllPokemonIndex] = useState([]);
  const [candidateList, setCandidateList] = useState([]);
  const [loadedPokemonDetails, setLoadedPokemonDetails] = useState([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  
  const [selectedPokemonId, setSelectedPokemonId] = useState(null);
  const [favoritesList, setFavoritesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const searchDebounceRef = useRef(null);

  // Load all Pokemon index and favorites on mount
  useEffect(() => {
    async function loadIndex() {
      setLoading(true);
      const index = await fetchAllPokemonIndex();
      setAllPokemonIndex(index);
      setFavoritesList(getFavorites());
      setLoading(false);
    }
    loadIndex();
  }, []);

  // Update candidates whenever filters or search query changes
  useEffect(() => {
    if (allPokemonIndex.length === 0) return;

    let active = true;
    async function updateCandidates() {
      setLoading(true);
      
      // 1. Filter by favorites if active
      let filtered = favoriteOnlyMode
        ? allPokemonIndex.filter(p => favoritesList.includes(p.id))
        : [...allPokemonIndex];

      // 2. Filter by generation range
      const range = GEN_RANGES[activeGen];
      filtered = filtered.filter(p => p.id >= range.start && p.id <= range.end);

      // 3. Filter by Type
      if (activeType !== 'all') {
        const typePokemon = await fetchPokemonByType(activeType);
        const typeIds = new Set(typePokemon.map(p => p.id));
        filtered = filtered.filter(p => typeIds.has(p.id));
      }

      // 4. Filter by Search Query
      if (searchQuery) {
        filtered = filtered.filter(
          p => p.name.includes(searchQuery) || String(p.id) === searchQuery
        );
      }

      if (active) {
        setCandidateList(filtered);
        setCurrentOffset(0);
        setLoadedPokemonDetails([]);
        
        // Trigger first page load for these candidates
        if (filtered.length > 0) {
          try {
            const firstBatch = filtered.slice(0, PAGE_SIZE);
            const detailPromises = firstBatch.map(p => fetchPokemonDetails(p.id));
            const details = await Promise.all(detailPromises);
            
            if (active) {
              setLoadedPokemonDetails(details);
              setCurrentOffset(PAGE_SIZE);
            }
          } catch (e) {
            console.error(e);
          }
        }
        setLoading(false);
      }
    }

    updateCandidates();

    return () => { active = false; };
  }, [allPokemonIndex, favoriteOnlyMode, activeGen, activeType, searchQuery, favoritesList]);

  // Handle Search Input with Debounce
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInputValue(val);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(val.toLowerCase().trim());
    }, 300);
  };

  const handleClearSearch = () => {
    setSearchInputValue('');
    setSearchQuery('');
  };

  // Load next page of cards
  const handleLoadMore = async () => {
    if (currentOffset >= candidateList.length || loadingMore) return;
    setLoadingMore(true);

    const nextBatch = candidateList.slice(currentOffset, currentOffset + PAGE_SIZE);
    try {
      const detailPromises = nextBatch.map(p => fetchPokemonDetails(p.id));
      const newDetails = await Promise.all(detailPromises);
      setLoadedPokemonDetails(prev => [...prev, ...newDetails]);
      setCurrentOffset(prev => prev + PAGE_SIZE);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Toggle favorite on card
  const handleFavToggle = (id) => {
    toggleFavorite(id);
    setFavoritesList(getFavorites());
  };

  const handleCardClick = (id) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setSelectedPokemonId(id);
      });
    } else {
      setSelectedPokemonId(id);
    }
  };

  const handleCloseDetail = () => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setSelectedPokemonId(null);
      });
    } else {
      setSelectedPokemonId(null);
    }
  };

  return (
    <div className="app-layout">
      {/* Navbar / Header */}
      <header className="main-header header-glass">
        <div className="header-container">
          <div className="logo-area">
            <div className="pokeball-logo">
              <div className="pokeball-inner" />
            </div>
            <h1>Poké<span className="logo-accent">Dex</span></h1>
          </div>

          <div className="action-buttons">
            <button 
              className={`action-btn ${favoriteOnlyMode ? 'active' : ''}`}
              onClick={() => setFavoriteOnlyMode(!favoriteOnlyMode)}
              title="View Favorites"
            >
              <Heart size={18} fill={favoriteOnlyMode ? 'currentColor' : 'none'} />
              <span>Favorites</span>
            </button>
            <button 
              className={`action-btn ${viewMode === 'compare' ? 'active' : ''}`}
              onClick={() => setViewMode(viewMode === 'grid' ? 'compare' : 'grid')}
              title="Compare Pokémon"
            >
              <Swords size={18} />
              <span>Arena</span>
            </button>
          </div>
        </div>

        {/* Filter Console (Only shown in grid database view) */}
        <div className={`console-container ${viewMode === 'compare' ? 'hidden' : ''}`}>
          <div className="search-wrapper">
            <Search className="input-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or number..." 
              value={searchInputValue}
              onChange={handleSearchChange}
              autoComplete="off"
            />
            {searchInputValue && (
              <button className="clear-btn" onClick={handleClearSearch}>
                <X size={16} />
              </button>
            )}
          </div>

          <div className="filters-wrapper">
            {/* Gen Selector */}
            <div className="select-wrapper">
              <Layers className="select-icon" size={18} />
              <select 
                value={activeGen} 
                onChange={(e) => setActiveGen(e.target.value)}
                aria-label="Filter by Generation"
              >
                <option value="all">All Generations</option>
                <option value="gen1">Gen 1 (Kanto)</option>
                <option value="gen2">Gen 2 (Johto)</option>
                <option value="gen3">Gen 3 (Hoenn)</option>
                <option value="gen4">Gen 4 (Sinnoh)</option>
                <option value="gen5">Gen 5 (Unova)</option>
                <option value="gen6">Gen 6 (Kalos)</option>
                <option value="gen7">Gen 7 (Alola)</option>
                <option value="gen8">Gen 8 (Galar)</option>
                <option value="gen9">Gen 9 (Paldea)</option>
              </select>
            </div>

            {/* Type Selector */}
            <div className="select-wrapper">
              <Tag className="select-icon" size={18} />
              <select 
                value={activeType} 
                onChange={(e) => setActiveType(e.target.value)}
                aria-label="Filter by Type"
              >
                <option value="all">All Types</option>
                <option value="normal">Normal</option>
                <option value="fire">Fire</option>
                <option value="water">Water</option>
                <option value="electric">Electric</option>
                <option value="grass">Grass</option>
                <option value="ice">Ice</option>
                <option value="fighting">Fighting</option>
                <option value="poison">Poison</option>
                <option value="ground">Ground</option>
                <option value="flying">Flying</option>
                <option value="psychic">Psychic</option>
                <option value="bug">Bug</option>
                <option value="rock">Rock</option>
                <option value="ghost">Ghost</option>
                <option value="dragon">Dragon</option>
                <option value="dark">Dark</option>
                <option value="steel">Steel</option>
                <option value="fairy">Fairy</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Database Content */}
      <main className="main-content">
        {viewMode === 'grid' ? (
          <section className="grid-section">
            {loading && loadedPokemonDetails.length === 0 ? (
              <div className="loader-container min-h">
                <div className="pokeball-loader" />
              </div>
            ) : loadedPokemonDetails.length === 0 ? (
              <div className="no-results card-glass">
                <Frown size={48} />
                <h3>No Pokémon Found</h3>
                <p>Try refining your search queries or selecting different filters.</p>
              </div>
            ) : (
              <>
                <div className="pokemon-grid">
                  {loadedPokemonDetails.map((pokemon) => (
                    <PokemonCard 
                      key={pokemon.id} 
                      pokemon={pokemon}
                      onCardClick={handleCardClick}
                      isFav={favoritesList.includes(pokemon.id)}
                      onFavToggle={handleFavToggle}
                    />
                  ))}
                </div>
                
                {/* Pagination Controls */}
                <div className="loader-section">
                  {loadingMore ? (
                    <div className="pokeball-loader" />
                  ) : currentOffset < candidateList.length ? (
                    <button className="load-more-btn card-glass" onClick={handleLoadMore}>
                      Load More Pokémon
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </section>
        ) : (
          <section className="compare-section">
            <CompareArena />
          </section>
        )}
      </main>

      {/* Detail Panel Modal overlay */}
      {selectedPokemonId && (
        <PokemonDetail 
          id={selectedPokemonId} 
          onClose={handleCloseDetail}
          isFav={favoritesList.includes(selectedPokemonId)}
          onFavToggle={handleFavToggle}
        />
      )}

      {/* Footer */}
      <footer className="app-footer">
        <p>Created with PokéAPI & Pokémon Showdown sprites in Next.js.</p>
      </footer>
    </div>
  );
}
