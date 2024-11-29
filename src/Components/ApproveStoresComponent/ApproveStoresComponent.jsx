//Vista donde se muestran las tiendas para ser aprobadas por el admin
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ApproveStoresComponent.css';
import { useConnectivity } from '../../context/ConnectivityProvider';


const ApproveStoresComponent = () => {
  const [tiendasPendientes, setTiendasPendientes] = useState([]);
  const [message, setMessage] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const { isOnline, showNotification } = useConnectivity();


  useEffect(() => {
    fetchTiendasPendientes();
    fetchUsuarios(); 
  }, []);
  

  const fetchTiendasPendientes = async () => {
    if (!isOnline) {
      const cachedTiendas = localStorage.getItem('cachedTiendasPendientes');
      if (cachedTiendas) {
        setTiendasPendientes(JSON.parse(cachedTiendas));
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
      const response = await axios.get('http://localhost:3000/tiendas/pendientes');
      setTiendasPendientes(response.data);
      localStorage.setItem('cachedTiendasPendientes', JSON.stringify(response.data));
    } catch (error) {
      console.error("Error al obtener tiendas pendientes: ", error);
      setMessage("Error al cargar tiendas.");
      const cachedTiendas = localStorage.getItem('cachedTiendasPendientes');
      if (cachedTiendas) {
        setTiendasPendientes(JSON.parse(cachedTiendas));
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

   const handleApprove = async (id) => {
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para aprobar tiendas',
        'warning'
      );
      return;
    }

    try {
      await axios.put(`http://localhost:3000/tienda/aprobar/${id}`);
      setMessage("Tienda aprobada con éxito.");
      fetchTiendasPendientes();
    } catch (error) {
      console.error("Error al aprobar tienda: ", error);
      setMessage("Error al aprobar tienda.");
    }
  };


  const handleReject = async (id) => {
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para rechazar tiendas',
        'warning'
      );
      return;
    }

    try {
      await axios.put(`http://localhost:3000/tienda/rechazar/${id}`);
      setMessage("Tienda rechazada con éxito.");
      fetchTiendasPendientes();
    } catch (error) {
      console.error("Error al rechazar tienda: ", error);
      setMessage("Error al rechazar tienda.");
    }
  };

  useEffect(() => {
    fetchTiendasPendientes();
    fetchUsuarios();

    const intervalId = setInterval(() => {
      if (isOnline) {
        fetchTiendasPendientes();
        fetchUsuarios();
      }
    }, 30000);

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

  return (
    <div className="approve-stores-container">
      <div className="title-container">
        <h1>Tiendas Pendientes de Aprobación</h1>
      </div>
      {message && <p className="message">{message}</p>}
      <div className="tiendas-list">
        {tiendasPendientes.map((tienda) => (
          <div className="tienda-card" key={tienda.ID_Tienda}>
            <div className="tienda-details">
              <h2 className="store-name-admin">{tienda.NombreTienda}</h2>
              <p>{tienda.Descripcion}</p>
              <p><strong>Vendedor:</strong> {getUsuarioNombre(tienda.ID_Usuario)} {getUsuarioApellido(tienda.ID_Usuario)}</p>
              <p><strong>Folio Tienda:</strong> {tienda.ID_Tienda}</p>
              <p><strong>Folio Usuario:</strong> {tienda.ID_Usuario}</p>
              <p><strong>Fecha de Creación:</strong> {new Date(tienda.creacion).toLocaleDateString()}</p>
              {tienda.logo && (
                <img
                  src={`http://localhost:3000/uploads/${tienda.logo}`}
                  alt={`Logo de ${tienda.NombreTienda}`}
                  className="tienda-logo"
                />
              )}
            </div>
            <div className="tienda-actions">
              <button onClick={() => handleApprove(tienda.ID_Tienda)} className="approve-button">Aprobar</button>
              <button onClick={() => handleReject(tienda.ID_Tienda)} className="reject-button">Rechazar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApproveStoresComponent;
