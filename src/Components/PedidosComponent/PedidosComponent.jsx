import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PedidosComponent.css";
import { useConnectivity } from '../../context/ConnectivityProvider';

const PedidosComponent = () => {
  const [pedidos, setPedidos] = useState([]);
  const [pedidoDetalles, setPedidoDetalles] = useState({});
  const [expandedPedido, setExpandedPedido] = useState(null); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);
  const [usuarios, setUsuarios] = useState({}); 
  const { isOnline, showNotification } = useConnectivity();

  useEffect(() => {
    fetchPedidos();

    const intervalId = setInterval(() => {
      if (isOnline) {
        fetchPedidos();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [isOnline]);

  const fetchUsuarios = async () => {
    try {
      if (!isOnline) return;
      const response = await axios.get("https://extravagant-back.vercel.app/usuarios");
      const usuariosData = response.data;
      const usuariosMap = usuariosData.reduce((acc, user) => {
        acc[user.ID_Usuario] = `${user.Nombre} ${user.Apellido}`;
        return acc;
      }, {});
      setUsuarios(usuariosMap);
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    }
  };

  const fetchPedidos = async () => {
    try {
      if (!isOnline) {
        const cachedPedidos = localStorage.getItem('cachedPedidos');
        if (cachedPedidos) {
          setPedidos(JSON.parse(cachedPedidos));
          showNotification(
            'Modo Offline',
            'Mostrando pedidos guardados localmente',
            'info'
          );
          return;
        }
        showNotification(
          'Sin Conexión',
          'No hay pedidos guardados para mostrar offline',
          'warning'
        );
        return;
      }

      const response = await axios.get("https://extravagant-back.vercel.app/pedidos/", {
        headers: { 'Cache-Control': 'no-cache' }
      });
      setPedidos(response.data);
      localStorage.setItem('cachedPedidos', JSON.stringify(response.data));
      localStorage.setItem('lastPedidosUpdate', Date.now().toString());

      fetchUsuarios();

    } catch (error) {
      console.error("Error fetching pedidos:", error);
      const cachedPedidos = localStorage.getItem('cachedPedidos');
      if (cachedPedidos) {
        setPedidos(JSON.parse(cachedPedidos));
        showNotification(
          'Error de Conexión',
          'Mostrando pedidos guardados localmente',
          'warning'
        );
      }
    }
  };

  const fetchDetallesPedido = async (pedidoId) => {
    if (!isOnline) {
      const cachedDetalles = localStorage.getItem(`pedidoDetalles_${pedidoId}`);
      if (cachedDetalles) {
        setPedidoDetalles(prev => ({
          ...prev,
          [pedidoId]: JSON.parse(cachedDetalles)
        }));
        return;
      }
      showNotification(
        'Sin Conexión',
        'No se pueden cargar los detalles del pedido sin conexión',
        'warning'
      );
      return;
    }

    try {
      const response = await axios.get(`https://extravagant-back.vercel.app/pedido_producto/${pedidoId}`);
      const detalles = response.data.productos;
      setPedidoDetalles(prev => ({
        ...prev,
        [pedidoId]: detalles
      }));
      localStorage.setItem(`pedidoDetalles_${pedidoId}`, JSON.stringify(detalles));
    } catch (error) {
      console.error("Error al obtener los detalles del pedido:", error);
      const cachedDetalles = localStorage.getItem(`pedidoDetalles_${pedidoId}`);
      if (cachedDetalles) {
        setPedidoDetalles(prev => ({
          ...prev,
          [pedidoId]: JSON.parse(cachedDetalles)
        }));
      }
    }
  }

  const toggleDetails = async (pedidoId) => {
    setExpandedPedido(prev => prev === pedidoId ? null : pedidoId);
    if (expandedPedido !== pedidoId) {
      fetchDetallesPedido(pedidoId);
    }
  };

  const indexOfLastPedido = currentPage * itemsPerPage;
  const indexOfFirstPedido = indexOfLastPedido - itemsPerPage;
  const currentPedidos = pedidos.slice(indexOfFirstPedido, indexOfLastPedido);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="pedidos-container">
      <h1>Pedidos</h1>

      <div className="table-container">
        <table className="pedidos-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Usuario</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Total</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {currentPedidos.map((pedido) => (
              <React.Fragment key={pedido.ID_Pedido}>
                <tr>
                  <td>{pedido.ID_Pedido}</td>
                  <td>{usuarios[pedido.ID_Usuario] || "Cargando..."}</td> 
                  <td>{new Date(pedido.Fecha_Pedido).toLocaleDateString()}</td>
                  <td>{pedido.Estado_Pedido}</td>
                  <td>${pedido.Total}</td>
                  <td>
                    <button className="expand-btn" onClick={() => toggleDetails(pedido.ID_Pedido)}>
                      {expandedPedido === pedido.ID_Pedido ? "Ocultar Detalles" : "Ver Detalles"}
                    </button>
                  </td>
                </tr>

                {expandedPedido === pedido.ID_Pedido && (
                  <tr className="expanded-row">
                    <td colSpan="6">
                      <div className="pedido-details">
                        <h4>Detalles del Pedido</h4>
                        {pedidoDetalles[pedido.ID_Pedido] ? (
                          pedidoDetalles[pedido.ID_Pedido].length > 0 ? (
                            <div className="pedido-details-list">
                              {pedidoDetalles[pedido.ID_Pedido].map((producto, index) => (
                                <div className="producto-card" key={index}>
                                  <div className="producto-info">
                                    <span>{producto.Nombre_Producto}</span>
                                  </div>
                                  <div className="producto-info">
                                    <span><strong>Cantidad:</strong> {producto.Cantidad}</span>
                                  </div>
                                  <div className="producto-info">
                                  <span><strong>Precio:</strong> ${producto.Precio_Unitario.toFixed(2)}</span>
                                  </div>
                                  <div className="producto-info">
                                    <span><strong>Total:</strong> ${(producto.Precio_Unitario * producto.Cantidad).toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p>No hay productos en este pedido.</p>
                          )
                        ) : (
                          <p>Cargando detalles...</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          {currentPage > 1 && (
            <button className="pagination-btn-p" onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}>
              Anterior
            </button>
          )}
          <span>Página {currentPage}</span>
          <button className="pagination-btn-p"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === Math.ceil(pedidos.length / itemsPerPage)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default PedidosComponent;
