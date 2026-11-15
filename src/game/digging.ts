export interface DigState { permission: boolean; photo: boolean; stage: number; stashState: string; distance: number; wrongDigs: number; tripping?: boolean }

// Knowledge of the cache is required even when the player happens to dig at it.
export function resolveDig({ permission, photo, stage, stashState, distance, wrongDigs, tripping = false }: DigState) {
  if (tripping) return { outcome: 'tripping', wrongDigs };
  if (!permission || !photo || stage !== 1) return { outcome: 'unknown', wrongDigs };
  if (stashState === 'witch') return { outcome: 'missing', wrongDigs };
  if (distance < 12) return { outcome: 'found', wrongDigs };
  return { outcome: 'miss', wrongDigs: Math.min(5, wrongDigs + 1) };
}
