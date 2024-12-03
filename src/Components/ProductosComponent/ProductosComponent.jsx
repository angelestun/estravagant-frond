import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
  const [imageError, setImageError] = useState({});
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
    ImagenUrl: '', // Nuevo campo para URLs
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

  const handleInputChange = (event) => {
    setFiltro(event.target.value);
  };

  const handleInputChangeNuevoProducto = (e) => {
    const { name, value } = e.target;
    setNuevoProducto({ ...nuevoProducto, [name]: value });
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setNuevoProducto({
      ...nuevoProducto,
      ImagenUrl: url,
      Imagen: url // Mantenemos compatibilidad con el sistema existente
    });
    setImagePreview(url);
  };

  const validarCampos = () => {
    const { Nombre_Producto, Descripcion, Precio, Stock, Talla, Color, ImagenUrl, Categoria, Marca } = nuevoProducto;
    if (!Nombre_Producto || !Descripcion || !Precio || !Stock || !Talla || !Color || !ImagenUrl || !Categoria || !Marca) {
      alert('Por favor, completa todos los campos.');
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
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para agregar productos',
        'warning'
      );
      return;
    }
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
    } catch (error) {
      setNotificacion('Error al agregar producto: ' + (error.response ? error.response.data.error : 'Error de conexión.'));
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
      ...producto,
      ImagenUrl: producto.Imagen // Convertir la imagen existente a URL
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
      const response = await axios.put(`https://extravagant-back-1.onrender.com/productos/${currentProducto}`, {
        ...nuevoProducto,
        Imagen: nuevoProducto.ImagenUrl // Usar la URL como imagen
      });

      setProductos(productos.map(prod =>
        prod.ID_Producto === currentProducto
          ? { ...prod, ...nuevoProducto, Imagen: nuevoProducto.ImagenUrl }
          : prod
      ));

      handleCerrarModal();
      setNotificacion('Producto actualizado con éxito.');
    } catch (error) {
      setNotificacion('Error al actualizar producto: ' + (error.response ? error.response.data.error : 'Error de conexión.'));
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
        setNotificacion('Error al eliminar producto: ' + (error.response ? error.response.data.error : 'Error de conexión.'));
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

  const getImageUrl = (imagen) => {
    if (!imagen) return '/assets/placeholder.jpg';
    
    // Si la imagen es una URL completa, usarla directamente
    if (imagen.startsWith('http://') || imagen.startsWith('https://')) {
      return imagen;
    }
    
    // Si no, usar la ruta del backend como antes
    return `https://extravagant-back-1.onrender.com/uploads/products/${imagen}`;
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

  return (
    <div className="table-card">
      {notificacion && <div className="notificacion">{notificacion}</div>}
      <div className="button-container-product">
        <button className="button" onClick={() => { setModalVisible(true); setIsEditMode(false); }}>
          Agregar Producto
        </button>
      </div>

      <div className="table-container">
        <h2 className="table-title font-Ocean">Tabla De Productos</h2>
        <input
          type="text"
          className="search-input"
          placeholder="Buscar"
          value={filtro}
          onChange={handleInputChange}
        />
        <table className="table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Talla</th>
              <th>Color</th>
              <th>Categoría</th>
              <th>Marca</th>
              <th>Imagen</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosPaginados.map((producto, index) => (
              <tr key={`${producto.ID_Producto}-${index}`}>
                <td>{producto.Nombre_Producto}</td>
                <td
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleDescripcion(index)}
                >
                  {descripcionExpandida[index] ? producto.Descripcion : `${producto.Descripcion.slice(0, 50)}...`}
                </td>
                <td>{producto.Precio}</td>
                <td>{producto.Stock}</td>
                <td>{producto.Talla}</td>
                <td>{producto.Color}</td>
                <td>{producto.Categoria}</td>
                <td>{producto.Marca}</td>
                <td>
                  <img
                    src={getImageUrl(producto.Imagen)}
                    alt="Imagen de Producto"
                    style={{ width: '100px', height: 'auto' }}
                    onError={(e) => {
                      e.target.src = '/assets/placeholder.jpg';
                    }}
                  />
                </td>
                <td>
                  <button onClick={() => handleEditProducto(producto)}>Editar</button>
                  <button onClick={() => handleEliminarProducto(producto.ID_Producto)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="pagination">
          {Array.from({ length: totalPaginas }, (_, index) => (
            <button
              key={index}
              onClick={() => cambiarPagina(index + 1)}
              className={paginaActual === index + 1 ? 'active' : ''}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {modalVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl relative overflow-hidden animate-slideIn">
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {isEditMode ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
              <button onClick={handleCerrarModal} className="text-white hover:bg-white/20 rounded-full p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <form onSubmit={isEditMode ? handleActualizarProducto : handleAgregarProducto} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nombre del Producto
                    </label>
                    <input
                      type="text"
                      name="Nombre_Producto"
                      value={nuevoProducto.Nombre_Producto}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Precio
                    </label>
                    <input
                      type="number"
                      name="Precio"
                      value={nuevoProducto.Precio}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Stock
                    </label>
                    <input
                      type="number"
                      name="Stock"
                      value={nuevoProducto.Stock}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      min="0"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Talla
                    </label>
                    <input
                      type="text"
                      name="Talla"
                      value={nuevoProducto.Talla}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Color
                    </label>
                    <input
                      type="text"
                      name="Color"
                      value={nuevoProducto.Color}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Categoría
                    </label>
                    <input
                      type="text"
                      name="Categoria"
                      value={nuevoProducto.Categoria}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Marca
                    </label>
                    <input
                      type="text"
                      name="Marca"
                      value={nuevoProducto.Marca}
                      onChange={handleInputChangeNuevoProducto}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    name="Descripcion"
                    value={nuevoProducto.Descripcion}
                    onChange={handleInputChangeNuevoProducto}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="3"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    URL de Imagen
                  </label>
                  <input
                    type="text"
                    name="ImagenUrl"
                    value={nuevoProducto.ImagenUrl}
                    onChange={handleImageUrlChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Ingresa la URL de la imagen del producto
                  </p>
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview}
                        alt="Vista previa"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-purple-500"
                        onError={(e) => {
                          e.target.src = '/assets/placeholder.jpg';
                          setImageError({...imageError, [nuevoProducto.ImagenUrl]: true});
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors duration-200"
                  >
                    {isEditMode ? 'Actualizar Producto' : 'Agregar Producto'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosComponent;