// Synthetic traffic data model + generation.
// Deterministic (seeded) so the dashboard is stable across renders.

export type WeatherCondition = "Clear" | "Cloudy" | "Rain" | "Storm"

export type CongestionLevel = "Free Flow" | "Light" | "Moderate" | "Heavy" | "Severe"

export interface RoadSegment {
  id: string
  name: string
  zone: "Downtown" | "Highway" | "Commercial" | "Residential"
  lengthKm: number
  freeFlowSpeed: number // km/h
  baseline: number // baseline congestion index
  peak: number // 0..1 peak sensitivity
}

export interface TrafficRecord {
  timestamp: number
  date: string
  hour: number
  dayOfWeek: number // 0 = Sunday
  isWeekend: boolean
  congestion: number // 0..100 index
  level: CongestionLevel
  speed: number // km/h
  weather: WeatherCondition
  hasEvent: boolean
}

export const ROAD_SEGMENTS: RoadSegment[] = [
  { id: "downtown-main", name: "Downtown Core — Main St", zone: "Downtown", lengthKm: 3.2, freeFlowSpeed: 50, baseline: 14, peak: 0.72 },
  { id: "harbor-bridge", name: "Harbor Bridge", zone: "Highway", lengthKm: 5.8, freeFlowSpeed: 90, baseline: 10, peak: 0.68 },
  { id: "airport-expy", name: "Airport Expressway", zone: "Highway", lengthKm: 12.4, freeFlowSpeed: 100, baseline: 8, peak: 0.55 },
  { id: "university-ave", name: "University Avenue", zone: "Commercial", lengthKm: 4.1, freeFlowSpeed: 45, baseline: 16, peak: 0.6 },
  { id: "riverside-dr", name: "Riverside Drive", zone: "Residential", lengthKm: 6.0, freeFlowSpeed: 40, baseline: 9, peak: 0.42 },
  { id: "tech-park-loop", name: "Tech Park Loop", zone: "Commercial", lengthKm: 3.7, freeFlowSpeed: 55, baseline: 12, peak: 0.64 },
  { id: "central-station", name: "Central Station Rd", zone: "Downtown", lengthKm: 2.4, freeFlowSpeed: 40, baseline: 18, peak: 0.7 },
  { id: "coastal-hwy", name: "Coastal Highway", zone: "Highway", lengthKm: 15.2, freeFlowSpeed: 110, baseline: 7, peak: 0.5 },
]

export const CONGESTION_LEVELS: {
  level: CongestionLevel
  min: number
  max: number
  color: string
  description: string
}[] = [
  { level: "Free Flow", min: 0, max: 20, color: "#10b981", description: "Traffic moves at or near the speed limit" },
  { level: "Light", min: 20, max: 40, color: "#84cc16", description: "Minor slowing, no meaningful delays" },
  { level: "Moderate", min: 40, max: 60, color: "#f59e0b", description: "Noticeable slowdowns, some queuing" },
  { level: "Heavy", min: 60, max: 80, color: "#f97316", description: "Significant delays and stop-and-go traffic" },
  { level: "Severe", min: 80, max: 100, color: "#ef4444", description: "Gridlock, expect major delays" },
]

export function classifyCongestion(value: number): (typeof CONGESTION_LEVELS)[number] {
  const v = Math.max(0, Math.min(100, value))
  return CONGESTION_LEVELS.find((l) => v >= l.min && v < l.max) ?? CONGESTION_LEVELS[CONGESTION_LEVELS.length - 1]
}

const WEATHER_MULT: Record<WeatherCondition, number> = {
  Clear: 1.0,
  Cloudy: 1.06,
  Rain: 1.26,
  Storm: 1.46,
}

export const WEATHER_OPTIONS = Object.keys(WEATHER_MULT) as WeatherCondition[]

export function weatherMultiplier(w: WeatherCondition): number {
  return WEATHER_MULT[w]
}

// --- deterministic RNG (mulberry32) ---
function makeRng(seed: number) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function gaussian(x: number, mu: number, sigma: number): number {
  return Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma))
}

// Time-of-day demand shape (0..1-ish, can exceed 1 at peaks)
export function timeOfDayFactor(hour: number, isWeekend: boolean): number {
  if (isWeekend) {
    return 0.18 + gaussian(hour, 12.5, 3.2) * 0.55 + gaussian(hour, 20, 2.6) * 0.5
  }
  // weekday: sharp morning + evening commute peaks
  return (
    0.16 +
    gaussian(hour, 8, 1.4) * 1.0 +
    gaussian(hour, 17.5, 1.9) * 1.12 +
    gaussian(hour, 12.5, 2.5) * 0.35
  )
}

const HISTORY_DAYS = 30

export interface DayContext {
  weather: WeatherCondition
  eventHour: number | null // hour with a special event, or null
}

function dayContext(segmentId: string, dayIndex: number): DayContext {
  const rng = makeRng(hashStr(segmentId + ":day:" + dayIndex))
  const r = rng()
  let weather: WeatherCondition = "Clear"
  if (r > 0.92) weather = "Storm"
  else if (r > 0.75) weather = "Rain"
  else if (r > 0.5) weather = "Cloudy"
  // ~14% of days have an event, typically afternoon/evening
  const eventHour = rng() > 0.86 ? Math.floor(12 + rng() * 10) : null
  return { weather, eventHour }
}

const historyCache = new Map<string, TrafficRecord[]>()

export function getSegmentHistory(segmentId: string): TrafficRecord[] {
  const cached = historyCache.get(segmentId)
  if (cached) return cached

  const segment = ROAD_SEGMENTS.find((s) => s.id === segmentId)!
  const records: TrafficRecord[] = []
  const now = new Date()
  now.setMinutes(0, 0, 0)

  for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
    const dayDate = new Date(now)
    dayDate.setDate(now.getDate() - d)
    const dayOfWeek = dayDate.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const ctx = dayContext(segmentId, d)
    const wMult = WEATHER_MULT[ctx.weather]

    for (let h = 0; h < 24; h++) {
      const rng = makeRng(hashStr(segmentId + ":" + d + ":" + h))
      const factor = timeOfDayFactor(h, isWeekend)
      let raw = segment.baseline + factor * segment.peak * 78
      raw *= wMult
      // event spike near event hour
      if (ctx.eventHour !== null) {
        raw += gaussian(h, ctx.eventHour, 1.6) * 34
      }
      // random noise
      raw += (rng() - 0.5) * 10
      const congestion = Math.max(2, Math.min(99, raw))
      const speed = Math.max(4, segment.freeFlowSpeed * (1 - congestion / 118))
      const ts = new Date(dayDate)
      ts.setHours(h)
      records.push({
        timestamp: ts.getTime(),
        date: ts.toISOString().slice(0, 10),
        hour: h,
        dayOfWeek,
        isWeekend,
        congestion,
        level: classifyCongestion(congestion).level,
        speed,
        weather: ctx.weather,
        hasEvent: ctx.eventHour !== null && Math.abs(h - ctx.eventHour) <= 2,
      })
    }
  }

  historyCache.set(segmentId, records)
  return records
}
