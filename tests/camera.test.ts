import test from 'node:test'
import assert from 'node:assert/strict'
import { cameraTransform } from '../src/game/camera.ts'

test('camera follows the player and clamps to the map', () => {
  assert.deepEqual(cameraTransform({ location: 'forest' }, 1000, 400, 320, 192, { x: 500, y: 200 }), { zoom: 1, x: -340, y: -104 })
  const edge = cameraTransform({ location: 'forest' }, 1000, 400, 320, 192, { x: 0, y: 0 })
  assert.equal(Math.abs(edge.x), 0)
  assert.equal(Math.abs(edge.y), 0)
})

test('camera fits small maps and fixes the chairs scene center', () => {
  assert.equal(cameraTransform({ location: 'home' }, 500, 300, 320, 192, { x: 200, y: 150 }).zoom, 1.15)
  assert.equal(cameraTransform({ location: 'home' }, 200, 100, 320, 192, { x: 0, y: 0 }).zoom, 1.92)
  const scene = { location: 'society', questState: 'chairs' }
  assert.deepEqual(cameraTransform(scene, 800, 300, 320, 192, { x: 1, y: 1 }), cameraTransform(scene, 800, 300, 320, 192, { x: 700, y: 200 }))
})
