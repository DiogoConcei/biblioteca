import useSerieStore from '../../store/useSerieStore';
import { X, House, Square, Maximize2, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import styles from './Nav.module.scss';

export default function Nav() {
  const resetStates = useSerieStore((state) => state.clearSerie);

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
    <nav className={styles['title-bar']}>
      <ul className={styles['nav-bar']}>
        <li key="home">
          <Link to="/" className={styles.link} onClick={resetStates}>
            <House className={styles['icon-home']} color="#8963ba" />
          </Link>
        </li>
        <li key="collections">
          <Link to="collections" className={styles.link} onClick={resetStates}>
            Coleções
          </Link>
        </li>
      </ul>

      <div className={styles['bar-buttons']}>
        <button
          onClick={minimize}
          aria-label="Minimizar"
          className={styles['action-button']}
        >
          <Minus color="#8963ba" />
        </button>
        {isFull ? (
          <button
            onClick={fullScreen}
            aria-label="Maximizar"
            className={styles['action-button']}
          >
            <Maximize2 color="#8963ba" />
          </button>
        ) : (
          <button
            onClick={fullScreen}
            aria-label="Maximizar"
            className={styles['action-button']}
          >
            <Square color="#8963ba" />
          </button>
        )}

        <button
          onClick={close}
          aria-label="Fechar"
          className={styles['action-button']}
        >
          <X color="#8963ba" />
        </button>
      </div>
    </nav>
  );
}
