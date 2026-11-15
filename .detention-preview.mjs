import { chromium } from 'playwright-core'
const browser = await chromium.launch({headless:true, executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args:['--use-angle=swiftshader']})
const page=await browser.newPage({viewport:{width:960,height:576},deviceScaleFactor:1})
page.on('pageerror',e=>console.log(e.message))
for (const [name,query] of [['camera',''],['corridor','?x=350&y=205&open'],['evidence','?x=550&y=110&open']]) { await page.goto('http://localhost:5173/.detention-preview.html'+query); await page.waitForTimeout(1800); await page.screenshot({path:'detention-'+name+'.png'}) }
await browser.close()
