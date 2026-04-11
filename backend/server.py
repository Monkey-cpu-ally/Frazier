from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class ScoreEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    score: int = 0
    coins: int = 0
    level: int = 0
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ScoreCreate(BaseModel):
    score: int = 0
    coins: int = 0
    level: int = 0

class LeaderboardEntry(BaseModel):
    score: int
    coins: int
    level: int
    timestamp: str

# Routes
@api_router.get("/")
async def root():
    return {"message": "Hyper Axel API"}

@api_router.post("/scores", response_model=ScoreEntry)
async def save_score(data: ScoreCreate):
    entry = ScoreEntry(**data.model_dump())
    doc = entry.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await db.scores.insert_one(doc)
    return entry

@api_router.get("/scores/top", response_model=List[LeaderboardEntry])
async def get_top_scores():
    cursor = db.scores.find({}, {"_id": 0}).sort("score", -1).limit(10)
    scores = await cursor.to_list(10)
    result = []
    for s in scores:
        result.append(LeaderboardEntry(
            score=s.get('score', 0),
            coins=s.get('coins', 0),
            level=s.get('level', 0),
            timestamp=s.get('timestamp', ''),
        ))
    return result

@api_router.get("/health")
async def health():
    return {"status": "ok", "game": "Hyper Axel"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
