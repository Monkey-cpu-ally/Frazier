"""Backend tests for Iteration 9: Daily Challenge + Speedrun Leaderboard.

Covers:
  - GET  /api/daily-challenge — deterministic shape, modifier in DAILY_MODIFIERS list.
  - POST /api/daily-challenge/complete + GET /api/daily-challenge/completed/{player_id}.
  - POST /api/leaderboard/speedrun + GET /api/leaderboard/speedrun (sort ASC by total_ms).
  - Regression for /api/health, /api/scores, /api/progress.
"""
import os
import uuid
from datetime import datetime, timezone

import pytest
import requests

# Resolve backend URL from frontend/.env to match what the user sees.
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip()
                break
BASE_URL = BASE_URL.rstrip('/')
API = f"{BASE_URL}/api"

EXPECTED_MOD_IDS = {
    "glass_cannon", "no_heal", "scrap_famine",
    "mirror_mania", "iron_fist", "golden_hour",
}


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# === Health regression ===
def test_health(client):
    r = client.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    assert r.json().get('status') == 'ok'


# === Daily Challenge GET ===
def test_daily_challenge_shape(client):
    r = client.get(f"{API}/daily-challenge", timeout=10)
    assert r.status_code == 200, r.text
    data = r.json()
    # Date matches today UTC
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    assert data['date'] == today
    assert 'seed' in data and isinstance(data['seed'], int)
    mod = data['modifier']
    assert mod['id'] in EXPECTED_MOD_IDS
    # All modifiers must carry these baseline fields
    for k in ('id', 'name', 'desc', 'dmg_mul', 'dmg_taken_mul', 'no_heal', 'scrap_mul'):
        assert k in mod, f"Missing key {k} in modifier {mod}"
    assert isinstance(mod['name'], str) and mod['name']
    assert isinstance(mod['desc'], str) and mod['desc']


def test_daily_challenge_deterministic(client):
    r1 = client.get(f"{API}/daily-challenge", timeout=10).json()
    r2 = client.get(f"{API}/daily-challenge", timeout=10).json()
    assert r1 == r2  # same call within same UTC day must be identical


# === Daily completion record ===
def test_daily_completion_roundtrip(client):
    pid = f"TEST_daily_{uuid.uuid4().hex[:8]}"
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # Initially not completed
    g0 = client.get(f"{API}/daily-challenge/completed/{pid}", timeout=10)
    assert g0.status_code == 200
    assert g0.json().get('completed') is False

    # Submit completion
    p = client.post(f"{API}/daily-challenge/complete", json={
        "player_id": pid, "date": today, "total_ms": 187500,
    }, timeout=10)
    assert p.status_code == 200, p.text
    assert p.json().get('status') == 'recorded'

    # Now completed
    g1 = client.get(f"{API}/daily-challenge/completed/{pid}", timeout=10)
    assert g1.status_code == 200
    body = g1.json()
    assert body.get('completed') is True
    rec = body.get('record')
    assert rec is not None
    assert rec['player_id'] == pid
    assert rec['date'] == today
    assert rec['total_ms'] == 187500
    assert '_id' not in rec


def test_daily_completion_idempotent_upsert(client):
    pid = f"TEST_daily_idem_{uuid.uuid4().hex[:8]}"
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    # Two posts same day -> only one record (key = pid:date)
    client.post(f"{API}/daily-challenge/complete", json={
        "player_id": pid, "date": today, "total_ms": 200000}, timeout=10)
    client.post(f"{API}/daily-challenge/complete", json={
        "player_id": pid, "date": today, "total_ms": 150000}, timeout=10)
    g = client.get(f"{API}/daily-challenge/completed/{pid}", timeout=10).json()
    assert g['completed'] is True
    assert g['record']['total_ms'] == 150000  # latest write wins


# === Speedrun Leaderboard ===
def test_speedrun_submit_and_list(client):
    name = f"TEST_{uuid.uuid4().hex[:6]}"
    r = client.post(f"{API}/leaderboard/speedrun", json={
        "player_name": name, "total_ms": 123456, "l1_ms": 22000,
    }, timeout=10)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get('status') == 'submitted'
    assert isinstance(body.get('id'), str) and body['id']

    # Submit a much-faster entry to verify ASC sort
    fast = client.post(f"{API}/leaderboard/speedrun", json={
        "player_name": f"{name}_FAST", "total_ms": 10000, "l1_ms": 2000,
    }, timeout=10)
    assert fast.status_code == 200

    lb = client.get(f"{API}/leaderboard/speedrun?limit=50", timeout=10)
    assert lb.status_code == 200
    rows = lb.json()
    assert isinstance(rows, list)
    # ASC sort by total_ms
    times = [row['total_ms'] for row in rows]
    assert times == sorted(times), f"Leaderboard not ASC sorted: {times}"
    # Our entries are present
    found_names = {row['player_name'] for row in rows}
    assert name in found_names
    assert f"{name}_FAST" in found_names
    # Mongo _id excluded
    for row in rows:
        assert '_id' not in row


def test_speedrun_invalid_zero_ms(client):
    r = client.post(f"{API}/leaderboard/speedrun", json={
        "player_name": "TEST_zero", "total_ms": 0, "l1_ms": 0,
    }, timeout=10)
    # iter9 hardened: server now rejects total_ms<=0 with HTTP 400 (FastAPI HTTPException).
    assert r.status_code == 400
    assert "total_ms" in r.json().get('detail', '').lower()


def test_speedrun_limit(client):
    # Default limit is 10; explicit 5 should cap result rows.
    r = client.get(f"{API}/leaderboard/speedrun?limit=5", timeout=10)
    assert r.status_code == 200
    assert len(r.json()) <= 5


# === Regression: progress + scores still functional ===
def test_progress_default_iter9(client):
    pid = f"TEST_iter9_{uuid.uuid4().hex[:8]}"
    r = client.get(f"{API}/progress/{pid}", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d.get('wrench_skin') == 'standard'
    assert d.get('unlocked_skins') == ['standard']


def test_score_submit_iter9(client):
    r = client.post(f"{API}/scores", json={"score": 4242, "coins": 12, "level": 2}, timeout=10)
    assert r.status_code == 200
    assert r.json()['score'] == 4242
