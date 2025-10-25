'use client';

import { useState, useMemo, useCallback } from 'react';
import { Search, Heart, Filter, Star } from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';
import { cn, debounce } from '@/lib/utils';

interface ChannelListProps {
  channels: Channel[];
  currentChannel?: Channel | null;
  favorites?: string[];
  onChannelSelect: (channel: Channel) => void;
  onToggleFavorite?: (channelId: string) => void;
  className?: string;
}

type SortBy = 'name' | 'group' | 'favorites';

export default function ChannelList({
  channels,
  currentChannel,
  favorites = [],
  onChannelSelect,
  onToggleFavorite,
  className = ''
}: ChannelListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('favorites');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Get unique groups
  const groups = useMemo(() => {
    const groupSet = new Set<string>();
    channels.forEach(channel => {
      if (channel.group) {
        groupSet.add(channel.group);
      }
    });
    return Array.from(groupSet).sort();
  }, [channels]);

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  // Filter and sort channels
  const filteredChannels = useMemo(() => {
    let filtered = channels;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(channel =>
        channel.name.toLowerCase().includes(query) ||
        (channel.group && channel.group.toLowerCase().includes(query))
      );
    }

    // Filter by group
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(channel => channel.group === selectedGroup);
    }

    // Filter by favorites
    if (showFavoritesOnly) {
      filtered = filtered.filter(channel => favorites.includes(channel.id));
    }

    // Sort channels
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'group':
        filtered.sort((a, b) => {
          const groupA = a.group || 'Uncategorized';
          const groupB = b.group || 'Uncategorized';
          if (groupA === groupB) {
            return a.name.localeCompare(b.name);
          }
          return groupA.localeCompare(groupB);
        });
        break;
      case 'favorites':
        filtered.sort((a, b) => {
          const aIsFav = favorites.includes(a.id);
          const bIsFav = favorites.includes(b.id);
          if (aIsFav === bIsFav) {
            return a.name.localeCompare(b.name);
          }
          return bIsFav ? 1 : -1;
        });
        break;
    }

    return filtered;
  }, [channels, searchQuery, selectedGroup, showFavoritesOnly, sortBy, favorites]);

  const handleChannelClick = useCallback((channel: Channel) => {
    onChannelSelect(channel);
  }, [onChannelSelect]);

  const handleFavoriteToggle = useCallback((e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    onToggleFavorite?.(channelId);
  }, [onToggleFavorite]);

  return (
    <div className={cn("flex flex-col h-full bg-gray-900 text-white", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold mb-4">Channels ({filteredChannels.length})</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search channels..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-white placeholder-gray-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Groups</option>
            {groups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="name">Sort by Name</option>
            <option value="group">Sort by Group</option>
            <option value="favorites">Sort by Favorites</option>
          </select>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={cn(
              "px-3 py-1 rounded text-sm flex items-center gap-1 transition-colors",
              showFavoritesOnly
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gray-700 hover:bg-gray-600"
            )}
          >
            <Star className="w-3 h-3" />
            Favorites
          </button>
        </div>

      </div>

      {/* Channel List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredChannels.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No channels found</p>
            {searchQuery && (
              <p className="text-sm mt-2">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredChannels.map((channel) => {
              const isActive = currentChannel?.id === channel.id;
              const isFavorite = favorites.includes(channel.id);

              return (
                <div
                  key={channel.id}
                  onClick={() => handleChannelClick(channel)}
                  className={cn(
                    "relative cursor-pointer rounded-lg border transition-all duration-200 hover:border-blue-500 p-3 flex items-center",
                    isActive 
                      ? "border-blue-500 bg-blue-500 bg-opacity-20" 
                      : "border-gray-600 bg-gray-800 hover:bg-gray-700"
                  )}
                >
                  {/* List View */}
                  <div className="w-12 h-8 bg-gray-700 rounded flex items-center justify-center mr-3 flex-shrink-0">
                    {channel.logo ? (
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        className="w-full h-full object-contain rounded"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="text-xs font-bold text-gray-400">
                        {channel.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{channel.name}</h3>
                    {channel.group && (
                      <p className="text-xs text-gray-400 truncate">{channel.group}</p>
                    )}
                  </div>
                  
                  {onToggleFavorite && (
                    <button
                      onClick={(e) => handleFavoriteToggle(e, channel.id)}
                      className={cn(
                        "ml-2 p-1 rounded hover:bg-gray-600 transition-colors",
                        isFavorite ? "text-red-500" : "text-gray-400"
                      )}
                    >
                      <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}