from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
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

# === Speedrun Leaderboard ===
class SpeedrunEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_name: str = "Anonymous"
    total_ms: int
    l1_ms: int = 0
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SpeedrunSubmit(BaseModel):
    player_name: str = "Anonymous"
    total_ms: int
    l1_ms: int = 0

@api_router.post("/leaderboard/speedrun")
async def submit_speedrun(data: SpeedrunSubmit):
    if data.total_ms <= 0:
        raise HTTPException(status_code=400, detail="total_ms must be > 0")
    entry = SpeedrunEntry(**data.model_dump())
    await db.speedrun_leaderboard.insert_one(entry.model_dump())
    return {"status": "submitted", "id": entry.id}

@api_router.get("/leaderboard/speedrun")
async def get_speedrun_leaderboard(limit: int = 10):
    cursor = db.speedrun_leaderboard.find({}, {"_id": 0}).sort("total_ms", 1).limit(limit)
    return [doc async for doc in cursor]

# === Daily Challenge ===
# Seeded by date — deterministic per day. Returns a modifier + identifier.
DAILY_MODIFIERS = [
    {"id": "glass_cannon",  "name": "Glass Cannon",  "desc": "2x damage dealt, 2x damage taken", "dmg_mul": 2.0, "dmg_taken_mul": 2.0, "no_heal": False, "scrap_mul": 1.0},
    {"id": "no_heal",       "name": "No Mercy",      "desc": "No healing pickups work today",    "dmg_mul": 1.0, "dmg_taken_mul": 1.0, "no_heal": True,  "scrap_mul": 1.0},
    {"id": "scrap_famine",  "name": "Scrap Famine",  "desc": "Half scrap from enemies & pickups", "dmg_mul": 1.0, "dmg_taken_mul": 1.0, "no_heal": False, "scrap_mul": 0.5},
    {"id": "mirror_mania",  "name": "Mirror Mania",  "desc": "Enemies move 40% faster",            "dmg_mul": 1.0, "dmg_taken_mul": 1.0, "no_heal": False, "scrap_mul": 1.0, "enemy_speed_mul": 1.4},
    {"id": "iron_fist",     "name": "Iron Fist",     "desc": "No dashing allowed",                 "dmg_mul": 1.0, "dmg_taken_mul": 1.0, "no_heal": False, "scrap_mul": 1.0, "no_dash": True},
    {"id": "golden_hour",   "name": "Golden Hour",   "desc": "1.5x coins & score, but timer runs 1.5x",  "dmg_mul": 1.0, "dmg_taken_mul": 1.0, "no_heal": False, "scrap_mul": 1.0, "coin_mul": 1.5, "score_mul": 1.5},
]

@api_router.get("/daily-challenge")
async def get_daily_challenge():
    # Deterministic seed from today's UTC date — md5 for even distribution
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    digest = hashlib.md5(today.encode()).digest()
    seed = int.from_bytes(digest[:4], "big")
    modifier = DAILY_MODIFIERS[seed % len(DAILY_MODIFIERS)]
    return {"date": today, "modifier": modifier, "seed": seed}

class DailyCompleteSubmit(BaseModel):
    player_id: str = "default"
    date: str  # "YYYY-MM-DD"
    total_ms: int

@api_router.post("/daily-challenge/complete")
async def complete_daily(data: DailyCompleteSubmit):
    key = f"{data.player_id}:{data.date}"
    await db.daily_completions.update_one(
        {"key": key},
        {"$set": {
            "key": key,
            "player_id": data.player_id,
            "date": data.date,
            "total_ms": data.total_ms,
            "ts": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"status": "recorded"}

@api_router.get("/daily-challenge/completed/{player_id}")
async def get_completed_daily(player_id: str):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    key = f"{player_id}:{today}"
    doc = await db.daily_completions.find_one({"key": key}, {"_id": 0})
    return {"completed": bool(doc), "record": doc}

@api_router.get("/daily-challenge/streak/{player_id}")
async def get_daily_streak(player_id: str):
    """Return consecutive-day completion streak ending today (or yesterday)."""
    from datetime import timedelta
    cursor = db.daily_completions.find(
        {"player_id": player_id}, {"_id": 0, "date": 1}
    )
    dates = sorted({d["date"] async for d in cursor}, reverse=True)
    if not dates:
        return {"streak": 0, "longest": 0}
    today = datetime.now(timezone.utc).date()
    streak = 0
    # Streak counts from today backwards; if today missing, check yesterday (grace).
    first = datetime.strptime(dates[0], "%Y-%m-%d").date()
    if (today - first).days > 1:
        return {"streak": 0, "longest": _longest_streak(dates)}
    cur = first
    for d in dates:
        dd = datetime.strptime(d, "%Y-%m-%d").date()
        if dd == cur:
            streak += 1
            cur = cur - timedelta(days=1)
        elif dd == cur + timedelta(days=1):
            # duplicate of prior day; skip
            continue
        else:
            break
    return {"streak": streak, "longest": _longest_streak(dates)}


def _longest_streak(dates_desc):
    """Compute the longest ever consecutive-day completion streak."""
    from datetime import timedelta
    if not dates_desc:
        return 0
    asc = sorted({d for d in dates_desc})
    best = 1
    cur = 1
    prev = datetime.strptime(asc[0], "%Y-%m-%d").date()
    for ds in asc[1:]:
        d = datetime.strptime(ds, "%Y-%m-%d").date()
        if (d - prev).days == 1:
            cur += 1
            best = max(best, cur)
        else:
            cur = 1
        prev = d
    return best

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
