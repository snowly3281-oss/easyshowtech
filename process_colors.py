import os
from PIL import Image, ImageDraw, ImageFont

# 定义颜色文件夹
src_dir = r'C:\Users\ADMIN\Desktop\PANTONG-Solid color'
output_dir = os.path.expanduser(r'C:\Users\ADMIN\Desktop\PANTONG-Output')

# 创建输出目录
os.makedirs(output_dir, exist_ok=True)

def rgb_to_cmyk(r, g, b):
    """将RGB转换为CMYK"""
    if r == 0 and g == 0 and b == 0:
        return (0, 0, 0, 100)
    
    r, g, b = r/255.0, g/255.0, b/255.0
    k = 1 - max(r, g, b)
    if k == 1:
        return (0, 0, 0, 100)
    
    c = (1 - r - k) / (1 - k) * 100
    m = (1 - g - k) / (1 - k) * 100
    y = (1 - b - k) / (1 - k) * 100
    
    return (int(round(c)), int(round(m)), int(round(y)), int(round(k)))

def get_dominant_color(img):
    """获取图片主导颜色（中心区域）"""
    w, h = img.size
    # 取中心区域
    cx, cy = w//4, h//4
    center_region = img.crop((cx, cy, w-cx, h-cy))
    
    # 缩放到小图以加快处理
    small = center_region.resize((50, 50))
    
    # 确保是RGB模式
    if small.mode != 'RGB':
        small = small.convert('RGB')
    
    # 获取平均颜色
    import PIL.ImageStat as stat
    stat_result = stat.Stat(small)
    mean_color = stat_result.mean[:3]  # 只取RGB三个通道
    
    return tuple(int(c) for c in mean_color)

# 处理每个图片
files = sorted([f for f in os.listdir(src_dir) if f.endswith('.jpg')])

for filename in files:
    input_path = os.path.join(src_dir, filename)
    
    # 打开图片
    img = Image.open(input_path)
    
    # 转换为RGB
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    # 裁剪为1:1正方形（取中间区域）
    w, h = img.size
    min_dim = min(w, h)
    left = (w - min_dim) // 2
    top = (h - min_dim) // 2
    img_cropped = img.crop((left, top, left + min_dim, top + min_dim))
    
    # 调整大小为 800x800
    img_cropped = img_cropped.resize((800, 800), Image.LANCZOS)
    
    # 获取主导颜色并转换为CMYK
    r, g, b = get_dominant_color(img_cropped)
    c, m, y, k = rgb_to_cmyk(r, g, b)
    cmyk_text = f"C:{c} M:{m} Y:{y} K:{k}"
    
    # 在图片上标注CMYK值
    draw = ImageDraw.Draw(img_cropped)
    
    # 尝试使用系统字体
    try:
        font = ImageFont.truetype("arial.ttf", 48)
    except:
        font = ImageFont.load_default()
    
    # 绘制文字（白色带黑色描边）
    text = cmyk_text
    # 获取文字边界
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    # 在中心绘制
    x = (800 - text_w) // 2
    y_pos = (800 - text_h) // 2
    
    # 描边
    for adj in [(1,0), (-1,0), (0,1), (0,-1), (1,1), (-1,-1), (1,-1), (-1,1)]:
        draw.text((x+adj[0], y_pos+adj[1]), text, fill='black', font=font)
    
    # 文字主体白色
    draw.text((x, y_pos), text, fill='white', font=font)
    
    # 保存，压缩到100KB以下
    output_filename = f"cmyk_{filename}"
    output_path = os.path.join(output_dir, output_filename)
    
    # 逐步降低质量直到文件小于100KB
    quality = 95
    while quality >= 50:
        img_cropped.save(output_path, 'JPEG', quality=quality, optimize=True)
        file_size = os.path.getsize(output_path)
        if file_size <= 100 * 1024:
            break
        quality -= 10
    
    print(f"处理: {filename} -> {output_filename}")
    print(f"  颜色: RGB({r},{g},{b}) -> {cmyk_text}")
    print(f"  大小: {file_size/1024:.1f}KB, 质量: {quality}")

print(f"\n完成! 输出目录: {output_dir}")