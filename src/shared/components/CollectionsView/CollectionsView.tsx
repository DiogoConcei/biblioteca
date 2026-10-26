import styles from './CollectionsView.module.scss';
import useClickOutside from '@/shared/hooks/useClickOutside';
import { X } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';

export default function CollectionsView({ onClose }: { onClose: () => void }) {
  const modalRef = useClickOutside<HTMLDivElement>(onClose);

  return (
    <div className={styles.overlay}>
      <div ref={modalRef} className={styles.modalContent}>
        <header className={styles.header}>
          <h2></h2>

          <button type="button" className={styles.addButton}></button>
          <button type="button" onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </header>
        <div className={styles.grid}></div>
      </div>
    </div>
  );
}
