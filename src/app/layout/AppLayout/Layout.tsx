import { Outlet, useLocation } from 'react-router-dom';

import Nav from '@/shared/components/Nav/Nav';

import styles from '@/app/layout/AppLayout/Layout.module.scss';
import { useUIStore } from '../../../shared/store/useUIStore';
import ErrorScreen from '@/shared/components/ErrorScreen/ErrorScreen';

const Layout = () => {
  const error = useUIStore((state) => state.error);
  const location = useLocation();
  const isCollectionsPage = location.pathname === '/collections';

  if (error) {
    return <ErrorScreen error={error} />;
  }

  return (
    <article className={styles.Content}>
      {!isCollectionsPage && <Nav />}
      <section className={styles.OutletContainer}>
        <Outlet />
      </section>
    </article>
  );
};

export default Layout;
