<script setup>
import { computed } from 'vue'
import { CHECK_DURATION } from '../game/urgency.js'
const props=defineProps({ run:Object })
const emit=defineEmits(['attempt'])
const seconds=computed(()=>Math.ceil(props.run.remaining/1000))
const ringStyle=computed(()=>{
  const check=props.run.check, degrees=check.width*360, third=degrees/3
  return { background:`conic-gradient(from ${check.center*360-degrees/2}deg, #efbd56 0deg ${third}deg, #6cd47a ${third}deg ${third*2}deg, #efbd56 ${third*2}deg ${degrees}deg, #4d4240 ${degrees}deg 360deg)` }
})
</script>
<template>
  <div class="urgency-vignette" aria-hidden="true"></div>
  <div class="urgency-timer" role="timer"><span>ДОБЕГИ ДО УНИТАЗА</span><strong>{{ seconds }}</strong><small>СЕКУНД</small></div>
  <div v-if="run.check" class="urgency-check" role="dialog" aria-label="Проверка выдержки">
    <div class="urgency-title">ДЕРЖИСЬ!</div>
    <div class="urgency-ring" :style="ringStyle">
      <div class="urgency-inner"></div>
      <div class="urgency-needle" :style="{ transform:`rotate(${run.check.elapsed / CHECK_DURATION * 360}deg)` }"><i></i></div>
    </div>
    <p>ПРОБЕЛ ИЛИ ЛКМ В ЗОНЕ</p>
    <p><b>ЗЕЛЁНАЯ +5 СЕК</b> · ПРОМАХ −5 СЕК</p>
    <button type="button" @click.stop="emit('attempt')">НАЖАТЬ</button>
  </div>
  <div v-else-if="run.feedback" class="urgency-feedback" aria-live="polite">{{ run.feedback === 'perfect' ? 'ИДЕАЛЬНО! +5 СЕК' : run.feedback === 'miss' ? 'ПРОМАХ! −5 СЕК' : 'УДАЛОСЬ!' }}</div>
</template>
