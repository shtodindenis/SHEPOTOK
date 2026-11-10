import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { startFishing, updateFishing, hookFish } from './fishing.js'
import { RIVER_ENTRY, RIVER_ROD, RIVER_FISHER, canFishAtRiver } from './river.js'
import { reconcileInventory } from './inventory.js'
import { createAudio } from './audio.js'
import { getBikeHint, getQuestHint } from './hints.js'
import { createSkillCheck, directionFromEvent } from './skillCheck.js'
import { readAchievements, readEndings, readSave, readSlots, writeAchievements, writeEndings, writeSave, writeSlot } from './storage.js'
import { conversations, endings } from './story.js'
import { achievements } from './achievements.js'
import { QUIZ_TIME_MS, quizQuestions, quizResult, validQuiz } from './wellQuiz.js'
import { VILLAGE, OTHER_DOORS } from './village.js'
import { createWorld } from './world.js'
import { behindTree, STASH_SPOTS, stashAt, CAMP, FOREST_EAST, FOREST_MUSHROOMS, RIVER_PATH_ENTRY, FOREST_SIGN } from './forestMap.js'
import { QUEST_STATES, SEATS, advanceChairs, createChairs, createTail, inShadow, sitDown, updateTail } from './societyQuest.js'
import { MANSION_ENTRY, MANSION_CHAIR, createMansionPatrol, advanceMansionPatrol } from './mansionLayout.js'

