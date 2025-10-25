'use client';

import { useState, useEffect, useCallback } from 'react';

const FAVORITES_STORAGE_KEY = 'iptv-favorites';

export interface FavoritesManager {
  favorites: string[];
  isFavorite: (channelId: string) => boolean;
  toggleFavorite: (channelId: string) => void;
  addFavorite: (channelId: string) => void;
  removeFavorite: (channelId: string) => void;
  clearFavorites: () => void;
  favoritesCount: number;
}

export function useFavorites(): FavoritesManager {
  const [favorites, setFavorites] = useState<string[]>(() => {
    // Initialize state from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
      }
    }
    return [];
  });

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, [favorites]);

  const isFavorite = useCallback((channelId: string): boolean => {
    return favorites.includes(channelId);
  }, [favorites]);

  const addFavorite = useCallback((channelId: string) => {
    setFavorites(prev => {
      if (!prev.includes(channelId)) {
        return [...prev, channelId];
      }
      return prev;
    });
  }, []);

  const removeFavorite = useCallback((channelId: string) => {
    setFavorites(prev => prev.filter(id => id !== channelId));
  }, []);

  const toggleFavorite = useCallback((channelId: string) => {
    if (isFavorite(channelId)) {
      removeFavorite(channelId);
    } else {
      addFavorite(channelId);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  const clearFavorites = useCallback(() => {
    setFavorites([]);
  }, []);

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
    favoritesCount: favorites.length
  };
}