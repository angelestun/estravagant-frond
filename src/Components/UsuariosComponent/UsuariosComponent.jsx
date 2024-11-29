import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UsuariosComponent.css';
import PropTypes from 'prop-types';
import { useConnectivity } from '../../context/ConnectivityProvider';

const UsuariosComponent = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [selectedUsuario, setSelectedUsuario] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const { isOnline, showNotification } = useConnectivity();

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const fetchUsuarios = async () => {
        if (!isOnline) {
            const cachedUsuarios = localStorage.getItem('cachedUsuarios');
            if (cachedUsuarios) {
                setUsuarios(JSON.parse(cachedUsuarios));
                showNotification(
                    'Modo Offline',
                    'Mostrando usuarios guardados localmente',
                    'info'
                );
                return;
            }
            showNotification(
                'Sin Conexión',
                'No hay usuarios guardados para mostrar offline',
                'warning'
            );
            return;
        }

        try {
            const response = await axios.get('https://extravagant-back-tidu.vercel.app/usuarios');
            setUsuarios(response.data);
            localStorage.setItem('cachedUsuarios', JSON.stringify(response.data));
        } catch (error) {
            console.error("Error fetching usuarios: ", error);
            const cachedUsuarios = localStorage.getItem('cachedUsuarios');
            if (cachedUsuarios) {
                setUsuarios(JSON.parse(cachedUsuarios));
            }
        }
    };

    const handleEditUsuario = (usuario) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para editar usuarios',
                'warning'
            );
            return;
        }
        setSelectedUsuario(usuario);
        setModalVisible(true);
    };

    const handleDeleteUsuario = async (id) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para eliminar usuarios',
                'warning'
            );
            return;
        }

        if (window.confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
            try {
                await axios.delete(`https://extravagant-back-tidu.vercel.app/usuarios/${id}`);
                fetchUsuarios();
                showNotification(
                    'Éxito',
                    'Usuario eliminado correctamente',
                    'success'
                );
            } catch (error) {
                console.error("Error deleting usuario: ", error);
                showNotification(
                    'Error',
                    'No se pudo eliminar el usuario',
                    'error'
                );
            }
        }
    };

    const handleSubmit = async (usuario) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para guardar cambios',
                'warning'
            );
            return;
        }

        try {
            if (selectedUsuario) {
                await axios.put(`https://extravagant-back-tidu.vercel.app/usuarios/${selectedUsuario.ID_Usuario}`, usuario);
                showNotification(
                    'Éxito',
                    'Usuario actualizado correctamente',
                    'success'
                );
            } else {
                await axios.post('https://extravagant-back-tidu.vercel.app/usuarios', usuario);
                showNotification(
                    'Éxito',
                    'Usuario creado correctamente',
                    'success'
                );
            }
            setModalVisible(false);
            fetchUsuarios();
        } catch (error) {
            console.error("Error saving usuario: ", error);
            showNotification(
                'Error',
                'No se pudieron guardar los cambios',
                'error'
            );
        }
    };

    useEffect(() => {
        fetchUsuarios();

        const intervalId = setInterval(() => {
            if (isOnline) {
                fetchUsuarios();
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, [isOnline]);

    const getRolNombre = (id) => {
        switch (id) {
            case 1: return 'Usuario';
            case 2: return 'Vendedor';
            case 3: return 'Admin';
            default: return 'Desconocido';
        }
    };

    return (
        <div className="usuarios-container">
            <h1>Usuarios</h1>

            <div className="overflow-x-auto w-full">
                <table className="usuarios-table table-auto w-full text-sm min-w-max">
                    <thead>
                        <tr className="border-b">
                            <th className="p-2 text-left">ID</th>
                            <th className="p-2 text-left">Nombre</th>
                            <th className="p-2 text-left">Apellido</th>
                            <th className="p-2 text-left">Correo</th>
                            <th className="p-2 text-left">Rol</th>
                            <th className="p-2 text-left">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map(usuario => (
                            <tr key={usuario.ID_Usuario} className="border-b">
                                <td className="p-2">{usuario.ID_Usuario}</td>
                                <td className="p-2 truncate">{usuario.Nombre}</td>
                                <td className="p-2 truncate">{usuario.Apellido}</td>
                                <td className="p-2 truncate">{usuario.Correo}</td>
                                <td className="p-2">{getRolNombre(usuario.ID_Rol)}</td>
                                <td className="p-2">
                                    <button className="edit-button-usuario" onClick={() => handleEditUsuario(usuario)}>Editar</button>
                                    <button className="delete-button-usuario" onClick={() => handleDeleteUsuario(usuario.ID_Usuario)}>Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {modalVisible && (
                <UsuarioModal 
                    usuario={selectedUsuario}
                    onClose={() => setModalVisible(false)}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
};

const UsuarioModal = ({ usuario, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        Nombre: usuario ? usuario.Nombre : '',
        Apellido: usuario ? usuario.Apellido : '',
        Correo: usuario ? usuario.Correo : '',
        Contraseña: usuario ? usuario.Contraseña : '',
        Rol: usuario ? usuario.ID_Rol : ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="modal-usuario fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="modal-content3 bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl mb-4">{usuario ? 'Editar Usuario' : 'Agregar Usuario'}</h2>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label htmlFor="Nombre" className="block">Nombre:</label>
                            <input type="text" id="Nombre" name="Nombre" value={formData.Nombre} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="Apellido" className="block">Apellido:</label>
                            <input type="text" id="Apellido" name="Apellido" value={formData.Apellido} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="Correo" className="block">Correo:</label>
                            <input type="email" id="Correo" name="Correo" value={formData.Correo} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="Contraseña" className="block">Contraseña:</label>
                            <input type="password" id="Contraseña" name="Contraseña" value={formData.Contraseña} onChange={handleChange} className="w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="Rol" className="block">Rol:</label>
                            <select id="Rol" name="Rol" value={formData.Rol} onChange={handleChange} className="w-full p-2 border rounded-md">
                                <option value="1">Usuario</option>
                                <option value="2">Vendedor</option>
                                <option value="3">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="modal-buttons-user mt-4 flex justify-between">
                        <button className="save-button-user-custom bg-blue-500 text-white p-2 rounded-md" type="submit">Guardar</button>
                        <button className="cancel-button-user-custom bg-gray-300 p-2 rounded-md" type="button" onClick={onClose}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

UsuarioModal.propTypes = {
    usuario: PropTypes.shape({
        Nombre: PropTypes.string,
        Apellido: PropTypes.string,
        Correo: PropTypes.string,
        Contraseña: PropTypes.string,
        ID_Rol: PropTypes.number
    }),
    onClose: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
};

export default UsuariosComponent;
