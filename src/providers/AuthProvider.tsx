import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
    id: string
    name: string
    role: string
    balance: number
}

interface AuthContextType {
    user: User | null
    login: (name: string, password: string) => Promise<{ success: boolean; error?: string }>
    logout: () => void
    isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check for saved session in localStorage
        const savedUser = localStorage.getItem('respresso_user')
        if (savedUser) {
            setUser(JSON.parse(savedUser))
        }
        setIsLoading(false)
    }, [])

    const login = async (name: string, password: string) => {
        const result = await window.api.login({ name, password })
        if (result.success && result.user) {
            const userData = {
                id: result.user.id,
                name: result.user.name,
                role: result.user.role,
                balance: result.user.balance
            }
            setUser(userData)
            localStorage.setItem('respresso_user', JSON.stringify(userData))
            return { success: true }
        }
        return { success: false, error: result.error || 'Login failed' }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('respresso_user')
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
