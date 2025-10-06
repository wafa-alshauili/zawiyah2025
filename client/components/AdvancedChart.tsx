import React from 'react'

interface ChartData {
  name: string
  value: number
}

interface AdvancedChartProps {
  data: ChartData[]
  type: 'bar' | 'pie' | 'line' | 'doughnut'
  title: string
  colors?: string[]
  height?: number
}

const AdvancedChart: React.FC<AdvancedChartProps> = ({ 
  data, 
  type, 
  title, 
  colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
  height = 300 
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h3 className="text-lg font-bold mb-4 text-center text-gray-800">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>لا توجد بيانات للعرض</p>
        </div>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(item => item.value))
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // رسم بياني بالأعمدة المحسن
  if (type === 'bar') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-bold mb-6 text-center text-gray-800">{title}</h3>
        <div className="space-y-4" style={{ height: `${height}px`, overflowY: 'auto' }}>
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
            const color = colors[index % colors.length]
            
            return (
              <div key={index} className="flex items-center gap-4 group">
                <div className="w-32 text-sm text-right font-medium text-gray-700 truncate" title={item.name}>
                  {item.name}
                </div>
                <div className="flex-1 relative">
                  <div className="bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className="h-8 rounded-full flex items-center justify-end pr-3 text-white text-sm font-bold transition-all duration-500 ease-out group-hover:brightness-110"
                      style={{ 
                        width: `${Math.max(percentage, 5)}%`,
                        backgroundColor: color,
                        minWidth: item.value > 0 ? '30px' : '0px'
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // رسم بياني دائري محسن
  if (type === 'pie' || type === 'doughnut') {
    let currentAngle = 0
    const centerX = 120
    const centerY = 120
    const radius = type === 'doughnut' ? 80 : 90
    const innerRadius = type === 'doughnut' ? 40 : 0
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-bold mb-6 text-center text-gray-800">{title}</h3>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
          <div className="relative">
            <svg viewBox="0 0 240 240" className="w-60 h-60">
              {/* الخلفية */}
              <circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="#f3f4f6"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              
              {/* القطاعات */}
              {data.map((item, index) => {
                const percentage = (item.value / total) * 100
                const angle = (item.value / total) * 360
                const startAngle = currentAngle
                const endAngle = currentAngle + angle
                currentAngle = endAngle
                
                const startAngleRad = (startAngle - 90) * (Math.PI / 180)
                const endAngleRad = (endAngle - 90) * (Math.PI / 180)
                
                const x1 = centerX + radius * Math.cos(startAngleRad)
                const y1 = centerY + radius * Math.sin(startAngleRad)
                const x2 = centerX + radius * Math.cos(endAngleRad)
                const y2 = centerY + radius * Math.sin(endAngleRad)
                
                const largeArcFlag = angle > 180 ? 1 : 0
                const color = colors[index % colors.length]
                
                let pathData
                if (type === 'doughnut') {
                  const innerX1 = centerX + innerRadius * Math.cos(startAngleRad)
                  const innerY1 = centerY + innerRadius * Math.sin(startAngleRad)
                  const innerX2 = centerX + innerRadius * Math.cos(endAngleRad)
                  const innerY2 = centerY + innerRadius * Math.sin(endAngleRad)
                  
                  pathData = [
                    `M ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    `L ${innerX2} ${innerY2}`,
                    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
                    'Z'
                  ].join(' ')
                } else {
                  pathData = [
                    `M ${centerX} ${centerY}`,
                    `L ${x1} ${y1}`,
                    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                    'Z'
                  ].join(' ')
                }
                
                return (
                  <path
                    key={index}
                    d={pathData}
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:brightness-110 transition-all duration-200 cursor-pointer"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                  />
                )
              })}
              
              {/* النص المركزي للدونات */}
              {type === 'doughnut' && (
                <text
                  x={centerX}
                  y={centerY - 5}
                  textAnchor="middle"
                  className="text-2xl font-bold fill-gray-700"
                >
                  {total}
                </text>
              )}
              {type === 'doughnut' && (
                <text
                  x={centerX}
                  y={centerY + 15}
                  textAnchor="middle"
                  className="text-sm fill-gray-500"
                >
                  المجموع
                </text>
              )}
            </svg>
          </div>
          
          {/* وسيلة الإيضاح */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {data.map((item, index) => {
              const percentage = ((item.value / total) * 100).toFixed(1)
              const color = colors[index % colors.length]
              
              return (
                <div key={index} className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: color }}
                  ></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-700">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {item.value} ({percentage}%)
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // رسم بياني خطي بسيط
  if (type === 'line') {
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 300
      const y = height - ((item.value / maxValue) * (height - 40)) - 20
      return `${x},${y}`
    }).join(' ')

    return (
      <div className="bg-white p-6 rounded-lg shadow-md border hover:shadow-lg transition-shadow">
        <h3 className="text-lg font-bold mb-6 text-center text-gray-800">{title}</h3>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 300 ${height}`} className="w-full" style={{ minWidth: '300px' }}>
            {/* الشبكة */}
            <defs>
              <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="300" height={height} fill="url(#grid)" />
            
            {/* الخط */}
            <polyline
              fill="none"
              stroke={colors[0]}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
            
            {/* النقاط */}
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 300
              const y = height - ((item.value / maxValue) * (height - 40)) - 20
              
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="white"
                    stroke={colors[0]}
                    strokeWidth="2"
                  />
                  <text
                    x={x}
                    y={height - 5}
                    textAnchor="middle"
                    className="text-xs fill-gray-600"
                  >
                    {item.name}
                  </text>
                  <text
                    x={x}
                    y={y - 10}
                    textAnchor="middle"
                    className="text-xs fill-gray-700 font-medium"
                  >
                    {item.value}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    )
  }

  return <div>نوع الرسم البياني غير مدعوم</div>
}

export default AdvancedChart