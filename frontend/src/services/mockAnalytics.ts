import { AnalyticsResponse } from '../types'

// Generate a daily burn array for a sprint
function makeBurn(totalPoints: number, daysInMonth: number, completionCurve: number[]): { day: number; date: string; remaining: number; ideal: number }[] {
  const result = []
  let remaining = totalPoints
  const idealPerDay = totalPoints / daysInMonth
  for (let i = 0; i < daysInMonth; i++) {
    const burned = (completionCurve[i] ?? 0) * totalPoints
    remaining = Math.max(0, remaining - burned)
    const ideal = Math.max(0, totalPoints - idealPerDay * (i + 1))
    result.push({
      day: i + 1,
      date: `2026-0${Math.ceil((i + 1) / 31) + 3}-${String(i + 1).padStart(2, '0')}`,
      remaining: Math.round(remaining * 10) / 10,
      ideal: Math.round(ideal * 10) / 10,
    })
  }
  return result
}

// Apr sprint: 42 points, front-loaded completion
const aprBurn = makeBurn(42, 30, [
  0, 0, 0.05, 0.05, 0, 0.08, 0.08, 0, 0, 0.06,
  0.06, 0, 0, 0.05, 0.05, 0, 0.07, 0, 0, 0.05,
  0.05, 0, 0, 0.04, 0.04, 0, 0.05, 0.05, 0.02, 0.05,
])
// May sprint: 38 points, slow start
const mayBurn = makeBurn(38, 31, [
  0, 0, 0, 0.02, 0.02, 0, 0, 0.03, 0.03, 0,
  0.05, 0.05, 0, 0, 0.06, 0.06, 0, 0.06, 0.06, 0,
  0, 0.07, 0.07, 0, 0.07, 0.07, 0, 0.05, 0.05, 0, 0.04,
])
// Jun sprint (partial): 28 points, behind schedule
const junBurn = makeBurn(28, 30, [
  0, 0, 0, 0, 0, 0, 0.03, 0.03, 0, 0.04,
  0.04, 0, 0, 0.04, 0.04, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
])

