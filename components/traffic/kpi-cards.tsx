import { Activity, Clock, Gauge, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { classifyCongestion } from "@/lib/traffic-data"
import type { PredictionPoint } from "@/lib/prediction"

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
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub: string
  accent?: string
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: (accent ?? "#6366f1") + "1f", color: accent ?? "#6366f1" }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="truncate text-xl font-semibold tabular-nums">{value}</p>
          <p className="truncate text-xs text-muted-foreground">{sub}</p>
        </div>
      </CardContent>
    </Card>
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
        icon={<Activity className="size-4.5" />}
        label="Current congestion"
        value={`${current}`}
        sub={`${currentCls.level} · ${currentSpeed} km/h`}
        accent={currentCls.color}
      />
      <StatCard
        icon={<TrendingUp className="size-4.5" />}
        label="Predicted peak (24h)"
        value={`${peak.predicted}`}
        sub={`Around ${peak.label}`}
        accent={classifyCongestion(peak.predicted).color}
      />
      <StatCard
        icon={<Gauge className="size-4.5" />}
        label="Avg. confidence"
        value={`${avgConfidence}%`}
        sub="Across 24h forecast"
        accent="#6366f1"
      />
      <StatCard
        icon={<Clock className="size-4.5" />}
        label="Best travel window"
        value={bestWindow.label}
        sub={`Typically ~${bestWindow.avg} index`}
        accent="#10b981"
      />
    </div>
  )
}
