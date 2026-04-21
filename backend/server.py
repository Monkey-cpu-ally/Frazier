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

# Save/Load game progress
class GameProgress(BaseModel):
    player_id: str = "default"
    levels_completed: List[int] = []
    mirror_fragments: int = 0
    total_coins: int = 0
    total_scrap: int = 0
    achievements: List[str] = []
    wrench_skin: str = "standard"
    unlocked_skins: List[str] = ["standard"]
    high_score: int = 0
    assist_damage_level: int = 0
    assist_stabilizer_level: int = 0
    best_run_time_ms: int = 0
    best_l1_time_ms: int = 0

class ProgressUpdate(BaseModel):
    player_id: str = "default"
    levels_completed: List[int] = []
    mirror_fragments: int = 0
    total_coins: int = 0
    total_scrap: int = 0
    achievements: List[str] = []
    wrench_skin: str = "standard"
    unlocked_skins: List[str] = ["standard"]
    high_score: int = 0
    assist_damage_level: int = 0
    assist_stabilizer_level: int = 0
    best_run_time_ms: int = 0
    best_l1_time_ms: int = 0

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

# === Save/Load Progress ===
@api_router.get("/progress/{player_id}")
async def get_progress(player_id: str = "default"):
    doc = await db.progress.find_one({"player_id": player_id}, {"_id": 0})
    if not doc:
        return GameProgress(player_id=player_id).model_dump()
    return doc

@api_router.post("/progress")
async def save_progress(data: ProgressUpdate):
    doc = data.model_dump()
    await db.progress.update_one(
        {"player_id": data.player_id},
        {"$set": doc},
        upsert=True
    )
    return {"status": "saved", "player_id": data.player_id}

# === Achievements ===
ACHIEVEMENTS = [
    {"id": "first_blood", "name": "First Blood", "desc": "Defeat your first enemy"},
    {"id": "combo_master", "name": "Combo Master", "desc": "Land a full 3-hit combo"},
    {"id": "coin_collector", "name": "Coin Collector", "desc": "Collect 50 coins total"},
    {"id": "scrap_hoarder", "name": "Scrap Hoarder", "desc": "Collect 20 scrap parts"},
    {"id": "power_user", "name": "Power User", "desc": "Activate all 6 powers"},
    {"id": "wall_jumper", "name": "Wall Jumper", "desc": "Perform 10 wall jumps"},
    {"id": "dasher", "name": "Speed Demon", "desc": "Dash 50 times"},
    {"id": "boss_slayer", "name": "Boss Slayer", "desc": "Defeat the Rootbound Siege Tank"},
    {"id": "fragment_1", "name": "First Shard", "desc": "Find your first mirror fragment"},
    {"id": "fragment_all", "name": "Mirror Complete", "desc": "Collect all 4 mirror fragments"},
    {"id": "no_damage_level", "name": "Untouchable", "desc": "Complete a level without taking damage"},
    {"id": "speed_run", "name": "Speed Runner", "desc": "Complete level 1 in under 30 seconds"},
    {"id": "explorer", "name": "Explorer", "desc": "Find a hidden secret area"},
    {"id": "all_levels", "name": "Journey Complete", "desc": "Complete all 10 levels"},
    {"id": "high_score", "name": "High Roller", "desc": "Score over 5000 points"},
]

@api_router.get("/achievements")
async def get_achievements():
    return ACHIEVEMENTS

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
