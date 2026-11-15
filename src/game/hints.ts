// Pure UI text rules: keep their priority independent of rendering and input.
export function getBikeHint({ bikeQuest, bikeClean, ragTaken, droppedRag }: { bikeQuest?: boolean; bikeClean?: boolean; ragTaken?: boolean; droppedRag?: unknown }) {
  if (!bikeQuest || bikeClean) return ''
  if (ragTaken) return 'ДОП. ЗАДАНИЕ: ВЫБЕРИ ТРЯПКУ И ОТМОЙ ПИТБАЙК'
  if (droppedRag) return 'ДОП. ЗАДАНИЕ: ПОДБЕРИ ВЫБРОШЕННУЮ ТРЯПКУ'
  return 'ДОП. ЗАДАНИЕ: НАЙДИ ТРЯПКУ В ВАННОЙ'
}

export function getQuestHint({ questState, questStatus, location, witchAngry, witchAngryReason, stashState, stage, shovel, shovelUsed, note }: { questState?: string; questStatus?: string; location?: string; witchAngry?: boolean; witchAngryReason?: string; stashState?: string; stage?: number; shovel?: boolean; shovelUsed?: boolean; note?: boolean }) {
  if (['tail', 'escort_forest', 'escort_village', 'escort_hut', 'heist', 'rod_search', 'chairs'].includes(questState ?? '')) return questStatus
  if (questState === 'tail_ready') return location === 'forest' ? 'ПОДОЙДИ К ВОСТОЧНОМУ ВХОДУ В ЛЕС И НАЖМИ E, ЧТОБЫ НАЧАТЬ СЛЕЖКУ' : 'ПОРУЧЕНИЕ 1: ВЫЙДИ ИЗ ОБЩЕСТВА В ЛЕС'
  if (questState === 'report1') return 'ПОРУЧЕНИЕ ВЫПОЛНЕНО: ВЕРНИСЬ К КАПИТАНУ КУКУ В ОБЩЕСТВО'
  if (questState === 'heist_ready') return 'ПОРУЧЕНИЕ 2: НАЙДИ ОСОБНЯК НА ВОСТОКЕ ДЕРЕВНИ И ВОЙДИ В ДВЕРЬ'
  if (questState === 'report2') return 'СТУЛ ДОБЫТ: ВЕРНИСЬ К КАПИТАНУ КУКУ В ОБЩЕСТВО'
  if (witchAngry) return witchAngryReason === 'lost_cannabis' ? 'КАННАБИС ОСТАЛСЯ У ПОЛИЦИИ. ИЩИ ДРУГОЙ ПУТЬ В ДЕРЕВНЕ И ЛЕСУ' : 'ГАДАЛКА ОТКАЗАЛАСЬ ПОМОГАТЬ ПОСЛЕ КРАЖИ. ИЩИ ДРУГИЕ ПУТИ В ДЕРЕВНЕ И ЛЕСУ'
  if (stashState === 'witch' && stage !== undefined && stage < 2) return 'ГАДАЛКА САМА ЗАБРАЛА КЛАД. ПОГОВОРИ С НЕЙ В ДЕРЕВНЕ'
  if (stage === 0) return 'ОСНОВНОЕ ЗАДАНИЕ: НАЙДИ ГАДАЛКУ В ДЕРЕВНЕ'
  if (stage === 1 && shovel && shovelUsed) return 'ЛОПАТА СЛОМАЛАСЬ. ИЩИ ДРУГОЙ ПУТЬ'
  if (stage === 1) return !shovel ? 'ОСНОВНОЕ ЗАДАНИЕ: ВОЗЬМИ ЛОПАТУ В ДОМЕ ГАДАЛКИ' : note ? 'ДЛЯ ФОТОГРАФИИ И КОПАНИЯ ВЫБЕРИ ПРЕДМЕТ В ИНВЕНТАРЕ И НАЖМИ R' : 'ОСНОВНОЕ ЗАДАНИЕ: НАЙДИ ФОТОГРАФИЮ У ГАДАЛКИ'
  if (stage === 2) return 'ОСНОВНОЕ ЗАДАНИЕ: ВЕРНИ НАХОДКУ ГАДАЛКЕ'
  if (stage === 3) return 'ОСНОВНОЕ ЗАДАНИЕ: ВЕРНИСЬ ДОМОЙ И ВЫСПИСЬ'
  return ''
}
