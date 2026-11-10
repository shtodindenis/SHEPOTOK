<script setup>
defineProps({ sound: Boolean, unlockedCount: Number, endingsTotal: Number, achievementCount: Number, achievementTotal: Number })
defineEmits(['new-game', 'continue-game', 'load-game', 'gallery', 'achievements', 'toggle-sound'])
</script>

<template>
  <div class="title-screen">
    <h1>ШЕПОТОК</h1>
    <button class="primary" @click="$emit('new-game')">НОВАЯ ИГРА</button>
    <button class="secondary" @click="$emit('continue-game')">ПРОДОЛЖИТЬ</button>
    <button class="secondary" @click="$emit('load-game')">ЗАГРУЗИТЬ ИГРУ</button>
    <button class="secondary" @click="$emit('gallery')">КОНЦОВКИ &nbsp; {{ unlockedCount }} / {{ endingsTotal }}</button>
    <button class="secondary" @click="$emit('achievements')">ДОСТИЖЕНИЯ &nbsp; {{ achievementCount }} / {{ achievementTotal }}</button>
    <button class="sound" @click="$emit('toggle-sound')">ЗВУК: {{ sound ? 'ВКЛ' : 'ВЫКЛ' }}</button>
    <div v-if="sound" class="music-start-hint">МУЗЫКА ВКЛЮЧИТСЯ ПОСЛЕ ПЕРВОГО НАЖАТИЯ</div>
    <a class="music-credits-link" href="/assets/MUSIC-CREDITS.txt" target="_blank" rel="noopener noreferrer">АВТОРЫ МУЗЫКИ</a>
  </div>
</template>
