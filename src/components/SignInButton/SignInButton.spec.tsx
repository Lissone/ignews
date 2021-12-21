import { render, screen } from '@testing-library/react'
import { mocked } from 'jest-mock'
import { useSession } from 'next-auth/client'

import { SignInButton } from '.'

jest.mock('next-auth/client')

describe('SignInButton component', () => {
  it('renders correctly when user is not authenticated', () => {
    const useSessionMocked = mocked(useSession)

    useSessionMocked.mockReturnValueOnce([null, false]) // first return of this function

    render(<SignInButton />)
  
    expect(screen.getByText('Sign in with Github')).toBeInTheDocument()
  })

  it('renders correctly when user is authenticated', () => {
    const useSessionMocked = mocked(useSession)

    useSessionMocked.mockReturnValueOnce([  // first return of this function
      { user: { name: 'John Doe', email: 'john@doe.com' }, expires: 'fake-expires' }, 
      false
    ])

    render(<SignInButton />)
  
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})