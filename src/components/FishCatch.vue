<script setup lang="ts">
defineProps({ fish: Object })
defineEmits(['keep', 'release'])
</script>
<template>
  <div class="choice-screen" role="dialog" aria-modal="true" aria-labelledby="fish-title">
    <div class="choice-box fish-card">
      <p id="fish-title">ПОЙМАНА РЫБА: {{ fish.name }}</p>
      <div class="fish-picture" :class="`fish-${fish.kind}`" :style="{ '--fish-color':fish.color }" aria-hidden="true"><i></i></div>
      <button @click="$emit('keep')">ПОЛОЖИТЬ В ВЕДРО</button>
      <button @click="$emit('release')">ОТПУСТИТЬ</button>
    </div>
  </div>
</template>
