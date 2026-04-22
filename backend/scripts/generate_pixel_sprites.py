"""Generate chunky 16-bit pixel-art sprites via Gemini Nano Banana.

Output goes to /app/frontend/public/sprites/ (used by canvas renderer)
and /app/godot_project/HyperAxel/sprites/ (used by Godot Sprite3D nodes).
"""
import asyncio
import os
import base64
import shutil
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

API_KEY = os.getenv("EMERGENT_LLM_KEY")
MODEL_ID = "gemini-3.1-flash-image-preview"
OUT_DIR = "/app/frontend/public/sprites"
GODOT_DIR = "/app/godot_project/HyperAxel/sprites"
os.makedirs(OUT_DIR, exist_ok=True)
os.makedirs(GODOT_DIR, exist_ok=True)

STYLE = (
    "Chunky 16-bit pixel-art game sprite, single character centered on PURE TRANSPARENT "
    "background (no scenery, no background, no text). PICO-8 / arcade aesthetic. Bold "
    "black pixel outlines (1-2 px thick), limited saturated palette (warm yellow, fire "
    "red, leafy green, sky blue, cream off-white, dark ink), crisp nearest-neighbor "
    "pixel edges, NO anti-aliasing, NO gradients. Small sprite roughly 64x64 effective "
    "resolution even if rendered larger. Facing RIGHT, 3/4 idle stance. "
    "No shadows, no dialogue, no UI, just the character in isolation."
)

SPRITES = [
    ("axel",
     "A brave young girl protagonist named Axel wearing a red baseball cap, goggles on "
     "her forehead, short brown hair poking out, blue mechanic overalls with a wrench-shaped "
     "buckle, thick red gloves, sturdy brown boots. She holds a big steel wrench in her "
     "right hand. Determined expression. Chunky retro game hero. " + STYLE),

    ("scrap",
     "A small friendly robot companion named Scrap. Boxy head with a single large glowing "
     "teal cyclops eye, stubby antenna with a red bulb on top, grey riveted metal body "
     "with two short mechanical arms. Looks curious and loyal. " + STYLE),

    ("root_crawler",
     "A small angry baby triceratops dinosaur enemy. Mossy GREEN body with three small "
     "horns, tiny bone plates on its back, short stubby legs. Grumpy expression, red eyes. "
     "Dog-sized. Leaves and dirt clinging to its back. " + STYLE),

    ("gear_bug",
     "A small mechanical beetle robot enemy. Bronze/copper pixel body with exposed spinning "
     "cog on its back, six thin mechanical legs, glowing YELLOW compound eyes, rusted "
     "segmented thorax. Industrial menace. " + STYLE),

    ("flicker",
     "A ghostly electrical wisp enemy. Translucent bluish-white spectral skull-shaped "
     "body with flickering static crackle at the edges, two burning PURPLE eye sockets, "
     "wisps of electricity trailing behind. Spooky, half-there. " + STYLE),

    ("heavy",
     "A hulking armored walker enemy, the tanky miniboss. Dark grey steel plated body "
     "with exposed rivets, a single slitted RED eye visor, massive boxing-glove fists, "
     "thick stubby legs, yellow caution stripes on shoulders. Looks slow but deadly. "
     + STYLE),

    ("boss",
     "A massive final boss robot called the ROOTBOUND SIEGE TANK. Huge brass and green "
     "mechanical war machine with treads, a thorny root-vine crown growing from its head, "
     "two giant cannon arms with glowing orange cores, a red glass eye in the center of "
     "its chest, armored plating with gears and pipes. Intimidating, fills the frame. "
     + STYLE),
]


async def main():
    failures = []
    for name, prompt in SPRITES:
        out = os.path.join(OUT_DIR, f"{name}.png")
        if os.path.exists(out):
            print(f"[skip] {name} already exists ({os.path.getsize(out)} bytes)")
            continue
        print(f"[gen ] {name} ...")
        try:
            chat = LlmChat(api_key=API_KEY, session_id=f"sprite-{name}",
                           system_message="You are a retro pixel-art game sprite artist. "
                                          "You output clean single-character sprites only.")
            chat.with_model("gemini", MODEL_ID).with_params(modalities=["image", "text"])
            _, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
            if not images:
                print(f"[fail] {name} — no image returned")
                failures.append(name)
                continue
            img_bytes = base64.b64decode(images[0]["data"])
            with open(out, "wb") as f:
                f.write(img_bytes)
            # mirror to Godot
            shutil.copy(out, os.path.join(GODOT_DIR, f"{name}.png"))
            print(f"[ok  ] {name} saved ({len(img_bytes)} bytes) + mirrored to Godot")
        except Exception as e:
            print(f"[err ] {name} — {type(e).__name__}: {str(e)[:200]}")
            failures.append(name)

    print("\n=== Summary ===")
    for f in sorted(os.listdir(OUT_DIR)):
        path = os.path.join(OUT_DIR, f)
        print(f"  {f}  {os.path.getsize(path)} bytes")
    if failures:
        print(f"\nFAILED: {failures}")
    else:
        print("\nAll sprites generated successfully.")


if __name__ == "__main__":
    asyncio.run(main())
