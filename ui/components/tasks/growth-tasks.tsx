'use client'

import { useState } from 'react'
import { CheckCircle, Circle } from 'lucide-react'

interface Task {
  id: string
  description: string
  stages: number[]
  currentStage: number
  completed: boolean
  claimed: boolean
  current: number
}

export function GrowthTasks() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', description: 'Like agent stories', stages: [10, 50, 100], currentStage: 0, completed: false, claimed: false, current: 0 },
    { id: '2', description: 'Share agent stories', stages: [5, 10, 20], currentStage: 0, completed: false, claimed: false, current: 0 },
    { id: '3', description: 'Create agent stories', stages: [5, 10, 15], currentStage: 0, completed: false, claimed: false, current: 0 },
    { id: '4', description: 'Comment on agent stories', stages: [5, 10, 15], currentStage: 0, completed: false, claimed: false, current: 0 },
  ])

  const handleProgress = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const newCurrent = task.current + 1
        return {
          ...task,
          current: newCurrent,
          completed: newCurrent >= task.stages[task.currentStage]
        }
      }
      return task
    }))
  }

  const handleClaim = (id: string) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const newStage = task.currentStage + 1
        return {
          ...task,
          currentStage: newStage,
          current: 0,
          completed: newStage >= task.stages.length
        }
      }
      return task
    }))
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
              <span className={`text-sm ${task.completed ? 'text-gray-400' : 'text-white'}`}>
                {task.description}
              </span>
            </div>
            <span className="text-sm text-amber-500 font-medium">
              {task.current}/{task.stages[task.currentStage]}
            </span>
          </div>
          <div className="w-full bg-gray-600 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full" 
              style={{ width: `${(task.current / task.stages[task.currentStage]) * 100}%` }}
            ></div>
          </div>
          {task.completed && task.currentStage >= task.stages.length - 1 ? (
            <span className="w-full text-center text-sm text-gray-400">已完成所有阶段</span>
          ) : task.current >= task.stages[task.currentStage] ? (
            <button
              onClick={() => handleClaim(task.id)}
              className="w-full px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition-colors"
            >
              领取并进入下一阶段
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

