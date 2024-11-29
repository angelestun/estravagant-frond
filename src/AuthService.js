class AuthService {
    logout() {
        localStorage.removeItem('token');
    }

    // Otros métodos de autenticación como login, register, etc.
}

export default new AuthService();
