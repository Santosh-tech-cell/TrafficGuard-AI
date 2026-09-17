// Client-side statistical prediction model.
// Uses historical same-hour / same-day-type samples to forecast future congestion,
// with a confidence score derived from sample variance and sample count.

import {
  classifyCongestion,
  getSegmentHistory,
  weatherMultiplier,
  type CongestionLevel,
  type TrafficRecord,
  type WeatherCondition,
} from "./traffic-data"

export interface PredictionPoint {
  hour: number
  label: string // e.g. "3 PM"
  isWeekend: boolean
  predicted: number
  low: number // confidence band lower
  high: number // confidence band upper
  confidence: number // 0..100
  level: CongestionLevel
  color: string
}

export interface HourlyStat {
  hour: number
  label: string
  avg: number
  level: CongestionLevel
  color: string
}

// Average weather multiplier baked into the raw historical data.
const HISTORICAL_WEATHER_BASELINE = 1.12

function hourLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  const ampm = h < 12 ? "AM" : "PM"
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display} ${ampm}`
}

function mean(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function stdDev(nums: number[], m: number): number {
  if (nums.length < 2) return 12
  const variance = nums.reduce((a, b) => a + (b - m) ** 2, 0) / (nums.length - 1)
  return Math.sqrt(variance)
}

interface PredictOptions {
  weather: WeatherCondition
  hasEvent: boolean
}

/**
 * Predict congestion for the next `hours` hours starting from the next full hour.
 */
export function predictNextHours(segmentId: string, hours: number, opts: PredictOptions): PredictionPoint[] {
  const history = getSegmentHistory(segmentId)
  const now = new Date()
  now.setMinutes(0, 0, 0)

  const points: PredictionPoint[] = []
  for (let i = 1; i <= hours; i++) {
    const t = new Date(now)
    t.setHours(now.getHours() + i)
    const hour = t.getHours()
    const dow = t.getDay()
    const isWeekend = dow === 0 || dow === 6

    // gather matching historical samples
    const samples = history
      .filter((r) => r.hour === hour && r.isWeekend === isWeekend)
      .map((r) => r.congestion)

    const m = mean(samples)
    const sd = stdDev(samples, m)

    // adjust the historical mean toward the selected weather scenario
    const weatherAdj = weatherMultiplier(opts.weather) / HISTORICAL_WEATHER_BASELINE
    let predicted = m * weatherAdj
    if (opts.hasEvent && hour >= 11 && hour <= 22) {
      predicted += 22
    }
    predicted = Math.max(2, Math.min(99, predicted))

    // confidence: lower variance + more samples => higher confidence
    const samplePenalty = samples.length < 8 ? 10 : 0
    const confidence = Math.max(45, Math.min(98, 100 - sd * 2.1 - samplePenalty))
    const band = sd * 1.15

    const cls = classifyCongestion(predicted)
    points.push({
      hour,
      label: hourLabel(hour),
      isWeekend,
      predicted: Math.round(predicted),
      low: Math.round(Math.max(0, predicted - band)),
      high: Math.round(Math.min(100, predicted + band)),
      confidence: Math.round(confidence),
      level: cls.level,
      color: cls.color,
    })
  }
  return points
}

/** Average congestion by hour-of-day, optionally filtered by day type. */
export function hourlyAverages(segmentId: string, filter: "all" | "weekday" | "weekend" = "all"): HourlyStat[] {
  const history = getSegmentHistory(segmentId)
  const out: HourlyStat[] = []
  for (let h = 0; h < 24; h++) {
    const vals = history
      .filter((r) => r.hour === h)
      .filter((r) => (filter === "all" ? true : filter === "weekend" ? r.isWeekend : !r.isWeekend))
      .map((r) => r.congestion)
    const avg = mean(vals)
    const cls = classifyCongestion(avg)
    out.push({ hour: h, label: hourLabel(h), avg: Math.round(avg), level: cls.level, color: cls.color })
  }
  return out
}

export interface PeakWindow {
  label: string
  startHour: number
  endHour: number
  avg: number
  color: string
  level: CongestionLevel
}

/** Identify the top congested contiguous windows in a day. */
export function identifyPeaks(segmentId: string, filter: "weekday" | "weekend" = "weekday"): PeakWindow[] {
  const hourly = hourlyAverages(segmentId, filter)
  const threshold = 50
  const windows: PeakWindow[] = []
  let start: number | null = null

  for (let h = 0; h < 24; h++) {
    const over = hourly[h].avg >= threshold
    if (over && start === null) start = h
    if ((!over || h === 23) && start !== null) {
      const end = over && h === 23 ? h : h - 1
      const slice = hourly.slice(start, end + 1)
      const avg = Math.round(mean(slice.map((s) => s.avg)))
      const cls = classifyCongestion(avg)
      windows.push({
        label: `${hourLabelShort(start)} – ${hourLabelShort(end + 1)}`,
        startHour: start,
        endHour: end,
        avg,
        color: cls.color,
        level: cls.level,
      })
      start = null
    }
  }
  return windows.sort((a, b) => b.avg - a.avg)
}

function hourLabelShort(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  const ampm = h < 12 ? "am" : "pm"
  const display = h % 12 === 0 ? 12 : h % 12
  return `${display}${ampm}`
}

export interface SegmentSummary {
  id: string
  name: string
  zone: string
  currentCongestion: number
  avgCongestion: number
  peakCongestion: number
  level: CongestionLevel
  color: string
  freeFlowSpeed: number
  currentSpeed: number
}

/** Current + summary stats for every segment, for the location comparison view. */
export function allSegmentSummaries(segments: { id: string; name: string; zone: string; freeFlowSpeed: number }[]): SegmentSummary[] {
  const now = new Date()
  const hour = now.getHours()
  const isWeekend = now.getDay() === 0 || now.getDay() === 6

  return segments
    .map((seg) => {
      const history = getSegmentHistory(seg.id)
      const currentSamples = history.filter((r) => r.hour === hour && r.isWeekend === isWeekend).map((r) => r.congestion)
      const allVals = history.map((r) => r.congestion)
      const current = Math.round(mean(currentSamples))
      const cls = classifyCongestion(current)
      return {
        id: seg.id,
        name: seg.name,
        zone: seg.zone,
        currentCongestion: current,
        avgCongestion: Math.round(mean(allVals)),
        peakCongestion: Math.round(Math.max(...allVals)),
        level: cls.level,
        color: cls.color,
        freeFlowSpeed: seg.freeFlowSpeed,
        currentSpeed: Math.round(Math.max(4, seg.freeFlowSpeed * (1 - current / 118))),
      }
    })
    .sort((a, b) => b.currentCongestion - a.currentCongestion)
}

/** Return the calmest travel window (lowest avg congestion) in daytime hours. */
export function bestTravelWindow(segmentId: string): { label: string; avg: number } {
  const hourly = hourlyAverages(segmentId, "weekday").filter((h) => h.hour >= 5 && h.hour <= 23)
  let best = hourly[0]
  for (const h of hourly) if (h.avg < best.avg) best = h
  return { label: best.label, avg: best.avg }
}

export function summarizeRecords(records: TrafficRecord[]) {
  return {
    count: records.length,
    avg: Math.round(mean(records.map((r) => r.congestion))),
  }
}
