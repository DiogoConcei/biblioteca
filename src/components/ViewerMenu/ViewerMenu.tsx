import { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  House,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  ZoomOut,
  ZoomIn,
  Book,
  Settings,
  Image as ImageIcon,
  Monitor,
} from 'lucide-react';

import { visualizerProps } from '../../types/components.interfaces';
import useSettingsStore from '../../store/useSettingsStore';
import useNavigation from '../../hooks/useNavigation';
import CustomSelect from '../CustomSelect/CustomSelect';

import styles from './ViewerMenu.module.scss';

type MenuTab = 'navigation' | 'reading' | 'filters';

export default function ViewerMenu({ chapter, setScale }: visualizerProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MenuTab>('navigation');
  
  const { chapter_name: rawChapterName } = useParams<{ chapter_name: string }>();
  const chapterName = decodeURIComponent(rawChapterName ?? '');

  const { goHome, goToSeriePage, nextChapter, prevChapter } = useNavigation(chapter);
  const { settings, updateSetting } = useSettingsStore();
  const viewerSettings = settings.viewer;

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const handleUpdateViewer = useCallback(<K extends keyof typeof viewerSettings>(key: K, value: typeof viewerSettings[K]) => {
    updateSetting('viewer', {
      ...viewerSettings,
      [key]: value
    });
  }, [updateSetting, viewerSettings]);

  return (
    <article className={`${styles.viewerMenuContainer} ${isMenuOpen ? styles.open : styles.closed}`}>
      <button className={styles.toggleBtn} onClick={toggleMenu} aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}>
        {isMenuOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
      </button>

      {isMenuOpen && (
        <section className={styles.menuContent}>
          <header className={styles.menuHeader}>
            <Book size={20} className={styles.headerIcon} />
            <h2 title={chapter.serieName}>{chapter.serieName}</h2>
          </header>

          <nav className={styles.tabs}>
            <button 
              className={activeTab === 'navigation' ? styles.active : ''} 
              onClick={() => setActiveTab('navigation')}
              title="Navegação"
            >
              <Monitor size={20} />
            </button>
            <button 
              className={activeTab === 'reading' ? styles.active : ''} 
              onClick={() => setActiveTab('reading')}
              title="Modos de Leitura"
            >
              <Settings size={20} />
            </button>
            <button 
              className={activeTab === 'filters' ? styles.active : ''} 
              onClick={() => setActiveTab('filters')}
              title="Filtros de Imagem"
            >
              <ImageIcon size={20} />
            </button>
          </nav>

          <div className={styles.tabContent}>
            {activeTab === 'navigation' && (
              <div className={styles.navigationTab}>
                <div className={styles.chapterNav}>
                  <button onClick={prevChapter} title="Capítulo Anterior"><ChevronsLeft /></button>
                  <span className={styles.currentChapterName}>{chapterName}</span>
                  <button onClick={nextChapter} title="Próximo Capítulo"><ChevronsRight /></button>
                </div>
                
                <div className={styles.zoomActions}>
                   <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} title="Diminuir Zoom"><ZoomOut /></button>
                   <button onClick={() => setScale(1)} className={styles.resetBtn}>100%</button>
                   <button onClick={() => setScale(s => Math.min(3, s + 0.1))} title="Aumentar Zoom"><ZoomIn /></button>
                </div>

                <div className={styles.navLinks}>
                  <button onClick={goHome} className={styles.navLink}>
                    <House size={18} /> <span>Página Inicial</span>
                  </button>
                  <button onClick={goToSeriePage} className={styles.navLink}>
                    <ChevronLeft size={18} /> <span>Voltar para a Série</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'reading' && (
              <div className={styles.readingTab}>
                <div className={styles.settingGroup}>
                  <label>Modo de Leitura</label>
                  <CustomSelect 
                    value={viewerSettings.readingMode}
                    onChange={(val) => handleUpdateViewer('readingMode', val as any)}
                    options={[
                      { value: 'single', label: 'Página Única' },
                      { value: 'double', label: 'Página Dupla' },
                      { value: 'webtoon', label: 'Webtoon' },
                    ]}
                  />
                </div>

                <div className={styles.settingGroup}>
                  <label>Efeito de Transição</label>
                  <CustomSelect 
                    value={viewerSettings.transitionEffect}
                    onChange={(val) => handleUpdateViewer('transitionEffect', val as any)}
                    options={[
                      { value: 'none', label: 'Nenhum' },
                      { value: 'fade', label: 'Fade' },
                      { value: 'slide', label: 'Slide' },
                    ]}
                  />
                </div>

                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={viewerSettings.wideScreen} 
                      onChange={(e) => handleUpdateViewer('wideScreen', e.target.checked)}
                    />
                    <span>Ajustar à Largura</span>
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={viewerSettings.showPageNumbers} 
                      onChange={(e) => handleUpdateViewer('showPageNumbers', e.target.checked)}
                    />
                    <span>Mostrar Números</span>
                  </label>
                </div>
              </div>
            )}

            {activeTab === 'filters' && (
              <div className={styles.filtersTab}>
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderLabel}>
                    <span>Brilho</span>
                    <span>{viewerSettings.brightness.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="2" step="0.1"
                    value={viewerSettings.brightness}
                    onChange={(e) => handleUpdateViewer('brightness', parseFloat(e.target.value))}
                  />
                </div>
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderLabel}>
                    <span>Contraste</span>
                    <span>{viewerSettings.contrast.toFixed(1)}x</span>
                  </div>
                  <input 
                    type="range" min="0.5" max="2" step="0.1"
                    value={viewerSettings.contrast}
                    onChange={(e) => handleUpdateViewer('contrast', parseFloat(e.target.value))}
                  />
                </div>
                <div className={styles.sliderGroup}>
                  <div className={styles.sliderLabel}>
                    <span>Nitidez</span>
                    <span>{viewerSettings.sharpness}</span>
                  </div>
                  <input 
                    type="range" min="0" max="10" step="1"
                    value={viewerSettings.sharpness}
                    onChange={(e) => handleUpdateViewer('sharpness', parseFloat(e.target.value))}
                  />
                </div>
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkboxLabel}>
                    <input 
                      type="checkbox" 
                      checked={viewerSettings.grayscale} 
                      onChange={(e) => handleUpdateViewer('grayscale', e.target.checked)}
                    />
                    <span>Preto e Branco</span>
                  </label>
                </div>
                <button 
                  className={styles.resetFilters}
                  onClick={() => {
                    handleUpdateViewer('brightness', 1);
                    handleUpdateViewer('contrast', 1);
                    handleUpdateViewer('sharpness', 0);
                    handleUpdateViewer('grayscale', false);
                  }}
                >
                  Resetar Filtros
                </button>
              </div>
            )}
          </div>
        </section>
      )}
    </article>
  );
}
