import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass, Users, Layers, ChevronRight, LogOut, User, Book, Newspaper, Heart, School } from 'lucide-react';

const Layout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const sections = [
    {
      title: null,
      items: [
        { name: 'Dashboard', icon: Layers, path: '/admin/mappings/view' },
      ]
    },
    {
      title: 'Assets',
      items: [
        { name: 'Courses', icon: Book, path: '/admin/assets/courses' },
        { name: 'Workshops', icon: Users, path: '/admin/assets/workshops' },
        { name: 'Current Affairs', icon: Newspaper, path: '/admin/assets/current-affairs' },
        { name: 'Motivation', icon: Heart, path: '/admin/assets/motivation' },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { name: 'Mapping', icon: Compass, path: '/admin/mappings/create' },
        { name: 'User Groups', icon: Users, path: '/admin/config/groups' },
        { name: 'Users', icon: User, path: '/admin/config/users' },
        { name: 'Schools', icon: School, path: '/admin/config/schools' },
      ]
    }
  ];

  return (
    <div className="layout-container">
      <aside className="sidebar glass">
        <div className="logo">
          <div className="logo-icon">LM</div>
          <span className="logo-text">LifeMonk Admin</span>
        </div>

        <nav className="nav-menu">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="nav-section">
              {section.title && <h3 className="nav-section-title">{section.title}</h3>}
              <div className="nav-section-items">
                {section.items.map((item) => (
                  <button
                    key={item.path}
                    className={`nav-item ${location.pathname.startsWith(item.path) ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                    {location.pathname.startsWith(item.path) && <div className="active-indicator" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">
              <User size={18} />
            </div>
            <div className="user-info">
              <span className="user-name">Admin User</span>
              <span className="user-role">Super Admin</span>
            </div>
          </div>
          <button className="logout-btn">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-inner animate-fade-in">
          {children}
        </div>
      </main>

      <style dangerouslySetInnerHTML={{
        __html: `
        .layout-container {
          display: flex;
          min-height: 100vh;
          background-color: var(--bg-main);
        }

        .sidebar {
          width: 280px;
          background: #1e293b;
          color: white;
          display: flex;
          flex-direction: column;
          padding: 24px;
          position: sticky;
          top: 0;
          height: 100vh;
          box-shadow: 4px 0 10px rgba(0,0,0,0.05);
          z-index: 10;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 48px;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          background: var(--primary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .logo-text {
          font-weight: 700;
          font-size: 20px;
          letter-spacing: -0.5px;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 24px;
          flex: 1;
        }

        .nav-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-section-title {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          padding: 0 16px;
          margin-bottom: 4px;
        }

        .nav-section-items {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          border-radius: var(--radius-md);
          background: transparent;
          color: #94a3b8;
          text-align: left;
          font-weight: 500;
          position: relative;
          transition: all 0.2s ease;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .nav-item.active {
          background: rgba(99, 102, 241, 0.15);
          color: white;
        }

        .active-indicator {
          position: absolute;
          left: 0;
          width: 4px;
          height: 20px;
          background: var(--primary);
          border-radius: 0 4px 4px 0;
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar {
          width: 32px;
          height: 32px;
          background: #334155;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .user-role {
          font-size: 12px;
          color: #94a3b8;
        }

        .logout-btn {
          background: transparent;
          color: #94a3b8;
          padding: 8px;
          border-radius: 8px;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .main-content {
          flex: 1;
          padding: 32px 48px;
          overflow-y: auto;
          height: 100vh;
        }

        .top-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .breadcrumb-parent {
          color: var(--text-muted);
          font-size: 14px;
        }

        .breadcrumb-sep {
          color: #cbd5e1;
        }

        .breadcrumb-current {
          color: var(--text-main);
          font-weight: 600;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .header-btn {
          padding: 10px 16px;
          border-radius: var(--radius-md);
          font-size: 14px;
          font-weight: 500;
        }

        .header-btn.primary {
          background: var(--primary);
          color: white;
        }

        .header-btn.primary:hover {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }

        .header-btn.secondary {
          background: white;
          color: var(--text-main);
          border: 1px solid var(--border-color);
        }

        .header-btn.secondary:hover {
          background: #f1f5f9;
        }

        .content-inner {
          max-width: 1200px;
          margin: 0 auto;
        }
      ` }} />
    </div>
  );
};

export default Layout;
