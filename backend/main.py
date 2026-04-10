from .enrichment import get_movie_overview
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
import os
import json
import hashlib

# Configuration
MOVIES_PATH = 'repo/movies.csv'
LINKS_PATH = 'repo/links.csv'
CACHE_DIR = 'apps/movie_explorer/backend/data/cache'

# Global state for caching the recommender instance across calls within the same container
_recommender_instance = None

class MovieRecommender:
    def __init__(self, movies_path=MOVIES_PATH, links_path=LINKS_PATH):
        print(f"[BACKEND_STEP] Initializing MovieRecommender with {movies_path}")
        if not os.path.exists(movies_path):
            print(f"[BACKEND_ERROR] Movies file not found at {movies_path}")
            raise FileNotFoundError(f"Movies file not found at {movies_path}")
        
        self.movies = pd.read_csv(movies_path)
        print(f"[BACKEND_STEP] Loaded {len(self.movies)} movies")
        
        if os.path.exists(links_path):
            self.links = pd.read_csv(links_path)
            print(f"[BACKEND_STEP] Loaded {len(self.links)} links")
        else:
            self.links = None
            print(f"[BACKEND_STEP] Links file not found at {links_path}")
        
        # Preprocessing: genres are pipe-separated in the CSV
        self.movies['genres_list'] = self.movies['genres'].fillna('').str.replace('|', ' ', regex=False)
        
        # TF-IDF on genres
        self.tfidf = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = self.tfidf.fit_transform(self.movies['genres_list'])
        print(f"[BACKEND_STEP] TF-IDF matrix built: {self.tfidf_matrix.shape}")
        
    def get_movie_by_id(self, movie_id):
        match = self.movies[self.movies['movieId'] == movie_id]
        if match.empty:
            return None
        movie = match.iloc[0].to_dict()
        if self.links is not None:
            link_match = self.links[self.links['movieId'] == movie_id]
            if not link_match.empty:
                movie.update(link_match.iloc[0].to_dict())
        return movie

    def get_recommendations_by_id(self, movie_id, top_n=10):
        # Find the movie index
        idx_list = self.movies.index[self.movies['movieId'] == movie_id].tolist()
        if not idx_list:
            print(f"[BACKEND_STEP] Movie ID {movie_id} not found")
            return []
        
        idx = idx_list[0]
        target_vector = self.tfidf_matrix[idx]
        
        # Compute cosine similarity for this movie against all others
        # Use linear_kernel for efficient sparse matrix dot product (equivalent to cosine_similarity when vectors are normalized)
        cosine_sim = linear_kernel(target_vector, self.tfidf_matrix).flatten()
        
        # Get top indices
        sim_scores = list(enumerate(cosine_sim))
        # Sort by similarity score
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        # Skip the first one (it's the movie itself) and take top_n
        sim_scores = sim_scores[1:top_n+1]
        
        movie_indices = [i[0] for i in sim_scores]
        results_df = self.movies.iloc[movie_indices].copy()
        
        # Add links if available
        if self.links is not None:
            results_df = results_df.merge(self.links, on='movieId', how='left')
            
        # Clean up for JSON serialization (handle NaN)
        results = results_df.where(pd.notnull(results_df), None).to_dict(orient='records')
        return results

    def search_movies(self, query, limit=10):
        if not query:
            return []
        matches = self.movies[self.movies['title'].str.contains(query, case=False, na=False)].head(limit)
        results = matches.where(pd.notnull(matches), None).to_dict(orient='records')
        return results

def _get_recommender():
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = MovieRecommender()
    return _recommender_instance

def _cache_key(prefix, **kwargs):
    raw = json.dumps(kwargs, sort_keys=True)
    return f"{prefix}_{hashlib.sha256(raw.encode()).hexdigest()[:12]}"

def _read_cache(key):
    path = os.path.join(CACHE_DIR, f"{key}.json")
    if os.path.exists(path):
        print(f"[BACKEND_STEP] cache_hit for key={key}")
        with open(path) as f:
            return json.load(f)
    print(f"[BACKEND_STEP] cache_miss for key={key}")
    return None

def _write_cache(key, data):
    os.makedirs(CACHE_DIR, exist_ok=True)
    path = os.path.join(CACHE_DIR, f"{key}.json")
    with open(path, "w") as f:
        json.dump(data, f)
    print(f"[BACKEND_STEP] cache_write for key={key}")

# RPC Functions

def search_movies(query: str, limit: int = 10):
    """Search for movies by title for autocomplete/search results."""
    print(f"[BACKEND_START] search_movies with query='{query}', limit={limit}")
    try:
        recommender = _get_recommender()
        results = recommender.search_movies(query, limit)
        # We don't cache search results as they are usually fast and dynamic
        print(f"[BACKEND_SUCCESS] search_movies found {len(results)} results")
        return results
    except Exception as e:
        print(f"[BACKEND_ERROR] search_movies failed: {type(e).__name__}: {str(e)}")
        raise

def get_recommendations(movie_id: int, top_n: int = 10):
    """Given a movieId, find the top N similar movies based on genres."""
    print(f"[BACKEND_START] get_recommendations with movie_id={movie_id}, top_n={top_n}")
    try:
        cache_key = _cache_key("recs", movie_id=movie_id, top_n=top_n)
        cached = _read_cache(cache_key)
        if cached:
            print(f"[BACKEND_SUCCESS] get_recommendations returned from cache")
            return cached
            
        recommender = _get_recommender()
        results = recommender.get_recommendations_by_id(movie_id, top_n)
        
        _write_cache(cache_key, results)
        print(f"[BACKEND_SUCCESS] get_recommendations found {len(results)} recommendations")
        return results
    except Exception as e:
        print(f"[BACKEND_ERROR] get_recommendations failed: {type(e).__name__}: {str(e)}")
        raise

def get_movie_details(movie_id: int):
    """Get detailed info for a single movie."""
    print(f"[BACKEND_START] get_movie_details with movie_id={movie_id}")
    try:
        cache_key = _cache_key("details", movie_id=movie_id)
        cached = _read_cache(cache_key)
        if cached:
            print(f"[BACKEND_SUCCESS] get_movie_details returned from cache")
            return cached
            
        recommender = _get_recommender()
        movie = recommender.get_movie_by_id(movie_id)
        
        if movie:
            # Handle NaN values for JSON
            movie = {k: (v if pd.notnull(v) else None) for k, v in movie.items()}
            
            # Enrich with overview if tmdbId is present
            if movie.get('tmdbId'):
                try:
                    movie['overview'] = get_movie_overview(movie['tmdbId'])
                except Exception as enrichment_err:
                    print(f"[BACKEND_ERROR] Enrichment failed: {str(enrichment_err)}")
                    movie['overview'] = None
            
            _write_cache(cache_key, movie)
            print(f"[BACKEND_SUCCESS] get_movie_details found details for movie_id={movie_id}")
            return movie
        else:
            print(f"[BACKEND_SUCCESS] get_movie_details found no movie for movie_id={movie_id}")
            return None
    except Exception as e:
        print(f"[BACKEND_ERROR] get_movie_details failed: {type(e).__name__}: {str(e)}")
        raise

__all__ = ["search_movies", "get_recommendations", "get_movie_details"]
