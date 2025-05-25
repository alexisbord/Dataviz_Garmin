import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, HeartPulse, BedDouble, Footprints } from 'lucide-react';

function SleepSummary() {
  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif', height: '100vh', background: '#f8f9fd' }}>
      {/* Sidebar */}
      <aside style={{ width: '60px', background: '#fff', padding: '10px 0', boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}>
        <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', marginTop: '20px' }}>
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
            <Home />
          </NavLink>
          <NavLink to="/health" className={({ isActive }) => isActive ? 'active' : ''}>
            <HeartPulse />
          </NavLink>
          <NavLink to="/running" className={({ isActive }) => isActive ? 'active' : ''}>
            <Footprints />
          </NavLink>
          <NavLink to="/sleep" className={({ isActive }) => isActive ? 'active' : ''}>
            <BedDouble />
          </NavLink>
        </nav>
      </aside>

      {/* Sleep content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h2>Sleep Summary</h2>
        {/* D3 visualizations for sleep data can go here */}
      </div>
    </div>
  );
}

export default SleepSummary;
