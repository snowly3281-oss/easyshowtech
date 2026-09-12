import requests
h={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"}
u="https://www. plap. mil. cn/ggg/ index. html"
def s(kw):
    try:
        r=requests. get(u, params={"keyword":kw,"pageNo":1,"pageSize":10}, headers=h, timeout=15)
        sc=r.status_code; txt=r.text[:300]
        print(f"[{kw}] status={sc} body={txt}")
    except Exception as e:
        print(f"[{kw}] Error: {e}")
s("长城网")