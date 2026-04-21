using UnityEngine;

namespace HyperAxel
{
    /// <summary>
    /// Runtime controller that stores the player's current upgrade levels and
    /// pushes the resolved bonuses into <see cref="AssistManager"/>.
    /// Persists to PlayerPrefs (keyed by <see cref="prefsKey"/>).
    /// </summary>
    public class WorkshopController : MonoBehaviour
    {
        public static WorkshopController I { get; private set; }

        public WorkshopUpgradeTree tree;
        public string prefsKey = "hyperaxel.workshop";

        [Header("Current levels (0 = none)")]
        public int damageLevel;
        public int stabilizerLevel;

        [Header("Currency")]
        public int scrapParts;

        void Awake()
        {
            if (I != null && I != this) { Destroy(gameObject); return; }
            I = this;
            Load();
        }

        void Start() { Apply(); }

        public bool BuyDamage()
        {
            if (tree == null) return false;
            if (!tree.CanPurchaseDamage(damageLevel, scrapParts, out var next)) return false;
            scrapParts -= next.cost;
            damageLevel++;
            Save(); Apply();
            return true;
        }

        public bool BuyStabilizer()
        {
            if (tree == null) return false;
            if (!tree.CanPurchaseStabilizer(stabilizerLevel, scrapParts, out var next)) return false;
            scrapParts -= next.cost;
            stabilizerLevel++;
            Save(); Apply();
            return true;
        }

        void Apply()
        {
            var am = AssistManager.I;
            if (am == null || tree == null) return;
            am.upgradeBonus = tree.DamageBonusFor(damageLevel);
            am.malfunctionReduction = tree.StabilizerReductionFor(stabilizerLevel);
        }

        void Save()
        {
            PlayerPrefs.SetInt($"{prefsKey}.dmg", damageLevel);
            PlayerPrefs.SetInt($"{prefsKey}.stab", stabilizerLevel);
            PlayerPrefs.SetInt($"{prefsKey}.scrap", scrapParts);
            PlayerPrefs.Save();
        }

        void Load()
        {
            damageLevel     = PlayerPrefs.GetInt($"{prefsKey}.dmg", 0);
            stabilizerLevel = PlayerPrefs.GetInt($"{prefsKey}.stab", 0);
            scrapParts      = PlayerPrefs.GetInt($"{prefsKey}.scrap", 0);
        }
    }
}
