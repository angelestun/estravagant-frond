import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ProductosComponent.css';
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
    Imagen: null,
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
      const response = await axios.get(`https://extravagant-back.vercel.app/tienda/${userData}`);
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

  const getImageUrl = (imagen) => {
    if (!imagen) {
      return '/assets/placeholder.jpg'; 
    }
  
    try {
      if (imagen.startsWith('uploads/')) {
        return `https://extravagant-back.vercel.app/${imagen}`;
      } else {
        return `https://extravagant-back.vercel.app/uploads/products/${imagen}`;
      }
    } catch (error) {
      console.error('Error con la URL de la imagen:', error);
      return '/assets/placeholder.jpg';
    }
  };
  

const obtenerProductos = async () => {
  if (!userData || !idTienda) {
    setNotificacion('Error: ID de usuario o tienda no están definidos.');
    return;
  }

  try {
    setLoading(true);
    const response = await axios.get('https://extravagant-back.vercel.app/productos/tienda', {
      params: {
        ID_Usuario: userData,
        ID_Tienda: idTienda,
      },
    });
    const productosConImagenes = response.data.map(producto => ({
      ...producto,
      Imagen: producto.Imagen && producto.Imagen !== 'null' && producto.Imagen !== 'undefined' 
        ? producto.Imagen 
        : null
    }));
    setProductos(productosConImagenes);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setNuevoProducto({ ...nuevoProducto, Imagen: file });
      setImagePreview(URL.createObjectURL(file));
    } else {
      alert('Por favor, selecciona un archivo de imagen.');
      setNuevoProducto({ ...nuevoProducto, Imagen: null });
      setImagePreview(null);
    }
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
  
    const formData = new FormData();
    for (const key in nuevoProducto) {
      formData.append(key, nuevoProducto[key]);
    }
    formData.append('ID_Usuario', userData);
    formData.append('ID_Tienda', idTienda);
  
    try {
      const response = await axios.post('https://extravagant-back.vercel.app/productos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
  
      setProductos(prevProductos => [
        ...prevProductos,
        { ...nuevoProducto, ID_Producto: response.data.id, Imagen: response.data.imagen }
      ]);
  
      handleCerrarModal();
      setNotificacion('Producto agregado con éxito.');
    } catch (error) {
      setNotificacion('Error al agregar producto: ' + (error.response ? error.response.data.error : 'Error de conexión.'));
    }
  };

  const validarCampos = () => {
    const { Nombre_Producto, Descripcion, Precio, Stock, Talla, Color, Imagen, Categoria, Marca } = nuevoProducto;
    if (!Nombre_Producto || !Descripcion || !Precio || !Stock || !Talla || !Color || !Imagen || !Categoria || !Marca) {
      alert('Por favor, completa todos los campos.');
      return false;
    }
    if (Precio < 0 || Stock < 0) {
      alert('El precio y el stock no pueden ser negativos.');
      return false;
    }
    return true;
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setNuevoProducto(initialProductoState);
    setNotificacion('');
    setIsEditMode(false);
    setCurrentProducto(null);
    setImagePreview(null);
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
    setNuevoProducto(producto);
    setCurrentProducto(producto.ID_Producto);
    setIsEditMode(true);
    setModalVisible(true);
    setImagePreview(`https://extravagant-back.vercel.app/uploads/products/${producto.Imagen}`);
  };

const handleActualizarProducto = async (e) => {
  e.preventDefault();
  if (!isOnline) {
    showNotification(
      'Conexión Requerida',
      'Se necesita conexión a Internet para actualizar productos',
      'warning'
    );
    return;
  }

  const formData = new FormData();
  for (const key in nuevoProducto) {
    if (key === 'Imagen' && !nuevoProducto[key]) continue; 
    formData.append(key, nuevoProducto[key]);
  }

  try {
    const response = await axios.put(`https://extravagant-back.vercel.app/productos/${currentProducto}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    const updatedProductos = productos.map(prod => 
      prod.ID_Producto === currentProducto 
        ? { 
            ...prod, 
            ...nuevoProducto,
            Imagen: nuevoProducto.Imagen ? response.data.imagen : prod.Imagen 
          } 
        : prod
    );

    setProductos(updatedProductos);
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
    try {
      await axios.delete(`https://extravagant-back.vercel.app/productos/${id}`);
      setProductos(productos.filter(producto => producto.ID_Producto !== id));
      setNotificacion('Producto eliminado con éxito.');
    } catch (error) {
      setNotificacion('Error al eliminar producto: ' + (error.response ? error.response.data.error : 'Error de conexión.'));
    }
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
                    src={producto.Imagen ? `https://extravagant-back.vercel.app/uploads/products/${producto.Imagen}` : 'ruta/por_defecto.jpg'}
                    alt="Imagen de Producto"
                    style={{ width: '100px', height: 'auto' }}
                    onError={(e) => { e.target.src = 'ruta/por_defecto.jpg'; }} 
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
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">
                {isEditMode ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
              <button 
                onClick={handleCerrarModal}
                className="text-white hover:bg-white/20 rounded-full p-1 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              <form onSubmit={isEditMode ? handleActualizarProducto : handleAgregarProducto} className="space-y-4">
                {/* Input Groups */}
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows="3"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {isEditMode ? 'Cambiar Imagen (opcional)' : 'Imagen del Producto'}
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        accept="image/*"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required={!isEditMode && !nuevoProducto.Imagen}
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Tamaño recomendado: 1000x1000 px
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {(imagePreview || nuevoProducto.Imagen) && (
                        <img
                          src={imagePreview || `https://extravagant-back.vercel.app/uploads/products/${nuevoProducto.Imagen}`}
                          alt="Vista previa"
                          className="w-20 h-20 object-cover rounded-lg border-2 border-purple-500"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg'; 
                          }}
                        />
                      )}
                    </div>
                  </div>
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