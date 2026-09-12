from PIL import Image, ImageDraw, ImageFont
import os
import glob

def process_1_01():
    """处理第一张图片测试"""
    input_path = r"C:\Users\ADMIN\Desktop\PANTONG-Solid color\1-01.jpg"
    output_dir = r"C:\Users\ADMIN\Desktop\CMYK色卡提取"
    
    os.makedirs(output_dir, exist_ok=True)
    
    img = Image.open(input_path)
    w, h = img.size
    print(f"尺寸: {w} x {h}, 模式: {img.mode}")
    
    # 使用缩略图分析
    thumb = img.resize((300, 300), Image.LANCZOS)
    scale_x = w / 300
    scale_y = h / 300
    
    print("\n扫描行边界...")
    color_y_positions = []
    prev_is_space = True
    
    for y in range(0, 300, 3):
        pixel = thumb.getpixel((150, y))
        is_space = sum(pixel) > 250 * 3
        
        if is_space != prev_is_space:
            y_orig = int(y * scale_y)
            print(f"y={y_orig}: {'SPACE' if is_space else 'COLOR'}")
            if not is_space:
                color_y_positions.append(y_orig)
        prev_is_space = is_space
        
        if y > 200:
            break
    
    print(f"\n检测到 {len(color_y_positions)} 个色块行")
    print(f"色块行起始位置: {[y for y in color_y_positions[:10]]}")
    print(f"前几个色块高度: {[color_y_positions[i+1]-color_y_positions[i] if i+1 < len(color_y_positions) else 0 for i in range(min(5, len(color_y_positions)))]]}")


if __name__ == "__main__":
    process_1_01()