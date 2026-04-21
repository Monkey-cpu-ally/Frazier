using System.Collections.Generic;
using UnityEngine;

namespace HyperAxel
{
    /// <summary>
    /// ScriptableObject for a level's config. Create assets via
    /// Assets -> Create -> HyperAxel -> Level Data.
    /// Mirrors the JSON schema from /app/frontend/src/game/levels.js.
    /// </summary>
    [CreateAssetMenu(fileName = "LevelData", menuName = "HyperAxel/Level Data", order = 1)]
    public class LevelData : ScriptableObject
    {
        [Header("Identity")]
        public string levelName = "Overgrown Outskirts";
        public string environment = "forest";       // forest / lava_world / floating_islands / mystic_forest / dream_world / urban_overgrowth
        public bool isBossLevel;
        public bool isHub;
        public bool bossAfterClear;

        [Header("Environmental")]
        public float gravityMul = 1f;
        public Vector2 playerSpawn = new(100, 200);
        public float exitX = 1200f;

        [Header("Entities")]
        public List<PlatformData> platforms = new();
        public List<EnemySpawn> enemies = new();
        public List<PickupSpawn> pickups = new();
        public List<HintTrigger> hints = new();

        [Header("Waterfall Event (optional)")]
        public bool hasWaterfall;
        public float waterfallTriggerX;
        public float waterfallDuration = 5f;

        [Header("Mirror Fragment (optional)")]
        public bool hasMirrorFragment;
        public Vector2 mirrorFragmentPos;
    }

    [System.Serializable]
    public class PlatformData
    {
        public Vector2 position;
        public Vector2 size = new(200, 40);
    }

    [System.Serializable]
    public class EnemySpawn
    {
        public GameObject prefab;
        public Vector2 position;
        public string tint = "none"; // "lava"/"sky"/"forest"/"dream"/"none"
    }

    [System.Serializable]
    public class PickupSpawn
    {
        public enum Kind { Coin, Scrap, Food, Power, FoxStatue, Interactable }
        public Kind kind;
        public Vector2 position;
        public PowerId powerId;
        public string interactableKind; // "shop" | "upgrade_station" | "mission_gate"
    }

    [System.Serializable]
    public class HintTrigger
    {
        public Rect bounds;
        public string text;
        public Color color = Color.yellow;
    }
}
