import './styles/base.scss';

import { HashRouter, Routes, Route } from 'react-router-dom';

import Layout from './pages/layout/Layout';
import Home from './pages/home/Home';
import Upload from './pages/upload/Upload';
import MangaPage from './pages/mangaPage/MangaPage';
import ComicPage from './pages/comicPage/comicPage';
import TieInPage from './components/TieInPage/TieInPage';
import ErrorScreen from './components/ErrorScreen/ErrorScreen';
import Viewer from './pages/viewer/Viewer';

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
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
  );
};

export default App;
