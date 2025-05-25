import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Home, HeartPulse, BedDouble, Footprints } from 'lucide-react';
import { NavLink } from 'react-router-dom';

function Dashboard() {
  const pathRef = useRef();
  const [runPath, setRunPath] = useState([]);
  const [lastRunData, setLastRunData] = useState(null);
  const [lastSleep, setLastSleep] = useState(null);
  const [sleepDayIdx, setSleepDayIdx] = useState(0); // 0 = most recent

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/last-run-records')
      .then(res => res.json())
      .then(data => {
        const cleaned = data.filter(d => d.lat && d.long).map(d => ({
          lat: d.lat * (180 / Math.pow(2, 31)),
          long: d.long * (180 / Math.pow(2, 31))
        }));
        setRunPath(cleaned);
      });
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/last-run-data')
      .then(res => res.json())
      .then(data => setLastRunData(data));
  }, []);

  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/last-week-sleep')
      .then(res => res.json())
      .then(data => setLastSleep(data));
  }, []);

  useEffect(() => {
    if (runPath.length === 0) return;

    const svg = d3.select(pathRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 400;
    const margin = 10;

    const lats = runPath.map(d => d.lat);
    const longs = runPath.map(d => d.long);

    const x = d3.scaleLinear().domain(d3.extent(longs)).range([margin, width - margin]);
    const y = d3.scaleLinear().domain(d3.extent(lats)).range([height - margin, margin]);

    const line = d3.line().x(d => x(d.long)).y(d => y(d.lat));

    svg.attr('width', width).attr('height', height);

    svg.append('path')
      .datum(runPath)
      .attr('fill', 'none')
      .attr('stroke', '#3b82f6')
      .attr('stroke-width', 2)
      .attr('d', line);
  }, [runPath]);

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

      {/* Main Content */}
      <main style={{ flexGrow: 1, padding: '30px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Welcome back Alexis !</h1>
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* Left Column: Last Running Activity */}
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              width: '500px',
              height: '550px',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0
            }}
          >
            <h3 style={{ marginBottom: '20px' }}>Last running activity:</h3>
            {lastRunData && (
              <div style={{ marginBottom: '18px', fontSize: '16px', color: '#222' }}>
                <div>
                  <strong>Date:</strong> {new Date(lastRunData.start_time).toLocaleDateString()}
                </div>
                <div>
                  <strong>Distance:</strong> {lastRunData.distance.toFixed(2)} km
                </div>
                <div>
                  <strong>Avg pace:</strong> {
                    (() => {
                      const pace = lastRunData.avg_speed > 0 ? 60 / lastRunData.avg_speed : 0;
                      const min = Math.floor(pace);
                      const sec = Math.round((pace - min) * 60);
                      return `${min}:${sec.toString().padStart(2, '0')} min/km`;
                    })()
                  }
                </div>
                <div>
                  <strong>Duration:</strong> {
                    (() => {
                      const start = new Date(lastRunData.start_time);
                      const stop = new Date(lastRunData.stop_time);
                      const diff = Math.floor((stop - start) / 1000);
                      const h = Math.floor(diff / 3600);
                      const m = Math.floor((diff % 3600) / 60);
                      const s = diff % 60;
                      return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    })()
                  }
                </div>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
              <svg ref={pathRef}></svg>
            </div>
          </div>
          {/* Right Column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top Row: Sleep and Steps */}
            <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
              {/* Sleep Box */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  flex: 1,
                  minWidth: 0,
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <h3 style={{ marginBottom: '12px' }}>Sleep</h3>
                {lastSleep && lastSleep.length > 0 && (
                  <>
                    {/* Demi-circle visualization */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
                      <svg width={220} height={150}>
                        <path
                          d="M30,100 A80,80 0 0,1 190,100"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="6"
                        />
                        {/* Duration in center */}
                        <text
                          x="110"
                          y="75"
                          textAnchor="middle"
                          fontSize="20"
                          fill="#222"
                          fontWeight="bold"
                        >
                          {lastSleep[sleepDayIdx].total_sleep.slice(0, 5)}
                        </text>
                        {/* Start time under left */}
                        <text
                          x="30"
                          y="115"
                          textAnchor="middle"
                          fontSize="14"
                          fill="#444"
                        >
                          {new Date(lastSleep[sleepDayIdx].start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </text>
                        {/* End time under right */}
                        <text
                          x="190"
                          y="115"
                          textAnchor="middle"
                          fontSize="14"
                          fill="#444"
                        >
                          {new Date(lastSleep[sleepDayIdx].end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </text>
                      </svg>
                    </div>
                    <div style={{ fontSize: '16px', color: '#222', textAlign: 'center' }}>
                      <strong>Date:</strong> {new Date(lastSleep[sleepDayIdx].start).toLocaleDateString()}
                    </div>
                  </>
                )}
                {(!lastSleep || lastSleep.length === 0) && (
                  <div style={{ fontSize: '16px', color: '#888' }}>No sleep data available.</div>
                )}
              </div>
              {/* Steps Box */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: '12px',
                  padding: '20px',
                  flex: 1,
                  minWidth: 0,
                  minHeight: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <h3 style={{ marginBottom: '12px' }}>Steps</h3>
                <div style={{ fontSize: '16px', color: '#222' }}>
                  <svg width={220} height={150}></svg>
                  <strong>Today:</strong> 10,000 steps
                </div>
                <div style={{ fontSize: '16px', color: '#222' }}>
                  <strong>Goal:</strong> 12,000 steps
                </div>
              </div>
            </div>
            {/* Bottom Row: Last Week Summary */}
            <div
              style={{
                background: '#fff',
                borderRadius: '12px',
                padding: '20px',
                minHeight: '200px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
              }}
            >
              <h3 style={{ marginBottom: '12px' }}>Last Week Summary</h3>
              <div style={{ fontSize: '16px', color: '#222' }}>
                <strong>Distance:</strong> 42.5 km
              </div>
              <div style={{ fontSize: '16px', color: '#222' }}>
                <strong>Steps:</strong> 68,000
              </div>
              <div style={{ fontSize: '16px', color: '#222' }}>
                <strong>Sleep Avg:</strong> 7h 20min
              </div>
              <div style={{ fontSize: '16px', color: '#222' }}>
                <strong>Calories Burned:</strong> 3,800 kcal
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;