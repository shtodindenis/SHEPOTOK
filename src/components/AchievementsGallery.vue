<script setup>
defineProps({ achievements: Array, unlocked: Array })
defineEmits(['back'])
</script>
<template>
  <div class="gallery achievements-gallery">
    <div class="gallery-heading"><h2>ДОСТИЖЕНИЯ</h2><span>{{ unlocked.length }} / {{ achievements.length }}</span></div>
    <div class="gallery-list" role="list">
      <div v-for="(item, index) in achievements" :key="item.id" class="gallery-item" role="listitem">
        <span class="gallery-number">{{ unlocked.includes(item.id) ? '★' : '☆' }}</span>
        <div><strong>{{ item.title }}</strong><p>{{ item.detail }} {{ unlocked.includes(item.id) ? '· ОТКРЫТО' : '· НЕ ОТКРЫТО' }}</p></div>
      </div>
    </div>
    <button class="secondary gallery-back" @click="$emit('back')">НАЗАД</button>
  </div>
</template>
