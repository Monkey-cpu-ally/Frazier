using UnityEngine;
using UnityEngine.InputSystem;

namespace HyperAxel
{
    /// <summary>
    /// Bridges the PlayerControls.inputactions asset to the legacy Input axes
    /// used by AxelController (Horizontal, Jump, Dash, Attack).
    /// Drop this on the Player GameObject along with a PlayerInput component
    /// referencing PlayerControls.inputactions.
    /// Alternatively you can swap AxelController's Input.GetAxis calls over to
    /// direct action references — this bridge keeps the existing script usable.
    /// </summary>
    [RequireComponent(typeof(PlayerInput))]
    public class InputBridge : MonoBehaviour
    {
        PlayerInput pi;
        InputAction move, jump, dash, attack, assist, interact, pause;

        public float Horizontal { get; private set; }
        public bool JumpHeld => jump != null && jump.IsPressed();

        void Awake()
        {
            pi = GetComponent<PlayerInput>();
            var a = pi.actions;
            move     = a.FindAction("Move");
            jump     = a.FindAction("Jump");
            dash     = a.FindAction("Dash");
            attack   = a.FindAction("Attack");
            assist   = a.FindAction("Assist");
            interact = a.FindAction("Interact");
            pause    = a.FindAction("Pause");
        }

        void Update()
        {
            Horizontal = move?.ReadValue<float>() ?? 0f;
            if (assist != null && assist.WasPressedThisFrame()) AssistManager.I?.TriggerAssist();
            // Jump/Dash/Attack are consumed directly by AxelController via Input Manager axes
            // in simple projects. For new-input-only projects, expose events here and wire them.
        }
    }
}
