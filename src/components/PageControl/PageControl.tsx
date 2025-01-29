import "./PageControl.css";
import { MdOutlineNavigateNext, MdOutlineNavigateBefore } from "react-icons/md";
import { PageControlProps } from "../../types/components.interfaces";

export default function PageControl({
  currentPage,
  TamPages,
  nextPage,
  prevPage,
}: PageControlProps) {
  const progress = currentPage / TamPages;
  document.documentElement.style.setProperty("--progress", String(progress));

  return (
    <div className="secondPagesInfo">
      <MdOutlineNavigateNext onClick={nextPage} />

      <div className="pageProgress">
        <p>{currentPage}</p>
        <span></span>
        <p>{TamPages}</p>
      </div>

      <MdOutlineNavigateBefore onClick={prevPage} />
    </div>
  );
}
