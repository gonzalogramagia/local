'use client'

import { useState, useEffect, useRef } from 'react'
import { Timer, Trash2, CalendarClock, Plus, Pencil, X } from 'lucide-react'
import { usePathname } from 'next/navigation'

interface CountdownItem {
    id: string
    name: string
    date: string
}

export default function Countdown() {
    const [countdowns, setCountdowns] = useState<CountdownItem[]>([])
    const [mounted, setMounted] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', date: '' })
    const pathname = usePathname()
    const isEnglish = pathname?.startsWith('/en')
    const containerRef = useRef<HTMLDivElement>(null)

    // Close form when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsCreating(false)
                setEditingId(null)
            }
        }
        if (isCreating || editingId) {
            document.addEventListener('click', handleClickOutside)
        }
        return () => document.removeEventListener('click', handleClickOutside)
    }, [isCreating, editingId])

    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        const checkVisibility = () => {
            const saved = localStorage.getItem('config-show-countdown')
            setIsVisible(saved !== 'false')
        }
        checkVisibility()
        window.addEventListener('config-update', checkVisibility)
        return () => window.removeEventListener('config-update', checkVisibility)
    }, [])

    useEffect(() => {
        setMounted(true)
        const loadCountdowns = () => {
            const saved = localStorage.getItem('countdown-events')
            if (saved) {
                try {
                    setCountdowns(JSON.parse(saved))
                } catch (e) {
                    console.error('Failed to parse countdowns', e)
                }
            } else {
                // Fallback to old single-event format if exists
                const oldSaved = localStorage.getItem('countdown-event')
                if (oldSaved) {
                    try {
                        const old = JSON.parse(oldSaved)
                        const migrated = [{ id: crypto.randomUUID(), name: old.name, date: old.date }]
                        setCountdowns(migrated)
                        localStorage.setItem('countdown-events', JSON.stringify(migrated))
                        localStorage.removeItem('countdown-event')
                    } catch (e) { }
                }
            }
        }

        loadCountdowns()

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'countdown-events') {
                loadCountdowns()
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    useEffect(() => {
        if (!mounted) return
        localStorage.setItem('countdown-events', JSON.stringify(countdowns))
    }, [countdowns, mounted])

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name || !formData.date) return

        if (editingId) {
            setCountdowns(countdowns.map(c => c.id === editingId ? { ...c, ...formData } : c))
            setEditingId(null)
        } else {
            if (countdowns.length >= 2) return
            setCountdowns([...countdowns, { id: crypto.randomUUID(), ...formData }])
            setIsCreating(false)
        }
        setFormData({ name: '', date: '' })
    }

    const handleDelete = (id: string) => {
        setCountdowns(countdowns.filter(c => c.id !== id))
    }

    const startEditing = (item: CountdownItem) => {
        setEditingId(item.id)
        setFormData({ name: item.name, date: item.date })
        setIsCreating(false)
    }

    if (!mounted) return null

    return (
        <div ref={containerRef} className={`fixed right-9 top-48 z-40 hidden xl:flex flex-col gap-4 w-64 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'}`}>
            <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 transition-all">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 pt-1 text-sm flex items-center gap-2">
                        <CalendarClock size={16} />
                        {isEnglish ? 'Countdown' : 'Cuenta Regresiva'}
                    </h3>
                    {countdowns.length < 2 && !editingId && (
                        <button
                            onClick={() => {
                                setIsCreating(!isCreating)
                                setFormData({ name: '', date: '' })
                            }}
                            className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${isCreating ? 'text-red-500 opacity-100' : 'text-zinc-500 opacity-0 group-hover:opacity-100'} transition-opacity`}
                        >
                            {isCreating ? <X size={16} /> : <Plus size={16} />}
                        </button>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    {countdowns.map((item, index) => (
                        <div key={item.id} className="relative group/item">
                            <CountdownDisplay
                                item={item}
                                isEnglish={isEnglish}
                                onDelete={() => handleDelete(item.id)}
                                onEdit={() => startEditing(item)}
                                isEditing={editingId === item.id}
                            />
                            {editingId === item.id && (
                                <div className="mt-2">
                                    <CountdownForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        handleSave={handleSave}
                                        isEnglish={isEnglish}
                                        onCancel={() => {
                                            setEditingId(null)
                                            setFormData({ name: '', date: '' })
                                        }}
                                        isEditing={true}
                                    />
                                </div>
                            )}
                            {index === 0 && countdowns.length > 1 && !editingId && (
                                <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800" />
                            )}
                        </div>
                    ))}

                    {countdowns.length === 0 && !isCreating && (
                        <div className="text-xs text-zinc-400 dark:text-zinc-600 text-center pt-5 pb-6 italic">
                            {isEnglish ? 'No active countdown' : 'No hay cuenta regresiva aún'}
                        </div>
                    )}

                    {isCreating && (
                        <CountdownForm
                            formData={formData}
                            setFormData={setFormData}
                            handleSave={handleSave}
                            isEnglish={isEnglish}
                            isEditing={false}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

function CountdownDisplay({ item, isEnglish, onDelete, onEdit, isEditing }: {
    item: CountdownItem,
    isEnglish: boolean,
    onDelete: () => void,
    onEdit: () => void,
    isEditing: boolean
}) {
    const [timeLeft, setTimeLeft] = useState('')
    const [timeColor, setTimeColor] = useState('text-zinc-500')
    const [funMessage, setFunMessage] = useState('')

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(item.date) - +new Date()

            if (difference > 0) {
                const totalMinutes = Math.floor(difference / (1000 * 60))
                const days = Math.floor(difference / (1000 * 60 * 60 * 24))
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
                const minutes = Math.floor((difference / 1000 / 60) % 60)
                const seconds = Math.floor((difference / 1000) % 60)

                if (totalMinutes <= 5) {
                    setTimeColor('text-red-500 animate-pulse')
                    setFunMessage(isEnglish ? 'Hurry up! 😱🔥' : 'Apurate! 😱🔥')
                } else if (totalMinutes <= 15) {
                    setTimeColor('text-yellow-500')
                    setFunMessage(isEnglish ? 'Almost there! 🏃‍♂️💨' : 'Ya casi! 🏃‍♂️💨')
                } else {
                    setTimeColor('text-zinc-500 dark:text-zinc-400')
                    setFunMessage(isEnglish ? 'Keep going! 🚀' : 'Seguí así! 🚀')
                }

                return `${isEnglish ? 'In' : 'En'} ${days}d ${hours}h ${minutes}m ${seconds}s`
            } else {
                setTimeColor('text-green-500 font-bold')
                setFunMessage(isEnglish ? 'Enjoy! 🎉🥳' : 'Disfrutá! 🎉🥳')
                return isEnglish ? 'Event started!' : '¡Evento iniciado!'
            }
        }

        setTimeLeft(calculateTimeLeft())
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
        return () => clearInterval(timer)
    }, [item.date, isEnglish])

    const date = new Date(item.date)
    const formattedDate = isEnglish
        ? (() => {
            const weekday = date.toLocaleString('en-US', { weekday: 'long' })
            const month = date.toLocaleString('en-US', { month: 'long' })
            const day = date.getDate()
            const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            return `On ${weekday}, ${month} ${day} at ${time}`
        })()
        : (() => {
            const weekday = date.toLocaleString('es-AR', { weekday: 'long' })
            const month = date.toLocaleString('es-AR', { month: 'long' })
            const day = date.getDate()
            const time = date.toLocaleString('es-AR', { hour: 'numeric', minute: '2-digit', hour12: true })

            const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1)
            const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1)

            return `El ${capitalizedWeekday} ${day} de ${capitalizedMonth} a las ${time.replace('a. m.', 'a.m.').replace('p. m.', 'p.m.')}`
        })()

    return (
        <div className={`flex flex-col gap-1 relative transition-opacity ${isEditing ? 'opacity-30 pointer-events-none' : ''}`}>
            <div className="absolute -top-1 right-0 flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <button
                    onClick={onEdit}
                    className="text-zinc-400 hover:text-[#6866D6] transition-colors cursor-pointer p-1"
                    title={isEnglish ? 'Edit' : 'Editar'}
                >
                    <Pencil size={14} />
                </button>
                <button
                    onClick={onDelete}
                    className="text-zinc-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                    title={isEnglish ? 'Delete' : 'Eliminar'}
                >
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100 break-words pr-12 leading-tight">
                {item.name}
            </div>

            <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">
                {formattedDate}
            </div>

            <div className={`text-xl font-mono font-bold tracking-tight ${timeColor} transition-colors duration-500`}>
                {timeLeft}
            </div>

            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1 animate-bounce">
                {funMessage}
            </div>
        </div>
    )
}

function CountdownForm({ formData, setFormData, handleSave, isEnglish, onCancel, isEditing }: {
    formData: { name: string, date: string },
    setFormData: (data: { name: string, date: string }) => void,
    handleSave: (e: React.FormEvent) => void,
    isEnglish: boolean,
    onCancel?: () => void,
    isEditing: boolean
}) {
    return (
        <form onSubmit={handleSave} className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200 pt-2">
            <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isEnglish ? 'Event name...' : 'Nombre del evento...'}
                autoFocus
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded text-xs px-2 py-1.5 focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 outline-none text-zinc-800 dark:text-zinc-200"
            />
            <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded text-xs px-2 py-1.5 focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 outline-none text-zinc-800 dark:text-zinc-200"
            />
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={!formData.name || !formData.date}
                    className="flex-1 bg-[#6866D6] text-white rounded p-1.5 text-xs hover:bg-[#5856c4] disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                    <Timer size={14} />
                    {isEnglish ? 'Save' : 'Guardar'}
                </button>
                {isEditing && onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="p-1.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-500 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>
        </form>
    )
}
