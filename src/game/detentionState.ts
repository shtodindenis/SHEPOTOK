import type { ArrestCause } from './arrest.ts'
export type EvidenceChoice = 'shovel' | 'cannabis'
export interface DetentionState {
  cause: ArrestCause
  cellOpen: boolean
  cellRemaining: number
  shovelFound: boolean
  choice: EvidenceChoice | null
  alarm: boolean
  guardTime: number
  hiddenIndex?: number | null
  guardPositions?: { x: number; y: number }[]
  quizIndex?: number
  quizCorrect?: boolean
  quizDone?: boolean
}

export function startDetention(cause: ArrestCause): DetentionState {
  if (!['cannabis', 'mushrooms'].includes(cause)) throw new Error('Unknown detention cause')
  return { cause, cellOpen: false, cellRemaining:0, shovelFound: false, choice: null, alarm: false, guardTime: 0, quizIndex: 0, quizCorrect: true, quizDone: false }
}

export function validDetention(value: DetentionState | null | undefined) {
  return !!value && ['cannabis', 'mushrooms'].includes(value.cause) &&
    typeof value.cellOpen === 'boolean' && typeof value.shovelFound === 'boolean' &&
    [null, 'shovel', 'cannabis'].includes(value.choice) && typeof value.alarm === 'boolean' &&
    Number.isFinite(value.guardTime) && value.guardTime >= 0 &&
    (value.quizIndex === undefined || (Number.isInteger(value.quizIndex) && value.quizIndex >= 0 && value.quizIndex <= 3)) &&
    (value.cause === 'cannabis' || (!value.shovelFound && value.choice === null && !value.alarm)) &&
    (value.choice === null || value.shovelFound) && (value.alarm === (value.choice === 'cannabis'))
}

export function openCell(state: DetentionState) {
  return { ...state, cellOpen: true, cellRemaining:12000 }
}

export function findDetentionShovel(state: DetentionState) {
  if (state.cause !== 'cannabis' || !state.cellOpen || state.choice) return state
  return { ...state, shovelFound: true }
}

export function chooseEvidence(state: DetentionState, choice: EvidenceChoice) {
  if (state.cause !== 'cannabis' || !state.shovelFound || state.choice || !['shovel', 'cannabis'].includes(choice)) return state
  return { ...state, choice, alarm: choice === 'cannabis' }
}

export function canLeaveDetention(state: DetentionState) {
  return state.cellOpen && (state.cause === 'mushrooms' || state.choice !== null)
}
