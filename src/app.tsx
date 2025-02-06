import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/layout/Layout";
import Home from "./pages/home/Home";
import Page404 from "./pages/page404/page404";
import LocalUpload from "./pages/upload/localUpload/localUpload";
import MangaPage from "./pages/mangas/mangaPage/MangaPage";
7;
import MangaVisualizer from "./pages/mangas/mangaVisualizer/MangaVisualizer";
import { GlobalProvider } from "./GlobalContext";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const App = () => {
  return (
    <GlobalProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index path="" element={<Home />} />
            <Route
              path="/Manga/:manga_name/:manga_id"
              element={<MangaPage />}
            />
            {/* Comic Page */}
            {/* Book Page */}
            <Route
              path="/:manga_name/:manga_id/:chapter_name/:chapter_id/:page"
              element={<MangaVisualizer />}
            />
            {/* Comic Visualizer */}
            {/* Book Visualizer */}
            <Route path="/local-upload/serie" element={<LocalUpload />} />
            <Route path="*" element={<Page404 />} />
          </Route>
        </Routes>
      </HashRouter>
    </GlobalProvider>
  );
};

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
