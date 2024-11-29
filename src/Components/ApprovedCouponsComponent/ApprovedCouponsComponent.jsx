import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ApprovedCouponsComponent.css';
import { useConnectivity } from '../../context/ConnectivityProvider';


const ApprovedCouponsComponent = () => {
    const [cuponesAprobados, setCuponesAprobados] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [tiendas, setTiendas] = useState([]);
    const { isOnline, showNotification } = useConnectivity();


    useEffect(() => {
        fetchTiendas();
        fetchCuponesAprobados();
    }, []);

    const fetchTiendas = async () => {
        if (!isOnline) {
            const cachedTiendas = localStorage.getItem('cachedTiendas');
            if (cachedTiendas) {
                setTiendas(JSON.parse(cachedTiendas));
                return;
            }
            return;
        }
        try {
            const response = await axios.get('https://localhost:3000/tienda');
            setTiendas(response.data);
        } catch (error) {
            console.error("Error al obtener tiendas: ", error);
        }
    };

    const fetchCuponesAprobados = async () => {
        if (!isOnline) {
            const cachedCupones = localStorage.getItem('cachedCuponesAprobados');
            if (cachedCupones) {
                setCuponesAprobados(JSON.parse(cachedCupones));
                showNotification(
                    'Modo Offline',
                    'Mostrando cupones guardados localmente',
                    'info'
                );
                return;
            }
            showNotification(
                'Sin Conexión',
                'No hay cupones guardados para mostrar offline',
                'warning'
            );
            return;
        }
        try {
            const response = await axios.get('https://localhost:3000/cupones/aprobados');
            setCuponesAprobados(response.data);
        } catch (error) {
            console.error("Error al obtener cupones aprobados: ", error);
        }
    };

    const eliminarCupon = async (id) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para eliminar cupones',
                'warning'
            );
            return;
        }

        try {
            await axios.delete(`https://localhost:3000/cupones/${id}`);
            setCuponesAprobados(cuponesAprobados.filter(cupon => cupon.ID_Cupones !== id));
            alert("Cupón eliminado con éxito");
        } catch (error) {
            console.error("Error al eliminar el cupón: ", error);
            alert("Ocurrió un error al eliminar el cupón");
        }
    };

    useEffect(() => {
        fetchTiendas();
        fetchCuponesAprobados();
    }, []);
    
    const filteredCupones = cuponesAprobados.filter(cupon => 
        cupon.ID_Cupones.toString().includes(searchTerm) || 
        cupon.Descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getNombreTienda = (id) => {
        const tienda = tiendas.find(t => t.ID_Tienda === id);
        return tienda ? tienda.NombreTienda : 'Desconocido';
    };

    const getEstado = (cupon) => {
        const now = new Date();
        if (cupon.Activo === 1 && now >= new Date(cupon.Fecha_Inicio) && now <= new Date(cupon.Fecha_Fin)) {
            return 'activo'; 
        } else if (cupon.Activo === 0 && now < new Date(cupon.Fecha_Inicio)) {
            return 'inactivo';
        } else if (cupon.Activo === 0 || now > new Date(cupon.Fecha_Fin)) {
            return 'expirado'; 
        } 
        return '';
    };

    return (
        <div className="seller-profile-form">
            <div className="title-container">
                <h1>Cupones Aprobados</h1>
            </div>
            <div className="search">
                <input 
                    type="text" 
                    placeholder="Buscar por Folio o descripción" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
            </div>
            <div className="grid">
                {filteredCupones.length > 0 ? (
                    filteredCupones.map((cupon) => (
                        <div 
                            key={cupon.ID_Cupones} 
                            className={`cupon ${getEstado(cupon)}`}
                        >
                            <h2>ID Cupón: {cupon.ID_Cupones} (Tienda: {cupon.ID_Tienda})</h2>
                            <p className="store-name-admin"> {getNombreTienda(cupon.ID_Tienda)}</p>
                            <p><strong>Código:</strong> {cupon.Codigo}</p>
                            <p><strong>Descripción:</strong> {cupon.Descripcion}</p>
                            <p><strong>Descuento:</strong> {cupon.Descuento}%</p>
                            <p><strong>Fecha de Inicio:</strong> {new Date(cupon.Fecha_Inicio).toLocaleDateString()}</p>
                            <p><strong>Fecha de Fin:</strong> {new Date(cupon.Fecha_Fin).toLocaleDateString()}</p>
                            <p><strong>Fecha de Aprobación:</strong> {new Date(cupon.Fecha_Aprobacion).toLocaleDateString()}</p>
                            <p className="status">Estado: {getEstado(cupon) === 'activo' ? 'Activo' : getEstado(cupon) === 'inactivo' ? 'Inactivo' : 'Expirado'}</p>
                            <button 
                                className="delete-button" 
                                onClick={() => eliminarCupon(cupon.ID_Cupones)}
                                style={{ backgroundColor: 'red', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer' }}
                            >
                                Eliminar
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No se encontraron cupones aprobados.</p>
                )}
            </div>
        </div>
    );
};

export default ApprovedCouponsComponent;


