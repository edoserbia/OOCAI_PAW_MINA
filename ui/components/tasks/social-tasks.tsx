'use client'

import { useState } from 'react'
import { CheckCircle, Circle } from 'lucide-react'

interface Task {
  id: string
  description: string
  completed: boolean
  claimed: boolean
}

export function SocialTasks() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', description: 'Follow our Twitter', completed: false, claimed: false },
    { id: '2', description: 'Comment on our Twitter', completed: false, claimed: false },
    { id: '3', description: 'Join our Discord', completed: false, claimed: false },
    { id: '4', description: 'Join our Telegram', completed: false, claimed: false },
  ])

  const handleComplete = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: true } : task
    ))
  }

  const handleClaim = (id: string) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, claimed: true } : task
    ))
    // Here you would also update the user's points
  }

  const completedTasks = tasks.filter(task => task.completed).length
  const totalTasks = tasks.length
  const overallProgress = (completedTasks / totalTasks) * 100

  return (
    <div className="space-y-4 bg-gray-800 p-4 rounded-lg">
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${overallProgress}%` }}></div>
      </div>
      <p className="text-white text-sm">{completedTasks} / {totalTasks} tasks completed</p>
      {tasks.map(task => (
        <div key={task.id} className="bg-gray-700 rounded-lg p-3 flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {task.completed ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <span className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                {task.description}
              </span>
            </div>
            <span className="text-sm text-amber-500 font-medium">
              {task.completed ? '1/1' : '0/1'}
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full" 
              style={{ width: task.completed ? '100%' : '0%' }}
            ></div>
          </div>
          {task.claimed ? (
            <span className="w-full text-center text-sm text-gray-400">已领取</span>
          ) : task.completed ? (
            <button
              onClick={() => handleClaim(task.id)}
              className="w-full px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              领取
            </button>
          ) : (
            <button
              disabled
              className="w-full px-3 py-1 bg-gray-500 text-white text-sm rounded-md cursor-not-allowed"
            >
              领取
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

