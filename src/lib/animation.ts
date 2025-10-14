const baseDuration = 0.2
const baseEase = [0.16, 1, 0.3, 1] as const

export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: baseDuration, ease: baseEase },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: baseDuration, ease: baseEase },
  },
}

export const cardTransition = {
  layout: true,
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, ease: baseEase },
  },
}

export const modalVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.16, ease: baseEase } },
    exit: { opacity: 0, transition: { duration: 0.16, ease: baseEase } },
  },
  panel: {
    initial: { opacity: 0, scale: 0.96 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.18, ease: baseEase },
    },
    exit: {
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.16, ease: baseEase },
    },
  },
}

export const heartVariants = {
  initial: { scale: 1, opacity: 0.75 },
  animate: { scale: 1.1, opacity: 1, transition: { duration: 0.18 } },
  reset: { scale: 1, opacity: 0.75, transition: { duration: 0.18 } },
}
