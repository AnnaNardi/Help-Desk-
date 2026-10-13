import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import pb from '@/lib/api/client'
import { User } from '@/types/helpdesk'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, pass: string) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<User | null>
  theme: 'claro' | 'escuro'
  setTheme: (t: 'claro' | 'escuro') => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [theme, setThemeState] = useState<'claro' | 'escuro'>(() => {
    const saved = localStorage.getItem('helpdesk_theme')
    return saved === 'escuro' ? 'escuro' : 'claro'
  })

  const applyTheme = useCallback((newTheme: 'claro' | 'escuro') => {
    setThemeState(newTheme)
    localStorage.setItem('helpdesk_theme', newTheme)
    const root = document.documentElement
    if (newTheme === 'escuro') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  const setTheme = (newTheme: 'claro' | 'escuro') => {
    applyTheme(newTheme)
    if (user && user.id) {
      pb.collection('users')
        .update(user.id, { theme: newTheme })
        .catch(() => {})
    }
  }

  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      if (pb.authStore.isValid && pb.authStore.record) {
        const u = await pb.collection('users').getOne<User>(pb.authStore.record.id, {
          expand: 'company',
        })
        setUser(u)
        if (u.theme && (u.theme === 'claro' || u.theme === 'escuro')) {
          applyTheme(u.theme)
        }
        return u
      } else {
        setUser(null)
        return null
      }
    } catch {
      setUser(null)
      return null
    }
  }, [applyTheme])

  useEffect(() => {
    const init = async () => {
      await refreshUser()
      setLoading(false)
    }
    init()

    const unsubscribe = pb.authStore.onChange(() => {
      refreshUser()
    })

    return () => {
      unsubscribe()
    }
  }, [refreshUser])

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await pb.collection('users').authWithPassword<User>(email, pass)
    const u = await pb.collection('users').getOne<User>(res.record.id, {
      expand: 'company',
    })
    setUser(u)
    if (u.theme) {
      applyTheme(u.theme)
    }
    return u
  }

  const logout = () => {
    try {
      if (user) {
        pb.collection('activity_logs')
          .create({
            user: user.id,
            action: 'logout',
            entity_type: 'user',
            entity_id: user.id,
            details: { email: user.email },
          })
          .catch(() => {})
      }
    } catch {
      /* intentionally ignored */
    }
    pb.authStore.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
        theme,
        setTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
