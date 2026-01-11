'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Pencil, Trash2, Search, Image as ImageIcon } from 'lucide-react'
import { usePathname } from 'next/navigation'

type Position = 'left' | 'right'

type Shortcut = {
    id: string
    name: string
    iconUrl: string
    url: string
    position: Position
}

export default function ShortcutFloater() {
    const [shortcuts, setShortcuts] = useState<Shortcut[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [activeSide, setActiveSide] = useState<Position>('right')

    const pathname = usePathname()
    const isEnglish = pathname?.startsWith('/en')

    const t = {
        editTitle: isEnglish ? 'Edit shortcut' : 'Editar atajo',
        newTitle: isEnglish ? 'New shortcut' : 'Nuevo atajo',
        nameLabel: isEnglish ? 'Name' : 'Nombre',
        iconUrlLabel: isEnglish ? 'Icon URL' : 'URL del Icono',
        shortcutUrlLabel: isEnglish ? 'Shortcut URL' : 'URL del Atajo',
        delete: isEnglish ? 'Delete' : 'Eliminar',
        confirm: isEnglish ? 'Sure?' : 'Seguro?',
        cancel: isEnglish ? 'Cancel' : 'Cancelar',
        save: isEnglish ? 'Save' : 'Guardar',
        addTooltip: isEnglish ? 'Add' : 'Añadir nuevo atajo',
        editTooltip: isEnglish ? 'Edit' : 'Editar',
        searchIconTooltip: isEnglish ? 'Search icon on Google' : 'Buscar icono en Google'
    }

    // Form state
    const [name, setName] = useState('')
    const [iconUrl, setIconUrl] = useState('')
    const [url, setUrl] = useState('')

    useEffect(() => {
        const saved = localStorage.getItem('local-shortcuts')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                // Migrate existing shortcuts to have a position if missing
                const migrated = parsed.map((s: any) => ({
                    ...s,
                    position: s.position || 'right'
                }))
                setShortcuts(migrated)
            } catch (e) {
                console.error('Failed to parse shortcuts', e)
            }
        }
    }, [])

    const saveShortcuts = (newShortcuts: Shortcut[]) => {
        setShortcuts(newShortcuts)
        localStorage.setItem('local-shortcuts', JSON.stringify(newShortcuts))
    }

    const [confirmDelete, setConfirmDelete] = useState(false)

    const handleOpenModal = (side: Position, shortcut?: Shortcut) => {
        setActiveSide(side)
        if (shortcut) {
            setEditingId(shortcut.id)
            setName(shortcut.name)
            setIconUrl(shortcut.iconUrl)
            setUrl(shortcut.url)
        } else {
            setEditingId(null)
            setName('')
            setIconUrl('')
            setUrl('')
        }
        setConfirmDelete(false)
        setIsModalOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const ensureUrl = (str: string) => {
            if (!str) return ''
            if (str.startsWith('http://') || str.startsWith('https://')) return str
            return `https://${str}`
        }

        const finalUrl = ensureUrl(url)
        // Use user provided default or a safe fallback
        const finalIconUrl = iconUrl ? ensureUrl(iconUrl) : 'https://cdn-icons-png.flaticon.com/512/1006/1006771.png'

        if (editingId) {
            const updated = shortcuts.map(s =>
                s.id === editingId ? { ...s, name, iconUrl: finalIconUrl, url: finalUrl } : s
            )
            saveShortcuts(updated)
        } else {
            const newShortcut: Shortcut = {
                id: crypto.randomUUID(),
                name,
                iconUrl: finalIconUrl,
                url: finalUrl,
                position: activeSide
            }
            saveShortcuts([...shortcuts, newShortcut])
        }
        setIsModalOpen(false)
    }

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setUrl(val)

        // Simple domain extraction to try and get favicon
        try {
            // Prepend https if needed for the URL object to work, though we clean it on submit
            const urlObj = new URL(val.startsWith('http') ? val : `https://${val}`)
            const domain = urlObj.hostname
            setIconUrl(`https://www.google.com/s2/favicons?sz=64&domain=${domain}`)
        } catch (e) {
            // Invalid URL yet, ignore
        }
    }

    const handleDelete = () => {
        if (editingId) {
            if (!confirmDelete) {
                setConfirmDelete(true)
                return
            }
            const updated = shortcuts.filter(s => s.id !== editingId)
            saveShortcuts(updated)
            setConfirmDelete(false)
            setIsModalOpen(false)
        }
    }

    const getGoogleImagesUrl = () => {
        // Default search if name is empty, but preferably should warn or adjust
        const query = name ? `${name} icon square 500x500` : 'app icon square 500x500'
        return `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`
    }

    const sides: Position[] = ['left', 'right']

    return (
        <>
            {sides.map((side) => (
                <div
                    key={side}
                    className={`fixed top-4 ${side === 'left' ? 'left-4' : 'right-4'} flex items-center gap-2 z-50`}
                >
                    {/* Add Button - Left only for 'left' side */}
                    {side === 'left' && (
                        <button
                            onClick={() => handleOpenModal(side)}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm opacity-50 hover:opacity-100 transition-all hover:scale-105 cursor-pointer"
                            title={t.addTooltip}
                        >
                            <Plus size={16} className="text-zinc-600 dark:text-zinc-400" />
                        </button>
                    )}

                    {shortcuts.filter(s => s.position === side).map(shortcut => (
                        <div
                            key={shortcut.id}
                            className="group relative flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-visible"
                        >
                            {/* Main Icon Button */}
                            <a
                                href={shortcut.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-full p-1.5 flex items-center justify-center rounded-full cursor-pointer"
                            >
                                <img
                                    src={shortcut.iconUrl}
                                    alt={shortcut.name}
                                    className="w-full h-full object-contain rounded-full"
                                    onError={(e) => {
                                        // Fallback if image fails
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>'
                                    }}
                                />
                            </a>

                            {/* Tooltip Name */}
                            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                {shortcut.name}
                            </div>

                            {/* Edit Button (Bottom) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleOpenModal(side, shortcut);
                                }}
                                className="absolute -bottom-14 left-1/2 -translate-x-1/2 w-6 h-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all z-20 shadow-sm cursor-pointer"
                                title={t.editTooltip}
                            >
                                <Pencil size={12} className="text-zinc-500 dark:text-zinc-400" />
                            </button>
                        </div>
                    ))}

                    {/* Add Button - Right only for 'right' side */}
                    {side === 'right' && (
                        <button
                            onClick={() => handleOpenModal(side)}
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm opacity-50 hover:opacity-100 transition-all hover:scale-105 cursor-pointer"
                            title={t.addTooltip}
                        >
                            <Plus size={16} className="text-zinc-600 dark:text-zinc-400" />
                        </button>
                    )}
                </div>
            ))}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800 p-6 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-lg font-medium mb-4">
                            {editingId ? t.editTitle : t.newTitle}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    {t.nameLabel}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                    placeholder="Ej: ChatGPT"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    {t.iconUrlLabel}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={iconUrl}
                                        onChange={e => setIconUrl(e.target.value)}
                                        className="flex-1 px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                        placeholder="https://example.com/icon.png"
                                    />
                                    <a
                                        href={getGoogleImagesUrl()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center cursor-pointer"
                                        title={t.searchIconTooltip}
                                    >
                                        <ImageIcon size={18} className="text-zinc-600 dark:text-zinc-400" />
                                    </a>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    {t.shortcutUrlLabel}
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={url}
                                    onChange={handleUrlChange}
                                    className="w-full px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                    placeholder="https://chat.openai.com"
                                />
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                {editingId ? (
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className={`px-4 py-2 text-sm rounded-md transition-colors flex items-center gap-2 cursor-pointer ${confirmDelete
                                            ? 'bg-red-600 text-white hover:bg-red-700'
                                            : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                                            }`}
                                    >
                                        <Trash2 size={16} />
                                        {confirmDelete ? t.confirm : t.delete}
                                    </button>
                                ) : (
                                    <div></div>
                                )}

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                                    >
                                        {t.cancel}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm text-white bg-black dark:bg-white dark:text-black rounded-md hover:opacity-90 transition-opacity cursor-pointer"
                                    >
                                        {t.save}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
