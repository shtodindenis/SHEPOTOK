<script setup>
defineProps({ ending: Object })
defineEmits(['menu'])
</script>

<template>
  <div class="ending"><h2>{{ ending?.title }}</h2><p>{{ ending?.detail }}</p><button class="primary" @click="$emit('menu')">В МЕНЮ</button></div>
</template>
