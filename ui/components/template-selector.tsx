import Image from 'next/image'
import { TemplateConfig } from '@/lib/templateConfigs'

interface TemplateSelectorProps {
  templates: TemplateConfig[]
  onSelect: (template: TemplateConfig) => void
  dailyCreatedAgents: number
  maxDailyAgents: number
}

export function TemplateSelector({ templates, onSelect, dailyCreatedAgents, maxDailyAgents }: TemplateSelectorProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-xl font-semibold text-white mb-4">Select a Template</h2>
      <div className="grid grid-cols-3 gap-4 mb-4 max-h-[calc(100vh-300px)] overflow-y-auto">
        {templates.map((template) => (
          <div
            key={template._id}
            className="bg-gray-700 rounded-lg p-2 cursor-pointer hover:bg-gray-600 transition-colors"
            onClick={() => onSelect(template)}
          >
            <Image
              src={template.thumbnail}
              alt={template.name}
              width={100}
              height={100}
              className="w-full h-auto rounded-lg mb-2"
            />
            <p className="text-sm text-white text-center">{template.name}</p>
          </div>
        ))}
      </div>
      <div className="text-sm text-white text-center">
        Today's Agents: {dailyCreatedAgents} / {maxDailyAgents}
      </div>
    </div>
  )
}

