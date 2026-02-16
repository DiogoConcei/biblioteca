import styles from './SettingsLayout.module.scss';
import { Outlet, NavLink } from 'react-router-dom';

export default function SettingsLayout() {
  const sections = [
    { label: 'Ajustes Rápidos', path: '' },
    { label: 'Backup', path: 'backup' },
    { label: 'Aparência', path: 'appearance' },
  ];

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <ul className={styles.menu}>
          {sections.map((section) => (
            <li key={section.path}>
              <NavLink
                to={section.path}
                end={section.path === ''}
                className={({ isActive }) =>
                  `${styles.sectionItem} ${isActive ? styles.active : ''}`
                }
              >
                {section.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
}
