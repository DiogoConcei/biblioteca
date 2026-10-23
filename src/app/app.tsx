import '@/shared/styles/base.scss';

import { HashRouter, Routes, Route } from 'react-router-dom';

import Layout from './layout/AppLayout/Layout';
import ErrorBoundary from '@/shared/providers/ErrorBoundary';
import Home from '@/features/hub/home/Home';
import SerieUpload from '@/features/upload/serieUpload/SerieUpload';
import ChapterUpload from '@/features/upload/chapterUpload/ChapterUpload';
import UploadChoice from '@/features/upload/components/UploadChoice/UploadChoice';
import SeriePage from '@/features/libraryBrowser/seriePage/SeriePage';
import { LiteratureForm } from '@/shared/types/series.interfaces';

// import ComicPage from '../features/comicview/comicPage/comicPage';
// import Tie'InPage from '../components/TieInPage/TieInPage';
// import Viewer from '../features/viewer/graphviewer/Viewer';
// import EditSerie from './pages/editSerie/EditSerie';
// import ErrorBoundary from '../shared/providers/ErrorBoundary';
// import BookViewer from '../features/viewer/bookviewer/bookViewer/BookViewer';
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
            <Route path="local-upload/serie" element={<SerieUpload />} />
            <Route path="local-upload/chapter" element={<ChapterUpload />} />
            <Route
              path={`${LiteratureForm.MANGA}/:serie_name/:serie_id`}
              element={<SeriePage literatureForm={LiteratureForm.MANGA} />}
            />{' '}
            <Route
              path={`${LiteratureForm.BOOK}/:serie_name/:serie_id`}
              element={<SeriePage literatureForm={LiteratureForm.BOOK} />}
            />{' '}
            <Route
              path={`${LiteratureForm.COMIC}/:serie_name/:serie_id`}
              element={<SeriePage literatureForm={LiteratureForm.COMIC} />}
            />{' '}
            {/* <Route path="Books/:book_name/:book_id" element={<BookPage />} /> */}
            {/* <Route path="Quadrinho/:comic_name/:comic_id" element={<ComicPage />} /> */}
            {/* <Route path="TieIn/:tiein_name" element={<TieInPage />} /> */}
          </Route>
          {/* <Route
            path="book/:serie_name/:serie_id/:chapter_name/:chapter_id/:page/:isRead"
            element={<BookViewer />}
          /> */}
          {/* <Route
            path=":serie_name/:serie_id/:chapter_name/:chapter_id/:page/:isRead"
            element={<Viewer />}
          /> */}
        </Routes>
        <UploadChoice />
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
