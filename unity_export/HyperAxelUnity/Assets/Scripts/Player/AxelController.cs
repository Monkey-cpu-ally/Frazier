using UnityEngine;

namespace HyperAxel
{
    /// <summary>
    /// Axel movement controller — ported from /app/frontend/src/game/player.js.
    /// Uses Rigidbody2D for physics. Preserves Godot-style coyote time + jump buffer
    /// that were meticulously tuned over iterations 1-7.
    /// </summary>
    [RequireComponent(typeof(Rigidbody2D), typeof(CapsuleCollider2D))]
    public class AxelController : MonoBehaviour
    {
        // ── Tuning (mirrors PL constants) ─────────────────────────────────
        [Header("Movement")]
        public float moveSpeed = 260f;          // PL.speed
        public float jumpVelocity = 11f;        // PL.jumpV (scaled from 600)
        public float gravityScale = 3f;
        public float fallGravityMul = 1.8f;     // PL.fallGravMul
        public float lowJumpGravityMul = 2.2f;  // PL.lowJumpGravMul
        public float maxFall = 18f;             // PL.maxFall

        [Header("Dash")]
        public float dashSpeed = 16f;
        public float dashDuration = 0.18f;      // PL.dashTime
        public float dashCooldown = 0.6f;

        [Header("Wall")]
        public float wallSlideSpeed = 1.8f;
        public Vector2 wallJump = new Vector2(8f, 10f);

        [Header("Timing Windows")]
        public float coyoteTime = 0.12f;
        public float jumpBuffer = 0.12f;
        public float invTime = 0.6f;            // i-frames after hit

        [Header("References")]
        public Transform groundCheck;
        public Transform wallCheckRight;
        public Transform wallCheckLeft;
        public LayerMask groundMask;
        public LayerMask enemyMask;

        // ── Runtime state ─────────────────────────────────────────────────
        Rigidbody2D rb;
        float coyoteT, jumpBufT, dashT, dashCdT, invT;
        bool grounded, onWallR, onWallL, isDashing, canDash = true;
        int facing = 1;
        public int Facing => facing;

        // Power hooks — set by PowerManager
        public bool hyperMode;
        public bool superMode;
        public bool specterMode;
        public bool goldenGloves;
        public bool burningBuffalo;

        // Environmental — set by biome / waterfall
        public float gravityMul = 1f;
        public bool waterfallActive;
        public bool noDashModifier;   // daily challenge

        void Awake()
        {
            rb = GetComponent<Rigidbody2D>();
            rb.gravityScale = gravityScale;
        }

        void Update()
        {
            // Timers
            coyoteT -= Time.deltaTime;
            jumpBufT -= Time.deltaTime;
            dashT -= Time.deltaTime;
            dashCdT -= Time.deltaTime;
            invT -= Time.deltaTime;

            // Grounding
            grounded = Physics2D.OverlapCircle(groundCheck.position, 0.1f, groundMask);
            onWallR = Physics2D.OverlapCircle(wallCheckRight.position, 0.08f, groundMask);
            onWallL = Physics2D.OverlapCircle(wallCheckLeft.position, 0.08f, groundMask);

            if (grounded) { coyoteT = coyoteTime; canDash = true; }

            // Input
            float moveDir = Input.GetAxisRaw("Horizontal");
            if (Input.GetButtonDown("Jump")) jumpBufT = jumpBuffer;
            if (Input.GetButtonDown("Dash") && !noDashModifier) TryDash(moveDir);
            if (Input.GetButtonDown("Attack")) DoAttack();

            // Horizontal move
            if (!isDashing)
            {
                float spdMul = hyperMode ? 1.5f : superMode ? 1.4f : 1f;
                rb.linearVelocity = new Vector2(moveDir * moveSpeed / 60f * spdMul, rb.linearVelocity.y);
                if (Mathf.Abs(moveDir) > 0.1f) facing = moveDir > 0 ? 1 : -1;
            }

            // Jump (with coyote + buffer)
            if (jumpBufT > 0 && (grounded || coyoteT > 0))
            {
                float jumpMul = waterfallActive ? 0.5f : (superMode ? 1.15f : 1f);
                rb.linearVelocity = new Vector2(rb.linearVelocity.x, jumpVelocity * jumpMul);
                coyoteT = 0; jumpBufT = 0;
            }

            // Wall jump
            if (!grounded && (onWallL || onWallR) && Input.GetButtonDown("Jump"))
            {
                int wallDir = onWallL ? 1 : -1;
                rb.linearVelocity = new Vector2(wallDir * wallJump.x, wallJump.y);
                facing = wallDir;
            }

            // Variable gravity for that crisp Godot jump feel
            float envMul = waterfallActive ? 2.5f : gravityMul;
            if (rb.linearVelocity.y > 0 && !Input.GetButton("Jump"))
                rb.gravityScale = gravityScale * lowJumpGravityMul * envMul;
            else if (rb.linearVelocity.y < 0)
                rb.gravityScale = gravityScale * fallGravityMul * envMul;
            else
                rb.gravityScale = gravityScale * envMul;

            // Wall slide
            bool onWall = onWallL || onWallR;
            if (!grounded && onWall && rb.linearVelocity.y < -wallSlideSpeed)
                rb.linearVelocity = new Vector2(rb.linearVelocity.x, -wallSlideSpeed);

            // Clamp max fall
            if (rb.linearVelocity.y < -maxFall)
                rb.linearVelocity = new Vector2(rb.linearVelocity.x, -maxFall);

            // Flip sprite
            transform.localScale = new Vector3(facing, 1, 1);
        }

        void TryDash(float moveDir)
        {
            if (!canDash || dashCdT > 0) return;
            isDashing = true; canDash = false; dashT = dashDuration; dashCdT = dashCooldown;
            int dir = Mathf.Abs(moveDir) > 0.1f ? (int)Mathf.Sign(moveDir) : facing;
            rb.linearVelocity = new Vector2(dir * dashSpeed, 0);
            Invoke(nameof(EndDash), dashDuration);
        }
        void EndDash() { isDashing = false; }

        void DoAttack()
        {
            // Implement: spawn a hitbox or use OverlapBoxAll on enemyMask in front of facing.
            // Damage calc: dmg = goldenGloves ? 2 : hyperMode ? 2 : superMode ? 1.5f : 1f
        }

        public void TakeDamage(int dmg, Vector2 sourcePos)
        {
            if (invT > 0 || specterMode || isDashing) return;
            // Apply daily modifier dmg_taken_mul here (see DailyChallenge.cs)
            invT = invTime;
            Vector2 knockDir = (transform.position - (Vector3)sourcePos).normalized;
            rb.linearVelocity = knockDir * 6f + Vector2.up * 2f;
            // Trigger your health system here (Stickers)
            GameManager.I.OnPlayerHit(dmg);
        }
    }
}
