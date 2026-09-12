import asyncio
import playwright.async_api as pw

async def search_plap():
    async with pw.async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto('https://www.plap.mil.cn/freecms-glht/site/juncai/cggg/index.html')
        await page.wait_for_load_state('networkidle')
        
        # 获取页面中的所有链接文本
        links = await page.query_selector_all('a')
        print(f'找到 {len(links)} 个链接')
        
        # 打印前30个链接
        for i, link in enumerate(links[:30]):
            text = await link.inner_text()
            href = await link.get_attribute('href')
            print(f'{i}: {text[:50]} -> {href}')
        
        await browser.close()

asyncio.run(search_plap())