import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';

function Layout() {
  return (
    <div className="h-full flex flex-col">
      <Navigation />
      <div className="flex-1 font-['noto']">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;

