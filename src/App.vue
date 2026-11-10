<script setup>
import MenuScreen from './components/MenuScreen.vue'
import EndingGallery from './components/EndingGallery.vue'
import GameHud from './components/GameHud.vue'
import WolfBattle from './components/WolfBattle.vue'
import EndingScreen from './components/EndingScreen.vue'
import SaveSlots from './components/SaveSlots.vue'
import AchievementsGallery from './components/AchievementsGallery.vue'
import WellQuiz from './components/WellQuiz.vue'
import { useGame } from './game/useGame.js'

const { canvasHost, screen, location, dialog, near, sound, shovel, shovelUsed, note, inventory, selectedInventorySlot, selectInventorySlot, bikeHint, photo, photoOpen, togglePhoto, useItem, trip, endingKind, coords, choice, choiceIndex, questHint, endings, unlocked, achievements, achievementUnlocked, achievementToast, quiz, quizQuestion, quizSelected, quizSeconds, quizQuestions, answerQuiz, battle, slots, slotMode, slotNotice, slotFromGame, questState, openSlots, closeSlots, selectSlot, start, openMenu, interact, nextDialog, dig, chooseWell, press, release, startBattle } = useGame()
const { hits, progress, direction } = battle
</script>

<template>
  <main class="viewport" :class="{ tripping: trip && screen === 'game' && location === 'forest' }">
    <div ref="canvasHost" class="canvas-host"></div>
    <MenuScreen v-if="screen === 'title'" :sound="sound" :unlocked-count="unlocked.length" :achievement-count="achievementUnlocked.length" :achievement-total="achievements.length" @new-game="start(false)" @continue-game="start(true)" @load-game="openSlots('load')" @gallery="screen = 'gallery'" @achievements="screen = 'achievements'" @toggle-sound="sound = !sound" />
    <SaveSlots v-else-if="screen === 'slots'" :mode="slotMode" :slots="slots" :notice="slotNotice" :from-game="slotFromGame" :checkpoint="slotFromGame && ['tail','heist','chairs'].includes(questState)" @choose="selectSlot" @back="closeSlots" />
    <EndingGallery v-else-if="screen === 'gallery'" :endings="endings" :unlocked="unlocked" @back="screen = 'title'" />
    <AchievementsGallery v-else-if="screen === 'achievements'" :achievements="achievements" :unlocked="achievementUnlocked" @back="screen = 'title'" />
    <GameHud v-else-if="screen === 'game' || screen === 'diving'" :screen="screen" :location="location" :coords="coords" :note="note" :inventory="inventory" :selected-inventory-slot="selectedInventorySlot" :bike-hint="bikeHint" :photo="photo" :photo-open="photoOpen" :shovel="shovel" :shovel-used="shovelUsed" :near="near" :dialog="dialog" :choice="choice" :choice-index="choiceIndex" :quest-hint="questHint" @select-inventory="selectInventorySlot" @toggle-photo="togglePhoto" @use-item="useItem" @menu="openMenu" @save-game="openSlots('save')" @load-game="openSlots('load')" @interact="interact" @next-dialog="nextDialog" @dig="dig" @press="press" @release="release" @choose="chooseWell" />
    <WolfBattle v-else-if="screen === 'battle-ready' || screen === 'battle'" :ready="screen === 'battle-ready'" :hits="hits" :progress="progress" :direction="direction" @start="startBattle" @attempt="battle.attempt" />
    <div v-else-if="screen === 'ominous'" class="ominous" aria-hidden="true"></div>
    <div v-else-if="screen === 'scare'" class="scare" role="img" aria-label="Проклятие гадалки"><div class="scare-figure"></div></div>
    <EndingScreen v-else :ending="endings.find(item => item.id === endingKind)" @menu="screen = 'title'" />
    <WellQuiz v-if="screen === 'game' && quiz" :question="quizQuestion" :number="quiz.index + 1" :total="quizQuestions.length" :selected="quizSelected" :seconds="quizSeconds" @answer="answerQuiz" />
    <div v-if="achievementToast" class="achievement-toast" role="status"><strong>ДОСТИЖЕНИЕ ОТКРЫТО</strong>{{ achievementToast.title }}</div>
  </main>
</template>
