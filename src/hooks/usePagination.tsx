import { useState, useMemo } from "react";
import { UsePaginationProps } from "../types/customHooks.interfaces";

export default function usePagination({
  chapters,
  itemsPerPage = 11,
  initialPage = 1,
  ascending = true,
}: UsePaginationProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [isAscending, setIsAscending] = useState<boolean>(ascending);

  const sortedItems = useMemo(() => {
    const itemsCopy = [...chapters];
    return isAscending ? itemsCopy : itemsCopy.reverse();
  }, [chapters, isAscending]);

  const totalPages = useMemo(() => {
    return Math.ceil(sortedItems.length / itemsPerPage);
  }, [sortedItems.length, itemsPerPage]);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedItems.slice(startIndex, endIndex);
  }, [sortedItems, currentPage, itemsPerPage]);

  const paginationNumbers = useMemo(() => {
    const maxVisiblePages = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = startPage + maxVisiblePages - 1;
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  }, [currentPage, totalPages]);

  const handlePageChange = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const toggleOrder = () => {
    setIsAscending((prev) => !prev);
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    currentItems,
    paginationNumbers,
    handlePageChange,
    isAscending,
    toggleOrder,
  };
}
