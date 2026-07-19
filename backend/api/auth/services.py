"""
backend/api/auth/services.py
Persistent SQLite-backed auth with bcrypt password hashing + JWT tokens.
Users survive server restarts. Tokens are verified cryptographically.
"""

import uuid
import datetime
import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

import bcrypt as _bcrypt
from jose import JWTError, jwt

from .schemas import UserRegister, UserLogin

# ── Security config ────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "suraksha-ai-super-secret-key-change-in-prod-2024")
ALGORITHM  = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 72          # Token valid for 3 days

# ── SQLite database setup ──────────────────────────────────────────────────────
DB_DIR  = Path(__file__).resolve().parent.parent.parent / "data"
DB_PATH = DB_DIR / "suraksha.db"
DB_DIR.mkdir(parents=True, exist_ok=True)


@contextmanager
def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    with get_db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id       TEXT PRIMARY KEY,
                name     TEXT NOT NULL,
                email    TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                created  TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS activities (
                id          TEXT PRIMARY KEY,
                email       TEXT NOT NULL,
                type        TEXT NOT NULL,
                description TEXT NOT NULL,
                date        TEXT NOT NULL,
                status      TEXT NOT NULL,
                FOREIGN KEY (email) REFERENCES users(email)
            );
        """)


# Initialise tables on module import
init_db()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


def _create_access_token(email: str) -> str:
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": email, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _seed_activity(email: str, conn: sqlite3.Connection):
    """Insert sample activities for a freshly registered user."""
    now = datetime.datetime.now()
    samples = [
        (
            f"ACT-{uuid.uuid4().hex[:6]}",
            email,
            "Phishing Scan",
            "Scanned URL: http://fake-bank-login.ml",
            now.strftime("%Y-%m-%d %H:%M"),
            "Critical Threat Detected",
        ),
        (
            f"ACT-{uuid.uuid4().hex[:6]}",
            email,
            "Fraud Report",
            "Reported a suspicious WhatsApp call",
            (now - datetime.timedelta(days=1)).strftime("%Y-%m-%d %H:%M"),
            "Under Investigation",
        ),
    ]
    conn.executemany(
        "INSERT OR IGNORE INTO activities (id, email, type, description, date, status) VALUES (?,?,?,?,?,?)",
        samples,
    )


# ── Public API ─────────────────────────────────────────────────────────────────

def register_user(data: UserRegister) -> dict:
    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (data.email,)
        ).fetchone()
        if existing:
            raise ValueError("Email already registered")

        user_id = str(uuid.uuid4())
        hashed  = _hash_password(data.password)
        now     = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        conn.execute(
            "INSERT INTO users (id, name, email, password, created) VALUES (?,?,?,?,?)",
            (user_id, data.name, data.email, hashed, now),
        )
        _seed_activity(data.email, conn)

    return _build_token_response(data.email)


def login_user(data: UserLogin) -> dict:
    with get_db() as conn:
        row = conn.execute(
            "SELECT id, name, email, password FROM users WHERE email = ?",
            (data.email,),
        ).fetchone()

    if not row or not _verify_password(data.password, row["password"]):
        raise ValueError("Invalid email or password")

    return _build_token_response(data.email, name=row["name"])


def _build_token_response(email: str, name: str = None) -> dict:
    if name is None:
        with get_db() as conn:
            row  = conn.execute("SELECT name FROM users WHERE email = ?", (email,)).fetchone()
            name = row["name"] if row else email
    token = _create_access_token(email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_name": name,
    }


def get_user_by_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
    except JWTError:
        return None

    with get_db() as conn:
        row = conn.execute(
            "SELECT id, name, email FROM users WHERE email = ?", (email,)
        ).fetchone()

    if not row:
        return None
    return dict(row)


def get_user_activity(email: str) -> list:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, type, description, date, status FROM activities WHERE email = ? ORDER BY date DESC",
            (email,),
        ).fetchall()
    return [dict(r) for r in rows]
