import { useSerieStore } from "../../store/seriesStore";
import { X, House, Square, Maximize2, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import "./Nav.scss";
import { useState } from "react";

export default function Nav() {
  const resetStates = useSerieStore((state) => state.resetStates);

  const [isFull, setIsFull] = useState<boolean>();

  const minimize = async () => {
    await window.electronAPI.windowAction.minimize();
  };

  const fullScreen = async () => {
    const response = await window.electronAPI.windowAction.toggleMaximize();
    setIsFull(response);
  };

  const close = async () => {
    await window.electronAPI.windowAction.close();
  };

  return (
    <nav className={"TitleBar"}>
      <ul className="NavBar">
        <li key="home">
          <Link to="/" className="link" onClick={resetStates}>
            <House className="IconHome" color="#8963ba" />
          </Link>
        </li>
        <li>
          <Link className="link" to="/teste" onClick={resetStates}>
            Teste de componentes
          </Link>
        </li>
      </ul>

      <div className="windowBtns">
        <button
          onClick={minimize}
          aria-label="Minimizar"
          className="ActionsBtn"
        >
          <Minus color="#8963ba" />
        </button>
        {isFull ? (
          <button
            onClick={fullScreen}
            aria-label="Maximizar"
            className="ActionsBtn"
          >
            <Maximize2 color="#8963ba" />
          </button>
        ) : (
          <button
            onClick={fullScreen}
            aria-label="Maximizar"
            className="ActionsBtn"
          >
            <Square color="#8963ba" />
          </button>
        )}

        <button onClick={close} aria-label="Fechar" className="ActionsBtn">
          <X color="#8963ba" />
        </button>
      </div>
    </nav>
  );
}
