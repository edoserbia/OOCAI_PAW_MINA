import { DailyTasks } from '@/components/tasks/daily-tasks'
import { GrowthTasks } from '@/components/tasks/growth-tasks'
import { SocialTasks } from '@/components/tasks/social-tasks'

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-slate-900 to-black p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-white">Tasks</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Daily Tasks</h2>
            <DailyTasks />
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Growth Tasks</h2>
            <GrowthTasks />
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Social Tasks</h2>
            <SocialTasks />
          </section>
        </div>
      </div>
    </div>
  )
}

