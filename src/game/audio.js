export function createAudio(isEnabled) {
  let context
  const scream = new Audio('/assets/curse-scream.mp3')
  const music = Object.fromEntries(Object.entries({
    menu:'/assets/menu-progressive.wav', forest:'/assets/forest-ambient.wav', tail:'/assets/tail-dubstep.wav', chairs:'/assets/society-phonk.wav',
  }).map(([name, path]) => { const track = new Audio(path); track.loop = true; track.preload = 'none'; track.volume = name === 'forest' ? .24 : .42; return [name, track] }))
  let currentTrack = null
  const tryPlay = track => { if (track) track.play().catch(() => {}) }
  scream.preload = 'auto'
  scream.volume = 0.65
  return {
    beep(frequency = 330, duration = 0.045) {
      if (!isEnabled()) return
      try {
        context ||= new AudioContext()
        const oscillator = context.createOscillator(), gain = context.createGain()
        oscillator.type = 'square'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0.025, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration)
        oscillator.connect(gain); gain.connect(context.destination)
        oscillator.start(); oscillator.stop(context.currentTime + duration)
      } catch { /* Audio is optional. */ }
    },
    scream() {
      if (!isEnabled()) return
      scream.currentTime = 0
      scream.play().catch(() => {})
    },
    setMusic(name) {
      const next = isEnabled() && music[name] ? name : null
      if (currentTrack === next) return
      if (currentTrack) { const previous = music[currentTrack]; previous.pause(); previous.currentTime = 0 }
      currentTrack = next
      if (next) tryPlay(music[next])
    },
    unlockMusic() { if (currentTrack && isEnabled() && music[currentTrack].paused) tryPlay(music[currentTrack]) },
    destroy() { scream.pause(); Object.values(music).forEach(track => track.pause()); context?.close().catch(() => {}) },
  }
}
