<script setup>
defineEmits(['finish'])
</script>
<template>
  <div class="ambulance-scene" role="dialog" aria-label="Скорая помощь приехала за Тиграном">
    <div class="ambulance-sky"><div class="ambulance-moon"></div></div>
    <div class="ambulance-road"></div>
    <div class="ambulance-van" aria-hidden="true">
      <div class="ambulance-light"></div><div class="ambulance-window"></div><div class="ambulance-cross">✚</div>
      <div class="ambulance-wheel one"></div><div class="ambulance-wheel two"></div>
    </div>
    <div class="ambulance-caption"><strong>СКОРАЯ ПОМОЩЬ</strong><p>Капитан Кук вызвал врачей. Тиграна отвезли лечиться.</p><button @click="$emit('finish')">ДАЛЕЕ</button></div>
  </div>
</template>
