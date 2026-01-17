export type Language = "es" | "en";

export interface Dictionary {
    title: string;
    subtitle: string; // HTML string
    addBlock: string;
    addBlockMobile: string;
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
    goToHome: string;
    goToEmojis: string;
    goToMusic: string;
    goToPlay: string;
}

export const dictionary: Record<Language, Dictionary> = {
    es: {
        title: "MIS NOTAS",
        subtitle: "Se guardan automáticamente <br class='lg:hidden' /> en el <strong>almacenamiento local</strong> de tu navegador",
        addBlock: "Agregar otra nota +",
        addBlockMobile: "Agregar +",
        blockNamePlaceholder: "Nombre de la nota",
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
        goToHome: "Ya estás acá!",
        goToEmojis: "Ir a Emojis",
        goToMusic: "Ir a Música",
        goToPlay: "Ir a Jugar",
    },
    en: {
        title: "MY NOTES",
        subtitle: "Automatically saved in your browser's <strong>local storage</strong>",
        addBlock: "Add new note +",
        addBlockMobile: "Add +",
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
        ariaHome: "Today",
        ariaMusic: "Music",
        moveUp: "Move Up",
        moveDown: "Move Down",
        goToHome: "You are here!",
        goToEmojis: "Go to Emojis",
        goToMusic: "Go to Music",
        goToPlay: "Go Play",
    },
};
