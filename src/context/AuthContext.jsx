import { useEffect, useState } from 'react'
import { authApi } from '../lib/api'
import { AuthContext } from './auth'

const TOKEN_KEY = 'evently_token'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setIsLoading(false); return }
    authApi.profile().then(({ user: profile }) => setUser(profile)).catch(() => localStorage.removeItem(TOKEN_KEY)).finally(() => setIsLoading(false))
  }, [])
  const saveSession = ({ token, user: profile }) => { localStorage.setItem(TOKEN_KEY, token); setUser(profile); return { token, user: profile } }
  return <AuthContext.Provider value={{ user, isLoading, login: async (values) => saveSession(await authApi.login(values)), register: async (values) => { const res = await authApi.register(values); saveSession(res); return res }, logout: () => { localStorage.removeItem(TOKEN_KEY); setUser(null) } }}>{children}</AuthContext.Provider>
}
