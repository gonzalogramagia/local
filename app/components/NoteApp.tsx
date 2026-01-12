"use client";

import { useState, useEffect } from "react";
import { Copy, Pencil, Trash2, Save, Check, Github, Smile, ChevronUp, ChevronDown, Home, Music, BowArrow } from "lucide-react";
import { symbols, SymbolItem } from "../data/symbols";
import { dictionary, Language } from "../data/i18n";

interface TextBlock {
    id: string;
    tag: string;
    title: string;
    content: string;
}

interface NoteAppProps {
    lang: Language;
}

export default function NoteApp({ lang }: NoteAppProps) {
    const t = dictionary[lang];
    const [blocks, setBlocks] = useState<TextBlock[]>([]);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
    const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
    const [justMovedId, setJustMovedId] = useState<string | null>(null);

    // Emoji Picker State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiSearch, setEmojiSearch] = useState("");
    const [filteredEmojis, setFilteredEmojis] = useState<SymbolItem[]>([]);
    const [emojiSelectedIndex, setEmojiSelectedIndex] = useState(0);
    const [emojiCoords, setEmojiCoords] = useState({ top: 0, left: 0 });
    const [triggerIdx, setTriggerIdx] = useState<number>(-1);

    // Cargar datos del localStorage al montar el componente
    useEffect(() => {
        const savedBlocks = localStorage.getItem("localhost-blocks");

        if (savedBlocks) {
            try {
                const parsed = JSON.parse(savedBlocks);
                const migrated = (parsed as any[]).map((b) => {
                    const tag =
                        b && typeof b.tag === "string" && b.tag ? b.tag : generateId();
                    if (
                        b &&
                        typeof b.title === "string" &&
                        /^Bloque [a-z0-9]{4}$/i.test(b.title)
                    ) {
                        return { ...b, title: "", tag };
                    }
                    return { ...b, tag };
                });
                setBlocks(migrated as TextBlock[]);
            } catch (e) {
                const raw = JSON.parse(savedBlocks) as any[];
                const ensured = raw.map((b) => ({
                    ...b,
                    tag: b && b.tag ? b.tag : generateId(),
                }));
                setBlocks(ensured as TextBlock[]);
            }
        }
    }, []);

    // Guardar en localStorage cada vez que cambien los bloques
    useEffect(() => {
        localStorage.setItem("localhost-blocks", JSON.stringify(blocks));
    }, [blocks]);

    // Si se hace click fuera del bloque en edición, guardar y salir de edición
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!editingBlockId) return;
            const target = e.target as HTMLElement | null;
            if (!target) return;

            // Removed early return for links to ensure saving applies even when navigating.
            // if (target.closest && target.closest("a")) return;

            let node: HTMLElement | null = target;
            let targetBlockId: string | null = null;
            while (node) {
                const attr = node.getAttribute && node.getAttribute("data-block-id");
                if (attr) {
                    targetBlockId = attr;
                    break;
                }
                node = node.parentElement;
            }

            if (targetBlockId === editingBlockId) {
                const picker = document.getElementById("emoji-picker-container");
                if (showEmojiPicker && picker && !picker.contains(target)) {
                    setShowEmojiPicker(false);
                }
                return;
            }

            const current = blocks.find((b) => b.id === editingBlockId);
            if (current) {
                // Ensure synchronous persistence before potential navigation
                const newBlocks = blocks.map(b => b.id === current.id ? { ...b, content: editingContent } : b);
                localStorage.setItem("localhost-blocks", JSON.stringify(newBlocks));
                updateBlock(current.id, editingContent);
            }

            if (targetBlockId) {
                const next = blocks.find((b) => b.id === targetBlockId);
                if (next) {
                    setEditingBlockId(next.id);
                    setEditingContent(next.content);
                    return;
                }
            }

            setEditingBlockId(null);
            setEditingContent("");
            setShowEmojiPicker(false);
        };

        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, [editingBlockId, editingContent, blocks]);

    const generateId = () => {
        const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
        const make = () =>
            Array.from(
                { length: 4 },
                () => chars[Math.floor(Math.random() * chars.length)]
            ).join("");
        let id = make();
        const existing = new Set(blocks.map((b) => b.id));
        while (existing.has(id)) {
            id = make();
        }
        return id;
    };

    const toggleEditBlock = (block: TextBlock) => {
        if (editingBlockId === block.id) {
            updateBlock(block.id, editingContent);
            setEditingBlockId(null);
            setEditingContent("");
        } else {
            saveCurrentEditing();
            setEditingBlockId(block.id);
            setEditingContent(block.content);
        }
    };

    const saveCurrentEditing = () => {
        if (!editingBlockId) return;
        const current = blocks.find((b) => b.id === editingBlockId);
        if (current) updateBlock(current.id, editingContent);
    };

    // Scroll to moved block
    useEffect(() => {
        if (justMovedId) {
            const element = document.querySelector(`[data-block-id="${justMovedId}"]`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            setJustMovedId(null);
        }
    }, [blocks, justMovedId]);

    // --- Emoji Picker Logic ---
    useEffect(() => {
        if (showEmojiPicker) {
            const emojis = symbols.filter(
                (s) =>
                    s.category === "Emojis" &&
                    (s.symbol.includes(emojiSearch) ||
                        s.description.en.main.toLowerCase().includes(emojiSearch.toLowerCase()) ||
                        s.description.es.main.toLowerCase().includes(emojiSearch.toLowerCase()) ||
                        s.tags?.en.some(tag => tag.toLowerCase().includes(emojiSearch.toLowerCase())) ||
                        s.tags?.es.some(tag => tag.toLowerCase().includes(emojiSearch.toLowerCase())))
            ).slice(0, 10);
            setFilteredEmojis(emojis);
            setEmojiSelectedIndex(0);
        }
    }, [emojiSearch, showEmojiPicker]);

    const handleTextChange = (
        e: React.ChangeEvent<HTMLTextAreaElement>,
        blockId: string
    ) => {
        const val = e.target.value;
        setEditingContent(val);

        const cursor = e.target.selectionStart;
        const textBeforeCursor = val.slice(0, cursor);
        const match = textBeforeCursor.match(/(?:^|\s)(:[a-z0-9_+-]*)$/i);

        if (match) {
            const matchStr = match[1];
            const query = matchStr.slice(1);
            const spaceOffset = match[0].startsWith(" ") ? 1 : 0;

            setTriggerIdx(textBeforeCursor.lastIndexOf(":"));
            setEmojiSearch(query);
            setShowEmojiPicker(true);

            const { top, left, height } = getCaretCoordinates(e.target, e.target.selectionStart);
            setEmojiCoords({ top: top + height + 5, left: left + 15 });
        } else {
            setShowEmojiPicker(false);
        }
    };

    const insertEmoji = (emoji: SymbolItem) => {
        if (triggerIdx === -1) return;

        const before = editingContent.slice(0, triggerIdx);
        const after = editingContent.slice(editingContent.indexOf(":", triggerIdx) + 1 + emojiSearch.length);

        const newContent = before + emoji.symbol + after;
        setEditingContent(newContent);
        setShowEmojiPicker(false);
        setTriggerIdx(-1);
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLTextAreaElement>,
        blockId: string
    ) => {
        if (showEmojiPicker && filteredEmojis.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setEmojiSelectedIndex((prev) => (prev + 1) % filteredEmojis.length);
                return;
            }
            if (e.key === "ArrowUp") {
                e.preventDefault();
                setEmojiSelectedIndex((prev) => (prev - 1 + filteredEmojis.length) % filteredEmojis.length);
                return;
            }
            if (e.key === "Enter" || e.key === "Tab") {
                e.preventDefault();
                insertEmoji(filteredEmojis[emojiSelectedIndex]);
                return;
            }
            if (e.key === "Escape") {
                e.preventDefault();
                setShowEmojiPicker(false);
                return;
            }
        }

        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            updateBlock(blockId, editingContent);
            setEditingBlockId(null);
            setEditingContent("");
            (e.target as HTMLTextAreaElement).blur();
        }
    };

    const formatText = (text: string) => {
        if (!text) return "";
        const escapeHtml = (str: string) =>
            str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        let formatted = escapeHtml(text);
        const urlRegex = /((https?:\/\/|www\.)[\w\-.:/?#@!$&'()*+,;=%~]+)/g;
        formatted = formatted.replace(urlRegex, (match) => {
            const url = match.startsWith("http") ? match : `https://${match}`;
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">${match}</a>`;
        });
        // Bold: *texto* -> <strong>texto</strong>
        formatted = formatted.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
        // Italics: _texto_ -> <em>texto</em>
        formatted = formatted.replace(/_([^_]+)_/g, "<em>$1</em>");

        return formatted;
    };

    const addBlock = () => {
        const id = generateId();
        const newBlock: TextBlock = {
            id,
            tag: generateId(),
            title: "",
            content: "",
        };
        setBlocks((prev) => [...prev, newBlock]);
    };

    const updateBlock = (id: string, content: string) => {
        setBlocks((prev) =>
            prev.map((block) => (block.id === id ? { ...block, content } : block))
        );
    };

    const updateBlockTitle = (id: string, title: string) => {
        setBlocks((prev) =>
            prev.map((block) => (block.id === id ? { ...block, title } : block))
        );
    };

    const copyToClipboard = (id: string, text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedBlockId(id);
            setTimeout(() => setCopiedBlockId(null), 2000);
        });
    };

    const deleteBlock = (id: string) => {
        if (deletingBlockId === id) {
            setBlocks((prev) => {
                const remaining = prev.filter((block) => block.id !== id);
                if (remaining.length === 0) {
                    return [{
                        id: generateId(),
                        tag: generateId(),
                        title: "",
                        content: "",
                    }];
                }
                return remaining;
            });
            setDeletingBlockId(null);
        } else {
            setDeletingBlockId(id);
            setTimeout(() => {
                setDeletingBlockId((current) => (current === id ? null : current));
            }, 3000);
        }
    };

    const moveBlockUp = (id: string) => {
        const index = blocks.findIndex((b) => b.id === id);
        if (index < 0 || index >= blocks.length - 1) return;

        const newBlocks = [...blocks];
        [newBlocks[index], newBlocks[index + 1]] = [
            newBlocks[index + 1],
            newBlocks[index],
        ];
        setBlocks(newBlocks);
        setJustMovedId(id);
    };

    const moveBlockDown = (id: string) => {
        const index = blocks.findIndex((b) => b.id === id);
        if (index <= 0) return;

        const newBlocks = [...blocks];
        [newBlocks[index], newBlocks[index - 1]] = [
            newBlocks[index - 1],
            newBlocks[index],
        ];
        setBlocks(newBlocks);
        setJustMovedId(id);
    };

    // Determine external URL for emojis
    const emojisUrl = lang === "en"
        ? "https://emojis.gonzalogramagia.com/en"
        : "https://emojis.gonzalogramagia.com";

    // Clock State
    const [currentTime, setCurrentTime] = useState<Date | null>(null);

    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Format helpers
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString(lang === 'es' ? 'es-AR' : 'en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString(lang === 'es' ? 'es-AR' : 'en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <section className="mb-8">
            <div className="mb-8">
                {/* Clock and Date */}
                <div className="flex flex-col gap-0.5 -mt-8 mb-12 animate-in fade-in duration-700">
                    {currentTime && (
                        <>
                            <span className="font-mono text-4xl sm:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white leading-none">
                                {formatTime(currentTime)}
                            </span>
                            <span className="text-lg sm:text-xl text-zinc-500 dark:text-zinc-400 font-medium capitalize">
                                {formatDate(currentTime)}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <h1 className="text-2xl font-semibold tracking-tighter">
                        {t.title}
                    </h1>
                    <button
                        onClick={addBlock}
                        className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors cursor-pointer"
                    >
                        {t.addBlock}
                    </button>
                </div>
                <p
                    className="mb-8 text-gray-600 dark:text-gray-400"
                    dangerouslySetInnerHTML={{ __html: t.subtitle }}
                />
            </div>

            <div className="space-y-4">
                {blocks
                    .slice()
                    .reverse()
                    .map((block) => (
                        <div
                            key={block.id}
                            data-block-id={block.id}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 pb-2"
                        >
                            <div className="flex justify-between items-center mb-2 gap-3">
                                <input
                                    type="text"
                                    value={block.title}
                                    onChange={(e) => updateBlockTitle(block.id, e.target.value)}
                                    onFocus={() => {
                                        if (editingBlockId !== block.id) {
                                            saveCurrentEditing();
                                            setEditingBlockId(block.id);
                                            setEditingContent(block.content);
                                        } else {
                                            setEditingBlockId(block.id);
                                        }
                                    }}
                                    onClick={() => {
                                        if (editingBlockId !== block.id) {
                                            saveCurrentEditing();
                                            setEditingBlockId(block.id);
                                            setEditingContent(block.content);
                                        } else {
                                            setEditingBlockId(block.id);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (editingBlockId === block.id) {
                                                updateBlock(block.id, editingContent);
                                                setEditingBlockId(null);
                                                setEditingContent("");
                                                (e.target as HTMLInputElement).blur();
                                            }
                                        }
                                    }}
                                    className={`flex-1 text-sm font-medium px-2 py-1 border-b border-gray-200 dark:border-gray-700 focus:outline-none focus:border-blue-500 ${editingBlockId === block.id
                                        ? "bg-black text-white"
                                        : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        }`}
                                    placeholder={`${t.blockNamePlaceholder} #${block.tag}...`}
                                />
                                <div className="flex items-center gap-3">
                                    {editingBlockId !== block.id && (
                                        <button
                                            onClick={() => copyToClipboard(block.id, block.content)}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors cursor-pointer ${copiedBlockId === block.id
                                                ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                                                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                }`}
                                            title={t.copy}
                                        >
                                            {copiedBlockId === block.id ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    <span>{t.copied}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    <span>{t.copy}</span>
                                                </>
                                            )}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => toggleEditBlock(block)}
                                        className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                                    >
                                        {editingBlockId === block.id ? (
                                            <>
                                                <Save className="w-4 h-4" />
                                                <span>{t.save}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Pencil className="w-4 h-4" />
                                                <span>{t.edit}</span>
                                            </>
                                        )}
                                    </button>

                                    {editingBlockId === block.id && (
                                        <button
                                            onClick={() => deleteBlock(block.id)}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors cursor-pointer ${deletingBlockId === block.id
                                                ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 font-bold"
                                                : "text-red-500 hover:text-red-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                                }`}
                                            aria-label={deletingBlockId === block.id ? t.ariaDelete : `${t.ariaDeleteSpecific} ${block.title}`}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span>{deletingBlockId === block.id ? t.confirmDelete : t.delete}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {editingBlockId === block.id ? (
                                <div className="relative">
                                    <textarea
                                        value={editingContent}
                                        onChange={(e) => handleTextChange(e, block.id)}
                                        onKeyDown={(e) => handleKeyDown(e, block.id)}
                                        placeholder={t.placeholder}
                                        className="w-full min-h-[160px] p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-y bg-black text-white focus:outline-none focus:ring-2 focus:ring-blue-500 whitespace-pre-wrap break-words break-all overflow-auto"
                                    />
                                    {showEmojiPicker && filteredEmojis.length > 0 && (
                                        <div
                                            id="emoji-picker-container"
                                            className="absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden min-w-[200px]"
                                            style={{
                                                top: emojiCoords.top,
                                                left: emojiCoords.left
                                            }}
                                        >
                                            <ul className="max-h-[200px] overflow-y-auto">
                                                {filteredEmojis.map((item, idx) => (
                                                    <li
                                                        key={item.symbol + idx}
                                                        className={`px-3 py-2 flex items-center gap-2 cursor-pointer text-sm ${idx === emojiSelectedIndex
                                                            ? "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-100"
                                                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                                                            }`}
                                                        onClick={() => insertEmoji(item)}
                                                        onMouseEnter={() => setEmojiSelectedIndex(idx)}
                                                    >
                                                        <span className="text-xl">{item.symbol}</span>
                                                        <div className="flex flex-col">
                                                            {/* Show description based on lang? The original code had spans, maybe showing both or specific? */}
                                                            {/* Original code: 
                                <span className="font-medium">{item.description.es.main}</span>
                                <span className="text-xs opacity-60">:{item.description.en.main.toLowerCase().replace(/\s+/g, '_')}:</span>
                              */}
                                                            {/* We should probably adapt this to show description in current language */}
                                                            <span className="font-medium">{item.description[lang].main}</span>
                                                            <span className="text-xs opacity-60">:{item.description.en.main.toLowerCase().replace(/\s+/g, '_')}:</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div
                                    className="w-full min-h-[160px] p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-y bg-white dark:bg-gray-800 text-black dark:text-white whitespace-pre-wrap break-words break-all overflow-auto"
                                    onDoubleClick={(e) => {
                                        let node = e.target as HTMLElement | null;
                                        while (node) {
                                            if (node.tagName === "A") return;
                                            node = node.parentElement;
                                        }
                                        saveCurrentEditing();
                                        setEditingBlockId(block.id);
                                        setEditingContent(block.content);
                                    }}
                                    dangerouslySetInnerHTML={{ __html: formatText(block.content) }}
                                />
                            )}
                            <div className="flex justify-between items-center mt-2">
                                <div className="text-xs text-gray-400">
                                    {editingBlockId === block.id
                                        ? editingContent.length
                                        : block.content.length}{" "}
                                    {t.characters}
                                </div>
                                {blocks.length > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => moveBlockDown(block.id)}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default p-1"
                                            disabled={blocks.findIndex(b => b.id === block.id) <= 0}
                                            title={t.moveDown || "Move Down"}
                                        >
                                            <ChevronDown size={20} />
                                        </button>
                                        <button
                                            onClick={() => moveBlockUp(block.id)}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default p-1"
                                            disabled={blocks.findIndex(b => b.id === block.id) >= blocks.length - 1}
                                            title={t.moveUp || "Move Up"}
                                        >
                                            <ChevronUp size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
            </div>

            {/* Right Side Buttons: Github */}
            <div className="fixed bottom-8 right-8 flex gap-3 z-50">
                <a
                    href="https://github.com/gonzalogramagia/home"
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
                    aria-label={t.ariaGithub}
                >
                    <Github className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-blue-500 transition-colors" />
                </a>
            </div>

            {/* Left Side Buttons: Home + Emojis + Music + ClickUp */}
            <div className="fixed bottom-8 left-8 flex gap-3 z-50">
                <button
                    disabled
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg transition-all opacity-50 cursor-not-allowed group"
                    aria-label={t.ariaHome}
                    title={t.ariaHome}
                >
                    <Home className="w-6 h-6 text-zinc-900 dark:text-white transition-colors" />
                </button>
                <a
                    href={emojisUrl}
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group"
                    aria-label={t.ariaEmojis}
                >
                    <Smile className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-yellow-500 transition-colors" />
                </a>
                <a
                    href="https://music.gonzalogramagia.com"
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group cursor-pointer"
                    aria-label={t.ariaMusic}
                    title={t.ariaMusic}
                >
                    <Music className="w-6 h-6 text-zinc-900 dark:text-white group-hover:text-yellow-500 transition-colors" />
                </a>
                <a
                    href="https://clickup.gonzalogramagia.com"
                    className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 group cursor-pointer"
                    aria-label="ClickUp Tools"
                >
                    <BowArrow className="w-6 h-6 text-gray-900 dark:text-white group-hover:text-yellow-500 transition-colors" />
                </a>
            </div>
        </section>
    );
}

function getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
    const {
        offsetLeft: elementLeft,
        offsetTop: elementTop,
        scrollLeft,
        scrollTop,
    } = element;

    const div = document.createElement("div");
    const copyStyle = getComputedStyle(element);

    for (const prop of [
        "direction",
        "boxSizing",
        "width",
        "height",
        "overflowX",
        "overflowY",
        "borderTopWidth",
        "borderRightWidth",
        "borderBottomWidth",
        "borderLeftWidth",
        "paddingTop",
        "paddingRight",
        "paddingBottom",
        "paddingLeft",
        "fontStyle",
        "fontVariant",
        "fontWeight",
        "fontStretch",
        "fontSize",
        "fontSizeAdjust",
        "lineHeight",
        "fontFamily",
        "textAlign",
        "textTransform",
        "textIndent",
        "textDecoration",
        "letterSpacing",
        "wordSpacing",
    ]) {
        div.style[prop as any] = copyStyle[prop as any];
    }

    div.style.position = "absolute";
    div.style.top = "0px";
    div.style.left = "0px";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    // Use the copied width to ensure wrapping matches exactly if box-sizing is handled
    div.style.width = copyStyle.width;

    div.textContent = element.value.substring(0, position);

    const span = document.createElement("span");
    span.textContent = element.value.substring(position) || ".";
    div.appendChild(span);

    document.body.appendChild(div);

    const spanOffset = {
        top: span.offsetTop + parseInt(copyStyle.borderTopWidth),
        left: span.offsetLeft + parseInt(copyStyle.borderLeftWidth),
        height: parseInt(copyStyle.lineHeight) || 20
    };

    document.body.removeChild(div);

    return {
        top: span.offsetTop - element.scrollTop,
        left: span.offsetLeft - element.scrollLeft,
        height: spanOffset.height
    };
}
