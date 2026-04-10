import React, { useState, useEffect, useCallback } from 'react';
import { Film, Clapperboard, Star, Info, Loader2, Play, ChevronRight, Github } from 'lucide-react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { rpcCall } from './api';
import { cn } from './lib/utils';
import { MovieSearch } from './features/MovieSearch';
import { MovieDetailsView } from './features/MovieDetails';

export default function App() {
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Check backend readiness
  useEffect(() => {
    async function checkReadiness() {
      try {
        // First search call will trigger initialization if needed
        console.log('[FETCH_START] Checking backend readiness...');
        await rpcCall({ func: 'search_movies', args: { query: 'Toy Story', limit: 1 } });
        setIsInitializing(false);
        console.log('[FETCH_RESPONSE] Backend ready.');
      } catch (error) {
        console.error('Readiness check failed, retrying...', error);
        setTimeout(checkReadiness, 2000);
      }
    }
    checkReadiness();
  }, []);

  useEffect(() => {
    console.log("RENDER_SUCCESS");
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 selection:bg-amber-500 selection:text-black">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-[60] glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedMovieId(null)}>
            <div className="bg-amber-500 p-1.5 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Clapperboard className="h-6 w-6 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-xl tracking-tighter text-white">MOVIE<span className="text-amber-500">EXPLORER</span></span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => setSelectedMovieId(null)} className="text-sm font-medium hover:text-amber-500 transition-colors">Discovery</button>
            <button className="text-sm font-medium hover:text-amber-500 transition-colors opacity-50 cursor-not-allowed">Top Rated</button>
            <button className="text-sm font-medium hover:text-amber-500 transition-colors opacity-50 cursor-not-allowed">Box Office</button>
          </nav>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="border-amber-500/20 text-amber-500/80 bg-amber-500/5 hidden sm:flex">
               87k+ Titles
            </Badge>
          </div>
        </div>
      </header>

      <main className="pt-16 pb-20">
        {/* Hero Section - Only shown when no movie selected */}
        {!selectedMovieId && (
          <div className="relative h-[85vh] flex items-center justify-center overflow-hidden">
             {/* Dynamic Background */}
             <div 
               className="absolute inset-0 bg-cover bg-center animate-slow-zoom" 
               style={{ backgroundImage: "url('./assets/hero-cinema-screen.jpg')", filter: 'brightness(0.3) saturate(1.2)' }}
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
             <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-[#050505]" />
             
             <div className="relative z-10 max-w-4xl w-full px-6 text-center space-y-10">
               <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                 <Badge variant="secondary" className="bg-amber-500 text-black font-bold px-4 py-1.5 text-xs tracking-widest uppercase mb-4 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                    Now Premiering
                 </Badge>
                 <h1 className="text-5xl md:text-8xl font-bold font-heading tracking-tight text-white leading-[0.9]">
                   THE NEXT GENERATION OF <span className="text-amber-500">DISCOVERY</span>
                 </h1>
                 <p className="text-zinc-400 text-lg md:text-2xl max-w-2xl mx-auto font-light leading-relaxed">
                   AI-powered recommendations based on a deep library of 87,000+ films. Start your cinematic journey below.
                 </p>
               </div>

               <div className="animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                 <MovieSearch onSelectMovie={setSelectedMovieId} isInitializing={isInitializing} />
                 
                 {isInitializing && (
                   <div className="mt-6 flex flex-col items-center gap-3">
                     <div className="flex items-center gap-2 text-amber-500/80 font-medium">
                       <Loader2 className="h-5 w-5 animate-spin" />
                       Recommendation Engine is initializing...
                     </div>
                     <p className="text-zinc-500 text-sm italic">This takes about 20s on first load as we build the TF-IDF matrix.</p>
                   </div>
                 )}
               </div>
             </div>

             {/* Bottom Scroll Indicator */}
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
               <div className="w-px h-12 bg-gradient-to-b from-amber-500 to-transparent" />
               <span className="text-[10px] uppercase tracking-[0.2em]">Explore</span>
             </div>
          </div>
        )}

        {/* Selected Movie View */}
        {selectedMovieId && (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 space-y-16">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
              <Button 
                variant="ghost" 
                className="text-zinc-400 hover:text-amber-500 transition-all gap-2 -ml-4 group"
                onClick={() => setSelectedMovieId(null)}
              >
                <ChevronRight className="h-5 w-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                Back to Discovery
              </Button>
              <div className="w-full max-w-md">
                <MovieSearch onSelectMovie={setSelectedMovieId} isInitializing={isInitializing} />
              </div>
            </div>

            <MovieDetailsView 
              movieId={selectedMovieId} 
              onSelectMovie={setSelectedMovieId} 
              setGlobalLoading={setGlobalLoading}
            />
          </div>
        )}

        {/* Features / Why us section */}
        {!selectedMovieId && (
          <section className="max-w-7xl mx-auto px-4 md:px-6 py-32 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto md:mx-0">
                  <Film className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white font-heading">Massive Library</h3>
                <p className="text-zinc-500">Access metadata for over 87,000 films, from silent classics to modern blockbusters.</p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto md:mx-0">
                  <Clapperboard className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white font-heading">AI Recommendations</h3>
                <p className="text-zinc-500">Advanced TF-IDF genre profile matching ensures you find exactly what you're looking for.</p>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto md:mx-0">
                  <Star className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-white font-heading">External Links</h3>
                <p className="text-zinc-500">Direct integration with IMDb and TMDb for full cast, crew, and trailer details.</p>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-white/5 py-12 px-4 text-center space-y-6 bg-black/40">
        <div className="flex items-center justify-center gap-2">
           <Clapperboard className="h-5 w-5 text-amber-500" />
           <span className="font-heading font-bold tracking-tighter text-white">MOVIEEXPLORER</span>
        </div>
        <p className="text-zinc-500 text-sm max-w-md mx-auto">
          Built for cinephiles. Powered by Scikit-Learn and React. All movie data sourced from MovieLens datasets.
        </p>
        <div className="flex justify-center gap-6">
           <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-amber-500"><Github className="h-5 w-5" /></Button>
        </div>
        <p className="text-zinc-700 text-[10px] tracking-[0.3em] uppercase pt-4">© 2026 Movie Explorer Platform</p>
      </footer>
    </div>
  );
}
