"""Backend tests for Iteration 8: progress schema extensions (unlocked_skins,
best_run_time_ms, best_l1_time_ms) and round-trip persistence of wrench_skin.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ['REACT_APP_BACKEND_URL'].rstrip('/') if 'REACT_APP_BACKEND_URL' in os.environ else None
# Fallback: read from frontend .env
if not BASE_URL:
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                break

API = f"{BASE_URL}/api"


@pytest.fixture
def client():
    s = requests.Session()
    s.headers.update({'Content-Type': 'application/json'})
    return s


# === Health / base ===
def test_health(client):
    r = client.get(f"{API}/health", timeout=10)
    assert r.status_code == 200
    assert r.json().get('status') == 'ok'


def test_root(client):
    r = client.get(f"{API}/", timeout=10)
    assert r.status_code == 200


# === Achievements list ===
def test_achievements_list(client):
    r = client.get(f"{API}/achievements", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list)
    ids = {a['id'] for a in data}
    # Verify key achievement ids referenced by iteration 8 are present
    expected = {"first_blood", "combo_master", "dasher", "wall_jumper",
                "fragment_1", "fragment_all", "power_user", "boss_slayer",
                "coin_collector", "scrap_hoarder", "no_damage_level",
                "speed_run", "all_levels", "high_score", "explorer"}
    missing = expected - ids
    assert not missing, f"Missing achievement ids: {missing}"


# === Progress GET default ===
def test_progress_default(client):
    pid = f"TEST_default_{uuid.uuid4().hex[:8]}"
    r = client.get(f"{API}/progress/{pid}", timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data.get('wrench_skin') == 'standard'
    assert 'unlocked_skins' in data
    assert data['unlocked_skins'] == ['standard']
    assert data.get('best_run_time_ms') == 0
    assert data.get('best_l1_time_ms') == 0


# === Progress POST upsert + GET round-trip with NEW iter-8 fields ===
def test_progress_roundtrip_new_fields(client):
    pid = f"TEST_iter8_{uuid.uuid4().hex[:8]}"
    payload = {
        "player_id": pid,
        "levels_completed": [1, 2, 3],
        "mirror_fragments": 2,
        "total_coins": 125,
        "total_scrap": 40,
        "achievements": ["first_blood", "combo_master"],
        "wrench_skin": "neon",
        "unlocked_skins": ["standard", "neon", "gold"],
        "high_score": 8500,
        "assist_damage_level": 2,
        "assist_stabilizer_level": 1,
        "best_run_time_ms": 185450,
        "best_l1_time_ms": 27300,
    }
    r = client.post(f"{API}/progress", json=payload, timeout=10)
    assert r.status_code == 200, r.text
    assert r.json().get('status') == 'saved'

    g = client.get(f"{API}/progress/{pid}", timeout=10)
    assert g.status_code == 200
    data = g.json()
    # All new iteration-8 fields round-trip
    assert data['wrench_skin'] == 'neon'
    assert data['unlocked_skins'] == ["standard", "neon", "gold"]
    assert data['best_run_time_ms'] == 185450
    assert data['best_l1_time_ms'] == 27300
    # Existing fields also intact
    assert data['levels_completed'] == [1, 2, 3]
    assert data['mirror_fragments'] == 2
    assert data['total_coins'] == 125
    assert data['high_score'] == 8500
    # Mongo _id must not leak
    assert '_id' not in data


# === Progress update (upsert second POST) — best-time monotonic not enforced server-side
# The server accepts whatever client sends; verify update semantics ===
def test_progress_update_overwrites(client):
    pid = f"TEST_update_{uuid.uuid4().hex[:8]}"
    # initial
    client.post(f"{API}/progress", json={
        "player_id": pid, "wrench_skin": "standard",
        "unlocked_skins": ["standard"], "best_run_time_ms": 200000,
        "best_l1_time_ms": 40000,
    }, timeout=10)
    # improved run
    client.post(f"{API}/progress", json={
        "player_id": pid, "wrench_skin": "neon",
        "unlocked_skins": ["standard", "neon"],
        "best_run_time_ms": 150000, "best_l1_time_ms": 25000,
    }, timeout=10)
    g = client.get(f"{API}/progress/{pid}", timeout=10).json()
    assert g['wrench_skin'] == 'neon'
    assert 'neon' in g['unlocked_skins']
    assert g['best_run_time_ms'] == 150000
    assert g['best_l1_time_ms'] == 25000


# === Regression: scores still works ===
def test_score_submit(client):
    r = client.post(f"{API}/scores", json={"score": 5500, "coins": 30, "level": 3}, timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d['score'] == 5500
    assert '_id' not in d

    top = client.get(f"{API}/scores/top", timeout=10)
    assert top.status_code == 200
    assert isinstance(top.json(), list)


# === Static enemy sprite assets (frontend public) ===
def test_enemy_sprites_available(client):
    # These are served by frontend; we verify they exist on disk since
    # the public /enemies path is served under the frontend origin.
    # As of iteration-10 all 4 sprites are generated (flicker was added when
    # Gemini budget refreshed).
    for name in ("root_crawler.png", "gear_bug.png", "heavy.png", "flicker.png"):
        p = f"/app/frontend/public/enemies/{name}"
        assert os.path.exists(p), f"Missing expected sprite: {p}"
