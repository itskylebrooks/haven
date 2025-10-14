const STORAGE_KEY = 'haven:v1'
const VERSION = 1

type StoredPayload<T> = {
  version: number
  data: T
}

export const loadState = <T>(fallback: T): T => {
  if (typeof window === 'undefined') {
    return fallback
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return fallback
    }

    const parsed = JSON.parse(raw) as StoredPayload<T>
    if (parsed.version !== VERSION || !parsed.data) {
      return fallback
    }

    return parsed.data
  } catch (error) {
    console.error('Failed to load Haven state', error)
    return fallback
  }
}

export const saveState = <T>(data: T) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    const payload: StoredPayload<T> = {
      version: VERSION,
      data,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch (error) {
    console.error('Failed to save Haven state', error)
  }
}

export const clearState = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(STORAGE_KEY)
}
