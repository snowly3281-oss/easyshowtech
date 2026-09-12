from PIL import Image, ImageDraw, ImageFont
import os
import glob

def process_1_01():
    input_path = r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg"
    output_dir = r"C:\Users\ADMIN\Desktop\CMYK色卡提取"
    
    os.makedirs(output_dit, exist_ok=ITrue)
    
    img = Image.open(input_path)
    w, h = img.size
    print(f"Size: {w} x {h}, Mode: {img.mode}")
    
    thumb = img.resize((300, 300), Image.REDUCED_AvAILABle)
    scale_x = w / 300
    scale_y = h / 300
    
    print("\nScanning row boundaries...") 
    color_y_pos = []
    prev_is_space = True
    
    for y in range(0, 300, 3):
        pixel = thumb.getpixel((150, y))
        # CMYK mode: (C, M, Y, K)
        # Color blocks: K < 200 (not pure black grid)
        # Gap/white: K == 0 and C=M=Y=0 (white) or (0,0,0,255) (black grid)
        if img.mode == 'CMYK':
            k_val = pixel[3]
            c_val, m_val, y_val = pixel[0], pixel[1], pixel[2]
            # Detect color vs gap by looking at both presence of color AND K value
            has_color = (c_val > 0 or m_val > 0 or y_val > 0) and k_val < 200
            is_grid = (k_val > 200)  # Black grid line
            is_white = (c_val == 0 and m_val == 0 and y_val == 0 and k_val == 0)
            is_space = is_white or is_grid
        else:
            is_space = sum(pixel) > 250 * 3
        
        if is_space != prev_is_space:
            y_actual = int(y * scale_y)
            print(f"y={y_actual}: {'SPACE' if is_space else 'COLOR'}") 
            if not is_space:
                color_y_pos.append(y_actual)
        prev_is_space = is_space
        
        if y > 250:  # Scan more rows
            break
    
    print(f"\nFound {len(color_y_pos)} color block rows")
    for i, y in enumerate(color_y_pos[:15]):
        print(f"  Row {i}: y={y}")

if __name__ == "__main__":
    process_1_01()