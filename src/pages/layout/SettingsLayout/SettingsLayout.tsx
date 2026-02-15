import styles from './SettingsLayout.module.scss';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

export default function SettingsLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    { label: 'Ajustes Rápidos', path: '/settings' },
    { label: 'Backup', path: '/settings/backup' },
    { label: 'Aparência', path: '/settings/appearance' },
  ];

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <ul className={styles.menu}>
          {sections.map((section) => {
            const isActive =
              section.path === '/settings'
                ? location.pathname === '/settings'
                : location.pathname.startsWith(section.path);

            return (
              <li key={section.path}>
                <button
                  onClick={() => navigate(section.path)}
                  className={`${styles.sectionItem} ${
                    isActive ? styles.active : ''
                  }`}
                >
                  {section.label}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
