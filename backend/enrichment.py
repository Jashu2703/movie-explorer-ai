import os
import json

# Cache directory
CACHE_DIR = 'apps/movie_explorer/backend/data/cache/enrichment'
os.makedirs(CACHE_DIR, exist_ok=True)

def _get_cache_path(tmdb_id):
    return os.path.join(CACHE_DIR, f"tmdb_{tmdb_id}.json")

def get_movie_overview(tmdb_id):
    """
    Safe fallback function for movie overview.
    Currently returns None but keeps caching structure intact.
    """

    if not tmdb_id:
        return None

    cache_path = _get_cache_path(tmdb_id)

    # Return from cache if exists
    if os.path.exists(cache_path):
        with open(cache_path) as f:
            return json.load(f).get('overview')

    print(f"[BACKEND_STEP] Skipping external API for TMDb ID: {tmdb_id}")

    overview = None  # No external API call

    # Cache result
    with open(cache_path, 'w') as f:
        json.dump({'overview': overview}, f)

    return overview
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/search")
def search(query: str):
    return search_movies(query)

@app.get("/recommend")
def recommend(movie_id: int):
    return get_recommendations(movie_id)

@app.get("/movie")
def movie(movie_id: int):
    return get_movie_details(movie_id)