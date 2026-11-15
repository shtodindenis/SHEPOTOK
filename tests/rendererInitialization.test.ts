import test from 'node:test'
import assert from 'node:assert/strict'
import type { Application } from 'pixi.js'
import { initializeRenderer } from '../src/game/rendererInitialization.ts'

test('renderer prefers WebGPU and retries WebGL on initialization failure', async () => {
  const calls: unknown[] = []
  let count = 0
  const create = () => {
    const number = ++count
    return {
      async init(options: { preference: unknown }) { calls.push(options.preference); if (number === 1) throw new Error('GPU init failed') },
      destroy() { calls.push('destroy') },
    } as unknown as Application
  }
  const app = await initializeRenderer({ width: 320 }, create)
  assert.ok(app)
  assert.deepEqual(calls, [['webgpu', 'webgl'], 'destroy', 'webgl'])
})

test('renderer initialization does not retry a successful setup', async () => {
  let created = 0
  const create = () => { created++; return { async init() {}, destroy() {} } as unknown as Application }
  await initializeRenderer({}, create)
  assert.equal(created, 1)
})
