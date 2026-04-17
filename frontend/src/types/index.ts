export interface RallyExport {
  filename: string
  s3_key: string
  created_at: string
  counts: {
    features: number
    user_stories: number
    tasks: number
  }
  download_url: string
}

export interface SummaryRequest {
  start_date: string
  end_date: string
  summary_type: 'weekly' | 'monthly' | 'quarterly' | 'executive'
}

export interface SummaryMetrics {
  features_completed: number
  stories_completed: number
  stories_in_progress: number
  tasks_completed: number
  total_points_accepted: number
  team_velocity: number
}

export interface SummaryResponse {
  summary: string
  executive_summary?: string
  detailed_summary?: string
  s3_key: string
  generated_at: string
  metrics?: SummaryMetrics
  start_date: string
  end_date: string
  summary_type: string
}

export type DownloadFormat = 'pdf' | 'docx' | 'excel'

// ── Analytics ─────────────────────────────────────────────────────────────────

export interface DailyBurnPoint {
  day: number
  date: string
  remaining: number
  ideal: number
}

export interface SprintData {
  name: string
  start: string
  end: string
  planned_points: number
  completed_points: number
  stories_planned: number
  stories_completed: number
  carry_over_points: number
  velocity: number
  daily_burn: DailyBurnPoint[]
}

export interface CycleTimeStory {
  id: string
  name: string
  owner: string
  owner_email: string
  points: number
  start_date: string
  end_date: string | null
  cycle_days: number
  state: string
  feature: string
  is_outlier: boolean
}

export interface CycleTimeData {
  avg_days: number
  median_days: number
  p75_days: number
  p90_days: number
  outlier_threshold: number
  stories: CycleTimeStory[]
}

export interface ResourceAllocation {
  owner: string
  email: string
  stories_count: number
  total_points: number
  hours_estimated: number
  hours_actual: number
  hours_remaining: number
  stories_completed: number
  completion_rate: number
  story_ids: string[]
}

export interface StaleStory {
  id: string
  name: string
  owner: string
  owner_email: string
  state: string
  last_updated: string
  days_stale: number
  points: number
  feature: string
  severity: 'warning' | 'critical'
}

export interface AnalyticsSummaryStats {
  total_stories: number
  total_points: number
  avg_velocity: number
  stale_count: number
  avg_cycle_days: number
  outlier_count: number
}

export interface AnalyticsResponse {
  period: { start: string; end: string }
  sprints: SprintData[]
  cycle_time: CycleTimeData
  resource_allocation: ResourceAllocation[]
  stale_stories: StaleStory[]
  summary_stats: AnalyticsSummaryStats
}
