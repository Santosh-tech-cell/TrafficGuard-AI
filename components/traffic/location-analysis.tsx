"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"
import type { SegmentSummary } from "@/lib/prediction"

interface LocationAnalysisProps {
  summaries: SegmentSummary[]
  selectedId: string
  onSelect: (id: string) => void
}

export function LocationAnalysis({ summaries, selectedId, onSelect }: LocationAnalysisProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Location-based analysis</CardTitle>
        <CardDescription>Current congestion across all monitored road segments — highest first</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {summaries.map((s) => {
          const active = s.id === selectedId
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s.id)}
              aria-pressed={active}
              className={`w-full rounded-lg border p-3 text-left transition-colors ${
                active ? "border-primary bg-accent" : "hover:bg-muted/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
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
                  className="h-full rounded-full transition-all"
                  style={{ width: `${s.currentCongestion}%`, backgroundColor: s.color }}
                />
              </div>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
