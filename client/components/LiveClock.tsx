import { useState, useEffect } from 'react'

const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCurrentTime(new Date())

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ar', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      calendar: 'gregory' // التقويم الميلادي
    })
  }

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg shadow-soft p-4 inline-block">
        <div className="text-2xl font-bold text-primary-600 mb-1">
          --:--:--
        </div>
        <div className="text-sm text-gray-500">
          جاري التحميل...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-soft p-4 inline-block">
      <div className="text-2xl font-bold text-primary-600 mb-1" suppressHydrationWarning>
        {currentTime ? formatTime(currentTime) : '--:--:--'}
      </div>
      <div className="text-sm text-gray-500" suppressHydrationWarning>
        {currentTime ? formatDate(currentTime) : 'جاري التحميل...'}
      </div>
    </div>
  )
}

export default LiveClock