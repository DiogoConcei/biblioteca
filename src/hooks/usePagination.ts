import useSerieStore from '../store/useSerieStore';
import { useState } from 'react';

export default function usePagination() {
  const chapters = useSerieStore((s) => s.chapters);
  const itemsPage = 12;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(chapters.length / itemsPage);
  const start = (currentPage - 1) * itemsPage;
  const currentItems = chapters.slice(start, start + itemsPage);

  const maxVisiblePages = 10;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  const pageNumbers = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i,
  );

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
