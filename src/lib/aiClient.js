let worker = null
let sequence = 0
const pending = new Map()

function getWorker() {
  if (worker) return worker

  worker = new Worker(new URL('../workers/ai.worker.js', import.meta.url), {
    type: 'module',
  })

  worker.onmessage = (event) => {
    const message = event.data
    const request = pending.get(message.id)
    if (!request) return

    if (message.type === 'progress') {
      request.onProgress?.(message)
      return
    }

    pending.delete(message.id)

    if (message.type === 'result') {
      request.resolve(message)
    } else if (message.type === 'error') {
      request.reject(new Error(message.message))
    }
  }

  worker.onerror = (event) => {
    const error = new Error(event.message || 'AI Worker gagal dimuat.')
    for (const request of pending.values()) request.reject(error)
    pending.clear()
  }

  return worker
}

export function runAI(action, payload, { onProgress, transfer = [] } = {}) {
  const instance = getWorker()
  const id = ++sequence

  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject, onProgress })
    instance.postMessage({ id, action, payload }, transfer)
  })
}

export function supportsWebGPU() {
  return typeof navigator !== 'undefined' && 'gpu' in navigator
}

export function supportsWebGL() {
  if (typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl'),
    )
  } catch {
    return false
  }
}
