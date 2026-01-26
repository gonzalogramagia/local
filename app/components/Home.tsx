"use client";

import { useState, useEffect, useRef } from "react";
import { Copy, Pencil, Trash2, Save, Check, ChevronUp, ChevronDown, X, Plus, Paperclip } from "lucide-react";
import { symbols, SymbolItem } from "../data/symbols";
import { dictionary, Language } from "../data/i18n";
import FloatingLinks from "./FloatingLinks";
import Header from "./Header";

interface TextBlock {
    id: string;
    tag: string;
    userTag?: string;
    title: string;
    content: string;
    color?: string;
    images?: string[]; // Kept for backward compatibility
    attachments?: { url: string; name: string; type: string }[];
}

interface HomeProps {
    lang: Language;
}

export default function Home({ lang }: HomeProps) {
    const t = dictionary[lang];
    const [blocks, setBlocks] = useState<TextBlock[]>([]);
    const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
    const [deletingBlockId, setDeletingBlockId] = useState<string | null>(null);
    const [justMovedId, setJustMovedId] = useState<string | null>(null);
    const [createdBlockId, setCreatedBlockId] = useState<string | null>(null);
    const [tagColors, setTagColors] = useState<Record<string, string>>({});
    const [selectedTag, setSelectedTag] = useState<string | null>(null);
    const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [editingTag, setEditingTag] = useState("");


    useEffect(() => {
        if (deletingBlockId || deletingFileId) {
            const timer = setTimeout(() => {
                setDeletingBlockId(null);
                setDeletingFileId(null);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [deletingBlockId, deletingFileId]);

    // Emoji Picker State
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [emojiSearch, setEmojiSearch] = useState("");
    const [filteredEmojis, setFilteredEmojis] = useState<SymbolItem[]>([]);
    const [emojiSelectedIndex, setEmojiSelectedIndex] = useState(0);
    const [emojiCoords, setEmojiCoords] = useState({ top: 0, left: 0 });
    const [triggerIdx, setTriggerIdx] = useState<number>(-1);
    const [focusType, setFocusType] = useState<'title' | 'content' | 'tag' | null>(null);
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
    const [isMobile, setIsMobile] = useState(false);
    const [draggedImageInfo, setDraggedImageInfo] = useState<{ blockId: string, index: number } | null>(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Cargar datos del localStorage al montar el componente
    useEffect(() => {
        const savedBlocks = localStorage.getItem("localhost-blocks");

        if (savedBlocks) {
            try {
                const parsed = JSON.parse(savedBlocks);
                const migrated = (parsed as any[]).map((b) => {
                    const tag =
                        b && typeof b.tag === "string" && b.tag ? b.tag : generateId();
                    const color = b && b.color ? b.color : "#FEFCE8";
                    if (
                        b &&
                        typeof b.title === "string" &&
                        /^Bloque [a-z0-9]{4}$/i.test(b.title)
                    ) {
                        return { ...b, title: "", tag, color };
                    }
                    return { ...b, tag, color };
                });
                setBlocks(migrated as TextBlock[]);
            } catch (e) {
                const raw = JSON.parse(savedBlocks) as any[];
                const ensured = raw.map((b) => ({
                    ...b,
                    tag: b && b.tag ? b.tag : generateId(),
                    color: b && b.color ? b.color : "#FEFCE8",
                }));
                setBlocks(ensured as TextBlock[]);
            }
        }

        const savedTagColors = localStorage.getItem("localhost-tag-colors");
        if (savedTagColors) {
            try {
                setTagColors(JSON.parse(savedTagColors));
            } catch (e) {
                console.error("Failed to parse tag colors", e);
            }
        }

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "localhost-blocks" && e.newValue) {
                try {
                    setBlocks(JSON.parse(e.newValue));
                } catch (err) {
                    console.error("Failed to sync blocks", err);
                }
            }
            if (e.key === "localhost-tag-colors" && e.newValue) {
                try {
                    setTagColors(JSON.parse(e.newValue));
                } catch (err) {
                    console.error("Failed to sync tag colors", err);
                }
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    // Scroll and center the editing block
    useEffect(() => {
        if (editingBlockId) {
            const centerBlock = () => {
                const element = document.querySelector(`[data-block-id="${editingBlockId}"]`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            };

            // Center immediately and again after a short delay to allow DOM updates
            centerBlock();
            const timeout = setTimeout(centerBlock, 50);

            // Disable scroll when editing
            document.body.style.overflow = "hidden";
            return () => {
                clearTimeout(timeout);
            };
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [editingBlockId, blocks]); // Triggers when editing starts OR note moves

    // Aggressive focus management during editing
    useEffect(() => {
        if (editingBlockId && focusType) {
            const focusIntense = () => {
                const blockElement = document.querySelector(`[data-block-id="${editingBlockId}"]`);
                if (blockElement) {
                    const target = focusType === 'title'
                        ? blockElement.querySelector('input[data-input-type="title"]')
                        : focusType === 'tag'
                            ? blockElement.querySelector('input[data-input-type="tag"]')
                            : blockElement.querySelector('textarea');

                    if (target && document.activeElement !== target) {
                        // Preserve cursor position
                        const start = (target as any).selectionStart;
                        const end = (target as any).selectionEnd;

                        (target as HTMLElement).focus();

                        if (start !== undefined && end !== undefined && (target as any).setSelectionRange) {
                            (target as any).setSelectionRange(start, end);
                        }
                    }
                }
            };

            // Run immediately and also in the next frame to be "aggressive"
            focusIntense();
            const raf = requestAnimationFrame(focusIntense);
            const timeout = setTimeout(focusIntense, 50); // Fallback for slower re-renders

            return () => {
                cancelAnimationFrame(raf);
                clearTimeout(timeout);
            };
        }
    }, [editingBlockId, focusType, blocks, editingContent, editingTitle, editingTag]);

    // Guardar en localStorage cada vez que cambien los bloques
    useEffect(() => {
        localStorage.setItem("localhost-blocks", JSON.stringify(blocks));
    }, [blocks]);

    useEffect(() => {
        localStorage.setItem("localhost-tag-colors", JSON.stringify(tagColors));
    }, [tagColors]);

    // Cleanup tag colors when a tag is no longer used by any block
    useEffect(() => {
        const usedTags = new Set(blocks.map(b => b.userTag).filter(Boolean));
        setTagColors(prev => {
            const unusedTags = Object.keys(prev).filter(tag => !usedTags.has(tag));
            if (unusedTags.length === 0) return prev;

            const next = { ...prev };
            unusedTags.forEach(tag => delete next[tag]);
            return next;
        });
    }, [blocks]);

    // Si se hace click fuera del bloque en edición, guardar y salir de edición
    useEffect(() => {
        const onDocClick = (e: MouseEvent) => {
            if (!editingBlockId) return;
            const target = e.target as HTMLElement | null;
            if (!target || !document.body.contains(target)) return;

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
                const normalizedTag = editingTag.trim().replace(/\s+/g, '-').toUpperCase();
                const newBlocks = blocks.map(b => b.id === current.id ? { ...b, content: editingContent, title: editingTitle, userTag: normalizedTag } : b);
                localStorage.setItem("localhost-blocks", JSON.stringify(newBlocks));
                updateBlock(current.id, editingContent, editingTitle, editingTag);
            }

            if (targetBlockId) {
                const next = blocks.find((b) => b.id === targetBlockId);
                if (next) {
                    setEditingBlockId(next.id);
                    setEditingContent(next.content);
                    setEditingTitle(next.title);
                    setEditingTag(next.userTag || "");
                    // Single click focus handled by autoFocus on textarea or manual focus after state update
                    return;
                }
            }

            setEditingBlockId(null);
            setEditingContent("");
            setEditingTitle("");
            setEditingTag("");
            setShowEmojiPicker(false);

        };

        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, [editingBlockId, editingContent, blocks, editingTitle, editingTag]);

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
            updateBlock(block.id, editingContent, editingTitle, editingTag);
            setEditingBlockId(null);
            setEditingContent("");
            setEditingTitle("");
            setEditingTag("");

        } else {
            saveCurrentEditing();
            setEditingBlockId(block.id);
            setEditingContent(block.content);
            setEditingTitle(block.title);
            setEditingTag(block.userTag || "");
            setFocusType('content');

        }
    };

    const saveCurrentEditing = () => {
        if (!editingBlockId) return;
        const current = blocks.find((b) => b.id === editingBlockId);
        if (current) updateBlock(current.id, editingContent, editingTitle, editingTag);
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

    // Focus on created block
    useEffect(() => {
        if (createdBlockId) {
            const element = document.querySelector(`[data-block-id="${createdBlockId}"]`);
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                const input = element.querySelector('input[type="text"]') as HTMLInputElement;
                if (input) {
                    input.focus();
                }
            }
            setCreatedBlockId(null);
        }
    }, [blocks, createdBlockId]);

    // --- Emoji Picker Logic ---
    // Helper function to remove accents for accent-insensitive search
    const removeAccents = (str: string) => {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    };

    useEffect(() => {
        if (showEmojiPicker) {
            const normalizedSearch = removeAccents(emojiSearch.toLowerCase());
            const emojis = symbols.filter(
                (s) =>
                    s.symbol.includes(emojiSearch) ||
                    removeAccents(s.description.en.main.toLowerCase()).includes(normalizedSearch) ||
                    removeAccents(s.description.es.main.toLowerCase()).includes(normalizedSearch) ||
                    s.description.en.secondary?.some(sec => removeAccents(sec.toLowerCase()).includes(normalizedSearch)) ||
                    s.description.es.secondary?.some(sec => removeAccents(sec.toLowerCase()).includes(normalizedSearch)) ||
                    s.tags?.en.some(tag => removeAccents(tag.toLowerCase()).includes(normalizedSearch)) ||
                    s.tags?.es.some(tag => removeAccents(tag.toLowerCase()).includes(normalizedSearch))
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

    const handleFileUpload = (blockId: string, files: FileList | null) => {
        if (!files) return;

        const block = blocks.find(b => b.id === blockId);
        if (!block) return;

        const currentAttachments = block.attachments || [];
        const currentLegacyImages = block.images || [];

        const filesToProcess = Array.from(files);

        filesToProcess.forEach(file => {
            const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.jpg') || file.name.toLowerCase().endsWith('.jpeg');

            if (isImage) {
                const totalImages = currentLegacyImages.length + currentAttachments.filter(a => a.type.startsWith('image/') || a.name.toLowerCase().endsWith('.jpg') || a.name.toLowerCase().endsWith('.jpeg')).length;
                const isMobile = window.innerWidth < 768;
                const maxImgs = isMobile ? 2 : 4;
                if (totalImages >= maxImgs) return;
            } else {
                const totalFiles = currentAttachments.filter(a => !a.type.startsWith('image/') && !a.name.toLowerCase().endsWith('.jpg') && !a.name.toLowerCase().endsWith('.jpeg')).length;
                if (totalFiles >= 1) return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const baseUrl = e.target?.result as string;
                const newAttachment = {
                    url: baseUrl,
                    name: file.name,
                    type: file.type
                };
                setBlocks(prev => prev.map(b =>
                    b.id === blockId
                        ? { ...b, attachments: [...(b.attachments || []), newAttachment] }
                        : b
                ));
            };
            reader.readAsDataURL(file);
        });
    };

    const removeAttachment = (blockId: string, index: number, isLegacy: boolean) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId) return b;
            if (isLegacy) {
                return { ...b, images: b.images?.filter((_, i) => i !== index) };
            } else {
                return { ...b, attachments: b.attachments?.filter((_, i) => i !== index) };
            }
        }));
    };

    const swapImages = (blockId: string, idx1: number, idx2: number) => {
        setBlocks(prev => prev.map(b => {
            if (b.id !== blockId || !b.images) return b;
            const newImages = [...b.images];
            const temp = newImages[idx1];
            newImages[idx1] = newImages[idx2];
            newImages[idx2] = temp;
            return { ...b, images: newImages };
        }));
    };

    const handlePaste = (e: React.ClipboardEvent, blockId: string) => {
        const items = e.clipboardData.items;
        const files: File[] = [];
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) files.push(file);
            }
        }
        if (files.length > 0) {
            // Create a fake FileList-like object or just pass the array
            handleFileUpload(blockId, files as any);
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
            updateBlock(blockId, editingContent, editingTitle, editingTag);
            setEditingBlockId(null);
            setEditingContent("");
            setEditingTitle("");
            setEditingTag("");

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
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-[#6866D6] hover:underline">${match}</a>`;
        });
        // Bold: *texto* -> <strong>texto</strong>
        formatted = formatted.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
        // Italics: _texto_ -> <em>texto</em>
        formatted = formatted.replace(/_([^_]+)_/g, "<em>$1</em>");

        return formatted;
    };

    const addBlock = () => {
        const id = generateId();
        const blockId = generateId();
        const newBlock: TextBlock = {
            id,
            tag: blockId,
            userTag: selectedTag || undefined,
            title: "",
            content: "",
            color: selectedTag ? (tagColors[selectedTag] || "#FEFCE8") : "#FEFCE8",
        };
        setBlocks((prev) => [...prev, newBlock]);
        setCreatedBlockId(id);
    };

    const updateBlock = (id: string, content: string, title?: string, userTag?: string) => {
        let finalTagName = "";

        setBlocks((prev) =>
            prev.map((block) => {
                const normalizedTag = userTag !== undefined
                    ? userTag.trim().replace(/\s+/g, '-').toUpperCase()
                    : (block.userTag || "");

                if (block.id === id) {
                    finalTagName = normalizedTag;
                    return { ...block, content, title: title ?? block.title, userTag: normalizedTag || undefined };
                }
                return block;
            })
        );

        if (finalTagName && !tagColors[finalTagName]) {
            const block = blocks.find(b => b.id === id);
            if (block && block.color) {
                updateTagColor(finalTagName, block.color);
            }
        }
    };

    const updateBlockColor = (id: string, color: string) => {
        setBlocks((prev) =>
            prev.map((block) => (block.id === id ? { ...block, color } : block))
        );
    };

    const updateTagColor = (tagName: string, color: string) => {
        setTagColors((prev) => ({
            ...prev,
            [tagName]: color,
        }));
    };

    const copyToClipboard = (id: string, text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedBlockId(id);
            setTimeout(() => setCopiedBlockId(null), 2000);
        });
    };

    const deleteBlock = (id: string, e?: React.MouseEvent) => {
        if (e) {
            e.stopPropagation();
            if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
        }
        if (deletingBlockId === id) {
            setBlocks((prev) => {
                const remaining = prev.filter((block) => block.id !== id);
                if (remaining.length === 0) {
                    return [{
                        id: generateId(),
                        tag: generateId(),
                        title: "",
                        content: "",
                        color: "#FEFCE8",
                    }];
                }
                return remaining;
            });
            setDeletingBlockId(null);
        } else {
            setDeletingBlockId(id);
        }
    };

    const moveBlockUp = (id: string) => {
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

    const moveBlockDown = (id: string) => {
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

    // Determine external URL for emojis
    const emojisUrl = lang === "en"
        ? "https://milemojis.com/en"
        : "https://milemojis.com";

    // Derived tags
    const availableTags = Array.from(new Set(blocks.map(b => b.userTag).filter(Boolean))) as string[];

    const filteredBlocks = selectedTag
        ? blocks.filter(b => b.userTag === selectedTag)
        : blocks;

    // Clock State


    return (
        <section className="mb-8">
            <div className="mb-5">
                {/* Clock and Date */}
                {/* Header (Notes + Clock + Desktop Add Button) */}
                <Header
                    lang={lang === 'es' ? 'es' : 'en'}
                    onAddNote={addBlock}
                    addNoteText={t.addBlock}
                    title={t.title}
                    mobileAddText={t.addBlockMobile}
                />

                <div className="flex items-center justify-center gap-4 mb-4 -mt-10 lg:hidden">
                    <h1 className="text-2xl font-bold tracking-tighter lg:hidden">
                        📝
                        <span className="ml-3">{t.title}</span>
                    </h1>
                    {/* Mobile Only Add Button (Desktop one is in Header) */}
                    <button
                        onClick={addBlock}
                        className="lg:hidden px-3 py-1 bg-[#6866D6] text-white text-sm rounded hover:bg-[#5856c4] transition-colors cursor-pointer"
                    >
                        {t.addBlockMobile}
                    </button>
                </div>
                <p
                    className="mb-4 text-gray-600 text-center lg:-mt-16"
                    dangerouslySetInnerHTML={{ __html: t.subtitle }}
                />

                {availableTags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-0 animate-in fade-in slide-in-from-top-2 duration-500">
                        {availableTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                className={`group relative px-3 py-1 text-xs font-bold rounded-full border cursor-pointer transition-all flex items-center gap-2 uppercase ${selectedTag === tag
                                    ? "ring-2 ring-offset-1 text-zinc-900 border-black/20"
                                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400"
                                    }`}
                                style={{
                                    backgroundColor: selectedTag === tag ? (tagColors[tag] || "#FEFCE8") : "white",
                                    borderColor: selectedTag === tag ? (tagColors[tag] || "#FEFCE8") : undefined,
                                    ringColor: tagColors[tag] || "#FEFCE8"
                                } as any}
                            >
                                {selectedTag === tag ? (
                                    <X className="w-3.5 h-3.5 bg-red-500 text-white rounded-full p-0.5 opacity-100 transition-opacity shadow-sm border border-red-600" />
                                ) : (
                                    <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: tagColors[tag] || "#FEFCE8" }} />
                                )}
                                #{tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                {filteredBlocks.map((block) => (
                    <div key={block.id} className="relative group/note">
                        <div
                            data-block-id={block.id}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('ring-2', 'ring-[#6866D6]', 'ring-offset-2');
                            }}
                            onDragLeave={(e) => {
                                e.currentTarget.classList.remove('ring-2', 'ring-[#6866D6]', 'ring-offset-2');
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('ring-2', 'ring-[#6866D6]', 'ring-offset-2');
                                handleFileUpload(block.id, e.dataTransfer.files);
                            }}
                            onPaste={(e) => handlePaste(e, block.id)}
                            onClick={(e) => {
                                if (editingBlockId === block.id) {
                                    e.stopPropagation();
                                }
                            }}
                            className="border border-black/5 rounded-lg p-4 pb-2 transition-all duration-200"
                            style={{ backgroundColor: (block.userTag && tagColors[block.userTag]) || block.color || "#FEFCE8" }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-3">
                                <input
                                    type="text"
                                    value={editingBlockId === block.id ? editingTitle : block.title}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    onFocus={() => {
                                        if (editingBlockId !== block.id) {
                                            saveCurrentEditing();
                                            setEditingBlockId(block.id);
                                            setEditingContent(block.content);
                                            setEditingTitle(block.title);
                                            setEditingTag(block.userTag || "");
                                        }
                                        setFocusType('title');
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            if (editingBlockId === block.id) {
                                                updateBlock(block.id, editingContent, editingTitle, editingTag);
                                                setEditingBlockId(null);
                                                setEditingContent("");
                                                setEditingTitle("");
                                                setEditingTag("");
                                                (e.target as HTMLInputElement).blur();
                                            }
                                        }
                                    }}
                                    data-input-type="title"
                                    className={`w-full sm:flex-1 text-lg font-semibold px-2 py-1 border-b focus:outline-none focus:border-blue-500/50 rounded-t-md transition-all ${editingBlockId === block.id
                                        ? "bg-black/10 border-black/10 text-zinc-900 shadow-sm"
                                        : "bg-transparent border-transparent text-zinc-900"
                                        }`}
                                    style={{ borderBottomColor: 'rgba(0,0,0,0.1)' }}
                                    placeholder={`Nota #${block.tag}`}
                                />
                                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-3 mt-1 sm:mt-0">
                                    {editingBlockId !== block.id && (
                                        <button
                                            onClick={() => copyToClipboard(block.id, block.content)}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors cursor-pointer ${copiedBlockId === block.id
                                                ? "bg-green-100 text-green-600"
                                                : "text-gray-500 hover:bg-gray-100"
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
                                        className="flex items-center gap-1 text-xs text-gray-500 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
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
                                            onClick={(e) => deleteBlock(block.id, e)}
                                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors cursor-pointer ${deletingBlockId === block.id
                                                ? "bg-red-500 text-white font-bold"
                                                : "text-red-500 hover:text-red-700 hover:bg-gray-100"
                                                }`}
                                            aria-label={deletingBlockId === block.id ? t.ariaDelete : `${t.ariaDeleteSpecific} ${block.title}`}
                                        >
                                            {deletingBlockId === block.id ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            <span>{deletingBlockId === block.id ? t.confirmDelete : t.delete}</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {editingBlockId === block.id ? (
                                <div className="relative">
                                    <textarea
                                        autoFocus={focusType === 'content'}
                                        onFocus={(e) => {
                                            setFocusType('content');
                                            const val = e.target.value;
                                            e.target.value = "";
                                            e.target.value = val;
                                        }}
                                        value={editingContent}
                                        onChange={(e) => handleTextChange(e, block.id)}
                                        onKeyDown={(e) => handleKeyDown(e, block.id)}
                                        onPaste={(e) => handlePaste(e, block.id)}
                                        placeholder={t.placeholder}
                                        className="w-full min-h-[160px] p-3 border border-black/10 rounded-md resize-y bg-black/10 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/50 whitespace-pre-wrap break-words overflow-auto"
                                    />
                                    {showEmojiPicker && filteredEmojis.length > 0 && (
                                        <div
                                            id="emoji-picker-container"
                                            className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden min-w-[200px]"
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
                                                            ? "bg-blue-100 text-blue-800"
                                                            : "text-gray-700 hover:bg-gray-100"
                                                            }`}
                                                        onClick={() => insertEmoji(item)}
                                                        onMouseEnter={() => setEmojiSelectedIndex(idx)}
                                                    >
                                                        <span className="text-xl">{item.symbol}</span>
                                                        <div className="flex flex-col">
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
                                    className="w-full min-h-[160px] p-3 border border-black/5 rounded-md resize-y text-zinc-900 whitespace-pre-wrap break-words overflow-auto transition-colors duration-200"
                                    style={{ backgroundColor: 'transparent' }}
                                    onDoubleClick={(e) => {
                                        let node = e.target as HTMLElement | null;
                                        while (node) {
                                            if (node.tagName === "A") return;
                                            node = node.parentElement;
                                        }
                                        saveCurrentEditing();
                                        setEditingBlockId(block.id);
                                        setEditingContent(block.content);
                                        setFocusType('content');
                                    }}
                                    dangerouslySetInnerHTML={{ __html: formatText(block.content) }}
                                />
                            )}
                            {/* Image Attachment Preview Grid */}
                            {(() => {
                                const attachments = block.attachments || [];
                                const legacyImages = block.images || [];

                                // Combine both, filtering for images
                                const imageAttachments = [
                                    ...legacyImages.map((url, i) => ({ url, name: 'image', type: 'legacy', index: i })),
                                    ...attachments
                                        .filter(a => a.type.startsWith('image/') || a.name.toLowerCase().endsWith('.jpg') || a.name.toLowerCase().endsWith('.jpeg'))
                                        .map((a, i) => ({ ...a, type: 'attachment', index: i }))
                                ].slice(0, 4);

                                if (imageAttachments.length === 0) return null;

                                return (
                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {imageAttachments.map((img, idx) => {
                                            const fileKey = `${block.id}-img-${idx}`;
                                            const isDeletingThisFile = deletingFileId === fileKey;
                                            return (
                                                <div
                                                    key={`${img.type}-${idx}`}
                                                    className={`relative group/img aspect-square rounded-md overflow-hidden border border-black/10 bg-black/5 transition-all ${isDeletingThisFile ? 'cursor-pointer' : 'cursor-zoom-in'}`}
                                                    onClick={(e) => {
                                                        if (isDeletingThisFile) {
                                                            e.stopPropagation();
                                                            removeAttachment(block.id, img.index, img.type === 'legacy');
                                                            setDeletingFileId(null);
                                                        } else {
                                                            setImageModalUrl(img.url);
                                                        }
                                                    }}
                                                >
                                                    <img src={img.url} alt="" className="w-full h-full object-cover transition-transform group-hover/img:scale-105 pointer-events-none" />

                                                    {/* Red Overlay when confirmed */}
                                                    {isDeletingThisFile && (
                                                        <div className="absolute inset-0 bg-red-500/30 pointer-events-none animate-in fade-in duration-200" />
                                                    )}

                                                    {editingBlockId === block.id && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
                                                                if (isDeletingThisFile) {
                                                                    removeAttachment(block.id, img.index, img.type === 'legacy');
                                                                    setDeletingFileId(null);
                                                                } else {
                                                                    setDeletingFileId(fileKey);
                                                                    setDeletingBlockId(null); // Clear other deletions
                                                                }
                                                            }}
                                                            className={`absolute top-1 right-1 p-1 rounded-full transition-all cursor-pointer shadow-sm z-10 border active:scale-95 ${isDeletingThisFile
                                                                ? "bg-red-500 text-white opacity-100 border-red-600 scale-110"
                                                                : "bg-white/90 text-red-500 opacity-0 group-hover/img:opacity-100 hover:bg-red-50 border-red-100"
                                                                }`}
                                                        >
                                                            {isDeletingThisFile ? (
                                                                <Check size={12} className="pointer-events-none" />
                                                            ) : (
                                                                <X size={12} className="pointer-events-none" />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Add More Images Button */}
                                        {editingBlockId === block.id && imageAttachments.length > 0 && imageAttachments.length < 4 && (
                                            <div
                                                className="relative aspect-square rounded-md border-2 border-dashed border-black/10 bg-black/5 hover:bg-black/10 hover:border-black/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 group/add-img"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/png, image/jpeg, image/jpg';
                                                    input.multiple = true;
                                                    input.onchange = (ev) => {
                                                        const target = ev.target as HTMLInputElement;
                                                        handleFileUpload(block.id, target.files);
                                                        target.value = '';
                                                    };
                                                    input.click();
                                                }}
                                            >
                                                <Plus className="w-6 h-6 text-black/30 group-hover/add-img:text-black/50 transition-colors" />
                                                <span className="text-[10px] text-zinc-500 font-bold uppercase group-hover/add-img:text-zinc-600">
                                                    {lang === 'es' ? 'Imagen' : 'Image'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            <div className="flex items-center mt-1 h-10 relative">
                                {/* Left side: Tag or Editor */}
                                <div className="flex-1 flex items-center justify-start">
                                    {editingBlockId === block.id && (
                                        <div className="flex items-center gap-3 px-2 py-1 bg-zinc-800 rounded-md order-1 sm:order-none scale-90 sm:scale-100 origin-left">
                                            <div className="flex items-center gap-1 border-r border-zinc-700 pr-3">
                                                <span className="text-zinc-400 text-[10px] font-bold">#</span>
                                                <input
                                                    type="text"
                                                    value={editingBlockId === block.id ? editingTag : (block.userTag || "")}
                                                    onChange={(e) => setEditingTag(e.target.value.toUpperCase())}
                                                    onFocus={() => setFocusType('tag')}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            e.preventDefault();
                                                            if (editingBlockId === block.id) {
                                                                updateBlock(block.id, editingContent, editingTitle, editingTag);
                                                                setEditingBlockId(null);
                                                                setEditingContent("");
                                                                setEditingTitle("");
                                                                setEditingTag("");
                                                                (e.target as HTMLInputElement).blur();
                                                            }
                                                        }
                                                    }}
                                                    className="bg-transparent text-white text-[10px] focus:outline-none w-16 uppercase font-bold"
                                                    placeholder="TAG..."
                                                    data-input-type="tag"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {[
                                                    { h: "#FEFCE8", n: lang === "es" ? "Amarillo" : "Yellow" },
                                                    { h: "#FEE2E2", n: lang === "es" ? "Rojo" : "Red" },
                                                    { h: "#E0F2FE", n: lang === "es" ? "Azul" : "Blue" },
                                                    { h: "#DCFCE7", n: lang === "es" ? "Verde" : "Green" },
                                                    { h: "#F3E8FF", n: lang === "es" ? "Violeta" : "Purple" },
                                                    { h: "#FFEDD5", n: lang === "es" ? "Naranja" : "Orange" }
                                                ].map((c) => (
                                                    <button
                                                        key={c.h}
                                                        title={c.n}
                                                        onClick={() => {
                                                            if (block.userTag) {
                                                                updateTagColor(block.userTag, c.h);
                                                            }
                                                            updateBlockColor(block.id, c.h);
                                                        }}
                                                        className={`w-4 h-4 rounded-full border border-white/20 transition-transform hover:scale-125 cursor-pointer ${((block.userTag && tagColors[block.userTag]) || block.color) === c.h ? "ring-2 ring-blue-500 scale-110" : ""}`}
                                                        style={{ backgroundColor: c.h }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {editingBlockId !== block.id && (
                                        block.userTag ? (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 text-zinc-700 uppercase tracking-wider border border-black/10 whitespace-nowrap">
                                                #{block.userTag}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-400/10 text-zinc-400 uppercase tracking-widest border border-black/5 whitespace-nowrap italic">
                                                {t.noTag}
                                            </span>
                                        )
                                    )}
                                </div>


                                {/* Right side: Actions / Arrows */}
                                <div className="flex-1 flex items-center justify-end gap-2">
                                    {/* Attachment Display (Footer - Only for non-images) */}
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        {(block.attachments || []).filter(a => !a.type.startsWith('image/') && !a.name.toLowerCase().endsWith('.jpg') && !a.name.toLowerCase().endsWith('.jpeg')).map((file, idx) => {
                                            const fileKey = `${block.id}-file-${idx}`;
                                            const isDeletingThisFile = deletingFileId === fileKey;
                                            return (
                                                <div key={idx} className="flex items-center gap-1 group/file">
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
                                                            if (editingBlockId === block.id) {
                                                                if (isDeletingThisFile) {
                                                                    const realIdx = block.attachments?.findIndex(a => a === file);
                                                                    if (realIdx !== undefined && realIdx !== -1) {
                                                                        removeAttachment(block.id, realIdx, false);
                                                                    }
                                                                    setDeletingFileId(null);
                                                                } else {
                                                                    setDeletingFileId(fileKey);
                                                                    setDeletingBlockId(null);
                                                                }
                                                                return;
                                                            }
                                                            const link = document.createElement('a');
                                                            link.href = file.url;
                                                            link.download = file.name;
                                                            link.click();
                                                        }}
                                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all scale-90 sm:scale-100 origin-right cursor-pointer shadow-sm border max-w-[150px] sm:max-w-[200px] group/btn ${editingBlockId === block.id
                                                            ? isDeletingThisFile
                                                                ? "bg-red-500 text-white border-red-600 scale-105"
                                                                : "bg-transparent text-red-600 border-red-500/30 hover:bg-red-50"
                                                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-black/5"
                                                            }`}
                                                    >
                                                        {editingBlockId === block.id ? (
                                                            <div className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0 pointer-events-none">
                                                                {isDeletingThisFile ? (
                                                                    <Check size={14} className="text-white" />
                                                                ) : (
                                                                    <X size={14} className="text-red-500" />
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <Paperclip size={14} className="text-zinc-400 flex-shrink-0 pointer-events-none" />
                                                        )}
                                                        <span className="text-[10px] font-bold uppercase truncate pointer-events-none">
                                                            {file.name}
                                                        </span>
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        {/* Action Button: Attach (Only if NO non-image files exist) */}
                                        {editingBlockId === block.id && (block.attachments || []).filter(a => !a.type.startsWith('image/') && !a.name.toLowerCase().endsWith('.jpg') && !a.name.toLowerCase().endsWith('.jpeg')).length === 0 && (
                                            <div className="flex items-center">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        fileInputRefs.current[block.id]?.click();
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-all scale-90 sm:scale-100 origin-right cursor-pointer shadow-sm"
                                                >
                                                    <Paperclip size={14} className="text-zinc-400" />
                                                    <span className="text-[10px] font-bold uppercase whitespace-nowrap">
                                                        {lang === 'es' ? (
                                                            <>Adjuntar archivo <span className="hidden sm:inline">(PDF, mp4, etc)</span></>
                                                        ) : (
                                                            <>Attach file <span className="hidden sm:inline">(PDF, mp4, etc)</span></>
                                                        )}
                                                    </span>
                                                </button>
                                                <input
                                                    type="file"
                                                    ref={el => { fileInputRefs.current[block.id] = el }}
                                                    className="hidden"
                                                    accept={(() => {
                                                        const currentLegacy = block.images?.length || 0;
                                                        const currentAttach = (block.attachments || []).filter(a => a.type.startsWith('image/') || a.name.toLowerCase().endsWith('.jpg') || a.name.toLowerCase().endsWith('.jpeg')).length;
                                                        const totalImages = currentLegacy + currentAttach;
                                                        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                                                        const maxImgs = isMobile ? 2 : 4;

                                                        if (totalImages >= maxImgs) {
                                                            // Limit is reached, only accept non-images (excluding typical image mime types)
                                                            return ".pdf,.doc,.docx,.txt,.mp4,.zip,.rar,.xls,.xlsx";
                                                        }
                                                        return undefined; // Accept any
                                                    })()}
                                                    multiple
                                                    onChange={(e) => {
                                                        handleFileUpload(block.id, e.target.files);
                                                        e.target.value = '';
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Note Ordering Arrows - Positioned to the right outside the block */}
                        {blocks.length > 1 && (
                            <div className="absolute left-full ml-3 bottom-[-0.24px] flex flex-col gap-1 lg:opacity-0 lg:group-hover/note:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
                                        moveBlockUp(block.id);
                                    }}
                                    className="text-gray-400 hover:text-[#6866D6] dark:hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default p-1 bg-white/50 dark:bg-black/20 rounded shadow-sm hover:shadow transition-all border border-black/5"
                                    disabled={blocks.findIndex(b => b.id === block.id) <= 0}
                                    title={t.moveUp || "Move Up"}
                                >
                                    <ChevronUp size={20} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (e.nativeEvent.stopImmediatePropagation) e.nativeEvent.stopImmediatePropagation();
                                        moveBlockDown(block.id);
                                    }}
                                    className="text-gray-400 hover:text-[#6866D6] dark:hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-default p-1 bg-white/50 dark:bg-black/20 rounded shadow-sm hover:shadow transition-all border border-black/5"
                                    disabled={blocks.findIndex(b => b.id === block.id) >= blocks.length - 1}
                                    title={t.moveDown || "Move Down"}
                                >
                                    <ChevronDown size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                ))
                }
            </div>

            {/* Floating Links Component */}
            <FloatingLinks lang={lang} />

            {/* Image Modal */}
            {imageModalUrl && (
                <div
                    className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200"
                    onClick={() => setImageModalUrl(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors cursor-pointer"
                        onClick={() => setImageModalUrl(null)}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={imageModalUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
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
