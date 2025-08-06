interface ProgressCircleProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  label: string
  unit: string
  color?: string
}

export default function ProgressCircle({ 
  value, 
  max, 
  size = 120, 
  strokeWidth = 8, 
  label, 
  unit,
  color = "#4CAF50" 
}: ProgressCircleProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min((value / max) * 100, 100)
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E8F5E9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            className="transition-all duration-300 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          <span className="text-sm text-gray-500">/ {max}</span>
        </div>
      </div>
      <div className="mt-2 text-center">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{unit}</p>
      </div>
    </div>
  )
}
