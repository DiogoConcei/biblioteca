import './SearchBar.scss';
import { ListFilter, Search } from 'lucide-react';

import { SearchBarProps } from '../../types/components.interfaces';

export default function SearchBar({ searchInput, onSearchChange }: SearchBarProps) {
  return (
    <div className="search-config">
      <label htmlFor="search" className="searchLabel">
        <input
          id="search"
          type="text"
          onChange={onSearchChange}
          value={searchInput}
          placeholder="Pesquisar"
          className="searchBar"
        />
        <Search color="#8963ba" className="actIcon" />
      </label>
      <span>
        <ListFilter color="#8963ba" className="actIcon" />
      </span>
    </div>
  );
}
