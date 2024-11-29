import React, { useState, useEffect } from 'react';
import './OfferManager.css'; 
import axios from 'axios';
import { useConnectivity } from '../../context/ConnectivityProvider';

const OfferForm = ({ onSubmit, offer, closeModal, idTienda }) => {
    const [idProducto, setIdProducto] = useState(offer ? offer.ID_Producto : '');
    const [tipoOferta, setTipoOferta] = useState(offer ? offer.Tipo_Oferta : 'Descuento');
    const [descuento, setDescuento] = useState(offer ? offer.Descuento || '' : '');
    const [cantidadRequerida, setCantidadRequerida] = useState(offer ? offer.Cantidad_Requerida || '' : '');
    const [fechaInicio, setFechaInicio] = useState(offer ? offer.Fecha_Inicio.slice(0, 10) : '');
    const [fechaFin, setFechaFin] = useState(offer ? offer.Fecha_Fin.slice(0, 10) : '');
    const [productos, setProductos] = useState([]);
    const [currentDate, setCurrentDate] = useState(new Date().toISOString().slice(0, 10));
    const { isOnline, showNotification  } = useConnectivity();


    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/producto/tienda/${idTienda}`);
                setProductos(response.data);
            } catch (error) {
                console.error("Error al obtener productos: ", error);
            }
        };

        if (idTienda) {
            fetchProductos();
        }
    }, [idTienda]);

    useEffect(() => {
        if (tipoOferta === 'Descuento') {
            setCantidadRequerida('');
        } else {
            setDescuento('');
        }
    }, [tipoOferta]);

    
    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para crear o modificar ofertas',
                'warning'
            );
            return;
        }
    
        if (!idProducto || !fechaInicio || !fechaFin || !tipoOferta) {
            alert("Por favor, completa todos los campos obligatorios.");
            return;
        }
    
        if (tipoOferta === '2x1' && (!cantidadRequerida || cantidadRequerida < 2)) {
            alert("La 'Cantidad_Requerida' debe ser un número mayor o igual a 2 para el tipo de oferta '2x1'.");
            return;
        }
    
        const newOffer = {
            Descripcion: tipoOferta === 'Descuento' ? `Descuento del ${descuento}%` : '2x1',
            Fecha_Fin: fechaFin,
            Fecha_Inicio: fechaInicio,
            Activo: true,
            ID_Usuario: localStorage.getItem('userId'),
            ID_Tienda: idTienda,
            ID_Producto: idProducto,
            Tipo_Oferta: tipoOferta,
        };
        
        if (tipoOferta === 'Descuento') {
            newOffer.Descuento = descuento;
        } else if (tipoOferta === '2x1') {
            newOffer.Cantidad_Requerida = cantidadRequerida;
        }
        
    
        onSubmit(newOffer);
        closeModal();
    };
    
    return (
        <div className="offer-modal-overlay" onClick={closeModal}>
            <div className="offer-modal" onClick={(e) => e.stopPropagation()}>
                <h2>{offer ? 'Editar Oferta' : 'Crear Nueva Oferta'}</h2>
                <form onSubmit={handleSubmit}>
                    <label>Producto:</label>
                    <select value={idProducto} onChange={(e) => setIdProducto(e.target.value)}>
                        <option value="">Seleccione un producto</option>
                        {productos.map(producto => (
                            <option key={producto.ID_Producto} value={producto.ID_Producto}>
                                {producto.Nombre_Producto}
                            </option>
                        ))}
                    </select>

                    <label>Tipo de Oferta:</label>
                    <select value={tipoOferta} onChange={(e) => setTipoOferta(e.target.value)}>
                        <option value="Descuento">Descuento</option>
                        <option value="2x1">2x1</option>
                    </select>

                    <label>Descuento (%):</label>
                    <input 
                        type="number" 
                        value={descuento} 
                        onChange={(e) => setDescuento(e.target.value)} 
                        min="0" 
                        max="100" 
                        disabled={tipoOferta !== 'Descuento'}
                    />

                    <label>Cantidad Requerida (para 2x1):</label>
                    <input 
                        type="number" 
                        value={cantidadRequerida} 
                        onChange={(e) => setCantidadRequerida(e.target.value)} 
                        min="2" 
                        disabled={tipoOferta !== '2x1'}
                    />

                    <label>Fecha de Inicio:</label>
                    <input 
                        type="date" 
                        value={fechaInicio || ''} 
                        onChange={(e) => setFechaInicio(e.target.value)} 
                        min={currentDate} 
                    />

                    <label>Fecha de Fin:</label>
                    <input 
                        type="date" 
                        value={fechaFin || ''} 
                        onChange={(e) => setFechaFin(e.target.value)} 
                        min={fechaInicio} 
                    />

                    <button type="submit" className="offer-submit-button">Guardar Oferta</button>
                </form>
            </div>
        </div>
    );
};

const OfferManager = () => {
    const [offers, setOffers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentOffer, setCurrentOffer] = useState(null);
    const [idTienda, setIdTienda] = useState(null);
    const [loading, setLoading] = useState(true);
    const [productos, setProductos] = useState({});
    const userData = localStorage.getItem('userId');
    const { isOnline, showNotification  } = useConnectivity();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await fetchIdTienda();
            setLoading(false);
        };
        fetchData();
    }, []);

    const fetchIdTienda = async () => {
        try {
            const response = await axios.get(`http://localhost:3000/tienda/${userData}`);
            if (response.data.length > 0) {
                const tienda = response.data[0];
                setIdTienda(tienda.ID_Tienda);
                await fetchProductos(tienda.ID_Tienda); 
            } else {
                console.error("No se encontró la tienda para el usuario:", userData);
            }
        } catch (error) {
            console.error("Error al obtener ID_Tienda: ", error);
        }
    };

    const fetchProductos = async (idTienda) => { 
        try {
            const response = await axios.get(`http://localhost:3000/producto/tienda/${idTienda}`);
            const productosMap = {};
            response.data.forEach(producto => {
                productosMap[producto.ID_Producto] = producto.Nombre_Producto;
            });
            setProductos(productosMap);
        } catch (error) {
            console.error("Error al obtener productos: ", error);
        }
    };

    const fetchOffers = async () => {
        if (idTienda) {
            try {
                const response = await axios.get(`http://localhost:3000/oferta/tienda/${idTienda}`);
                setOffers(response.data);
            } catch (error) {
                console.error("Error al obtener ofertas: ", error);
            }
        }
    };

    useEffect(() => {
        fetchOffers();
    }, [idTienda]);



    const handleCreateOrUpdate = async (offer) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para crear o modificar ofertas',
                'warning'
            );
            return;
        }
        
        try {
            if (!offer.ID_Producto || !offer.Fecha_Inicio || !offer.Fecha_Fin || !offer.Tipo_Oferta) {
                alert("Todos los campos son obligatorios.");
                return;
            }

            if (offer.Tipo_Oferta === '2x1' && (offer.Cantidad_Requerida === undefined || offer.Cantidad_Requerida < 2)) {
                alert("La 'Cantidad_Requerida' debe ser un número mayor o igual a 2 para el tipo de oferta '2x1'.");
                return;
            }

            const existingOffers = await axios.get(`http://localhost:3000/oferta/tienda/${idTienda}`);
            const isDuplicate = existingOffers.data.some(existingOffer => 
                existingOffer.ID_Producto === offer.ID_Producto &&
                existingOffer.Fecha_Inicio === offer.Fecha_Inicio &&
                existingOffer.Fecha_Fin === offer.Fecha_Fin &&
                existingOffer.Activo 
            );

            if (isDuplicate) {
                alert("Ya existe una oferta activa para este producto en estas fechas.");
                return; 
            }

            const updatedOffer = {
                ID_Producto: offer.ID_Producto,
                Fecha_Inicio: offer.Fecha_Inicio,
                Fecha_Fin: offer.Fecha_Fin,
                Tipo_Oferta: offer.Tipo_Oferta,
                Activo: true,
                ID_Usuario: localStorage.getItem('userId'),
                ID_Tienda: idTienda, 
            };

            if (offer.Tipo_Oferta === 'Descuento') {
                updatedOffer.Descuento = offer.Descuento; 
            } else if (offer.Tipo_Oferta === '2x1') {
                updatedOffer.Cantidad_Requerida = offer.Cantidad_Requerida; 
            }

            if (currentOffer) {
                await axios.put(`http://localhost:3000/ofertas/${currentOffer.ID_Oferta}`, updatedOffer);
            } else {
                await axios.post('http://localhost:3000/createofertas', updatedOffer);
            }

            fetchOffers();
        } catch (error) {
            console.error("Error al crear o actualizar oferta: ", error.response ? error.response.data : error.message);
            alert("Ocurrió un error: " + (error.response ? error.response.data.error : error.message));
        }
        setCurrentOffer(null);
    };
    
    const handleEdit = (offer) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para editar ofertas',
                'warning'
            );
            return;
        }
        setCurrentOffer(offer);
        setIsModalOpen(true);
    };
    

    const handleDelete = async (offerId) => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para eliminar ofertas',
                'warning'
            );
            return;
        }
        try {
            await axios.delete(`http://localhost:3000/ofertas/${offerId}`);
            setOffers(prevOffers => prevOffers.filter(offer => offer.ID_Oferta !== offerId));
        } catch (error) {
            console.error("Error al eliminar oferta: ", error);
            alert("Ocurrió un error al eliminar la oferta.");
        }
    };

    return (
        <div>
            <h1 className='offer_h1'>Gestión de Ofertas</h1>
            <button className="offer-create-button" onClick={() => { setCurrentOffer(null); setIsModalOpen(true); }}>Crear Nueva Oferta</button>
            <div className="table-container">
                <h2>Ofertas Activas</h2>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Producto</th>
                            <th>Tipo de Oferta</th>
                            <th>Descuento</th>
                            <th>Cantidad</th>
                            <th>Fecha Inicio</th>
                            <th>Fecha Fin</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {offers.map(offer => (
                            <tr key={offer.ID_Oferta}>
                                <td>{offer.ID_Oferta}</td>
                                <td>{productos[offer.ID_Producto] || 'Producto no encontrado'}</td>
                                <td>{offer.Tipo_Oferta}</td>
                                <td>{offer.Descuento}</td>
                                <td>{offer.Cantidad_Requerida}</td>
                                <td>{new Date(offer.Fecha_Inicio).toLocaleString()}</td>
                                <td>{new Date(offer.Fecha_Fin).toLocaleString()}</td>
                                <td>{offer.Activo ? 'Activo' : 'Inactivo'}</td>
                                <td>
                                    <div className="button-group">
                                        <button onClick={() => handleEdit(offer)} className="offer-edit-button">Editar</button>
                                        <button onClick={() => handleDelete(offer.ID_Oferta)} className="offer-delete-button">Eliminar</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <OfferForm 
                    onSubmit={handleCreateOrUpdate} 
                    offer={currentOffer} 
                    closeModal={() => setIsModalOpen(false)} 
                    idTienda={idTienda} 
                />
            )}
        </div>
    );
};

export default OfferManager;
