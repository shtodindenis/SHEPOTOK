import test from 'node:test'
import assert from 'node:assert/strict'
import { Container, Texture } from 'pixi.js'
import { createDynamicActors } from '../src/game/dynamicActors.ts'

test('dynamic actors reconcile by id and clear their cache on a new scene', () => {
  const scene = new Container()
  const renderer = createDynamicActors({ furniture: Texture.WHITE, dungeon: Texture.WHITE, fishingRod: Texture.WHITE, tileTexture: () => Texture.WHITE })
  renderer.reset(scene)
  renderer.setActors([{ id: 'rag', kind: 'rag', x: 10, y: 20 }, { id: 'chair', kind: 'chair', x: 25, y: 30 }])
  assert.equal(scene.children.length, 2)
  const chair = scene.children[1]
  renderer.setActors([{ id: 'chair', kind: 'chair', x: 40, y: 50 }])
  assert.equal(scene.children.length, 1)
  assert.equal(scene.children[0], chair)
  assert.equal(chair.x, 40)
  const nextScene = new Container()
  renderer.reset(nextScene)
  renderer.setActors([{ id: 'chair', kind: 'chair', x: 1, y: 2 }])
  assert.equal(nextScene.children.length, 1)
  assert.notEqual(nextScene.children[0], chair)
})
