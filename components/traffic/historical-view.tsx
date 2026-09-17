"use client"

import { useMemo } from "react"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { classifyCongestion, type TrafficRecord } from "@/lib/traffic-data"
import { CongestionLegend } from "./congestion-legend"
import { SpotlightCard } from "./effects"

interface HistoricalViewProps {
  history: TrafficRecord[]
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Heatmap: last 14 days x 24 hours, colored by congestion level.
export function HistoricalView({ history }: HistoricalViewProps) {
  const { days, grid } = useMemo(() => {
    const byDate = new Map<string, TrafficRecord[]>()
    for (const r of history) {
      if (!byDate.has(r.date)) byDate.set(r.date, [])
      byDate.get(r.date)!.push(r)
    }
    const dates = Array.from(byDate.keys()).sort().slice(-14)
    const grid = dates.map((date) => {
      const recs = byDate.get(date)!
      const hours = Array.from({ length: 24 }, (_, h) => recs.find((r) => r.hour === h)?.congestion ?? 0)
      const d = new Date(date + "T00:00:00")
      return {
        date,
        label: `${DAY_LABELS[d.getDay()]} ${d.getDate()}`,
        hours,
      }
    })
    return { days: dates, grid }
  }, [history])

  return (
    <SpotlightCard>
      <CardHeader>
        <CardTitle>Historical traffic — last {days.length} days</CardTitle>
        <CardDescription>Hourly congestion heatmap processed from historical records</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="mb-1 flex pl-12">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {grid.map((row) => (
              <div key={row.date} className="mb-1 flex items-center">
                <div className="w-12 shrink-0 pr-2 text-right text-[11px] text-muted-foreground tabular-nums">
                  {row.label}
                </div>
                <div className="flex flex-1 gap-0.5">
                  {row.hours.map((c, h) => (
                    <div
                      key={h}
                      className="h-5 flex-1 rounded-[3px]"
                      style={{ backgroundColor: classifyCongestion(c).color, opacity: 0.35 + (c / 100) * 0.65 }}
                      title={`${row.label} · ${h}:00 · ${Math.round(c)} idx`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <CongestionLegend />
      </CardContent>
    </SpotlightCard>
  )
}
