# Movie Explorer 🎬

A professional-grade movie recommendation engine built with React and Python.

## Features
- **Cinematic UI**: Dark-mode interface with a modern aesthetic.
- **AI Recommendations**: Genre-based similarity matching using TF-IDF.
- **Enriched Data**: Real-time plot summaries and direct links to IMDb/TMDb.
- **Stateless Backend**: Fast, lightweight API built with Python.

## Getting Started

### Backend Setup
1. Navigate to `backend/`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. Install dependencies: `pip install -r requirements.txt`
5. Run the server: `python main.py`

### Frontend Setup
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`
4. Build for production: `npm run build`

## Project Structure
- \`backend/\`: Python API and recommendation engine.
- \`frontend/\`: React + Vite + Tailwind CSS application.
- \`backend/data/\`: Contains the movie datasets (CSV).

## Technologies
- **Frontend**: React, Lucide-React, Tailwind CSS, Vite.
- **Backend**: Python, Pandas, Scikit-learn.
