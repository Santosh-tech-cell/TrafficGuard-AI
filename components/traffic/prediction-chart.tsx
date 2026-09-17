"use client"

import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, XAxis, YAxis } from "recharts"
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { CongestionLegend } from "./congestion-legend"
import { SpotlightCard } from "./effects"
import type { PredictionPoint } from "@/lib/prediction"

const chartConfig = {
  predicted: { label: "Predicted", color: "#6366f1" },
  band: { label: "Confidence range", color: "#6366f1" },
}

interface PredictionChartProps {
  data: PredictionPoint[]
}

function PredictionTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null
  const p: PredictionPoint = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="mb-1 text-sm font-medium">{p.label}</p>
      <div className="flex items-center gap-1.5 text-sm">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: p.color }} />
        <span className="font-semibold tabular-nums">{p.predicted}</span>
        <span className="text-muted-foreground">index · {p.level}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground tabular-nums">
        Range {p.low}–{p.high} · {p.confidence}% confidence
      </p>
    </div>
  )
}

export function PredictionChart({ data }: PredictionChartProps) {
  const chartData = data.map((p) => ({
    ...p,
    bandLow: p.low,
    bandSpan: Math.max(0, p.high - p.low),
  }))

  return (
    <SpotlightCard>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>24-hour congestion forecast</CardTitle>
          <CardDescription>Predicted congestion index with confidence range</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <AreaChart data={chartData} margin={{ left: -12, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fillPredicted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} fontSize={12} />
            <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} width={40} fontSize={12} />
            <ReferenceLine y={40} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine y={60} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.5} />
            <ChartTooltip content={<PredictionTooltip />} />
            {/* invisible base to offset the band */}
            <Area dataKey="bandLow" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
            <Area dataKey="bandSpan" stackId="band" stroke="none" fill="#6366f1" fillOpacity={0.12} isAnimationActive={false} />
            <Area
              dataKey="predicted"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#fillPredicted)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
        <div className="mt-4">
          <CongestionLegend />
        </div>
      </CardContent>
    </SpotlightCard>
  )
}
