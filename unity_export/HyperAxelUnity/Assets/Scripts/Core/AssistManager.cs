using UnityEngine;

namespace HyperAxel
{
    /// <summary>
    /// Scrap Assist system — port of assists.js.
    /// Tier picked from current scrap meter fill (25/50/75% thresholds).
    /// </summary>
    public class AssistManager : MonoBehaviour
    {
        public static AssistManager I { get; private set; }
        public float maxScrap = 100f;
        public float scrap = 0f;

        [Header("Upgrades")]
        public float upgradeBonus;          // +5/10/15% for assist damage
        public float malfunctionReduction;  // -5/10/15% for orange malfunction risk

        [Header("Prefabs (assign in inspector)")]
        public GameObject supplyDropPrefab;
        public GameObject groundActorPrefab;
        public GameObject fighterPlanePrefab;

        void Awake() { if (I != null && I != this) { Destroy(gameObject); return; } I = this; }

        public void AddScrap(float amount) { scrap = Mathf.Min(maxScrap, scrap + amount); }

        /// <summary>Called from Input (Q key). Triggers the highest-tier call-in.</summary>
        public bool TriggerAssist()
        {
            if (scrap < 20) { /* show "empty" banner */ return false; }
            float ratio = scrap / maxScrap;
            var tier = ratio < 0.25f ? "green"
                     : ratio < 0.50f ? "yellow"
                     : ratio < 0.75f ? "orange"
                     : "red";
            scrap = 0;
            switch (tier)
            {
                case "green":  DoGreen();  break;
                case "yellow": DoYellow(); break;
                case "orange": DoOrange(); break;
                case "red":    DoRed();    break;
            }
            return true;
        }

        void DoGreen()
        {
            // 50% heal, 50% power refresh or random grant
            if (Random.value < 0.5f) GameManager.I?.HealPlayer(1);
            else RefreshOrGrantPower();
            if (supplyDropPrefab) Instantiate(supplyDropPrefab, GameManager.I.player.transform.position + Vector3.up * 4f, Quaternion.identity);
        }

        void RefreshOrGrantPower()
        {
            var pm = PowerManager.I;
            float bonus = Mathf.Max(0, 4f + upgradeBonus);
            if (pm.IsActive) { pm.Activate(pm.Current, pm.definitions.Find(d => d.id == pm.Current).duration + bonus); }
            else
            {
                var pool = new[] { PowerId.BurningBuffalo, PowerId.ShadowTag, PowerId.GoldenGloves,
                                   PowerId.SuperMode, PowerId.SpecterMode, PowerId.FighterPlane };
                pm.Activate(pool[Random.Range(0, pool.Length)], 12f + bonus);
            }
        }

        void DoYellow()
        {
            // Weak enemies die instantly (within range), large take 10% HP
            DamageEnemiesInRange(180f, e => e.IsWeak ? (int)1e6 : -1, 0.10f + upgradeBonus);
        }
        void DoOrange()
        {
            // 15% weak / 10% large; 30% malfunction self-damage
            DamageEnemiesInRange(150f, e => -1, 0.15f + upgradeBonus);
            float chance = Mathf.Max(0.10f, 0.30f - malfunctionReduction);
            if (Random.value < chance) GameManager.I?.DamagePlayer(1);
        }
        void DoRed()
        {
            // Air strike — wider radius, 20-30% HP damage
            bool bomb = Random.value < 0.5f;
            float pct = (bomb ? 0.30f : 0.20f) + upgradeBonus;
            float radius = bomb ? 180f : 220f;
            DamageEnemiesInRange(radius, e => -1, pct);
        }

        void DamageEnemiesInRange(float radius, System.Func<EnemyBase, int> flatDmg, float pctDmg)
        {
            var player = GameManager.I.player.transform;
            var hits = Physics2D.OverlapCircleAll(player.position, radius / 100f);
            foreach (var h in hits)
            {
                var e = h.GetComponentInParent<EnemyBase>();
                if (e == null) continue;
                int flat = flatDmg(e);
                if (flat > 0) e.TakeDamage(flat, player.position, bypassArmor: true, bypassFlicker: true);
                else e.TakePercentDamage(pctDmg, player.position);
            }
        }
    }
}
