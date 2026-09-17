import { Activity, Clock, Gauge, TrendingUp } from "lucide-react"
import { CardContent } from "@/components/ui/card"
import { classifyCongestion } from "@/lib/traffic-data"
import type { PredictionPoint } from "@/lib/prediction"
import { AnimatedNumber, Reveal, SpotlightCard } from "./effects"

interface KpiCardsProps {
  current: number
  currentSpeed: number
  predictions: PredictionPoint[]
  avgConfidence: number
  bestWindow: { label: string; avg: number }
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  delay,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  sub: string
  accent?: string
  delay: number
}) {
  const color = accent ?? "#6366f1"
  return (
    <Reveal delay={delay} className="h-full">
      <SpotlightCard className="group relative h-full overflow-hidden" style={{ "--fc-accent": color } as React.CSSProperties}>
        <CardContent className="flex items-start gap-3 p-4">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: color + "1f", color }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
            <p className="truncate text-xs text-muted-foreground">{sub}</p>
          </div>
        </CardContent>
      </SpotlightCard>
    </Reveal>
  )
}

export function KpiCards({ current, currentSpeed, predictions, avgConfidence, bestWindow }: KpiCardsProps) {
  const currentCls = classifyCongestion(current)
  const peak = predictions.reduce(
    (max, p) => (p.predicted > max.predicted ? p : max),
    predictions[0] ?? { predicted: 0, label: "--" },
  )

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        delay={0}
        icon={<Activity className="size-4.5" />}
        label="Current congestion"
        value={<AnimatedNumber value={current} />}
        sub={`${currentCls.level} · ${currentSpeed} km/h`}
        accent={currentCls.color}
      />
      <StatCard
        delay={80}
        icon={<TrendingUp className="size-4.5" />}
        label="Predicted peak (24h)"
        value={<AnimatedNumber value={peak.predicted} />}
        sub={`Around ${peak.label}`}
        accent={classifyCongestion(peak.predicted).color}
      />
      <StatCard
        delay={160}
        icon={<Gauge className="size-4.5" />}
        label="Avg. confidence"
        value={
          <>
            <AnimatedNumber value={avgConfidence} />%
          </>
        }
        sub="Across 24h forecast"
        accent="#6366f1"
      />
      <StatCard
        delay={240}
        icon={<Clock className="size-4.5" />}
        label="Best travel window"
        value={bestWindow.label}
        sub={`Typically ~${bestWindow.avg} index`}
        accent="#10b981"
      />
    </div>
  )
}
