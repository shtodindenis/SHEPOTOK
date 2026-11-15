import test from 'node:test'
import assert from 'node:assert/strict'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useQuestHint } from '../src/game/useQuestHint.ts'
import { useInterfaceStore } from '../src/stores/interface.ts'
import { useSessionStore } from '../src/stores/session.ts'

test('arrest and detention hints override ordinary story hints', () => {
  setActivePinia(createPinia())
  const session = useSessionStore(), ui = useInterfaceStore()
  const hint = useQuestHint(ref(''), ref('ОБХОД'))
  session.arrest = { cause: 'cannabis', phase: 'approach', x: 0, y: 0 }
  assert.match(hint.value, /ПОЛИЦЕЙСКИЙ/)
  session.arrest = null
  ui.location = 'detention'
  session.detention = { cause: 'mushrooms', cellOpen: true, cellRemaining: 1, shovelFound: false, choice: null, alarm: false, guardTime: 0 }
  assert.match(hint.value, /НАЙДИ ВЫХОД/)
  assert.match(hint.value, /ОБХОД/)
})
