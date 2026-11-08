import { Outlet, matchPath, useLocation } from 'react-router-dom';
import Nav from '@/shared/components/Nav/Nav';
import styles from './Layout.module.scss';
import { useUIStore } from '../../../shared/store/useUIStore';
import ErrorScreen from '@/shared/components/ErrorScreen/ErrorScreen';
import { LiteratureForm } from '@/shared/types/series.interfaces';

type NavMode = 'default' | 'overlay' | 'hidden';

const SERIE_PAGE_MODES: { pattern: string; mode: NavMode }[] = Object.values(
  LiteratureForm,
).map((form) => ({
  pattern: `/${form}/:serie_name/:serie_id`,
  mode: 'overlay',
}));

const NAV_MODES: { pattern: string; mode: NavMode }[] = [
  { pattern: '/collections', mode: 'hidden' },
  { pattern: '/local-upload/serie', mode: 'overlay' },
  { pattern: '/local-upload/chapter', mode: 'overlay' },
  ...SERIE_PAGE_MODES,
];
function getNavMode(pathname: string): NavMode {
  return (
    NAV_MODES.find(({ pattern }) => matchPath({ path: pattern, end: true }, pathname))
      ?.mode ?? 'default'
  );
}

const Layout = () => {
  const error = useUIStore((state) => state.error);
  const { pathname } = useLocation();
  const mode = getNavMode(pathname);

  if (error) return <ErrorScreen error={error} />;

  return (
    <article className={styles.Content} data-nav={mode}>
      {mode !== 'hidden' && <Nav />}
      <section className={styles.OutletContainer}>
        <Outlet />
      </section>
    </article>
  );
};

export default Layout;
