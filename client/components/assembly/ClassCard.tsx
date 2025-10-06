import React from 'react'
import { FaUser, FaClock, FaStickyNote, FaTrash } from 'react-icons/fa'

interface ClassCardProps {
  classItem: {
    id: string
    name: string
    grade: number
    section: number
  }
  booking?: {
    teacher: string
    notes?: string
    createdAt: string
    referenceNumber: string
  }
  onBook: (classId: string, className: string) => void
  onDelete?: (referenceNumber: string) => void
  isDeleting?: boolean
}

const ClassCard: React.FC<ClassCardProps> = ({
  classItem,
  booking,
  onBook,
  onDelete,
  isDeleting = false
}) => {
  const isBooked = !!booking

  const handleClick = () => {
    if (!isBooked) {
      onBook(classItem.id, classItem.name)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (booking?.referenceNumber && onDelete) {
      onDelete(booking.referenceNumber)
    }
  }

  return (
    <div
      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
        isBooked
          ? 'border-red-300 bg-red-50 hover:bg-red-100'
          : 'border-green-300 bg-green-50 hover:bg-green-100 hover:shadow-md'
      } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleClick}
    >
      {/* رقم الفصل والشعبة */}
      <div className="font-bold text-gray-800 mb-3 text-lg">
        {classItem.name}
      </div>

      {/* معلومات الصف */}
      <div className="text-xs text-gray-500 mb-3">
        الصف {classItem.grade} - الشعبة {classItem.section}
      </div>

      {isBooked && booking ? (
        /* تفاصيل الحجز */
        <div className="space-y-2">
          {/* حالة الحجز */}
          <div className="flex items-center text-red-600 font-semibold text-sm mb-2">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            محجوز
          </div>

          {/* اسم المعلم */}
          <div className="flex items-center text-gray-700 text-sm">
            <FaUser className="mr-2 text-gray-400" size={12} />
            <span className="font-medium">{booking.teacher}</span>
          </div>

          {/* وقت الإنشاء */}
          <div className="flex items-center text-gray-500 text-xs">
            <FaClock className="mr-2 text-gray-400" size={10} />
            <span>
              {new Date(booking.createdAt).toLocaleString('ar-SA', {
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'short'
              })}
            </span>
          </div>

          {/* الملاحظات */}
          {booking.notes && (
            <div className="flex items-start text-gray-500 text-xs">
              <FaStickyNote className="mr-2 text-gray-400 mt-0.5" size={10} />
              <span className="line-clamp-2">{booking.notes}</span>
            </div>
          )}

          {/* رقم المرجع */}
          <div className="text-xs text-gray-400 font-mono">
            #{booking.referenceNumber}
          </div>

          {/* زر الحذف */}
          {onDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="absolute top-2 left-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
              title="حذف الحجز"
            >
              <FaTrash size={10} />
            </button>
          )}
        </div>
      ) : (
        /* حالة متاح */
        <div className="text-center">
          <div className="text-green-600 font-semibold text-sm flex items-center justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            متاح للحجز
          </div>
          <div className="text-xs text-gray-500 mt-1">
            اضغط للحجز
          </div>
        </div>
      )}

      {/* مؤشر الحالة */}
      <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
        isBooked ? 'bg-red-500' : 'bg-green-500'
      }`}></div>
    </div>
  )
}

export default ClassCard