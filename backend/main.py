import asyncio
import os
from io import BytesIO

import jwt
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pypdf import PdfReader
from sqlalchemy.orm import Session

from backend.gemini_utils import (
    active_interviews,
    analyze_resume,
    completed_interviews,
    evaluate_intevriew,
    start_live_interview,
)
from backend.models import Interview, User
from backend.resume_utils import check_resume_suitability

from . import models
from .database import Base, SessionLocal, engine, get_db
from .schemas import LoginRequest, SignupRequest
from .security import create_access_token, hash_password, verify_password

app = FastAPI()
@app.get("/health")
def health_check():
    return {"status": "ok"}
background_interview_tasks = set()
@app.middleware("http")
async def debug_requests(request, call_next):
    print("🔥 REQUEST:", request.method, request.url.path, flush=True)

    try:
        response = await call_next(request)

        print(
            "🔥 RESPONSE:",
            request.method,
            request.url.path,
            response.status_code,
            flush=True
        )

        return response

    except Exception as e:
        print("🔥 UNHANDLED ERROR:", repr(e), flush=True)
        raise
Base.metadata.create_all(bind=engine)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:5500", ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "IntelligenceView backend is running"}


@app.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email ALready Registered")
    hashed_password = hash_password(data.password)
    new_user= models.User(name=data.name, email=data.email, password_hash=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message":" Account Created Successfully", "user_id": new_user.id}


@app.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user= db.query(models.User).filter(models.User.email==data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid Email or Password")
    if not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid Email or Password")
    access_token= create_access_token(user.id)
    print("login done")
    return {"message":" Login Successful", "access_token": access_token} 

oauth2_scheme =  HTTPBearer()
def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
    ):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, os.getenv("JWT_SECRET_KEY"), algorithms= [os.getenv("JWT_ALGORITHM")])
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Could not validate credentials"
        )
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Could not verify credentials")
    user = db.query(User).filter(User.id==user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found!")
    return user



@app.get("/protected")
def protected_routes(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
    }

async def run_interview_background(
    candidate_context,
    interview_id,
    end_interview,
    interview_type,
    interview_template,
):
    db = SessionLocal()

    try:
        await start_live_interview(
            candidate_context,
            interview_id,
            db,
            end_interview,
            interview_type,
            interview_template,
        )

        evaluation = evaluate_intevriew(
            interview_id=interview_id,
            db=db,
            interview_type=interview_type,
            interview_template=interview_template,
        )

        interview = (
            db.query(Interview)
            .filter(Interview.id == interview_id)
            .first()
        )

        if interview is not None:
            interview.score = evaluation.score
            interview.area_to_improve = evaluation.area_to_improve
            db.commit()
        completed_interviews.add(interview_id)
        print(
            f"Interview {interview_id} evaluated successfully.",
            flush=True,
        )

    except Exception as e:
        db.rollback()
        print(
            f"BACKGROUND INTERVIEW ERROR ({interview_id}): {e!r}",
            flush=True,
        )

    finally:
        if active_interviews.get(interview_id) is end_interview:
            active_interviews.pop(interview_id, None)

        db.close()
        print(f"Interview {interview_id} background task finished.", flush=True)

@app.post("/interview/start")
async def start_interview(
    file: UploadFile = File(...),
    interview_type: str = Form(...),
    interview_template: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    print("🔥 /interview/start REACHED", flush=True)

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Please upload resume in PDF format only",
        )

    content = await file.read()
    reader = PdfReader(BytesIO(content))

    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""

    if not text.strip():
        raise HTTPException(
            status_code=400,
            detail="Could not extract text from PDF",
        )

    text = text.strip()
    print("🔥 PDF TEXT EXTRACTED", flush=True)

    suitability = check_resume_suitability(text)
    print("🔥 SUITABILITY CHECK DONE:", suitability, flush=True)

    if suitability["score"] < 40:
        raise HTTPException(
            status_code=400,
            detail="Resume does not contain enough candidate information",
        )

    print("🔥 ABOUT TO CALL ANALYZE_RESUME", flush=True)

    analysis = analyze_resume(
        resume_text=text,
        interview_type=interview_type,
        interview_template=interview_template,
        suitability=suitability,
    )

    print("🔥 ANALYZE_RESUME FINISHED", flush=True)

    interview = Interview(
        user_id=current_user.id,
        interview_type=interview_type,
        interview_template=interview_template,
        resume_filename=file.filename,
    )

    db.add(interview)
    db.commit()
    db.refresh(interview)

    interview_id = interview.id
    end_event = asyncio.Event()

    # Register the stop event before scheduling the task.
    active_interviews[interview_id] = end_event

    try:
        task = asyncio.create_task(
            run_interview_background(
                candidate_context=analysis.candidate_context,
                interview_id=interview_id,
                end_interview=end_event,
                interview_type=interview_type,
                interview_template=interview_template,
            )
        )
        background_interview_tasks.add(task)
        task.add_done_callback(background_interview_tasks.discard)

    except Exception:
        active_interviews.pop(interview_id, None)
        db.rollback()
        raise

    return {
        "message": "Interview started",
        "user_id": current_user.id,
        "interview_id": interview_id,
        "filename": file.filename,
        "interview_type": interview_type,
        "interview_template": interview_template,
        "suitability": suitability,
        "analysis": analysis.model_dump(),
    }

@app.post("/interview/end/{interview_id}")
async def end_interview(interview_id: int,current_user: User = Depends(get_current_user),db: Session = Depends(get_db)):

    event = active_interviews.get(interview_id)

    if event is None:
        raise HTTPException(status_code=404, detail="Interview Is Not Active!")

    interview = db.query(Interview).filter(Interview.id== interview_id, Interview.user_id==current_user.id).first()

    if interview is None:
        raise HTTPException(status_code=404, detail="Interview Not Found!")

    event.set()

    return {
        "message": "Interview ending",
        "interview_id": interview_id
    }

@app.get("/interviews")
def get_interviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interviews = (
        db.query(Interview)
        .filter(Interview.user_id == current_user.id)
        .order_by(Interview.created_at.desc())
        .all()
    )

    return [
        {
            "id": interview.id,
            "interview_type": interview.interview_type,
            "interview_template": interview.interview_template,
            "created_at": (
                interview.created_at.isoformat()
                if interview.created_at else None
            ),
            "resume_filename": interview.resume_filename,
            "score": interview.score,
            "area_to_improve": interview.area_to_improve,
        }
        for interview in interviews
    ]


@app.get("/interviews/{interview_id}")
def get_interview_details(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    return {
        "id": interview.id,
        "interview_type": interview.interview_type,
        "interview_template": interview.interview_template,
        "created_at": (
            interview.created_at.isoformat()
            if interview.created_at else None
        ),
        "score": interview.score,
        "area_to_improve": interview.area_to_improve,
        "transcripts": [
            {
                "id": transcript.id,
                "speaker": transcript.speaker,
                "message": transcript.message,
                "timestamp": (
                    transcript.timestamp.isoformat()
                    if transcript.timestamp else None
                ),
                "is_final": transcript.is_final,
            }
            for transcript in interview.transcripts
        ],
    }

@app.get("/interview/status/{interview_id}")
async def get_interview_status(
    interview_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    interview = (
        db.query(Interview)
        .filter(
            Interview.id == interview_id,
            Interview.user_id == current_user.id,
        )
        .first()
    )

    if interview is None:
        raise HTTPException(
            status_code=404,
            detail="Interview not found",
        )

    return {
        "completed": interview_id in completed_interviews
    }