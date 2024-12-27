import { Outlet } from "react-router-dom";
import Nav from "../../components/Nav/Nav";
import "./Layout.css";

const Layout = () => {
  return (
    <article>
      <Nav />
      <section className="Content">
        <Outlet />
      </section>
    </article>
  );
};

export default Layout;
