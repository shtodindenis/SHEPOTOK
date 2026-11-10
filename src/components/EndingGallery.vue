<script setup>
defineProps({ endings: Array, unlocked: Array })
defineEmits(['back'])
</script>

<template>
  <div class="gallery">
    <div class="gallery-heading"><h2>КОНЦОВКИ</h2><span>{{ unlocked.length }} / 5</span></div>
    <div class="gallery-list" role="list">
      <div v-for="(item, index) in endings" :key="item.id" class="gallery-item" role="listitem">
        <span class="gallery-number">{{ String(index + 1).padStart(2, '0') }}</span>
        <div><strong>{{ unlocked.includes(item.id) ? item.title : '???' }}</strong><p>{{ unlocked.includes(item.id) ? item.detail : 'КОНЦОВКА НЕ ОТКРЫТА' }}</p></div>
      </div>
    </div>
    <button class="secondary gallery-back" @click="$emit('back')">НАЗАД</button>
  </div>
</template>
