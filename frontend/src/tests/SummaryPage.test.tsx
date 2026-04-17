import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SummaryPage from '../pages/SummaryPage'
import * as api from '../services/api'
import { mockSummaryResponse } from '../services/mockData'

vi.mock('../services/api')
vi.mock('react-datepicker', () => ({
  default: ({ selected, onChange, className }: { selected: Date; onChange: (d: Date) => void; className: string }) => (
    <input
      type="text"
      className={className}
      value={selected?.toISOString().split('T')[0] ?? ''}
      onChange={e => onChange(new Date(e.target.value))}
      data-testid="date-picker"
    />
  ),
}))

function renderSummaryPage() {
  return render(
    <MemoryRouter>
      <SummaryPage />
    </MemoryRouter>
  )
}

describe('SummaryPage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders date pickers and summary type select', () => {
    renderSummaryPage()
    expect(screen.getAllByTestId('date-picker')).toHaveLength(2)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })

  it('renders Generate Summary button', () => {
    renderSummaryPage()
    expect(screen.getByText(/Generate Summary/i)).toBeInTheDocument()
  })

  it('shows loading state while generating', async () => {
    vi.mocked(api.generateSummary).mockReturnValue(new Promise(() => {}))
    renderSummaryPage()
    fireEvent.click(screen.getByText(/Generate Summary/i))
    await waitFor(() => {
      expect(screen.getByText(/Generating/i)).toBeInTheDocument()
    })
  })

  it('shows summary and download buttons after generation', async () => {
    vi.mocked(api.generateSummary).mockResolvedValue(mockSummaryResponse)
    renderSummaryPage()
    fireEvent.click(screen.getByText(/Generate Summary/i))
    await waitFor(() => {
      expect(screen.getByText(/Weekly Rally Summary/i)).toBeInTheDocument()
    })
    expect(screen.getByText('PDF')).toBeInTheDocument()
    expect(screen.getByText('DOCX')).toBeInTheDocument()
    expect(screen.getByText('EXCEL')).toBeInTheDocument()
  })

  it('shows error when generation fails', async () => {
    vi.mocked(api.generateSummary).mockRejectedValue(new Error('API error'))
    renderSummaryPage()
    fireEvent.click(screen.getByText(/Generate Summary/i))
    await waitFor(() => {
      expect(screen.getByText(/Failed to generate summary/i)).toBeInTheDocument()
    })
  })

  it('shows metrics when available', async () => {
    vi.mocked(api.generateSummary).mockResolvedValue(mockSummaryResponse)
    renderSummaryPage()
    fireEvent.click(screen.getByText(/Generate Summary/i))
    await waitFor(() => {
      expect(screen.getByText('Features Done')).toBeInTheDocument()
      expect(screen.getByText('Team Velocity')).toBeInTheDocument()
    })
  })

  it('shows Executive Summary button after generation', async () => {
    vi.mocked(api.generateSummary).mockResolvedValue(mockSummaryResponse)
    renderSummaryPage()
    fireEvent.click(screen.getByText(/Generate Summary/i))
    await waitFor(() => {
      expect(screen.getByText(/View Executive Summary/i)).toBeInTheDocument()
    })
  })
})
