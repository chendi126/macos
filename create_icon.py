#!/usr/bin/env python3
"""
创建一个简单的 512x512 PNG 图标文件
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
    
    # 创建 512x512 的图像
    size = 512
    img = Image.new('RGBA', (size, size), (70, 130, 180, 255))  # 钢蓝色背景
    draw = ImageDraw.Draw(img)
    
    # 绘制一个简单的时钟图标
    center = size // 2
    radius = size // 3
    
    # 绘制外圆
    draw.ellipse([center - radius, center - radius, center + radius, center + radius], 
                 fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=8)
    
    # 绘制时钟指针
    # 时针 (指向3点)
    draw.line([center, center, center + radius//2, center], fill=(0, 0, 0, 255), width=8)
    # 分针 (指向12点)
    draw.line([center, center, center, center - radius//1.5], fill=(0, 0, 0, 255), width=6)
    
    # 绘制中心点
    draw.ellipse([center - 10, center - 10, center + 10, center + 10], 
                 fill=(0, 0, 0, 255))
    
    # 绘制刻度
    for i in range(12):
        angle = i * 30  # 每30度一个刻度
        import math
        x1 = center + (radius - 20) * math.cos(math.radians(angle - 90))
        y1 = center + (radius - 20) * math.sin(math.radians(angle - 90))
        x2 = center + (radius - 5) * math.cos(math.radians(angle - 90))
        y2 = center + (radius - 5) * math.sin(math.radians(angle - 90))
        draw.line([x1, y1, x2, y2], fill=(0, 0, 0, 255), width=4)
    
    # 保存图标
    os.makedirs('resources', exist_ok=True)
    img.save('resources/icon.png')
    print("✅ 成功创建 512x512 PNG 图标: resources/icon.png")
    
except ImportError:
    print("❌ 需要安装 Pillow: pip install Pillow")
    print("或者手动创建一个 512x512 的 PNG 图标文件")
except Exception as e:
    print(f"❌ 创建图标失败: {e}")
