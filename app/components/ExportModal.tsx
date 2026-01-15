'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, X, CheckSquare, Square } from 'lucide-react';
import Link from 'next/link';

interface ExportModalProps {
    lang: 'en' | 'es';
}

export default function ExportModal({ lang }: ExportModalProps) {
    const router = useRouter();
    const isEnglish = lang === 'en';

    // State
    const [filename, setFilename] = useState('backup');
    const [selected, setSelected] = useState({
        shortcutsLeft: true,
        shortcutsRight: true,
        tasks: true,
        countdown: true,
        notes: true,
    });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Translations
    const t = {
        title: isEnglish ? 'Export Backup' : 'Exportar Backup',
        filenameLabel: isEnglish ? 'Filename' : 'Nombre del archivo',
        selectLabel: isEnglish ? 'Select what to export:' : 'Elige qué exportar:',
        shortcutsLeft: isEnglish ? 'Left Navigation Shortcuts' : 'Atajos de Navegación Izquierda',
        shortcutsRight: isEnglish ? 'Right Navigation Shortcuts' : 'Atajos de Navegación Derecha',
        tasks: isEnglish ? 'Daily Tasks' : 'Tareas Diarias',
        countdown: isEnglish ? 'Countdown' : 'Cuenta Regresiva',
        notes: isEnglish ? 'Notes' : 'Notas',
        exportBtn: isEnglish ? 'Export' : 'Exportar',
        cancelBtn: isEnglish ? 'Cancel' : 'Cancelar',
    };

    const toggle = (key: keyof typeof selected) => {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExport = () => {
        const data: any = {};

        // Shortcuts
        if (selected.shortcutsLeft || selected.shortcutsRight) {
            const savedShortcuts = localStorage.getItem('local-shortcuts');
            if (savedShortcuts) {
                try {
                    const parsed = JSON.parse(savedShortcuts);
                    if (Array.isArray(parsed)) {
                        const left = parsed.filter((s: any) => s.position === 'left' || (!s.position && false)); // Default right
                        const right = parsed.filter((s: any) => s.position === 'right' || !s.position);

                        data.shortcuts = [];
                        if (selected.shortcutsLeft) data.shortcuts.push(...left);
                        if (selected.shortcutsRight) data.shortcuts.push(...right);
                    }
                } catch (e) {
                    console.error("Error parsing shortcuts for export", e);
                }
            }
        }

        // Tasks
        if (selected.tasks) {
            const savedTasks = localStorage.getItem('daily-tasks');
            if (savedTasks) {
                try {
                    data.tasks = JSON.parse(savedTasks);
                } catch (e) {
                    console.error("Error parsing tasks for export", e);
                }
            }
        }

        // Countdown
        if (selected.countdown) {
            const savedCountdown = localStorage.getItem('countdown-event');
            if (savedCountdown) {
                try {
                    data.countdown = JSON.parse(savedCountdown);
                } catch (e) {
                    console.error("Error parsing countdown for export", e);
                }
            }
        }

        // Notes
        if (selected.notes) {
            const savedNotes = localStorage.getItem('localhost-blocks');
            if (savedNotes) {
                try {
                    data.notes = JSON.parse(savedNotes);
                } catch (e) {
                    console.error("Error parsing notes for export", e);
                }
            }
        }

        // Download
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `home-${filename || 'backup'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <FileUp className="w-5 h-5" />
                        {t.title}
                    </h1>
                    <Link href="/" className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </Link>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Filename Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            {t.filenameLabel}
                        </label>
                        <div className="flex items-center">
                            <div className="bg-zinc-100 dark:bg-zinc-800 border border-r-0 border-zinc-200 dark:border-zinc-700 rounded-l-md px-3 py-2 text-sm text-zinc-500">
                                home-
                            </div>
                            <input
                                type="text"
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                                className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                                placeholder="backup"
                            />
                            <div className="bg-zinc-100 dark:bg-zinc-800 border border-l-0 border-zinc-200 dark:border-zinc-700 rounded-r-md px-3 py-2 text-sm text-zinc-500">
                                .json
                            </div>
                        </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">
                            {t.selectLabel}
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { key: 'shortcutsLeft', label: t.shortcutsLeft },
                                { key: 'shortcutsRight', label: t.shortcutsRight },
                                { key: 'tasks', label: t.tasks },
                                { key: 'countdown', label: t.countdown },
                                { key: 'notes', label: t.notes },
                            ].map(({ key, label }) => (
                                <div
                                    key={key}
                                    onClick={() => toggle(key as keyof typeof selected)}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                >
                                    <div className={`${selected[key as keyof typeof selected] ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                        {selected[key as keyof typeof selected] ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </div>
                                    <span className="text-sm font-medium">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <Link
                        href="/"
                        className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        {t.cancelBtn}
                    </Link>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                        <FileUp className="w-4 h-4" />
                        {t.exportBtn}
                    </button>
                </div>
            </div>
        </div>
    );
}
