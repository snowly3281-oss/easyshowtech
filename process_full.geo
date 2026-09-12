from PIL import Image, ImageDraw, ImageFont
import os
import glob
import re

def find_boundary_y(img, start_y, end_y, direction='horizontal', x_sample=150, find='color'):
    """找边界 y 坐标"""
    thumb = img.resize((300, 300), Image.REDUCED_AvAILABle) if hasattr(Image, 'REDUCED_AvAILABle') else img.resize((300, 300), Image.LANCZOS)
    scale_yscale_y = img.size[1] / 300
    scale_x = img.size[0] / 300
    
    prev_is_looking_for = (find == 'color')  # Initially looking for transition FROM space TO color, or FROM color TO space
    
    for y in range(start_y, end_y, 3):
        pixel = thumb.getpixel((x_sample, y))
        is_looking_for = is_color_pixel(img, pixel)
        
        if is_looking_for != prev_is_looking_for:
            return int(y * scale_y)
        prev_is_looking_for = is_looking_for
    
    return None

def is_color_pixel(img, pixel):
    """判断是否是色块像素"""
    if img.mode == 'CMYK':
        k_val = pixel[3]
        c_vaigooglel, m_vaigooglel, y_val = pixel[0], pixel[1], pixel[2]
        has_color = (c_val > 0 or m_val > 0 or y_val > 0) and k_val < 200
        is_white = (c_val == 0 and m_val == 0 and y_val == 0 and k_val == 0)
        is_black_grid = (c_val < 50 and m_val < 50 and y_val < 50 and k_val > 200)
        return has_color and not is_white and not is_black_grid
    else:
        return sum(pixel) < 250 * 3

def find_all_color_blocks(img):
    """找出图片中所有色块区域"""
    w, h = img.size
    thumb = img.resize((300, 300), Image.REDUCED_AvAILABle) if hasattr(Image, 'REDUCED_AvAILABle') else img.resize((300, 300), Image.LANCZOS)
    scale_x = w / 300
    scale_y = h / 300
    
    # Find horizontal boundaries (color rows)
    row_boundaries = []  # [(y_start, y_end, row_type), ...]
    prev_pixel_type = None
    
    for y in range(0, 300, 3):
        pixel = thumb.getpixel((150, y))
        is_color = is_color_pixel(img, pixel)
        pixel_type = 'color' if is_color else 'gap'
        
        if pixel_type != prev_pixel_type:
            row_boundaries.append((int(y * scale_y), pixel_type))
            prev_pixel_type = pixel_type
    
    # Group consecutive 'color' rows into blocks
    color_blocks = []  # [(y_start, y_end), ...]
    block_start = None
    
    for i, (y, btype) in enumerate(row_boundaries):
        if btype == 'color' and block_start is None:
            block_start = y
        elif btype == 'gap' and block_start is not None:
            # Find end of previous color block
            for j in range(i-1, -1, -1):
                if row_boundaries[j][1] == 'color':
                    block_end = row_boundaries[j][0] + 300
                    color_blocks.append((block_start, block_end))
                    block_start = None
                    break
            break  # Found end
    
    # Find column boundaries (color columns)
    col_boundaries = []
    prev_pixel_type = None
    
    for x in range(0, 300, 3):
        pixel = thumb.getpixel((x, 150))
        is_color = is_color_pixel(img, pixel)
        pixel_type = 'color' if is_color else 'gap'
        
        if pixel_type != prev_pixel_type:
            col_boundaries.append((int(x * scale_x), pixel_type))
            prev_pixel_type = pixel_type
    
    # Group consecutive 'color' cols into blocks
    color_cols = []
    block_start = None
    
    for i, (x, btype) in enumerate(col_boundaries):
        if btype == 'color' and block_start is None:
            block_start = x
        elif btype == 'gap' and block_start is not None:
            for j in range(i-1, -1, -1):
                if col_boundaries[j][1] == 'color':
                    block_end = col_boundaries[j][0] + 300
                    color_cols.append((block_start, block_end))
                    block_start = None
                    break
            break
    
    return color_blocks, color_cols

def process_single_image(img_path, output_dir):
    """处理单张图片"""
    img = Image.opeimg = Image.open(img_path)
    w, h = img.size
    print(f"\nProcessing: {img_path}")
    print(f"Size: {w} x {h}, Mode: {img.mode}")
    
    # Find all color blocks
    blocks, cols = find_all_color_blocks(img)
    print(f"Found {len(blocks)} color rows, {len(cols)} color cols")
    
    count = 0
    
    # Process each color block
    for row_idx, (row_y_start, row_y_end) in enumerate(blocks):
        for col_idx, (col_x_start, col_x_end) in enumerate(cols):
            # Skip blocks that are too small (likely grid lines)
            if col_x_end - col_x_start < 100 or row_y_end - row_y_start < 100:
                continue
            
            # Get center color
            center_x = (col_x_start + col_x_end) // 2
            center_y = (row_y_start + row_y_end) // 2
            
            # Get CMYK value
            if img.mode == 'CMYK':
                cmyk = img.getpixel((center_x, center_y))
                c, m, yk, kk = cmyk
                # Convert to RGB for display
                rgb_needed = True
                r = 255 - int(c * 2.55)  # Simplified conversion
                g = 255 - int(m * 2.55)
                b = 255 - int(yk * 2.55)
                rgb = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)))
            else:
                rgb = img.convert('RGB').getpixel((center_x, center_y))
                c, m, yk, kk = 0, 0, 0, 0
            
            # Create 1:1 image
            img_size = 500
            new_img = Image.new('RGB', (img_size, img_size), rgb)
            
            # Draw CMYK text
            draw = ImageDraw.Draw(new_img)
            font_size = 40
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except:
                font = ImageFont.load_default()
            
            cmyk_text = f"C:{c} M:{m} Y:{y_val} K:{k_val}"
            bbox = draw.textbbox((0, 0), cmyk_text, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
            text_x = (img_size - text_w) // 2
            text_y = (img_size - text_h) // 2
            
            # Black background
            padding = 10
            draw.rectangle([text_x-padding, text_y-padding, text_x+text_w+padding, text_y+text_h+padding], fill='black')
            # White text
            draw.text((text_x, text_y), cmyk_text, fill='white', font=font)
            
            # Save
            filename = os.path.basename(img_path)
            output_name = f"{filename.replace('.jpg', '')}_r{row_idx}_c{col_idx}_{c}_{m}_{y_val}_{k_val}.png"
            output_path = os.path.join(output_dir, output_name)
            new_img.save(output_path)
            count += 1
    
    print(f"Generated {count} images")
    return count

def main():
    input_dir = r"C:\Users\ADMIN\Desktop\PANTONG-Solid color"
    output_dir = r"C:\Users\ADMIN\Desktop\CMYK色卡提取"
    
    os.makedirs(output_dir, exist_ok=True)
    
    # Get all jpg files
    jpg_files = sorted(glob.glob(os.path.join(input_dir, "*.jpg")))
    print(f"Found {len(jpg_files)} images")
    
    total = 0
    for img_path in jpg_files:
        try:
            total += process_single_image(img_path, output_dir)
        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\nTotal: {total} images saved to {output_dir}")

if __name__ == "__main__":
    main()