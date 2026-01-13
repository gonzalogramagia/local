'use client'

import { useState, useEffect, useRef } from 'react'
import { Timer, Trash2, CalendarClock, Plus } from 'lucide-react'
import { usePathname } from 'next/navigation'

export default function Countdown() {
    const [eventName, setEventName] = useState('')
    const [targetDate, setTargetDate] = useState('')
    const [timeLeft, setTimeLeft] = useState('')
    const [timeColor, setTimeColor] = useState('text-zinc-500')
    const [funMessage, setFunMessage] = useState('')
    const [isActive, setIsActive] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [mounted, setMounted] = useState(false)
    const pathname = usePathname()
    const isEnglish = pathname?.startsWith('/en')
    const containerRef = useRef<HTMLDivElement>(null)

    // Close form when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsCreating(false)
            }
        }

        if (isCreating) {
            document.addEventListener('click', handleClickOutside)
        }
        return () => {
            document.removeEventListener('click', handleClickOutside)
        }
    }, [isCreating])

    const [isVisible, setIsVisible] = useState(true)

    // Visibility check
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
        const saved = localStorage.getItem('countdown-event')
        if (saved) {
            try {
                const { name, date } = JSON.parse(saved)
                setEventName(name)
                setTargetDate(date)
                setIsActive(true)
            } catch (e) {
                console.error('Failed to parse countdown', e)
            }
        }
    }, [])

    useEffect(() => {
        if (!isActive || !targetDate) return

        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date()

            if (difference > 0) {
                const totalMinutes = Math.floor(difference / (1000 * 60))
                const days = Math.floor(difference / (1000 * 60 * 60 * 24))
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
                const minutes = Math.floor((difference / 1000 / 60) % 60)
                const seconds = Math.floor((difference / 1000) % 60)

                // Color logic
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

                return `${days}d ${hours}h ${minutes}m ${seconds}s`
            } else {
                setTimeColor('text-green-500 font-bold')
                setFunMessage(isEnglish ? 'Enjoy! 🎉🥳' : 'Disfrutá! 🎉🥳')
                return isEnglish ? 'Event started!' : '¡Evento iniciado!'
            }
        }

        setTimeLeft(calculateTimeLeft())

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft())
        }, 1000)

        return () => clearInterval(timer)
    }, [isActive, targetDate, isEnglish])

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        if (!eventName || !targetDate) return

        setIsActive(true)
        localStorage.setItem('countdown-event', JSON.stringify({ name: eventName, date: targetDate }))
    }

    const handleDelete = () => {
        setIsActive(false)
        setEventName('')
        setTargetDate('')
        setTimeLeft('')
        setFunMessage('')
        localStorage.removeItem('countdown-event')
    }

    if (!mounted) return null

    // Format target date for display
    const formattedDate = targetDate ? new Date(targetDate).toLocaleString(isEnglish ? 'en-US' : 'es-AR', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : ''

    return (
        <div ref={containerRef} className={`fixed right-9 top-48 z-40 hidden xl:flex flex-col gap-4 w-64 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none select-none'}`}>
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg p-4 transition-all">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100 pt-1 text-sm flex items-center gap-2">
                        <CalendarClock size={16} />
                        {isEnglish ? 'Countdown' : 'Cuenta Regresiva'}
                    </h3>
                    {!isActive && (
                        <button
                            onClick={() => setIsCreating(!isCreating)}
                            className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer ${isCreating ? 'rotate-45' : ''}`}
                        >
                            <Plus size={16} className="text-zinc-500" />
                        </button>
                    )}
                </div>

                {isActive ? (
                    <div className="flex flex-col gap-1 relative">
                        <button
                            onClick={handleDelete}
                            className="absolute -top-1 right-0 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                            title={isEnglish ? 'Delete' : 'Eliminar'}
                        >
                            <Trash2 size={14} />
                        </button>

                        <div className="font-bold text-lg text-zinc-800 dark:text-zinc-100 break-words pr-6 leading-tight">
                            {eventName}
                        </div>

                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-1">
                            {isEnglish ? 'Starts:' : 'Inicia:'} {formattedDate}
                        </div>

                        <div className={`text-xl font-mono font-bold tracking-tight ${timeColor} transition-colors duration-500`}>
                            {timeLeft}
                        </div>

                        <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mt-1 animate-bounce">
                            {funMessage}
                        </div>
                    </div>
                ) : (
                    <>
                        {!isCreating && (
                            <div className="text-xs text-zinc-400 dark:text-zinc-600 text-center pt-5 pb-6 italic">
                                {isEnglish ? 'No active countdown' : 'No hay cuenta regresiva aún'}
                            </div>
                        )}
                        {isCreating && (
                            <form onSubmit={handleSave} className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <input
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder={isEnglish ? 'Event name...' : 'Nombre del evento...'}
                                    autoFocus
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded text-xs px-2 py-1.5 focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 outline-none text-zinc-800 dark:text-zinc-200"
                                />
                                <input
                                    type="datetime-local"
                                    value={targetDate}
                                    onChange={(e) => setTargetDate(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-none rounded text-xs px-2 py-1.5 focus:ring-1 focus:ring-zinc-300 dark:focus:ring-zinc-600 outline-none text-zinc-800 dark:text-zinc-200"
                                />
                                <button
                                    type="submit"
                                    disabled={!eventName || !targetDate}
                                    className="bg-black dark:bg-white text-white dark:text-black rounded p-1.5 text-xs hover:opacity-80 disabled:opacity-50 transition-opacity cursor-pointer flex items-center justify-center gap-1"
                                >
                                    <Timer size={14} />
                                    {isEnglish ? 'Start' : 'Iniciar'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
