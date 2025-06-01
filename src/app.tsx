import { HashRouter, Routes, Route } from 'react-router-dom';

import Layout from './pages/layout/Layout';
import Home from './pages/home/Home';
import Upload from './pages/upload/Upload';
import MangaPage from './pages/mangaPage/MangaPage';

import './styles/base.scss';
// import Home from "./pages/home/Home";
// import Page404 from "./pages/page404/page404";
// import LocalUpload from "./pages/upload/localUpload/localUpload";
// import ComicPage from "./pages/comic/ComicPage";
// import Visualizer from "./pages/visualizer/Visualizer";
// import { GlobalProvider } from "./GlobalContext";

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="local-upload/serie" element={<Upload />} />
          <Route path="Manga/:manga_name/:manga_id" element={<MangaPage />} />

          {/* <Route
            path="Quadrinho/:comic_name/:comic_id"
            element={<ComicPage />}
          />
          <Route
            path=":serie_name/:serie_id/:chapter_name/:chapter_id/:page/:isRead"
            element={<Visualizer />}
          />
          <Route path="teste" element={<NativeImages />} />
          <Route path="*" element={<Page404 />} />  */}
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;
