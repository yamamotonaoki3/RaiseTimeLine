import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Layout from '../../components/Layout'
import { AuthContext } from '../../context/auth-context'
import type { AuthContextType } from '../../context/auth-context'

const contextValue: AuthContextType = {
  user: null,
  login: vi.fn(),
  logout: vi.fn(),
  updateDisplayName: vi.fn(),
  updateAvatarUrl: vi.fn(),
}

describe('Layout', () => {
  it('NavBar と children が両方表示される', () => {
    render(
      <MemoryRouter>
        <AuthContext.Provider value={contextValue}>
          <Layout>
            <div>子要素の内容</div>
          </Layout>
        </AuthContext.Provider>
      </MemoryRouter>,
    )

    expect(screen.getByText('RaiseTimeLine')).toBeInTheDocument()
    expect(screen.getByText('子要素の内容')).toBeInTheDocument()
  })
})
