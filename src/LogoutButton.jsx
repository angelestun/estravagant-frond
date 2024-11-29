import React from 'react';
import { useHistory } from 'react-router-dom';
import AuthService from './AuthService';

const LogoutButton = () => {
    const history = useHistory();

    const handleLogout = () => {
        AuthService.logout();
        history.push('/login'); // Redirige al usuario a la página de inicio de sesión
    };

    return (
        <button onClick={handleLogout}>
            Cerrar Sesión
        </button>
    );
};

export default LogoutButton;
