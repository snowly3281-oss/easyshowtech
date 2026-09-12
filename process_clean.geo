from PIL import Image, ImageDraw, ImageFont
import os
import glob

def is_color_pixel(img, pixel):
    """判断是否是色块像素"""
    if img.mode == 'CMYK':
        k_val = pixel[3]
        c_val = pixel[0]
        m_val = pixel[1]
        y_val = pixel[2]
        has_color = (c_val > 0 or m_val > 0 or y_val > 0) and k_val < 200
        is_white = (c_val == 0 and m_val == 0 and y_val == 0 and k_val == 0)
        return has_color and not is_white
    else:
        return sum(pixel) < 250 * 3

def find_color_rows(img):
    """找出所有色块行"""
    thumb = img.resize((300, 300), Image.LANCZOS)
    scale_y = img.size[1] / 300
    rows = []
    prev_is_color = None
    for y in range(0, 300, 3):
        pixel = thumb.getpixel((150, y))
        is_color = is_color_pixel(img, pixel)
        if is_color != prev_is_color:
            rows.append((int(y * scale_y), is_color))
            prev_is_color = is_color
    # Group color segments
    blocks = []
    block_start = None
    for i, (y, is_color) in enumerate(rows):
        if is_color:
            block_start = y
        elif block_start is not None:
            blocks.append((block_start, y))
            block_start = None
    return blocks

def find_color_cols(img):
    """找出所有色块列"""
    thumb = img.resize((300, 300), Image.LANCZOS)
    scale_x = img.size[0] / 300
    cols = []
    prev_is_color = None
    for x in range(0, 300, 3):
        pixel = thumb.getpixel((x, 150))
        is_color = is_color_pixel(img, pixel)
        if is_color != prev_is_color:
            cols.append((int(x * scale_x), is_color))
            prev_is_color = is_color
    # Group color segments
    blocks = []
    block_start = None
    for i, (x, is_color) in enumerate(cols):
        if is_color:
            block_start = x
        elif block_start is not None:
            blocks.append((block_start, x))
            block_start = None
    return blocks

def main():
    input_dir = r"C:\Users\ADMIN\Desktop\PANTONG- Solid color"
    output_dir = r"C:\Users\ADMIN\Desktop\CMYK色卡提取"
    os.makedirs(output_dir, exist_ok=True)
    jpg_files = sorted(glob.glob(os.path.join(input_dir, "*.jpg")))
    print(f"Found {len(jpg_files)} images")
    total = 0
    for img_path in jpg_files:
        img = Image.open(img_path)
        w, h = img.size
        print(f"\nProcessing: {img_path}")
        rows = find_color_rows(img)
        cols = find_color_cols(img)
        print(f"Found {len(rows)} rows, {len(cols)} cols")
        count = 0
        for ri, (ry1, ry2) in enumerate(rows):
            for ci, (cx1, cx2) in enumerate(cols):
                if cx2 - cx1 < 100 or ry2 - ry1 < 100:
                    continue
                cx = (cx1 + cx2) // 2
                cy = (ry1 + ry2) // 2
                if img.mode == 'CMYK':
                    c, m, y, k = img.getpixel((cx, cy))
                else:
                    rgb = img.convert('RGB').getpixel((cx, cy))
                    c, m, y, k = 0, 0, 0, 0
                # Create 1:1 image
                new_img = Image.new('RGB', (500, 500), (c, m, y))
                draw = ImageDraw.Draw(new_img)
                try:
                    font = ImageFont.truetype("arial.ttf", 40)
                except:
                    font = ImageFont.load_default()
                txt = f"C:{c} M:{m} Y:{y} K:{k}"
                bbox = draw.textbbox((0, 0), txt, font=font)
                tw = bbox[2] - bbox[0]
                th = bbox[3] - bbox[1]
                tx = (500 - tw) // 2
                ty = (500 - th) // 2
                draw.rectangle([tx-5, ty-5, tx+tw+5, ty+th+5], fill='black')
                draw.text((tx, ty), txt, fill='white', font=font)
                name = f"{os.path.basename(img_path).replace('.jpg', '')}_r{ri}_c{ci}_{c}_{m}_{y}_{k}.png"
                new_img.save(os.path.join(output_dir, name))
                count += 1
        print(f"Generated {count}")
        total += count
    print(f"\nTotal: {total} images")

if __name__ == "__main__":
    main()