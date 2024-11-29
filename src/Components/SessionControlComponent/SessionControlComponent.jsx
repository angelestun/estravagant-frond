import React from 'react';
import { useNavigate } from 'react-router-dom';

function SessionControlComponent({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login'); 
  };

  return (
    <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
  );
}

export default SessionControlComponent;
