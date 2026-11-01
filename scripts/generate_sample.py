"""Generate a fictional receipt fixture; no beneficiary data or official branding."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent.parent
fonts = [Path('/System/Library/Fonts/Menlo.ttc'), Path('/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf')]
font_path = next((p for p in fonts if p.exists()), None)
def font(size):
    return ImageFont.truetype(str(font_path), size) if font_path else ImageFont.load_default(size=size)
image = Image.new('RGB', (900, 1000), '#fffdf3')
draw = ImageDraw.Draw(image)
draw.rectangle((30, 30, 870, 970), outline='#bdc6b2', width=2)
lines = [
    ('RATIONPROOF / TEST FIXTURE', 26),
    ('SYNTHETIC DEMO RECEIPT', 34),
    ('Not a real ration transaction', 23),
    ('--------------------------------', 30),
    ('Receipt ID: DEMO-001', 30),
    ('Date: 2026-11-03', 30),
    ('Rice: 25 kg', 34),
    ('--------------------------------', 30),
    ('Use this image to test local OCR.', 23),
    ('Received quantity is not known.', 23),
    ('Enter your measurement separately.', 23),
    ('No actual person or shop is named.', 23),
]
y = 85
for text, size in lines:
    draw.text((65, y), text, fill='#183b33', font=font(size))
    y += 62 if size >= 30 else 50
image.save(root / 'static' / 'demo-receipt.png')
print('Created synthetic sample receipt.')
