import asyncio
import playwright.async_api as pw

async def login_plap():
    async with pw.async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        # 访问登录页
        await page.goto('https://www.plap.mil.cn/gateway/gp-auth-center/login?tenantId=Cxiangmu-001')
        await page.wait_for_load_state('networkidle')
        
        print(f'页面标题: {await page.title()}')
        
        # 保存截图
        await page.screenshot(path='plap_login.png')
        print('登录页截图已保存')
        
        # 获取表单元素
        user_input = await page.query_selector('input[name="username"], input[id="username"], input[type="text"]')
        pass_input = await page.query_selector('input[name="password"], input[id="password"], input[type="password"]')
        
        print(f'用户名输入框: {user_input}')
        print(f'密码输入框: {pass_input}')
        
        # 尝试获取登录表单属性
        if user_input:
            print(f'用户名输入框属性: id={await user_input.get_attribute("id")}, name={await user_input.get_attribute("name")}')
        
        await browser.close()

asyncio.run(login_plap())