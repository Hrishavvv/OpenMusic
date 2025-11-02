import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/SearchBar";
import SongCard from "@/components/SongCard";
import MusicPlayer from "@/components/MusicPlayer";
import NowPlaying from "@/components/NowPlaying";
import ParticleBackground from "@/components/ParticleBackground";
import { Search, Heart } from "lucide-react";
import { cleanName } from "@/lib/utils";

interface Song {
  id: string;
  name: string;
  artists: {
    primary: Array<{ name: string }>;
  };
  image: Array<{ quality: string; url: string }>;
  downloadUrl: Array<{ quality: string; url: string }>;
  duration: number;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [currentSong, setCurrentSong] = useState<{
    id: string;
    name: string;
    artists: string;
    image: string;
    url: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(-1);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["songs", activeSearch],
    queryFn: async () => {
      if (!activeSearch) return null;
      const response = await fetch(
        `https://saavn.sumit.co/api/search/songs?query=${encodeURIComponent(activeSearch)}&limit=50`
      );
      if (!response.ok) throw new Error("Failed to fetch songs");
      return response.json();
    },
    enabled: !!activeSearch,
  });

  const songs = searchResults?.data?.results || [];

  // Auto-search while typing (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        setActiveSearch(searchQuery.trim());
      } else {
        setActiveSearch("");
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Lock scroll on landing page only
  useEffect(() => {
    if (!activeSearch) {
      // Lock scroll on landing page
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
    } else {
      // Unlock scroll when search results are shown
      document.body.style.overflow = '';
      document.body.style.height = '';
    }

    return () => {
      // Cleanup
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [activeSearch]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveSearch(searchQuery.trim());
    }
  };

  const playSongAtIndex = (index: number) => {
    if (index < 0 || index >= songs.length) return;
    
    const song = songs[index];
    const highQualityAudio = song.downloadUrl.find((u: any) => u.quality === "320kbps") || 
                             song.downloadUrl.find((u: any) => u.quality === "160kbps") || 
                             song.downloadUrl[0];
    const highQualityImage = song.image.find((i: any) => i.quality === "500x500") || song.image[0];
    
    // Clean the names
    const cleanedName = cleanName(song.name);
    const cleanedArtists = song.artists.primary.map((a: any) => cleanName(a.name)).filter(Boolean).join(", ");
    
    const newSong = {
      id: song.id,
      name: cleanedName,
      artists: cleanedArtists,
      image: highQualityImage.url,
      url: highQualityAudio.url,
    };

    setCurrentSong(newSong);
    setCurrentSongIndex(index);
    setIsPlaying(true);
  };

  const handlePlaySong = (song: Song) => {
    const index = songs.findIndex((s: Song) => s.id === song.id);
    
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      playSongAtIndex(index);
    }
  };

  const handleNext = () => {
    if (songs.length === 0) return;
    const nextIndex = (currentSongIndex + 1) % songs.length;
    playSongAtIndex(nextIndex);
  };

  const handlePrevious = () => {
    if (songs.length === 0) return;
    const prevIndex = currentSongIndex - 1 < 0 ? songs.length - 1 : currentSongIndex - 1;
    playSongAtIndex(prevIndex);
  };

  const handleSongEnd = () => {
    // Autoplay next song
    handleNext();
  };

  const handlePlayerClick = () => {
    if (currentSong) {
      setShowNowPlaying(true);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Now Playing Full Screen */}
      {showNowPlaying && currentSong && (
        <NowPlaying
          currentSong={currentSong}
          isPlaying={isPlaying}
          onClose={() => setShowNowPlaying(false)}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      )}

      {/* Header */}
      <header className="border-b border-border/30 bg-background/90 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4 md:py-5">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
            <div className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 rounded-xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-md">
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-accent-foreground" />
            </div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">Search</h1>
          </div>
          <SearchBar 
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
          />
        </div>
      </header>

      {/* Particle Background - Only on landing page */}
      {!activeSearch && <ParticleBackground />}

      {/* Main Content */}
      <main className={`container mx-auto px-4 ${!activeSearch ? 'min-h-[calc(100vh-140px)] sm:min-h-[calc(100vh-160px)] flex flex-col' : 'py-4 sm:py-6'}`}>
        {!activeSearch && (
          <div className="flex flex-col items-center justify-center flex-1 text-center animate-fade-in py-8 sm:py-12 relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-3 sm:mb-4 bg-gradient-to-r from-accent via-accent/80 to-accent/60 bg-clip-text text-transparent px-4">
              OpenMusic
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-md px-4 sm:px-6 font-medium">
              Stream millions of songs, playlists, and albums instantly for free
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-10 w-10 rounded-full border-[3px] border-accent/30 border-t-accent animate-spin" />
              <p className="text-muted-foreground text-sm font-medium">Searching...</p>
            </div>
          </div>
        )}

        {searchResults?.data?.results && (
          <div>
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                {searchResults.data.total} results
              </h2>
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              {searchResults.data.results.map((song: Song) => {
                const cleanedName = cleanName(song.name);
                const cleanedArtists = song.artists.primary.map(a => cleanName(a.name)).filter(Boolean).join(", ");
                
                return (
                  <SongCard
                    key={song.id}
                    id={song.id}
                    name={cleanedName}
                    artists={cleanedArtists}
                    image={song.image.find(i => i.quality === "150x150")?.url || song.image[0].url}
                    duration={song.duration}
                    isPlaying={currentSong?.id === song.id && isPlaying}
                    onPlay={() => handlePlaySong(song)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Attribution - Always at bottom, middle-oriented */}
        {!activeSearch ? (
          <div className="pb-4 sm:pb-6 text-center mt-auto">
            <p className="text-xs sm:text-sm bg-gradient-to-r from-muted-foreground via-accent/80 to-muted-foreground bg-clip-text text-transparent font-medium px-4">
              Made with <Heart className="inline-block h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent fill-accent mx-0.5 animate-pulse" /> by Hrishav
            </p>
          </div>
        ) : (
          <div className="mt-8 sm:mt-12 pt-6 text-center">
            <p className="text-xs sm:text-sm bg-gradient-to-r from-muted-foreground via-accent/80 to-muted-foreground bg-clip-text text-transparent font-medium">
              Made with <Heart className="inline-block h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent fill-accent mx-0.5 animate-pulse" /> by Hrishav
            </p>
          </div>
        )}
      </main>

      {/* Music Player */}
      <div onClick={handlePlayerClick} className="cursor-pointer">
        <MusicPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onSongEnd={handleSongEnd}
          hideOnMobile={showNowPlaying}
        />
      </div>
    </div>
  );
};

export default Index;
