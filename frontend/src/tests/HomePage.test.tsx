import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import * as api from '../services/api'
import { mockExports } from '../services/mockData'

vi.mock('../services/api')

function renderHomePage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders loading spinner initially', () => {
    vi.mocked(api.getExports).mockReturnValue(new Promise(() => {}))
    renderHomePage()
    expect(screen.getByText(/loading exports/i)).toBeInTheDocument()
  })

  it('renders export list after loading', async () => {
    vi.mocked(api.getExports).mockResolvedValue(mockExports)
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText(mockExports[0].filename)).toBeInTheDocument()
    })
    expect(screen.getAllByText(/Download/)).toHaveLength(mockExports.length)
  })

  it('shows empty state when no exports', async () => {
    vi.mocked(api.getExports).mockResolvedValue([])
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText(/No exports yet/i)).toBeInTheDocument()
    })
  })

  it('shows error message when getExports fails', async () => {
    vi.mocked(api.getExports).mockRejectedValue(new Error('Network error'))
    renderHomePage()
    await waitFor(() => {
      expect(screen.getByText(/Failed to load exports/i)).toBeInTheDocument()
    })
  })

  it('triggers export and adds to list', async () => {
    vi.mocked(api.getExports).mockResolvedValue(mockExports)
    const newExport = { ...mockExports[0], filename: 'rally_export_new.csv', s3_key: 'new_key' }
    vi.mocked(api.triggerExport).mockResolvedValue(newExport)

    renderHomePage()
    await waitFor(() => screen.getByText(mockExports[0].filename))

    fireEvent.click(screen.getByText(/Trigger New Export/i))
    await waitFor(() => {
      expect(screen.getByText('rally_export_new.csv')).toBeInTheDocument()
    })
  })

  it('shows error when trigger export fails', async () => {
    vi.mocked(api.getExports).mockResolvedValue([])
    vi.mocked(api.triggerExport).mockRejectedValue(new Error('Export failed'))

    renderHomePage()
    await waitFor(() => screen.getByText(/No exports yet/i))
    fireEvent.click(screen.getByText(/Trigger New Export/i))

    await waitFor(() => {
      expect(screen.getByText(/Export failed/i)).toBeInTheDocument()
    })
  })
})
