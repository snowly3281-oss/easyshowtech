from PIL import Image
import numpy as np
import os
from collections import Counter

def extract_color_blocks(image_path, output_folder, min_block_size=50):
    """
    从图片中提取不同颜色的色块，每个色块保存为纯色图片
    """
    # 创建输出文件夹
    os.makedirs(output_folder, exist_ok=True)
    
    # 打开图片
    img = Image.open(image_path)
    
    # 转换为RGB模式
    if img.mode != 'RGB':
        img = img.convert('RGB')
    
    print(f"图片尺寸: {img.size}")
    print(f"图片模式: {img.mode}")
    
    # 获取图片数据
    img_array = np.array(img)
    height, width = img_array.shape[:2]
    
    # 将图片转换为可处理的格式
    pixels = img_array.reshape(-1, 3)
    
    # 统计颜色出现频率
    color_counts = Counter([tuple(p) for p in pixels])
    
    print(f"找到 {len(color_counts)} 种不同颜色")
    
    # 过滤掉背景色（白色和接近白色的颜色）以及出现次数很少的颜色
    filtered_colors = []
    for color, count in color_counts.items():
        # 跳过接近白色的背景
        if color[0] > 240 and color[1] > 240 and color[2] > 240:
            continue
        # 只保留出现次数较多的颜色（可能是色块）
        if count >= min_block_size:
            filtered_colors.append((color, count))
    
    # 按出现次数排序
    filtered_colors.sort(key=lambda x: x[1], reverse=True)
    
    print(f"过滤后剩余 {len(filtered_colors)} 种颜色")
    
    # 创建纯色图片并保存
    block_size = (400, 300)  # 纯色块的大小
    saved_count = 0
    
    for idx, (color, count) in enumerate(filtered_colors):
        # 创建纯色图片
        color_img = Image.new('RGB', block_size, color)
        
        # 生成文件名
        color_name = f"color_{idx+1:02d}_RGB{color[0]}_{color[1]}_{color[2]}"
        output_path = os.path.join(output_folder, f"{color_name}.png")
        
        # 保存图片
        color_img.save(output_path, 'PNG')
        saved_count += 1
        
        print(f"保存: {color_name} - 出现次数: {count}")
    
    print(f"\n总共保存了 {saved_count} 个颜色色块")
    return saved_count

# 主程序
if __name__ == "__main__":
    image_path = r"C:\Users\ADMIN\Desktop\2-01.jpg"
    output_folder = r"C:\Users\ADMIN\Desktop\color_blocks_2"
    
    try:
        count = extract_color_blocks(image_path, output_folder, min_block_size=100)
        print(f"\n✅ 完成！所有色块已保存到: {output_folder}")
    except Exception as e:
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()
