import { useEffect, useState } from 'react';

import CustomSelect from '@/components/CustomSelect/CustomSelect';
import useSystem from '@/hooks/useSystem';

import useSettingsStore from '@/store/useSettingsStore';
import { AppSettings } from '@/types/settings.interfaces';

import styles from './AppearanceSettings.module.scss';

export default function AppearanceSettings() {
  const systemManager = useSystem();

  const settings = useSettingsStore((state) => state.settings);
  const loadFromStorage = useSettingsStore((state) => state.loadFromStorage);
  const loadFromSystem = useSettingsStore((state) => state.loadFromSystem);
  const saveToSystem = useSettingsStore((state) => state.saveToSystem);

  const [toast, setToast] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [operationLogs, setOperationLogs] = useState<string[]>([]);

  const appendLog = (message: string) => {
    setOperationLogs((prev) =>
      [new Date().toLocaleTimeString() + ' • ' + message, ...prev].slice(0, 10),
    );
  };

  useEffect(() => {
    loadFromStorage();
    void loadFromSystem(systemManager);
  }, [loadFromStorage, loadFromSystem, systemManager]);

  const persistSettings = async (partial: Partial<AppSettings>) => {
    try {
      await saveToSystem(systemManager, partial);
      setToast({ type: 'success', message: 'Configuração salva com sucesso.' });
      appendLog('Preferências visuais atualizadas.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao salvar configuração';
      setToast({ type: 'error', message });
      appendLog(message);
    }
  };

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        <h2>Tema / Aparência</h2>
        <p>Ajuste modo de tema, cor principal e espaçamento.</p>
      </header>

      <div className={styles.form}>
        <CustomSelect
          label="Tema"
          value={settings.themeMode}
          onChange={(value) =>
            void persistSettings({
              themeMode: value as AppSettings['themeMode'],
            })
          }
          options={[
            { value: 'system', label: 'Sistema' },
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Escuro' },
          ]}
        />

        <label>
          Cor de destaque
          <input
            type="color"
            value={settings.accentColor}
            onChange={(event) =>
              void persistSettings({ accentColor: event.target.value })
            }
            aria-label="Cor de destaque"
          />
        </label>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={settings.compactMode}
            onChange={(event) =>
              void persistSettings({ compactMode: event.target.checked })
            }
            aria-label="Ativar modo compacto"
          />
          Modo compacto
        </label>
      </div>

      {toast && (
        <p className={`${styles.toast} ${styles[toast.type]}`}>
          {toast.message}
        </p>
      )}

      {operationLogs.length > 0 && (
        <section className={styles.logs}>
          <h3>Histórico</h3>
          <ul>
            {operationLogs.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
