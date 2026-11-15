import assert from 'node:assert/strict'
import { chromium } from 'playwright-core'
import { createServer } from 'vite'

const executablePath = process.env.BROWSER_PATH || (process.platform === 'win32'
  ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' : undefined)
if (!executablePath) throw new Error('Set BROWSER_PATH to a Chromium-compatible browser executable')

const server = await createServer({ server: { host: '127.0.0.1', port: 5173, strictPort: false } })
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
try {
  await server.listen()
  const address = server.httpServer?.address()
  if (!address || typeof address === 'string') throw new Error('Cannot determine the test server port')
  const url = `http://127.0.0.1:${address.port}/`
  const fallback = process.env.RENDER_TEST === 'webgl'
  browser = await chromium.launch({ executablePath, headless: true, args: fallback ? ['--disable-webgpu', '--use-angle=swiftshader'] : ['--enable-unsafe-webgpu'] })
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext
    const contexts: string[] = []
    ;(window as any).__renderContexts = contexts
    ;(HTMLCanvasElement.prototype as any).getContext = function(kind: string, ...args: unknown[]) {
      const result = (original as any).call(this, kind, ...args)
      if (result && ['webgpu', 'webgl', 'webgl2'].includes(kind)) contexts.push(kind)
      return result
    }
  })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))

  await page.goto(url)
  await page.getByText('НОВАЯ ИГРА').click()
  await page.waitForSelector('canvas')
  await page.waitForTimeout(700)
  const renderer = await page.evaluate(() => (window as any).__renderContexts.includes('webgpu') ? 'webgpu' : 'webgl')
  if (process.env.RENDER_TEST === 'webgpu') assert.equal(renderer, 'webgpu', 'A working WebGPU adapter is required')
  if (fallback) assert.equal(renderer, 'webgl')
  for (let i = 0; i < 10; i++) { await page.keyboard.press('e'); await page.waitForTimeout(40) }
  await page.keyboard.down('d'); await page.waitForTimeout(300); await page.keyboard.up('d')
  await page.keyboard.press('c')
  await page.waitForSelector('.slots-screen')
  await page.locator('.slot-choice').first().click()
  await page.getByRole('status').filter({ hasText: 'сохранена' }).waitFor()
  const slot = await page.evaluate(() => JSON.parse(localStorage.getItem('shepotok-slot-1')!))
  assert.equal(slot.data.location, 'home')
  assert.equal(slot.data.rulesVersion, 2)
  await page.reload()
  await page.getByText('ЗАГРУЗИТЬ ИГРУ').click()
  await page.locator('.slot-choice').first().click()
  await page.waitForSelector('.canvas-host canvas')
  await page.waitForTimeout(400)
  assert.equal(await page.locator('.slots-screen').count(), 0)

  await page.goto(url)
  await page.evaluate(() => localStorage.setItem('shepotok-save', JSON.stringify({
    stage: 2, location: 'detention', player: { x: 575, y: 180 }, shovel: true, shovelUsed: false,
    stashState: 'evidence', detention: { cause: 'cannabis', cellOpen: true, shovelFound: true,
      choice: null, alarm: false, guardTime: 0, quizIndex: 0, quizCorrect: true, quizDone: false },
  })))
  await page.getByText('ПРОДОЛЖИТЬ').click()
  await page.waitForTimeout(1000)
  for (let i = 0; i < 3; i++) await page.keyboard.press('e')
  await page.getByText('ДОСТАТЬ ПАКЕТИК').click()
  await page.waitForTimeout(100)
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('shepotok-save')!))
  assert.equal(saved.detention.choice, 'cannabis')
  assert.equal(saved.detention.alarm, true)
  assert.equal(saved.stashState, 'player')
  await page.goto(url)
  await page.evaluate(() => localStorage.setItem('shepotok-save', JSON.stringify({
    stage: 1, location: 'forest', player: { x: 572, y: 405 }, forestVersion: 5,
    note: true, shovel: true, shovelUsed: false, shovelPermission: true, stashState: 'buried', stashIndex: 0,
    inventorySlots: ['shovel', 'photo', null, null, null, null], selectedInventorySlot: 1,
  })))
  await page.getByText('ПРОДОЛЖИТЬ').click()
  await page.waitForTimeout(1000)
  await page.keyboard.press('r')
  const photo = page.locator('img').first()
  await photo.waitFor()
  assert.equal(await photo.evaluate(image => (image as HTMLImageElement).naturalWidth), 192)
  const colors = await photo.evaluate(image => {
    const canvas = document.createElement('canvas')
    canvas.width = 192; canvas.height = 128
    const context = canvas.getContext('2d')!
    context.drawImage(image as HTMLImageElement, 0, 0)
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data
    const colors = new Set<string>()
    for (let i = 0; i < data.length; i += 4) colors.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`)
    return colors.size
  })
  assert.ok(colors > 8, 'forest photo must contain rendered scenery')
  assert.deepEqual(errors, [])
  console.log(`Browser smoke passed (${renderer}): new game, save/load, detention and forest photo`)
} finally {
  await browser?.close()
  await server.close()
}
