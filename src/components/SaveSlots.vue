<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ mode: String, slots: Array, fromGame: Boolean, checkpoint: Boolean, notice: String })
const emit = defineEmits(['choose', 'back'])
const confirm = ref(-1)
watch(() => props.mode, () => { confirm.value = -1 })
const places = {home:'Дом Тиграна',village:'Деревня',hut:'Дом гадалки',forest:'Лес',river:'Река',society:'Дом общества',society_village:'Поселение общества',mansion:'Особняк'}
function date(value) { return new Date(value).toLocaleString('ru-RU', { day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit' }) }
function description(save) {
  const q=save.questState
  if (q==='tail' || q==='tail_ready') return 'Слежка за бабкой'
  if (q==='report1') return 'После слежки'
  if (q==='heist' || q==='heist_ready') return 'Поиски красного стула'
  if (q==='report2' || q==='chairs') return 'Испытание со стульями'
  if (q==='done') return 'Член общества'
  return ['Поиски гадалки','Поиски клада','Находка для гадалки','Путь домой'][save.stage] || 'Приключение'
}
function choose(i) {
  if (props.mode==='load' && !props.slots[i]) return
  if ((props.mode==='save' && props.slots[i]) || (props.mode==='load' && props.fromGame)) { confirm.value=i; return }
  emit('choose',i);confirm.value=-1
}
function proceed(i) { emit('choose',i);confirm.value=-1 }
</script>
<template>
  <div class="slots-screen">
    <div class="slots-panel">
      <div class="slots-heading"><h2>{{ mode === 'save' ? 'СОХРАНИТЬ ИГРУ' : 'ЗАГРУЗИТЬ ИГРУ' }}</h2><button @click="$emit('back')">НАЗАД</button></div>
      <p class="slots-help">{{ mode === 'save' ? 'Выбери слот. Автосохранение хранится отдельно.' : 'Выбери сохранение. «Продолжить» в меню открывает автосохранение.' }}</p>
      <p v-if="checkpoint" class="slots-help">Текущее испытание при загрузке начнётся с безопасной точки.</p>
      <p v-if="notice" class="slots-notice" role="status">{{ notice }}</p>
      <div v-for="(slot, i) in slots" :key="i" class="slot-row">
        <button v-if="confirm !== i" class="slot-choice" :disabled="mode === 'load' && !slot" @click="choose(i)">
          <strong>СЛОТ {{ i + 1 }}</strong><span v-if="slot">{{ places[slot.data.location] || 'Игра' }} · {{ description(slot.data) }}<br>{{ date(slot.savedAt) }}</span><span v-else>ПУСТО</span><b>{{ mode === 'save' ? 'СОХРАНИТЬ' : slot ? 'ЗАГРУЗИТЬ' : '' }}</b>
        </button>
        <div v-else class="slot-confirm"><span>{{ mode === 'save' ? 'Перезаписать этот слот?' : 'Загрузить слот и заменить текущий прогресс?' }}</span><button @click="proceed(i)">ДА</button><button @click="confirm = -1">НЕТ</button></div>
      </div>
    </div>
  </div>
</template>
