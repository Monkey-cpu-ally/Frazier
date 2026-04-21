using UnityEngine;

namespace HyperAxel
{
    public enum EnemyFamily { Dinosaur, Machine, Element }
    public enum SizeClass { Weak, Large }

    /// <summary>
    /// Base enemy. Port of EnemyBase (enemies.js).
    /// Subclass and override AI() for variants (RootCrawler, GearBug, Flicker, Heavy).
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D), typeof(SpriteRenderer))]
    public class EnemyBase : MonoBehaviour
    {
        [Header("Identity")]
        public string enemyType = "root_crawler";
        public EnemyFamily family = EnemyFamily.Dinosaur;
        public SizeClass sizeClass = SizeClass.Weak;
        public bool armored;       // heavy chassis
        public bool flicker;       // blink invuln cycle

        [Header("Stats")]
        public int maxHp = 2;
        public float speed = 65f;
        public int damage = 1;
        public int scoreValue = 50;
        public int scrapDrop = 1;

        [Header("Patrol")]
        public float patrolRange = 110f;
        public Vector3 originPos;
        public int dir = 1;

        [Header("Biome Tint")]
        public Color tintColor = Color.white;

        // Runtime
        protected int hp;
        protected Rigidbody2D rb;
        protected SpriteRenderer sr;
        protected bool alive = true;
        protected float hurtTimer, flashTimer;
        protected bool flickerOpen = true;
        protected float flickerT = 0.95f;

        protected virtual void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            sr = GetComponent<SpriteRenderer>();
            hp = maxHp;
            originPos = transform.position;
            if (tintColor != Color.white) sr.color = Color.Lerp(Color.white, tintColor, 0.4f);
        }

        protected virtual void Update()
        {
            if (!alive) return;
            if (hurtTimer > 0) hurtTimer -= Time.deltaTime;
            if (flashTimer > 0) flashTimer -= Time.deltaTime;

            if (flicker)
            {
                flickerT -= Time.deltaTime;
                if (flickerT <= 0) { flickerT = 0.95f; flickerOpen = !flickerOpen; }
                var c = sr.color; c.a = flickerOpen ? 1f : 0.32f; sr.color = c;
            }
            AI();
        }

        /// <summary>Override in subclasses.</summary>
        protected virtual void AI()
        {
            rb.linearVelocity = new Vector2(dir * speed / 60f, rb.linearVelocity.y);
            if (Mathf.Abs(transform.position.x - originPos.x) > patrolRange) dir *= -1;
        }

        /// <summary>
        /// Apply damage. Respects armor gating and flicker invuln unless bypass specified.
        /// </summary>
        public virtual void TakeDamage(int amount, Vector2 fromPos, bool smash = false, bool bypassArmor = false, bool bypassFlicker = false)
        {
            if (flicker && !flickerOpen && !bypassFlicker) return;
            if (armored && !bypassArmor)
            {
                var pm = PowerManager.I;
                bool empowered = pm && (pm.IsGoldenGloves || pm.IsBurningBuffalo || smash);
                if (!empowered) return;
                amount += 1;
            }
            hp -= amount;
            hurtTimer = 0.12f; flashTimer = 0.12f;
            Vector2 kb = ((Vector2)transform.position - fromPos).normalized * 2.5f + Vector2.up * 1.5f;
            rb.linearVelocity = kb;
            if (hp <= 0) Die();
        }

        public void TakePercentDamage(float pct, Vector2 fromPos)
        {
            int dmg = Mathf.Max(1, Mathf.CeilToInt(maxHp * pct));
            TakeDamage(dmg, fromPos, bypassArmor: true, bypassFlicker: true);
        }

        protected virtual void Die()
        {
            alive = false;
            AchievementTracker.I?.OnEnemyKilled();
            GameManager.I?.OnEnemyDefeated(scoreValue, scrapDrop);
            Destroy(gameObject, 0.4f);
        }

        public bool IsWeak => sizeClass == SizeClass.Weak;
        public bool IsLarge => sizeClass == SizeClass.Large;
    }
}
