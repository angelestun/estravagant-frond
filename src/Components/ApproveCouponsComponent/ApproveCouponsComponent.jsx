import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useConnectivity } from '../../context/ConnectivityProvider';
import './ApproveCouponsComponent.css';

const ApproveCouponsComponent = () => {
    const [cuponesPendientes, setCuponesPendientes] = useState([]);
    const [message, setMessage] = useState('');
    const [rejectModal, setRejectModal] = useState({ open: false, id: null, motivo: '' });
    const [tiendas, setTiendas] = useState([]); 
    const { isOnline, showNotification } = useConnectivity();

    useEffect(() => {
        fetchTiendas(); 
        fetchCuponesPendientes();
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
            const response = await axios.get('http://localhost:3000/tienda');
            setTiendas(response.data);
            localStorage.setItem('cachedTiendas', JSON.stringify(response.data));
        } catch (error) {
            console.error("Error al obtener tiendas: ", error);
            const cachedTiendas = localStorage.getItem('cachedTiendas');
            if (cachedTiendas) {
                setTiendas(JSON.parse(cachedTiendas));
            }
        }
    };

    const fetchCuponesPendientes = async () => {
        if (!isOnline) {
            const cachedCupones = localStorage.getItem('cachedCuponesPendientes');
            if (cachedCupones) {
                setCuponesPendientes(JSON.parse(cachedCupones));
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
            const response = await axios.get('http://localhost:3000/cupones/pendientes');
            setCuponesPendientes(response.data);
            localStorage.setItem('cachedCuponesPendientes', JSON.stringify(response.data));
        } catch (error) {
            console.error("Error al obtener cupones pendientes: ", error);
            setMessage("Error al cargar cupones.");
            
            const cachedCupones = localStorage.getItem('cachedCuponesPendientes');
            if (cachedCupones) {
                setCuponesPendientes(JSON.parse(cachedCupones));
            }
        }
    };


    const handleApprove = async (id) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para aprobar cupones',
                'warning'
            );
            return;
        }

        try {
            await axios.put(`http://localhost:3000/cupones/aprobar/${id}`);
            setMessage("Cupón aprobado con éxito.");
            fetchCuponesPendientes();
        } catch (error) {
            console.error("Error al aprobar cupón: ", error);
            setMessage("Error al aprobar cupón.");
        }
    };

     const handleReject = async () => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para rechazar cupones',
                'warning'
            );
            return;
        }

        const { id, motivo } = rejectModal;
        if (!motivo) {
            alert("Por favor, ingrese un motivo para el rechazo.");
            return;
        }

        try {
            await axios.put(`http://localhost:3000/cupones/rechazar/${id}`, { Motivo_Rechazo: motivo });
            setMessage("Cupón rechazado con éxito.");
            fetchCuponesPendientes();
        } catch (error) {
            console.error("Error al rechazar cupón: ", error);
            setMessage("Error al rechazar cupón.");
        } finally {
            setRejectModal({ open: false, id: null, motivo: '' });
        }
    };


    const getNombreTienda = (id) => {
        const tienda = tiendas.find(t => t.ID_Tienda === id);
        return tienda ? tienda.NombreTienda : 'Desconocido';
    };

    return (
        <div className="seller-profile-form">
            <div className="title-container">
                <h1>Cupones Pendientes de Aprobación</h1>
            </div>
            {message && <p className="message">{message}</p>}
            <div className="grid">
                {cuponesPendientes.length > 0 ? (
                    cuponesPendientes.map((cupon) => (
                        <div key={cupon.ID_Cupones} className="cupon">
                            <h2>Folio Cupón: {cupon.ID_Cupones} (Tienda: {cupon.ID_Tienda})</h2>
                            <p className="store-name-admin"> {getNombreTienda(cupon.ID_Tienda)}</p>
                            <p><strong>Descripción:</strong> {cupon.Descripcion}</p>
                            <p><strong>Código:</strong> {cupon.Codigo}</p>
                            <p><strong>Fecha de Inicio:</strong> {new Date(cupon.Fecha_Inicio).toLocaleDateString()}</p>
                            <p><strong>Fecha de Fin:</strong> {new Date(cupon.Fecha_Fin).toLocaleDateString()}</p>
                            <p><strong>Descuento:</strong> {cupon.Descuento}%</p>
                            <div className="cupon-actions">
                                <button onClick={() => handleApprove(cupon.ID_Cupones)} className="approve-btn">Aprobar</button>
                                <button onClick={() => setRejectModal({ open: true, id: cupon.ID_Cupones, motivo: '' })} className="reject-btn">Rechazar</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No se encontraron cupones pendientes.</p>
                )}
            </div>

            {rejectModal.open && (
                <div className="overlay">
                    <div className="custom-modal">
                        <h2>Motivo de Rechazo</h2>
                        <textarea
                            value={rejectModal.motivo}
                            onChange={(e) => setRejectModal({ ...rejectModal, motivo: e.target.value })}
                            rows={4}
                        />
                        <div className="modal-actions">
                            <button onClick={handleReject} className="confirm-btn">Confirmar</button>
                            <button onClick={() => setRejectModal({ open: false, id: null, motivo: '' })} className="cancel-btn">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ApproveCouponsComponent;
