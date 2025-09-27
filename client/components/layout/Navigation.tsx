import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { 
  FaHome, 
  FaCalendarAlt, 
  FaDoorOpen, 
  FaBars, 
  FaTimes,
  FaChartBar 
} from 'react-icons/fa'

const Navigation = () => {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const navigation = [
    { name: 'الصفحة الرئيسية', href: '/', icon: FaHome },
    { name: 'الحجوزات', href: '/bookings', icon: FaCalendarAlt },
    { name: 'القاعات', href: '/rooms', icon: FaDoorOpen },
    { name: 'الإحصائيات', href: '/stats', icon: FaChartBar },
  ]

  const isActive = (path: string) => router.pathname === path

  return (
    <nav className="bg-white shadow-medium border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2 space-x-reverse">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">ز</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">زاوية 2025</h1>
                <p className="text-xs text-gray-500">نظام حجوزات القاعات</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-4 space-x-reverse">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-2 space-x-reverse ${
                      isActive(item.href)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            >
              {isOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 flex items-center space-x-3 space-x-reverse ${
                    isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation