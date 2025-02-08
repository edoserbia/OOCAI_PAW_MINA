import { Loader2 } from 'lucide-react'

export function ThinkingAnimation() {
  return (
    <div className="flex items-center space-x-2 text-gray-400">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Thinking...</span>
    </div>
  )
}

