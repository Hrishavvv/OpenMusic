import { useState, useEffect, useRef } from "react";
import { ChevronDown, MoreHorizontal, Play, Pause, SkipBack, SkipForward, Repeat, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface NowPlayingProps {
  currentSong: {
    id: string;
    name: string;
    artists: string;
    image: string;
    url: string;
  };
  isPlaying: boolean;
  onClose: () => void;
  onPlayPause: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

const NowPlaying = ({ currentSong, isPlaying, onClose, onPlayPause, onNext, onPrevious }: NowPlayingProps) => {
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Get MusicPlayer's audio element (the one actually playing)
  const getMusicPlayerAudio = () => {
    // Find all audio elements in the DOM
    const audioElements = Array.from(document.querySelectorAll('audio'));
    const thisAudio = audioRef.current;
    
    // Filter out this component's audio element
    const otherAudios = audioElements.filter(audio => audio !== thisAudio);
    
    // Try to find one that's actually playing or has the current song
    if (currentSong?.url) {
      // First, try to find the one that's not paused and has the same URL
      const playingAudio = otherAudios.find(audio => {
        if (!audio.src) return false;
        const audioUrl = audio.src.toLowerCase();
        const songUrl = currentSong.url.toLowerCase();
        const urlMatches = audioUrl.includes(songUrl) || songUrl.includes(audioUrl) || 
                          audioUrl.endsWith(songUrl) || songUrl.endsWith(audioUrl);
        return (!audio.paused || audio.currentTime > 0) && urlMatches;
      });
      
      if (playingAudio) return playingAudio;
      
      // If not playing, find by URL match
      const urlMatch = otherAudios.find(audio => {
        if (!audio.src) return false;
        const audioUrl = audio.src.toLowerCase();
        const songUrl = currentSong.url.toLowerCase();
        return audioUrl.includes(songUrl) || songUrl.includes(audioUrl) || 
               audioUrl.endsWith(songUrl) || songUrl.endsWith(audioUrl);
      });
      
      if (urlMatch) return urlMatch;
    }
    
    // Fallback to any other audio (not this component's)
    return otherAudios[0] || null;
  };

  // Lock scroll on mobile when component is mounted
  useEffect(() => {
    const isMobile = window.innerWidth < 768; // md breakpoint
    if (isMobile) {
      // Prevent scrolling on body
      document.body.style.overflow = 'hidden';
      // Also prevent touch scrolling on iOS
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    }

    return () => {
      // Restore scrolling when component unmounts
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, []);

  // Sync audio with MusicPlayer - use same URL
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && currentSong) {
      audio.src = currentSong.url;
      audio.load();
    }
  }, [currentSong?.id]);

  // Sync progress bar with MusicPlayer's audio (which is actually playing)
  useEffect(() => {
    if (!currentSong) return;

    let musicPlayerAudio: HTMLAudioElement | null = null;
    let intervalId: number | null = null;

    const updateProgress = () => {
      // Always try to find the audio element fresh (in case DOM changed)
      const audio = getMusicPlayerAudio();
      
      // Update musicPlayerAudio if we found a different one
      if (audio && audio !== musicPlayerAudio) {
        // Remove old listeners if audio changed
        if (musicPlayerAudio) {
          musicPlayerAudio.removeEventListener('timeupdate', updateProgress);
          musicPlayerAudio.removeEventListener('loadedmetadata', updateProgress);
          musicPlayerAudio.removeEventListener('canplay', updateProgress);
        }
        
        // Attach to new audio
        musicPlayerAudio = audio;
        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('loadedmetadata', updateProgress);
        audio.addEventListener('canplay', updateProgress);
      }
      
      if (musicPlayerAudio) {
        try {
          const newTime = musicPlayerAudio.currentTime;
          const newDuration = musicPlayerAudio.duration;
          
          // Update duration if valid and not NaN
          if (!isNaN(newDuration) && isFinite(newDuration) && newDuration > 0) {
            setDuration(newDuration);
          }
          
          // Only update currentTime if we have a valid value (don't reset to 0 when paused)
          if (!isNaN(newTime) && isFinite(newTime) && newTime >= 0) {
            // When paused, the audio element should still have the correct currentTime
            // Only update if we get a valid time (not 0 unless the song is actually at the beginning)
            // This prevents the progress bar from jumping to 0 when paused
            setCurrentTime(prevTime => {
              // If audio is paused and getting 0, but we had a time before, keep the previous time
              if (musicPlayerAudio.paused && newTime === 0 && prevTime > 0) {
                return prevTime;
              }
              // Otherwise update to the new time
              return newTime;
            });
          }
        } catch (error) {
          // Silently handle any errors accessing audio properties
          console.debug('Error updating progress:', error);
        }
      }
    };

    // Update immediately
    updateProgress();

    // Update every 50ms - this will keep trying to find and sync with audio
    intervalId = window.setInterval(updateProgress, 50);

    return () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
      }
      if (musicPlayerAudio) {
        musicPlayerAudio.removeEventListener('timeupdate', updateProgress);
        musicPlayerAudio.removeEventListener('loadedmetadata', updateProgress);
        musicPlayerAudio.removeEventListener('canplay', updateProgress);
      }
    };
  }, [currentSong?.id, currentSong?.url, isPlaying]);

  // Handle seek - seek MusicPlayer's audio (the actual playback)
  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    const musicPlayerAudio = getMusicPlayerAudio();
    if (musicPlayerAudio) {
      try {
        musicPlayerAudio.currentTime = seekTime;
        setCurrentTime(seekTime);
      } catch (error) {
        console.debug('Error seeking audio:', error);
      }
    }
  };

  // Format time
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-background via-background to-card z-50 animate-slide-up md:overflow-y-auto overflow-hidden">
      <audio
        ref={audioRef}
        style={{ display: 'none' }}
      />
      <div className="min-h-full flex flex-col p-4 sm:p-6 md:pb-8 pb-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-10 w-10 rounded-full hover:bg-secondary"
          >
            <ChevronDown className="h-6 w-6" />
          </Button>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Playing from Search
          </span>
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full hover:bg-secondary"
          >
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </div>

        {/* Album Art */}
        <div className="flex md:flex-1 items-center justify-center mb-4 md:mb-8">
          <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden shadow-2xl animate-scale-in border border-border/20">
            <img
              src={currentSong.image}
              alt={currentSong.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Song Info & Controls - Only visible on mobile */}
        <div className="w-full max-w-md mx-auto md:hidden flex flex-col justify-between flex-1 pb-2">
          {/* Song Info - Centered */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate mb-2 px-4">
              {currentSong.name}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground truncate px-4">
              {currentSong.artists}
            </p>
          </div>

          {/* Progress Bar - Spotify style */}
          <div className="space-y-2">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="w-full cursor-pointer"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Playback Controls - Spotify style */}
          <div className="flex items-center justify-center gap-6">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsShuffle(!isShuffle)}
              className={`h-10 w-10 rounded-full hover:bg-secondary transition-colors ${
                isShuffle ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              <Shuffle className="h-5 w-5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onPrevious}
              className="h-12 w-12 rounded-full hover:bg-secondary text-foreground"
            >
              <SkipBack className="h-6 w-6 fill-current" />
            </Button>

            <Button
              size="icon"
              onClick={onPlayPause}
              className="h-16 w-16 rounded-full bg-foreground text-background hover:bg-foreground hover:scale-105 transition-all shadow-xl"
            >
              {isPlaying ? (
                <Pause className="h-7 w-7 fill-current" />
              ) : (
                <Play className="h-7 w-7 fill-current ml-1" />
              )}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={onNext}
              className="h-12 w-12 rounded-full hover:bg-secondary text-foreground"
            >
              <SkipForward className="h-6 w-6 fill-current" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsRepeat(!isRepeat)}
              className={`h-10 w-10 rounded-full hover:bg-secondary transition-colors ${
                isRepeat ? 'text-accent' : 'text-muted-foreground'
              }`}
            >
              <Repeat className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowPlaying;
