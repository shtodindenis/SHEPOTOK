interface MusicContext { screen: string; slotFromGame?: boolean; questState?: string; chairPhase?: string; location?: string }

// Decide which track belongs to the current screen; playback is handled by audio.ts.
export function selectMusic({ screen, slotFromGame, questState, chairPhase, location }: MusicContext) {
  if (screen === 'title' || screen === 'gallery' || screen === 'achievements' || (screen === 'slots' && !slotFromGame)) return 'menu'
  if (screen !== 'game') return null
  if (questState === 'chairs' && chairPhase === 'music') return 'chairs'
  if (location === 'forest') return questState === 'tail' ? 'tail' : 'forest'
  return null
}
