import { useState, useEffect } from 'react'
// @ts-ignore
import { supabase } from './supabaseClient'
// @ts-ignore
import LoginPage from './LoginPage'
// @ts-ignore
import DashboardPage from './DashboardPage'
// @ts-ignore
import ClientApp from './ClientApp'
import './App.css'

function App() {
  const [session, setSession] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session)
      if (session) {
        getRole(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setSession(session)
      if (session) {
        getRole(session.user.id)
      } else {
        setUserRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function getRole(userId: string) {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) throw error
      if (data) setUserRole(data.role)
    } catch (error) {
      console.error('Error fetching user role:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = () => {
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      setSession(session)
      if (session) {
        getRole(session.user.id)
      }
    })
  }

  const handleLogout = () => {
    setSession(null)
    setUserRole(null)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.5rem',
        color: '#667eea'
      }}>
        Loading...
      </div>
    )
  }

  if (!session) {
    return <LoginPage onLogin={handleLogin} />
  }

  // Render the correct dashboard based on the user's role (V7.0: Two-role system)
  switch (userRole) {
    case 'super_admin':
      return <DashboardPage onLogout={handleLogout} />
    case 'business_admin':
      return <ClientApp onLogout={handleLogout} />
    default:
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '40px',
            maxWidth: '600px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
              ⚠️
            </div>
            <h1 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: '#1a202c',
              marginBottom: '16px'
            }}>
              No Role Assigned
            </h1>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#4a5568',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Your account doesn't have a role assigned yet. Please contact your administrator to assign you a role (super_admin or business_admin).
            </p>
            <button
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 32px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e: any) => e.target.style.opacity = '0.9'}
              onMouseOut={(e: any) => e.target.style.opacity = '1'}
            >
              Sign Out
            </button>
          </div>
        </div>
      )
  }
}

export default App
