import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import GlobalDashboard from './pages/GlobalDashboard';
import SleepSummary from './pages/SleepSummary';
import RunningSummary from './pages/RunningSummary';
import HealthSummary from './pages/HealthSummary';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<GlobalDashboard />} />
        <Route path="/sleep" element={<SleepSummary />} />
        <Route path="/running" element={<RunningSummary />} />
        <Route path="/health" element={<HealthSummary />} />
      </Routes>
    </div>
  );
}

export default App;
