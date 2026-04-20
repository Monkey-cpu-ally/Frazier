// Dialogue data and system for Scrap and Fox Spirit

export const DIALOGUES = {
  intro: [
    { speaker: 'scrap', text: "Systems online. Scanning sector..." },
    { speaker: 'scrap', text: "Multiple hostiles detected ahead. Recommend standard protocol." },
    { speaker: 'scrap', text: "Wrench is calibrated. You're clear to engage." },
  ],
  level2_enter: [
    { speaker: 'scrap', text: "Vertical structures detected. Watch your footing." },
    { speaker: 'scrap', text: "Scrap readings stronger up high. Climb." },
  ],
  level3_enter: [
    { speaker: 'scrap', text: "Floor integrity compromised in this sector." },
    { speaker: 'scrap', text: "Downward smash might reveal hidden paths. Use caution." },
  ],
  level4_enter: [
    { speaker: 'scrap', text: "Power signature detected nearby. Burning Buffalo class." },
    { speaker: 'scrap', text: "That wall won't hold against a charged run." },
  ],
  boss_enter: [
    { speaker: 'scrap', text: "WARNING. Siege-class machine ahead." },
    { speaker: 'scrap', text: "Rootbound Siege Tank. Armor rating: high." },
    { speaker: 'scrap', text: "Strike the core when it overheats. That's your window." },
  ],
  boss_vulnerable: [
    { speaker: 'scrap', text: "Core exposed! Hit it now!" },
  ],
  boss_defeated: [
    { speaker: 'scrap', text: "Siege Tank neutralized. Scrap levels nominal." },
    { speaker: 'fox', text: "..." },
    { speaker: 'fox', text: "Follow the light." },
  ],
  fox_interact: [
    { speaker: 'fox', text: "The path ahead is clear. Something waits beyond." },
    { speaker: 'fox', text: "You carry the tools of the old builders." },
    { speaker: 'fox', text: "Go." },
  ],
  power_first: [
    { speaker: 'scrap', text: "Power orb acquired. 15-second charge window." },
    { speaker: 'scrap', text: "Only one power active at a time. Choose wisely." },
  ],
  death_hint: [
    { speaker: 'scrap', text: "System failure. Rebooting..." },
    { speaker: 'scrap', text: "Recommendation: avoid direct contact with hostiles." },
  ],
  workshop_enter: [
    { speaker: 'scrap', text: "This place... I know it." },
    { speaker: 'scrap', text: "Old workshop. My components were assembled here." },
    { speaker: 'scrap', text: "Check the benches. Useful parts might remain." },
  ],
  canopy_enter: [
    { speaker: 'scrap', text: "Canopy layer. No solid ground below." },
    { speaker: 'scrap', text: "Branch integrity varies. Stay sharp." },
  ],
  pipe_enter: [
    { speaker: 'scrap', text: "Industrial pipe network. Pre-collapse infrastructure." },
    { speaker: 'scrap', text: "Wall surfaces should support lateral jumps here." },
  ],
  vault_enter: [
    { speaker: 'scrap', text: "Energy signature anomaly. Mirror-class resonance." },
    { speaker: 'scrap', text: "Something is sealed in this vault. Fragments detected." },
    { speaker: 'fox', text: "...you're close now." },
  ],
  core_enter: [
    { speaker: 'scrap', text: "Final sector. All hostiles converging." },
    { speaker: 'scrap', text: "Whatever broke this world... it started here." },
    { speaker: 'scrap', text: "Full power recommended. Don't hold back." },
  ],
  mirror_fragment: [
    { speaker: 'scrap', text: "Mirror fragment acquired. Resonance stored." },
    { speaker: 'fox', text: "One piece closer to the truth." },
  ],
  all_fragments: [
    { speaker: 'fox', text: "You found them all." },
    { speaker: 'fox', text: "The mirror remembers. Look inside." },
    { speaker: 'scrap', text: "Full mirror resonance achieved. Something is unlocking..." },
  ],
};

export const SPEAKER_CONFIG = {
  scrap: {
    name: 'SCRAP',
    color: '#7DA5BD',
    bgColor: 'rgba(30,50,60,0.95)',
    borderColor: '#5A8098',
    portrait: 'scrap',
  },
  fox: {
    name: 'FOX SPIRIT',
    color: '#88CCFF',
    bgColor: 'rgba(20,40,60,0.95)',
    borderColor: '#4488AA',
    portrait: 'fox',
  },
};

export class DialogueManager {
  constructor() {
    this.active = false;
    this.queue = [];
    this.current = null;
    this.charIndex = 0;
    this.charTimer = 0;
    this.charSpeed = 0.03;
    this.waitingForInput = false;
    this.seenDialogues = new Set();
    this.onComplete = null;
  }

  trigger(dialogueId, onComplete) {
    if (this.seenDialogues.has(dialogueId)) return;
    const lines = DIALOGUES[dialogueId];
    if (!lines) return;
    this.seenDialogues.add(dialogueId);
    this.queue = [...lines];
    this.onComplete = onComplete || null;
    this._nextLine();
  }

  _nextLine() {
    if (this.queue.length === 0) {
      this.active = false;
      this.current = null;
      if (this.onComplete) this.onComplete();
      return;
    }
    const line = this.queue.shift();
    const cfg = SPEAKER_CONFIG[line.speaker] || SPEAKER_CONFIG.scrap;
    this.current = { ...line, ...cfg };
    this.charIndex = 0;
    this.charTimer = 0;
    this.waitingForInput = false;
    this.active = true;
  }

  update(dt) {
    if (!this.active || !this.current) return;
    if (this.waitingForInput) return;

    this.charTimer += dt;
    if (this.charTimer >= this.charSpeed) {
      this.charTimer = 0;
      this.charIndex++;
      if (this.charIndex >= this.current.text.length) {
        this.waitingForInput = true;
      }
    }
  }

  advance() {
    if (!this.active) return;
    if (!this.waitingForInput) {
      this.charIndex = this.current.text.length;
      this.waitingForInput = true;
      return;
    }
    this._nextLine();
  }

  getDisplayText() {
    if (!this.current) return '';
    return this.current.text.substring(0, this.charIndex);
  }

  reset() {
    this.active = false;
    this.queue = [];
    this.current = null;
    this.seenDialogues.clear();
  }
}
