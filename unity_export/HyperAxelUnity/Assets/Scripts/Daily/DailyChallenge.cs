using UnityEngine;

namespace HyperAxel
{
    /// <summary>
    /// Daily Challenge — port of /app/backend/server.py DAILY_MODIFIERS + seed logic.
    /// Deterministic per UTC date. Call <see cref="TodayChallenge"/> at the start of a run
    /// and feed the returned <see cref="DailyModifier"/> into <see cref="GameManager"/>.
    /// </summary>
    public static class DailyChallenge
    {
        public enum ModifierId
        {
            GlassCannon, NoHeal, ScrapFamine, MirrorMania, IronFist, GoldenHour,
        }

        [System.Serializable]
        public struct DailyModifier
        {
            public ModifierId id;
            public string name;
            public string description;
            public float dmgMul;          // outgoing damage
            public float dmgTakenMul;     // incoming damage
            public bool noHeal;
            public float scrapMul;
            public float enemySpeedMul;
            public bool noDash;
            public float coinMul;
            public float scoreMul;
        }

        static readonly DailyModifier[] Modifiers =
        {
            new() { id = ModifierId.GlassCannon, name = "Glass Cannon",
                    description = "2x damage dealt, 2x damage taken",
                    dmgMul = 2f, dmgTakenMul = 2f, scrapMul = 1f, enemySpeedMul = 1f, coinMul = 1f, scoreMul = 1f },
            new() { id = ModifierId.NoHeal, name = "No Mercy",
                    description = "No healing pickups work today",
                    dmgMul = 1f, dmgTakenMul = 1f, noHeal = true, scrapMul = 1f, enemySpeedMul = 1f, coinMul = 1f, scoreMul = 1f },
            new() { id = ModifierId.ScrapFamine, name = "Scrap Famine",
                    description = "Half scrap from enemies & pickups",
                    dmgMul = 1f, dmgTakenMul = 1f, scrapMul = 0.5f, enemySpeedMul = 1f, coinMul = 1f, scoreMul = 1f },
            new() { id = ModifierId.MirrorMania, name = "Mirror Mania",
                    description = "Enemies move 40% faster",
                    dmgMul = 1f, dmgTakenMul = 1f, scrapMul = 1f, enemySpeedMul = 1.4f, coinMul = 1f, scoreMul = 1f },
            new() { id = ModifierId.IronFist, name = "Iron Fist",
                    description = "No dashing allowed",
                    dmgMul = 1f, dmgTakenMul = 1f, scrapMul = 1f, enemySpeedMul = 1f, noDash = true, coinMul = 1f, scoreMul = 1f },
            new() { id = ModifierId.GoldenHour, name = "Golden Hour",
                    description = "1.5x coins & score, timer runs 1.5x",
                    dmgMul = 1f, dmgTakenMul = 1f, scrapMul = 1f, enemySpeedMul = 1f, coinMul = 1.5f, scoreMul = 1.5f },
        };

        /// <summary>Deterministic modifier for today (UTC).</summary>
        public static DailyModifier TodayChallenge()
        {
            string today = System.DateTime.UtcNow.ToString("yyyy-MM-dd");
            return ChallengeForDate(today);
        }

        /// <summary>Deterministic modifier for a specific UTC date string YYYY-MM-DD.</summary>
        public static DailyModifier ChallengeForDate(string yyyymmdd)
        {
            using var md5 = System.Security.Cryptography.MD5.Create();
            byte[] digest = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(yyyymmdd));
            // Big-endian first 4 bytes → seed, matches backend/server.py.
            uint seed = ((uint)digest[0] << 24) | ((uint)digest[1] << 16) | ((uint)digest[2] << 8) | digest[3];
            return Modifiers[seed % (uint)Modifiers.Length];
        }

        /// <summary>Apply modifier at run start.</summary>
        public static void Apply(DailyModifier m)
        {
            var gm = GameManager.I;
            if (gm == null) return;
            gm.dailyMode = true;
            gm.activeDaily = m;
            if (gm.player) gm.player.noDashModifier = m.noDash;
        }
    }
}
