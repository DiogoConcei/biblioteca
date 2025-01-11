import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Nav from "../../components/Nav/Nav";
import "./Layout.css";

const Layout = () => {
  const [isHidden, setIsHidden] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const isVisualizerAcitve = /^\/[^/]+\/[^/]+\/[^/]+\/[^/]+$/.test(
      location.pathname
    );

    if (isVisualizerAcitve) setIsHidden(true);
  }, [location]);

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
