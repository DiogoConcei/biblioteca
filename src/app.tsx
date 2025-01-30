import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/layout/Layout";
import Home from "./pages/home/Home";
import Page404 from "./pages/page404/page404";
import SeriePage from "./pages/comics/comicPage/ComicPage";
import ComicVisualizer from "./pages/comics/comicVisualizer/ComicVisualizer";
import LocalUpload from "./pages/localUpload/localUpload";
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
            <Route path="/:book_name/:book_id" element={<SeriePage />} />
            <Route
              path="/:book_name/:book_id/:chapter_name/:chapter_id/:page"
              element={<ComicVisualizer />}
            />
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
