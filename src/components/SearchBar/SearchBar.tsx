import styles from './SearchBar.module.scss';
import { ListFilter, Search } from 'lucide-react';

import { SearchBarProps } from '../../types/components.interfaces';

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
        <Search color="#8963ba" className="actIcon" />
      </label>
      <span>
        <ListFilter color="#8963ba" className="actIcon" />
      </span>
    </div>
  );
}
