import React from 'react'

interface AssemblyStatsProps {
  totalClasses: number
  bookedClasses: number
  availableClasses: number
}

const AssemblyStats: React.FC<AssemblyStatsProps> = ({
  totalClasses,
  bookedClasses,
  availableClasses
}) => {
  const bookedPercentage = totalClasses > 0 ? Math.round((bookedClasses / totalClasses) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* إجمالي الفصول */}
      <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-blue-500">
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {totalClasses}
        </div>
        <div className="text-gray-600 font-medium">إجمالي الفصول</div>
        <div className="text-xs text-gray-500 mt-1">
          الصفوف 5-12
        </div>
      </div>

      {/* الفصول المحجوزة */}
      <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-red-500">
        <div className="text-3xl font-bold text-red-600 mb-2">
          {bookedClasses}
        </div>
        <div className="text-gray-600 font-medium">فصول محجوزة</div>
        <div className="text-xs text-gray-500 mt-1">
          {bookedPercentage}% من الإجمالي
        </div>
      </div>

      {/* الفصول المتاحة */}
      <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-green-500">
        <div className="text-3xl font-bold text-green-600 mb-2">
          {availableClasses}
        </div>
        <div className="text-gray-600 font-medium">فصول متاحة</div>
        <div className="text-xs text-gray-500 mt-1">
          جاهزة للحجز
        </div>
      </div>

      {/* نسبة الإشغال */}
      <div className="bg-white rounded-lg shadow-md p-6 text-center border-l-4 border-purple-500">
        <div className="text-3xl font-bold text-purple-600 mb-2">
          {bookedPercentage}%
        </div>
        <div className="text-gray-600 font-medium">نسبة الإشغال</div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${bookedPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default AssemblyStats