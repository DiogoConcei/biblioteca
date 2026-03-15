import styles from './Loading.module.scss';
import { Radius } from 'lucide-react';

export default function Loading() {
  return (
    <div className={styles.loadingWrapper}>
      <Radius className={styles.spinner} />
    </div>
  );
}
