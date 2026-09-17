"use client"

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * A soft radial light fixed to the viewport that follows the cursor.
 * Mounted once near the root; sits behind content (z-0).
 */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--cx", `${e.clientX}px`)
        el.style.setProperty("--cy", `${e.clientY}px`)
        el.style.opacity = "1"
      })
    }
    const onLeave = () => {
      el.style.opacity = "0"
    }
    window.addEventListener("mousemove", onMove)
    document.addEventListener("mouseleave", onLeave)
    return () => {
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return <div ref={ref} aria-hidden className="fc-cursor-glow fc-accent-var" />
}

/**
 * A Card that tracks the cursor and renders a spotlight glow toward it,
 * plus a subtle hover lift. Drop-in replacement for the shadcn Card.
 */
export function SpotlightCard({ className, ...props }: ComponentProps<typeof Card>) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty("--mx", `${e.clientX - r.left}px`)
    el.style.setProperty("--my", `${e.clientY - r.top}px`)
  }
  return <Card onMouseMove={onMove} className={cn("fc-spotlight fc-lift fc-accent-var", className)} {...props} />
}

/**
 * Wraps children in a staggered fade-up entrance animation.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <div className={cn("fc-reveal", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/**
 * Animates a number from 0 (on mount) or from its previous value toward `value`.
 */
export function AnimatedNumber({
  value,
  duration = 900,
  decimals = 0,
  className,
}: {
  value: number
  duration?: number
  decimals?: number
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const to = value
    if (from === to) {
      setDisplay(to)
      return
    }
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return (
    <span className={cn("tabular-nums", className)}>
      {decimals > 0 ? display.toFixed(decimals) : Math.round(display)}
    </span>
  )
}

/**
 * A small pulsing "live" indicator dot with an expanding ring.
 */
export function LiveDot({ color = "#10b981" }: { color?: string }) {
  return (
    <span className="relative flex size-2">
      <span
        className="absolute inline-flex size-full rounded-full"
        style={{ backgroundColor: color, animation: "fc-pulse-ring 1.8s ease-out infinite" }}
      />
      <span
        className="relative inline-flex size-2 rounded-full"
        style={{ backgroundColor: color, animation: "fc-pulse-dot 1.8s ease-in-out infinite" }}
      />
    </span>
  )
}
