import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

const SearchBar = ({ value, onChange, onSearch }: SearchBarProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground z-10" />
      <Input
        type="text"
        placeholder="What do you want to listen to?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="pl-10 sm:pl-12 h-11 sm:h-12 text-sm sm:text-base bg-card/60 border-border/50 rounded-full shadow-md focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:border-accent/50 transition-all backdrop-blur-sm"
      />
    </div>
  );
};

export default SearchBar;
