using UnityEngine;

namespace HyperAxel
{
    /// <summary>
    /// Minimal game manager — stitches everything together and holds global refs.
    /// Port / consolidation of engine.js + systems.js.
    /// </summary>
    public class GameManager : MonoBehaviour
    {
        public static GameManager I { get; private set; }

        [Header("References")]
        public AxelController player;
        public HUDController hud;

        [Header("Game State")]
        public int score;
        public int coins;
        public int stickers = 3;            // health
        public int maxStickers = 5;
        public int mirrorFragments;
        public int totalFragments = 4;

        [Header("Run")]
        public float runStartT;
        public float runFinalMs;
        public bool speedrunMode;
        public bool dailyMode;
        [HideInInspector] public DailyChallenge.DailyModifier activeDaily;

        void Awake() { if (I != null && I != this) { Destroy(gameObject); return; } I = this; }

        // ── From enemy on death ───────────────────────────────────────────
        public void OnEnemyDefeated(int scoreValue, int scrapDrop)
        {
            score += scoreValue;
            AssistManager.I?.AddScrap(scrapDrop * 8f);
        }

        public void OnPlayerHit(int dmg) { DamagePlayer(dmg); }

        public void DamagePlayer(int amount)
        {
            AchievementTracker.I?.OnPlayerDamaged();
            stickers = Mathf.Max(0, stickers - amount);
            if (stickers <= 0) GameOver();
        }

        public void HealPlayer(int amount)
        {
            stickers = Mathf.Min(maxStickers, stickers + amount);
        }

        public void CollectCoin() { coins++; score += 10; }
        public void CollectMirrorFragment()
        {
            mirrorFragments++;
            AchievementTracker.I?.OnMirrorFragment(mirrorFragments, totalFragments);
        }

        void GameOver() { /* scene transition to game over */ }
    }
}
