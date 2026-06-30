#!/usr/bin/env python3
"""Generate preview.png (116x76) for Dashboard Studio visualization picker."""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

WIDTH = 116
HEIGHT = 76
BG = (11, 31, 59)  # #0B1F3B
TEXT = (255, 255, 255)
ACCENT = (223, 166, 17)  # #DFA611

package_root = Path(__file__).resolve().parent
output_path = (
    package_root
    / "visualizations"
    / "splunkstuff_kpi_sparkline_studio"
    / "preview.png"
)


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf",
    ]
    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def main() -> None:
    image = Image.new("RGB", (WIDTH, HEIGHT), BG)
    draw = ImageDraw.Draw(image)

    font = load_font(22)
    text = "JCPP"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    text_x = (WIDTH - text_w) // 2
    text_y = 14
    draw.text((text_x, text_y), text, fill=TEXT, font=font)

    spark_y = text_y + text_h + 10
    points = [
        (12, spark_y + 10),
        (28, spark_y + 4),
        (44, spark_y + 12),
        (60, spark_y + 2),
        (76, spark_y + 8),
        (92, spark_y + 6),
        (104, spark_y + 3),
    ]
    draw.line(points, fill=TEXT, width=2, joint="curve")
    draw.ellipse((points[-1][0] - 2, points[-1][1] - 2, points[-1][0] + 2, points[-1][1] + 2), fill=ACCENT)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    image.save(output_path, format="PNG", optimize=True)
    print(f"generate-preview: ok -> {output_path}")


if __name__ == "__main__":
    main()
