'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { getPokemonSprite } from '../utils/api.js';

export default function PokemonCard({ pokemon, onCardClick, isFav, onFavToggle }) {
  const primaryType = pokemon.types[0].type.name;
  const padId = String(pokemon.id).padStart(3, '0');
  
  const handleFavClick = (e) => {
    e.stopPropagation();
    onFavToggle(pokemon.id);
  };

  return (
    <div 
      className="pokemon-card card-glass" 
      onClick={() => onCardClick(pokemon.id)}
      style={{ '--p-color': `var(--type-${primaryType})` }}
    >
      <button 
        className={`fav-btn ${isFav ? 'active' : ''}`} 
        onClick={handleFavClick}
        aria-label="Favorite"
      >
        <Heart fill={isFav ? 'currentColor' : 'none'} size={18} />
      </button>
      
      <div className="card-bg-glow" />
      
      <div className="card-image-container">
        <img 
          className="card-sprite" 
          src={getPokemonSprite(pokemon)} 
          alt={pokemon.name} 
          loading="lazy" 
        />
      </div>
      
      <div className="card-info">
        <span className="card-id">#{padId}</span>
        <h3 className="card-name capitalize">{pokemon.name.replace('-', ' ')}</h3>
        <div className="card-types">
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
