import { createContext, useContext, useEffect, useState } from 'react'
import {
  fetchMe,
  loginUser,
  logoutUser,
  signupUser,
} from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      try {
        const response = await fetchMe()
        if (isMounted) {
          setUser(response.user)
        }
      } catch {
        // A missing or expired cookie simply means the visitor is signed out.
        if (isMounted) {
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  async function login(email, password) {
    setError('')
    try {
      const response = await loginUser({ email, password })
      setUser(response.user)
      return response.user
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function signup(formData) {
    setError('')
    try {
      const response = await signupUser(formData)
      setUser(response.user)
      return response.user
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  async function logout() {
    setError('')
    try {
      await logoutUser()
      setUser(null)
    } catch (requestError) {
      setError(requestError.message)
      throw requestError
    }
  }

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// The hook intentionally shares this module's context; Fast Refresh only
// complains because it cannot distinguish that hook export from a component.
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.')
  }

  return context
}