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

    // Presets
    const PRESET_ICONS = [
        { name: 'Music', url: 'https://cdn-icons-png.freepik.com/256/26/26805.png' },
        { name: 'Video', url: 'https://img.icons8.com/ios_filled/1200/video.jpg' },
        { name: 'Task', url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQIXtf51YFPgubduv43sWdb8OZD9BxI_g3iOA&s' },
        { name: 'Goal', url: 'https://img.icons8.com/ink/1200/goal.jpg' },
        { name: 'Study', url: 'https://cdn-icons-png.flaticon.com/512/566/566944.png' },
        { name: 'Trophy', url: 'https://static.vecteezy.com/system/resources/previews/059/907/959/non_2x/trophy-black-illustration-vector.jpg' },
        { name: 'Linux', url: 'https://icon-library.com/images/linux-tux-icon/linux-tux-icon-1.jpg' },
        { name: 'Job', url: 'https://static.vecteezy.com/system/resources/previews/021/839/489/non_2x/recruitment-black-glyph-icon-hiring-process-choosing-candidate-job-position-headhunting-application-silhouette-symbol-on-white-space-solid-pictogram-isolated-illustration-vector.jpg' },
    ]

    const t = {
        editTitle: isEnglish ? 'Edit shortcut' : 'Editar atajo',
        newTitle: isEnglish ? 'Add new shortcut' : 'Añadir nuevo atajo',
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
    const [showIconPicker, setShowIconPicker] = useState(false)

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
            setIconUrl('') // Cleared to ensure default logic in handleSubmit
            setUrl('')
        }
        setShowIconPicker(false)
        setConfirmDelete(false)
        setIsModalOpen(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const ensureUrl = (str: string) => {
            if (!str) return ''
            if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) return str
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
        // Auto-fill if empty OR if it's already an auto-generated google favicon url
        const isAutoGenerated = iconUrl.includes('google.com/s2/favicons')

        if (!iconUrl || isAutoGenerated) {
            try {
                // Prepend https if needed for the URL object to work, though we clean it on submit
                const urlObj = new URL(val.startsWith('http') ? val : `https://${val}`)
                const domain = urlObj.hostname
                // Only set if domain looks valid (has at least one dot, e.g. google.com)
                if (domain.includes('.')) {
                    setIconUrl(`https://www.google.com/s2/favicons?sz=64&domain=${domain}`)
                }
            } catch (e) {
                // Invalid URL yet, ignore
            }
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

    const handleShortcutClick = (e: React.MouseEvent, shortcut: Shortcut) => {
        e.preventDefault()

        const screenWidth = window.screen.availWidth
        const screenHeight = window.screen.availHeight

        const width = Math.round(screenWidth / 2)
        const height = Math.round(screenHeight)

        const left = shortcut.position === 'left' ? 0 : width
        const top = 0

        const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes,popup=yes`
        window.open(shortcut.url, '_blank', features)
    }

    return (
        <>
            {/* Split View Iframe Overlay */}
            {sides.map((side) => (
                <div
                    key={side}
                    className={`fixed top-7 ${side === 'left' ? 'left-8' : 'right-8'} flex items-center gap-2 z-50`}
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
                                onClick={(e) => handleShortcutClick(e, shortcut)}
                                className="w-full h-full p-1 flex items-center justify-center rounded-full cursor-pointer"
                                role="button"
                                tabIndex={0}
                                draggable="true"
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

                            {/* Tooltip Name - Click to Edit */}
                            <div
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    handleOpenModal(side, shortcut)
                                }}
                                className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 cursor-pointer hover:bg-zinc-800 flex items-center gap-1"
                                title={t.editTooltip}
                            >
                                {shortcut.name}
                                <Pencil size={10} className="text-zinc-400" />
                            </div>
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
                        {showIconPicker ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-medium">
                                        {isEnglish ? 'Select Icon' : 'Seleccionar Icono'}
                                    </h2>
                                    <button
                                        onClick={() => setShowIconPicker(false)}
                                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="grid grid-cols-5 gap-3 max-h-[300px] overflow-y-auto p-1">
                                    {PRESET_ICONS.map((icon) => (
                                        <button
                                            key={icon.name}
                                            onClick={() => {
                                                setIconUrl(icon.url)
                                                setShowIconPicker(false)
                                            }}
                                            className="group flex flex-col items-center gap-1 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                            title={icon.name}
                                        >
                                            <div className="w-8 h-8 flex items-center justify-center">
                                                <img
                                                    src={icon.url}
                                                    alt={icon.name}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                            <span className="text-[10px] text-zinc-500 truncate w-full text-center">{icon.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-medium">
                                        {editingId ? t.editTitle : t.newTitle}
                                    </h2>
                                    <button
                                        onClick={() => setIsModalOpen(false)}
                                        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

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
                                        <div className="flex gap-2 items-center">
                                            <div
                                                className="w-10 h-10 relative flex-shrink-0 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-600 transition-all flex items-center justify-center group/icon"
                                                onClick={() => setShowIconPicker(true)}
                                            >
                                                {iconUrl ? (
                                                    <img
                                                        src={iconUrl}
                                                        alt="Preview"
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="text-zinc-400 group-hover/icon:text-zinc-600 dark:group-hover/icon:text-zinc-200 transition-colors">
                                                        <ImageIcon size={20} />
                                                    </div>
                                                )}
                                            </div>

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
                                                className="h-10 px-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center justify-center cursor-pointer"
                                                title={t.searchIconTooltip}
                                            >
                                                <Search size={18} className="text-zinc-600 dark:text-zinc-400" />
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
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
