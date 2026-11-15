import test from 'node:test'
import assert from 'node:assert/strict'
import { ref, computed } from 'vue'
import { createKeyboardHandler } from '../src/game/keyboard.ts'
import type { GameScreen } from '../src/stores/interface.ts'

function setup() {
  const calls: string[] = []
  const call = (name: string) => (..._args: any[]) => { calls.push(name) }
  const state = {
    screen: ref<GameScreen>('game'), showFps: ref(false), fps: ref<number | null>(null),
    arrest: ref<unknown>(null), dialog: ref<unknown>(null), caughtFish: ref<unknown>(null),
    eusebiusQuiz: ref<number | null>(null), detentionChoice: ref(false), urgency: ref(null),
    fishing: ref<unknown>(null), photoOpen: ref(false), quiz: ref(null), choice: ref(false),
    quizSelected: ref(0), choiceIndex: ref(0), quizQuestion: computed(() => null),
    hasFishingRod: computed(() => false), fpsMeter: { reset: call('reset') }, keys: new Set<string>(),
    battle: { attempt: call('battle') }, nextDialog: call('dialog'), resolveFish: call('fish'),
    answerEusebius: call('eusebius'), finishAmbulance: call('ambulance'), finishSleep: call('sleep'),
    chooseDetentionEvidence: call('evidence'), attemptUrgency: call('urgency'), startBattle: call('startBattle'),
    closeSlots: call('closeSlots'), openMenu: call('menu'), openSlots: call('slots'), retrieveRod: call('retrieve'),
    fishingPress: call('fishing'), answerQuiz: call('quiz'), chooseWell: call('well'),
    selectInventorySlot: call('inventory'), dropItem: call('drop'), useItem: call('use'),
    start: call('start'), interact: call('interact'),
  }
  const handle = createKeyboardHandler(state)
  const press = (key: string, code = '') => handle({ key, code, repeat: false, ctrlKey: false, metaKey: false, altKey: false, preventDefault() {} } as KeyboardEvent)
  return { state, calls, press }
}

test('arrest dialogue takes precedence over ordinary interaction', () => {
  const { state, calls, press } = setup()
  state.arrest.value = {}; state.dialog.value = {}
  press('e', 'KeyE')
  assert.deepEqual(calls, ['dialog'])
})

test('save shortcut opens slots, movement keys are retained', () => {
  const { state, calls, press } = setup()
  press('c', 'KeyC'); press('w', 'KeyW')
  assert.deepEqual(calls, ['slots'])
  assert.ok(state.keys.has('w'))
})
