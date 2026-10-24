# IntelligenceView — AI-Powered Mock Interview Platform

IntelligenceView is a full-stack AI-powered interview platform that conducts personalized, real-time voice interviews using a candidate's resume, selected interview mode, and interview template. It uses Google Gemini to generate contextual questions and provide interview performance feedback.

**Live Demo:** https://intelligenceview.vercel.app/  
**Backend API:** https://intelligenceview.onrender.com  
**Source Code:** https://github.com/Shreyansh1337/IntelligenceView

## Features

- **Resume-Based Personalization:** Upload a PDF resume to extract candidate information and generate relevant interview questions.
- **Real-Time Voice Interviews:** Conduct interactive voice interviews powered by Google Gemini's real-time capabilities.
- **Adaptive Question Flow:** Progress from introductory questions to role-specific questions and contextual follow-ups based on the candidate's responses.
- **Interview Modes and Templates:** Customize the interview experience according to the selected interview type and template.
- **Transcript Storage:** Persist interview conversations for later review.
- **AI-Powered Evaluation:** Generate interview performance scores and personalized Areas to Improve.
- **Interview Dashboard:** Review previous interviews and their associated results.

## Tech Stack

| Technologies |

| Frontend | React, Vite, JavaScript |
| Backend | Python, FastAPI |
| Database | PostgreSQL, SQLAlchemy |
| AI | Google Gemini, Gemini Live API |
| Authentication | JWT, Argon2 password hashing |
| Resume Processing | PDF text extraction with pypdf |
| Deployment | Vercel, Render, Supabase |

## System Architecture

1. **Resume Upload:** The frontend sends the candidate's PDF resume and interview preferences to the FastAPI backend.
2. **Resume Analysis:** The backend extracts text from the PDF and uses Gemini to build a structured candidate profile.
3. **Interview Context:** The candidate profile and selected interview settings provide context for the interview.
4. **Live Interview:** The frontend streams audio through the real-time interview flow and plays the AI interviewer's responses.
5. **Persistence:** Interview records, transcripts, scores, and feedback are stored in PostgreSQL.
6. **Evaluation and Review:** The backend processes interview results, which the frontend presents through the interview experience and dashboard.

## Getting Started

### Prerequisites

- Python 3.12 recommended
- Node.js and npm
- PostgreSQL database or a compatible hosted PostgreSQL instance
- Google Gemini API key

### 1. Clone the repository

bash :-
git clone https://github.com/Shreyansh1337/IntelligenceView.git
cd IntelligenceView


### 2. Configure the backend

Create a virtual environment and install the backend dependencies using the repository's dependency file.

bash :-
cd backend
python -m venv .venv


Activate the environment on Windows:

powershell :-
.venv\Scripts\Activate.ps1


Install dependencies:

bash :-
pip install -r requirements.txt


Create a `.env` file in the backend directory with the required configuration:

env :-
DATABASE_URL=your_postgresql_connection_string
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET_KEY=your_secure_secret_key
JWT_ALGORITHM=HS256


Configure CORS to allow your frontend's local origin. Keep API keys, database credentials, and JWT secrets out of source control.

Start the backend:

bash :-
uvicorn main:app --host 127.0.0.1 --port 8000


The API documentation is available at:

http://127.0.0.1:8000/docs

### 3. Configure the frontend

Open another terminal:

bash :-
cd frontend
npm install


Create a frontend `.env` file:

env :-
VITE_API_URL=http://127.0.0.1:8000


Start the development server:

bash :-
npm run dev


Use the local URL printed by Vite to open the application.

**Note:** The exact environment variables and dependency files should be checked against the current repository before following these instructions. Real-time voice functionality also depends on the configured Gemini API access and the application's browser audio implementation.

## Environment Variables

| Variable | 

| DATABASE_URL | PostgreSQL connection string |
| GEMINI_API_KEY | Authentication for Gemini API requests |
| JWT_SECRET_KEY | Secret used to sign authentication tokens |
| JWT_ALGORITHM | JWT signing algorithm |
| VITE_API_URL | Backend API base URL used by the frontend |

## Future Improvements

- Data Structures and Algorithms (DSA) interview mode.
- More detailed interview analytics and performance tracking like Stronger Areas
- Additional interview templates and evaluation criteria.
- Improvements to voice interaction latency and interview feedback.

## Author

**Shreyansh Sahu**

B.Tech Computer Science and Engineering

GitHub: https://github.com/Shreyansh1337



