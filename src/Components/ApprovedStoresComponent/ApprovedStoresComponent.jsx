//Vista de las tiendas aprobadas
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ApprovedStoresComponent.css';
import { useConnectivity } from '../../context/ConnectivityProvider';


const ApprovedStoresComponent = () => {
    const [tiendasAprobadas, setTiendasAprobadas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [motivoBaja, setMotivoBaja] = useState('');
    const [tiendaBajaId, setTiendaBajaId] = useState(null);
    const [confirmarEliminarId, setConfirmarEliminarId] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const { isOnline, showNotification } = useConnectivity();


    useEffect(() => {
        fetchTiendasAprobadas();
        fetchUsuarios(); 
    }, []);

    
    const fetchTiendasAprobadas = async () => {
        if (!isOnline) {
            const cachedTiendas = localStorage.getItem('cachedTiendasAprobadas');
            if (cachedTiendas) {
                setTiendasAprobadas(JSON.parse(cachedTiendas));
                showNotification(
                    'Modo Offline',
                    'Mostrando tiendas guardadas localmente',
                    'info'
                );
                return;
            }
            showNotification(
                'Sin Conexión',
                'No hay tiendas guardadas para mostrar offline',
                'warning'
            );
            return;
        }

        try {
            const response = await axios.get('http://localhost:3000/tienda');
            const approvedStores = response.data.filter(tienda => tienda.activo === 1 || tienda.activo === 3);
            setTiendasAprobadas(approvedStores);
            localStorage.setItem('cachedTiendasAprobadas', JSON.stringify(approvedStores));
        } catch (error) {
            console.error("Error al obtener tiendas aprobadas: ", error);
            const cachedTiendas = localStorage.getItem('cachedTiendasAprobadas');
            if (cachedTiendas) {
                setTiendasAprobadas(JSON.parse(cachedTiendas));
            }
        }
    };


    const fetchUsuarios = async () => {
        try {
          const response = await axios.get('http://localhost:3000/usuarios'); 
          setUsuarios(response.data);
        } catch (error) {
          console.error("Error al obtener usuarios: ", error);
        }
      };

      const handleBaja = async (id) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para dar de baja una tienda',
                'warning'
            );
            return;
        }

        if (!motivoBaja) {
            alert("Por favor, proporciona un motivo para la baja.");
            return;
        }
        try {
            await axios.put(`http://localhost:3000/tienda/baja/${id}`, { motivo_baja: motivoBaja });
            setMotivoBaja('');
            setTiendaBajaId(null);
            fetchTiendasAprobadas();
        } catch (error) {
            showNotification(
                'Error',
                'No se pudo dar de baja la tienda',
                'error'
            );
        }
    };


    const handleActivar = async (id) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para activar una tienda',
                'warning'
            );
            return;
        }

        try {
            const response = await axios.put(`http://localhost:3000/tienda/activar/${id}`);
            showNotification(
                'Éxito',
                response.data.message,
                'success'
            );
            fetchTiendasAprobadas();
        } catch (error) {
            showNotification(
                'Error',
                'No se pudo activar la tienda',
                'error'
            );
        }
    };

    const handleEliminar = async (id) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para eliminar una tienda',
                'warning'
            );
            return;
        }

        try {
            await axios.delete(`http://localhost:3000/tienda/${id}`);
            setConfirmarEliminarId(null);
            fetchTiendasAprobadas();
            showNotification(
                'Éxito',
                'Tienda eliminada correctamente',
                'success'
            );
        } catch (error) {
            console.error("Error al eliminar tienda: ", error);
            showNotification(
                'Error',
                'No se pudo eliminar la tienda',
                'error'
            );
        }
    };

    useEffect(() => {
        fetchTiendasAprobadas();
        fetchUsuarios();

        const intervalId = setInterval(() => {
            if (isOnline) {
                fetchTiendasAprobadas();
                fetchUsuarios();
            }
        }, 60000);

        return () => clearInterval(intervalId);
    }, [isOnline]);

    const getUsuarioNombre = (id) => {
      const usuario = usuarios.find(user => user.ID_Usuario === id);
      return usuario ? usuario.Nombre : 'Desconocido';
    };

    const getUsuarioApellido = (id) => {
      const usuario = usuarios.find(user => user.ID_Usuario === id);
      return usuario ? usuario.Apellido : 'Desconocido';
    };

    const filteredStores = tiendasAprobadas.filter(tienda => 
        tienda.ID_Tienda.toString().includes(searchTerm) || 
        tienda.NombreTienda.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="seller-profile-form">
            <div className="title-container">
                <h1>Tiendas Aprobadas</h1>
            </div>
            <div className="search">
                <input 
                    type="text" 
                    placeholder="Buscar por Folio o nombre" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            <div className="grid">
                {filteredStores.map((tienda) => (
                    <div key={tienda.ID_Tienda} className="store">
                        <img src={`http://localhost:3000/uploads/${tienda.logo}`} alt={`Logo de ${tienda.NombreTienda}`} className="tienda-logo" />
                        <h2 className="store-name-admin">{tienda.NombreTienda}</h2>
                        <p>{tienda.Descripcion}</p>
                        <p><strong>Vendedor:</strong> {getUsuarioNombre(tienda.ID_Usuario)} {getUsuarioApellido(tienda.ID_Usuario)}</p>
                        <p><strong>Folio Tienda:</strong> {tienda.ID_Tienda}</p>
                        <p><strong>Folio Usuario:</strong> {tienda.ID_Usuario}</p>
                        <p><strong>Fecha de Creación:</strong> {new Date(tienda.creacion).toLocaleDateString()}</p>
                        {tienda.activo === 3 ? (
                            <>
                                <p className="status">Estado: Baja</p>
                                <p><strong>Motivo de Baja:</strong> {tienda.motivo_baja}</p>
                                <button className="button" onClick={() => handleActivar(tienda.ID_Tienda)}>Activar</button>
                                <button className="button" onClick={() => { setConfirmarEliminarId(tienda.ID_Tienda); }}>Eliminar</button>
                            </>
                        ) : (
                            <button className="button" onClick={() => { setTiendaBajaId(tienda.ID_Tienda); }}>Dar de Baja</button>
                        )}
                    </div>
                ))}
            </div>

            {tiendaBajaId !== null && (
                <>
                    <div className="approved-stores-modal-overlay" onClick={() => setTiendaBajaId(null)}></div>
                    <div className="approved-stores-modal-content-baja">
                        <h2>Motivo de Baja</h2>
                        <textarea 
                            value={motivoBaja}
                            onChange={(e) => setMotivoBaja(e.target.value)}
                            placeholder="Ingresa el motivo"
                        />
                        <div className="approved-stores-modal-buttons">
                            <button className="approved-stores-confirm-button-baja" onClick={() => handleBaja(tiendaBajaId)}>Confirmar</button>
                            <button className="approved-stores-cancel-button-baja" onClick={() => setTiendaBajaId(null)}>Cancelar</button>
                        </div>
                    </div>
                </>
            )}

            {confirmarEliminarId !== null && (
                <>
                    <div className="overlay-eliminar" onClick={() => setConfirmarEliminarId(null)}></div>
                    <div className="modal-content-eliminar">
                        <h2>Confirmar Eliminación</h2>
                        <p>¿Está seguro de que desea eliminar esta tienda?</p>
                        <div className="modal-buttons">
                            <button className="confirm-button-eliminar" onClick={() => handleEliminar(confirmarEliminarId)}>Eliminar</button>
                            <button className="cancel-button-eliminar" onClick={() => setConfirmarEliminarId(null)}>Cancelar</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ApprovedStoresComponent;
