import { computed, type Ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useInterfaceStore } from '../stores/interface.ts'
import { useProgressStore } from '../stores/progress.ts'
import { useSessionStore } from '../stores/session.ts'
import { capacityForDay, requiredMushrooms } from './arthouse.ts'
import { getQuestHint } from './hints.ts'

export function useQuestHint(questStatus: Ref<string>, detentionNotice: Ref<string>) {
  const { location } = storeToRefs(useInterfaceStore())
  const { questState, witchAngry, stashState, stage, shovel, shovelUsed, note } = storeToRefs(useProgressStore())
  const { arrest, arthouse, detention, collection, witchAngryReason } = storeToRefs(useSessionStore())
  return computed(() => {
    if (arrest.value) return 'ПОЛИЦЕЙСКИЙ ПОДХОДИТ К ТИГРАНУ'
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
    return getQuestHint({ questState:questState.value, questStatus:questStatus.value, location:location.value, witchAngry:witchAngry.value, witchAngryReason:witchAngryReason.value ?? undefined, stashState:stashState.value, stage:stage.value, shovel:shovel.value, shovelUsed:shovelUsed.value, note:note.value })
  })
}
