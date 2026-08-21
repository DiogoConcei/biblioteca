import { Radius } from 'lucide-react';

import styles from './Loading.module.scss';

export default function Loading() {
  return (
    <div className={styles.loadingWrapper}>
      <Radius className={styles.spinner} />
    </div>
  );
}
