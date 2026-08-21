import '../shared/styles/base.scss';

import { HashRouter, Routes, Route } from 'react-router-dom';

import Layout from './layout/AppLayout/Layout';
import Home from '../features/hub/components/home/Home';
import Upload from '../features/upload/components/SerieUpload';
// import MangaPage from './pages/mangaPage/MangaPage';
import ComicPage from '../features/comicview/comicPage/comicPage';
import TieInPage from '../components/TieInPage/TieInPage';
import Viewer from '../features/viewer/graphviewer/Viewer';
// import EditSerie from './pages/editSerie/EditSerie';
import ErrorBoundary from '../shared/providers/ErrorBoundary';
import BookViewer from '../features/viewer/bookviewer/bookViewer/BookViewer';
// import BookPage from './pages/bookPage/BookPage';

const App = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            {/* <Route
              path="edit/serie/:serie_name/:literature_form"
              element={<EditSerie />}
            /> */}
            <Route path="local-upload/serie" element={<Upload />} />
            {/* <Route path="Manga/:manga_name/:manga_id" element={<MangaPage />} /> */}
            {/* <Route path="Books/:book_name/:book_id" element={<BookPage />} /> */}
            <Route path="Quadrinho/:comic_name/:comic_id" element={<ComicPage />} />
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
