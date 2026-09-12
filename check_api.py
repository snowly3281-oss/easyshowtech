import requests
import re

url = 'https://www.plap.mil.cn/freecms-glht/site/juncai/cggg/index.html'
resp = requests.get(url)
content = resp.text

# 查找更多 URL 和端点
patterns = [
    r'url\s*[\'"]([^\'"]+)',
    r'action\s*[\'"]([^\'"]+)', 
    r'\.get\(\s*[\'"]([^\'"]+)',
    r'load\(\s*[\'"]([^\'"]+)',
    r'fetch\(\s*[\'"]([^\'"]+)',
    r'loadUrl\s*[\'"]([^\'"]+)',
    r'/freecms/[^\'"]+',
    r'/api/[^\'"]+',
]

for pat in patterns:
    matches = re.findall(pat, content, re.I)
    if matches:
        unique = list(set(matches))[:10]
        print(f'Pattern {pat[:30]}: {unique}')