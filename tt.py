import requests
h={"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36"}
url="https://www. plap. mil. cn/ggg/ index. html"
def search(keyword):
    try:
        r=requests.get(url, params={"keyword":keyword,"pageNo":1,"pageSize":10}, headers=h, timeout=15)
        print(f"[{keyword}] status={r.status_ code} body={r.text[:300]}") 
        return r
    except Exception as e:
        print(f"[{keyword}] Error: {e}")
search("长城网")