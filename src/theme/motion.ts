import type { Transition, Variants } from 'motion/react'

export const springUi: Transition = { type: 'spring', stiffness: 520, damping: 34, mass: 0.8 }

export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 26 }

export const springPop: Transition = { type: 'spring', stiffness: 600, damping: 18 }

export const screenVariants: Variants = {
  initial: { opacity: 0, y: 18, filter: 'blur(4px)' },
  enter: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...springUi, opacity: { duration: 0.22 } } },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)', transition: { duration: 0.14, ease: 'easeIn' } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: springUi },
}

export const stagger = (delayChildren = 0.04, staggerChildren = 0.05): Variants => ({
  hidden: {},
  show: { transition: { delayChildren, staggerChildren } },
})
