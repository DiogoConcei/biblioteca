import "./SearchBar.css";
import { SearchBarProps } from "../../types/components.interfaces";
import { MdFilterList } from "react-icons/md";
import { CiSearch } from "react-icons/ci";

export default function SearchBar({
  searchInput,
  onSearchChange,
}: SearchBarProps) {
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

        <CiSearch className="lupa" />
      </label>
      <span>
        <MdFilterList className="config" />
      </span>
    </div>
  );
}
