import { Outlet } from 'react-router-dom';
import Nav from '../../components/Nav/Nav';
import './Layout.scss';

const Layout = () => {
  return (
    <article className="Content">
      <Nav />
      <section className={`OutletContainer`}>
        <Outlet />
      </section>
    </article>
  );
};

export default Layout;
