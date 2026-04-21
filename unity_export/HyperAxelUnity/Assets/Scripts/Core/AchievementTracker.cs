using UnityEngine;

namespace HyperAxel
{
    /// <summary>
    /// Achievement tracker singleton. Port of AchievementTracker in systems.js.
    /// Fire OnXxx from gameplay code; toast UI is elsewhere.
    /// </summary>
    public class AchievementTracker : MonoBehaviour
    {
        public static AchievementTracker I { get; private set; }
        public System.Action<string> OnUnlock;
        System.Collections.Generic.HashSet<string> unlocked = new();

        [Header("Per-run counters")]
        public int wallJumps, dashes, combo3s;
        public int levelDamageTaken;
        public System.Collections.Generic.HashSet<PowerId> powersUsed = new();
        public int mirrorFragments;
        public float level1StartT = -1f;

        void Awake() { if (I != null && I != this) { Destroy(gameObject); return; } I = this; }

        void Unlock(string id) { if (unlocked.Add(id)) OnUnlock?.Invoke(id); }

        public void OnEnemyKilled() { Unlock("first_blood"); }
        public void OnComboFinished() { Unlock("combo_master"); }
        public void OnWallJump() { wallJumps++; if (wallJumps >= 10) Unlock("wall_jumper"); }
        public void OnDash() { dashes++; if (dashes >= 50) Unlock("dasher"); }
        public void OnPowerActivated(PowerId id) { powersUsed.Add(id); if (powersUsed.Count >= 6) Unlock("power_user"); }
        public void OnBossDefeated() { Unlock("boss_slayer"); }
        public void OnMirrorFragment(int total, int ofTotal) { mirrorFragments = total; Unlock("fragment_1"); Unlock("explorer"); if (total >= ofTotal) Unlock("fragment_all"); }
        public void OnPlayerDamaged() { levelDamageTaken++; }
        public void OnLevelStart(int idx) { levelDamageTaken = 0; if (idx == 0) level1StartT = Time.time; }
        public void OnLevelCompleted(int idx)
        {
            if (levelDamageTaken == 0) Unlock("no_damage_level");
            if (idx == 0 && level1StartT >= 0 && Time.time - level1StartT < 30f) Unlock("speed_run");
        }
        public void SyncTotals(int totalCoins, int totalScrap, int levelsCompleted, int score)
        {
            if (totalCoins >= 50) Unlock("coin_collector");
            if (totalScrap >= 20) Unlock("scrap_hoarder");
            if (levelsCompleted >= 10) Unlock("all_levels");
            if (score > 5000) Unlock("high_score");
        }
    }
}
