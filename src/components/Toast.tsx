'use client'
import { useEffect, useState } from 'react'

interface ToastProps {
  message: string
  visible: boolean
  animKey: number
}

export function Toast({ message, visible, animKey }: ToastProps) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    if (!visible) return
    setExiting(false)
    const t = setTimeout(() => setExiting(true), 1700)
    return () => clearTimeout(t)
  }, [visible])

  if (!visible && !exiting) return null

  return (
    <div
      key={animKey}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg text-white text-sm font-medium shadow-lg ${
        exiting ? 'recall-toast-exit' : 'recall-toast-enter'
      }`}
      style={{ background: '#534AB7' }}
    >
      <span>✓</span>
      <span>{message}</span>
    </div>
  )
}
