import './styles/base.scss';

import { HashRouter, Routes, Route, Router } from 'react-router-dom';

import Layout from './pages/layout/Layout';
import Home from './pages/home/Home';
import Upload from './pages/upload/Upload';
import MangaPage from './pages/mangaPage/MangaPage';
import ComicPage from './pages/comicPage/comicPage';
import TieInPage from './components/TieInPage/TieInPage';
import Viewer from './pages/viewer/Viewer';
import EditSerie from './pages/editSerie/EditSerie';
import SettingsLayout from './pages/layout/SettingsLayout/SettingsLayout';
import SystemConfig from './components/SystemConfig/SystemConfig';
import ErrorBoundary from './providers/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<SystemConfig />} />
              {/* <Route path="backup" element={<BackupSettings />} /> */}
              {/* <Route path="appearance" element={<AppearanceSettings />} /> */}
            </Route>
            <Route
              path="edit/serie/:serie_name/:literature_form"
              element={<EditSerie />}
            />
            <Route path="local-upload/serie" element={<Upload />} />
            <Route path="Manga/:manga_name/:manga_id" element={<MangaPage />} />
            <Route
              path="Quadrinho/:comic_name/:comic_id"
              element={<ComicPage />}
            />
            <Route path="TieIn/:tiein_name" element={<TieInPage />} />
          </Route>
          <Route
            path=":serie_name/:serie_id/:chapter_name/:chapter_id/:page/:isRead"
            element={<Viewer />}
          />
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
