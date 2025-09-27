import React from 'react'
import { FaInfoCircle, FaEnvelope, FaExclamationTriangle } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* المطور */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
              <FaInfoCircle className="w-5 h-5 text-blue-400" />
              المطور
            </h3>
            <p className="text-gray-300">
              <span className="font-medium text-blue-400">وفاء الشعيلي</span> - معلم تقنية معلومات
            </p>
          </div>

          {/* ملاحظة التجربة */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex items-center justify-center gap-2 text-yellow-400 mb-2">
              <FaExclamationTriangle className="w-4 h-4" />
              <span className="font-medium">ملاحظة مهمة</span>
            </div>
            <p className="text-gray-400 text-sm">
              الموقع قيد التجربة، لذا نستقبل ملاحظاتكم واقتراحاتكم لتطويره وتحسينه
            </p>
          </div>

          {/* معلومات إضافية */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <p className="text-xs text-gray-500">
              منصة زاوية لحجز القاعات الدراسية © 2025
            </p>
            <p className="text-xs text-gray-500 mt-1">
              مدرسة بسياء للتعليم الأساسي (5-12)
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}