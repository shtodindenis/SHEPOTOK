// Count actual ticker callbacks over elapsed wall-clock time, independently of game time.
export function createFpsMeter(sampleMs = 1000) {
  let start: number | null = null, frames = 0
  return {
    reset() { start = null; frames = 0 },
    frame(now: number) {
      if (start === null || now < start) { start = now; frames = 0; return null }
      frames++
      const duration = now - start
      if (duration < sampleMs) return null
      const fps = Math.round(frames * 1000 / duration)
      start = now; frames = 0
      return fps
    },
  }
}

// Break slow frames into manageable updates. Discard time beyond 250 ms so a
// stalled or suspended tab cannot cause a large jump when it resumes.
export function forEachTimeStep(elapsedMs: number, update: (deltaMs: number) => void) {
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, Math.min(elapsedMs, 250)) : 0
  if (!elapsed) return
  const steps = Math.ceil(elapsed / 50), step = elapsed / steps
  for (let i = 0; i < steps; i++) update(step)
}
