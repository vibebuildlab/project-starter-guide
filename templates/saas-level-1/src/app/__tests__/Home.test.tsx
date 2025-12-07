import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home page', () => {
  it('renders key sections', () => {
    render(<Home />)

    // Validate core page structure (not specific marketing copy)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: /everything you need to succeed/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /pricing/i })).toBeInTheDocument()
    expect(screen.getByText(/© \d{4}/i)).toBeInTheDocument()
  })
})
