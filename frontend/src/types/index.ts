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
