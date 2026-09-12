from PIL import Image, ImageDraw, ImageFont
import os

input_path = r"C:\Users\ADMIN\Desktop\PANTONG- Solid color\1-01.jpg"
output_dir = r"C:\Users\ADMIN\Desktop\CMYK色卡提取"
os.makedirs(output_dir, exist_ok=True)

img = Image.open(input_path)
w, h = img.size
print(f"Size: {w} x {h}, Mode: {img.mode}")

# Quick analysis - just first few blocks
thumb = img.resize((300, 300), Image.LANCZOS)
scale_x = w / 300
scale_y = h / 300

# Find first color block row
print("\nFinding color blocks...") 
color_rows = []
color_cols = []

for y in range(0, 300, 10):
    pixel = thumb.getpixel((150, y))
    if not (pixel == (0,0,0,0) or pixel[3] > 200):  # Not white and not black grid
        if (pixel[0] > 0 or pixel[1] > 0 or pixel[2] > 0) and pixel[3] < 200:
            color_rows.append(y)

for x in range(0, 300, 10):
    pixel = thumb.getpixel((x, 150))
    if not (pixel == (0,0,0,0) or pixel[3] > 200):
        if (pixel[0] > 0 or pixel[1] > 0 or pixel[2] > 0) and pixel[3] < 200:
            color_cols.append(x)

# Remove duplicates
color_rows = sorted(set(color_rows))
color_cols = sorted(set(color_cols))

print(f"Color rows: {len(color_rows)}")
print(f"Color cols: {len(color_cols)}")

# Create boundaries
row_boundaries = []
for i in range(len(color_rows) - 1):
    if color_rows[i+1] - color_rows[i] > 10:
        row_boundaries.append((color_rows[i], color_rows[i+1]))

col_boundaries = []
for i in range(len(color_cols) - 1):
    if color_cols[i+1] - color_cols[i] > 10:
        col_boundaries.append((color_cols[i], color_cols[i+1]))

print(f"\nRow boundaries: {row_boundaries[:10]}")
print(f"Col boundaries: {col_boundaries[:10]}")

count = 0
for ri, (ry1, ry2) in enumerate(row_boundaries[:10]):
    for ci, (cx1, cx2) in enumerate(col_boundaries[:10]):
        cx = int((cx1 + cx2) / 2 * scale_x)
        cy = int((ry1 + ry2) / 2 * scale_y)
        
        c, m, y, k = img.getpixel((cx, cy))
        
        # Create 1:1 image
        new_img = Image.new('RGB', (500, 500), (c, m, y))
        draw = ImageDraw.Draw(new_img)
        
        try:
            font = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 40)
        except:
            font = ImageFont.load_default()
        
        txt = f"C:{c} M:{m} Y:{y} K:{k}"
        bbox = draw.textbbox((0, 0), txt, font=font)
        tw, th = bbox[2]-bbox[0], bbox[3]-bbox[1]
        tx, ty = (500-tw)//2, (500-th)//2
        
        draw.rectangle([tx-5, ty-5, tx+tw+5, ty+th+5], fill='black')
        draw.text((tx, ty), txt, fill='white', font=font)
        
        name = f"1-01_r{ri}_c{ci}_{c}_{m}_{y}_{k}.png"
        new_img.save(os.path.join(output_dir, name))
        count += 1

print(f"\nGenerated {count} images")