"use client"

import { useMemo, useState } from "react"
import { CloudRain, Waypoints } from "lucide-react"
import {
  ROAD_SEGMENTS,
  WEATHER_OPTIONS,
  getSegmentHistory,
  type WeatherCondition,
} from "@/lib/traffic-data"
import {
  allSegmentSummaries,
  bestTravelWindow,
  hourlyAverages,
  identifyPeaks,
  predictNextHours,
} from "@/lib/prediction"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CardContent } from "@/components/ui/card"
import { KpiCards } from "./kpi-cards"
import { PredictionChart } from "./prediction-chart"
import { PeakTimes } from "./peak-times"
import { LocationAnalysis } from "./location-analysis"
import { HistoricalView } from "./historical-view"
import { CursorGlow, LiveDot, Reveal, SpotlightCard } from "./effects"

export function Dashboard() {
  const [segmentId, setSegmentId] = useState(ROAD_SEGMENTS[0].id)
  const [weather, setWeather] = useState<WeatherCondition>("Clear")
  const [hasEvent, setHasEvent] = useState(false)
  const [dayType, setDayType] = useState<"weekday" | "weekend">("weekday")

  const segment = ROAD_SEGMENTS.find((s) => s.id === segmentId)!

  const predictions = useMemo(
    () => predictNextHours(segmentId, 24, { weather, hasEvent }),
    [segmentId, weather, hasEvent],
  )

  const history = useMemo(() => getSegmentHistory(segmentId), [segmentId])
  const hourly = useMemo(() => hourlyAverages(segmentId, dayType), [segmentId, dayType])
  const peaks = useMemo(() => identifyPeaks(segmentId, dayType), [segmentId, dayType])
  const best = useMemo(() => bestTravelWindow(segmentId), [segmentId])

  const summaries = useMemo(
    () =>
      allSegmentSummaries(
        ROAD_SEGMENTS.map((s) => ({ id: s.id, name: s.name, zone: s.zone, freeFlowSpeed: s.freeFlowSpeed })),
      ),
    [],
  )

  const avgConfidence = Math.round(
    predictions.reduce((a, p) => a + p.confidence, 0) / (predictions.length || 1),
  )
  const currentSummary = summaries.find((s) => s.id === segmentId)!

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-8">
      <CursorGlow />
      {/* Header */}
      <header className="fc-reveal mb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform duration-300 hover:scale-105 hover:rotate-3">
            <Waypoints className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight md:text-2xl">FlowCast</h1>
              <LiveDot />
            </div>
            <p className="text-sm text-muted-foreground">AI Traffic Congestion Prediction</p>
          </div>
        </div>
      </header>

      {/* Controls */}
      <SpotlightCard className="fc-reveal mb-6" style={{ animationDelay: "80ms" }}>
        <CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Road segment</label>
            <Select value={segmentId} onValueChange={setSegmentId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROAD_SEGMENTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full space-y-1.5 lg:w-44">
            <label className="text-xs font-medium text-muted-foreground">Weather scenario</label>
            <Select value={weather} onValueChange={(v) => setWeather(v as WeatherCondition)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEATHER_OPTIONS.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <button
            type="button"
            onClick={() => setHasEvent((v) => !v)}
            aria-pressed={hasEvent}
            className={`flex h-9 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors ${
              hasEvent
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted"
            }`}
          >
            <CloudRain className={`size-4 ${hasEvent ? "animate-pulse" : ""}`} />
            Major event {hasEvent ? "on" : "off"}
          </button>
        </CardContent>
      </SpotlightCard>

      {/* KPIs */}
      <div className="mb-6">
        <KpiCards
          current={currentSummary.currentCongestion}
          currentSpeed={currentSummary.currentSpeed}
          predictions={predictions}
          avgConfidence={avgConfidence}
          bestWindow={best}
        />
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Reveal delay={220}>
            <PredictionChart data={predictions} />
          </Reveal>

          <Tabs defaultValue="peaks" className="fc-reveal" style={{ animationDelay: "300ms" }}>
            <div className="flex items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="peaks">Peak times</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
                <TabsTrigger value="confidence">Confidence</TabsTrigger>
              </TabsList>
              <Select value={dayType} onValueChange={(v) => setDayType(v as "weekday" | "weekend")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekday">Weekdays</SelectItem>
                  <SelectItem value="weekend">Weekends</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="peaks" className="mt-4">
              <PeakTimes hourly={hourly} peaks={peaks} dayType={dayType} />
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <HistoricalView history={history} />
            </TabsContent>
            <TabsContent value="confidence" className="mt-4">
              <ConfidenceView predictions={predictions} segmentName={segment.name} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="lg:col-span-1">
          <Reveal delay={360}>
            <LocationAnalysis summaries={summaries} selectedId={segmentId} onSelect={setSegmentId} />
          </Reveal>
        </div>
      </div>

      <p className="fc-reveal mt-8 text-center text-xs text-muted-foreground" style={{ animationDelay: "420ms" }}>
        Predictions generated by a client-side statistical model on synthetic historical data · FlowCast
      </p>
    </div>
  )
}

function ConfidenceView({
  predictions,
  segmentName,
}: {
  predictions: import("@/lib/prediction").PredictionPoint[]
  segmentName: string
}) {
  return (
    <SpotlightCard>
      <CardContent className="p-4">
        <p className="mb-1 text-sm font-medium">Prediction confidence</p>
        <p className="mb-4 text-xs text-muted-foreground">
          Hourly forecast reliability for {segmentName}, based on historical variance and sample size
        </p>
        <div className="space-y-2">
          {predictions.map((p, i) => (
            <div
              key={p.hour + "-" + p.label}
              className="fc-reveal flex items-center gap-3"
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">{p.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full origin-left rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${p.confidence}%`,
                    backgroundColor: p.confidence >= 80 ? "#10b981" : p.confidence >= 65 ? "#f59e0b" : "#f97316",
                  }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums">{p.confidence}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </SpotlightCard>
  )
}
