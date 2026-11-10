import test from 'node:test'
import assert from 'node:assert/strict'
import { createAudio } from '../src/game/audio.js'

test('music switches exclusively, respects mute and can retry after autoplay blocking', () => {
  const instances=[]
  globalThis.Audio=class { constructor(src){this.src=src;this.paused=true;this.currentTime=0;instances.push(this)} play(){this.paused=false;return Promise.resolve()} pause(){this.paused=true} }
  let enabled=true
  const audio=createAudio(()=>enabled), get=name=>instances.find(x=>x.src.includes(name))
  audio.setMusic('menu');assert.equal(get('menu-progressive').paused,false)
  audio.setMusic('forest');assert.equal(get('menu-progressive').paused,true);assert.equal(get('forest-ambient').paused,false)
  audio.setMusic('tail');assert.equal(get('forest-ambient').paused,true);assert.equal(get('tail-dubstep').paused,false)
  audio.setMusic('chairs');assert.equal(get('tail-dubstep').paused,true);assert.equal(get('society-phonk').paused,false)
  audio.setMusic(null);assert.equal(get('society-phonk').paused,true)
  enabled=false;audio.setMusic('menu');assert.equal(get('menu-progressive').paused,true)
  enabled=true;audio.setMusic('menu');get('menu-progressive').pause();audio.unlockMusic();assert.equal(get('menu-progressive').paused,false)
  audio.destroy();assert.ok(instances.every(x=>x.paused))
})
