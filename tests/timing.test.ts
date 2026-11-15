import test from 'node:test'
import assert from 'node:assert/strict'
import { createFpsMeter, forEachTimeStep } from '../src/game/timing.ts'

test('FPS meter counts frame intervals over real time and resets cleanly', () => {
  for (const rate of [30, 60, 120]) {
    const meter = createFpsMeter(1000)
    assert.equal(meter.frame(0), null)
    let result
    for (let frame = 1; frame <= rate + 1; frame++) {
      const sample = meter.frame(frame * 1000 / rate)
      if (sample !== null) { result = sample; break }
    }
    assert.equal(result, rate)
    meter.reset()
    assert.equal(meter.frame(100000), null)
  }
})

test('time steps preserve elapsed time at different frame rates and cap long stalls', () => {
  for (const rate of [15, 30, 60, 120]) {
    let total = 0
    for (let frame = 0; frame < rate; frame++) forEachTimeStep(1000 / rate, dt => { assert.ok(dt <= 50); total += dt })
    assert.ok(Math.abs(total - 1000) < 1e-8)
  }
  let total = 0
  forEachTimeStep(10000, dt => { total += dt })
  assert.equal(total, 250)
})
