import type { useProgressStore } from '../stores/progress.ts'
import type { useSessionStore } from '../stores/session.ts'
import type { GameLocation } from '../stores/interface.ts'

type Progress = ReturnType<typeof useProgressStore>
type Session = ReturnType<typeof useSessionStore>
type Point = { x: number; y: number }

// Keep this shape compatible with previously written localStorage records.
export function createSaveData(progress: Progress, session: Session, location: GameLocation, player: Point, escort: object | null) {
  return {
    arrest: session.arrest ? { ...session.arrest } : null,
    rulesVersion: 2,
    pendingFatal: session.pendingFatal,
    witchMushroomsArrested: session.witchMushroomsArrested,
    witchAngryReason: session.witchAngryReason,
    photoConfiscated: session.photoConfiscated,
    ragConfiscated: session.ragConfiscated,
    witchMurder: session.witchMurder,
    stage: progress.stage,
    location,
    detention: session.detention ? { ...session.detention } : null,
    arthouse: session.arthouse ? { ...session.arthouse } : null,
    collection: session.collection ? { ...session.collection } : null,
    riverRodGone: session.riverRodGone,
    mansionRodTaken: session.mansionRodTaken,
    mansionRodOwned: session.mansionRodOwned,
    cursedOnce: session.cursedOnce,
    firstMushroom: session.firstMushroom,
    shovel: progress.shovel,
    shovelUsed: progress.shovelUsed,
    shovelPermission: progress.shovelPermission,
    witchAngry: progress.witchAngry,
    wrongDigs: progress.wrongDigs,
    wellQuizPassed: progress.wellQuizPassed,
    pendingDiver: session.pendingDiver,
    quiz: session.quiz ? { ...session.quiz } : null,
    note: progress.note,
    trip: progress.trip,
    mushroomUsed: progress.mushroomUsed,
    wolfDefeated: progress.wolfDefeated,
    inventorySlots: progress.inventory,
    rodTaken: session.rodTaken,
    societyProgress: progress.societyProgress,
    questState: progress.questState,
    stashState: progress.stashState,
    stashIndex: progress.stashIndex,
    forestVersion: 5,
    homeVersion: 1,
    hutVersion: 2,
    villageVersion: 1,
    societyVersion: 1,
    urgency: session.urgency,
    escort: escort ? { ...escort } : null,
    ragTaken: progress.ragTaken,
    droppedRag: session.droppedRag,
    droppedItems: session.droppedItems,
    bikeQuest: progress.bikeQuest,
    bikeClean: progress.bikeClean,
    selectedInventorySlot: progress.selectedInventorySlot,
    player: { ...player },
  }
}

export function createSceneSnapshot(progress: Progress, session: Session, location: GameLocation, carriedChair: boolean) {
  return {
    location, detention: session.detention, arthouse: session.arthouse, collection: session.collection,
    witchMurder: session.witchMurder, photoConfiscated: session.photoConfiscated,
    mansionRodTaken: session.mansionRodTaken, firstMushroom: session.firstMushroom,
    stage: progress.stage, stashIndex: progress.stashIndex, note: progress.note, shovel: progress.shovel,
    trip: progress.trip, mushroomUsed: progress.mushroomUsed, rodTaken: session.riverRodGone,
    wolfDefeated: progress.wolfDefeated, societyProgress: progress.societyProgress,
    questState: progress.questState, carriedChair,
    ragTaken: progress.ragTaken || !!session.droppedRag || session.ragConfiscated,
    bikeClean: progress.bikeClean,
  }
}
