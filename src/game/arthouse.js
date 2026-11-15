export const ARTHOUSE_MUSHROOMS = 16
export function startArthouse(firstMushroom) {
  return { phase:'intro', day:1, eaten:0, consumed:[firstMushroom], mayo:Array(8).fill(0), death:null }
}
export function requiredMushrooms(day) { return day + 1 }
// The daily minimum fills the bar; another mushroom is lethal.
export function capacityForDay(day) { return requiredMushrooms(day) }
export function eatArthouseMushroom(state, index) {
  if (!Number.isInteger(index) || index < 0 || index >= ARTHOUSE_MUSHROOMS || state.consumed.includes(index) || state.death) return state
  if (state.eaten >= capacityForDay(state.day)) return { ...state, death:'overdose' }
  return { ...state, eaten:state.eaten + 1, consumed:[...state.consumed,index] }
}
export function sleepArthouse(state) {
  if (state.death) return state
  if (state.eaten < requiredMushrooms(state.day)) return { ...state, death:'exhaustion' }
  return { ...state, day:state.day + 1, eaten:0 }
}
export function validArthouse(value) {
  return !!value && Number.isInteger(value.day) && value.day >= 1 && value.day <= 6 &&
    Number.isInteger(value.eaten) && value.eaten >= 0 && value.eaten <= capacityForDay(value.day) &&
    Array.isArray(value.consumed) && value.consumed.length >= 1 && value.consumed.length <= ARTHOUSE_MUSHROOMS &&
    value.consumed.every(i => Number.isInteger(i) && i >= 0 && i < ARTHOUSE_MUSHROOMS) && new Set(value.consumed).size === value.consumed.length &&
    Array.isArray(value.mayo) && value.mayo.length === 8 && value.mayo.every(level => Number.isInteger(level) && level >= 0 && level <= 4) &&
    [null, 'overdose', 'exhaustion'].includes(value.death)
}
