import { useEffect, useState } from 'react'

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const timeAgo = (timestamp: number, now: number = Date.now()): string => {
  const delta = Math.max(0, now - timestamp)

  if (delta < 45 * SECOND) {
    return 'just now'
  }

  if (delta < 90 * SECOND) {
    return '1m'
  }

  if (delta < 45 * MINUTE) {
    const minutes = Math.round(delta / MINUTE)
    return `${minutes}m`
  }

  if (delta < 90 * MINUTE) {
    return '1h'
  }

  if (delta < 22 * HOUR) {
    const hours = Math.round(delta / HOUR)
    return `${hours}h`
  }

  if (delta < 36 * HOUR) {
    return '1d'
  }

  const days = Math.round(delta / DAY)
  return `${days}d`
}

export const useMinuteTicker = () => {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((value) => value + 1)
    }, 60 * 1000)

    return () => {
      window.clearInterval(id)
    }
  }, [])

  return tick
}
