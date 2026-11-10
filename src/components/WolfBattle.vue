<script setup>
import { HIT_COUNT, HIT_START, HIT_END } from '../game/skillCheck.js'
defineProps({ ready: Boolean, hits: Number, progress: Number, direction: Object })
defineEmits(['start', 'attempt'])
</script>

<template>
  <div class="battle-screen">
    <div class="battle-panel" v-if="ready">
      <div class="battle-kicker">НАПАДЕНИЕ ВОЛКА</div><h2>ЛОПАТА ПРОТИВ ВОЛКА</h2>
      <p>Пять ударов. Нажимай нужную стрелку или WASD, когда бегунок окажется в светлой зоне.</p>
      <p>Один промах — и волк победит.</p>
      <button class="primary" @click="$emit('start')">НАЧАТЬ БОЙ</button>
    </div>
    <div v-else class="battle-panel">
      <div class="battle-kicker">НАПАДЕНИЕ ВОЛКА</div><h2>УДАР {{ hits + 1 }} / 5</h2>
      <div class="battle-arrow" :aria-label="direction.label">{{ direction.arrow }}</div>
      <p>НАЖМИ {{ direction.label }} В СВЕТЛОЙ ЗОНЕ</p>
      <div class="timing-track" role="progressbar" :aria-valuenow="Math.round(progress * 100)" aria-valuemin="0" aria-valuemax="100" aria-label="Момент удара">
        <div class="timing-zone" :style="{ left: `${HIT_START * 100}%`, width: `${(HIT_END - HIT_START) * 100}%` }"></div>
        <div class="timing-marker" :style="{ left: `${progress * 100}%` }"></div>
      </div>
      <div class="hit-indicators"><span v-for="(_, index) in HIT_COUNT" :key="index" :class="{ hit: index < hits }">{{ index < hits ? '■' : '□' }}</span></div>
      <div class="battle-directions" aria-label="Кнопки направления">
        <button aria-label="Вверх" @pointerdown.prevent="$emit('attempt', 'up')">↑</button><button aria-label="Влево" @pointerdown.prevent="$emit('attempt', 'left')">←</button><button aria-label="Вниз" @pointerdown.prevent="$emit('attempt', 'down')">↓</button><button aria-label="Вправо" @pointerdown.prevent="$emit('attempt', 'right')">→</button>
      </div>
    </div>
  </div>
</template>
