import { RallyExport, SummaryResponse } from '../types'

export const mockExports: RallyExport[] = [
  {
    filename: 'rally_export_20260414_150000.csv',
    s3_key: 'exports/2026/04/rally_export_20260414_150000.csv',
    created_at: '2026-04-14T15:00:00Z',
    counts: { features: 3, user_stories: 8, tasks: 15 },
    download_url: '#',
  },
  {
    filename: 'rally_export_20260413_150000.csv',
    s3_key: 'exports/2026/04/rally_export_20260413_150000.csv',
    created_at: '2026-04-13T15:00:00Z',
    counts: { features: 3, user_stories: 9, tasks: 17 },
    download_url: '#',
  },
  {
    filename: 'rally_export_20260412_150000.csv',
    s3_key: 'exports/2026/04/rally_export_20260412_150000.csv',
    created_at: '2026-04-12T15:00:00Z',
    counts: { features: 3, user_stories: 7, tasks: 13 },
    download_url: '#',
  },
  {
    filename: 'rally_export_20260411_150000.csv',
    s3_key: 'exports/2026/04/rally_export_20260411_150000.csv',
    created_at: '2026-04-11T15:00:00Z',
    counts: { features: 2, user_stories: 6, tasks: 11 },
    download_url: '#',
  },
  {
    filename: 'rally_export_20260410_150000.csv',
    s3_key: 'exports/2026/04/rally_export_20260410_150000.csv',
    created_at: '2026-04-10T15:00:00Z',
    counts: { features: 2, user_stories: 5, tasks: 10 },
    download_url: '#',
  },
]

export const mockSummaryResponse: SummaryResponse = {
  summary: `## Weekly Rally Summary: April 7–11, 2026

### Overview
This week the team delivered strong execution across three major features in the FY2026 Q1 portfolio. The **User Authentication** feature reached the Accepted state, closing out 5 user stories totaling 34 points. **Dashboard Redesign** continues to advance with 3 stories completed and 2 still in progress. The **API Integration** feature has one story accepted and foundational tasks underway for the remaining scope.

### Completed Work
- **US-0023** — Implement JWT token validation (8 pts) — Accepted
- **US-0024** — Add refresh token support (5 pts) — Accepted
- **US-0027** — Single sign-on (SSO) integration (13 pts) — Accepted
- **US-0031** — Dashboard widget layout redesign (5 pts) — Accepted
- **US-0032** — Performance chart component (3 pts) — Accepted

### In Progress
- **US-0033** — Real-time data refresh for dashboard (8 pts) — In-Progress (75% done)
- **US-0035** — API rate limiting and throttling (5 pts) — In-Progress (50% done)
- **US-0036** — Webhook event processing (8 pts) — In-Progress (25% done)

### Key Metrics
| Metric | Value |
|--------|-------|
| Points Accepted | 34 |
| Points In Progress | 21 |
| Team Velocity (4-week avg) | 38 |
| Stories Completed | 5 |
| Defects Resolved | 2 |

### Risks & Blockers
- **US-0036** (Webhook processing) is blocked pending security review approval — estimated unblock: April 15
- QA environment instability impacted testing throughput on Wednesday; issue resolved Thursday afternoon`,

  executive_summary: `## Executive Summary — April 7–11, 2026

**Team Velocity:** 34 points accepted | **Completion Rate:** 78% of committed scope

The development team delivered another solid week, accepting 34 story points across the User Authentication and Dashboard Redesign features. The User Authentication feature is now fully closed, meeting the Q1 milestone. Dashboard Redesign is on track for completion next week. One active blocker (webhook security review) is being managed and is not expected to impact the Q1 delivery date. Overall portfolio health is GREEN.`,

  metrics: {
    features_completed: 1,
    stories_completed: 5,
    stories_in_progress: 3,
    tasks_completed: 11,
    total_points_accepted: 34,
    team_velocity: 38,
  },
  detailed_summary: `## Detailed Rally Story Report: April 7–11, 2026

### US-003 — Single sign-on (SSO) integration
**Owner:** Alice Johnson (alice.johnson@company.com) | **Feature:** F-001 User Authentication | **State:** Accepted | **Points:** 13
**Created:** 2026-04-10 | **Last Updated:** 2026-06-10 | **Accepted:** 2026-06-10

This story implemented enterprise-grade Single Sign-On via Okta SAML 2.0, enabling customers to authenticate using their corporate identity provider. Alice Johnson led the end-to-end implementation, covering the SAML app configuration on the Okta side and the corresponding assertion consumer service on the platform. The work involved careful coordination with the security team to ensure the signing certificates and metadata exchange met compliance requirements. Two tasks were completed: Okta SAML configuration (TA-004, 8h estimated / 8h actual) and SSO login flow integration tests (TA-005, 3h estimated / 4h actual). The slight overrun on testing was due to a redirect loop edge case discovered during QA. The story was accepted on schedule with no outstanding issues.

---

### US-004 — Dashboard widget layout redesign
**Owner:** Eve Martinez (eve.martinez@company.com) | **Feature:** F-002 Dashboard Redesign | **State:** Accepted | **Points:** 5
**Created:** 2026-04-20 | **Last Updated:** 2026-06-09 | **Accepted:** 2026-06-09

This story modernized the dashboard grid to support drag-and-drop widget reordering using the React DnD library. Eve Martinez completed TA-006 (6h estimated / 5h actual), coming in slightly under estimate due to reusing an existing grid abstraction. The new layout supports persisting widget order to user preferences. Acceptance criteria were met fully, with cross-browser testing completed in Chrome, Firefox, and Safari. The story feeds directly into US-006 (real-time data refresh) which depends on the new widget container API introduced here.

---

### US-006 — Real-time data refresh for dashboard
**Owner:** Eve Martinez (eve.martinez@company.com) | **Feature:** F-002 Dashboard Redesign | **State:** In-Progress | **Points:** 8
**Created:** 2026-05-01 | **Last Updated:** 2026-06-11 | **Accepted:** Pending

This story adds WebSocket-based live data refresh to the dashboard widgets. TA-008 (WebSocket server setup) is 50% complete (3h actuals out of 6h estimate, 3h remaining). The primary blocker is a pending security review for the WebSocket endpoint configuration — approval is expected by April 15. Once unblocked, Eve estimates 2–3 days to complete the client-side subscription logic and tie it into the widget state management introduced in US-004. No architectural concerns at this time.

---

## Team Activity Summary

| Owner | Stories | Points | Completed | In Progress |
|-------|---------|--------|-----------|-------------|
| Alice Johnson | US-001, US-003 | 21 | 2 | 0 |
| Dave Lee | US-002 | 5 | 1 | 0 |
| Eve Martinez | US-004, US-006 | 13 | 1 | 1 |
| Frank Chen | US-005 | 3 | 1 | 0 |
| Grace Kim | US-007 | 5 | 0 | 1 |
| Henry Wang | US-008 | 0 | 0 | 0 |`,

  s3_key: 'summaries/2026/04/summary_20260414_100000.json',
  generated_at: '2026-04-14T10:00:00Z',
  start_date: '2026-04-07',
  end_date: '2026-04-11',
  summary_type: 'weekly',
}
