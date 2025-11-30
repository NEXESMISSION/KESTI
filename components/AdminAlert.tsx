import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface AdminAlertProps {
  userId: string | null
}

export default function AdminAlert({ userId }: AdminAlertProps) {
  const [showAlert, setShowAlert] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  useEffect(() => {
    if (!userId) return
    checkForAlert()
  }, [userId])

  const checkForAlert = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('pending_alert_message')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (profile?.pending_alert_message) {
        setAlertMessage(profile.pending_alert_message)
        setShowAlert(true)
        
        // Clear the alert from database after showing
        await supabase
          .from('profiles')
          .update({ pending_alert_message: null })
          .eq('id', userId)
      }
    } catch (err) {
      console.error('Error checking for alert:', err)
    }
  }

  if (!showAlert || !alertMessage) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📢</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            رسالة من الإدارة
          </h2>
        </div>

        {/* Message Content */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border-2 border-purple-200">
          <p className="text-gray-800 text-center leading-relaxed whitespace-pre-wrap" dir="rtl">
            {alertMessage}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setShowAlert(false)}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all text-lg shadow-lg shadow-purple-200"
        >
          حسناً، فهمت
        </button>
      </div>
    </div>
  )
}
