import React, { useState, useEffect } from 'react';
import { ExternalLink, Star, Calendar, Tag, ChevronRight, LayoutGrid, Info, Loader2, Film } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { rpcCall } from '../api';
import { cn } from '../lib/utils';

interface MovieDetails {
  movieId: number;
  title: string;
  genres: string;
  genres_list: string;
  imdbId?: number;
  tmdbId?: number;
  overview?: string;
}

interface MovieDetailsProps {
  movieId: number;
  onSelectMovie: (id: number) => void;
  setGlobalLoading: (loading: boolean) => void;
}

export function MovieDetailsView({ movieId, onSelectMovie, setGlobalLoading }: MovieDetailsProps) {
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [recommendations, setRecommendations] = useState<MovieDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setGlobalLoading(true);
      try {
        console.log('[ACTION_START] Fetching details and recommendations for:', movieId);
        const [details, recs] = await Promise.all([
          rpcCall({ func: 'get_movie_details', args: { movie_id: movieId } }),
          rpcCall({ func: 'get_recommendations', args: { movie_id: movieId, top_n: 10 } })
        ]);
        setMovie(details);
        setRecommendations(recs);
      } catch (error) {
        console.error('Failed to fetch movie data:', error);
      } finally {
        setLoading(false);
        setGlobalLoading(false);
      }
    }
    fetchData();
  }, [movieId]);

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="h-[300px] bg-white/5 rounded-3xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Detail Section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent opacity-50" />
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center md:items-start text-center md:text-left">
          <div className="w-48 h-72 md:w-64 md:h-96 bg-zinc-800 rounded-2xl shadow-2xl flex-shrink-0 flex items-center justify-center border border-white/10 relative overflow-hidden group">
             <img src="./assets/card-cinema-seats.jpg" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-110 transition-transform duration-700" alt="Poster placeholder" />
             <Film className="h-16 w-16 text-amber-500/40" />
          </div>
          
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-bold font-heading tracking-tight text-white leading-tight">
                {movie.title}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                {movie.genres.split('|').map(genre => (
                  <Badge key={genre} variant="secondary" className="bg-white/5 hover:bg-white/10 text-amber-500 border-none px-3 py-1">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                <Info className="h-3 w-3" />
                Plot Summary
              </div>
              <p className="text-lg md:text-xl text-zinc-300 max-w-3xl leading-relaxed font-light">
                {movie.overview || "Experience this cinematic masterpiece. Explore details and related titles below based on genre profile matching."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              {movie.imdbId && (
                <Button variant="outline" className="border-white/10 hover:bg-amber-500 hover:text-black transition-all gap-2 h-12 px-6 rounded-xl" onClick={() => window.open(`https://www.imdb.com/title/tt${movie.imdbId.toString().padStart(7, '0')}`, '_blank')}>
                   <img src="./assets/logo-imdb.png" className="h-4 w-auto invert" alt="IMDb" />
                   View on IMDb
                   <ExternalLink className="h-4 w-4" />
                </Button>
              )}
              {movie.tmdbId && (
                <Button variant="outline" className="border-white/10 hover:bg-amber-500 hover:text-black transition-all gap-2 h-12 px-6 rounded-xl" onClick={() => window.open(`https://www.themoviedb.org/movie/${movie.tmdbId}`, '_blank')}>
                   <img src="./assets/logo-themoviedb.png" className="h-4 w-auto brightness-0 invert" alt="TMDb" />
                   View on TMDb
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recommendations Section */}
      <section className="space-y-10 py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold tracking-widest uppercase mb-2">
              <Star className="h-3 w-3 fill-current" />
              You might also like
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-heading text-white tracking-tight">
              Recommended <span className="text-amber-500">Movies</span>
            </h2>
            <p className="text-zinc-500 text-lg max-w-2xl">
              Our AI engine analyzed the genre profile of <span className="text-white italic">"{movie.title}"</span> to find these 10 similar titles for you.
            </p>
          </div>
          <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium bg-white/5 px-4 py-2 rounded-xl border border-white/5">
            <LayoutGrid className="h-4 w-4" />
            Grid View
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {recommendations.map((rec, idx) => (
            <Card 
              key={rec.movieId} 
              className="group cursor-pointer bg-zinc-900/40 border-white/5 hover:border-amber-500/50 transition-all hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7),0_0_20px_rgba(245,158,11,0.1)] overflow-hidden rounded-2xl flex flex-col h-full"
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => {
                onSelectMovie(rec.movieId);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="aspect-[16/9] relative overflow-hidden bg-zinc-800 flex-shrink-0">
                <img 
                  src={['./assets/card-film-reel.jpg', './assets/card-vintage-strip.jpg', './assets/card-bokeh-popcorn.jpg'][rec.movieId % 3]} 
                  className="w-full h-full object-cover opacity-50 group-hover:scale-110 group-hover:opacity-80 transition-all duration-700" 
                  alt={rec.title} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-amber-500 p-2 rounded-full shadow-lg">
                    <Play className="h-3 w-3 text-black fill-current" />
                  </div>
                </div>
              </div>
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight group-hover:text-amber-500 transition-colors">
                    {rec.title}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {rec.genres.split('|').slice(0, 3).map(genre => (
                      <span key={genre} className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded uppercase tracking-wider font-semibold border border-white/5">
                        {genre}
                      </span>
                    ))}
                    {rec.genres.split('|').length > 3 && (
                      <span className="text-[10px] text-zinc-500 font-bold">+{rec.genres.split('|').length - 3}</span>
                    )}
                  </div>
                </div>
                
                <div className="pt-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity border-t border-white/5">
                  <span className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Details</span>
                  <ChevronRight className="h-4 w-4 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
