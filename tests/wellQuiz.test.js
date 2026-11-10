import test from 'node:test'
import assert from 'node:assert/strict'
import { quizQuestions, quizResult, QUIZ_TIME_MS, validQuiz } from '../src/game/wellQuiz.js'
import { achievements } from '../src/game/achievements.js'

test('three questions expose only the intended correct answers', () => {
  assert.deepEqual(quizQuestions.map(q=>q.options.length),[4,4,3])
  assert.match(quizQuestions[0].options[quizQuestions[0].correct],/Четыре/)
  assert.equal(quizQuestions[1].options[quizQuestions[1].correct],'I = U / R')
  assert.match(quizQuestions[2].options[quizQuestions[2].correct],/не вор.*не бык/)
  for(const [i,q] of quizQuestions.entries()) for(let a=0;a<q.options.length;a++) assert.equal(quizResult(i,a),a===q.correct ? i===2?'won':'next' : 'wrong')
  assert.equal(quizResult(2,3),'invalid');assert.equal(quizResult(-1,0),'invalid')
})
test('quiz restore rejects invalid or expired checkpoints', () => {
  assert.equal(validQuiz({index:1,remaining:12000}),true)
  for(const value of [null,{index:3,remaining:100},{index:0,remaining:0},{index:0,remaining:QUIZ_TIME_MS+1}]) assert.ok(!validQuiz(value))
})
test('achievement identifiers are unique', () => assert.equal(new Set(achievements.map(a=>a.id)).size,achievements.length))
