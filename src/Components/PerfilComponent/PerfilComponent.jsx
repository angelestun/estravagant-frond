import React, { useState, useEffect } from 'react';
import { useConnectivity } from '../../context/ConnectivityProvider';


const PerfilComponent = () => {
  const [user, setUser] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [pedidoDetalles, setPedidoDetalles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPedido, setExpandedPedido] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingDetails, setLoadingDetails] = useState({});
  const itemsPerPage = 10;
  const { isOnline } = useConnectivity();

  const saveProfileData = (userData, userPedidos) => {
    localStorage.setItem('profileData', JSON.stringify({
      user: userData,
      pedidos: userPedidos,
      timestamp: new Date().toISOString()
    }));
  };
  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setError('No se encontró un usuario con sesión iniciada');
        setLoading(false);
        return;
      }

      if (!isOnline) {
        const savedData = localStorage.getItem('profileData');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setUser(parsed.user);
          setPedidos(parsed.pedidos);
        }
        setLoading(false);
        return;
      }

      try {
        const userResponse = await fetch(`https://extravagant-back-1.onrender.com/usuarios/${userId}`);
        const userData = await userResponse.json();
        const pedidosResponse = await fetch(`https://extravagant-back-1.onrender.com/pedidos`);
        const pedidosData = await pedidosResponse.json();

        const userPedidos = pedidosData
          .filter(pedido => pedido.ID_Usuario === parseInt(userId))
          .map((pedido, index) => ({ ...pedido, Numero_Pedido: index + 1 }));

        setUser(userData);
        setPedidos(userPedidos);
        saveProfileData(userData, userPedidos);
        
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        const savedData = localStorage.getItem('profileData');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setUser(parsed.user);
          setPedidos(parsed.pedidos);
        }
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isOnline]);


  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        setError('No se encontró un usuario con sesión iniciada');
        setLoading(false);
        return;
      }

      try {
        const userResponse = await fetch(`https://extravagant-back-1.onrender.com/usuarios/${userId}`);
        const userData = await userResponse.json();
        setUser(userData);

        const pedidosResponse = await fetch(`https://extravagant-back-1.onrender.com/pedidos`);
        const pedidosData = await pedidosResponse.json();
        console.log(pedidosData);

        const userPedidos = pedidosData
          .filter(pedido => pedido.ID_Usuario === parseInt(userId))
          .map((pedido, index) => ({ ...pedido, Numero_Pedido: index + 1 }));
        setPedidos(userPedidos);

        setLoading(false);
      } catch (err) {
        console.error('Error al cargar los datos:', err);
        setError('Error al cargar los datos del usuario');
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const toggleDetails = async (pedidoId) => {
    if (!pedidoDetalles[pedidoId]) {
      setLoadingDetails(prev => ({ ...prev, [pedidoId]: true }));
  
      try {
        const response = await fetch(`https://extravagant-back-1.onrender.com/pedido_producto/${pedidoId}`);
        const data = await response.json();
  
        if (data && data.productos && Array.isArray(data.productos)) {
          setPedidoDetalles(prevState => ({
            ...prevState,
            [pedidoId]: data.productos 
          }));
        } else {
          console.error('No se encontraron productos para el pedido', pedidoId);
        }
      } catch (error) {
        console.error('Error al obtener los detalles del pedido:', error);
      } finally {
        setLoadingDetails(prev => ({ ...prev, [pedidoId]: false }));
      }
    }
  
    setExpandedPedido(prev => (prev === pedidoId ? null : pedidoId));
  };
  

  const indexOfLastPedido = currentPage * itemsPerPage;
  const indexOfFirstPedido = indexOfLastPedido - itemsPerPage;
  const currentPedidos = pedidos.slice(indexOfFirstPedido, indexOfLastPedido);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  if (loading) return <div className="text-center italic text-gray-600 p-4">Cargando...</div>;
  if (error) return <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg border border-red-600">{error}</div>;
  if (!user) return <div className="text-center text-red-600 bg-red-50 p-4 rounded-lg border border-red-600">No se encontró información del usuario</div>;

  return (
    <div className="w-full max-w-4xl mx-auto p-5 bg-white rounded-lg shadow-lg animate-[fadeIn_1s_ease-in-out]">
      <div className="bg-purple-800 p-4 rounded-lg mb-6">
        <h2 className="text-2xl text-white font-semibold">Perfil de Usuario</h2>
      </div>

      <div className="mb-6">
        <div className="bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-purple-200 p-4">
            <h3 className="text-xl text-purple-800 font-semibold">Datos del Usuario</h3>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-purple-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg 
                        className="w-5 h-5 text-purple-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Nombre Completo</p>
                    <p className="text-gray-700 font-medium truncate">
                      {user.Nombre} {user.Apellido}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-purple-100 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg 
                        className="w-5 h-5 text-purple-600" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500">Correo Electrónico</p>
                    <p className="text-gray-700 font-medium break-all whitespace-normal overflow-hidden">
                      {user.Correo}
                    </p>
                  </div>
                </div>
              </div>

              {user.Direccion && (
                <div className="bg-white rounded-lg shadow-sm border border-purple-100 p-4 md:col-span-2">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg 
                          className="w-5 h-5 text-purple-600" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="text-gray-700 font-medium break-words">{user.Direccion}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mb-5">
        <div className="bg-purple-100 rounded-lg p-4 shadow-md">
          <h3 className="text-xl text-gray-800 mb-4 border-b border-white pb-2">Pedidos del Usuario</h3>
          {pedidos.length === 0 ? (
            <p className="text-gray-600">No se encontraron pedidos para este usuario</p>
          ) : (
            <>
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-3 text-left">Pedido</th>
                        <th className="p-3 text-left">Fecha</th>
                        <th className="p-3 text-left">Estado</th>
                        <th className="p-3 text-left">Total</th>
                        <th className="p-3 text-left">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentPedidos.map(pedido => (
                        <React.Fragment key={pedido.ID_Pedido}>
                          <tr className="border-b border-purple-100">
                            <td className="p-3">{pedido.Numero_Pedido}</td>
                            <td className="p-3">{new Date(pedido.Fecha_Pedido).toLocaleDateString()}</td>
                            <td className="p-3">
                              <span className="px-2 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                                {pedido.Estado_Pedido}
                              </span>
                            </td>
                            <td className="p-3">${pedido.Total}</td>
                            <td className="p-3">
                              <button 
                                onClick={() => toggleDetails(pedido.ID_Pedido)}
                                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                              >
                                {expandedPedido === pedido.ID_Pedido ? 'Ocultar' : 'Ver Detalles'}
                              </button>
                            </td>
                          </tr>
                          {expandedPedido === pedido.ID_Pedido && (
                            <tr>
                              <td colSpan="5">
                                <div className="p-4 bg-white rounded-lg">
                                  {loadingDetails[pedido.ID_Pedido] ? (
                                    <p className="text-center text-gray-600">Cargando detalles...</p>
                                  ) : pedidoDetalles[pedido.ID_Pedido] ? (
                                    pedidoDetalles[pedido.ID_Pedido].length > 0 ? (
                                      <div className="space-y-4">
                                        {pedidoDetalles[pedido.ID_Pedido].map((producto, index) => (
                                          <div key={index} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                                            <div className="flex justify-between mb-2">
                                              <span className="font-medium">{producto.Nombre_Producto}</span>
                                              <span className="text-gray-600"><strong>Tienda:</strong> {producto.NombreTienda}</span>
                                            </div>
                                            <div className="flex justify-between text-gray-600">
                                              <span><strong>Cantidad:</strong> {producto.Cantidad}</span>
                                              <span><strong>Precio:</strong> ${producto.Precio_Unitario.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-end mt-2">
                                              <span className="font-bold">Total: ${(producto.Precio_Unitario * producto.Cantidad).toFixed(2)}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-center text-gray-600">No hay productos en este pedido.</p>
                                    )
                                  ) : (
                                    <p className="text-center text-red-600">Error al cargar los detalles del pedido</p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden">
                {currentPedidos.map(pedido => (
                  <div key={pedido.ID_Pedido} className="bg-white rounded-lg shadow-sm mb-3">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex justify-between items-center">
                        <div className="space-y-1">
                          <h4 className="font-semibold text-lg">Pedido #{pedido.Numero_Pedido}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(pedido.Fecha_Pedido).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                            {pedido.Estado_Pedido}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex justify-between items-center">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-bold text-lg">${pedido.Total}</span>
                      </div>

                      <button 
                        onClick={() => toggleDetails(pedido.ID_Pedido)}
                        className="w-full mt-3 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        {expandedPedido === pedido.ID_Pedido ? 'Ocultar Detalles' : 'Ver Detalles'}
                      </button>
                    </div>

                    {expandedPedido === pedido.ID_Pedido && (
                      <div className="p-4 bg-gray-50">
                        {loadingDetails[pedido.ID_Pedido] ? (
                          <p className="text-center text-gray-600">Cargando detalles...</p>
                        ) : pedidoDetalles[pedido.ID_Pedido] ? (
                          pedidoDetalles[pedido.ID_Pedido].map((producto, index) => (
                            <div 
                              key={index} 
                              className={`py-3 ${index !== 0 ? 'border-t border-gray-200' : ''}`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1">
                                  <h5 className="font-medium text-gray-900">{producto.Nombre_Producto}</h5>
                                  <p className="text-sm text-gray-500 mt-1">{producto.NombreTienda}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-bold text-gray-900">
                                    ${(producto.Precio_Unitario * producto.Cantidad).toFixed(2)}
                                  </p>
                                  <p className="text-sm text-gray-500 mt-1">
                                    Cant: {producto.Cantidad}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 text-sm text-gray-600">
                                <span>Precio unitario: ${producto.Precio_Unitario.toFixed(2)}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-center text-red-600">Error al cargar los detalles</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-center gap-3 mt-4">
                {currentPage > 1 && (
                  <button 
                    onClick={() => paginate(currentPage - 1)}
                    className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    Anterior
                  </button>
                )}
                <span className="text-gray-600 text-sm">Página {currentPage}</span>
                <button 
                  onClick={() => paginate(currentPage + 1)} 
                  disabled={indexOfLastPedido >= pedidos.length}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerfilComponent;