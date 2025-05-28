'use client'

import { useState } from 'react'
import AdminLogin from '@/components/AdminLogin'
import AdminDashboard from '@/components/AdminDashboard'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  return (
    <main>
      {!isAuthenticated ? (
        <AdminLogin onLogin={() => setIsAuthenticated(true)} />
      ) : (
        <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
      )}
    </main>
  )
}
