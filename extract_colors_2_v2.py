from PIL import Image
import numpy as np
import os
from sklearn.cluster import KMeans

def extract_main_colors(image_path, output_folder, n_colors=50):
    """
    从图片中提取主要颜色色块，使用K-means聚类
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
    
    # 缩小图片以加快处理速度
    img_small = img.resize((300, 300))
    
    # 转换为numpy数组
    img_array = np.array(img_small)
    pixels = img_array.reshape(-1, 3)
    
    # 过滤掉白色/浅色背景
    filtered_pixels = []
    for pixel in pixels:
        # 跳过接近白色的像素
        if pixel[0] > 240 and pixel[1] > 240 and pixel[2] > 240:
            continue
        filtered_pixels.append(pixel)
    
    if len(filtered_pixels) < n_colors:
        print("过滤后像素太少，使用原始像素")
        filtered_pixels = pixels
    
    filtered_pixels = np.array(filtered_pixels)
    
    print(f"过滤后像素数: {len(filtered_pixels)}")
    
    # 使用K-means聚类找到主要颜色
    print(f"正在聚类分析，提取 {n_colors} 种主要颜色...")
    kmeans = KMeans(n_clusters=n_colors, random_state=42, n_init=10)
    kmeans.fit(filtered_pixels)
    
    # 获取聚类中心（主要颜色）
    main_colors = kmeans.cluster_centers_.astype(int)
    
    # 计算每种颜色的像素数量
    labels = kmeans.labels_
    color_counts = np.bincount(labels)
    
    # 按数量排序
    sorted_indices = np.argsort(color_counts)[::-1]
    
    print(f"\n提取了 {len(main_colors)} 种主要颜色")
    
    # 创建纯色图片并保存
    block_size = (400, 300)
    saved_count = 0
    
    for idx in sorted_indices:
        color = main_colors[idx]
        count = color_counts[idx]
        
        # 创建纯色图片
        color_img = Image.new('RGB', block_size, tuple(color))
        
        # 生成文件名
        color_name = f"color_{saved_count+1:02d}_RGB{color[0]}_{color[1]}_{color[2]}"
        output_path = os.path.join(output_folder, f"{color_name}.png")
        
        # 保存图片
        color_img.save(output_path, 'PNG')
        saved_count += 1
        
        print(f"保存: {color_name} - 像素数: {count}")
    
    print(f"\n总共保存了 {saved_count} 个颜色色块")
    return saved_count

# 主程序
if __name__ == "__main__":
    image_path = r"C:\Users\ADMIN\Desktop\2-01.jpg"
    output_folder = r"C:\Users\ADMIN\Desktop\color_blocks_2"
    
    try:
        count = extract_main_colors(image_path, output_folder, n_colors=50)
        print(f"\n✅ 完成！所有色块已保存到: {output_folder}")
    except Exception as e:
        print(f"❌ 错误: {e}")
        import traceback
        traceback.print_exc()
