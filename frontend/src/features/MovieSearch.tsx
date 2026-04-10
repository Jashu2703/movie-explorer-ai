import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, Film, Clapperboard, Star } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import { rpcCall } from '../api';

interface Movie {
  movieId: number;
  title: string;
  genres: string;
  genres_list: string;
}

interface MovieSearchProps {
  onSelectMovie: (movieId: number) => void;
  isInitializing: boolean;
}

export function MovieSearch({ onSelectMovie, isInitializing }: MovieSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 1) {
        setLoading(true);
        setIsOpen(true);
        try {
          console.log('[ACTION_START] Searching movies for:', query);
          const data = await rpcCall({ func: 'search_movies', args: { query, limit: 8 } });
          setResults(data);
        } catch (error) {
          console.error('Search failed:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={containerRef}>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {loading ? (
            <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
          ) : (
            <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-amber-500 transition-colors" />
          )}
        </div>
        <Input
          type="text"
          placeholder={isInitializing ? "Engine initializing... please wait" : "Search 87,000+ movies by title..."}
          className={cn(
            "pl-11 h-14 text-lg bg-black/40 backdrop-blur-md border-white/10 focus:border-amber-500/50 focus:ring-amber-500/20 rounded-2xl transition-all shadow-2xl",
            isInitializing && "opacity-50 cursor-not-allowed"
          )}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isInitializing}
          onFocus={() => query.length > 1 && setIsOpen(true)}
        />
      </div>

      {isOpen && (results.length > 0 || loading) && (
        <Card className="absolute z-50 w-full mt-2 bg-zinc-900/95 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Searching library...
              </div>
            ) : (
              results.map((movie) => (
                <button
                  key={movie.movieId}
                  onClick={() => {
                    onSelectMovie(movie.movieId);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="w-full flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors group text-left"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                    <Film className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate group-hover:text-amber-400 transition-colors">
                      {movie.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {movie.genres.replace(/\|/g, ' • ')}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
