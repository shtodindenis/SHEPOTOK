import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { createUrgency, validUrgency, advanceUrgency, resolveUrgencyCheck } from './urgency.js'
import { resolveDig } from './digging.js'
import { DETENTION_ENTRY, DETENTION_TAP, DETENTION_SHOVEL, DETENTION_EVIDENCE, DETENTION_EXIT, DETENTION_HIDING } from './detention.js'
import { startDetention, validDetention, openCell, findDetentionShovel, chooseEvidence, canLeaveDetention } from './detentionState.js'
import { eusebiusQuestions } from './eusebiusQuiz.js'
import { startArthouse, validArthouse, requiredMushrooms, capacityForDay, eatArthouseMushroom, sleepArthouse } from './arthouse.js'
import { startFishing, updateFishing, hookFish } from './fishing.js'
import { RIVER_ENTRY, RIVER_ROD, RIVER_FISHER, canFishAtRiver } from './river.js'
import { reconcileInventory } from './inventory.js'
import { createAudio } from './audio.js'
import { STAMINA_MAX, SPRINT_MULTIPLIER, updateStamina } from './stamina.js'
import { getBikeHint, getQuestHint } from './hints.js'
import { createSkillCheck, directionFromEvent } from './skillCheck.js'
import { readAchievements, readEndings, readSave, readSlots, writeAchievements, writeEndings, writeSave, writeSlot, writeEpisodeResult, writeEndingCause } from './storage.js'
import { conversations, endings } from './story.js'
import { achievements } from './achievements.js'
import { QUIZ_TIME_MS, quizQuestions, quizResult, validQuiz } from './wellQuiz.js'
import { VILLAGE, OTHER_DOORS, MAYO_POINTS } from './village.js'
import { createWorld } from './world.js'
import { behindTree, STASH_SPOTS, stashAt, CAMP, FOREST_EAST, FOREST_MUSHROOMS, RIVER_PATH_ENTRY, FOREST_SIGN } from './forestMap.js'
import { SOCIETY_ENTRY, CAPTAIN, SETTLEMENT_FOREST, SETTLEMENT_HOUSE } from './societyLocation.js'
import { QUEST_STATES, SEATS, CHAIR_CENTER, CHAIR_RADIUS, advanceChairs, advanceEscort, createChairs, createTail, sitDown, updateTail } from './societyQuest.js'
import { MANSION_ENTRY, MANSION_ROD, MANSION_CHAIR, MANSION_STAIRS, MANSION_HIDING, FLOOR_HEIGHT, createMansionPatrol, advanceMansionPatrol } from './mansionLayout.js'

