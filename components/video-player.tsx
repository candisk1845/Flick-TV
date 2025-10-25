'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize,
  SkipBack,
  SkipForward,
  Settings,
  Loader2
} from 'lucide-react';
import { Channel } from '@/lib/m3u-parser';

interface VideoPlayerProps {
  channel: Channel | null;
  onChannelChange?: (direction: 'next' | 'prev') => void;
  className?: string;
}

interface PlayerState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isLoading: boolean;
  error: string | null;
  showControls: boolean;
  duration: number;
  currentTime: number;
}

export default function VideoPlayer({ channel, onChannelChange, className = '' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [state, setState] = useState<PlayerState>({
    isPlaying: false,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isLoading: false,
    error: null,
    showControls: true,
    duration: 0,
    currentTime: 0
  });

  // Initialize HLS and load stream
  const loadStream = useCallback(async (streamUrl: string) => {
    if (!videoRef.current) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Cleanup previous HLS instance
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          maxMaxBufferLength: 600,
          maxBufferSize: 60 * 1000 * 1000,
          maxBufferHole: 0.5,
          highBufferWatchdogPeriod: 2,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 3,
          maxFragLookUpTolerance: 0.25,
          liveSyncDurationCount: 3,
          liveMaxLatencyDurationCount: 10,
        });

        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setState(prev => ({ ...prev, isLoading: false }));
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        });

        hls.on(Hls.Events.ERROR, (event, data) => {
          console.error('HLS Error:', data);
          if (data.fatal) {
            setState(prev => ({ 
              ...prev, 
              error: `Stream error: ${data.details}`,
              isLoading: false 
            }));
          }
        });

      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        videoRef.current.src = streamUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
          setState(prev => ({ ...prev, isLoading: false }));
          videoRef.current?.play().catch(console.error);
        });
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'HLS is not supported in this browser',
          isLoading: false 
        }));
      }
    } catch (error) {
      console.error('Error loading stream:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load stream',
        isLoading: false 
      }));
    }
  }, []);

  // Load channel when it changes
  useEffect(() => {
    let mounted = true;
    
    if (channel?.url && mounted) {
      loadStream(channel.url);
    }

    return () => {
      mounted = false;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel?.url, loadStream]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => setState(prev => ({ ...prev, isPlaying: true }));
    const handlePause = () => setState(prev => ({ ...prev, isPlaying: false }));
    const handleTimeUpdate = () => setState(prev => ({ 
      ...prev, 
      currentTime: video.currentTime,
      duration: video.duration || 0 
    }));
    const handleVolumeChange = () => setState(prev => ({ 
      ...prev, 
      volume: video.volume,
      isMuted: video.muted 
    }));

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('volumechange', handleVolumeChange);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

  // Controls visibility management
  const showControlsTemporarily = useCallback(() => {
    setState(prev => ({ ...prev, showControls: true }));
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    controlsTimeoutRef.current = setTimeout(() => {
      setState(prev => ({ ...prev, showControls: false }));
    }, 3000);
  }, []);

  // Player controls
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (state.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.error);
    }
  }, [state.isPlaying]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!videoRef.current) return;
    videoRef.current.volume = Math.max(0, Math.min(1, volume));
  }, []);

  const toggleFullscreen = useCallback(async () => {
    console.log('Fullscreen toggle called');
    if (!containerRef.current) {
      console.log('No container ref');
      return;
    }

    try {
      // Check if already in fullscreen
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        (document as unknown as { mozFullScreenElement?: Element }).mozFullScreenElement ||
        (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
      );

      console.log('Currently fullscreen:', isCurrentlyFullscreen);

      if (isCurrentlyFullscreen) {
        // Exit fullscreen
        if (document.exitFullscreen) {
          console.log('Using document.exitFullscreen');
          await document.exitFullscreen();
        } else if ((document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen) {
          console.log('Using webkitExitFullscreen');
          await (document as unknown as { webkitExitFullscreen: () => Promise<void> }).webkitExitFullscreen();
        } else if ((document as unknown as { mozCancelFullScreen?: () => Promise<void> }).mozCancelFullScreen) {
          console.log('Using mozCancelFullScreen');
          await (document as unknown as { mozCancelFullScreen: () => Promise<void> }).mozCancelFullScreen();
        } else if ((document as unknown as { msExitFullscreen?: () => Promise<void> }).msExitFullscreen) {
          console.log('Using msExitFullscreen');
          await (document as unknown as { msExitFullscreen: () => Promise<void> }).msExitFullscreen();
        }
        setState(prev => ({ ...prev, isFullscreen: false }));
      } else {
        // Enter fullscreen
        const element = containerRef.current;
        if (element.requestFullscreen) {
          console.log('Using element.requestFullscreen');
          await element.requestFullscreen();
        } else if ((element as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
          console.log('Using webkitRequestFullscreen');
          await (element as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
        } else if ((element as unknown as { mozRequestFullScreen?: () => Promise<void> }).mozRequestFullScreen) {
          console.log('Using mozRequestFullScreen');
          await (element as unknown as { mozRequestFullScreen: () => Promise<void> }).mozRequestFullScreen();
        } else if ((element as unknown as { msRequestFullscreen?: () => Promise<void> }).msRequestFullscreen) {
          console.log('Using msRequestFullscreen');
          await (element as unknown as { msRequestFullscreen: () => Promise<void> }).msRequestFullscreen();
        } else {
          console.log('No fullscreen method available');
          throw new Error('Fullscreen not supported');
        }
        setState(prev => ({ ...prev, isFullscreen: true }));
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      
      // Fallback for mobile devices - try video element fullscreen
      if (videoRef.current) {
        try {
          if ((videoRef.current as unknown as { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
            console.log('Using video webkitEnterFullscreen');
            (videoRef.current as unknown as { webkitEnterFullscreen: () => void }).webkitEnterFullscreen();
          } else if (videoRef.current.requestFullscreen) {
            console.log('Using video requestFullscreen');
            await videoRef.current.requestFullscreen();
          }
        } catch (fallbackError) {
          console.error('Video fullscreen fallback error:', fallbackError);
          alert('Fullscreen is not supported on this device/browser');
        }
      }
    }
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(
        document.fullscreenElement ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ||
        (document as unknown as { mozFullScreenElement?: Element }).mozFullScreenElement ||
        (document as unknown as { msFullscreenElement?: Element }).msFullscreenElement
      );
      setState(prev => ({ ...prev, isFullscreen }));
    };

    // Add all possible fullscreen change event listeners
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(event => {
      document.addEventListener(event, handleFullscreenChange);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFullscreenChange);
      });
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!videoRef.current) return;

      switch (event.code) {
        case 'Space':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'KeyM':
          event.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'ArrowUp':
          event.preventDefault();
          setVolume(state.volume + 0.1);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setVolume(state.volume - 0.1);
          break;
        case 'ArrowRight':
          event.preventDefault();
          onChannelChange?.('next');
          break;
        case 'ArrowLeft':
          event.preventDefault();
          onChannelChange?.('prev');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.volume, onChannelChange, togglePlayPause, toggleMute, toggleFullscreen, setVolume]);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black rounded-lg overflow-hidden ${className}`}
      onMouseMove={showControlsTemporarily}
      onMouseEnter={showControlsTemporarily}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        playsInline
        controls={false}
        onClick={togglePlayPause}
      />

      {/* Loading Overlay */}
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="flex flex-col items-center space-y-4 text-white">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p className="text-sm">Loading {channel?.name}...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {state.error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-center text-white p-6">
            <h3 className="text-lg font-semibold mb-2">Playback Error</h3>
            <p className="text-sm text-gray-300 mb-4">{state.error}</p>
            <button
              onClick={() => channel?.url && loadStream(channel.url)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${
        state.showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="text-white">
              <h2 className="text-lg font-semibold">{channel?.name || 'No Channel'}</h2>
              {channel?.group && (
                <p className="text-sm text-gray-300">{channel.group}</p>
              )}
            </div>
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {state.isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Center Controls */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onChannelChange?.('prev')}
              className="text-white hover:text-gray-300 transition-colors"
              disabled={!onChannelChange}
            >
              <SkipBack className="w-8 h-8" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-3"
            >
              {state.isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </button>
            
            <button
              onClick={() => onChannelChange?.('next')}
              className="text-white hover:text-gray-300 transition-colors"
              disabled={!onChannelChange}
            >
              <SkipForward className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={togglePlayPause}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {state.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-300 transition-colors"
                >
                  {state.isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={state.isMuted ? 0 : state.volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-white hover:text-gray-300 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Always visible fullscreen button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 z-50 bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all p-2 rounded-lg"
        title="Toggle Fullscreen"
      >
        {state.isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
      </button>
    </div>
  );
}