import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useConnectivity } from '../../context/ConnectivityProvider';

const ProductosComponent = () => {
  const userData = localStorage.getItem('userId');
  const [idTienda, setIdTienda] = useState(localStorage.getItem('idTienda') || null);
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentProducto, setCurrentProducto] = useState(null);
  const [descripcionExpandida, setDescripcionExpandida] = useState({});
  const { isOnline, showNotification } = useConnectivity();
  const [loading, setLoading] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const productosPorPagina = 6;

  const initialProductoState = {
    Nombre_Producto: '',
    Descripcion: '',
    Precio: '',
    Stock: '',
    Talla: '',
    Color: '',
    Imagen: '',
    Categoria: '',
    Marca: '',
  };

  const [nuevoProducto, setNuevoProducto] = useState(initialProductoState);
  const [notificacion, setNotificacion] = useState('');
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      await fetchIdTienda();
      if (idTienda) {
        await obtenerProductos();
      }
    };

    fetchData();
  }, [idTienda]);

  const fetchIdTienda = async () => {
    if (!userData) return;

    try {
      const response = await axios.get(`https://extravagant-back-1.onrender.com/tienda/${userData}`);
      if (response.data.length > 0) {
        const tienda = response.data[0];
        if (tienda.ID_Tienda) {
          setIdTienda(tienda.ID_Tienda);
          localStorage.setItem('idTienda', tienda.ID_Tienda);
        }
      }
    } catch (error) {
      setNotificacion('Error al obtener ID de tienda.');
    }
  };

  const obtenerProductos = async () => {
    if (!userData || !idTienda) {
      setNotificacion('Error: ID de usuario o tienda no están definidos.');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get('https://extravagant-back-1.onrender.com/productos/tienda', {
        params: {
          ID_Usuario: userData,
          ID_Tienda: idTienda,
        },
      });
      setProductos(response.data);
    } catch (error) {
      setNotificacion('Error al obtener productos: ' + (error.response ? error.response.data.error : 'Error de conexión.'));
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = `/uploads/${file.name}`;
      setImagePreview(URL.createObjectURL(file));
      setNuevoProducto({ 
        ...nuevoProducto, 
        Imagen: imageUrl 
      });
    } else {
      alert('Por favor, selecciona un archivo de imagen.');
      setNuevoProducto({ ...nuevoProducto, Imagen: null });
      setImagePreview(null);
    }
  };

  const validarCampos = () => {
    const { Nombre_Producto, Descripcion, Precio, Stock, Talla, Color, Categoria, Marca } = nuevoProducto;
    if (!Nombre_Producto || !Descripcion || !Precio || !Stock || !Talla || !Color || !Categoria || !Marca) {
      alert('Por favor, completa todos los campos obligatorios.');
      return false;
    }
    if (Precio < 0 || Stock < 0) {
      alert('El precio y el stock no pueden ser negativos.');
      return false;
    }
    return true;
  };

  const handleAgregarProducto = async (e) => {
    e.preventDefault();
    if (!validarCampos()) return;

    try {
      const productData = {
        ...nuevoProducto,
        ID_Usuario: userData,
        ID_Tienda: idTienda,
      };

      const response = await axios.post('https://extravagant-back-1.onrender.com/productos', productData);

      setProductos(prevProductos => [
        ...prevProductos,
        { ...nuevoProducto, ID_Producto: response.data.id }
      ]);

      handleCerrarModal();
      setNotificacion('Producto agregado con éxito.');
      obtenerProductos();
    } catch (error) {
      setNotificacion('Error al agregar producto: ' + (error.response?.data?.error || 'Error de conexión'));
    }
  };

  const handleEditProducto = (producto) => {
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para editar productos',
        'warning'
      );
      return;
    }

    setNuevoProducto({
      ...producto
    });
    setCurrentProducto(producto.ID_Producto);
    setIsEditMode(true);
    setModalVisible(true);
    setImagePreview(producto.Imagen);
  };
  const handleActualizarProducto = async (e) => {
    e.preventDefault();
    if (!validarCampos()) return;

    try {
      await axios.put(`https://extravagant-back-1.onrender.com/productos/${currentProducto}`, nuevoProducto);

      setProductos(productos.map(prod =>
        prod.ID_Producto === currentProducto ? { ...prod, ...nuevoProducto } : prod
      ));

      handleCerrarModal();
      setNotificacion('Producto actualizado con éxito.');
      obtenerProductos();
    } catch (error) {
      setNotificacion('Error al actualizar producto: ' + (error.response?.data?.error || 'Error de conexión'));
    }
  };

  const handleEliminarProducto = async (id) => {
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para eliminar productos',
        'warning'
      );
      return;
    }
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await axios.delete(`https://extravagant-back-1.onrender.com/productos/${id}`);
        setProductos(productos.filter(producto => producto.ID_Producto !== id));
        setNotificacion('Producto eliminado con éxito.');
      } catch (error) {
        setNotificacion('Error al eliminar producto: ' + (error.response?.data?.error || 'Error de conexión'));
      }
    }
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setNuevoProducto(initialProductoState);
    setNotificacion('');
    setIsEditMode(false);
    setCurrentProducto(null);
    setImagePreview(null);
  };

  const handleInputChange = (event) => {
    setFiltro(event.target.value);
  };

  const handleInputChangeNuevoProducto = (e) => {
    const { name, value } = e.target;
    setNuevoProducto({ ...nuevoProducto, [name]: value });
  };

  const productosFiltrados = productos.filter(producto =>
    producto.Nombre_Producto.toLowerCase().includes(filtro.toLowerCase())
  );

  const productosPaginados = productosFiltrados.slice(
    (paginaActual - 1) * productosPorPagina,
    paginaActual * productosPorPagina
  );

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
  };

  const toggleDescripcion = (index) => {
    setDescripcionExpandida(prevState => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  const renderProductImage = (producto) => {
    if (!producto.Imagen) {
      return (
        <div className="h-20 w-20 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-500 text-xs text-center">Sin imagen</span>
        </div>
      );
    }

    return (
      <div className="relative">
        <img
          src={producto.Imagen}
          alt="Producto"
          className="h-20 w-20 object-cover rounded"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/placeholder.jpg';
          }}
        />
      </div>
    );
  };

  return (
    <div className="table-card">
      {notificacion && (
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
          {notificacion}
        </div>
      )}
      
      <div className="mb-4">
        <button 
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          onClick={() => { setModalVisible(true); setIsEditMode(false); }}
        >
          Agregar Producto
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Tabla De Productos</h2>
        <input
          type="text"
          className="w-full p-2 border border-gray-300 rounded mb-4"
          placeholder="Buscar por nombre"
          value={filtro}
          onChange={handleInputChange}
        />
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-purple-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Talla</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Color</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Marca</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Imagen</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productosPaginados.map((producto, index) => (
                <tr key={`${producto.ID_Producto}-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">{producto.Nombre_Producto}</td>
                  <td 
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => toggleDescripcion(index)}
                  >
                    {descripcionExpandida[index] ? producto.Descripcion : `${producto.Descripcion.slice(0, 50)}...`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">${producto.Precio}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{producto.Stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{producto.Talla}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{producto.Color}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{producto.Categoria}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{producto.Marca}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderProductImage(producto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap space-x-2">
                    <button 
                      onClick={() => handleEditProducto(producto)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => handleEliminarProducto(producto.ID_Producto)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-center space-x-2">
          {Array.from({ length: totalPaginas }, (_, index) => (
            <button
              key={index}
              onClick={() => cambiarPagina(index + 1)}
              className={`px-3 py-1 rounded ${
                paginaActual === index + 1
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {modalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {isEditMode ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
              <button 
                onClick={handleCerrarModal}
                className="text-white hover:bg-white/20 rounded-full p-1"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={isEditMode ? handleActualizarProducto : handleAgregarProducto} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      name="Nombre_Producto"
                      value={nuevoProducto.Nombre_Producto}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Precio
                    </label>
                    <input
                      type="number"
                      name="Precio"
                      value={nuevoProducto.Precio}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock
                    </label>
                    <input
                      type="number"
                      name="Stock"
                      value={nuevoProducto.Stock}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Talla
                    </label>
                    <input
                      type="text"
                      name="Talla"
                      value={nuevoProducto.Talla}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Color
                    </label>
                    <input
                      type="text"
                      name="Color"
                      value={nuevoProducto.Color}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoría
                    </label>
                    <input
                      type="text"
                      name="Categoria"
                      value={nuevoProducto.Categoria}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca
                    </label>
                    <input
                      type="text"
                      name="Marca"
                      value={nuevoProducto.Marca}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="Descripcion"
                    value={nuevoProducto.Descripcion}
                    onChange={handleInputChangeNuevoProducto}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEditMode ? 'Cambiar Imagen (opcional)' : 'Imagen del Producto'}
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required={!isEditMode && !nuevoProducto.Imagen}
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Tamaño recomendado: 1000x1000 px
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Vista previa"
                          className="w-20 h-20 object-cover rounded-lg border-2 border-purple-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/placeholder.jpg';
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
                >
                  {isEditMode ? 'Actualizar Producto' : 'Agregar Producto'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosComponent;