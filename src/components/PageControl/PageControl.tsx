import "./PageControl.css";
import { MdOutlineNavigateNext, MdOutlineNavigateBefore } from "react-icons/md";
import { PageControlProps } from "../../types/components.interfaces";
import { useState } from "react";

export default function PageControl({
  currentPage,
  TamPages,
  nextPage,
  prevPage,
}: PageControlProps) {
  // Inicializa o progresso com base nos valores recebidos por props
  const [progress, setProgress] = useState(currentPage / TamPages);

  // Handlers que atualizam o progresso e chamam a função de navegação
  const handleNextPage = () => {
    nextPage();
    const newPage = currentPage + 1;
    setProgress(newPage / TamPages);
  };

  const handlePrevPage = () => {
    prevPage();
    const newPage = currentPage - 1;
    setProgress(newPage / TamPages);
  };

  return (
    <div
      className="secondPagesInfo"
      style={{ "--progress": progress } as React.CSSProperties}
    >
      <MdOutlineNavigateNext onClick={handleNextPage} />
      <div className="pageProgress">
        <p>{currentPage}</p>
        <span></span>
        <p>{TamPages}</p>
      </div>
      <MdOutlineNavigateBefore onClick={handlePrevPage} />
    </div>
  );
}
