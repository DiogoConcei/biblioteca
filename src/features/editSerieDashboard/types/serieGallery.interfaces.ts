export interface SerieGalleryProps {
  currentCover: string;
  onClose: () => void;
  onSelect: (imagePath: string) => void;
}
