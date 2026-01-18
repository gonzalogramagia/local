'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Check, Square, CheckSquare } from 'lucide-react'
import { usePathname } from 'next/navigation'

type Task = {
    id: string
    text: string
    url?: string
    completed: boolean
}

export default function DailyTasks() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [inputValue, setInputValue] = useState('')
    const [urlValue, setUrlValue] = useState('')
    const [mounted, setMounted] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const pathname = usePathname()
    const isEnglish = pathname?.startsWith('/en')
    const containerRef = useRef<HTMLDivElement>(null)

    // Helper to get Argentina date string YYYY-MM-DD
    const getArgentinaDate = () => {
        return new Date().toLocaleDateString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        })
    }

    // Close form when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsAdding(false)
            }
        }

        if (isAdding) {
            document.addEventListener('click', handleClickOutside)
        }
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [isAdding])

    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const checkVisibility = () => {
            const saved = localStorage.getItem('config-show-tasks')
            setIsVisible(saved !== 'false')
        }

        checkVisibility()
        window.addEventListener('config-update', checkVisibility)
        return () => window.removeEventListener('config-update', checkVisibility)
    }, [])

    useEffect(() => {
        setMounted(true)
        const savedTasks = localStorage.getItem('daily-tasks')
        const lastReset = localStorage.getItem('daily-tasks-last-reset')
        const today = getArgentinaDate()

        let parsedTasks: Task[] = []
        if (savedTasks) {
            try {
                parsedTasks = JSON.parse(savedTasks)
            } catch (e) {
                console.error('Failed to parse daily tasks', e)
            }
        }

        // Check if reset is needed (if last reset was not today)
        if (lastReset !== today) {
            parsedTasks = parsedTasks.map(t => ({ ...t, completed: false }))
            localStorage.setItem('daily-tasks-last-reset', today)
        }

        setTasks(parsedTasks)

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'daily-tasks' && e.newValue) {
                try {
                    setTasks(JSON.parse(e.newValue))
                } catch (err) {
                    console.error('Failed to sync tasks', err)
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    useEffect(() => {
        if (!mounted) return
        localStorage.setItem('daily-tasks', JSON.stringify(tasks))
    }, [tasks, mounted])

    // Interval to check for date change if the app is kept open
    useEffect(() => {
        const interval = setInterval(() => {
            const lastReset = localStorage.getItem('daily-tasks-last-reset')
            const today = getArgentinaDate()
            if (lastReset !== today) {
                setTasks(current => current.map(t => ({ ...t, completed: false })))
                localStorage.setItem('daily-tasks-last-reset', today)
            }
        }, 60000) // Check every minute
        return () => clearInterval(interval)
    }, [])

    const addTask = (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!inputValue.trim()) return

        const newTask: Task = {
            id: crypto.randomUUID(),
            text: inputValue.trim(),
            url: urlValue.trim() || undefined,
            completed: false
        }
        setTasks([...tasks, newTask])
        setInputValue('')
        setUrlValue('')
        setIsAdding(false)
    }

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t =>
            t.id === id ? { ...t, completed: !t.completed } : t
        ))
    }

    const confirmDelete = (id: string) => {
        if (deletingId === id) {
            setTasks(tasks.filter(t => t.id !== id))
            setDeletingId(null)
        } else {
            setDeletingId(id)
        }
    }

    if (!mounted) return null

    return (
        <div ref={containerRef} className={`fixed left-9 top-48 z-40 hidden xl:flex flex-col gap-4 w-64 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'}`}>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 transition-all">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 text-sm flex items-center justify-start gap-2 relative group w-max cursor-default">
                        <span className="text-base select-none">
                            🕒
                        </span>
                        <span>{isEnglish ? 'Daily Tasks' : 'Tareas Diarias'}</span>
                        <div className="absolute left-full ml-2 top-0 -translate-y-[10%] w-max bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-0 z-50">
                            {isEnglish ? 'Resets at 23:59' : 'Se resetean a las 23:59'}
                        </div>
                    </h3>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${isAdding ? 'invisible' : ''}`}
                    >
                        <Plus size={16} className="text-zinc-500" />
                    </button>
                </div>

                <div className={`space-y-2 max-h-[60vh] overflow-y-auto mb-3 custom-scrollbar transition-opacity duration-200 ${isAdding ? 'opacity-50 pointer-events-none' : ''}`}>
                    {tasks.map(task => (
                        <div key={task.id} className="group flex items-center gap-2 text-sm">
                            <button
                                onClick={() => toggleTask(task.id)}
                                className={`flex-shrink-0 transition-colors cursor-pointer ${task.completed ? 'text-green-500' : 'text-zinc-300 dark:text-zinc-600 hover:text-zinc-400'}`}
                            >
                                {task.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                            </button>
                            <span className={`flex-1 break-words transition-all ${task.completed ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                {task.url ? (
                                    <a
                                        href={task.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline decoration-zinc-400 dark:decoration-zinc-600"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {task.text}
                                    </a>
                                ) : (
                                    task.text
                                )}
                            </span>
                            {!isAdding && (
                                <button
                                    onClick={() => confirmDelete(task.id)}
                                    className={`opacity-0 group-hover:opacity-100 transition-all p-1 cursor-pointer ${deletingId === task.id ? 'text-red-500 opacity-100' : 'text-zinc-400 hover:text-red-500'}`}
                                >
                                    {deletingId === task.id ? <Check size={14} /> : <Trash2 size={14} />}
                                </button>
                            )}
                        </div>
                    ))}

                    {tasks.length === 0 && (
                        <div className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-4 italic">
                            {isEnglish ? 'No tasks for today' : 'No hay tareas para hoy'}
                        </div>
                    )}
                </div>

                {isAdding && (
                    <form onSubmit={addTask} className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={isEnglish ? 'Add task...' : 'Agregar tarea...'}
                                autoFocus
                                className="flex-1 bg-zinc-50 dark:bg-zinc-800 border-none rounded text-xs px-2 py-1.5 focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 outline-none text-zinc-800 dark:text-zinc-200"
                            />
                            <button
                                type="submit"
                                disabled={!inputValue.trim()}
                                className="bg-[#6866D6] text-white rounded p-1.5 hover:bg-[#5856c4] disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                <Plus size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false)
                                    setInputValue('')
                                    setUrlValue('')
                                }}
                                className="rounded p-1.5 transition-colors cursor-pointer bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        <input
                            type="text"
                            value={urlValue}
                            onChange={(e) => setUrlValue(e.target.value)}
                            placeholder={isEnglish ? 'Optional URL...' : 'URL opcional...'}
                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded text-xs px-2 py-1.5 focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 outline-none text-zinc-800 dark:text-zinc-200 text-xs"
                        />
                    </form>
                )}
            </div>
        </div>
    )
}
