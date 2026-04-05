// src/__tests__/RegisterForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock react-router-dom BEFORE importing AuthForm
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import AuthForm from '../components/AuthForm/LoginForm'
import { MemoryRouter } from 'react-router-dom'

describe('AuthForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  test('shows error when passwords do not match during registration', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>
    )

    // Switch to register mode
    await user.click(screen.getByRole('button', { name: /register/i }))
    await user.type(screen.getByLabelText(/username/i), 'testuser')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.type(screen.getByLabelText(/confirm password/i), 'password456')

    await user.click(screen.getByRole('button', { name: /create/i }))
    expect(await screen.findByText(/passwords don't match!/i)).toBeInTheDocument()
  })

  test('successful login sets localStorage and navigates', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Login success' }),
    } as Response)

    render(
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/username/i), 'user1')
    await user.type(screen.getByLabelText(/password/i), 'pass123')
    await user.click(screen.getByRole('button', { name: /go!/i }))

    await waitFor(() => {
      expect(localStorage.getItem('username')).toBe('user1')
      expect(mockNavigate).toHaveBeenCalledWith('/menu')
    })
  })

  test('displays server error message', async () => {
    const user = userEvent.setup()
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    } as Response)

    render(
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/username/i), 'wronguser')
    await user.type(screen.getByLabelText(/password/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /go!/i }))

    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
  })

  test('switches between login and register tabs', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <AuthForm />
      </MemoryRouter>
    )

    const registerTab = screen.getByRole('button', { name: /register/i })
    const loginTab = screen.getByRole('button', { name: /login/i })

    // Initially login selected
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument()

    await user.click(registerTab)
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()

    await user.click(loginTab)
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument()
  })
})