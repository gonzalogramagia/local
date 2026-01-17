import { useState, useEffect } from "react";
import ConfigModal from "./ConfigModal";
import { Github, ClipboardClock, Smile, Music, Joystick, Wrench } from "lucide-react";
import { dictionary, Language } from "../data/i18n";
import { usePathname, useRouter } from 'next/navigation';

interface FloatingLinksProps {
    lang: Language;
}

export default function FloatingLinks({ lang }: FloatingLinksProps) {
    const t = dictionary[lang];
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Persist modal state across language changes
    useEffect(() => {
        const saved = sessionStorage.getItem('config-modal-open');
        if (saved === 'true') setIsSettingsOpen(true);
    }, []);

    const setConfigOpen = (open: boolean) => {
        setIsSettingsOpen(open);
        sessionStorage.setItem('config-modal-open', String(open));
    };

    const router = useRouter();
    const pathname = usePathname();

    // Determine external URL for emojis
    const emojisUrl = lang === "en"
        ? "https://emojis.gonzalogramagia.com/en"
        : "https://emojis.gonzalogramagia.com";

    // Determine external URL for music
    const musicUrl = lang === "en"
        ? "https://music.gonzalogramagia.com/en"
        : "https://music.gonzalogramagia.com";

    // Determine external URL for play
    const playUrl = lang === "en"
        ? "https://play.gonzalogramagia.com/en"
        : "https://play.gonzalogramagia.com";

    const exportPath = lang === 'en' ? '/export' : '/exportar';
    const importPath = lang === 'en' ? '/import' : '/importar';


    const toggleLanguage = () => {
        if (lang === 'en') {
            const newPath = pathname.replace('/en', '') || '/';
            router.push(newPath);
        } else {
            const newPath = `/en${pathname === '/' ? '' : pathname}`;
            router.push(newPath);
        }
    };

    return (
        <>
            {/* Right Side Buttons: Config / Github */}
            <div className="fixed bottom-8 right-8 flex gap-3 z-[70]">
                {isSettingsOpen ? (
                    <a
                        href="https://github.com/gonzalogramagia/today"
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
                        aria-label={t.ariaGithub}
                        target="_blank"
                    >
                        <Github className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-[#6866D6] transition-colors" />
                    </a>
                ) : (
                    <button
                        onClick={() => setConfigOpen(true)}
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group cursor-pointer"
                        aria-label="Configuration"
                    >
                        <Wrench className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-[#6866D6] transition-colors scale-x-[-1]" />
                    </button>
                )}
            </div>

            {/* Settings Modal */}
            {isSettingsOpen && (
                <ConfigModal
                    lang={lang}
                    onClose={() => setConfigOpen(false)}
                    toggleLanguage={toggleLanguage}
                    exportPath={exportPath}
                    importPath={importPath}
                />
            )}

            {/* Left Side Buttons: Home + Emojis + Music + Tasks */}
            <div className="fixed bottom-8 left-8 flex gap-3 z-30 transition-opacity duration-300">
                <button
                    disabled
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg transition-all opacity-50 cursor-not-allowed group"
                    aria-label={t.goToHome}
                    title={t.goToHome}
                >
                    <ClipboardClock className="w-6 h-6 text-zinc-900 dark:text-white transition-colors" />
                </button>
                <a
                    href={emojisUrl}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
                    aria-label={t.goToEmojis}
                    title={t.goToEmojis}
                >
                    <Smile className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-yellow-500 transition-colors" />
                </a>
                <a
                    href={musicUrl}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group cursor-pointer"
                    aria-label={t.goToMusic}
                    title={t.goToMusic}
                >
                    <Music className="w-6 h-6 text-zinc-900 dark:text-white group-hover:text-yellow-500 transition-colors" />
                </a>
                <a
                    href={playUrl}
                    className="hidden sm:block p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group cursor-pointer"
                    aria-label={t.goToPlay}
                    title={t.goToPlay}
                >
                    <Joystick className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-yellow-500 transition-colors" />
                </a>
            </div>
        </>
    );
}

