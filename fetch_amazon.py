import urllib.request
import ssl

url = 'https://r.jina.ai/http://www.amazon.com/dp/B0DJZF4T7K'
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}

req = urllib.request.Request(url, headers=headers)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

try:
    with urllib.request.urlopen(req, context=ctx, timeout=30) as response:
        content = response.read().decode('utf-8')
        print(content[:8000])
except Exception as e:
    print(f'Error: {e}')
