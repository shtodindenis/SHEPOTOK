<script setup>
defineEmits(['finish'])
</script>
<template>
  <div class="sleep-scene" role="dialog" aria-label="Тигран спит после шепотка">
    <div class="sleep-stars" aria-hidden="true">✦　　　　✧　　　　　　　✦</div>
    <div class="sleep-bed" aria-hidden="true"><div class="sleep-pillow"></div><div class="sleep-head"></div><div class="sleep-blanket"></div><div class="sleep-zzz">Z z z</div></div>
    <div class="sleep-caption"><p>После шепотка Тигран уснул. Утром его туз зажил.</p><button @click="$emit('finish')">ПРОСНУТЬСЯ</button></div>
  </div>
</template>
