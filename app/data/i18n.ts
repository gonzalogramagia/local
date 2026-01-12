export type Language = "es" | "en";

export interface Dictionary {
    title: string;
    subtitle: string; // HTML string
    addBlock: string;
    blockNamePlaceholder: string;
    copy: string;
    copied: string;
    edit: string;
    save: string;
    delete: string;
    confirmDelete: string;
    characters: string;
    placeholder: string;
    ariaDelete: string;
    ariaDeleteSpecific: string;
    ariaGithub: string;
    ariaEmojis: string;
    ariaHome: string;
    ariaMusic: string;
    moveUp: string;
    moveDown: string;
}

export const dictionary: Record<Language, Dictionary> = {
    es: {
        title: "Bloques de Notas",
        subtitle: "Se guardan automáticamente en el <strong>almacenamiento local</strong> de tu navegador",
        addBlock: "+ Agregar Nota",
        blockNamePlaceholder: "Nombre del bloque",
        copy: "Copiar",
        copied: "Copiado!",
        edit: "Editar",
        save: "Guardar",
        delete: "Eliminar",
        confirmDelete: "Seguro?",
        characters: "caracteres",
        placeholder: "Escribe aquí...",
        ariaDelete: "eliminación",
        ariaDeleteSpecific: "Eliminar",
        ariaGithub: "Repositorio de GitHub",
        ariaEmojis: "Sitio de Emojis",
        ariaHome: "Inicio",
        ariaMusic: "Musica",
        moveUp: "Mover Arriba",
        moveDown: "Mover Abajo",
    },
    en: {
        title: "Note Blocks",
        subtitle: "Automatically saved in your browser's <strong>local storage</strong>",
        addBlock: "+ Add Note",
        blockNamePlaceholder: "Block Name",
        copy: "Copy",
        copied: "Copied!",
        edit: "Edit",
        save: "Save",
        delete: "Delete",
        confirmDelete: "Sure?",
        characters: "characters",
        placeholder: "Type here...",
        ariaDelete: "deletion",
        ariaDeleteSpecific: "Delete",
        ariaGithub: "GitHub Repository",
        ariaEmojis: "Emojis Site",
        ariaHome: "Home",
        ariaMusic: "Music",
        moveUp: "Move Up",
        moveDown: "Move Down",
    },
};
