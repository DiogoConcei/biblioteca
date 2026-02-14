import styles from './SearchBar.module.scss';
import { Search } from 'lucide-react';
import { SearchBarProps } from '@/types/components.interfaces';

export default function SearchBar({
  searchInput,
  onSearchChange,
}: SearchBarProps) {
  return (
    <div className={styles['search-config']}>
      <label htmlFor="search" className={styles['search-label']}>
        <input
          id="search"
          type="text"
          onChange={onSearchChange}
          value={searchInput}
          placeholder="Pesquisar"
          className={styles['search-bar']}
        />
        <Search size={28} />
      </label>
    </div>
  );
}
