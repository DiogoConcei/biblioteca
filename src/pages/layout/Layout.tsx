import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Nav from "../../components/Nav/Nav";
import { useGlobal } from "../../GlobalContext";
import "./Layout.css";

const Layout = () => {
  const { isHidden, setIsHidden } = useGlobal();
  const location = useLocation();

  useEffect(() => {
    const setFullScreen = async () => {
      const isVisualizerActive =
        await window.electron.AppConfig.getScreenConfig(location.pathname);
      setIsHidden(isVisualizerActive);
    };

    setFullScreen();
  }, [location, setIsHidden]);

  return (
    <article className="Content">
      <Nav isHidden={isHidden} />
      <section className={`OutletContainer ${isHidden ? "fullContainer" : ""}`}>
        <Outlet />
      </section>
    </article>
  );
};

export default Layout;
