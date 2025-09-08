import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StatCard } from '@/components/dashboard/StatCard'
import { TrendingUp } from 'lucide-react'

// Mock the LucideIcon type
const MockIcon = TrendingUp

describe('StatCard Component', () => {
  const defaultProps = {
    title: 'Test Stat',
    value: '100',
    icon: MockIcon,
    color: 'blue',
  }

  it('renders with all props', () => {
    render(<StatCard {...defaultProps} />)
    
    expect(screen.getByText('Test Stat')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument()
  })

  it('renders with change increase', () => {
    render(
      <StatCard
        {...defaultProps}
        change="+5%"
        changeType="increase"
      />
    )
    
    expect(screen.getByText('Test Stat')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('+5%')).toBeInTheDocument()
  })

  it('renders with change decrease', () => {
    render(
      <StatCard
        {...defaultProps}
        change="-3%"
        changeType="decrease"
      />
    )
    
    expect(screen.getByText('Test Stat')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('-3%')).toBeInTheDocument()
  })

  it('renders with change neutral', () => {
    render(
      <StatCard
        {...defaultProps}
        change="0%"
        changeType="neutral"
      />
    )
    
    expect(screen.getByText('Test Stat')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('applies correct CSS classes for change types', () => {
    const { container } = render(
      <StatCard
        {...defaultProps}
        change="-2%"
        changeType="decrease"
      />
    )

    const changeElement = container.querySelector('.text-red-600')
    expect(changeElement).toBeInTheDocument()
  })

  it('renders loading state', () => {
    render(
      <StatCard
        {...defaultProps}
        loading={true}
      />
    )
    
    // Check for loading animation classes
    const loadingElement = document.querySelector('.animate-pulse')
    expect(loadingElement).toBeInTheDocument()
  })
})
