from PIL import Image, ImageDraw, ImageFont
import os
import glob

def is_white_pixel(img, pixel):
    """判断是否是白色像素"""
    if img.mode == 'CMYK':
        return pixel == (0, 0, 0, 0)
    return sum(pixel) > 250 * 3

def is_black_grid_pixel(img, pixel):
    """判断是否是黑色网格线"""
    if img.mode == 'CMYK':
        return pixel[3] > 200  # K值高=黑色
    return sum(pixel) < 100

def is_color_block_pixel(img, pixel):
    """判断是否是色块像素（不是白色也不是黑色网格）"""
    if is_white_pixel(img, pixel) or is_black_grid_pixel(img, pixel):
        return False
    if img.mode == 'CMYK':
        c, m, y, k = pixel
        return (c > 0 or m > 0 or y > 0) and k < 200
    return sum(pixel) < 255 * 3

def find_color_boundaries(img, direction='horizontal', sample_pos=150):
    """找出色块边界"""
    thumb = img.resize((300, 300), Image.LANCZOS)
    if direction == 'horizontal':
        size = 300
        get_pixel = lambda pos: thumb.getpixel((sample_pos, pos))
    else:
        size = 300
        get_pixel = lambda pos: thumb.getpixel((pos, sample_pos))
    
    scale = img.size[1] / 300 if direction == 'horizontal' else img.size[0] / 300
    
    boundaries = []
    prev_is_color = None
    
    for i in range(0, size, 3):
        pixel = get_pixel(i)
        is_color = is_color_block_pixel(img, pixel)
        
        if is_color != prev_is_color:
            boundaries.append((int(i * scale), is_color))
            prev_is_color = is_color
    
    # Group consecutive color segments
    blocks = []
    block_start = None
    
    for pos, is_color in boundaries:
        if is_color:
            block_start = pos
        elif block_start is not None:
            blocks.append((block_start, pos))
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
        base_name = os.path.basename(img_path).replace('.jpg', '')
        print(f"\nProcessing: {base_name}")
        
        # Find color block rows and columns
        rows = find_color_boundaries(img, 'horizontal', sample_pos=150)
        cols = find_color_boundaries(img, 'vertical', sample_pos=150)
        
        print(f"Found {len(rows)} color rows, {len(cols)} color cols")
        
        count = 0
        
        for ri, (ry1, ry2) in enumerate(rows):
            for ci, (cx1, cx2) in enumerate(cols):
                # Skip small blocks (grid lines)
                if cx2 - cx1 < 50 or ry2 - ry1 < 50:
                    continue
                
                # Get center position
                cx = (cx1 + cx2) // 2
                cy = (ry1 + ry2) // 2
                
                # Get CMYK value
                if img.mode == 'CMYK':
                    c, m, y, k = img.getpixel((cx, cy))
                    # Convert CMYK to RGB for display color
                    r = 255 - int(c * 2.55)
                    g = 255 - int(m * 2.55)
                    b = 255 - int(y * 2.55)
                    color = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))
                else:
                    rgb_img = img.convert('RGB')
                    color = rgb_img.getpixel((cx, cy))
                    c, m, y, k = 0, 0, 0, 0
                
                # Create 1:1 image with color
                img_size = 500
                new_img = Image.new('RGB', (img_size, img_size), color)
                
                # Draw CMYK text
                draw = ImageDraw. Draw(new_img)
                
                try:
                    font = ImageFont.truetype("arial.ttf", 40)
                except:
                    try:
                        font = ImageFont. truetype("C:/Windows/Fonts/arial.ttf", 40)
                    except:
                        font = ImageFont. load_default()
                
                cmyk_text = f"C:{c} M:{m} Y:{y} K:{k}"
                bbox = draw.textbbox((0, 0), cmyk_text, font=font)
                text_w = bbox[2] - bbox[0]
                text_h = bbox[3] - bbox[1]
                text_x = (img_size - text_w) // 2
                text_y = (img_size - text_h) // 2
                
                # Draw black background for text
                padding = 10
                draw.rectangle([text_x - padding, text_y - padding, 
                            text_x + text_w + padding, text_y + text_h + padding], 
                           fill='black')
                # Draw white text
                draw.text((text_x, text_y), cmyk_text, fill='white', font=font)
                
                # Save
                output_name = f"{base_name}_r{ri}_c{ci}_{c}_{m}_{y}_{k}.png"
                output_path = os.path.join(output_dir, output_name)
                new_img.save(output_path)
                count += 1
        
        print(f"Generated {count} images")
        total += count
    
    print(f"\nTotal: {total} images saved to {output_dir}")

if __name__ == "__main__":
    main()