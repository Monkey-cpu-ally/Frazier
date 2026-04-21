using UnityEngine;
using UnityEngine.Events;

namespace HyperAxel
{
    /// <summary>
    /// City Hub kiosk — SHOP / UPGRADE_STATION / MISSION_GATE.
    /// Requires trigger collider. Fires UnityEvent on E press while overlapping.
    /// </summary>
    [RequireComponent(typeof(Collider2D))]
    public class Interactable : MonoBehaviour
    {
        public enum Kind { Shop, UpgradeStation, MissionGate }
        public Kind kind;
        public UnityEvent onInteract;

        bool playerInRange;
        bool latch;

        void OnTriggerEnter2D(Collider2D other)
        {
            if (other.GetComponent<AxelController>() != null) { playerInRange = true; latch = false; }
        }
        void OnTriggerExit2D(Collider2D other)
        {
            if (other.GetComponent<AxelController>() != null) { playerInRange = false; latch = false; }
        }

        void Update()
        {
            if (!playerInRange || latch) return;
            if (Input.GetKey(KeyCode.E)) { latch = true; onInteract?.Invoke(); }
        }
    }
}
