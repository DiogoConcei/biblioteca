import "./Pagination.css";
import { PaginationProps } from "../../types/components.interfaces";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

export default function Pagination({
  totalPages,
  currentPage,
  onPageChange,
}: PaginationProps) {
  const maxVisiblePages = 10;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const paginationNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  return (
    <nav className="ControlBtns" aria-label="Paginação">
      <button
        className="prevBTN"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-disabled={currentPage === 1}>
        <span>
          <FaArrowLeft />
        </span>
      </button>

      {paginationNumbers.map((pageNumber) => (
        <button
          key={pageNumber}
          onClick={() => onPageChange(pageNumber)}
          className={pageNumber === currentPage ? "active" : "disable"}
          aria-current={pageNumber === currentPage ? "page" : undefined}>
          {pageNumber}
        </button>
      ))}

      <button
        className="nextBTN"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-disabled={currentPage === totalPages}>
        <span>
          <FaArrowRight />
        </span>
      </button>
    </nav>
  );
}
