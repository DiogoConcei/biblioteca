import { MdClose } from "react-icons/md";
import { FaRegSquareFull } from "react-icons/fa6";
import { GoHome } from "react-icons/go";
import { dinamicNavProp } from "../../types/components.interfaces";
import { FiMinus } from "react-icons/fi";
import { Link } from "react-router-dom";
import "./Nav.css";

export default function Nav({ isHidden }: dinamicNavProp) {
  const minimize = () => {
    if (window?.electron?.windowAction?.minimize) {
      window.electron.windowAction.minimize();
    } else {
      console.warn("Minimize function not available");
    }
  };

  const fullScreen = () => {
    if (window?.electron?.windowAction?.fullScreen) {
      window.electron.windowAction.fullScreen();
    } else {
      console.warn("FullScreen function not available");
    }
  };

  const close = () => {
    if (window?.electron?.windowAction?.close) {
      window.electron.windowAction.close();
    } else {
      console.warn("Close function not available");
    }
  };

  return (
    <nav className={`TitleBar ${isHidden ? "hideNav" : ""}`}>
      <ul className="NavBar">
        <li key="home">
          <Link to="/" className="link">
            <button className="ActionsBtn" aria-label="Home">
              <GoHome className="icon" />
            </button>
          </Link>
        </li>
        <li key="arquivos">
          <Link className="link tab" to="/arquivos">
            Arquivos
          </Link>
        </li>
        <li key="colecoes">
          <Link className="link tab" to="/colecoes">
            Coleções
          </Link>
        </li>
      </ul>

      <div className="containerBtns">
        <div className="windowBtns">
          <button
            onClick={minimize}
            aria-label="Minimizar"
            className="ActionsBtn">
            <FiMinus className="icon" />
          </button>
          <button
            onClick={fullScreen}
            aria-label="Maximizar"
            className="ActionsBtn">
            <FaRegSquareFull className="icon" />
          </button>
          <button onClick={close} aria-label="Fechar" className="ActionsBtn">
            <MdClose className="icon" />
          </button>
        </div>
      </div>
    </nav>
  );
}
