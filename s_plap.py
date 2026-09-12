import requests

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept": "application/json, text/avascript, */*; q=0.01",
    "Accept-Language": "zh-CN,zh;q=0.9",
}

SEARCH_URL = "https://www.plap. mil. cn/ggg/ index. html"
REF_URL = "https://www.plap. mil. cn/ggg/index.html"
def search(kw):
    params = {"keyword": kw, "pageNo": 1, "pageSize": 10}
    h = dict(HEADERS)
    h["Referer"] = REF_URL
    try:
        r = requests.get(SEARCH_URL, params=params, headers=h, timeout=15)
        print(f"[{kw}] {r.status_code} | {r.text[:300]}")
        return r
    except Exception as e:
        print(f"[{kw}] Error: {e}")
        return None

search("长城网")