interface MacroBarProps {
  label: string
  value: number
  max: number
  unit: string
  color: string
}

export default function MacroBar({ label, value, max, unit, color }: MacroBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {value}{unit} / {max}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`, 
            backgroundColor: color 
          }}
        />
      </div>
    </div>
  )
}
