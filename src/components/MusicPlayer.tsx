import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

interface MusicPlayerProps {
  currentSong: {
    id: string;
    name: string;
    artists: string;
    image: string;
    url: string;
  } | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSongEnd?: () => void;
  hideOnMobile?: boolean;
}

const MusicPlayer = ({ currentSong, isPlaying, onPlayPause, onNext, onPrevious, onSongEnd, hideOnMobile }: MusicPlayerProps) => {
  const internalAudioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  useEffect(() => {
    const audio = internalAudioRef.current;
    if (audio && currentSong) {
      // Only reload if the song URL actually changed
      if (audio.src !== currentSong.url) {
        audio.src = currentSong.url;
        audio.load();
      }
      
      // Handle play state after audio metadata is loaded
      const handleCanPlay = () => {
        if (isPlaying) {
          audio.play().catch(err => console.error("Playback error:", err));
        }
      };
      
      audio.addEventListener('canplay', handleCanPlay);
      
      return () => {
        audio.removeEventListener('canplay', handleCanPlay);
      };
    }
  }, [currentSong?.id, currentSong?.url]); // Only reload when song changes, not when isPlaying changes

  // Separate effect to handle play/pause for existing song
  useEffect(() => {
    const audio = internalAudioRef.current;
    if (!audio || !currentSong) return;
    
    // Only handle play/pause if audio is already loaded (not initial load)
    if (audio.readyState >= 2) { // HAVE_CURRENT_DATA
      if (isPlaying) {
        audio.play().catch(err => console.error("Playback error:", err));
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, currentSong?.id]);

  useEffect(() => {
    const audio = internalAudioRef.current;
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleTimeUpdate = () => {
    const audio = internalAudioRef.current;
    if (audio) {
      // Preserve current time when paused - don't reset to 0
      const newTime = audio.currentTime;
      if (!isNaN(newTime) && isFinite(newTime) && newTime >= 0) {
        setCurrentTime(prevTime => {
          // If audio is paused and getting 0, but we had a time before, keep the previous time
          if (audio.paused && newTime === 0 && prevTime > 0) {
            return prevTime;
          }
          // Otherwise update to the new time
          return newTime;
        });
      }
    }
  };

  const handleLoadedMetadata = () => {
    const audio = internalAudioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  };

  const handleEnded = () => {
    if (isRepeat) {
      const audio = internalAudioRef.current;
      if (audio) {
        audio.currentTime = 0;
        audio.play();
      }
    } else if (onSongEnd) {
      onSongEnd();
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = internalAudioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSong) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-[var(--player-bg)]/95 border-t border-border/50 backdrop-blur-xl z-50 animate-slide-up shadow-[0_-4px_24px_rgba(0,0,0,0.3)] ${hideOnMobile ? 'md:block hidden' : ''}`}>
      <audio
        ref={internalAudioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
      
      <div className="container mx-auto px-4 py-3 sm:py-4">
        {/* Desktop Layout - Hidden on mobile */}
        <div className="hidden md:flex items-center gap-4">
          {/* Song Info - Left */}
          <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[280px] sm:max-w-[320px]">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0 shadow-md">
              <img 
                src={currentSong.image} 
                alt={currentSong.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-foreground truncate text-sm sm:text-base">{currentSong.name}</h4>
              <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">{currentSong.artists}</p>
            </div>
          </div>

          {/* Center - Controls & Progress */}
          <div className="flex flex-col items-center gap-2.5 flex-1 max-w-2xl">
            {/* Playback Controls */}
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsShuffle(!isShuffle)}
                className={`h-9 w-9 rounded-full hover:bg-secondary transition-colors ${isShuffle ? 'text-accent' : 'text-muted-foreground'}`}
              >
                <Shuffle className="h-4 w-4" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={onPrevious}
                className="h-9 w-9 rounded-full hover:bg-secondary text-foreground transition-colors"
              >
                <SkipBack className="h-4 w-4 fill-current" />
              </Button>

              <Button 
                size="icon" 
                onClick={onPlayPause}
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-foreground text-background hover:bg-foreground hover:scale-105 transition-all shadow-lg"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 sm:h-6 sm:w-6 fill-current" />
                ) : (
                  <Play className="h-5 w-5 sm:h-6 sm:w-6 fill-current ml-0.5" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={onNext}
                className="h-9 w-9 rounded-full hover:bg-secondary text-foreground transition-colors"
              >
                <SkipForward className="h-4 w-4 fill-current" />
              </Button>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsRepeat(!isRepeat)}
                className={`h-9 w-9 rounded-full hover:bg-secondary transition-colors ${isRepeat ? 'text-accent' : 'text-muted-foreground'}`}
              >
                <Repeat className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-xs text-muted-foreground min-w-[42px] text-right font-medium">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1 cursor-pointer"
              />
              <span className="text-xs text-muted-foreground min-w-[42px] font-medium">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right - Volume */}
          <div className="hidden lg:flex items-center gap-2 w-32">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleMute}
              className="h-8 w-8 rounded-full hover:bg-secondary"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Volume2 className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => {
                setVolume(value[0] / 100);
                if (isMuted && value[0] > 0) setIsMuted(false);
              }}
              className="flex-1"
            />
          </div>
        </div>

        {/* Mobile Layout - Only song info visible, controls moved to NowPlaying */}
        <div className="flex md:hidden items-center gap-3">
          {/* Song Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-12 h-12 rounded overflow-hidden bg-secondary flex-shrink-0">
              <img 
                src={currentSong.image} 
                alt={currentSong.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-foreground truncate">{currentSong.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{currentSong.artists}</p>
            </div>
          </div>

          {/* Play Button */}
          <Button 
            size="icon" 
            onClick={onPlayPause}
            className="h-10 w-10 rounded-full bg-foreground text-background hover:bg-foreground flex-shrink-0"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
