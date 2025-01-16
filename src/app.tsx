import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/layout/Layout";
import Home from "./pages/home/Home";
import Page404 from "./pages/page404/page404";
import SeriePage from "./pages/comics/SeriePage/SeriePage";
import { ComicVisualizer } from "./pages/comics/ComicVisualizer/ComicVisualizer";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index path="" element={<Home />} />
          <Route path="/:book_name/:book_id" element={<SeriePage />} />
          <Route
            path="/:book_name/:book_id/chapter/:chapter_id/:page"
            element={<ComicVisualizer />}
          />
          <Route path="*" element={<Page404 />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
