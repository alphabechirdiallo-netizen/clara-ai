'use client'

import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

// Page transition wrapper
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Staggered list items
export function StaggerList({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode[]
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05, delayChildren: delay } },
      }}
    >
      {children.map((child, i) => (
        <motion.div
          key={i}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

// Fade in on mount
export function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Slide up on mount
export function SlideUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Scale in
export function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Animated counter
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 100, damping: 30 })

  useEffect(() => {
    motionVal.set(value)
  }, [value])

  return (
    <motion.span className={className}>
      {Math.round(value)}
    </motion.span>
  )
}

// Pulse dot
export function PulseDot({ color = '#f97316', size = 8 }: { color?: string; size?: number }) {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.3 }}
        animate={{ scale: [1, 2, 1], opacity: [0.3, 0, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
      />
    </motion.div>
  )
}

// Shimmer loading skeleton
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-[#18181b] rounded-lg ${className}`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

// Animated typing indicator for Clara thinking
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-[#18181b] border border-[#2e2e35] w-fit">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#71717a]"
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Toast notification
export function Toast({
  message,
  type = 'info',
  onClose,
}: {
  message: string
  type?: 'info' | 'success' | 'error' | 'warning'
  onClose?: () => void
}) {
  const colors = {
    info: 'border-[#2e2e35] text-[#a1a1aa]',
    success: 'border-green-500/20 text-green-400',
    error: 'border-red-500/20 text-red-400',
    warning: 'border-yellow-500/20 text-yellow-400',
  }

  useEffect(() => {
    if (onClose) {
      const t = setTimeout(onClose, 3500)
      return () => clearTimeout(t)
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`px-4 py-3 rounded-xl bg-[#18181b] border text-sm font-medium shadow-xl ${colors[type]}`}
    >
      {message}
    </motion.div>
  )
}
