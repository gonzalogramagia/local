'use client';

import { Wrench, Languages, FileDown, FileUp, X, Eye, EyeOff, ExternalLink, AppWindow, Command } from "lucide-react";
import Link from 'next/link';
import { useState, useEffect } from "react";
import { Language } from "../data/i18n";

interface ConfigModalProps {
    lang: Language;
    onClose: () => void;
    toggleLanguage: () => void; // Passed from parent
    exportPath: string; // Passed from parent
    importPath: string; // Passed from parent
}

export default function ConfigModal({ lang, onClose, toggleLanguage, exportPath, importPath }: ConfigModalProps) {
    const [showTasks, setShowTasks] = useState(true);
    const [showCountdown, setShowCountdown] = useState(true);
    const [showClock, setShowClock] = useState(true);
    const [openInTab, setOpenInTab] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(true);

    useEffect(() => {
        // Load initial state
        const savedTasks = localStorage.getItem('config-show-tasks');
        const savedCountdown = localStorage.getItem('config-show-countdown');
        const savedClock = localStorage.getItem('config-show-clock');
        const savedOpenInTab = localStorage.getItem('config-open-in-new-tab');
        const savedShortcuts = localStorage.getItem('config-show-shortcuts');

        setShowTasks(savedTasks !== 'false'); // Default true
        setShowCountdown(savedCountdown !== 'false'); // Default true
        setShowClock(savedClock !== 'false'); // Default true
        setOpenInTab(savedOpenInTab === 'true'); // Default false
        setShowShortcuts(savedShortcuts !== 'false'); // Default true
    }, []);

    const handleToggleTasks = () => {
        const newValue = !showTasks;
        setShowTasks(newValue);
        localStorage.setItem('config-show-tasks', String(newValue));
        window.dispatchEvent(new Event('config-update'));
    };

    const handleToggleCountdown = () => {
        const newValue = !showCountdown;
        setShowCountdown(newValue);
        localStorage.setItem('config-show-countdown', String(newValue));
        window.dispatchEvent(new Event('config-update'));
    };

    const handleToggleClock = () => {
        const newValue = !showClock;
        setShowClock(newValue);
        localStorage.setItem('config-show-clock', String(newValue));
        window.dispatchEvent(new Event('config-update'));
    };

    const handleToggleOpenInTab = () => {
        const newValue = !openInTab;
        setOpenInTab(newValue);
        localStorage.setItem('config-open-in-new-tab', String(newValue));
        // No event needed for this one as it's read on demand, but good practice maybe?
        window.dispatchEvent(new Event('config-update'));
    };

    const handleToggleShortcuts = () => {
        const newValue = !showShortcuts;
        setShowShortcuts(newValue);
        localStorage.setItem('config-show-shortcuts', String(newValue));
        window.dispatchEvent(new Event('config-update'));
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-md relative z-[70] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Wrench className="w-5 h-5 scale-x-[-1]" />
                        {lang === 'en' ? 'Configuration' : 'Configuración'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Language Switch */}
                    <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                                <Languages size={20} className="text-zinc-600 dark:text-zinc-400" />
                            </div>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {lang === 'en' ? 'English' : 'Español'}
                            </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={lang === 'en'}
                                onChange={toggleLanguage}
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6866D6]/50 dark:peer-focus:ring-[#6866D6]/50 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6866D6]"></div>
                        </label>
                    </div>

                    {/* Visibility Toggles */}
                    <div className="space-y-2">
                        {/* Clock Toggle */}
                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                                    {showClock ? <Eye size={20} className="text-zinc-600 dark:text-zinc-400" /> : <EyeOff size={20} className="text-zinc-400 dark:text-zinc-600" />}
                                </div>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {lang === 'en' ? 'Clock & Calendar' : 'Reloj & Calendario'}
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showClock}
                                    onChange={handleToggleClock}
                                />
                                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6866D6]/50 dark:peer-focus:ring-[#6866D6]/50 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6866D6]"></div>
                            </label>
                        </div>

                        {/* Tasks Toggle */}
                        <div className="hidden sm:flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                                    {showTasks ? <Eye size={20} className="text-zinc-600 dark:text-zinc-400" /> : <EyeOff size={20} className="text-zinc-400 dark:text-zinc-600" />}
                                </div>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {lang === 'en' ? 'Daily Tasks' : 'Tareas Diarias'}
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showTasks}
                                    onChange={handleToggleTasks}
                                />
                                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6866D6]/50 dark:peer-focus:ring-[#6866D6]/50 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6866D6]"></div>
                            </label>
                        </div>

                        {/* Countdown Toggle */}
                        <div className="hidden sm:flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                                    {showCountdown ? <Eye size={20} className="text-zinc-600 dark:text-zinc-400" /> : <EyeOff size={20} className="text-zinc-400 dark:text-zinc-600" />}
                                </div>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {lang === 'en' ? 'Countdown' : 'Cuenta Regresiva'}
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showCountdown}
                                    onChange={handleToggleCountdown}
                                />
                                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6866D6]/50 dark:peer-focus:ring-[#6866D6]/50 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6866D6]"></div>
                            </label>
                        </div>

                        {/* Shortcuts Toggle */}
                        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                                    {showShortcuts ? <Eye size={20} className="text-zinc-600 dark:text-zinc-400" /> : <EyeOff size={20} className="text-zinc-400 dark:text-zinc-600" />}
                                </div>
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {lang === 'en' ? 'Custom Shortcuts' : 'Atajos Personalizados'}
                                </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={showShortcuts}
                                    onChange={handleToggleShortcuts}
                                />
                                <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6866D6]/50 dark:peer-focus:ring-[#6866D6]/50 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6866D6]"></div>
                            </label>
                        </div>
                    </div>



                    {/* Open in Tab Toggle */}
                    <div className="hidden sm:flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                                {openInTab ? <ExternalLink size={20} className="text-zinc-600 dark:text-zinc-400" /> : <AppWindow size={20} className="text-zinc-400 dark:text-zinc-600" />}
                            </div>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {lang === 'en' ? 'Open Shortcuts in New Tabs' : 'Abrir Atajos en Nuevas Pestañas'}
                            </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={openInTab}
                                onChange={handleToggleOpenInTab}
                            />
                            <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#6866D6]/50 dark:peer-focus:ring-[#6866D6]/50 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#6866D6]"></div>
                        </label>
                    </div>
                </div>


                {/* Export / Import Buttons */}
                <div className="hidden sm:grid grid-cols-2 gap-3 mt-6">
                    <Link
                        href={importPath}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group cursor-pointer"
                    >
                        <FileDown size={24} className="text-zinc-500 group-hover:text-[#6866D6] transition-colors" />
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                            {lang === 'en' ? 'Import Backup' : 'Importar Backup'}
                        </span>
                    </Link>
                    <Link
                        href={exportPath}
                        className="flex flex-col items-center justify-center gap-2 p-4 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group cursor-pointer"
                    >
                        <FileUp size={24} className="text-zinc-500 group-hover:text-[#6866D6] transition-colors" />
                        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">
                            {lang === 'en' ? 'Export Backup' : 'Exportar Backup'}
                        </span>
                    </Link>
                </div>
            </div>
        </div>

    );
}
