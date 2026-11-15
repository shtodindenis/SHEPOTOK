<script setup lang="ts">
defineProps({ question: { type: Object as () => { question: string; options: string[] }, required: true }, number: Number })
defineEmits(['answer'])
</script>
<template>
  <div class="quiz-screen" role="dialog" aria-modal="true" aria-labelledby="eusebius-question">
    <div class="quiz-box">
      <div class="quiz-meta"><span>ЕВСОБИЙ · ВОПРОС {{ number }} / 3</span></div>
      <p id="eusebius-question">{{ question.question }}</p>
      <button v-for="(answer,index) in question.options" :key="index" @click="$emit('answer', index)"><span>{{ index+1 }}.</span> {{ answer }}</button>
      <div class="quiz-help">ВЫБЕРИ ОТВЕТ МЫШЬЮ ИЛИ КЛАВИШАМИ 1–4</div>
    </div>
  </div>
</template>
