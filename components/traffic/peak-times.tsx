"use client"

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import type { HourlyStat, PeakWindow } from "@/lib/prediction"

interface PeakTimesProps {
  hourly: HourlyStat[]
  peaks: PeakWindow[]
  dayType: "weekday" | "weekend"
}

function PeakTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const p: HourlyStat = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-sm font-medium">{p.label}</p>
      <div className="mt-1 flex items-center gap-1.5 text-sm">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
        <span className="font-semibold tabular-nums">{p.avg}</span>
        <span className="text-muted-foreground">· {p.level}</span>
      </div>
    </div>
  )
}

export function PeakTimes({ hourly, peaks, dayType }: PeakTimesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Peak-time identification</CardTitle>
        <CardDescription>
          Average congestion by hour of day — {dayType === "weekday" ? "weekdays" : "weekends"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ChartContainer
          config={{ avg: { label: "Avg congestion", color: "#6366f1" } }}
          className="aspect-auto h-[260px] w-full"
        >
          <BarChart data={hourly} margin={{ left: -12, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              interval={1}
              tickFormatter={(h) => {
                const hh = Number(h)
                const ampm = hh < 12 ? "a" : "p"
                const d = hh % 12 === 0 ? 12 : hh % 12
                return `${d}${ampm}`
              }}
            />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} width={40} fontSize={12} />
            <ChartTooltip content={<PeakTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
            <Bar dataKey="avg" radius={[4, 4, 0, 0]}>
              {hourly.map((h) => (
                <Cell key={h.hour} fill={h.color} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        <div>
          <p className="mb-2 text-sm font-medium">Congested windows to avoid</p>
          {peaks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sustained congestion peaks on {dayType}s.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {peaks.map((w) => (
                <div
                  key={w.label}
                  className="flex items-center justify-between rounded-lg border bg-card px-3 py-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: w.color }} aria-hidden />
                    <span className="text-sm font-medium tabular-nums">{w.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" style={{ color: w.color }}>
                      {w.level}
                    </Badge>
                    <span className="text-sm text-muted-foreground tabular-nums">{w.avg} idx</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
