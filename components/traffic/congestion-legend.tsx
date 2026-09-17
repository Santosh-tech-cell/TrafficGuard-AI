import { CONGESTION_LEVELS } from "@/lib/traffic-data"

export function CongestionLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {CONGESTION_LEVELS.map((l) => (
        <div key={l.level} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: l.color }} aria-hidden />
          <span className="text-xs text-muted-foreground">{l.level}</span>
        </div>
      ))}
    </div>
  )
}
