import { Outlet } from 'react-router-dom';
import Nav from '../../components/Nav/Nav';
import styles from './Layout.module.scss';
import useUIStore from '../../store/useUIStore';
import ErrorScreen from '../../components/ErrorScreen/ErrorScreen';

const Layout = () => {
  const error = useUIStore((state) => state.error);

  if (error) {
    return <ErrorScreen error={error} />;
  }

  return (
    <article className={styles.Content}>
      <Nav />
      <section className={styles.OutletContainer}>
        <Outlet />
      </section>
    </article>
  );
};

export default Layout;
