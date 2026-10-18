// features/upload/components/UploadChoiceModal/UploadChoiceModal.tsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useUploadStore } from '../../store/uploadStore';
import { Choice } from '../../types/upload.interfaces';

import styles from './UploadChoice.module.scss';

const SERIE_ROUTE = '/local-upload/serie';
const CHAPTER_ROUTE = '/local-upload/chapter';

export default function UploadChoice() {
  const navigate = useNavigate();
  const isOpen = useUploadStore((s) => s.isModalOpen);
  const seriesCount = useUploadStore((s) => s.pendingSeries.length);
  const chaptersCount = useUploadStore((s) => s.pendingChapters.length);

  const firstButtonRef = useRef<HTMLButtonElement | null>(null);

  const go = (route: string) => {
    useUploadStore.getState().closeModal();
    navigate(route);
  };

  // Cancelar descarta as duas filas, para não sobrar arquivo órfão na store.
  const cancel = () => {
    const store = useUploadStore.getState();
    store.consumeSeries();
    store.consumeChapters();
    store.closeModal();
  };

  useEffect(() => {
    if (!isOpen) return;

    firstButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const choices: Choice[] = [
    {
      id: 'series-first',
      title: 'Criar séries e depois adicionar capítulos',
      description:
        'Use quando os capítulos pertencem às séries novas. Elas poderão ser escolhidas como destino na etapa seguinte.',
      run: () => go(SERIE_ROUTE),
    },
    {
      id: 'chapters-first',
      title: 'Adicionar capítulos e depois criar séries',
      description:
        'Use quando os capítulos vão para uma série que já existe e as séries novas são outra coisa.',
      run: () => go(CHAPTER_ROUTE),
    },
    {
      id: 'chapters-only',
      title: 'Só adicionar capítulos',
      description: 'Envia os capítulos para uma série existente.',
      warning: `${seriesCount} série(s) será(ão) descartada(s).`,
      run: () => {
        useUploadStore.getState().consumeSeries();
        go(CHAPTER_ROUTE);
      },
    },
    {
      id: 'series-only',
      title: 'Só criar séries',
      description: 'Cria as séries novas sem adicionar capítulos.',
      warning: `${chaptersCount} capítulo(s) será(ão) descartado(s).`,
      run: () => {
        useUploadStore.getState().consumeChapters();
        go(SERIE_ROUTE);
      },
    },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.backdrop}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={cancel}
        >
          <motion.div
            className={styles.card}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-choice-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="upload-choice-title" className={styles.title}>
              O que você quer fazer com esses arquivos?
            </h2>
            <p className={styles.summary}>
              Foram detectadas <strong>{seriesCount}</strong> série(s) nova(s) e{' '}
              <strong>{chaptersCount}</strong> capítulo(s).
            </p>

            <ul className={styles.choices}>
              {choices.map((choice, i) => (
                <li key={choice.id}>
                  <button
                    ref={i === 0 ? firstButtonRef : undefined}
                    type="button"
                    className={`${styles.choice} ${
                      choice.warning ? styles.choiceDestructive : ''
                    }`}
                    onClick={choice.run}
                  >
                    <span className={styles.choiceTitle}>{choice.title}</span>
                    <span className={styles.choiceDescription}>{choice.description}</span>
                    {choice.warning && (
                      <span className={styles.choiceWarning}>{choice.warning}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            <button type="button" className={styles.cancel} onClick={cancel}>
              Cancelar e descartar tudo
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
