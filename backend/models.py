from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, unique=True, primary_key=True)
    name= Column(String(200), nullable=False)
    email= Column(String(255), nullable=False, unique=False)
    password_hash= Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    interviews = relationship(
        "Interview",
        back_populates="user",
        cascade="all, delete-orphan")
class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer,primary_key=True)
    user_id= Column(Integer, ForeignKey("users.id"),nullable=False)
    interview_type = Column(String(50), nullable=False)
    interview_template = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resume_filename= Column(String(255), nullable=True)
    score= Column(Integer, nullable=True)
    area_to_improve= Column(Text,nullable=True)
    user = relationship(
        "User",
        back_populates="interviews"
    )

    transcripts = relationship(
        "Transcript",
        back_populates="interview",
        cascade="all, delete-orphan",
        order_by="Transcript.timestamp"
    )
class Transcript(Base):
    __tablename__ = "transcripts"
    id = Column(Integer, primary_key=True)
    interview_id= Column(Integer, ForeignKey("interviews.id"),nullable=False)
    speaker= Column(String(20), nullable=False)
    message= Column(Text, nullable=False)
    timestamp = Column(DateTime(timezone=True),server_default=func.now())
    is_final = Column(Integer,nullable=False,default=1)
    interview = relationship(
        "Interview",
        back_populates="transcripts"
    )
    


