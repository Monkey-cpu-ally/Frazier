using System.Collections.Generic;
using UnityEngine;

namespace HyperAxel
{
    public enum PowerId
    {
        None,
        BurningBuffalo,   // Charge through walls
        ShadowTag,        // Shadow trail + AoE
        GoldenGloves,     // 2x melee damage
        SuperMode,        // 1.4x speed, 1.5x dmg, +15% jump
        SpecterMode,      // Phase through damage
        FighterPlane,     // Air-strike ally
        HyperMode,        // 1.5x speed, 2x dmg, magenta trail
    }

    [System.Serializable]
    public class PowerDefinition
    {
        public PowerId id;
        public string displayName;
        public Color color = Color.white;
        public float duration = 12f;
        public char letter = '?';
    }

    /// <summary>
    /// Singleton. Port of PowerManager (systems.js).
    /// Attach to a GameManager GameObject.
    /// </summary>
    public class PowerManager : MonoBehaviour
    {
        public static PowerManager I { get; private set; }

        public List<PowerDefinition> definitions = new()
        {
            new() { id = PowerId.BurningBuffalo, displayName = "Burning Buffalo", color = new Color(1f, 0.33f, 0.2f), duration = 12f, letter = 'B' },
            new() { id = PowerId.ShadowTag,      displayName = "Shadow Tag",      color = new Color(0.55f, 0.36f, 0.96f), duration = 12f, letter = 'S' },
            new() { id = PowerId.GoldenGloves,   displayName = "Golden Gloves",   color = Color.yellow, duration = 12f, letter = 'G' },
            new() { id = PowerId.SuperMode,      displayName = "Super Mode",      color = new Color(0f, 0.78f, 0.75f), duration = 12f, letter = 'M' },
            new() { id = PowerId.SpecterMode,    displayName = "Specter Mode",    color = new Color(0.67f, 0.87f, 1f), duration = 12f, letter = 'P' },
            new() { id = PowerId.FighterPlane,   displayName = "Fighter Plane",   color = new Color(0.27f, 0.73f, 0.27f), duration = 15f, letter = 'F' },
            new() { id = PowerId.HyperMode,      displayName = "Hyper Mode",      color = new Color(1f, 0.18f, 0.84f), duration = 12f, letter = 'H' },
        };

        public PowerId Current { get; private set; } = PowerId.None;
        float timer;

        public bool IsActive => Current != PowerId.None;
        public bool IsHyperMode => Current == PowerId.HyperMode;
        public bool IsGoldenGloves => Current == PowerId.GoldenGloves;
        public bool IsBurningBuffalo => Current == PowerId.BurningBuffalo;
        public bool IsSpecterMode => Current == PowerId.SpecterMode;
        public bool IsSuperMode => Current == PowerId.SuperMode;
        public bool IsShadowTag => Current == PowerId.ShadowTag;
        public bool IsFighterPlane => Current == PowerId.FighterPlane;

        void Awake() { if (I != null && I != this) { Destroy(gameObject); return; } I = this; }

        void Update()
        {
            if (!IsActive) return;
            timer -= Time.deltaTime;
            if (timer <= 0) Deactivate();
        }

        public void Activate(PowerId id, float? overrideDur = null)
        {
            Current = id;
            timer = overrideDur ?? GetDef(id).duration;
            AchievementTracker.I?.OnPowerActivated(id);
            ApplyToPlayer();
        }

        public void Deactivate()
        {
            Current = PowerId.None;
            timer = 0;
            ApplyToPlayer();
        }

        void ApplyToPlayer()
        {
            var player = GameManager.I?.player;
            if (player == null) return;
            player.hyperMode = IsHyperMode;
            player.superMode = IsSuperMode;
            player.specterMode = IsSpecterMode;
            player.goldenGloves = IsGoldenGloves;
            player.burningBuffalo = IsBurningBuffalo;
        }

        PowerDefinition GetDef(PowerId id) { return definitions.Find(p => p.id == id) ?? definitions[0]; }
    }
}
