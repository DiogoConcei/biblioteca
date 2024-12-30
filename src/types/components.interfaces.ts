import { Comic } from './serie.interfaces'

export interface ChaptersInfoProps {
    serie: Comic;
}

export interface SearchBarProps {
    searchInput: string;
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface ComicCardsProps {
    searchInput: string;
}

export interface ComicActionsProps {
    serie: Comic;
    setSerie: React.Dispatch<React.SetStateAction<Comic | null>>
}

export interface downloadButtonProps {
    seriePath: string
}