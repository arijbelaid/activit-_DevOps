import { render, screen } from '@testing-library/react'
import Header from '../components/Header'

describe('Composant Header', () => {
  it('doit afficher les liens de navigation', () => {
    render(<Header />)
    
    // On vérifie que les liens du menu sont présents
    expect(screen.getByText(/About/i)).toBeInTheDocument()
    expect(screen.getByText(/Skills/i)).toBeInTheDocument()
    expect(screen.getByText(/Projects/i)).toBeInTheDocument()
    expect(screen.getByText(/Contact/i)).toBeInTheDocument()
  })
})