export function useGame() {
  const canvasHost = ref(null), screen = ref('title'), location = ref('home'), stage = ref(0)
  const dialog = ref(null), near = ref(''), sound = ref(true), shovel = ref(false), shovelUsed = ref(false)
  const note = ref(false), trip = ref(false), mushroomUsed = ref(false), wolfDefeated = ref(false), endingKind = ref('healed')
  const stashIndex = ref(0)
  const societyProgress = ref(0), questState = ref('none'), questStatus = ref('')
  const stashState = ref('buried'), slots = ref(readSlots()), slotMode = ref('load'), slotNotice = ref(''), slotFromGame = ref(false)
  const shovelPermission = ref(false), witchAngry = ref(false), wrongDigs = ref(0), wellQuizPassed = ref(false), pendingDiver = ref('')
  const quiz = ref(null), quizSelected = ref(0), achievementUnlocked = ref(readAchievements()), achievementToast = ref(null)
  const photoOpen = ref(false), photo = ref('')
  const ragTaken = ref(false), bikeQuest = ref(false), bikeClean = ref(false), selectedInventorySlot = ref(-1)
  const droppedRag = ref(null), droppedItems = ref({}), rodTaken = ref(false), fishing = ref(null)
  const inventory = ref(Array(6).fill(null))
  const ownedItems = computed(() => [ragTaken.value ? 'rag' : null, shovel.value && !shovelUsed.value && !droppedItems.value.shovel ? 'shovel' : null, note.value && !droppedItems.value.photo ? 'photo' : null, stashState.value === 'player' && !droppedItems.value.treasure ? 'treasure' : null, rodTaken.value && !droppedItems.value.rod ? 'rod' : null].filter(Boolean))
  watch(ownedItems, items => {
    const selected=inventory.value[selectedInventorySlot.value]
    inventory.value=reconcileInventory(inventory.value,items)
    if (selected && !inventory.value.includes(selected)) selectedInventorySlot.value=-1
  }, {flush:'sync'})
  const bikeHint = computed(() => getBikeHint({ bikeQuest: bikeQuest.value, bikeClean: bikeClean.value, ragTaken: ragTaken.value, droppedRag: droppedRag.value }))
  const quizQuestion = computed(() => quiz.value ? quizQuestions[quiz.value.index] : null)
  const quizSeconds = computed(() => quiz.value ? Math.ceil(quiz.value.remaining / 1000) : 0)
  const coords = ref({ x: 1, y: 1 }), choice = ref(false), choiceIndex = ref(0), unlocked = ref(readEndings())
  // Existing ending records already prove these two achievements happened.
  for (const [ending, achievement] of [['diver','diver'], ['curse','inhalation']]) {
    if (unlocked.value.includes(ending) && !achievementUnlocked.value.includes(achievement)) achievementUnlocked.value.push(achievement)
  }
  writeAchievements(achievementUnlocked.value)
  const keys = new Set(), player = { x: 160, y: 135 }
  const audio = createAudio(() => sound.value)
  let renderer, curseTimer, achievementTimer, elapsed = 0, diveElapsed = 0, diveStart = { x: 0, y: 0 }, diveCause = 'jump', lastQuizSecond = 0, disposed = false
  let tail = null, patrol = null, carriedChair = false, chairGame = null, chairStarts = []
  function syncMusic() {
    let track = null
    if (screen.value === 'title' || screen.value === 'gallery' || screen.value === 'achievements' || (screen.value === 'slots' && !slotFromGame.value)) track = 'menu'
    else if (screen.value === 'game') {
      if (questState.value === 'chairs' && chairGame?.phase === 'music') track = 'chairs'
      else if (location.value === 'forest') track = questState.value === 'tail' ? 'tail' : 'forest'
    }
    audio.setMusic(track)
  }
  watch([screen, location, questState, sound], syncMusic, { flush:'sync' })
  const questHint = computed(() => getQuestHint({ questState: questState.value, questStatus: questStatus.value, location: location.value, witchAngry: witchAngry.value, stashState: stashState.value, stage: stage.value, shovel: shovel.value, shovelUsed: shovelUsed.value, note: note.value }))

  const battle = createSkillCheck(
    () => { screen.value = 'game'; audio.beep(520, .12); speak('wolfVictory', () => { trip.value = false; wolfDefeated.value = true; transition('society', 160, 151) }, true) },
    () => { unlockAchievement('wolf_loss'); screen.value = 'game'; audio.beep(110, .2); speak('wolfFail', () => finishEnding('wolf'), true) },
  )

  function snapshot() { return { location: location.value, stage: stage.value, stashIndex: stashIndex.value, note: note.value, shovel: shovel.value, trip: trip.value, mushroomUsed: mushroomUsed.value, rodTaken: rodTaken.value, wolfDefeated: wolfDefeated.value, societyProgress: societyProgress.value, questState: questState.value, carriedChair, ragTaken: ragTaken.value || !!droppedRag.value, bikeClean: bikeClean.value } }
  function drawScene() {
    if (!renderer) return
    if (note.value && !photo.value && location.value !== 'forest') {
      renderer.draw({ ...snapshot(), location:'forest', trip:false }, { ...player })
      photo.value = renderer.forestPhoto()
    }
    renderer.draw(snapshot(), player)
    if (location.value === 'forest') photo.value = renderer.forestPhoto()
    near.value = ''
  }
  function saveData() { return { stage: stage.value, location: location.value, shovel: shovel.value, shovelUsed: shovelUsed.value, shovelPermission: shovelPermission.value, witchAngry: witchAngry.value, wrongDigs: wrongDigs.value, wellQuizPassed: wellQuizPassed.value, pendingDiver: pendingDiver.value, quiz: quiz.value ? { ...quiz.value } : null, note: note.value, trip: trip.value, mushroomUsed: mushroomUsed.value, wolfDefeated: wolfDefeated.value, inventorySlots: inventory.value, rodTaken: rodTaken.value, societyProgress: societyProgress.value, questState: questState.value, stashState: stashState.value, stashIndex: stashIndex.value, forestVersion: 5, homeVersion: 1, hutVersion: 2, villageVersion: 1, ragTaken: ragTaken.value, droppedRag: droppedRag.value, droppedItems: droppedItems.value, bikeQuest: bikeQuest.value, bikeClean: bikeClean.value, selectedInventorySlot: selectedInventorySlot.value, player: { x: player.x, y: player.y } } }
  function save() { writeSave(saveData()) }
  function unlockEnding(id) {
    if (!unlocked.value.includes(id)) unlocked.value = [...unlocked.value, id]
    writeEndings(unlocked.value)
  }
  function unlockAchievement(id, notify = true) {
    if (achievementUnlocked.value.includes(id)) return
    const item = achievements.find(entry => entry.id === id); if (!item) return
    achievementUnlocked.value = [...achievementUnlocked.value, id]; writeAchievements(achievementUnlocked.value)
    if (notify) { achievementToast.value = item; clearTimeout(achievementTimer); achievementTimer = window.setTimeout(() => { achievementToast.value = null }, 4500) }
  }
  function finishEnding(id) { endingKind.value = id; stage.value = 4; trip.value = false; choice.value = false; quiz.value = null; pendingDiver.value = ''; battle.stop(); unlockEnding(id); screen.value = 'ending'; save() }
  function triggerCurse() {
    unlockAchievement('inhalation')
    keys.clear(); screen.value = 'ominous'
    curseTimer = window.setTimeout(() => {
      screen.value = 'scare'; endingKind.value = 'curse'; stage.value = 4; unlockEnding('curse'); save(); audio.scream()
      curseTimer = window.setTimeout(() => { screen.value = 'ending' }, 3000)
    }, 700)
  }
  const brokenLine = ['ТИГРАН', 'Черт её подери, лопата сломалась, что за хуйню мне дала гадалка']
  function speak(id, done, broken = false) { keys.clear(); dialog.value = { lines: broken ? [...conversations[id], brokenLine] : conversations[id], index: 0, done }; audio.beep(260) }
  function breakShovel() { shovelUsed.value = true; save() }
  function nextDialog() {
    if (!dialog.value) return
    audio.beep(390)
    if (dialog.value.index < dialog.value.lines.length - 1) dialog.value.index++
    else { const done = dialog.value.done; dialog.value = null; done?.(); save() }
  }
  function chooseWell(dive) {
    choice.value = false; keys.clear()
    if (dive === 'fish') { fishing.value=startFishing('well'); return }
    if (dive) beginDive('jump')
  }
  function castRod() {
    if (fishing.value) return
    if (location.value !== 'river' || !canFishAtRiver(player)) { speak('rodNeedWater'); return }
    fishing.value=startFishing('river', 3000+Math.random()*2200); keys.clear()
  }
  function retrieveRod() { if (!fishing.value) return; fishing.value=null; keys.clear() }
  function fishingPress(held) {
    const f=fishing.value
    if (!f || f.kind !== 'river') return
    if (held && f.phase === 'bite') hookFish(f)
    f.holding=held && f.phase==='reeling'
  }
  function beginDive(cause) {
    pendingDiver.value = cause; diveCause = cause; quiz.value = null; choice.value = false; dialog.value = null; keys.clear()
    diveStart = { ...player }; diveElapsed = 0; save(); screen.value = 'diving'; audio.beep(220, .15)
  }
  function startQuiz() { quizSelected.value = 0; quiz.value = { index:0, remaining:QUIZ_TIME_MS }; lastQuizSecond = Math.ceil(QUIZ_TIME_MS / 1000); keys.clear(); save() }
  function failQuiz() {
    if (!quiz.value) return
    quiz.value = null; pendingDiver.value = 'thrown'; keys.clear(); save(); speak('quizWrong', () => beginDive('thrown'))
  }
  function answerQuiz(index) {
    if (!quiz.value) return
    const result = quizResult(quiz.value.index, index)
    if (result === 'wrong') { failQuiz(); return }
    if (result === 'next') { quiz.value.index++; quiz.value.remaining = QUIZ_TIME_MS; quizSelected.value = 0; lastQuizSecond = Math.ceil(QUIZ_TIME_MS / 1000); audio.beep(470); save() }
    else if (result === 'won') { quiz.value = null; wellQuizPassed.value = true; keys.clear(); unlockAchievement('wise'); save(); speak('quizWin') }
  }
  function start(restore = false, slotSave = null) {
    const saved = slotSave || (restore ? readSave() : null)
    dialog.value = null; choice.value = false; fishing.value = null; photoOpen.value = false; photo.value = ''; quiz.value = null; pendingDiver.value = ''; battle.stop(); endingKind.value = 'healed'; keys.clear(); tail = null; chairGame = null; carriedChair = false
    if (saved) {
      stashIndex.value = Number.isInteger(saved.stashIndex) && saved.stashIndex >= 0 && saved.stashIndex < STASH_SPOTS.length ? saved.stashIndex : 0
      stage.value = saved.stage; location.value = saved.location; player.x = saved.player.x; player.y = saved.player.y
      if (saved.location === 'village' && saved.villageVersion !== 1) {
        const target = saved.quiz ? VILLAGE.neighbor : saved.player.x >= 570 ? VILLAGE.forest : saved.player.x >= 400 ? VILLAGE.mansion : saved.player.x >= 240 ? VILLAGE.hut : saved.player.x >= 140 ? VILLAGE.well : VILLAGE.home
        player.x = target.x; player.y = target.y + (target === VILLAGE.well ? 20 : 0)
      }
      if (saved.location === 'hut' && saved.hutVersion !== 2) { player.x = 75; player.y = 169 }
      if (saved.location === 'home' && saved.homeVersion !== 1) { player.x = 256; player.y = 270 }
      droppedRag.value = saved.droppedRag && ['home','village','hut','forest','river','society','mansion'].includes(saved.droppedRag.location) && Number.isFinite(saved.droppedRag.x) && Number.isFinite(saved.droppedRag.y) ? { ...saved.droppedRag } : null
      droppedItems.value = Object.fromEntries(Object.entries(saved.droppedItems || {}).filter(([kind,p]) => ['shovel','photo','treasure','rod'].includes(kind) && p && ['home','village','hut','forest','river','society','mansion'].includes(p.location) && Number.isFinite(p.x) && Number.isFinite(p.y)))
      ragTaken.value = !!saved.ragTaken && !droppedRag.value; bikeQuest.value = !!saved.bikeQuest; bikeClean.value = !!saved.bikeClean
      selectedInventorySlot.value = Number.isInteger(saved.selectedInventorySlot) && saved.selectedInventorySlot >= 0 && saved.selectedInventorySlot < 6 ? saved.selectedInventorySlot : -1
      rodTaken.value = !!saved.rodTaken; shovel.value = !!saved.shovel; shovelUsed.value = saved.shovelUsed; note.value = !!saved.note; trip.value = !!saved.trip; wolfDefeated.value = saved.wolfDefeated; mushroomUsed.value = typeof saved.mushroomUsed === 'boolean' ? saved.mushroomUsed : trip.value || wolfDefeated.value
      societyProgress.value = Number.isInteger(saved.societyProgress) ? Math.max(0, Math.min(3, saved.societyProgress)) : 0
      shovelPermission.value = typeof saved.shovelPermission === 'boolean' ? saved.shovelPermission : saved.stage >= 1
      // In older saves a stage-zero shovel could only have been taken before asking.
      witchAngry.value = typeof saved.witchAngry === 'boolean' ? saved.witchAngry : saved.stage === 0 && shovel.value && !shovelPermission.value
      if (witchAngry.value) { unlockAchievement('thief', false); if (stage.value === 0 && note.value) stage.value = 1 }
      wrongDigs.value = Number.isInteger(saved.wrongDigs) ? Math.max(0, Math.min(5, saved.wrongDigs)) : 0
      wellQuizPassed.value = !!saved.wellQuizPassed
      pendingDiver.value = ['jump','thrown'].includes(saved.pendingDiver) ? saved.pendingDiver : ''
      stashState.value = ['buried','witch','player','returned'].includes(saved.stashState) ? saved.stashState : saved.stage >= 3 ? 'returned' : saved.stage >= 2 ? 'player' : 'buried'
      const oldSelected = Array.isArray(saved.inventorySlots) ? saved.inventorySlots[saved.selectedInventorySlot] : ['rag','shovel','photo','treasure'][saved.selectedInventorySlot]
      inventory.value = reconcileInventory(saved.inventorySlots, ownedItems.value)
      selectedInventorySlot.value = oldSelected ? inventory.value.indexOf(oldSelected) : -1
      questState.value = QUEST_STATES.includes(saved.questState) ? saved.questState : ['none','report1','report2','done'][societyProgress.value]
      if (questState.value === 'tail') { questState.value = 'tail_ready'; location.value = 'forest'; player.x = FOREST_EAST.x-30; player.y = FOREST_EAST.y }
      if (questState.value === 'heist' || location.value === 'mansion') { questState.value = 'heist_ready'; location.value = 'village'; player.x = VILLAGE.mansion.x; player.y = VILLAGE.mansion.y }
      if (questState.value === 'chairs') { questState.value = 'report2'; location.value = 'society'; player.x = 160; player.y = 151 }
      if (saved.location === 'forest' && saved.forestVersion !== 5) {
        player.x = questState.value === 'tail_ready' ? FOREST_EAST.x-30 : 40
        player.y = 224
      }
      if (!pendingDiver.value && questState.value === 'done' && location.value === 'village' && validQuiz(saved.quiz)) { quiz.value = { index:saved.quiz.index, remaining:saved.quiz.remaining }; quizSelected.value = 0; lastQuizSecond = Math.ceil(saved.quiz.remaining / 1000) }
      if (societyProgress.value === 3 || questState.value === 'done') unlockAchievement('throne', false)
      if (trip.value) unlockAchievement('trip', false)
    } else {
      droppedRag.value = null; droppedItems.value = {}; rodTaken.value = false; ragTaken.value = false; bikeQuest.value = false; bikeClean.value = false; selectedInventorySlot.value = -1
      stage.value = 0; location.value = 'home'; player.x = 145; player.y = 110; shovel.value = false; shovelUsed.value = false; note.value = false; trip.value = false; mushroomUsed.value = false; wolfDefeated.value = false
      societyProgress.value = 0
      questState.value = 'none'
      stashState.value = 'buried'; stashIndex.value = Math.floor(Math.random() * STASH_SPOTS.length)
      shovelPermission.value = false; witchAngry.value = false; wrongDigs.value = 0; wellQuizPassed.value = false
    }
    if (unlocked.value.includes('diver')) unlockAchievement('diver', false)
    if (unlocked.value.includes('curse')) unlockAchievement('inhalation', false)
    if (pendingDiver.value) { location.value = 'village'; player.x = VILLAGE.well.x; player.y = VILLAGE.well.y + 22 }
    screen.value = 'game'; drawScene()
    if (pendingDiver.value) beginDive(pendingDiver.value)
    else if (!saved) speak('intro')
  }
  function openSlots(mode) {
    slotMode.value = mode; slotFromGame.value = screen.value === 'game'; slotNotice.value = ''; slots.value = readSlots(); keys.clear(); screen.value = 'slots'
  }
  function closeSlots() {
    screen.value = slotFromGame.value ? 'game' : 'title'; keys.clear()
  }
  function selectSlot(index) {
    if (slotMode.value === 'save') {
      if (writeSlot(index, saveData())) { slots.value = readSlots(); slotNotice.value = `Игра сохранена в слот ${index + 1}.` }
      else slotNotice.value = 'Не удалось сохранить: проверь доступность хранилища браузера.'
    } else {
      const chosen = readSlots()[index]
      if (!chosen) { slotNotice.value = 'Сохранение недоступно или повреждено.'; return }
      start(false, chosen.data); save()
    }
  }
  function openMenu() {
    fishing.value = null
    if (questState.value === 'tail') { questState.value = 'tail_ready'; location.value = 'forest'; player.x = FOREST_EAST.x-30; player.y = FOREST_EAST.y; tail = null }
    if (questState.value === 'heist') { questState.value = 'heist_ready'; location.value = 'village'; player.x = VILLAGE.mansion.x; player.y = VILLAGE.mansion.y; carriedChair = false }
    if (questState.value === 'chairs') { questState.value = 'report2'; location.value = 'society'; player.x = 160; player.y = 151; chairGame = null }
    save(); keys.clear(); dialog.value = null; choice.value = false; photoOpen.value = false; screen.value = 'title'
  }
  function transition(dest, x, y) {
    const origin = location.value
    fishing.value = null
    location.value = dest; photoOpen.value = false; player.x = x; player.y = y; drawScene(); save(); audio.beep(200, .1)
    if (origin === 'society' && dest === 'forest' && questState.value === 'tail_ready') startTail()
  }
  function encounterWolf() {
    if (wolfDefeated.value) { transition('society', 160, 151); return }
    if (inventory.value.includes('shovel')) speak('wolfReady', () => { keys.clear(); screen.value = 'battle-ready' })
    else speak('wolf', () => finishEnding('wolf'))
  }
  function startBattle() { keys.clear(); breakShovel(); battle.start(); screen.value = 'battle' }
  function captain() {
    if (questState.value === 'none') speak('captainFirst', () => { questState.value = 'tail_ready' })
    else if (questState.value === 'tail_ready') speak('tailReminder')
    else if (questState.value === 'report1') speak('captainSecond', () => { questState.value = 'heist_ready'; drawScene() })
    else if (questState.value === 'heist_ready') speak('heistReminder')
    else if (questState.value === 'report2') speak('captainThird', startChairs)
    else if (questState.value === 'done') speak('captainMember')
  }
  function startTail() {
    const mode = stashState.value === 'witch' ? 'carrying' : stashState.value === 'buried' ? 'buried' : 'empty'
    questState.value = 'tail'; tail = createTail(mode, stashIndex.value); player.x = FOREST_EAST.x-30; player.y = FOREST_EAST.y; drawScene(); save(); speak(mode === 'carrying' ? 'tailStartCarrying' : mode === 'empty' ? 'tailStartEmpty' : 'tailStart')
  }
  function startHeist() { questState.value = 'heist'; carriedChair = false; patrol = createMansionPatrol(); transition('mansion', MANSION_ENTRY.x, MANSION_ENTRY.y); save() }
  function startChairs() { questState.value = 'chairs'; chairGame = createChairs(); chairStarts = []; player.x = 160; player.y = 153; drawScene(); syncMusic(); save() }
  function returnFromHeist() {
    questState.value = carriedChair ? 'report2' : 'heist_ready'
    if (carriedChair) societyProgress.value = 2
    const completed = carriedChair; carriedChair = false; patrol = null; transition('village', VILLAGE.mansion.x, VILLAGE.mansion.y)
    if (completed) speak('missionTwoDone')
  }
  function sitAtChair() {
    if (!chairGame) return
    const result = sitDown(chairGame, player)
    if (result === 'won') {
      questState.value = 'done'; societyProgress.value = 3; chairGame = null; unlockAchievement('throne'); drawScene(); save(); speak('missionThreeDone')
    } else if (result === 'next') { syncMusic(); save() }
  }
  function selectInventorySlot(index) {
    if (screen.value !== 'game' || dialog.value || choice.value || quiz.value || photoOpen.value || fishing.value || index < 0 || index >= 6) return
    selectedInventorySlot.value = selectedInventorySlot.value === index ? -1 : index; save()
  }
  function dropItem() {
    if (fishing.value) { retrieveRod(); return }
    if (screen.value !== 'game' || dialog.value || choice.value || quiz.value || photoOpen.value || !renderer) return
    const kind=inventory.value[selectedInventorySlot.value]
    if (!kind) return
    const position=renderer.findDrop(player)
    if (!position) return
    if (kind === 'rag') { droppedRag.value={ location:location.value, ...position }; ragTaken.value=false }
    else droppedItems.value={ ...droppedItems.value, [kind]:{ location:location.value, ...position } }
    selectedInventorySlot.value=-1; drawScene(); save()
  }
  function inspectBike() {
    if (bikeClean.value) { speak('bikeClean'); return }
    if (!bikeQuest.value) { bikeQuest.value = true; save(); speak('bikeDirty'); return }
    if (!ragTaken.value) { speak('bikeNeedRag'); return }
    if (inventory.value[selectedInventorySlot.value] !== 'rag') { speak('bikeSelectRag'); return }
    bikeClean.value = true; drawScene(); save(); speak('bikeWash')
  }
  function interactables() {
    if (questState.value === 'tail') return []
    if (location.value === 'mansion') return [
      { x: 35, y: 224, label: carriedChair ? 'ВЫНЕСТИ КРАСНЫЙ СТУЛ' : 'ВЫЙТИ ИЗ ОСОБНЯКА', action: returnFromHeist },
      ...(!carriedChair ? [{ ...MANSION_CHAIR, label: 'ВЗЯТЬ КРАСНЫЙ СТУЛ', action: () => { carriedChair = true; drawScene(); save(); speak('heistTaken') } }] : []),
    ]
    if (questState.value === 'chairs') return chairGame?.phase === 'stop' ? SEATS.slice(0, 4-chairGame.round).map(s => ({ ...s, label: 'СЕСТЬ НА КРАСНЫЙ СТУЛ', action: sitAtChair })) : []
    if (location.value === 'home') return [
      { x: 256, y: 290, label: 'ВЫЙТИ В ДЕРЕВНЮ', action: () => transition('village', VILLAGE.home.x, VILLAGE.home.y) },
      ...(!ragTaken.value && !droppedRag.value ? [{x:407,y:258,label:'ВЗЯТЬ ТРЯПКУ',action: () => { ragTaken.value=true; selectedInventorySlot.value=inventory.value.indexOf('rag'); drawScene(); save(); speak('ragTake') }}] : []),
      { x: 58, y: 87, label: stage.value === 3 ? 'ИСПОЛЬЗОВАТЬ ШЕПОТОК' : 'ОСМОТРЕТЬ КРОВАТЬ', action: () => stage.value === 3 && witchAngry.value ? speak('healingRevoked') : stage.value === 3 ? speak('finish', () => finishEnding('healed')) : speak('bed') },
      ...(stage.value === 2 && !droppedItems.value.treasure ? [{ x: 148, y: 241, label: 'ИСПОЛЬЗОВАТЬ ВОДНИК', action: () => speak('waterpipe', triggerCurse) }] : []),
      ...[
        [469, 78, 'ОСМОТРЕТЬ ХОЛОДИЛЬНИК', 'homeFridge'],
        [342, 120, 'ОСМОТРЕТЬ СТУЛ', 'homeChair'], [445, 120, 'ОСМОТРЕТЬ СТУЛ', 'homeChair'],
        [440, 234, 'ОСМОТРЕТЬ УНИТАЗ', 'homeToilet'], [355, 204, 'ОСМОТРЕТЬ ВАННУ', 'homeBath'],
        [450, 199, 'ОСМОТРЕТЬ РАКОВИНУ', 'homeSink'], [382, 70, 'ОСМОТРЕТЬ КУХНЮ', 'homeKitchen'],
        [394, 126, 'ОСМОТРЕТЬ СТОЛ', 'homeTable'], [72, 201, 'ОСМОТРЕТЬ ДИВАН', 'homeSofa'],
        [74, 258, 'ОСМОТРЕТЬ ТЕЛЕВИЗОР', 'homeTelevision'],
        [160, 70, 'ОСМОТРЕТЬ ШКАФ', 'homeWardrobe'], [174, 204, 'ОСМОТРЕТЬ РАСТЕНИЕ', 'homePlant'],
        [351, 258, 'ОСМОТРЕТЬ ПОЛОТЕНЦЕ', 'homeTowels'],
      ].map(([x, y, label, id]) => ({ x, y, label, action: () => speak(id) })),

    ]
    if (location.value === 'hut') return [
      { x: 75, y: 179, label: 'ВЫЙТИ ИЗ ДОМА', action: () => transition('village', VILLAGE.hut.x, VILLAGE.hut.y) },
      { x: 238, y: 78, label: 'ПОГОВОРИТЬ С ГАДАЛКОЙ', action: () => {
        if (witchAngry.value) speak('witchAngry')
        else if (shovel.value && shovelUsed.value && stage.value === 1 && stashState.value === 'buried') speak('replacementShovel', () => { shovelUsed.value = false; save() })
        else if (stashState.value === 'witch' && stage.value < 2) speak(stage.value === 0 ? 'witchRecoveredEarly' : 'witchRecovered', () => { stashState.value = 'returned'; stage.value = 3 })
        else if (stage.value === 0) speak('witch', () => { stage.value = 1; shovelPermission.value = true })
        else if (stage.value === 1) speak('witch')
        else if (stage.value === 2 && droppedItems.value.treasure) speak('treasureMissing')
        else if (stage.value === 2) speak('reward', () => { stage.value = 3; stashState.value = 'returned' })
        else speak('reward')
      } },
      ...(!shovel.value ? [{ x: 27, y: 69, label: 'ВЗЯТЬ ЛОПАТУ', action: () => {
        if (!shovelPermission.value) {
          shovel.value = true; shovelUsed.value = false; witchAngry.value = true
          if (stage.value === 0 && note.value) stage.value = 1
          unlockAchievement('thief'); drawScene(); save(); speak(stage.value === 3 ? 'shovelStolenWithSpell' : 'shovelStolen')
        } else speak('shovel', () => { shovel.value = true; shovelUsed.value = false; drawScene() })
      } }] : []),
      ...(!note.value ? [{ x: 281, y: 69, label: 'ВЗЯТЬ ФОТОГРАФИЮ', action: () => speak('note', () => { note.value = true; if (witchAngry.value && stage.value === 0) stage.value = 1; drawScene() }) }] : []),
    ]
    if (location.value === 'river') return [
      { ...RIVER_ENTRY,label:'ВЕРНУТЬСЯ В ЛЕС',action:()=>transition('forest',RIVER_PATH_ENTRY.x,RIVER_PATH_ENTRY.y-20) },
      { ...RIVER_FISHER,label:'ПОГОВОРИТЬ С РЫБАКОМ',action:()=>speak('fisherman') },
      ...(!rodTaken.value ? [{...RIVER_ROD,label:'ВЗЯТЬ УДОЧКУ',action:()=>{rodTaken.value=true;drawScene();save();speak('rodTake')}}] : []),
    ]
    if (location.value === 'forest') return [
      ...(!trip.value && questState.value !== 'tail' ? [{...RIVER_PATH_ENTRY,label:'ПЕРЕЙТИ К РЕКЕ',action:()=>transition('river',RIVER_ENTRY.x,RIVER_ENTRY.y+12)}] : []),
      { x: 18, y: 224, label: 'ВЫЙТИ ИЗ ЛЕСА', action: () => trip.value ? speak('freedom', () => finishEnding('freedom')) : transition('village', VILLAGE.forest.x-10, VILLAGE.forest.y) },
      { ...FOREST_SIGN, label: 'ПРОЧИТАТЬ УКАЗАТЕЛЬ', action: () => speak('forestSign') },
      ...(questState.value === 'tail_ready' ? [{ x: FOREST_EAST.x-30, y: FOREST_EAST.y, label: 'НАЧАТЬ СЛЕЖКУ ЗА БАБКОЙ', action: startTail }] : []),
      ...(!mushroomUsed.value ? FOREST_MUSHROOMS.map(({x,y}) => ({ x:x+8, y:y+8, label:'СЪЕСТЬ МУХОМОР', action: () => speak('mushroom', () => { mushroomUsed.value = true; trip.value = true; unlockAchievement('trip'); drawScene() }) })) : []),
      { x:CAMP.x, y:CAMP.y, label:'ОСМОТРЕТЬ БУТЫЛКУ', action: () => { unlockAchievement('flashback'); speak('flashback') } },
      ...((trip.value || wolfDefeated.value) ? [{ x: FOREST_EAST.x, y: FOREST_EAST.y, label: wolfDefeated.value ? 'ПРОЙТИ В ПОСЕЛЕНИЕ' : 'СТРАННЫЙ ВЫХОД', action: encounterWolf }] : []),
    ]
    if (location.value === 'society') return [
      { x: 160, y: 169, label: 'ВЕРНУТЬСЯ В ЛЕС', action: () => transition('forest', FOREST_EAST.x-30, FOREST_EAST.y) },
      { x: 160, y: 102, label: 'ПОГОВОРИТЬ С КАПИТАНОМ КУКОМ', action: captain },
      ...(societyProgress.value === 3 ? [{ x: 232, y: 138, label: 'ОСМОТРЕТЬ СВОЙ КРАСНЫЙ СТУЛ', action: () => speak('redChair') }] : []),
    ]
    return [
      { ...VILLAGE.bike, label: !bikeClean.value && bikeQuest.value && ragTaken.value && inventory.value[selectedInventorySlot.value] === 'rag' ? 'ОТМЫТЬ ПИТБАЙК' : 'ОСМОТРЕТЬ ПИТБАЙК', action: inspectBike },
      { ...VILLAGE.home, label: 'ВОЙТИ ДОМОЙ', action: () => transition('home', 256, 274) },
      { ...VILLAGE.hut, label: 'ВОЙТИ В ДОМ', action: () => transition('hut', 75, 169) },
      { ...VILLAGE.sign, label: 'ПРОЧИТАТЬ ТАБЛИЧКУ', action: () => speak('sign') },
      { ...VILLAGE.neighbor, label: 'ПОГОВОРИТЬ С КУКОЛДОМ', action: () => questState.value !== 'done' ? speak('silentNeighbor') : wellQuizPassed.value ? speak('quizPassed') : speak('quizIntro', startQuiz) },
      { x: VILLAGE.well.x, y: VILLAGE.well.y + 16, label: 'ОСМОТРЕТЬ КОЛОДЕЦ', action: () => speak('well', () => { choice.value = true; choiceIndex.value = 0; keys.clear() }) },
      { ...VILLAGE.mansion, label: questState.value === 'heist_ready' ? 'ВОЙТИ В ОСОБНЯК' : 'ОСМОТРЕТЬ ОСОБНЯК', action: () => questState.value === 'heist_ready' ? startHeist() : speak('mansionLocked') },
      { ...VILLAGE.forest, label: 'ОТПРАВИТЬСЯ В ЛЕС', action: () => transition('forest', 40, 224) },
      ...OTHER_DOORS.map(door => ({ ...door, label:'ОСМОТРЕТЬ ДОМ', action: () => speak('villageHouse') })),
    ]
  }
  function closest() { const dropped = droppedRag.value?.location === location.value ? [{ ...droppedRag.value, label:'ПОДНЯТЬ ТРЯПКУ', action: () => { droppedRag.value = null; ragTaken.value = true; selectedInventorySlot.value = inventory.value.indexOf('rag'); drawScene(); save() } }] : []; for (const [kind, point] of Object.entries(droppedItems.value)) if (point.location === location.value) dropped.push({ ...point, label: ({shovel:'ПОДНЯТЬ ЛОПАТУ',photo:'ПОДНЯТЬ ФОТОГРАФИЮ',treasure:'ПОДНЯТЬ КЛАД',rod:'ПОДНЯТЬ УДОЧКУ'})[kind], action: () => { const next={...droppedItems.value}; delete next[kind]; droppedItems.value=next; selectedInventorySlot.value=inventory.value.indexOf(kind); drawScene(); save() } }); return [...dropped, ...interactables()].map(o => ({ ...o, d: Math.hypot(player.x - o.x, player.y - o.y) })).filter(o => o.d < 25).sort((a, b) => a.d - b.d)[0] }
  function interact() {
    if (screen.value !== 'game' || choice.value || quiz.value || photoOpen.value || fishing.value) return
    if (dialog.value) { nextDialog(); return }
    const item=closest()
    if (item) { audio.beep(470); item.action() }
  }
  function useItem() {
    if (screen.value !== 'game' || dialog.value || choice.value || quiz.value || photoOpen.value) return
    const item=inventory.value[selectedInventorySlot.value]
    if (item === 'photo') togglePhoto()
    else if (item === 'shovel') dig()
    else if (item === 'rag') speak('ragUse')
    else if (item === 'treasure') speak('treasureUse')
    else if (item === 'rod') castRod()
  }
  function dig() {
    if (screen.value !== 'game' || dialog.value || choice.value || questState.value === 'tail' || location.value !== 'forest' || inventory.value[selectedInventorySlot.value] !== 'shovel' || !shovel.value || shovelUsed.value) return
    audio.beep(150, .12); breakShovel()
    if (stage.value < 2 && stashState.value === 'witch') { speak('stashMissing', null, true); return }
    if (stage.value === 1 && Math.hypot(player.x-stashAt(stashIndex.value).x, player.y-stashAt(stashIndex.value).y) < 12)
      speak('stash', () => { stage.value = 2; stashState.value = 'player'; drawScene() }, true)
    else if (stage.value === 1 && note.value) {
      if (shovelPermission.value) { wrongDigs.value = Math.min(5, wrongDigs.value + 1); if (wrongDigs.value === 5) unlockAchievement('missed_digs') }
      dialog.value = { lines: [['ТИГРАН', 'Здесь пусто. Надо ещё раз свериться с фотографией.'], brokenLine], index: 0 }; keys.clear()
    } else speak('empty', null, true)
  }
  function onKey(event) {
    const k = event.key.toLowerCase(), direction = directionFromEvent(event)
    if (direction || [' ', 'enter', 'e', 'у', 'q', 'й'].includes(k)) event.preventDefault()
    if (screen.value === 'battle-ready') { if (!event.repeat && ['enter', ' ', 'e', 'у'].includes(k)) startBattle(); return }
    if (screen.value === 'battle') { if (direction && !event.repeat) battle.attempt(direction); return }
    if (screen.value === 'slots') { if (k === 'escape') closeSlots(); return }
    if (screen.value === 'gallery' || screen.value === 'achievements') { if (k === 'escape') screen.value = 'title'; return }
    if (fishing.value) {
      if ((event.code==='KeyR' || ['r','к'].includes(k)) && !event.repeat) retrieveRod()
      else if (event.code==='Space' && !event.repeat) fishingPress(true)
      return
    }
    if (photoOpen.value) { if (!event.repeat && ['q','й','escape'].includes(k)) photoOpen.value = false; return }
    if (quiz.value) {
      if (event.repeat) return
      if (direction === 'up' || direction === 'down') quizSelected.value = (quizSelected.value + (direction === 'up' ? -1 : 1) + quizQuestion.value.options.length) % quizQuestion.value.options.length
      else if (['enter',' ','e','у'].includes(k)) answerQuiz(quizSelected.value)
      else if (/^[1-4]$/.test(k)) answerQuiz(Number(k)-1)
      return
    }
    if (choice.value) {
      if (['up', 'down'].includes(direction)) choiceIndex.value = (choiceIndex.value + (direction === 'up' ? -1 : 1) + (inventory.value.includes('rod') ? 3 : 2)) % (inventory.value.includes('rod') ? 3 : 2)
      else if (['enter', ' ', 'e', 'у'].includes(k) && !event.repeat) chooseWell(choiceIndex.value === 0 ? true : choiceIndex.value === 1 ? false : 'fish')
      else if (k === 'escape') chooseWell(false)
      return
    }
    if (screen.value === 'game' && !dialog.value && /^[1-6]$/.test(k) && !event.repeat) { selectInventorySlot(Number(k)-1); return }
    if ((event.code === 'KeyQ' || ['q','й'].includes(k)) && !event.repeat) { useItem(); return }
    if ((event.code === 'KeyR' || ['r','к'].includes(k)) && !event.repeat) { dropItem(); return }
    if (event.repeat && ['e', 'у', 'enter', ' '].includes(k)) return
    if (['e', 'у', 'enter', ' '].includes(k)) { if (screen.value === 'title') start(false); else if (screen.value === 'ending') screen.value = 'title'; else interact(); return }
    keys.add(k)
  }
  function onUp(event) { keys.delete(event.key.toLowerCase()); if (event.code==='Space') fishingPress(false) }
  function onMouseDown(event) { if (event.button===0 && fishing.value && !event.target.closest('button')) { event.preventDefault(); fishingPress(true) } }
  function onMouseUp(event) { if (event.button===0) fishingPress(false) }
  function updateQuest(delta) {
    const actors = []
    if (questState.value === 'tail' && tail && location.value === 'forest') {
      const hidden = behindTree(player), turning = tail.elapsed % 7500 > 5600
      questStatus.value = turning ? (hidden ? 'БАБКА ОБЕРНУЛАСЬ — ТЫ ЗА ДЕРЕВОМ' : 'БАБКА ОБЕРНУЛАСЬ! ДЕРЖИСЬ ПОДАЛЬШЕ ИЛИ СПРЯЧЬСЯ') : tail.digging && !tail.dug ? (tail.mode === 'empty' ? 'БАБКА ПРОВЕРЯЕТ ПУСТОЙ ТАЙНИК' : 'БАБКА ВЫКАПЫВАЕТ КЛАД. НЕ ТЕРЯЙ ЕЁ ИЗ ВИДУ') : tail.dug ? (tail.mode === 'empty' ? 'БАБКА ВОЗВРАЩАЕТСЯ ДОМОЙ' : 'БАБКА НЕСЁТ КЛАД ДОМОЙ. ИДИ ЗА НЕЙ') : 'ИДИ ЗА БАБКОЙ И НЕ ТЕРЯЙ ЕЁ ИЗ ВИДУ'
      const hadDug = tail.dug
      const result = updateTail(tail, delta, player, hidden)
      if (!hadDug && tail.dug && tail.mode === 'buried') { stashState.value = 'witch'; save() }
      if (result === 'seen' || result === 'lost') {
        tail = null; questState.value = 'tail_ready'; player.x = FOREST_EAST.x-30; player.y = FOREST_EAST.y; drawScene(); save(); speak(result === 'seen' ? 'tailSeen' : 'tailLost'); return
      }
      if (result === 'success') {
        const story = tail.mode === 'empty' ? 'missionOneEmpty' : 'missionOneDone'
        tail = null; questState.value = 'report1'; societyProgress.value = 1; drawScene(); save(); speak(story); return
      }
      actors.push({ id:'witch', x:tail.x, y:tail.y, col:0 })
      if (tail.digging && !tail.dug && tail.mode === 'buried') actors.push({ id:'treasure', kind:'treasure', x:stashAt(stashIndex.value).x, y:stashAt(stashIndex.value).y })
    } else if (questState.value === 'heist' && location.value === 'mansion') {
      advanceMansionPatrol(patrol, delta, renderer.movePoint)
      const witch = patrol, hidden = inShadow(player)
      questStatus.value = `${carriedChair ? 'СТУЛ У ТЕБЯ — ВЕРНИСЬ К ВХОДУ' : 'НАЙДИ КРАСНЫЙ СТУЛ В ДАЛЬНЕЙ ЧАСТИ ОСОБНЯКА'} · ${hidden ? 'ТЫ В ТЕНИ' : 'ТЫ НА СВЕТУ'}`
      if (!hidden && Math.hypot(player.x-witch.x, player.y-witch.y) < 60 && renderer.canSee(witch, player)) {
        carriedChair = false; patrol = createMansionPatrol(); player.x = MANSION_ENTRY.x; player.y = MANSION_ENTRY.y; drawScene(); save(); speak('heistCaught'); return
      }
      actors.push({ id:'witch', ...witch, col:0 })
      if (!carriedChair) actors.push({ id:'red-chair', kind:'chair', x:MANSION_CHAIR.x, y:MANSION_CHAIR.y-8 })
    } else if (questState.value === 'chairs' && chairGame && location.value === 'society') {
      const count = 4-chairGame.round
      const result = advanceChairs(chairGame, delta)
      if (result === 'stopped') {
        syncMusic()
        chairStarts = Array.from({ length:count }, (_, i) => { const a=chairGame.angle+(i+1)*Math.PI*2/(count+1); return { x:160+56*Math.cos(a), y:116+32*Math.sin(a) } })
      }
      if (result === 'failed') {
        chairGame = null; questState.value = 'report2'; player.x=160; player.y=151; unlockAchievement('chairs_loss'); drawScene(); save(); speak('chairsFailed'); return
      }
      questStatus.value = chairGame.phase === 'music' ? `КРУГ ${chairGame.round} / 3: ХОДИ ВОКРУГ СТУЛЬЕВ. ЖДИ ОСТАНОВКИ МУЗЫКИ` : `КРУГ ${chairGame.round} / 3: СКОРЕЕ К СТУЛУ И НАЖМИ E!`
      for (const [i, seat] of SEATS.slice(0,count).entries()) actors.push({ id:`seat${i}`, kind:'chair', ...seat })
      for (let i=0;i<count;i++) {
        const a=chairGame.angle+(i+1)*Math.PI*2/(count+1), start=chairGame.phase === 'stop' ? chairStarts[i] : { x:160+56*Math.cos(a), y:116+32*Math.sin(a) }, seat=SEATS[i], t=chairGame.phase === 'stop' ? Math.min(1,chairGame.elapsed/3000) : 0
        actors.push({ id:`npc${i}`, x:start.x+(seat.x-start.x)*t, y:start.y+(seat.y-start.y)*t, col:2+i })
      }
    }
    if (fishing.value) {
      const f=fishing.value, point=f.kind==='well' ? {x:VILLAGE.well.x,y:VILLAGE.well.y+3} : {x:player.x+6,y:278}
      actors.push({id:'bobber',kind:'bobber',...point,fromX:player.x,fromY:player.y,biting:f.phase==='bite',time:f.elapsed})
    }
    if (droppedRag.value?.location === location.value) actors.push({ id:'dropped-rag', kind:'rag', ...droppedRag.value })
    for (const [kind, point] of Object.entries(droppedItems.value)) if (point.location === location.value) actors.push({ id:`dropped-${kind}`, kind:`dropped-${kind}`, ...point })
    renderer.setFishingPose(!!fishing.value)
    renderer.setActors(actors)
  }
  function update(ticker) {
    if (screen.value === 'battle') { battle.update(ticker.deltaMS); return }
    if (screen.value === 'diving' && renderer) {
      diveElapsed += ticker.deltaMS
      const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 150 : 900, t = Math.min(1, diveElapsed / duration)
      renderer.dive(diveStart, t)
      if (t >= 1) { screen.value = 'game'; unlockAchievement('diver'); audio.beep(150, .1); speak(diveCause === 'thrown' ? 'diverThrown' : 'diver', () => finishEnding('diver')) }
      return
    }
    if (screen.value === 'game' && quiz.value) {
      quiz.value.remaining = Math.max(0, quiz.value.remaining - Math.min(ticker.deltaMS, 50))
      const second = Math.ceil(quiz.value.remaining / 1000)
      if (second !== lastQuizSecond && second > 0) { lastQuizSecond = second; save() }
      if (quiz.value.remaining <= 0) failQuiz()
      return
    }
    if (screen.value !== 'game' || dialog.value || choice.value || photoOpen.value || !renderer) return
    if (fishing.value) {
      const outcome=updateFishing(fishing.value,ticker.deltaMS)
      if (outcome==='well-fall') { fishing.value=null; speak('wellFishingScold',()=>beginDive('thrown')) }
      else if (outcome==='caught' || outcome==='escaped' || outcome==='missed') {
        fishing.value=null; speak(outcome==='caught'?'fishCaught':outcome==='missed'?'fishMissed':'fishEscaped')
      }
      updateQuest(ticker.deltaMS); return
    }
    const left = keys.has('a') || keys.has('ф') || keys.has('arrowleft'), right = keys.has('d') || keys.has('в') || keys.has('arrowright'), up = keys.has('w') || keys.has('ц') || keys.has('arrowup'), down = keys.has('s') || keys.has('ы') || keys.has('arrowdown')
    let dx = Number(right) - Number(left), dy = Number(down) - Number(up); const length = Math.hypot(dx, dy) || 1, speed = Math.min(ticker.deltaTime, 2) * 1.05
    dx = dx / length * speed; dy = dy / length * speed; elapsed += ticker.deltaTime; renderer.move(player, dx, dy, elapsed, left)
    const cellX = Math.floor(player.x / 16) + 1, cellY = Math.floor(player.y / 16) + 1
    if (coords.value.x !== cellX || coords.value.y !== cellY) coords.value = { x: cellX, y: cellY }
    updateQuest(ticker.deltaMS)
    near.value = closest()?.label || ''
  }
  function press(key) { keys.add(key) }
  function release(key) { keys.delete(key) }
  function togglePhoto() { if (note.value && !dialog.value && !choice.value && !quiz.value && (photoOpen.value || inventory.value[selectedInventorySlot.value] === 'photo')) { keys.clear(); photoOpen.value = !photoOpen.value } }
  const onBlur = () => { keys.clear(); fishingPress(false) }
  onMounted(async () => {
    window.addEventListener('mousedown', onMouseDown); window.addEventListener('mouseup', onMouseUp); window.addEventListener('pointerdown', audio.unlockMusic); window.addEventListener('keydown', audio.unlockMusic); syncMusic()
    const created = await createWorld(canvasHost.value, update)
    if (disposed) { created.destroy(); return }
    renderer = created; drawScene()
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onUp); window.addEventListener('blur', onBlur)
  })
  onUnmounted(() => {
    disposed = true; clearTimeout(curseTimer); clearTimeout(achievementTimer); battle.stop(); audio.destroy(); renderer?.destroy()
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur)
    window.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('pointerdown', audio.unlockMusic); window.removeEventListener('keydown', audio.unlockMusic)
  })
  return { canvasHost, screen, location, dialog, near, sound, shovel, shovelUsed, note, inventory, selectedInventorySlot, selectInventorySlot, bikeHint, fishing, fishingPress, retrieveRod, photo, photoOpen, togglePhoto, useItem, trip, endingKind, coords, choice, choiceIndex, questHint, endings, unlocked, achievements, achievementUnlocked, achievementToast, quiz, quizQuestion, quizSelected, quizSeconds, quizQuestions, answerQuiz, battle, slots, slotMode, slotNotice, slotFromGame, questState, openSlots, closeSlots, selectSlot, start, openMenu, interact, nextDialog, dig, chooseWell, press, release, startBattle }
}
