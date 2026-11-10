export function reconcileInventory(slots, owned) {
  const allowed = new Set(owned), seen = new Set()
  const result = Array.from({length:6}, (_, i) => {
    const item = Array.isArray(slots) ? slots[i] : null
    if (!allowed.has(item) || seen.has(item)) return null
    seen.add(item); return item
  })
  for(const item of owned) if (!seen.has(item)) {
    const index=result.indexOf(null)
    if(index>=0) { result[index]=item; seen.add(item) }
  }
  return result
}
