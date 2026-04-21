using System.Collections.Generic;
using UnityEngine;

namespace HyperAxel
{
    /// <summary>
    /// Scrap Assist Upgrade Tree — port of DAMAGE_TIERS / STABILIZER_TIERS from
    /// /app/frontend/src/components/Workshop.js. Editable in the Inspector.
    /// Create via Assets -> Create -> HyperAxel -> Workshop Upgrade Tree.
    /// </summary>
    [CreateAssetMenu(fileName = "WorkshopUpgradeTree", menuName = "HyperAxel/Workshop Upgrade Tree", order = 10)]
    public class WorkshopUpgradeTree : ScriptableObject
    {
        [System.Serializable]
        public class DamageTier
        {
            public int level = 1;
            [Tooltip("Additive bonus applied to Assist damage percentage. e.g. 0.05 = +5%.")]
            public float bonus = 0.05f;
            public int cost = 30;
            public string label = "+5% Strike";
        }

        [System.Serializable]
        public class StabilizerTier
        {
            public int level = 1;
            [Tooltip("Flat reduction to orange-tier malfunction self-damage chance. 0.05 = -5%.")]
            public float reduction = 0.05f;
            public int cost = 25;
            public string label = "-5% Malfunction";
        }

        [Header("Damage (Strike) tiers")]
        public List<DamageTier> damageTiers = new()
        {
            new() { level = 1, bonus = 0.05f, cost = 30,  label = "+5% Strike" },
            new() { level = 2, bonus = 0.10f, cost = 80,  label = "+10% Strike" },
            new() { level = 3, bonus = 0.15f, cost = 180, label = "+15% Strike" },
        };

        [Header("Stabilizer (malfunction) tiers")]
        public List<StabilizerTier> stabilizerTiers = new()
        {
            new() { level = 1, reduction = 0.05f, cost = 25,  label = "-5% Malfunction" },
            new() { level = 2, reduction = 0.10f, cost = 75,  label = "-10% Malfunction" },
            new() { level = 3, reduction = 0.15f, cost = 150, label = "-15% Malfunction" },
        };

        public float DamageBonusFor(int ownedLevel)
        {
            if (ownedLevel <= 0) return 0f;
            int idx = Mathf.Clamp(ownedLevel - 1, 0, damageTiers.Count - 1);
            return damageTiers[idx].bonus;
        }

        public float StabilizerReductionFor(int ownedLevel)
        {
            if (ownedLevel <= 0) return 0f;
            int idx = Mathf.Clamp(ownedLevel - 1, 0, stabilizerTiers.Count - 1);
            return stabilizerTiers[idx].reduction;
        }

        public bool CanPurchaseDamage(int ownedLevel, int scrap, out DamageTier next)
        {
            next = null;
            if (ownedLevel >= damageTiers.Count) return false;
            next = damageTiers[ownedLevel];
            return scrap >= next.cost;
        }

        public bool CanPurchaseStabilizer(int ownedLevel, int scrap, out StabilizerTier next)
        {
            next = null;
            if (ownedLevel >= stabilizerTiers.Count) return false;
            next = stabilizerTiers[ownedLevel];
            return scrap >= next.cost;
        }
    }
}
