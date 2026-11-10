import { computed, ref } from 'vue'

export const DIRECTIONS = [
  { id: 'up', arrow: '↑', label: 'ВВЕРХ' },
  { id: 'right', arrow: '→', label: 'ВПРАВО' },
  { id: 'left', arrow: '←', label: 'ВЛЕВО' },
  { id: 'down', arrow: '↓', label: 'ВНИЗ' },
  { id: 'up', arrow: '↑', label: 'ВВЕРХ' },
]
export const HIT_START = 0.35
export const HIT_END = 0.65
const BEAT_MS = 1800

export function createSkillCheck(onWin, onLose) {
  const hits = ref(0), progress = ref(0), active = ref(false)
  const direction = computed(() => DIRECTIONS[hits.value] || DIRECTIONS[0])
  let elapsed = 0
  function start() { hits.value = 0; progress.value = 0; elapsed = 0; active.value = true }
  function stop() { active.value = false }
  function fail() { if (!active.value) return; stop(); onLose() }
  function update(deltaMs) {
    if (!active.value) return
    elapsed += deltaMs
    progress.value = Math.min(1, elapsed / BEAT_MS)
    if (elapsed >= BEAT_MS) fail()
  }
  function attempt(id) {
    if (!active.value) return
    if (id !== direction.value.id || progress.value < HIT_START || progress.value > HIT_END) { fail(); return }
    hits.value++
    if (hits.value === DIRECTIONS.length) { stop(); onWin(); return }
    elapsed = 0; progress.value = 0
  }
  return { hits, progress, active, direction, start, stop, update, attempt }
}

export function directionFromEvent(event) {
  const map = { ArrowUp: 'up', KeyW: 'up', ArrowRight: 'right', KeyD: 'right', ArrowLeft: 'left', KeyA: 'left', ArrowDown: 'down', KeyS: 'down' }
  return map[event.code] || ({ arrowup: 'up', w: 'up', 'ц': 'up', arrowright: 'right', d: 'right', 'в': 'right', arrowleft: 'left', a: 'left', 'ф': 'left', arrowdown: 'down', s: 'down', 'ы': 'down' })[event.key.toLowerCase()]
}
