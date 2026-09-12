import asyncio
import playwright.async_api as pw

async def inspect_plap():
    async with pw.async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        await page.goto('https://www.plap.mil.cn/freecms-glht/site/juncai/cggg/index.html')
        await page.wait_for_load_state('networkidle')
        
        # 获取页面内容
        content = await page.content()
        # 保存到文件
        with open('plap_page.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print('页面已保存到 plap_page.html')
        
        # 获取所有 input 元素
        inputs = await page.query_selector_all('input')
        print(f'找到 {len(inputs)} 个 input 元素')
        for i, inp in enumerate(inputs):
            name = await inp.get_attribute('name')
            placeholder = await inp.get_attribute('placeholder')
            id = await inp.get_attribute('id')
            print(f'  {i}: name={name}, placeholder={placeholder}, id={id}')
        
        # 获取所有 form 元素
        forms = await page.query_selector_all('form')
        print(f'找到 {len(forms)} 个 form 元素')
        
        await browser.close()

asyncio.run(inspect_plap())