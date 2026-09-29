import { createContext, useContext, useState, useCallback } from 'react'
import api from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('nawi_user')
    return raw ? JSON.parse(raw) : null
  })

  const login = useCallback(async (username, password, selectedRole) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    const res = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const { access_token, role, full_name } = res.data
    
    if (selectedRole && role !== selectedRole) {
      throw new Error('User does not have the selected role.')
    }

    localStorage.setItem('nawi_token', access_token)
    const userObj = { username, role, full_name }
    localStorage.setItem('nawi_user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('nawi_token')
    localStorage.removeItem('nawi_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