export function useGame() {
  const canvasHost = ref(null), screen = ref('title'), location = ref('home'), stage = ref(0)
  const dialog = ref(null), near = ref(''), sound = ref(true), shovel = ref(false), shovelUsed = ref(false)
  const note = ref(false), trip = ref(false), mushroomUsed = ref(false), wolfDefeated = ref(false), endingKind = ref('healed')
  const stashIndex = ref(0)
  const societyProgress = ref(0), questState = ref('none'), questStatus = ref('')
  const stashState = ref('buried'), slots = ref(readSlots()), slotMode = ref('load'), slotNotice = ref(''), slotFromGame = ref(false)
  const shovelPermission = ref(false), witchAngry = ref(false), wrongDigs = ref(0), wellQuizPassed = ref(false), pendingDiver = ref('')
  const urgency = ref(null), stamina = ref(STAMINA_MAX)
  const detention = ref(null), detentionChoice = ref(false)
  const detentionNotice = ref('')
  const eusebiusQuiz = ref(null), eusebiusQuestion = computed(() => eusebiusQuiz.value === null ? null : eusebiusQuestions[eusebiusQuiz.value])
  const arthouse = ref(null), firstMushroom = ref(0)
  const collection = ref(null)
  const caughtFish = ref(null)
  const riverRodGone = ref(false), mansionRodTaken = ref(false), mansionRodOwned = ref(false), cursedOnce = ref(false)
  const witchMurder = ref(null)
  const witchAngryReason = ref(null), photoConfiscated = ref(false), ragConfiscated = ref(false)
  const witchMushroomsArrested = ref(false)
  const pendingFatal = ref(null)
  let detentionHidden = null
  let staminaExhausted = false
  const quiz = ref(null), quizSelected = ref(0), achievementUnlocked = ref(readAchievements()), achievementToast = ref(null)
  const photoOpen = ref(false), photo = ref('')
  const ragTaken = ref(false), bikeQuest = ref(false), bikeClean = ref(false), selectedInventorySlot = ref(-1)
  const droppedRag = ref(null), droppedItems = ref({}), rodTaken = ref(false), fishing = ref(null)
  const inventory = ref(Array(6).fill(null))
  const ownedItems = computed(() => [ragTaken.value ? 'rag' : null, shovel.value && !shovelUsed.value && !droppedItems.value.shovel ? 'shovel' : null, note.value && !droppedItems.value.photo ? 'photo' : null, stashState.value === 'player' && !droppedItems.value.treasure ? 'treasure' : null, rodTaken.value && !droppedItems.value.rod ? 'rod' : null, mansionRodOwned.value && !droppedItems.value.mansionRod ? 'mansionRod' : null, collection.value?.basket ? 'basket' : null, collection.value?.bucket ? 'bucket' : null].filter(Boolean))
  const hasFishingRod = computed(() => inventory.value.includes('rod') || inventory.value.includes('mansionRod'))
  const canSearchMansionForRod = computed(() => questState.value === 'rejected' && collection.value?.giver === 'captain' && !hasFishingRod.value && ((riverRodGone.value && !mansionRodTaken.value) || droppedItems.value.rod?.location === 'mansion' || droppedItems.value.mansionRod?.location === 'mansion'))
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
  let renderer, curseTimer, achievementTimer, arthouseWalkTimer, evidenceTimer, elapsed = 0, diveElapsed = 0, diveStart = { x: 0, y: 0 }, diveCause = 'jump', lastQuizSecond = 0, disposed = false
  let tail = null, escort = null, patrol = null, carriedChair = false, chairGame = null, chairStarts = [], mansionHidden = null, mansionChair = { ...MANSION_CHAIR }
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
  const questHint = computed(() => {
    if (arthouse.value) return `ДЕНЬ ${arthouse.value.day} · ЭЙФОРИЯ ${arthouse.value.eaten}/${capacityForDay(arthouse.value.day)} · ДНЕВНАЯ НОРМА ${requiredMushrooms(arthouse.value.day)} · В ЛЕСУ ОСТАЛОСЬ ${16-arthouse.value.consumed.length}`
    if (location.value === 'detention' && detention.value) {
      const task=!detention.value.cellOpen ? 'ОСМОТРИ КАМЕРУ И НАЙДИ СПОСОБ ОТКРЫТЬ ДВЕРЬ' : detention.value.hiddenIndex != null ? 'ТЫ В УКРЫТИИ · E — ВЫЙТИ' : detention.value.alarm ? 'ТРЕВОГА! ИЗБЕГАЙ ОХРАНЫ И ДОБЕРИСЬ ДО ВЫХОДА' : detention.value.cause === 'mushrooms' ? 'НАЙДИ ВЫХОД И ИЗБЕГАЙ ОХРАНЫ' : detention.value.choice ? 'ДОБЕРИСЬ ДО ВЫХОДА, ИЗБЕГАЯ ОХРАНЫ' : 'НАЙДИ ЛОПАТУ И ВЕЩДОКИ · ПРЯЧЬСЯ ОТ ОХРАНЫ'
      return detentionNotice.value && detention.value.cellOpen && !detention.value.alarm ? `${task} · ${detentionNotice.value}` : task
    }
    if (collection.value && !collection.value.completed && ['rejected','report1','report2','heist_ready','none'].includes(questState.value)) {
      const c=collection.value, items=`МУХОМОРЫ ${c.collected.length}/5${c.giver === 'captain' ? ` · КАРАСИ ${c.crucians}/3` : ''}`
      return !c.basket ? `${items} · ВОЗЬМИ КОРЗИНКУ ДОМА` : c.collected.length >= 5 && (c.giver === 'witch' || c.crucians >= 3) ? `${items} · ВЕРНИСЬ К ${c.giver === 'witch' ? 'ГАДАЛКЕ' : 'КАПИТАНУ КУКУ'}` : items
    }
    if (questState.value === 'rejected') return 'ОБЩЕСТВО НЕ ПРИНЯЛО ТЕБЯ. ПОГОВОРИ С КАПИТАНОМ КУКОМ О ПОМОЩИ'
    return getQuestHint({ questState:questState.value, questStatus:questStatus.value, location:location.value, witchAngry:witchAngry.value, witchAngryReason:witchAngryReason.value, stashState:stashState.value, stage:stage.value, shovel:shovel.value, shovelUsed:shovelUsed.value, note:note.value })
  })

  const battle = createSkillCheck(
    () => { screen.value = 'game'; audio.beep(520, .12); speak('wolfVictory', () => { trip.value = false; wolfDefeated.value = true; breakShovel(); transition('society_village', SETTLEMENT_FOREST.x + 20, SETTLEMENT_FOREST.y) }, true) },
    () => { unlockAchievement('wolf_loss'); screen.value = 'game'; audio.beep(110, .2); fatal('wolf','wolfFail','wolf') },
  )

  function snapshot() { return { location: location.value, detention: detention.value, arthouse:arthouse.value, collection:collection.value, witchMurder:witchMurder.value, photoConfiscated:photoConfiscated.value, mansionRodTaken:mansionRodTaken.value, firstMushroom:firstMushroom.value, stage: stage.value, stashIndex: stashIndex.value, note: note.value, shovel: shovel.value, trip: trip.value, mushroomUsed: mushroomUsed.value, rodTaken: riverRodGone.value, wolfDefeated: wolfDefeated.value, societyProgress: societyProgress.value, questState: questState.value, carriedChair, ragTaken: ragTaken.value || !!droppedRag.value || ragConfiscated.value, bikeClean: bikeClean.value } }
  function drawScene() {
    if (!renderer) return
    if (note.value && !photo.value && location.value !== 'forest') {
      renderer.draw({ ...snapshot(), location:'forest', trip:false }, { ...player })
      photo.value = renderer.forestPhoto()
    }
    renderer.draw(snapshot(), player)
    if (location.value === 'detention' && detentionHidden) renderer.setActorVisible(false)
    if (location.value === 'forest') photo.value = renderer.forestPhoto()
    near.value = ''
  }
  function saveData() { return { rulesVersion:2, pendingFatal:pendingFatal.value, witchMushroomsArrested:witchMushroomsArrested.value, witchAngryReason:witchAngryReason.value, photoConfiscated:photoConfiscated.value, ragConfiscated:ragConfiscated.value, witchMurder:witchMurder.value, stage: stage.value, location: location.value, detention: detention.value ? { ...detention.value } : null, arthouse:arthouse.value ? { ...arthouse.value } : null, collection:collection.value ? { ...collection.value } : null, riverRodGone:riverRodGone.value, mansionRodTaken:mansionRodTaken.value, mansionRodOwned:mansionRodOwned.value, cursedOnce:cursedOnce.value, firstMushroom:firstMushroom.value, shovel: shovel.value, shovelUsed: shovelUsed.value, shovelPermission: shovelPermission.value, witchAngry: witchAngry.value, wrongDigs: wrongDigs.value, wellQuizPassed: wellQuizPassed.value, pendingDiver: pendingDiver.value, quiz: quiz.value ? { ...quiz.value } : null, note: note.value, trip: trip.value, mushroomUsed: mushroomUsed.value, wolfDefeated: wolfDefeated.value, inventorySlots: inventory.value, rodTaken: rodTaken.value, societyProgress: societyProgress.value, questState: questState.value, stashState: stashState.value, stashIndex: stashIndex.value, forestVersion: 5, homeVersion: 1, hutVersion: 2, villageVersion: 1, societyVersion: 1, urgency: urgency.value, escort: escort ? { ...escort } : null, ragTaken: ragTaken.value, droppedRag: droppedRag.value, droppedItems: droppedItems.value, bikeQuest: bikeQuest.value, bikeClean: bikeClean.value, selectedInventorySlot: selectedInventorySlot.value, player: { x: player.x, y: player.y } } }
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
  function finishEnding(id) {
    if (id === 'healed' || id === 'ambulance') writeEpisodeResult(societyProgress.value === 3)
    if (id === 'rupture') writeEndingCause(id,pendingFatal.value === 'secondCurse' ? 'second_curse' : 'first_curse_timeout')
    if (id === 'curse') writeEndingCause(id,'waterpipe')
    if (id === 'freedom' && arthouse.value?.death) writeEndingCause(id,arthouse.value.death)
    pendingFatal.value=null; urgency.value = null; escort = null; endingKind.value = id; stage.value = 4; trip.value = false; choice.value = false; quiz.value = null; pendingDiver.value = ''; battle.stop(); unlockEnding(id); screen.value = 'ending'; save()
  }
  function fatal(kind, conversation, ending) { pendingFatal.value=kind; keys.clear(); save(); speak(conversation, () => finishEnding(ending)) }
  function showAmbulance() { keys.clear(); screen.value='ambulance'; save() }
  function finishAmbulance() { finishEnding('ambulance') }
  function showSleep() { keys.clear(); screen.value='sleep'; save() }
  function finishSleep() { finishEnding('healed') }
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
    stamina.value=STAMINA_MAX; staminaExhausted=false
    const saved = slotSave || (restore ? readSave() : null)
    detention.value = saved && validDetention(saved.detention) ? { quizIndex:0, quizCorrect:true, quizDone:false, ...saved.detention } : null; detentionChoice.value = false; detentionNotice.value=''; detentionHidden = Number.isInteger(detention.value?.hiddenIndex) ? DETENTION_HIDING[detention.value.hiddenIndex] || null : null; eusebiusQuiz.value = null
    arthouse.value = saved && validArthouse(saved.arthouse) ? { ...saved.arthouse } : null; firstMushroom.value = Number.isInteger(saved?.firstMushroom) && saved.firstMushroom >= 0 && saved.firstMushroom < FOREST_MUSHROOMS.length ? saved.firstMushroom : 0
    caughtFish.value = null
    collection.value = saved && ['witch','captain'].includes(saved.collection?.giver) && Array.isArray(saved.collection.collected) ? { ...saved.collection, collected:[...new Set(saved.collection.collected.filter(i => Number.isInteger(i) && i >= 0 && i < FOREST_MUSHROOMS.length))].slice(0,5), fish:Array.isArray(saved.collection.fish) ? saved.collection.fish.filter(kind => ['crucian','perch','roach'].includes(kind)) : Array(Math.max(0,Math.min(3,Math.floor(Number(saved.collection.crucians)||0)))).fill('crucian'), basket:!!saved.collection.basket, bucket:!!saved.collection.bucket, arrested:!!saved.collection.arrested, crucians:Math.max(0,Number(saved.collection.crucians)||0) } : null
    riverRodGone.value = !!(saved?.riverRodGone ?? saved?.rodTaken); mansionRodTaken.value = !!saved?.mansionRodTaken; mansionRodOwned.value=!!saved?.mansionRodOwned; cursedOnce.value = !!saved?.cursedOnce
    witchMurder.value = ['inside','outside','left'].includes(saved?.witchMurder) ? saved.witchMurder : null
    witchAngryReason.value = ['theft','lost_cannabis'].includes(saved?.witchAngryReason) ? saved.witchAngryReason : null; photoConfiscated.value=!!saved?.photoConfiscated; ragConfiscated.value=!!saved?.ragConfiscated
    witchMushroomsArrested.value=!!saved?.witchMushroomsArrested || !!(saved?.collection?.giver === 'witch' && saved.collection.arrested)
    pendingFatal.value=['wolf','prison','secondCurse','waterpipe','crime'].includes(saved?.pendingFatal) ? saved.pendingFatal : null
    dialog.value = null; choice.value = false; fishing.value = null; photoOpen.value = false; photo.value = ''; quiz.value = null; pendingDiver.value = ''; urgency.value = null; escort = null; battle.stop(); endingKind.value = 'healed'; keys.clear(); tail = null; chairGame = null; carriedChair = false
    if (saved) {
      stashIndex.value = Number.isInteger(saved.stashIndex) && saved.stashIndex >= 0 && saved.stashIndex < STASH_SPOTS.length ? saved.stashIndex : 0
      stage.value = saved.stage; location.value = saved.location; player.x = saved.player.x; player.y = saved.player.y
      if (saved.location === 'village' && saved.villageVersion !== 1) {
        const target = saved.quiz ? VILLAGE.neighbor : saved.player.x >= 570 ? VILLAGE.forest : saved.player.x >= 400 ? VILLAGE.mansion : saved.player.x >= 240 ? VILLAGE.hut : saved.player.x >= 140 ? VILLAGE.well : VILLAGE.home
        player.x = target.x; player.y = target.y + (target === VILLAGE.well ? 20 : 0)
      }
      if (saved.location === 'hut' && saved.hutVersion !== 2) { player.x = 75; player.y = 169 }
      if (saved.location === 'home' && saved.homeVersion !== 1) { player.x = 256; player.y = 270 }
      droppedRag.value = saved.droppedRag && ['home','village','hut','forest','river','society','society_village','mansion'].includes(saved.droppedRag.location) && Number.isFinite(saved.droppedRag.x) && Number.isFinite(saved.droppedRag.y) ? { ...saved.droppedRag } : null
      droppedItems.value = Object.fromEntries(Object.entries(saved.droppedItems || {}).filter(([kind,p]) => ['shovel','photo','treasure','rod','mansionRod'].includes(kind) && p && ['home','village','hut','forest','river','society','society_village','mansion'].includes(p.location) && Number.isFinite(p.x) && Number.isFinite(p.y)))
      // Objects dropped in the old single-room society move to the new entrance.
      if (saved.societyVersion !== 1) {
        if (droppedRag.value?.location === 'society') droppedRag.value = { location:'society', x:SOCIETY_ENTRY.x+16, y:SOCIETY_ENTRY.y }
        for (const point of Object.values(droppedItems.value)) if (point.location === 'society') { point.x = SOCIETY_ENTRY.x+16; point.y = SOCIETY_ENTRY.y }
      }
      ragTaken.value = !!saved.ragTaken && !droppedRag.value; bikeQuest.value = !!saved.bikeQuest; bikeClean.value = !!saved.bikeClean
      selectedInventorySlot.value = Number.isInteger(saved.selectedInventorySlot) && saved.selectedInventorySlot >= 0 && saved.selectedInventorySlot < 6 ? saved.selectedInventorySlot : -1
      rodTaken.value = !!saved.rodTaken; shovel.value = !!saved.shovel; shovelUsed.value = saved.shovelUsed; note.value = !!saved.note; trip.value = !!saved.trip; wolfDefeated.value = saved.wolfDefeated; mushroomUsed.value = typeof saved.mushroomUsed === 'boolean' ? saved.mushroomUsed : trip.value || wolfDefeated.value
      societyProgress.value = Number.isInteger(saved.societyProgress) ? Math.max(0, Math.min(3, saved.societyProgress)) : 0
      shovelPermission.value = typeof saved.shovelPermission === 'boolean' ? saved.shovelPermission : saved.stage >= 1
      // In older saves a stage-zero shovel could only have been taken before asking.
      witchAngry.value = typeof saved.witchAngry === 'boolean' ? saved.witchAngry : saved.stage === 0 && shovel.value && !shovelPermission.value
      if (witchAngry.value && witchAngryReason.value !== 'lost_cannabis') { witchAngryReason.value='theft'; unlockAchievement('thief', false); if (stage.value === 0 && note.value) stage.value = 1 }
      wrongDigs.value = Number.isInteger(saved.wrongDigs) ? Math.max(0, Math.min(5, saved.wrongDigs)) : 0
      wellQuizPassed.value = !!saved.wellQuizPassed
      pendingDiver.value = ['jump','thrown'].includes(saved.pendingDiver) ? saved.pendingDiver : ''
      stashState.value = ['buried','witch','player','returned','evidence','smoked'].includes(saved.stashState) ? saved.stashState : saved.stage >= 3 ? 'returned' : saved.stage >= 2 ? 'player' : 'buried'
      if (location.value === 'detention' && !detention.value) { location.value = 'forest'; player.x = 40; player.y = 224 }
      const oldSelected = Array.isArray(saved.inventorySlots) ? saved.inventorySlots[saved.selectedInventorySlot] : ['rag','shovel','photo','treasure'][saved.selectedInventorySlot]
      inventory.value = reconcileInventory(saved.inventorySlots, ownedItems.value)
      selectedInventorySlot.value = oldSelected ? inventory.value.indexOf(oldSelected) : -1
      questState.value = QUEST_STATES.includes(saved.questState) ? saved.questState : ['none','report1','report2','done'][societyProgress.value]
      if (validUrgency(saved.urgency) && ['forest','village','home'].includes(location.value)) { urgency.value = { ...saved.urgency, check:saved.urgency.check ? { ...saved.urgency.check } : null }; cursedOnce.value=true; questState.value = 'rejected' }
      if (questState.value === 'escort_forest' && saved.escort && Number.isFinite(saved.escort.x) && Number.isFinite(saved.escort.y)) {
        const e=createTail(['buried','empty','carrying','mushrooms'].includes(saved.escort.mode) ? saved.escort.mode : 'buried', stashIndex.value)
        e.x=saved.escort.x; e.y=saved.escort.y; e.waypoint=Math.max(0,Math.min(e.route.length,Number.isInteger(saved.escort.waypoint)?saved.escort.waypoint:0)); e.dug=!!saved.escort.dug; e.digging=Math.max(0,Math.min(2600,Number(saved.escort.digging)||0)); escort=e
      } else if (questState.value === 'escort_village' && saved.escort && Number.isFinite(saved.escort.x) && Number.isFinite(saved.escort.y)) {
        escort={ x:saved.escort.x, y:saved.escort.y, waypoint:Math.max(0,Math.min(3,Number.isInteger(saved.escort.waypoint)?saved.escort.waypoint:0)) }
      } else if (['escort_forest','escort_village'].includes(questState.value)) { questState.value='tail_ready'; location.value='forest'; player.x=FOREST_EAST.x-30; player.y=FOREST_EAST.y }
      if (questState.value === 'escort_hut') questStatus.value = 'ВОЙДИ В ДОМ ГАДАЛКИ И ПОГОВОРИ С НЕЙ'
      if (questState.value === 'tail') { questState.value = 'tail_ready'; location.value = 'forest'; player.x = FOREST_EAST.x-30; player.y = FOREST_EAST.y }
      if (questState.value === 'rod_search') { questState.value = 'rejected'; location.value = 'village'; player.x = VILLAGE.mansion.x; player.y = VILLAGE.mansion.y }
      else if (questState.value === 'heist' || location.value === 'mansion') { questState.value = 'heist_ready'; location.value = 'village'; player.x = VILLAGE.mansion.x; player.y = VILLAGE.mansion.y }
      if (questState.value === 'chairs') { questState.value = 'report2'; location.value = 'society'; player.x = CAPTAIN.x; player.y = CAPTAIN.y + 22 }
      else if (saved.location === 'society' && saved.societyVersion !== 1) { player.x = SOCIETY_ENTRY.x; player.y = SOCIETY_ENTRY.y }
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
    else if (pendingFatal.value) {
      const pending={wolf:['wolfFail','wolf'],prison:['detentionCaught','prison'],secondCurse:['secondCurse','rupture'],waterpipe:['waterpipe','curse'],crime:['witchCrimeCaught','crime']}[pendingFatal.value]
      speak(pending[0],()=>finishEnding(pending[1]))
    }
    else if (arthouse.value?.phase === 'intro') speak('arthouseIntro', startArthouseWalk)
    else if (arthouse.value?.death) speak(arthouse.value.death === 'overdose' ? 'arthouseOverdose' : 'arthouseExhaustion', () => finishEnding('freedom'))
    else if (questState.value === 'escort_hut' && location.value === 'hut') escortReward()
    else if (!saved) speak('intro')
  }
  function openSlots(mode) {
    if (urgency.value) return
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
    if (urgency.value) return
    fishing.value = null
    if (questState.value === 'tail') { questState.value = 'tail_ready'; location.value = 'forest'; player.x = FOREST_EAST.x-30; player.y = FOREST_EAST.y; tail = null }
    if (questState.value === 'heist') { questState.value = 'heist_ready'; location.value = 'village'; player.x = VILLAGE.mansion.x; player.y = VILLAGE.mansion.y; carriedChair = false }
    if (questState.value === 'rod_search') { questState.value = 'rejected'; location.value = 'village'; player.x = VILLAGE.mansion.x; player.y = VILLAGE.mansion.y }
    if (questState.value === 'chairs') { questState.value = 'report2'; location.value = 'society'; player.x = CAPTAIN.x; player.y = CAPTAIN.y + 22; chairGame = null }
    save(); keys.clear(); dialog.value = null; choice.value = false; photoOpen.value = false; screen.value = 'title'
  }
  function transition(dest, x, y) {
    const origin = location.value
    if (origin === 'hut' && dest === 'village' && witchMurder.value === 'inside') witchMurder.value = 'outside'
    fishing.value = null
    location.value = dest; photoOpen.value = false; player.x = x; player.y = y; drawScene(); save(); audio.beep(200, .1)
    if (origin === 'forest' && dest === 'village' && questState.value === 'escort_forest') {
      questState.value='escort_village'; escort={ x:VILLAGE.forest.x-20, y:VILLAGE.forest.y, waypoint:0 }; save()
    }
    if (origin === 'village' && dest === 'hut' && questState.value === 'escort_hut') escortReward()
    if (origin === 'village' && dest === 'forest' && questState.value === 'escort_hut') { questState.value='rejected'; escort=null; save() }
    if (origin === 'society_village' && dest === 'forest' && questState.value === 'tail_ready') startTail()
  }
  function escortReward() { speak('witchCollect', () => { stashState.value='witch'; questState.value='rejected'; escort=null; startCollection('witch'); save() }) }
  function startCollection(giver) {
    if (collection.value) return
    collection.value = { giver, basket:false, bucket:giver === 'captain', collected:[], fish:[], crucians:0, arrested:giver === 'witch' && witchMushroomsArrested.value }
    save()
  }
  function encounterWolf() {
    if (wolfDefeated.value) { transition('society_village', SETTLEMENT_FOREST.x + 20, SETTLEMENT_FOREST.y); return }
    if (inventory.value.includes('shovel')) speak('wolfReady', () => { keys.clear(); screen.value = 'battle-ready' })
    else fatal('wolf','wolf','wolf')
  }
  function startBattle() { keys.clear(); battle.start(); screen.value = 'battle' }
  function captain() {
    if (questState.value === 'none') speak('captainFirst', () => { questState.value = 'tail_ready' })
    else if (questState.value === 'tail_ready') speak('tailReminder')
    else if (questState.value === 'report1') speak('captainSecond', () => { questState.value = 'heist_ready'; drawScene() })
    else if (questState.value === 'heist_ready') speak('heistReminder')
    else if (questState.value === 'report2') speak('captainThird', startChairs)
    else if (questState.value === 'done') speak('ambulance', showAmbulance)
    else if (questState.value === 'rejected') {
      if (collection.value?.giver === 'captain' && collection.value.collected.length >= 5 && collection.value.crucians >= 3) speak('ambulance', showAmbulance)
      else if (collection.value?.giver === 'captain') speak('captainCollect')
      else if (collection.value?.giver === 'witch') speak('alreadyWitchQuest')
      else if (inventory.value.every(Boolean) && !collection.value?.bucket) speak('inventoryFull')
      else speak('captainRejected', () => startCollection('captain'))
    }
  }
  function startTail() {
    const mode = stashState.value === 'evidence' ? 'mushrooms' : stashState.value === 'witch' ? 'carrying' : stashState.value === 'buried' ? 'buried' : 'empty'
    questState.value = 'tail'; tail = createTail(mode, stashIndex.value); player.x = FOREST_EAST.x-30; player.y = FOREST_EAST.y; drawScene(); save(); speak(mode === 'mushrooms' ? 'tailStartMushrooms' : mode === 'carrying' ? 'tailStartCarrying' : mode === 'empty' ? 'tailStartEmpty' : 'tailStart')
  }
  function startHeist() { questState.value = 'heist'; carriedChair = false; mansionHidden = null; mansionChair = { ...MANSION_CHAIR }; patrol = createMansionPatrol(); transition('mansion', MANSION_ENTRY.x, MANSION_ENTRY.y); save() }
  function startRodSearch() { questState.value='rod_search'; mansionHidden=null; patrol=createMansionPatrol(); transition('mansion',MANSION_ENTRY.x,MANSION_ENTRY.y); save() }
  function startChairs() { questState.value = 'chairs'; chairGame = createChairs(); chairStarts = []; player.x = CHAIR_CENTER.x; player.y = CHAIR_CENTER.y+43; drawScene(); syncMusic(); save() }
  function returnFromHeist() {
    if (questState.value === 'rod_search') { questState.value='rejected'; patrol=null; mansionHidden=null; transition('village',VILLAGE.mansion.x,VILLAGE.mansion.y); return }
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
    if (screen.value !== 'game' || dialog.value || choice.value || quiz.value || photoOpen.value || fishing.value || urgency.value || questState.value.startsWith('escort_') || index < 0 || index >= 6) return
    selectedInventorySlot.value = selectedInventorySlot.value === index ? -1 : index; save()
  }
  function dropItem() {
    if (fishing.value) { retrieveRod(); return }
    if (location.value === 'mansion' && carriedChair && screen.value === 'game' && !dialog.value && !choice.value && !quiz.value && !photoOpen.value) { mansionChair={x:player.x,y:player.y}; carriedChair=false; save(); return }
    if (screen.value !== 'game' || location.value === 'detention' || dialog.value || choice.value || detentionChoice.value || quiz.value || photoOpen.value || urgency.value || questState.value.startsWith('escort_') || !renderer) return
    const kind=inventory.value[selectedInventorySlot.value]
    if (!kind) return
    if (kind === 'basket' || kind === 'bucket') return
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
  function enterArthouse() {
    arthouse.value = startArthouse(firstMushroom.value)
    transition('village', VILLAGE.forest.x-10, VILLAGE.forest.y)
    speak('arthouseIntro', startArthouseWalk)
  }
  function startArthouseWalk() {
    keys.clear(); screen.value='arthouse_walk'
    const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 3200
    clearTimeout(arthouseWalkTimer)
    arthouseWalkTimer=window.setTimeout(() => { if (screen.value === 'arthouse_walk' && arthouse.value?.phase === 'intro') finishArthouseIntro() },duration)
  }
  function finishArthouseIntro() {
    arthouse.value.phase='day'; screen.value='game'; transition('home', 145, 110)
    speak('arthouseMorning', () => { drawScene(); save() })
  }
  function eatArthouse(index) {
    arthouse.value = eatArthouseMushroom(arthouse.value, index)
    if (arthouse.value.death) { save(); speak('arthouseOverdose', () => finishEnding('freedom')); return }
    drawScene(); save(); speak('arthouseEat')
  }
  function sleepArthouseDay() {
    arthouse.value = sleepArthouse(arthouse.value)
    if (arthouse.value.death) { save(); speak('arthouseExhaustion', () => finishEnding('freedom')); return }
    drawScene(); save(); speak('arthouseMorning')
  }
  function collectMushroom(index) {
    if (!collection.value?.basket || collection.value.collected.includes(index) || collection.value.collected.length >= 5) return
    collection.value.collected.push(index)
    if (collection.value.giver === 'witch' && collection.value.collected.length === 5 && !collection.value.arrested) { beginDetention('mushrooms'); return }
    drawScene(); save(); speak('mushroomCollected')
  }
  function resolveFish(keep) {
    if (!caughtFish.value) return
    if (keep && collection.value?.bucket) {
      if (!Array.isArray(collection.value.fish)) collection.value.fish=[]
      collection.value.fish.push(caughtFish.value.kind)
      if (caughtFish.value.kind === 'crucian') collection.value.crucians++
    }
    caughtFish.value = null; save(); speak(keep ? 'fishKept' : 'fishReleased')
  }
  function beginDetention(cause) {
    detention.value = startDetention(cause); detentionHidden = null
    // Only possessions on the player are confiscated; objects already dropped remain where they were.
    if (ragTaken.value) ragConfiscated.value = true
    if (note.value && !droppedItems.value.photo) photoConfiscated.value = true
    ragTaken.value = false
    if (!droppedItems.value.rod) rodTaken.value = false
    if (!droppedItems.value.mansionRod) mansionRodOwned.value = false
    if (!droppedItems.value.photo) note.value = false
    if (collection.value) { collection.value.basket = false; collection.value.bucket = false; collection.value.collected = []; collection.value.fish=[]; collection.value.crucians = 0; if (cause === 'mushrooms') { collection.value.arrested = true; witchMushroomsArrested.value = true } }
    if (!droppedItems.value.shovel) shovelUsed.value = true
    selectedInventorySlot.value = -1
    if (cause === 'cannabis') stashState.value = 'evidence'
    location.value = 'detention'; player.x = DETENTION_ENTRY.x; player.y = DETENTION_ENTRY.y
    keys.clear(); drawScene(); save(); speak(cause === 'cannabis' ? 'arrestCannabis' : 'arrestMushrooms', () => speak(cause === 'cannabis' ? 'detentionIntro' : 'detentionMushrooms'))
  }
  function chooseDetentionEvidence(value) {
    if (!detention.value) return
    const next = chooseEvidence(detention.value, value)
    if (next === detention.value) return
    detention.value = next; detentionChoice.value = false
    if (value === 'cannabis') { stashState.value = 'player'; shovel.value = true; shovelUsed.value = true }
    save(); drawScene()
    if (value === 'cannabis') {
      screen.value='evidence_scene'; keys.clear()
      const duration=window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 300 : 3200
      clearTimeout(evidenceTimer)
      evidenceTimer=window.setTimeout(() => { if (screen.value === 'evidence_scene') { screen.value='game'; drawScene(); speak('detentionCannabis') } },duration)
    } else speak('detentionLeaveShovel')
  }
  function leaveDetention() {
    if (!detention.value || !canLeaveDetention(detention.value)) { speak('detentionExitLocked'); return }
    if (detention.value.choice === 'shovel') { witchAngry.value = true; witchAngryReason.value = 'lost_cannabis'; stage.value = 1 }
    detention.value = null; detentionHidden = null; transition('forest', 40, 224)
  }
  function answerEusebius(index) {
    if (eusebiusQuiz.value === null || !detention.value || !Number.isInteger(index) || index < 0 || index > 3) return
    const current = eusebiusQuiz.value
    if (index !== eusebiusQuestions[current].correct) detention.value.quizCorrect = false
    detention.value.quizIndex = current + 1
    if (current === eusebiusQuestions.length - 1) {
      detention.value.quizDone = true; eusebiusQuiz.value = null
      if (detention.value.quizCorrect) unlockAchievement('rooster')
      speak(detention.value.quizCorrect ? 'eusebiusWin' : 'eusebiusEnd')
    } else eusebiusQuiz.value = current + 1
    save()
  }
  function interactables() {
    if (arthouse.value) {
      if (location.value === 'home') return [
        {x:256,y:290,label:'ВЫЙТИ В ДЕРЕВНЮ',action:()=>transition('village',VILLAGE.home.x,VILLAGE.home.y)},
        {x:58,y:87,label:'ЛЕЧЬ СПАТЬ',action:sleepArthouseDay},
      ]
      if (location.value === 'forest') return [
        {x:18,y:224,label:'ВЕРНУТЬСЯ В ДЕРЕВНЮ',action:()=>transition('village',VILLAGE.forest.x-10,VILLAGE.forest.y)},
        ...FOREST_MUSHROOMS.flatMap(({x,y},i) => arthouse.value.consumed.includes(i) ? [] : [{x:x+8,y:y+8,label:'СЪЕСТЬ МУХОМОР',action:()=>eatArthouse(i)}]),
      ]
      if (location.value === 'village') return [
        {...VILLAGE.home,label:'ВОЙТИ ДОМОЙ',action:()=>transition('home',256,274)},
        {...VILLAGE.forest,label:'ОТПРАВИТЬСЯ В ЛЕС',action:()=>transition('forest',40,224)},
        ...(arthouse.value.day >= 3 ? MAYO_POINTS.map((point,i) => ({...point,label:'ДОБАВИТЬ МАЙОНЕЗ',action:()=>{ arthouse.value.mayo[i]=Math.min(4,arthouse.value.mayo[i]+1); drawScene(); save(); speak('arthouseMayo') }})) : []),
      ]
      return []
    }
    if (urgency.value) {
      if (location.value === 'forest') return [{ x:18,y:224,label:'БЕЖАТЬ В ДЕРЕВНЮ',action:()=>transition('village',VILLAGE.forest.x-10,VILLAGE.forest.y) }]
      if (location.value === 'village') return [{ ...VILLAGE.home,label:'БЕЖАТЬ ДОМОЙ',action:()=>transition('home',256,274) }]
      if (location.value === 'home') return [{ x:440,y:234,label:'ДОБЕЖАТЬ ДО УНИТАЗА',action:()=>{ urgency.value=null; questState.value='rejected'; save(); speak('urgencySafe') } }]
      return []
    }
    if (questState.value === 'escort_forest') return escort?.waypoint >= escort?.route.length ? [{ x:18,y:224,label:'ИДТИ ЗА ГАДАЛКОЙ В ДЕРЕВНЮ',action:()=>transition('village',VILLAGE.forest.x-10,VILLAGE.forest.y) }] : []
    if (questState.value === 'escort_village') return []
    if (questState.value === 'tail') return []
    if (location.value === 'detention' && detention.value) return [
      { x:88,y:80,label:'ПОГОВОРИТЬ С ЕВСОБИЕМ',action:() => {
        if (detention.value.quizDone) speak('eusebiusDone')
        else speak('eusebiusIntro', () => { eusebiusQuiz.value = detention.value.quizIndex || 0; keys.clear() })
      } },
      ...(detentionHidden ? [{ ...detentionHidden, label:'ВЫЙТИ ИЗ УКРЫТИЯ', action: () => { detentionHidden = null; detention.value.hiddenIndex=null; renderer.setActorVisible(true); save() } }] : DETENTION_HIDING.map((place,i) => ({ ...place, label:'СПРЯТАТЬСЯ', action: () => { detentionHidden = place; detention.value.hiddenIndex=i; keys.clear(); renderer.setActorVisible(false); save() } }))),
      { ...DETENTION_TAP, label:'ОТКРЫТЬ КРАН', action: () => {
        if (detention.value.cellOpen) { speak('detentionTapAgain'); return }
        detention.value = openCell(detention.value); drawScene(); save(); speak('detentionTap')
      } },
      ...(detention.value.cause === 'cannabis' && !detention.value.shovelFound ? [{ ...DETENTION_SHOVEL, label:'ВЗЯТЬ ЛОПАТУ', action: () => {
        detention.value = findDetentionShovel(detention.value); shovel.value = true; shovelUsed.value = false; drawScene(); save(); speak('detentionShovel')
      } }] : []),
      ...(detention.value.cause === 'cannabis' && !detention.value.choice ? [{ ...DETENTION_EVIDENCE, label:'ОСМОТРЕТЬ ВЕЩДОКИ', action: () => {
        if (!detention.value.shovelFound) speak('detentionNoShovel')
        else speak('detentionEvidence', () => { keys.clear(); detentionChoice.value = true })
      } }] : []),
      { ...DETENTION_EXIT, label:'ВЫЙТИ ИЗ СИЗО', action: leaveDetention },
    ]
    if (location.value === 'mansion') return [
      { x: 35, y: 224, label: carriedChair ? 'ВЫНЕСТИ КРАСНЫЙ СТУЛ' : 'ВЫЙТИ ИЗ ОСОБНЯКА', action: returnFromHeist },
      ...(!mansionRodTaken.value ? [{...MANSION_ROD,label:'ОСМОТРЕТЬ УДОЧКУ',action:()=>{
        if (questState.value !== 'rod_search') speak('mansionRodWait')
        else if (inventory.value.every(Boolean)) speak('inventoryFull')
        else { mansionRodTaken.value=true; mansionRodOwned.value=true; drawScene(); save(); speak('rodTake') }
      }}] : []),
      ...(mansionHidden ? [{ ...mansionHidden, label:'ВЫЙТИ ИЗ УКРЫТИЯ', action: () => { mansionHidden=null; renderer.setActorVisible(true) } }] : [
        ...(questState.value === 'heist' && !carriedChair ? [{ ...mansionChair, label:'ВЗЯТЬ КРАСНЫЙ СТУЛ', action: () => { carriedChair=true; save(); speak('heistTaken') } }] : []),
        ...MANSION_STAIRS.map((stair,i) => ({ ...stair, label:i===0 ? 'ПОДНЯТЬСЯ НА ВТОРОЙ ЭТАЖ' : 'СПУСТИТЬСЯ НА ПЕРВЫЙ ЭТАЖ', action: () => { player.x=680; player.y=MANSION_STAIRS[1-i].y; drawScene(); save() } })),
        ...(!carriedChair ? MANSION_HIDING.map(place => ({ ...place, action: () => { if (patrol.floor === Math.floor(player.y/FLOOR_HEIGHT) && Math.hypot(player.x-patrol.x,player.y-patrol.y)<60 && renderer.canSee(patrol,player)) return; mansionHidden=place; keys.clear(); renderer.setActorVisible(false) } })) : []),
      ]),
    ]
    if (questState.value === 'chairs') return chairGame?.phase === 'stop' ? SEATS.slice(0, 4-chairGame.round).map(s => ({ ...s, label: 'СЕСТЬ НА КРАСНЫЙ СТУЛ', action: sitAtChair })) : []
    if (location.value === 'home') return [
      { x: 256, y: 290, label: 'ВЫЙТИ В ДЕРЕВНЮ', action: () => transition('village', VILLAGE.home.x, VILLAGE.home.y) },
      ...(!collection.value?.basket ? [{x:185,y:126,label:'ОСМОТРЕТЬ КОРЗИНКУ',action:()=>{
        if (!collection.value) speak('basketWait')
        else if (inventory.value.every(Boolean)) speak('inventoryFull')
        else { collection.value.basket=true; drawScene(); save(); speak('basketTake') }
      }}] : []),
      ...(!ragTaken.value && !droppedRag.value && !ragConfiscated.value ? [{x:407,y:258,label:'ВЗЯТЬ ТРЯПКУ',action: () => { if(inventory.value.every(Boolean)){speak('inventoryFull');return} ragTaken.value=true; selectedInventorySlot.value=inventory.value.indexOf('rag'); drawScene(); save(); speak('ragTake') }}] : []),
      { x: 58, y: 87, label: stage.value === 3 ? 'ЛЕЧЬ СПАТЬ' : 'ОСМОТРЕТЬ КРОВАТЬ', action: () => stage.value === 3 ? speak('finish', showSleep) : speak('bed') },
      ...(stashState.value === 'player' && !droppedItems.value.treasure ? [{ x: 148, y: 241, label: 'ИСПОЛЬЗОВАТЬ ВОДНИК', action: () => { unlockAchievement('inhalation'); fatal('waterpipe','waterpipe','curse') } }] : []),
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
      ...(!witchMurder.value ? [{ x: 238, y: 78, label: 'ПОГОВОРИТЬ С ГАДАЛКОЙ', action: () => {
        if (witchAngry.value || cursedOnce.value) speak('witchSilent')
        else if (collection.value?.giver === 'captain') speak('alreadyCaptainQuest')
        else if (collection.value?.giver === 'witch' && collection.value.completed) speak('witchAfterSpell')
        else if (collection.value?.giver === 'witch' && collection.value.collected.length >= 5) speak('mushroomsReturned', () => { collection.value.completed=true; stashState.value='smoked'; stage.value=3; drawScene(); save() })
        else if (collection.value?.giver === 'witch') speak('witchCollect')
        else if (questState.value === 'rejected' && stashState.value === 'witch') speak('witchCollect', () => startCollection('witch'))
        else if (stashState.value === 'witch' && stage.value < 2) speak('witchCollect', () => startCollection('witch'))
        else if (stage.value === 0) speak('witch', () => { stage.value = 1; shovelPermission.value = true })
        else if (stage.value === 1) speak('witch')
        else if (stage.value === 2 && droppedItems.value.treasure) speak('treasureMissing')
        else if (stage.value === 2) speak('reward', () => { stage.value = 3; stashState.value = 'smoked' })
        else speak('reward')
      } }] : []),
      ...(!shovel.value ? [{ x: 27, y: 69, label: 'ВЗЯТЬ ЛОПАТУ', action: () => {
        if (inventory.value.every(Boolean)) { speak('inventoryFull'); return }
        if (!shovelPermission.value) {
          shovel.value = true; shovelUsed.value = false; witchAngry.value = true; witchAngryReason.value='theft'
          if (stage.value === 0 && note.value) stage.value = 1
          unlockAchievement('thief'); drawScene(); save(); speak('shovelStolen')
        } else speak('shovel', () => { shovel.value = true; shovelUsed.value = false; drawScene() })
      } }] : []),
      ...(!note.value && !photoConfiscated.value ? [{ x: 281, y: 69, label: 'ОСМОТРЕТЬ ФОТОГРАФИЮ', action: () => !shovelPermission.value ? speak('noteUnavailable') : inventory.value.every(Boolean) ? speak('inventoryFull') : speak('note', () => { note.value = true; drawScene() }) }] : []),
    ]
    if (location.value === 'river') return [
      { ...RIVER_ENTRY,label:'ВЕРНУТЬСЯ В ЛЕС',action:()=>transition('forest',RIVER_PATH_ENTRY.x,RIVER_PATH_ENTRY.y-20) },
      { ...RIVER_FISHER,label:'ПОГОВОРИТЬ С РЫБАКОМ',action:()=>speak(collection.value?.giver === 'captain' ? 'fishermanQuest' : witchAngryReason.value === 'lost_cannabis' && !wolfDefeated.value ? 'fishermanSociety' : 'fisherman') },
      ...(!riverRodGone.value ? [{...RIVER_ROD,label:'ВЗЯТЬ УДОЧКУ',action:()=>{if(inventory.value.every(Boolean)){speak('inventoryFull');return} riverRodGone.value=true;rodTaken.value=true;drawScene();save();speak('rodTake')}}] : []),
    ]
    if (location.value === 'forest') return [
      ...(!trip.value && questState.value !== 'tail' ? [{...RIVER_PATH_ENTRY,label:'ПЕРЕЙТИ К РЕКЕ',action:()=>transition('river',RIVER_ENTRY.x,RIVER_ENTRY.y+12)}] : []),
      { x: 18, y: 224, label: 'ВЫЙТИ ИЗ ЛЕСА', action: () => trip.value ? enterArthouse() : transition('village', VILLAGE.forest.x-10, VILLAGE.forest.y) },
      { ...FOREST_SIGN, label: 'ПРОЧИТАТЬ УКАЗАТЕЛЬ', action: () => speak('forestSign') },
      ...(questState.value === 'tail_ready' ? [{ x: FOREST_EAST.x-30, y: FOREST_EAST.y, label: 'НАЧАТЬ СЛЕЖКУ ЗА БАБКОЙ', action: startTail }] : []),
      ...(collection.value?.basket && !collection.value.completed && collection.value.collected.length < 5 ? FOREST_MUSHROOMS.flatMap(({x,y},i) => collection.value.collected.includes(i) || (mushroomUsed.value && firstMushroom.value === i) ? [] : [{x:x+8,y:y+8,label:'СОБРАТЬ МУХОМОР',action:()=>collectMushroom(i)}]) : !mushroomUsed.value ? FOREST_MUSHROOMS.map(({x,y},i) => ({ x:x+8, y:y+8, label:'СЪЕСТЬ МУХОМОР', action: () => speak('mushroom', () => { firstMushroom.value=i; mushroomUsed.value = true; trip.value = true; unlockAchievement('trip'); drawScene() }) })) : []),
      { x:CAMP.x, y:CAMP.y, label:'ОСМОТРЕТЬ БУТЫЛКУ', action: () => { unlockAchievement('flashback'); speak('flashback') } },
      ...((trip.value || wolfDefeated.value) ? [{ x: FOREST_EAST.x, y: FOREST_EAST.y, label: wolfDefeated.value ? 'ПРОЙТИ В ПОСЕЛЕНИЕ' : 'СТРАННЫЙ ВЫХОД', action: encounterWolf }] : []),
    ]
    if (location.value === 'society_village') return [
      { ...SETTLEMENT_FOREST, label:'ВЕРНУТЬСЯ В ЛЕС', action: () => transition('forest', FOREST_EAST.x-30, FOREST_EAST.y) },
      { ...SETTLEMENT_HOUSE, label:'ВОЙТИ В ДОМ ОБЩЕСТВА', action: () => transition('society', SOCIETY_ENTRY.x, SOCIETY_ENTRY.y) },
    ]
    if (location.value === 'society') return [
      { ...SOCIETY_ENTRY, label:'ВЫЙТИ В ПОСЕЛЕНИЕ', action: () => transition('society_village', SETTLEMENT_HOUSE.x, SETTLEMENT_HOUSE.y+3) },
      { x: CAPTAIN.x, y: CAPTAIN.y+14, label:'ПОГОВОРИТЬ С КАПИТАНОМ КУКОМ', action: captain },
      ...(societyProgress.value === 3 ? [{ x: 714, y: 148, label: 'ОСМОТРЕТЬ СВОЙ КРАСНЫЙ СТУЛ', action: () => speak('redChair') }] : []),
    ]
    return [
      { ...VILLAGE.bike, label: !bikeClean.value && bikeQuest.value && ragTaken.value && inventory.value[selectedInventorySlot.value] === 'rag' ? 'ОТМЫТЬ ПИТБАЙК' : 'ОСМОТРЕТЬ ПИТБАЙК', action: inspectBike },
      { ...VILLAGE.home, label: 'ВОЙТИ ДОМОЙ', action: () => transition('home', 256, 274) },
      { ...VILLAGE.hut, label: 'ВОЙТИ В ДОМ', action: () => transition('hut', 75, 169) },
      { ...VILLAGE.sign, label: 'ПРОЧИТАТЬ ТАБЛИЧКУ', action: () => speak('sign') },
      { ...VILLAGE.neighbor, label: 'ПОГОВОРИТЬ С КУКОЛДОМ', action: () => questState.value !== 'done' ? speak('silentNeighbor') : wellQuizPassed.value ? speak('quizPassed') : speak('quizIntro', startQuiz) },
      { x: VILLAGE.well.x, y: VILLAGE.well.y + 16, label: 'ОСМОТРЕТЬ КОЛОДЕЦ', action: () => speak('well', () => { choice.value = true; choiceIndex.value = 0; keys.clear() }) },
      { ...VILLAGE.mansion, label: questState.value === 'heist_ready' || canSearchMansionForRod.value ? 'ВОЙТИ В ОСОБНЯК' : 'ОСМОТРЕТЬ ОСОБНЯК', action: () => questState.value === 'heist_ready' ? startHeist() : canSearchMansionForRod.value ? startRodSearch() : speak('mansionLocked') },
      { ...VILLAGE.forest, label: 'ОТПРАВИТЬСЯ В ЛЕС', action: () => transition('forest', 40, 224) },
      ...OTHER_DOORS.map(door => ({ ...door, label:'ОСМОТРЕТЬ ДОМ', action: () => speak('villageHouse') })),
    ]
  }
  function closest() { if (urgency.value || questState.value.startsWith('escort_')) return interactables().map(o => ({...o,d:Math.hypot(player.x-o.x,player.y-o.y)})).filter(o=>o.d<25).sort((a,b)=>a.d-b.d)[0]; const dropped = droppedRag.value?.location === location.value ? [{ ...droppedRag.value, label:'ПОДНЯТЬ ТРЯПКУ', action: () => { droppedRag.value = null; ragTaken.value = true; selectedInventorySlot.value = inventory.value.indexOf('rag'); drawScene(); save() } }] : []; for (const [kind, point] of Object.entries(droppedItems.value)) if (point.location === location.value) dropped.push({ ...point, label: ({shovel:'ПОДНЯТЬ ЛОПАТУ',photo:'ПОДНЯТЬ ФОТОГРАФИЮ',treasure:'ПОДНЯТЬ КЛАД',rod:'ПОДНЯТЬ УДОЧКУ',mansionRod:'ПОДНЯТЬ УДОЧКУ ГАДАЛКИ'})[kind], action: () => { if (inventory.value.every(Boolean)) { speak('inventoryFull'); return }; const next={...droppedItems.value}; delete next[kind]; droppedItems.value=next; selectedInventorySlot.value=inventory.value.indexOf(kind); drawScene(); save() } }); return [...dropped, ...interactables()].map(o => ({ ...o, d: Math.hypot(player.x - o.x, player.y - o.y) })).filter(o => o.d < 25).sort((a, b) => a.d - b.d)[0] }
  function interact() {
    if (screen.value !== 'game' || choice.value || detentionChoice.value || caughtFish.value || eusebiusQuiz.value !== null || quiz.value || photoOpen.value || fishing.value || urgency.value?.check) return
    if (dialog.value) { nextDialog(); return }
    const item=closest()
    if (item) { audio.beep(470); item.action() }
  }
  function useItem() {
    if (screen.value !== 'game' || dialog.value || choice.value || quiz.value || photoOpen.value || urgency.value || questState.value.startsWith('escort_')) return
    const item=inventory.value[selectedInventorySlot.value]
    if (item === 'photo') togglePhoto()
    else if (item === 'shovel' && location.value === 'hut' && !witchMurder.value && Math.hypot(player.x-238,player.y-78)<28) {
      witchMurder.value='inside'; breakShovel(); drawScene(); speak('witchKilled')
    }
    else if (item === 'shovel') dig()
    else if (item === 'rag') speak('ragUse')
    else if (item === 'treasure') speak('treasureUse')
    else if (item === 'rod' || item === 'mansionRod') castRod()
    else if (item === 'bucket') {
      const fish=collection.value?.fish || [], names={crucian:'карасей',perch:'окуней',roach:'плотвы'}
      const contents=Object.entries(names).map(([kind,name])=>`${name}: ${fish.filter(f=>f===kind).length}`).join(', ')
      keys.clear(); dialog.value={lines:[['ТИГРАН',`В ведре ${contents}.`]],index:0}
    }
    else if (item === 'basket') { keys.clear(); dialog.value={lines:[['ТИГРАН',`В корзинке мухоморов: ${collection.value?.completed ? 0 : collection.value?.collected.length || 0}.`]],index:0} }
  }
  function dig() {
    if (screen.value !== 'game' || dialog.value || choice.value || questState.value === 'tail' || questState.value.startsWith('escort_') || location.value !== 'forest' || inventory.value[selectedInventorySlot.value] !== 'shovel' || !shovel.value || shovelUsed.value) return
    audio.beep(150, .12)
    const result = resolveDig({ permission: shovelPermission.value && witchAngryReason.value !== 'theft', photo: note.value, stage: stage.value, stashState: stashState.value, distance: Math.hypot(player.x-stashAt(stashIndex.value).x, player.y-stashAt(stashIndex.value).y), wrongDigs: wrongDigs.value })
    if (result.outcome === 'missing') speak('stashMissing')
    else if (result.outcome === 'found') {
      stage.value = 2; stashState.value = 'player'
      breakShovel(); beginDetention('cannabis')
    } else if (result.outcome === 'miss') {
      wrongDigs.value = result.wrongDigs
      if (wrongDigs.value === 5) unlockAchievement('missed_digs')
      keys.clear(); dialog.value = { lines: [['ТИГРАН', 'Здесь пусто. Надо ещё раз свериться с фотографией.']], index: 0 }; save()
    } else speak('digUnknown')
  }
  function onKey(event) {
    const k = event.key.toLowerCase(), direction = directionFromEvent(event)
    if (direction || [' ', 'enter', 'e', 'у', 'q', 'й', 'r', 'к', 'shift'].includes(k)) event.preventDefault()
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
    if (fishing.value) {
      if ((event.code==='KeyQ' || ['q','й'].includes(k)) && !event.repeat) retrieveRod()
      else if (event.code==='Space' && !event.repeat) fishingPress(true)
      return
    }
    if (photoOpen.value) { if (!event.repeat && (event.code === 'KeyR' || ['r','к','escape'].includes(k))) photoOpen.value = false; return }
    if (quiz.value) {
      if (event.repeat) return
      if (direction === 'up' || direction === 'down') quizSelected.value = (quizSelected.value + (direction === 'up' ? -1 : 1) + quizQuestion.value.options.length) % quizQuestion.value.options.length
      else if (['enter',' ','e','у'].includes(k)) answerQuiz(quizSelected.value)
      else if (/^[1-4]$/.test(k)) answerQuiz(Number(k)-1)
      return
    }
    if (choice.value) {
      if (['up', 'down'].includes(direction)) choiceIndex.value = (choiceIndex.value + (direction === 'up' ? -1 : 1) + (hasFishingRod.value ? 3 : 2)) % (hasFishingRod.value ? 3 : 2)
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
  function onUp(event) { keys.delete(event.key.toLowerCase()); if (event.code==='Space') fishingPress(false) }
  function onMouseDown(event) { if (event.button===0 && urgency.value?.check && screen.value === 'game') { event.preventDefault(); attemptUrgency(); return }; if (event.button===0 && fishing.value && !event.target.closest('button')) { event.preventDefault(); fishingPress(true) } }
  function onMouseUp(event) { if (event.button===0) fishingPress(false) }
  function attemptUrgency() {
    if (!urgency.value?.check) return
    const result=resolveUrgencyCheck(urgency.value); audio.beep(result === 'perfect' ? 600 : result === 'miss' ? 130 : 360)
    if (urgency.value.remaining <= 0) finishEnding('rupture'); else save()
  }
  function updateQuest(delta) {
    const actors = []
    if (location.value === 'detention' && detention.value) {
      const state = detention.value
      if (state.cellOpen && player.y < 152 && Number.isFinite(state.cellRemaining)) {
        state.cellRemaining = Math.max(0, state.cellRemaining-Math.min(delta,50))
        actors.push({id:'detention-duty',x:122,y:136,col:4})
        if (state.cellRemaining === 0) { state.cellOpen=false; drawScene(); save(); speak('detentionDoorClosed'); return }
      }
      state.guardTime += Math.min(delta, 50) * (state.alarm ? 1.5 : 1)
      const notice=Math.floor((state.guardTime%21000)/10500) === 0 ? 'ГРОМКОГОВОРИТЕЛЬ: ОБХОД ВПРАВО' : 'ГРОМКОГОВОРИТЕЛЬ: ОБХОД ВЛЕВО'
      if (detentionNotice.value !== notice) detentionNotice.value=notice
      const patrol = (offset, left, right, y, period) => {
        const t = ((state.guardTime + offset) % period) / period
        const p = t < .5 ? t * 2 : 2 - t * 2
        return { x:left + (right-left)*p, y }
      }
      let guards = [patrol(0, 260, 1115, 198, 21000), patrol(7000, 75, 1100, 441, 24000)]
      if (state.alarm) {
        if (!Array.isArray(state.guardPositions) || state.guardPositions.length !== 2 || state.guardPositions.some(g => !Number.isFinite(g?.x) || !Number.isFinite(g?.y))) state.guardPositions = guards
        guards = state.guardPositions
        for (const guard of guards) {
          // The three cross-passages connect the two corridors. Guards choose one
          // before changing corridors so that pursuit does not run into walls.
          const guardTop=guard.y<320, playerTop=player.y<320
          let target = { x:player.x, y:guardTop ? 198 : 441 }
          if (guardTop !== playerTop) {
            const connector = [284,592,824].reduce((best,x) => Math.abs(x-guard.x)+Math.abs(x-player.x)<Math.abs(best-guard.x)+Math.abs(best-player.x) ? x : best,284)
            target = Math.abs(guard.x-connector)>4 ? {x:connector,y:guardTop?198:441} : {x:connector,y:guardTop?441:198}
          }
          const dx=target.x-guard.x, dy=target.y-guard.y, distance=Math.hypot(dx,dy), step=Math.min(distance,Math.min(delta,50)*.062)
          if (distance) renderer.movePoint(guard,dx/distance*step,dy/distance*step)
        }
      }
      guards.forEach((guard, i) => { actors.push({id:`detention-zone-${i}`,kind:'guard-zone',...guard,alarm:state.alarm}); actors.push({ id:`detention-guard-${i}`, ...guard, col:4 }) })
      if (state.cellOpen && !detentionHidden && guards.some(g => Math.hypot(g.x-player.x,g.y-player.y) < 20 && renderer.canSee(g,player))) {
        fatal('prison','detentionCaught','prison'); return
      }
    } else if (questState.value === 'tail' && tail && location.value === 'forest') {
      const hidden = behindTree(player), turning = tail.elapsed % 7500 > 5600
      questStatus.value = turning ? (hidden ? 'БАБКА ОБЕРНУЛАСЬ — ТЫ ЗА ДЕРЕВОМ' : 'БАБКА ОБЕРНУЛАСЬ! ДЕРЖИСЬ ПОДАЛЬШЕ ИЛИ СПРЯЧЬСЯ') : tail.digging && !tail.dug ? (tail.mode === 'mushrooms' ? 'БАБКА СОБИРАЕТ МУХОМОРЫ' : tail.mode === 'empty' ? 'БАБКА ПРОВЕРЯЕТ ПУСТОЙ ТАЙНИК' : 'БАБКА ВЫКАПЫВАЕТ КЛАД. НЕ ТЕРЯЙ ЕЁ ИЗ ВИДУ') : tail.dug ? (tail.mode === 'mushrooms' || tail.mode === 'empty' ? 'БАБКА ВОЗВРАЩАЕТСЯ ДОМОЙ' : 'БАБКА НЕСЁТ КЛАД ДОМОЙ. ИДИ ЗА НЕЙ') : 'ИДИ ЗА БАБКОЙ И НЕ ТЕРЯЙ ЕЁ ИЗ ВИДУ'
      const hadDug = tail.dug
      const result = updateTail(tail, delta, player, hidden)
      if (!hadDug && tail.dug && tail.mode === 'buried') { stashState.value = 'witch'; save() }
      if (result === 'seen') {
        if (witchAngry.value) {
          tail=null; questState.value='rejected'; cursedOnce.value=true; urgency.value=createUrgency(); drawScene(); save()
          speak(witchAngryReason.value === 'lost_cannabis' ? 'caughtLostCannabis' : 'caughtThief', () => { keys.clear(); save() })
        } else {
          escort=tail; tail=null; questState.value='escort_forest'; questStatus.value='ИДИ ЗА ГАДАЛКОЙ'; drawScene(); save()
          speak(escort.mode === 'empty' ? 'caughtEmpty' : escort.dug ? 'caughtCarrying' : 'caughtBuried')
        }
        return
      }
      if (result === 'lost') {
        tail = null; questState.value = 'tail_ready'; player.x = FOREST_EAST.x-30; player.y = FOREST_EAST.y; drawScene(); save(); speak('tailLost'); return
      }
      if (result === 'success') {
        const story = tail.mode === 'mushrooms' ? 'missionOneMushrooms' : tail.mode === 'empty' ? 'missionOneEmpty' : 'missionOneDone'
        tail = null; questState.value = 'report1'; societyProgress.value = 1; drawScene(); save(); speak(story); return
      }
      actors.push({ id:'witch', x:tail.x, y:tail.y, col:0 })
      if (tail.digging && !tail.dug && tail.mode === 'buried') actors.push({ id:'treasure', kind:'treasure', x:stashAt(stashIndex.value).x, y:stashAt(stashIndex.value).y })
    } else if (questState.value === 'escort_forest' && escort && location.value === 'forest') {
      const result=advanceEscort(escort,delta,player)
      questStatus.value=result === 'waiting' ? 'ГАДАЛКА ЖДЁТ ТЕБЯ — ПОДОЙДИ БЛИЖЕ' : result === 'arrived' ? 'ИДИ ЗА ГАДАЛКОЙ В ДЕРЕВНЮ' : escort.digging && !escort.dug ? 'ПОДОЖДИ, ПОКА ГАДАЛКА ВЫКОПАЕТ КЛАД' : 'ИДИ ЗА ГАДАЛКОЙ'
      if (result === 'dug') { if (escort.mode === 'buried') stashState.value='witch'; save(); speak(escort.mode === 'empty' ? 'escortEmpty' : 'escortDug') }
      if (result === 'waypoint' || result === 'arrived') save()
      actors.push({id:'witch',x:escort.x,y:escort.y,col:0})
    } else if (questState.value === 'escort_village' && escort && location.value === 'village') {
      const route=[{x:1050,y:300},{x:846,y:300},{x:846,y:180}]
      if (escort.waypoint < route.length && Math.hypot(player.x-escort.x,player.y-escort.y)<=105) {
        const target=route[escort.waypoint], dx=target.x-escort.x, dy=target.y-escort.y, distance=Math.hypot(dx,dy), step=Math.min(delta,50)*.027
        if (distance<=step) { escort.x=target.x; escort.y=target.y; escort.waypoint++; save() }
        else { escort.x+=dx/distance*step; escort.y+=dy/distance*step }
      }
      if (escort.waypoint >= route.length) { questState.value='escort_hut'; escort=null; questStatus.value='ВОЙДИ В ДОМ ГАДАЛКИ И ПОГОВОРИ С НЕЙ'; save(); speak('escortDoor'); return }
      questStatus.value=Math.hypot(player.x-escort.x,player.y-escort.y)>105 ? 'ГАДАЛКА ЖДЁТ ТЕБЯ — ПОДОЙДИ БЛИЖЕ' : 'ИДИ ЗА ГАДАЛКОЙ К ЕЁ ДОМУ'
      actors.push({id:'witch',x:escort.x,y:escort.y,col:0})
    } else if (['heist','rod_search'].includes(questState.value) && location.value === 'mansion') {
      advanceMansionPatrol(patrol, delta, renderer.movePoint)
      const witch = patrol, hidden = !!mansionHidden
      questStatus.value = `${questState.value === 'rod_search' ? 'НАЙДИ УДОЧКУ И ВЫЙДИ' : carriedChair ? 'НЕСИ СТУЛ К ВЫХОДУ · Q — ПОСТАВИТЬ' : 'НАЙДИ КРАСНЫЙ СТУЛ НА ВТОРОМ ЭТАЖЕ'} · ${hidden ? 'ТЫ В УКРЫТИИ' : 'ПРЯЧЬСЯ В МЕБЕЛИ'}`
      if (!hidden && Math.hypot(player.x-witch.x, player.y-witch.y) < 60 && renderer.canSee(witch, player)) {
        if (cursedOnce.value && questState.value === 'rod_search') { fatal('secondCurse','secondCurse','rupture'); return }
        cursedOnce.value=true; carriedChair = false; mansionHidden=null; patrol=null; questState.value='rejected'; urgency.value=createUrgency()
        transition('village', VILLAGE.mansion.x, VILLAGE.mansion.y); save(); speak('heistCursed'); return
      }
      actors.push({ id:'witch', ...witch, col:0 })
      if (questState.value === 'heist') { if (!carriedChair) actors.push({ id:'red-chair', kind:'chair', x:mansionChair.x, y:mansionChair.y-8 }); else actors.push({id:'carried-chair',kind:'chair',x:player.x+10,y:player.y-4}) }
    } else if (questState.value === 'chairs' && chairGame && location.value === 'society') {
      const count = 4-chairGame.round
      const result = advanceChairs(chairGame, delta)
      if (result === 'stopped') {
        syncMusic()
        chairStarts = Array.from({ length:count }, (_, i) => { const a=chairGame.angle+(i+1)*Math.PI*2/(count+1); return { x:CHAIR_CENTER.x+CHAIR_RADIUS.x*Math.cos(a), y:CHAIR_CENTER.y+CHAIR_RADIUS.y*Math.sin(a) } })
      }
      if (result === 'failed') {
        chairGame = null; questState.value = 'rejected'; player.x=CAPTAIN.x; player.y=CAPTAIN.y+22; unlockAchievement('chairs_loss'); drawScene(); save(); speak('chairsRejected'); return
      }
      questStatus.value = chairGame.phase === 'music' ? `КРУГ ${chairGame.round} / 3: ХОДИ ВОКРУГ СТУЛЬЕВ. ЖДИ ОСТАНОВКИ МУЗЫКИ` : `КРУГ ${chairGame.round} / 3: СКОРЕЕ К СТУЛУ И НАЖМИ E!`
      for (const [i, seat] of SEATS.slice(0,count).entries()) actors.push({ id:`seat${i}`, kind:'chair', ...seat })
      for (let i=0;i<count;i++) {
        const a=chairGame.angle+(i+1)*Math.PI*2/(count+1), start=chairGame.phase === 'stop' ? chairStarts[i] : { x:CHAIR_CENTER.x+CHAIR_RADIUS.x*Math.cos(a), y:CHAIR_CENTER.y+CHAIR_RADIUS.y*Math.sin(a) }, seat=SEATS[i], t=chairGame.phase === 'stop' ? Math.min(1,chairGame.elapsed/2400) : 0
        actors.push({ id:`npc${i}`, x:start.x+(seat.x-start.x)*t, y:start.y+(seat.y-start.y)*t, col:2+i })
      }
    }
    if (fishing.value) {
      const f=fishing.value, point=f.kind==='well' ? {x:VILLAGE.well.x,y:VILLAGE.well.y+3} : {x:player.x+6,y:278}
      actors.push({id:'bobber',kind:'bobber',...point,fromX:player.x,fromY:player.y,biting:f.phase==='bite',time:f.elapsed})
    }
    if (droppedRag.value?.location === location.value) actors.push({ id:'dropped-rag', kind:'rag', ...droppedRag.value })
    if (location.value === 'village' && witchMurder.value === 'left') {
      actors.push({id:'crime-police',x:VILLAGE.hut.x-25,y:VILLAGE.hut.y+10,col:4})
      actors.push({id:'crime-neighbor',x:VILLAGE.hut.x+25,y:VILLAGE.hut.y+10,col:2})
    }
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
    if (screen.value !== 'game' || dialog.value || choice.value || detentionChoice.value || caughtFish.value || eusebiusQuiz.value !== null || photoOpen.value || !renderer) return
    if (urgency.value) {
      const before=Math.ceil(urgency.value.remaining/1000), result=advanceUrgency(urgency.value,ticker.deltaMS)
      if (result === 'expired') { finishEnding('rupture'); return }
      if (result === 'check') { keys.clear(); save() }
      if (Math.ceil(urgency.value.remaining/1000) !== before) save()
      if (urgency.value.check) return
    }
    if (fishing.value) {
      const outcome=updateFishing(fishing.value,ticker.deltaMS)
      if (outcome==='well-fall') { fishing.value=null; speak('wellFishingScold',()=>beginDive('thrown')) }
      else if (outcome==='caught' || outcome==='escaped' || outcome==='missed') {
        fishing.value=null
        if (outcome === 'caught' && collection.value?.bucket && inventory.value.includes('bucket')) {
          const fish = [{kind:'crucian',name:'КАРАСЬ',color:'#b4a264'}, {kind:'perch',name:'ОКУНЬ',color:'#86a466'}, {kind:'roach',name:'ПЛОТВА',color:'#a7b7b1'}]
          caughtFish.value = fish[Math.floor(Math.random()*fish.length)]; keys.clear()
        } else speak(outcome==='caught'?'fishNoBucket':outcome==='missed'?'fishMissed':'fishEscaped')
      }
      updateQuest(ticker.deltaMS); return
    }
    const left = keys.has('a') || keys.has('ф') || keys.has('arrowleft'), right = keys.has('d') || keys.has('в') || keys.has('arrowright'), up = keys.has('w') || keys.has('ц') || keys.has('arrowup'), down = keys.has('s') || keys.has('ы') || keys.has('arrowdown')
    let dx = Number(right) - Number(left), dy = Number(down) - Number(up)
    const moving = (dx !== 0 || dy !== 0) && !(mansionHidden && location.value === 'mansion') && !(detentionHidden && location.value === 'detention')
    const sprinting = moving && keys.has('shift') && !staminaExhausted && stamina.value > 0
    const length = Math.hypot(dx, dy) || 1, speed = Math.min(ticker.deltaTime, 2) * 1.05 * (sprinting ? SPRINT_MULTIPLIER : 1)
    dx = moving ? dx / length * speed : 0; dy = moving ? dy / length * speed : 0
    const beforeX=player.x, beforeY=player.y
    elapsed += ticker.deltaTime; renderer.move(player, dx, dy, elapsed, left)
    if (location.value === 'village' && witchMurder.value === 'outside' && Math.hypot(player.x-VILLAGE.hut.x,player.y-VILLAGE.hut.y)>120) { witchMurder.value='left'; save() }
    if (location.value === 'village' && witchMurder.value === 'left' && Math.hypot(player.x-VILLAGE.hut.x,player.y-VILLAGE.hut.y)<35) {
      witchMurder.value='caught'; unlockAchievement('crime'); fatal('crime','witchCrimeCaught','crime'); return
    }
    const staminaState=updateStamina(stamina.value, staminaExhausted, sprinting && (player.x !== beforeX || player.y !== beforeY), ticker.deltaMS)
    stamina.value=staminaState.value; staminaExhausted=staminaState.exhausted
    const cellX = Math.floor(player.x / 16) + 1, cellY = Math.floor(player.y / 16) + 1
    if (coords.value.x !== cellX || coords.value.y !== cellY) coords.value = { x: cellX, y: cellY }
    updateQuest(ticker.deltaMS)
    near.value = closest()?.label || ''
  }
  function press(key) { if (!urgency.value?.check) keys.add(key) }
  function release(key) { keys.delete(key) }
  function togglePhoto() { if (note.value && !dialog.value && !choice.value && !quiz.value && !urgency.value && (photoOpen.value || inventory.value[selectedInventorySlot.value] === 'photo')) { keys.clear(); photoOpen.value = !photoOpen.value } }
  const onBlur = () => { keys.clear(); fishingPress(false) }
  onMounted(async () => {
    window.addEventListener('mousedown', onMouseDown); window.addEventListener('mouseup', onMouseUp); window.addEventListener('pointerdown', audio.unlockMusic); window.addEventListener('keydown', audio.unlockMusic); syncMusic()
    const created = await createWorld(canvasHost.value, update)
    if (disposed) { created.destroy(); return }
    renderer = created; drawScene()
    window.addEventListener('keydown', onKey); window.addEventListener('keyup', onUp); window.addEventListener('blur', onBlur)
  })
  onUnmounted(() => {
    disposed = true; clearTimeout(curseTimer); clearTimeout(achievementTimer); clearTimeout(arthouseWalkTimer); clearTimeout(evidenceTimer); battle.stop(); audio.destroy(); renderer?.destroy()
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onUp); window.removeEventListener('blur', onBlur)
    window.removeEventListener('mousedown', onMouseDown); window.removeEventListener('mouseup', onMouseUp); window.removeEventListener('pointerdown', audio.unlockMusic); window.removeEventListener('keydown', audio.unlockMusic)
  })
  return { stamina, dropItem, urgency, attemptUrgency, canvasHost, screen, location, dialog, near, sound, shovel, shovelUsed, note, inventory, selectedInventorySlot, selectInventorySlot, bikeHint, fishing, fishingPress, retrieveRod, photo, photoOpen, togglePhoto, useItem, trip, arthouse, endingKind, coords, choice, choiceIndex, questHint, endings, unlocked, achievements, achievementUnlocked, achievementToast, quiz, quizQuestion, quizSelected, quizSeconds, quizQuestions, answerQuiz, battle, slots, slotMode, slotNotice, slotFromGame, questState, openSlots, closeSlots, selectSlot, start, openMenu, interact, nextDialog, dig, chooseWell, press, release, startBattle, detentionChoice, chooseDetentionEvidence, eusebiusQuiz, eusebiusQuestion, answerEusebius, caughtFish, resolveFish, finishAmbulance, finishSleep }
}
