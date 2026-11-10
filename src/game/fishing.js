export function startFishing(kind='river', waitMs=3500) { return {kind,phase:'waiting',elapsed:0,waitMs,tension:.5,progress:0,biteTime:0,holding:false} }
export function updateFishing(game,dt) {
  dt=Math.min(dt,50); game.elapsed+=dt
  if(game.kind==='well') return game.elapsed>=5000?'well-fall':null
  if(game.phase==='waiting' && game.elapsed>=game.waitMs) {game.phase='bite';game.biteTime=0;return 'bite'}
  if(game.phase==='bite') {game.biteTime+=dt;if(game.biteTime>=2200)return 'missed'}
  if(game.phase==='reeling') {
    const s=dt/1000
    game.tension+=(game.holding ? .55 : -(.30+game.progress*.45))*s
    if(game.tension<=0 || game.tension>=1)return 'escaped'
    if(game.tension>=.3 && game.tension<=.7) game.progress=Math.min(1,game.progress+s*.12)
    if(game.progress>=1)return 'caught'
  }
  return null
}
export function hookFish(game) { if(game.phase!=='bite') return false;game.phase='reeling';game.tension=.5;return true }
