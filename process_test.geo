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
    print(f"尺寸: {w}x{h}, 模式: {img.mode}")
    
    # 分析结构
    thumb = img.resize((300, 300), Image.REDUCED_AVAILABLE) if hasattr(Image, 'REDUCED_AVAILABLE') else img.resize((300, 300), Image.LANCZOS)
    
    # 找色块边界
    scale_x = w / 300
    scale_y = h / 300
    
    # 使用更细致的方法找边界
    print("\n扫描行边界...")
    color_rows = []
    prev_pixel = None
    
    for y in range(0, 300, 3):
        pixel = thumb.getpixel((150, y))
        is_color = sum(pixel) < 255*3
        
        if is_color != prev_pixel:
            print(f"y={y * scale_y}: {'COLOR' if is_color else 'GAP'}")
            if is_color:
                color_rows.append(y * scale_y)
        prev_pixel = is_color
        
        if y > 200:
            break
    
    print(f"\n色块行起始位置: {[f'{y:.0f}' for y in color_rows[:10]]}")

if __name__ == "__main__":
    process_1_01()