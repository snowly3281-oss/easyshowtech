from PIL import Image, ImageDraw, ImageFont
import os
import glob

def process_pantone_images():
    """处理PANTONG-Solid color文件夹中的所有图片"""
    input_dir = r"C:\Users\ADMIN\Desktop\PANTONG-Solid color"
    output_dir = r"C:\Users\ADMIN\Desktop\CMYK色卡提取"
    
    # 创建输出文件夹
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # 获取所有jpg文件
    jpg_files = sorted(glob.glob(os.path.join(input_dir, "*.jpg")))
    print(f"找到 {len(jpg_files)} 个图片文件")
    
    total_count = 0
    
    for jpg_path in jpg_files:
        filename = os.path.basename(jpg_path)
        print(f"\n处理: {filename}")
        
        try:
            # 加载图片
            img = Image.open(jpg_path)
            w, h = img.size
            
            # 使用缩略图快速分析结构
            thumb_size = (500, 500)
            thumb = img.resize(thumb_size, Image.LANCZOS)
            scale_x = w / thumb_size[0]
            scale_y = h / thumb_size[1]
            
            # 分析行结构 - 找出色块行和间隔行
            rows = []  # [(y_start, y_end, type), ...]
            prev_is_color = False
            
            for y in range(thumb_size[1]):
                pixel = thumb.getpixel((thumb_size[0]//2, y))
                # 通过RGB值判断是否是色块 (K值较高通常是网格线)
                if img.mode == 'CMYK':
                    k = pixel[3] if len(pixel) > 3 else 0
                    is_color = k < 100 and sum(pixel[:3]) < 255*3
                else:
                    is_color = sum(pixel) < 255*3
                
                if is_color != prev_is_color:
                    rows.append((int(y * scale_y), 'color' if is_color else 'gap'))
                    prev_is_color = is_color
                
                if y > 400:  # 只分析前80%
                    break
            
            # 找出色块行
            color_rows = [(r[0], t) for r, t in rows if t == 'color']
            print(f"  找到 {len(color_rows)} 个色块行")
            
            # 处理每个色块
            count = 0
            for i, (y_start, row_type) in enumerate(color_rows):
                # 找下一行的起始位置
                y_end = color_rows[i+1][0] if i+1 < len(color_rows) else int(400 * scale_y)
                
                # 提取色块区域的颜色
                block_height = y_end - y_start
                if block_height < 50:
                    continue
                
                # 分析这个色块行中不同列的颜色
                # 用更细的粒度扫描列
                block_y_mid = y_start + block_height // 2
                cols = []
                prev_color = None
                
                for x in range(0, thumb_size[0], 10):
                    pixel = thumb.getpixel((x, thumb_size[1]//2))  # 用中间行采样
                    current_color = tuple(pixel[:3])
                    
                    if current_color != prev_color:
                        if prev_color is not None:
                            cols.append((int(x * scale_x), prev_color))
                        prev_color = current_color
                
                if prev_color is not None:
                    cols.append((int(thumb_size[0] * scale_x), prev_color))
                
                # 处理每列颜色
                for j, (x_start, color) in enumerate(cols[:-1]):
                    x_end = cols[j+1][0]
                    
                    # 跳过太窄的列（可能是网格线）
                    if x_end - x_start < 100:
                        continue
                    
                    # 获取这个色块的CMYK值
                    center_x = (x_start + x_end) // 2
                    center_y = block_y_mid
                    
                    # 提取色块颜色 (CMYK模式)
                    if img.mode == 'CMYK':
                        cmyk_pixel = img.getpixel((center_x, center_y))
                        c, m, yk, kk = cmyk_pixel
                        # 转换为RGB
                        rgb_img = img.convert('RGB')
                        rgb = rgb_img.getpixel((center_x, center_y))
                    else:
                        rgb = color
                        c, m, yk, kk = 0, 0, 0, 0
                    
                    # 创建1:1比例的纯色图片
                    size = 500  # 1:1比例
                    new_img = Image.new('RGB', (size, size), rgb)
                    
                    # 在图片上添加CMYK值文字
                    draw = ImageDraw.Draw(new_img)
                    
                    # 计算合适的字体大小
                    font_size = 40
                    try:
                        font = ImageFont.truetype("arial.ttf", font_size)
                    except:
                        font = ImageFont.load_default()
                    
                    # 格式化CMYK值
                    cmyk_text = f"C:{c} M:{m} Y:{yk} K:{kk}"
                    
                    # 在图片中心绘制文字（带黑色背景）
                    bbox = draw.textbbox((0, 0), cmyk_text, font=font)
                    text_w = bbox[2] - bbox[0]
                    text_h = bbox[3] - bbox[1]
                    text_x = (size - text_w) // 2
                    text_y = (size - text_h) // 2
                    
                    # 绘制黑色背景
                    bg_padding = 10
                    draw.rectangle([text_x - bg_padding, text_y - bg_padding, 
                                   text_x + text_w + bg_padding, text_y + text_h + bg_padding],
                                  fill='black')
                    # 绘制白色文字
                    draw.text((text_x, text_y), cmyk_text, fill='white', font=font)
                    
                    # 保存图片
                    output_name = f"{filename.replace('.jpg', '')}_block_{i}_{j}_{c}_{m}_{yk}_{kk}.png"
                    output_path = os.path.join(output_dir, output_name)
                    new_img.save(output_path)
                    count += 1
                    total_count += 1
            
            print(f"  生成了 {count} 个色块图片")
            
        except Exception as e:
            print(f"  错误: {e}")
            import traceback
            traceback.print_exc()
    
    print(f"\n总计生成 {total_count} 个图片")
    print(f"保存位置: {output_dir}")

if __name__ == "__main__":
    process_pantone_images()