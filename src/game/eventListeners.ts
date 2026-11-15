// Keep every global listener paired with its removal, including listeners added
// after an asynchronous initialization has completed.
export function createEventListeners() {
  const removers: (() => void)[] = []
  let disposed = false
  return {
    add(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
      if (disposed) return
      target.addEventListener(type, listener, options)
      removers.push(() => target.removeEventListener(type, listener, options))
    },
    dispose() {
      if (disposed) return
      disposed = true
      for (const remove of removers.splice(0).reverse()) remove()
    },
  }
}
