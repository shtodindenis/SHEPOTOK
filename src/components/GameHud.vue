<script setup>
defineProps({ screen: String, location: String, coords: Object, note: Boolean, photo: String, photoOpen: Boolean, shovel: Boolean, shovelUsed: Boolean, near: String, dialog: Object, choice: Boolean, choiceIndex: Number, questHint: String, inventory: Array, selectedInventorySlot: Number, bikeHint: String })
const itemNames = { rag:'тряпка', shovel:'лопата', photo:'фотография', treasure:'клад' }
defineEmits(['menu', 'save-game', 'load-game', 'interact', 'next-dialog', 'dig', 'press', 'release', 'choose', 'toggle-photo', 'select-inventory', 'use-item'])
</script>

<template>
  <button v-if="screen === 'game'" class="menu-button" @click="$emit('menu')">МЕНЮ</button>
  <div v-if="screen === 'game'" class="save-buttons"><button @click="$emit('save-game')">СОХРАНИТЬ</button><button @click="$emit('load-game')">ЗАГРУЗИТЬ</button></div>
  <div v-if="screen === 'game'" class="inventory" aria-label="Инвентарь">
    <button v-for="(item, index) in inventory" :key="index" class="inventory-slot" :class="{ selected: selectedInventorySlot === index }" :aria-label="`Ячейка ${index + 1}: ${itemNames[item] || 'пусто'}`" :aria-pressed="selectedInventorySlot === index" @click="$emit('select-inventory', index)">
      <span class="inventory-number">{{ index + 1 }}</span><span v-if="item" :class="`${item}-icon`" aria-hidden="true"></span>
    </button>
    <span v-if="inventory?.[selectedInventorySlot]" class="inventory-drop-hint">R — БРОСИТЬ · Q — {{ inventory[selectedInventorySlot] === 'photo' ? 'ПОСМОТРЕТЬ' : 'ИСПОЛЬЗОВАТЬ' }}</span>
  </div>
  <div v-if="location === 'society' && screen === 'game'" class="location-label">ОБЩЕСТВО ВУАЙЕРИСТОВ</div>
  <div v-if="screen === 'game' && (questHint || bikeHint) && !dialog" class="quest-hint">{{ questHint }}<div v-if="bikeHint" class="side-quest">{{ bikeHint }}</div></div>
  <div v-if="photoOpen" class="photo-overlay" role="dialog" aria-modal="true" aria-label="Фотография тайника">
    <div class="photo-card"><div class="photo-heading">ФОТОГРАФИЯ ТАЙНИКА</div><div class="photo-image"><img :src="photo" alt="Снимок дерева рядом с тайником"><span class="photo-cross" aria-hidden="true">×</span></div><p>КРЕСТИК ОТМЕЧАЕТ МЕСТО КЛАДА</p><button @click="$emit('toggle-photo')">ЗАКРЫТЬ · Q</button></div>
  </div>
  <button v-if="screen === 'game' && near && !dialog && !choice" class="interaction" @click="$emit('interact')"><span>E</span> {{ near }}</button>
  <div v-if="dialog" class="dialog" @click="$emit('next-dialog')"><div class="dialog-head">{{ dialog.lines[dialog.index][0] }}</div><p>{{ dialog.lines[dialog.index][1] }}</p><div class="dialog-next">ДАЛЕЕ ▼</div></div>
  <div v-if="screen === 'game'" class="touch-controls"><div class="dpad"><button @pointerdown.prevent="$emit('press', 'arrowup')" @pointerup="$emit('release', 'arrowup')" @pointercancel="$emit('release', 'arrowup')" @lostpointercapture="$emit('release', 'arrowup')">▲</button><div><button @pointerdown.prevent="$emit('press', 'arrowleft')" @pointerup="$emit('release', 'arrowleft')" @pointercancel="$emit('release', 'arrowleft')" @lostpointercapture="$emit('release', 'arrowleft')">◀</button><button @pointerdown.prevent="$emit('press', 'arrowdown')" @pointerup="$emit('release', 'arrowdown')" @pointercancel="$emit('release', 'arrowdown')" @lostpointercapture="$emit('release', 'arrowdown')">▼</button><button @pointerdown.prevent="$emit('press', 'arrowright')" @pointerup="$emit('release', 'arrowright')" @pointercancel="$emit('release', 'arrowright')" @lostpointercapture="$emit('release', 'arrowright')">▶</button></div></div><div class="touch-actions"><button v-if="inventory?.[selectedInventorySlot]" @click="$emit('use-item')">Q</button><button @click="$emit('interact')">E</button></div></div>
  <div v-if="choice" class="choice-screen"><div class="choice-box"><p>Нырнуть в колодец?</p><button :class="{ selected: choiceIndex === 0 }" @click="$emit('choose', true)">НЫРНУТЬ</button><button :class="{ selected: choiceIndex === 1 }" @click="$emit('choose', false)">НЕ СЕЙЧАС</button></div></div>
</template>
