export const quizQuestions = [
  { question:'Сколько сидячих мест будет, если перевернуть табурет?', options:['Два','Четыре','Три','Одно'], correct:1 },
  { question:'Как записывается закон Ома для участка цепи?', options:['I = U / R','U = I / R','R = U × I','I = U × R'], correct:0 },
  { question:'Ты вор в законе или бык в загоне?', options:['Я вор и я бык','Ни вор, ни бык — просто мимо проходил','Я не вор, но я в законе; я не бык, но я в загоне'], correct:2 },
]
export const QUIZ_TIME_MS = 25000
export function validQuiz(value) { return value && Number.isInteger(value.index) && value.index >= 0 && value.index < quizQuestions.length && Number.isFinite(value.remaining) && value.remaining > 0 && value.remaining <= QUIZ_TIME_MS }
export function quizResult(questionIndex, answerIndex) {
  const question = quizQuestions[questionIndex]
  if (!question || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.options.length) return 'invalid'
  return answerIndex !== question.correct ? 'wrong' : questionIndex === quizQuestions.length-1 ? 'won' : 'next'
}
