'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Tv, 
  Menu, 
  X, 
  Loader2,
  Heart
} from 'lucide-react';
import VideoPlayer from '@/components/video-player';
import ChannelList from '@/components/channel-list';
import { M3UParser, Channel, ParsedPlaylist } from '@/lib/m3u-parser';
import { useFavorites } from '@/hooks/use-favorites';
import { cn } from '@/lib/utils';

const M3U_PLAYLIST_URL = "https://gist.githubusercontent.com/reshmakunwar17/fb9fcd9c666671fa56e2bf635fbdbde4/raw/1eb176ade2328e78bb203f2b1ed4501a849fe59d/Tv.m3u";

export default function IPTVApp() {
  const [playlist, setPlaylist] = useState<ParsedPlaylist | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { favorites, toggleFavorite, favoritesCount } = useFavorites();

  // Load M3U playlist
  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const parsedPlaylist = await M3UParser.parseFromUrl(M3U_PLAYLIST_URL);
        setPlaylist(parsedPlaylist);
        
        // Set first channel as default
        if (parsedPlaylist.channels.length > 0) {
          setCurrentChannel(parsedPlaylist.channels[0]);
        }
      } catch (err) {
        console.error('Error loading playlist:', err);
        setError('Failed to load channel list. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPlaylist();
  }, []);

  // Channel navigation
  const navigateChannel = useCallback((direction: 'next' | 'prev') => {
    if (!playlist || !currentChannel) return;

    const currentIndex = playlist.channels.findIndex(ch => ch.id === currentChannel.id);
    let nextIndex;

    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % playlist.channels.length;
    } else {
      nextIndex = (currentIndex - 1 + playlist.channels.length) % playlist.channels.length;
    }

    setCurrentChannel(playlist.channels[nextIndex]);
  }, [playlist, currentChannel]);

  // Handle channel selection
  const handleChannelSelect = useCallback((channel: Channel) => {
    setCurrentChannel(channel);
    setIsSidebarOpen(false);
  }, []);

  // Retry loading playlist
  const retryLoad = () => {
    if (!isLoading) {
      window.location.reload();
    }
  };

  // Mobile sidebar toggle
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading FlickTV</h2>
          <p className="text-gray-400">Fetching channel list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white max-w-md p-6">
          <Tv className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-4">Connection Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={retryLoad}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex overflow-hidden flex-col">
      <div className="flex-1 flex overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-2">
            <Tv className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-lg">FlickTV</span>
          </div>
          
          <div className="flex items-center gap-2">
            {favoritesCount > 0 && (
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Heart className="w-4 h-4 text-red-500" />
                <span>{favoritesCount}</span>
              </div>
            )}
          </div>
        </div>
        
        {currentChannel && (
          <div className="mt-2 text-center">
            <p className="text-sm font-medium truncate">{currentChannel.name}</p>
            {currentChannel.group && (
              <p className="text-xs text-gray-400 truncate">{currentChannel.group}</p>
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed lg:relative inset-y-0 left-0 z-40 w-80 bg-gray-800 border-r border-gray-700 transform transition-transform duration-300 ease-in-out flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tv className="w-8 h-8 text-blue-500" />
              <span className="font-bold text-xl">FlickTV</span>
            </div>
            
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {playlist && (
            <div className="mt-3 text-sm text-gray-400">
              {playlist.totalChannels} channels • {favoritesCount} favorites
            </div>
          )}
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-hidden">
          {playlist && (
            <ChannelList
              channels={playlist.channels}
              currentChannel={currentChannel}
              favorites={favorites}
              onChannelSelect={handleChannelSelect}
              onToggleFavorite={toggleFavorite}
              className="h-full"
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pt-0 pt-20">
        {/* Player */}
        <div className="flex-1 bg-black">
          <VideoPlayer
            channel={currentChannel}
            onChannelChange={navigateChannel}
            className="w-full h-full"
          />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        />
      )}
      </div>
    </div>
  );
}
