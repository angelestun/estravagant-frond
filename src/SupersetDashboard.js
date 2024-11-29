import React from 'react';

const SupersetDashboard = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <iframe
        src="http://localhost:8088/superset/dashboard/TU_DASHBOARD_ID/"
        width="100%"
        height="100%"
        frameBorder="0"
        title="Superset Dashboard"
      />
    </div>
  );
};

export default SupersetDashboard;
