'use client'

import { useState, useEffect } from 'react'

interface HeaderProps {
    lang: 'es' | 'en'
    onAddNote?: () => void
    addNoteText?: string
}

export default function Header({ lang, onAddNote, addNoteText }: HeaderProps) {
    const [currentTime, setCurrentTime] = useState<Date | null>(null)
    const [showClock, setShowClock] = useState(true)

    useEffect(() => {
        setCurrentTime(new Date())
        const timer = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        const checkVisibility = () => {
            const saved = localStorage.getItem('config-show-clock')
            setShowClock(saved !== 'false')
        }

        checkVisibility()
        window.addEventListener('config-update', checkVisibility)
        return () => window.removeEventListener('config-update', checkVisibility)
    }, [])

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(lang === 'es' ? 'es-AR' : 'en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    if (!currentTime) return null

    return (
        <div className={`flex flex-col ${showClock ? 'lg:flex-row lg:mb-6 lg:gap-0' : 'lg:mb-20'} items-center justify-center gap-8 -mt-16 lg:-mt-[5.75rem] -mb-4`}>
            {/* Image - Visible on all screens. On mobile it stands alone (replacing clock/calendar which is hidden) */}
            <img
                src="/notes.png"
                alt="Notes"
                className="w-72 h-auto object-contain select-none pointer-events-none"
            />

            {/* Desktop Content */}
            {showClock ? (
                /* Clock + Add Button Container - Visible on Desktop when clock is enabled */
                <div className="hidden lg:flex flex-col items-start justify-center gap-2 -mt-4 -ml-3 animate-in fade-in slide-in-from-top-4 duration-500 transition-opacity">
                    <div className="flex flex-col items-start justify-start">
                        <span className="text-6xl font-black font-mono tracking-tighter text-zinc-900 leading-none cursor-default select-none hover:scale-105 transition-transform">
                            {formatTime(currentTime)}
                        </span>
                        <span className="text-lg text-zinc-500 font-medium capitalize cursor-default select-none">
                            {formatDate(currentTime)}
                        </span>
                    </div>

                    {onAddNote && (
                        <button
                            onClick={onAddNote}
                            className="px-6 py-2 bg-[#6866D6] text-white text-sm font-medium rounded-full hover:bg-[#5856c4] transition-all hover:scale-105 shadow-md cursor-pointer min-w-[200px]"
                        >
                            {addNoteText || "Agregar otra nota +"}
                        </button>
                    )}
                </div>
            ) : (
                /* Button Only - Visible on Desktop when clock is disabled (centered below logo) */
                onAddNote && (
                    <div className="hidden lg:block animate-in fade-in slide-in-from-top-4 duration-500 -mt-20">
                        <button
                            onClick={onAddNote}
                            className="px-6 py-1 bg-[#6866D6] text-white text-sm font-medium rounded-full hover:bg-[#5856c4] transition-all hover:scale-105 shadow-md cursor-pointer min-w-[200px]"
                        >
                            {addNoteText || "Agregar otra nota +"}
                        </button>
                    </div>
                )
            )}
        </div>
    )
}
