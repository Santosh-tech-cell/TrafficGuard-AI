"use client"

import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import { SpotlightCard } from "./effects"
import type { SegmentSummary } from "@/lib/prediction"

interface LocationAnalysisProps {
  summaries: SegmentSummary[]
  selectedId: string
  onSelect: (id: string) => void
}

export function LocationAnalysis({ summaries, selectedId, onSelect }: LocationAnalysisProps) {
  return (
    <SpotlightCard>
      <CardHeader>
        <CardTitle>Location-based analysis</CardTitle>
        <CardDescription>Current congestion across all monitored road segments — highest first</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {summaries.map((s, i) => {
          const active = s.id === selectedId
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-pressed={active}
              className={`fc-reveal group w-full rounded-lg border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${
                active ? "border-primary bg-accent shadow-sm" : "hover:border-primary/40 hover:bg-muted/60"
              }`}
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin
                    className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    style={active ? { color: s.color } : undefined}
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.zone} · {s.currentSpeed} km/h now
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">{s.currentCongestion}</span>
                  <Badge variant="secondary" style={{ color: s.color }}>
                    {s.level}
                  </Badge>
                </div>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full origin-left rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${s.currentCongestion}%`, backgroundColor: s.color }}
                />
              </div>
            </button>
          )
        })}
      </CardContent>
    </SpotlightCard>
  )
}
