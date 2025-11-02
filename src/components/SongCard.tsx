import { Play, Pause } from "lucide-react";

interface SongCardProps {
  id: string;
  name: string;
  artists: string;
  image: string;
  duration: number;
  isPlaying: boolean;
  onPlay: () => void;
}

const SongCard = ({ name, artists, image, duration, isPlaying, onPlay }: SongCardProps) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="group relative bg-card/30 hover:bg-card/50 rounded-lg transition-all duration-200 cursor-pointer animate-fade-in border border-transparent hover:border-border/30"
      onClick={onPlay}
    >
      <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3">
        <div className="relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-secondary shadow-sm group-hover:shadow-md transition-shadow">
          <img 
            src={image} 
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className={`absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center transition-all duration-200 ${
            isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}>
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
              {isPlaying ? (
                <Pause className="h-4 w-4 sm:h-5 sm:w-5 fill-current" />
              ) : (
                <Play className="h-4 w-4 sm:h-5 sm:w-5 fill-current ml-0.5" />
              )}
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm sm:text-base mb-1">{name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{artists}</p>
        </div>
        
        <div className="text-xs sm:text-sm text-muted-foreground pr-2 sm:pr-3 font-medium">
          {formatDuration(duration)}
        </div>
      </div>
    </div>
  );
};

export default SongCard;
