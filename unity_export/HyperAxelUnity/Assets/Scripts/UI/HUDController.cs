using UnityEngine;
using TMPro;
using UnityEngine.UI;

namespace HyperAxel
{
    /// <summary>
    /// HUD — hearts, coins, scrap meter w/ tier colors, speedrun timer, daily banner.
    /// Wire the fields in a prefab.
    /// </summary>
    public class HUDController : MonoBehaviour
    {
        [Header("Top-left cluster")]
        public TMP_Text stickersLabel;
        public TMP_Text coinsLabel;
        public TMP_Text scoreLabel;
        public Slider scrapMeter;
        public TMP_Text scrapTierLabel;
        public Image scrapFill;

        [Header("Top-right")]
        public TMP_Text levelNameLabel;
        public GameObject speedrunBox;
        public TMP_Text speedrunTimeLabel;

        [Header("Daily Banner")]
        public GameObject dailyBanner;
        public TMP_Text dailyNameLabel;

        static readonly Color Green  = new(0.50f, 0.88f, 0.54f);
        static readonly Color Yellow = new(1.00f, 0.83f, 0.28f);
        static readonly Color Orange = new(1.00f, 0.62f, 0.26f);
        static readonly Color Red    = new(1.00f, 0.35f, 0.35f);

        void Update()
        {
            var gm = GameManager.I;
            if (gm == null) return;

            if (stickersLabel) stickersLabel.text = $"♥ {gm.stickers}/{gm.maxStickers}";
            if (coinsLabel) coinsLabel.text = $"◎ {gm.coins}";
            if (scoreLabel) scoreLabel.text = $"{gm.score:N0}";

            var am = AssistManager.I;
            if (am && scrapMeter)
            {
                float r = am.scrap / am.maxScrap;
                scrapMeter.value = r;
                Color c; string tier;
                if (r < 0.25f) { c = Green;  tier = "GREEN"; }
                else if (r < 0.50f) { c = Yellow; tier = "YELLOW"; }
                else if (r < 0.75f) { c = Orange; tier = "ORANGE"; }
                else { c = Red; tier = "RED"; }
                if (scrapFill) scrapFill.color = c;
                if (scrapTierLabel) scrapTierLabel.text = $"SCRAP • {tier}";
            }

            if (speedrunBox) speedrunBox.SetActive(gm.speedrunMode);
            if (gm.speedrunMode && speedrunTimeLabel)
            {
                float ms = gm.runFinalMs > 0 ? gm.runFinalMs : (Time.time - gm.runStartT) * 1000f;
                int totalMs = Mathf.FloorToInt(ms);
                int min = totalMs / 60000;
                int sec = (totalMs % 60000) / 1000;
                int cs = (totalMs % 1000) / 10;
                speedrunTimeLabel.text = $"{min:00}:{sec:00}.{cs:00}";
            }

            if (dailyBanner) dailyBanner.SetActive(gm.dailyMode);
        }
    }
}
