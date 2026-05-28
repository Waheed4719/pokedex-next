const BASE_URL = 'https://pokeapi.co/api/v2';

const pokemonCache = {};
const speciesCache = {};
const evolutionCache = {};
let allPokemonIndex = [];

export function extractIdFromUrl(url) {
  const parts = url.split('/').filter(Boolean);
  return parseInt(parts[parts.length - 1], 10);
}

export async function fetchAllPokemonIndex() {
  if (allPokemonIndex.length > 0) return allPokemonIndex;
  try {
    const res = await fetch(`${BASE_URL}/pokemon?limit=1025`);
    const data = await res.json();
    allPokemonIndex = data.results.map((item) => {
      const id = extractIdFromUrl(item.url);
      return { id, name: item.name };
    });
    return allPokemonIndex;
  } catch (error) {
    console.error('Error fetching all Pokemon index:', error);
    return [];
  }
}

export async function fetchPokemonDetails(idOrName) {
  const key = String(idOrName).toLowerCase().trim();
  if (pokemonCache[key]) return pokemonCache[key];

  try {
    const res = await fetch(`${BASE_URL}/pokemon/${key}`);
    if (!res.ok) throw new Error(`Pokemon not found: ${idOrName}`);
    const data = await res.json();
    pokemonCache[key] = data;
    if (isNaN(key)) {
      pokemonCache[String(data.id)] = data;
    }
    return data;
  } catch (error) {
    console.error(`Error fetching Pokemon details for ${idOrName}:`, error);
    throw error;
  }
}

export async function fetchPokemonSpecies(idOrName) {
  const key = String(idOrName).toLowerCase().trim();
  if (speciesCache[key]) return speciesCache[key];

  try {
    const res = await fetch(`${BASE_URL}/pokemon-species/${key}`);
    if (!res.ok) throw new Error(`Species not found: ${idOrName}`);
    const data = await res.json();
    speciesCache[key] = data;
    if (isNaN(key)) {
      speciesCache[String(data.id)] = data;
    }
    return data;
  } catch (error) {
    console.error(`Error fetching Pokemon species for ${idOrName}:`, error);
    throw error;
  }
}

export async function fetchEvolutionChain(url) {
  if (evolutionCache[url]) return evolutionCache[url];

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Evolution chain not found');
    const data = await res.json();

    const chain = [];
    let current = data.chain;

    const traverse = (node) => {
      const id = extractIdFromUrl(node.species.url);
      const name = node.species.name;
      
      const evolutions = node.evolves_to.map((subNode) => {
        const details = subNode.evolution_details[0] || {};
        let triggerText = '';
        if (details.trigger) {
          if (details.trigger.name === 'level-up') {
            triggerText = details.min_level ? `Lvl ${details.min_level}` : 'Level Up';
          } else if (details.trigger.name === 'use-item') {
            triggerText = details.item ? details.item.name.replace('-', ' ') : 'Item';
          } else if (details.trigger.name === 'trade') {
            triggerText = 'Trade';
          } else {
            triggerText = details.trigger.name;
          }
        }
        return {
          id: extractIdFromUrl(subNode.species.url),
          name: subNode.species.name,
          trigger: triggerText,
          node: subNode
        };
      });

      chain.push({
        id,
        name,
        evolutions: evolutions.map(e => ({ id: e.id, name: e.name, trigger: e.trigger }))
      });

      node.evolves_to.forEach(traverse);
    };

    traverse(current);
    evolutionCache[url] = chain;
    return chain;
  } catch (error) {
    console.error('Error fetching evolution chain:', error);
    return [];
  }
}

const typeCache = {};
export async function fetchPokemonByType(type) {
  if (typeCache[type]) return typeCache[type];
  try {
    const res = await fetch(`${BASE_URL}/type/${type}`);
    const data = await res.json();
    const list = data.pokemon.map((p) => {
      const id = extractIdFromUrl(p.pokemon.url);
      return { id, name: p.pokemon.name };
    });
    typeCache[type] = list;
    return list;
  } catch (error) {
    console.error(`Error fetching Pokemon of type ${type}:`, error);
    return [];
  }
}

export function getPokemonSprite(pokemon, shiny = false) {
  if (!pokemon) return '';
  const showdown = pokemon.sprites?.other?.showdown;
  const officialArtwork = pokemon.sprites?.other?.['official-artwork'];
  
  if (shiny) {
    return showdown?.front_shiny || pokemon.sprites?.front_shiny || officialArtwork?.front_shiny || pokemon.sprites?.front_default || '';
  } else {
    return showdown?.front_default || officialArtwork?.front_default || pokemon.sprites?.front_default || '';
  }
}

export function getEnglishFlavorText(speciesData) {
  if (!speciesData || !speciesData.flavor_text_entries) return 'No description available.';
  const entry = speciesData.flavor_text_entries.find((e) => e.language.name === 'en');
  return entry ? entry.flavor_text.replace(/[\n\f\r]/g, ' ') : 'No description available.';
}
