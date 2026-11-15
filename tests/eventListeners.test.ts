import test from 'node:test'
import assert from 'node:assert/strict'
import { createEventListeners } from '../src/game/eventListeners.ts'

test('listeners are removed on disposal and cannot be added after disposal', () => {
  const target = new EventTarget()
  const listeners = createEventListeners()
  let calls = 0
  listeners.add(target, 'test', () => calls++)
  target.dispatchEvent(new Event('test'))
  listeners.dispose()
  listeners.dispose()
  listeners.add(target, 'test', () => calls++)
  target.dispatchEvent(new Event('test'))
  assert.equal(calls, 1)
})
