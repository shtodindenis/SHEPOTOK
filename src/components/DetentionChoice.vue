<script setup lang="ts">
defineEmits(['choose'])
</script>
<template>
  <div class="choice-screen" role="dialog" aria-modal="true" aria-labelledby="evidence-choice">
    <div class="choice-box">
      <p id="evidence-choice">Пакетик за решёткой. Что делать?</p>
      <button @click="$emit('choose', 'cannabis')">ДОСТАТЬ ПАКЕТИК — ЛОПАТА ОСТАНЕТСЯ ВНУТРИ, ПОДНИМЕТСЯ ТРЕВОГА</button>
      <button @click="$emit('choose', 'shovel')">УЙТИ С ЛОПАТОЙ — ПАКЕТИК ОСТАНЕТСЯ У ПОЛИЦИИ</button>
    </div>
  </div>
</template>
