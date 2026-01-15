'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FileDown, X, CheckSquare, Square, FileJson, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface ImportModalProps {
    lang: 'en' | 'es';
}

export default function ImportModal({ lang }: ImportModalProps) {
    const router = useRouter();
    const isEnglish = lang === 'en';

    // State
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selected, setSelected] = useState({
        shortcutsLeft: true,
        shortcutsRight: true,
        tasks: true,
        countdown: true,
        notes: true,
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    // Translations
    const t = {
        title: isEnglish ? 'Import Backup' : 'Importar Backup',
        dropLabel: isEnglish ? 'Drop JSON file here or click to upload' : 'Arrastra el archivo JSON aquí o click para subir',
        selectLabel: isEnglish ? 'Select what to import:' : 'Elige qué importar:',
        shortcutsLeft: isEnglish ? 'Left Custom Shortcuts' : 'Atajos Personalizados Izquierda',
        shortcutsRight: isEnglish ? 'Right Custom Shortcuts' : 'Atajos Personalizados Derecha',
        tasks: isEnglish ? 'Daily Tasks' : 'Tareas Diarias',
        countdown: isEnglish ? 'Countdown' : 'Cuenta Regresiva',
        notes: isEnglish ? 'Notes' : 'Notas',
        importBtn: isEnglish ? 'Import' : 'Importar',
        cancelBtn: isEnglish ? 'Cancel' : 'Cancelar',
        invalidFile: isEnglish ? 'Invalid JSON file' : 'Archivo JSON inválido',
        noData: isEnglish ? 'No valid data found in file' : 'No se encontraron datos válidos',
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) processFile(f);
    };

    const processFile = (f: File) => {
        setFile(f);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const json = JSON.parse(text);
                setPreviewData(json);
            } catch (err) {
                setError(t.invalidFile);
                setPreviewData(null);
            }
        };
        reader.readAsText(f);
    };

    const toggle = (key: keyof typeof selected) => {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const hasData = (key: string) => {
        if (!previewData) return false;
        if (key === 'shortcuts') return previewData.shortcuts && previewData.shortcuts.length > 0;
        return !!previewData[key];
    };

    const handleImport = () => {
        if (!previewData) return;

        // Shortcuts Logic
        if ((selected.shortcutsLeft || selected.shortcutsRight) && previewData.shortcuts && Array.isArray(previewData.shortcuts)) {
            const currentSaved = localStorage.getItem('local-shortcuts');
            let currentShortcuts = currentSaved ? JSON.parse(currentSaved) : [];
            if (!Array.isArray(currentShortcuts)) currentShortcuts = [];

            // 1. Filter out existing shortcuts for the selected sides (we replace them)
            if (selected.shortcutsLeft) {
                currentShortcuts = currentShortcuts.filter((s: any) => s.position !== 'left'); // Remove existing left
            }
            if (selected.shortcutsRight) {
                currentShortcuts = currentShortcuts.filter((s: any) => s.position === 'left'); // Keep only left (remove right)
            }

            // 2. Add new shortcuts for selected sides
            if (selected.shortcutsLeft) {
                const newLeft = previewData.shortcuts.filter((s: any) => s.position === 'left');
                currentShortcuts.push(...newLeft);
            }
            if (selected.shortcutsRight) {
                const newRight = previewData.shortcuts.filter((s: any) => s.position !== 'left'); // Default to right
                currentShortcuts.push(...newRight);
            }

            localStorage.setItem('local-shortcuts', JSON.stringify(currentShortcuts));
        }

        // Tasks Logic
        if (selected.tasks && previewData.tasks) {
            localStorage.setItem('daily-tasks', JSON.stringify(previewData.tasks));
        }

        // Countdown Logic
        if (selected.countdown && previewData.countdown) {
            localStorage.setItem('countdown-event', JSON.stringify(previewData.countdown));
        }

        // Notes Logic
        if (selected.notes && previewData.notes) {
            localStorage.setItem('localhost-blocks', JSON.stringify(previewData.notes));
        }

        router.push('/');
    };

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <h1 className="text-lg font-semibold flex items-center gap-2">
                        <FileDown className="w-5 h-5" />
                        {t.title}
                    </h1>
                    <Link href="/" className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </Link>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* File Upload */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${file ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
                            }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {file ? (
                            <>
                                <FileJson className="w-10 h-10 text-blue-500 mb-2" />
                                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{file.name}</span>
                                <span className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</span>
                            </>
                        ) : (
                            <>
                                <FileDown className="w-10 h-10 text-zinc-400 mb-2" />
                                <span className="text-sm text-zinc-500 max-w-[200px]">{t.dropLabel}</span>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Checkboxes */}
                    {previewData && !error && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block">
                                {t.selectLabel}
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {[
                                    { key: 'shortcutsLeft', label: t.shortcutsLeft, dataKey: 'shortcuts' },
                                    { key: 'shortcutsRight', label: t.shortcutsRight, dataKey: 'shortcuts' },
                                    { key: 'tasks', label: t.tasks, dataKey: 'tasks' },
                                    { key: 'countdown', label: t.countdown, dataKey: 'countdown' },
                                    { key: 'notes', label: t.notes, dataKey: 'notes' },
                                ].map(({ key, label, dataKey }) => {
                                    const available = hasData(dataKey);
                                    return (
                                        <div
                                            key={key}
                                            onClick={() => available && toggle(key as keyof typeof selected)}
                                            className={`flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors ${available
                                                ? 'cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                                : 'opacity-50 cursor-not-allowed bg-zinc-50 dark:bg-zinc-900'
                                                }`}
                                        >
                                            <div className={`${selected[key as keyof typeof selected] ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                                {selected[key as keyof typeof selected] ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                            </div>
                                            <span className="text-sm font-medium">{label}</span>
                                            {!available && <span className="text-xs text-zinc-400 ml-auto">(No data)</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
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
                        onClick={handleImport}
                        disabled={!file || !previewData}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center gap-2"
                    >
                        <FileDown className="w-4 h-4" />
                        {t.importBtn}
                    </button>
                </div>
            </div>
        </div>
    );
}
