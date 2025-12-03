import { Profile } from '@/lib/supabase'
import { getSubscriptionDaysLeft } from '@/lib/auth'

interface SubscriptionBadgeProps {
  profile: Profile | null
  onClick?: () => void
}

export default function SubscriptionBadge({ profile, onClick }: SubscriptionBadgeProps) {
  if (!profile || profile.role !== 'business_user') {
    return null
  }

  const daysLeft = getSubscriptionDaysLeft(profile)
  
  // Color based on days remaining
  const getBadgeColor = () => {
    if (daysLeft <= 3) return 'bg-red-600 hover:bg-red-700'
    if (daysLeft <= 7) return 'bg-orange-600 hover:bg-orange-700'
    return 'bg-indigo-600 hover:bg-indigo-700'
  }

  return (
    <button
      onClick={onClick}
      className={`${getBadgeColor()} text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition flex items-center gap-2`}
      title="الاشتراك"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm font-semibold">
        {daysLeft} يوم متبقي
      </span>
    </button>
  )
}
