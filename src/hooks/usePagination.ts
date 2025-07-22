import { LiteratureChapter } from "@/types/series.interfaces";
import { useState, useMemo } from "react";

export default function usePagination(
  chapters: LiteratureChapter[],
  itemsPage = 12
) {
  const [currentPage, setCurrentPage] = useState<number>(1);

  const totalPages = useMemo(() => {
    return Math.ceil(chapters.length / itemsPage);
  }, [chapters.length, itemsPage]);

  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPage;
    const endIndex = startIndex + itemsPage;
    return chapters.slice(startIndex, endIndex);
  }, [chapters, currentPage, itemsPage]);

  const pageNumbers = useMemo(() => {
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

  const handlePage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  return {
    currentItems,
    pageNumbers,
    currentPage,
    totalPages,
    handlePage,
  };
}
