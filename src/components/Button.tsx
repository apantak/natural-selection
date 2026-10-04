import type { ComponentProps } from 'react'
import { motion } from 'motion/react'
import { springUi } from '../theme/motion'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export interface ButtonProps extends ComponentProps<typeof motion.button> {
  variant?: ButtonVariant
  size?: 'md' | 'lg'
  block?: boolean
}

export function Button({ variant = 'primary', size = 'lg', block = false, className, type = 'button', disabled, ...rest }: ButtonProps) {
  const classes = ['btn', `btn--${variant}`, `btn--${size}`, block && 'btn--block', className].filter(Boolean).join(' ')
  return (
    <motion.button
      type={type}
      className={classes}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.96 }}
      transition={springUi}
      {...rest}
    />
  )
}
