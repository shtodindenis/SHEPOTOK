import type { Ref, ComputedRef } from 'vue'
import type { GameScreen } from '../stores/interface.ts'
import type { QuizCheckpoint } from './wellQuiz.ts'
import type { UrgencyState } from './urgency.ts'
import { directionFromEvent } from './skillCheck.ts'

type ValueRef<T> = Readonly<Ref<T>>
interface KeyboardContext {
  screen: Ref<GameScreen>; showFps: Ref<boolean>; fps: Ref<number | null>
  arrest: ValueRef<unknown>; dialog: ValueRef<unknown>; caughtFish: ValueRef<unknown>
  eusebiusQuiz: ValueRef<number | null>; detentionChoice: ValueRef<boolean>
  urgency: ValueRef<UrgencyState | null>; fishing: ValueRef<unknown>
  photoOpen: Ref<boolean>; quiz: ValueRef<QuizCheckpoint | null>; choice: ValueRef<boolean>
  quizSelected: Ref<number>; choiceIndex: Ref<number>
  quizQuestion: ComputedRef<{ options: string[] } | null>; hasFishingRod: ComputedRef<boolean>
  fpsMeter: { reset(): void }; keys: Set<string>
  battle: { attempt(direction: string): void }
  nextDialog(): void; resolveFish(keep: boolean): void; answerEusebius(index: number): void
  finishAmbulance(): void; finishSleep(): void; chooseDetentionEvidence(choice: 'cannabis' | 'shovel'): void
  attemptUrgency(): void; startBattle(): void; closeSlots(): void; openMenu(): void
  openSlots(mode: 'save' | 'load'): void; retrieveRod(): void; fishingPress(held: boolean): void
  answerQuiz(index: number): void; chooseWell(choice: boolean | 'fish'): void
  selectInventorySlot(index: number): void; dropItem(): void; useItem(): void
  start(restore: boolean): void; interact(): void
}

// Input precedence belongs here, independently from the game loop and renderer.
export function createKeyboardHandler(context: KeyboardContext) {
  const { screen, showFps, fps, arrest, dialog, caughtFish, eusebiusQuiz, detentionChoice,
    urgency, fishing, photoOpen, quiz, choice, quizSelected, choiceIndex, quizQuestion,
    hasFishingRod, fpsMeter, keys, battle, nextDialog, resolveFish, answerEusebius,
    finishAmbulance, finishSleep, chooseDetentionEvidence, attemptUrgency, startBattle,
    closeSlots, openMenu, openSlots, retrieveRod, fishingPress, answerQuiz, chooseWell,
    selectInventorySlot, dropItem, useItem, start, interact } = context
  return function onKey(event: KeyboardEvent) {
    const k = event.key.toLowerCase(), direction = directionFromEvent(event)
    if ((event.code === 'Backquote' || ['ё', '`', '~'].includes(k)) && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault()
      if (!event.repeat) { showFps.value = !showFps.value; fps.value = null; fpsMeter.reset() }
      return
    }
    if (direction || [' ', 'enter', 'e', 'у', 'q', 'й', 'r', 'к', 'shift'].includes(k)) event.preventDefault()
    if (arrest.value) { if (dialog.value && !event.repeat && ['enter',' ','e','у'].includes(k)) nextDialog(); return }
    if (caughtFish.value) { if (k === '1') resolveFish(true); else if (k === '2') resolveFish(false); return }
    if (eusebiusQuiz.value !== null) { if (/^[1-4]$/.test(k) && !event.repeat) answerEusebius(Number(k)-1); return }
    if (screen.value === 'ambulance') { if (['enter',' ','e','у'].includes(k) && !event.repeat) finishAmbulance(); return }
    if (screen.value === 'sleep') { if (['enter',' ','e','у'].includes(k) && !event.repeat) finishSleep(); return }
    if (detentionChoice.value) { if (k === '1') chooseDetentionEvidence('cannabis'); else if (k === '2') chooseDetentionEvidence('shovel'); return }
    if (urgency.value?.check && screen.value === 'game') { if (event.code === 'Space' && !event.repeat) { event.preventDefault(); attemptUrgency() }; return }
    if (screen.value === 'battle-ready') { if (!event.repeat && ['enter', ' ', 'e', 'у'].includes(k)) startBattle(); return }
    if (screen.value === 'battle') { if (direction && !event.repeat) battle.attempt(direction); return }
    if (screen.value === 'slots') { if (k === 'escape') closeSlots(); return }
    if (screen.value === 'gallery' || screen.value === 'achievements') { if (k === 'escape') screen.value = 'title'; return }
    if (screen.value === 'game' && !photoOpen.value && !quiz.value && !choice.value && !urgency.value && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (k === 'escape') { event.preventDefault(); openMenu(); return }
      if (event.code === 'KeyC') { event.preventDefault(); openSlots('save'); return }
      if (event.code === 'KeyV') { event.preventDefault(); openSlots('load'); return }
    }
    if (fishing.value) {
      if ((event.code==='KeyQ' || ['q','й'].includes(k)) && !event.repeat) retrieveRod()
      else if (event.code==='Space' && !event.repeat) fishingPress(true)
      return
    }
    if (photoOpen.value) { if (!event.repeat && (event.code === 'KeyR' || ['r','к','escape'].includes(k))) photoOpen.value = false; return }
    if (quiz.value) {
      if (event.repeat) return
      if (direction === 'up' || direction === 'down') quizSelected.value = (quizSelected.value + (direction === 'up' ? -1 : 1) + quizQuestion.value!.options.length) % quizQuestion.value!.options.length
      else if (['enter',' ','e','у'].includes(k)) answerQuiz(quizSelected.value)
      else if (/^[1-4]$/.test(k)) answerQuiz(Number(k)-1)
      return
    }
    if (choice.value) {
      if (direction && ['up', 'down'].includes(direction)) choiceIndex.value = (choiceIndex.value + (direction === 'up' ? -1 : 1) + (hasFishingRod.value ? 3 : 2)) % (hasFishingRod.value ? 3 : 2)
      else if (['enter', ' ', 'e', 'у'].includes(k) && !event.repeat) chooseWell(choiceIndex.value === 0 ? true : choiceIndex.value === 1 ? false : 'fish')
      else if (k === 'escape') chooseWell(false)
      return
    }
    if (screen.value === 'game' && !dialog.value && /^[1-6]$/.test(k) && !event.repeat) { selectInventorySlot(Number(k)-1); return }
    if ((event.code === 'KeyQ' || ['q','й'].includes(k)) && !event.repeat) { dropItem(); return }
    if ((event.code === 'KeyR' || ['r','к'].includes(k)) && !event.repeat) { useItem(); return }
    if (event.repeat && ['e', 'у', 'enter', ' '].includes(k)) return
    if (['e', 'у', 'enter', ' '].includes(k)) { if (screen.value === 'title') start(false); else if (screen.value === 'ending') screen.value = 'title'; else interact(); return }
    keys.add(k)
  }
}
