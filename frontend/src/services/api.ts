import axios from 'axios'
import { RallyExport, SummaryRequest, SummaryResponse, AnalyticsResponse } from '../types'
import { mockExports, mockSummaryResponse } from './mockData'
import { mockAnalyticsResponse } from './mockAnalytics'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const API_URL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({ baseURL: API_URL })

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getExports(): Promise<RallyExport[]> {
  if (USE_MOCK) {
    await delay(600)
    return mockExports
  }
  const { data } = await client.get<RallyExport[]>('/exports')
  return data
}

export async function triggerExport(): Promise<RallyExport> {
  if (USE_MOCK) {
    await delay(1200)
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    const newExport: RallyExport = {
      filename: `rally_export_${ts}.csv`,
      s3_key: `exports/${now.getFullYear()}/${pad(now.getMonth()+1)}/rally_export_${ts}.csv`,
      created_at: now.toISOString(),
      counts: { features: 3, user_stories: 9, tasks: 16 },
      download_url: '#',
    }
    return newExport
  }
  const { data } = await client.post<RallyExport>('/exports')
  return data
}

export async function generateSummary(req: SummaryRequest): Promise<SummaryResponse> {
  if (USE_MOCK) {
    await delay(2000)
    return {
      ...mockSummaryResponse,
      start_date: req.start_date,
      end_date: req.end_date,
      summary_type: req.summary_type,
    }
  }
  const { data } = await client.post<SummaryResponse>('/summary', req)
  return data
}

export async function getAnalytics(start_date: string, end_date: string): Promise<AnalyticsResponse> {
  if (USE_MOCK) {
    await delay(900)
    return mockAnalyticsResponse
  }
  const { data } = await client.get<AnalyticsResponse>('/analytics', { params: { start_date, end_date } })
  return data
}

export async function getDownloadUrl(s3Key: string): Promise<string> {
  if (USE_MOCK) {
    await delay(300)
    return '#'
  }
  const { data } = await client.get<{ url: string }>('/download-url', { params: { key: s3Key } })
  return data.url
}
