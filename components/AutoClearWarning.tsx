import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase, Profile } from '@/lib/supabase'

export default function AutoClearWarning() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    checkAutoClearStatus()
    
    // Check once every 24 hours to show popup if needed
    const interval = setInterval(() => {
      checkAutoClearStatus()
    }, 86400000) // 24 hours
    
    return () => clearInterval(interval)
  }, [])

  const checkAutoClearStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profileData) return
      setProfile(profileData)

      // Check if auto-clear is enabled and approaching
      const useMinutes = profileData.history_auto_clear_minutes && profileData.history_auto_clear_minutes > 0
      const useDays = profileData.history_auto_clear_days && profileData.history_auto_clear_days > 0

      if (!useMinutes && !useDays) return

      const lastClear = profileData.last_history_clear ? new Date(profileData.last_history_clear) : new Date()
      const now = new Date()

      let nextClear: Date
      let hoursLeft = 0

      if (useMinutes) {
        nextClear = new Date(lastClear.getTime() + profileData.history_auto_clear_minutes * 60 * 1000)
        hoursLeft = (nextClear.getTime() - now.getTime()) / (1000 * 60 * 60)
      } else {
        nextClear = new Date(lastClear.getTime() + profileData.history_auto_clear_days * 24 * 60 * 60 * 1000)
        hoursLeft = (nextClear.getTime() - now.getTime()) / (1000 * 60 * 60)
      }

      // Show warning if less than 3 days (72 hours) left
      if (hoursLeft < 72 && hoursLeft > 0) {
        if (hoursLeft < 1) {
          const minutesLeft = Math.ceil(hoursLeft * 60)
          setTimeLeft(`${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}`)
        } else if (hoursLeft < 24) {
          const hours = Math.ceil(hoursLeft)
          setTimeLeft(`${hours} hour${hours !== 1 ? 's' : ''}`)
        } else {
          const days = Math.ceil(hoursLeft / 24)
          setTimeLeft(`${days} day${days !== 1 ? 's' : ''}`)
        }
        
        // Check if user dismissed it recently (within last hour)
        const lastDismissed = localStorage.getItem('autoclear_warning_dismissed')
        const now = new Date().getTime()
        
        if (!lastDismissed || (now - parseInt(lastDismissed)) > 3600000) {
          // Show if never dismissed or dismissed more than 1 hour ago
          setShowWarning(true)
        }
      }
    } catch (error) {
      console.error('Error checking auto-clear status:', error)
    }
  }

  const handleDismiss = () => {
    // Save dismissal timestamp (will show again in 1 hour)
    localStorage.setItem('autoclear_warning_dismissed', new Date().getTime().toString())
    setShowWarning(false)
  }

  const handleDownload = () => {
    router.push('/history')
    setShowWarning(false)
  }

  if (!showWarning) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 animate-pulse-once">
        {/* Warning Icon */}
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-red-600 mb-3">
          ⚠️ Data Will Be Deleted Soon!
        </h2>

        {/* Message */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-gray-800 text-center mb-2">
            Your sales and expenses history will be <strong>automatically deleted</strong> in:
          </p>
          <p className="text-3xl font-bold text-red-600 text-center mb-2">
            {timeLeft}
          </p>
          <p className="text-sm text-gray-600 text-center">
            All your transaction history will be permanently lost!
          </p>
        </div>

        {/* What will be deleted */}
        <div className="bg-red-50 rounded-lg p-3 mb-4">
          <p className="text-sm font-semibold text-red-800 mb-2">What will be deleted:</p>
          <ul className="text-sm text-red-700 space-y-1">
            <li>✗ All sales transactions</li>
            <li>✗ All expenses records</li>
            <li>✗ Complete transaction history</li>
          </ul>
        </div>

        {/* What will be kept */}
        <div className="bg-green-50 rounded-lg p-3 mb-4">
          <p className="text-sm font-semibold text-green-800 mb-2">What will be kept:</p>
          <ul className="text-sm text-green-700 space-y-1">
            <li>✓ Products and inventory</li>
            <li>✓ Saved expense templates</li>
            <li>✓ Account settings</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleDownload}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download My Data Now
          </button>
          
          <button
            onClick={handleDismiss}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition"
          >
            Remind Me in 1 Hour
          </button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-gray-500 mt-4">
          💡 Download your data regularly to keep your records safe!
        </p>
      </div>

      <style jsx>{`
        @keyframes pulse-once {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .animate-pulse-once {
          animation: pulse-once 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}
