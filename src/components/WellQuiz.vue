<script setup>
defineProps({ question: Object, number: Number, total: Number, selected: Number, seconds: Number })
defineEmits(['answer'])
</script>
<template>
  <div class="quiz-screen" role="dialog" aria-modal="true" aria-labelledby="quiz-question">
    <div class="quiz-box">
      <div class="quiz-meta"><span>КУКОЛД · ВОПРОС {{ number }} / {{ total }}</span><span>ОСТАЛОСЬ: {{ seconds }} СЕК.</span></div>
      <p id="quiz-question">{{ question.question }}</p>
      <button v-for="(answer,index) in question.options" :key="index" :class="{ selected: selected === index }" @click="$emit('answer',index)"><span>{{ index+1 }}.</span> {{ answer }}</button>
      <div class="quiz-help">СТРЕЛКИ + ENTER ИЛИ КЛИК · НЕВЕРНЫЙ ОТВЕТ ИЛИ ВРЕМЯ ВЫШЛО — В КОЛОДЕЦ</div>
    </div>
  </div>
</template>