export const mockAnalyticsResponse: AnalyticsResponse = {
  period: { start: '2026-04-01', end: '2026-06-30' },

  sprints: [
    {
      name: 'Apr 2026',
      start: '2026-04-01',
      end: '2026-04-30',
      planned_points: 42,
      completed_points: 34,
      stories_planned: 8,
      stories_completed: 6,
      carry_over_points: 8,
      velocity: 34,
      daily_burn: aprBurn,
    },
    {
      name: 'May 2026',
      start: '2026-05-01',
      end: '2026-05-31',
      planned_points: 46,   // 38 new + 8 carry-over
      completed_points: 38,
      stories_planned: 9,
      stories_completed: 7,
      carry_over_points: 8,
      velocity: 38,
      daily_burn: mayBurn,
    },
    {
      name: 'Jun 2026',
      start: '2026-06-01',
      end: '2026-06-30',
      planned_points: 36,   // 28 new + 8 carry-over
      completed_points: 14,
      stories_planned: 6,
      stories_completed: 2,
      carry_over_points: 22,
      velocity: 14,
      daily_burn: junBurn,
    },
  ],

  cycle_time: {
    avg_days: 18.4,
    median_days: 16,
    p75_days: 24,
    p90_days: 38,
    outlier_threshold: 32,
    stories: [
      { id: 'US-008', name: 'Webhook event processing',         owner: 'Henry Wang',   owner_email: 'henry.wang@company.com',   points: 8,  start_date: '2026-04-12', end_date: null,         cycle_days: 66, state: 'Defined',      feature: 'F-003', is_outlier: true  },
      { id: 'US-007', name: 'API rate limiting and throttling', owner: 'Grace Kim',    owner_email: 'grace.kim@company.com',    points: 5,  start_date: '2026-04-10', end_date: null,         cycle_days: 38, state: 'In-Progress',  feature: 'F-003', is_outlier: true  },
      { id: 'US-006', name: 'Real-time data refresh',          owner: 'Eve Martinez', owner_email: 'eve.martinez@company.com', points: 8,  start_date: '2026-04-15', end_date: null,         cycle_days: 33, state: 'In-Progress',  feature: 'F-002', is_outlier: true  },
      { id: 'US-003', name: 'Single sign-on (SSO) integration', owner: 'Alice Johnson',owner_email: 'alice.johnson@company.com',points: 13, start_date: '2026-04-10', end_date: '2026-06-10', cycle_days: 61, state: 'Accepted',     feature: 'F-001', is_outlier: true  },
      { id: 'US-001', name: 'Implement JWT token validation',   owner: 'Alice Johnson',owner_email: 'alice.johnson@company.com',points: 8,  start_date: '2026-04-05', end_date: '2026-06-01', cycle_days: 57, state: 'Accepted',     feature: 'F-001', is_outlier: true  },
      { id: 'US-004', name: 'Dashboard widget layout redesign', owner: 'Eve Martinez', owner_email: 'eve.martinez@company.com', points: 5,  start_date: '2026-04-20', end_date: '2026-06-09', cycle_days: 50, state: 'Accepted',     feature: 'F-002', is_outlier: false },
      { id: 'US-005', name: 'Performance chart component',      owner: 'Frank Chen',   owner_email: 'frank.chen@company.com',   points: 3,  start_date: '2026-04-22', end_date: '2026-06-08', cycle_days: 47, state: 'Accepted',     feature: 'F-002', is_outlier: false },
      { id: 'US-002', name: 'Add refresh token support',        owner: 'Dave Lee',     owner_email: 'dave.lee@company.com',     points: 5,  start_date: '2026-04-06', end_date: '2026-06-03', cycle_days: 58, state: 'Accepted',     feature: 'F-001', is_outlier: true  },
    ],
  },

  resource_allocation: [
    { owner: 'Alice Johnson', email: 'alice.johnson@company.com', stories_count: 2, total_points: 21, hours_estimated: 44, hours_actual: 46, hours_remaining: 0,  stories_completed: 2, completion_rate: 100, story_ids: ['US-001','US-003'] },
    { owner: 'Eve Martinez',  email: 'eve.martinez@company.com',  stories_count: 2, total_points: 13, hours_estimated: 18, hours_actual: 8,  hours_remaining: 6,  stories_completed: 1, completion_rate: 50,  story_ids: ['US-004','US-006'] },
    { owner: 'Dave Lee',      email: 'dave.lee@company.com',      stories_count: 1, total_points: 5,  hours_estimated: 10, hours_actual: 11, hours_remaining: 0,  stories_completed: 1, completion_rate: 100, story_ids: ['US-002'] },
    { owner: 'Frank Chen',    email: 'frank.chen@company.com',    stories_count: 1, total_points: 3,  hours_estimated: 4,  hours_actual: 4,  hours_remaining: 0,  stories_completed: 1, completion_rate: 100, story_ids: ['US-005'] },
    { owner: 'Grace Kim',     email: 'grace.kim@company.com',     stories_count: 1, total_points: 5,  hours_estimated: 7,  hours_actual: 2,  hours_remaining: 5,  stories_completed: 0, completion_rate: 0,   story_ids: ['US-007'] },
    { owner: 'Henry Wang',    email: 'henry.wang@company.com',    stories_count: 1, total_points: 8,  hours_estimated: 9,  hours_actual: 0,  hours_remaining: 9,  stories_completed: 0, completion_rate: 0,   story_ids: ['US-008'] },
  ],

  stale_stories: [
    { id: 'US-008', name: 'Webhook event processing',         owner: 'Henry Wang',   owner_email: 'henry.wang@company.com',   state: 'Defined',     last_updated: '2026-05-12', days_stale: 66, points: 8, feature: 'F-003', severity: 'critical' },
    { id: 'US-007', name: 'API rate limiting and throttling', owner: 'Grace Kim',    owner_email: 'grace.kim@company.com',    state: 'In-Progress', last_updated: '2026-05-28', days_stale: 50, points: 5, feature: 'F-003', severity: 'critical' },
    { id: 'US-006', name: 'Real-time data refresh',          owner: 'Eve Martinez', owner_email: 'eve.martinez@company.com', state: 'In-Progress', last_updated: '2026-06-04', days_stale: 43, points: 8, feature: 'F-002', severity: 'critical' },
  ],

  summary_stats: {
    total_stories: 8,
    total_points: 55,
    avg_velocity: 28.7,
    stale_count: 3,
    avg_cycle_days: 18.4,
    outlier_count: 5,
  },
}
