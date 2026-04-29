import './styles/base.scss';

import { HashRouter, Routes, Route } from 'react-router-dom';

import Layout from './pages/layout/appLayout/Layout';
import SystemConfig from './pages/settingsPage/systemSettings/SystemConfig';
import Home from './pages/layout/home/Home';
import Collections from './pages/collections/Collections';
import Upload from './pages/upload/Upload';
import MangaPage from './pages/mangaPage/MangaPage';
import ComicPage from './pages/comicPage/comicPage';
import TieInPage from './components/TieInPage/TieInPage';
import Viewer from './pages/viewer/Viewer';
import EditSerie from './pages/editSerie/EditSerie';
import SettingsLayout from './pages/layout/settingsLayout/SettingsLayout';
import BackupSettings from './pages/settingsPage/backupSettings/BackupSettings';
import ErrorBoundary from './providers/ErrorBoundary';
import AppearanceSettings from './pages/settingsPage/appearancesSettings/AppearanceSettings';
import PrivacySettings from './pages/settingsPage/privacySettings/PrivacySettings';
import SyncSettings from './pages/settingsPage/syncSettings/SyncSettings';
import LanSettings from './pages/settingsPage/lanSettings/LanSettings';
import ResetSettings from './pages/settingsPage/resetSettings/ResetSettings';
import Downloads from './pages/downloads/Downloads';
import BookViewer from './pages/bookViewer/BookViewer';
import BookPage from './pages/bookPage/BookPage';

const App = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="collections" element={<Collections />} />
            <Route path="downloads" element={<Downloads />} />
            <Route path="settings" element={<SettingsLayout />}>
              <Route index element={<SystemConfig />} />
              <Route path="backup" element={<BackupSettings />} />
              <Route path="appearance" element={<AppearanceSettings />} />
              <Route path="privacy" element={<PrivacySettings />} />
              <Route path="sync" element={<SyncSettings />} />
              <Route path="lan" element={<LanSettings />} />
              <Route path="reset" element={<ResetSettings />} />
            </Route>
            <Route
              path="edit/serie/:serie_name/:literature_form"
              element={<EditSerie />}
            />
            <Route path="local-upload/serie" element={<Upload />} />
            <Route path="Manga/:manga_name/:manga_id" element={<MangaPage />} />
            <Route path="Books/:book_name/:book_id" element={<BookPage />} />
            <Route
              path="Quadrinho/:comic_name/:comic_id"
              element={<ComicPage />}
            />
            <Route path="TieIn/:tiein_name" element={<TieInPage />} />
          </Route>
          <Route
            path="book/:serie_name/:serie_id/:chapter_name/:chapter_id/:page/:isRead"
            element={<BookViewer />}
          />
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
