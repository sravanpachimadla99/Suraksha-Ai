from sqlalchemy import Column, String, DateTime, Integer, Text, JSON
from datetime import datetime
import uuid
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True)
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    module_used = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String)
    content = Column(Text)
    category = Column(String)
    
class AssistantFeedback(Base):
    __tablename__ = "assistant_feedback"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, index=True)
    message_id = Column(String, index=True)
    rating = Column(Integer)  # 1 for upvote, -1 for downvote
