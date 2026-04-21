"""One-shot script to generate 4 claymation-style enemy sprites via Gemini Nano Banana."""
import asyncio
import os
import base64
from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

load_dotenv()

API_KEY = os.getenv("EMERGENT_LLM_KEY")
MODEL_ID = "gemini-3.1-flash-image-preview"
OUT_DIR = "/app/frontend/public/enemies"
os.makedirs(OUT_DIR, exist_ok=True)

STYLE = (
    "Claymation / stop-motion 2D sprite. Single character on pure white transparent background, "
    "centered, facing right, 3/4 view. Bold thick black ink outlines, chunky clay-like texture "
    "with fingerprint imperfections. Muted earthy palette. Game character, consistent with "
    "a dark action-platformer aesthetic. No text, no extra objects, just the creature."
)

ENEMIES = [
    ("root_crawler",
     "A baby triceratops dinosaur made of mossy beige-green clay with small cracked bone plates, "
     "scratched armor scutes, three small horns on the face, short stubby legs. Angry but small, "
     "about the size of a dog. Dirt smudges. " + STYLE),
    ("gear_bug",
     "A small mechanical beetle robot made of brass and copper-colored clay, visible exposed cogs "
     "on its back, segmented thorax with glowing yellow eyes, four thin mechanical legs. Gritty, "
     "industrial, rusted joints. " + STYLE),
    ("flicker",
     "A ghostly electrical wisp creature, half-dissipated translucent form, bluish-white with "
     "crackling static glow at the edges, faint skull-like face in the center, arcane runes "
     "floating around it. Stop-motion clay but with a spectral hazy look. " + STYLE),
    ("heavy",
     "A large hulking armored machine enemy, grayish-brown clay body with heavy rivets, thick "
     "armor plates, small glowing red eye-slit, menacing stance, bulky shoulders, short stubby "
     "legs, fist weapons. Looks like a boss minion. " + STYLE),
]


async def main():
    for name, prompt in ENEMIES:
        out = os.path.join(OUT_DIR, f"{name}.png")
        if os.path.exists(out):
            print(f"[skip] {name} already exists")
            continue
        print(f"[gen ] {name} ...")
        try:
            chat = LlmChat(api_key=API_KEY, session_id=f"enemy-{name}",
                           system_message="You are a 2D game sprite artist.")
            chat.with_model("gemini", MODEL_ID).with_params(modalities=["image", "text"])
            _, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
            if not images:
                print(f"[fail] {name} — no image returned")
                continue
            img_bytes = base64.b64decode(images[0]["data"])
            with open(out, "wb") as f:
                f.write(img_bytes)
            print(f"[ok  ] {name} saved ({len(img_bytes)} bytes)")
        except Exception as e:
            print(f"[err ] {name} — {type(e).__name__}: {str(e)[:200]}")

    print("\nFinal dir listing:")
    for f in sorted(os.listdir(OUT_DIR)):
        path = os.path.join(OUT_DIR, f)
        print(f"  {f}  {os.path.getsize(path)} bytes")


if __name__ == "__main__":
    asyncio.run(main())
