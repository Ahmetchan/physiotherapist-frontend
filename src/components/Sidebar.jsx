import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaCalendarAlt, FaUserMd, FaUserShield, FaBars } from 'react-icons/fa';

const Sidebar = ({ siteTitle }) => {
  const [open, setOpen] = useState(false);

  const handleHamburger = () => setOpen(!open);
  const closeSidebar = () => setOpen(false);

  return (
    <>
      <button className="hamburger" onClick={handleHamburger}>
        <FaBars />
      </button>
      <nav className={`sidebar${open ? ' open' : ''}`} onClick={closeSidebar}>
        <div className="sidebar-header text-center" style={{ marginBottom: 8 }}>
          <FaUserMd style={{ fontSize: 38, color: '#fff', marginBottom: 4 }} />
          <div style={{ fontWeight: 800, fontSize: 28 }}>
            {siteTitle || 'Fizyoterapist'}
          </div>
        </div>
        <div className="sidebar-menu">
          <NavLink to="/" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')} onClick={closeSidebar}>
            <FaHome /> Ana Sayfa
          </NavLink>
          <NavLink to="/randevu" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')} onClick={closeSidebar}>
            <FaCalendarAlt /> Randevu Al
          </NavLink>
          <NavLink to="/hakkimda" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')} onClick={closeSidebar}>
            <FaUserMd /> Hakkımda
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')} onClick={closeSidebar}>
            <FaUserShield /> Admin
          </NavLink>
        </div>
        <div style={{ 
          position: 'absolute', 
          bottom: 20, 
          left: 0, 
          right: 0, 
          textAlign: 'center', 
          fontSize: '12px', 
          color: 'rgba(255,255,255,0.7)',
          padding: '0 10px'
        }}>
          Randevu Sistemi<br />
          Ahmet Can KAPLAN tarafından geliştirilmiştir.
        </div>
      </nav>
    </>
  );
};

export default Sidebar; 