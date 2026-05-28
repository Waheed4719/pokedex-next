const FAVORITES_KEY = 'pokedex_favorites';

export function getFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    const favs = localStorage.getItem(FAVORITES_KEY);
    return favs ? JSON.parse(favs) : [];
  } catch (e) {
    console.error('Error reading favorites from localStorage:', e);
    return [];
  }
}

export function saveFavorites(favs) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (e) {
    console.error('Error saving favorites to localStorage:', e);
  }
}

export function isFavorite(id) {
  const favs = getFavorites();
  return favs.includes(Number(id));
}

export function toggleFavorite(id) {
  const numId = Number(id);
  let favs = getFavorites();
  const index = favs.indexOf(numId);
  
  if (index > -1) {
    favs.splice(index, 1);
  } else {
    favs.push(numId);
  }
  
  saveFavorites(favs);
  return index === -1; // returns true if added, false if removed
}
