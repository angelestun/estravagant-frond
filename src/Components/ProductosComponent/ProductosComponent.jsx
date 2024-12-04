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
    ImagenUrl: '',
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
      ImagenUrl: url,  // Actualiza la URL de la imagen
      Imagen: url,     // Asegura que la propiedad Imagen también reciba la URL
    });
    setImagePreview(url); // Establece la vista previa de la imagen
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
      showNotification('Conexión Requerida', 'Se necesita conexión a Internet para agregar productos', 'warning');
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
      setProductos(prevProductos => [...prevProductos, { ...nuevoProducto, ID_Producto: response.data.id }]);
      handleCerrarModal();
      setNotificacion('Producto agregado con éxito.');
      obtenerProductos(); // Recargar productos
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
      ImagenUrl: producto.Imagen
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
        Imagen: nuevoProducto.ImagenUrl
      });

      setProductos(productos.map(prod =>
        prod.ID_Producto === currentProducto
          ? { ...prod, ...nuevoProducto, Imagen: nuevoProducto.ImagenUrl }
          : prod
      ));

      handleCerrarModal();
      setNotificacion('Producto actualizado con éxito.');
      obtenerProductos(); // Recargar productos
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
        <h2 className="text-2xl font-semibold mb-6">Productos</h2>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={filtro}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="border-b py-2 px-4 text-left">Nombre</th>
                  <th className="border-b py-2 px-4 text-left">Descripción</th>
                  <th className="border-b py-2 px-4 text-left">Precio</th>
                  <th className="border-b py-2 px-4 text-left">Stock</th>
                  <th className="border-b py-2 px-4 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPaginados.map((producto) => (
                  <tr key={producto.ID_Producto}>
                    <td className="border-b py-2 px-4">{producto.Nombre_Producto}</td>
                    <td className="border-b py-2 px-4">
                      <button
                        onClick={() => toggleDescripcion(producto.ID_Producto)}
                        className="text-blue-500"
                      >
                        {descripcionExpandida[producto.ID_Producto] ? 'Ver menos' : 'Ver más'}
                      </button>
                      {descripcionExpandida[producto.ID_Producto] && (
                        <p>{producto.Descripcion}</p>
                      )}
                    </td>
                    <td className="border-b py-2 px-4">{producto.Precio}</td>
                    <td className="border-b py-2 px-4">{producto.Stock}</td>
                    <td className="border-b py-2 px-4">
                      <button
                        onClick={() => handleEditProducto(producto)}
                        className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleEliminarProducto(producto.ID_Producto)}
                        className="bg-red-500 text-white px-2 py-1 rounded"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex justify-between">
              <button 
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Anterior
              </button>
              <div>
                Página {paginaActual} de {totalPaginas}
              </div>
              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h2>{isEditMode ? 'Editar Producto' : 'Agregar Producto'}</h2>
            <form onSubmit={isEditMode ? handleActualizarProducto : handleAgregarProducto}>
              <label>Nombre del Producto</label>
              <input
                type="text"
                name="Nombre_Producto"
                value={nuevoProducto.Nombre_Producto}
                onChange={handleInputChangeNuevoProducto}
                required
              />
              <label>Descripción</label>
              <input
                type="text"
                name="Descripcion"
                value={nuevoProducto.Descripcion}
                onChange={handleInputChangeNuevoProducto}
                required
              />
              <label>Precio</label>
              <input
                type="number"
                name="Precio"
                value={nuevoProducto.Precio}
                onChange={handleInputChangeNuevoProducto}
                required
              />
              <label>Stock</label>
              <input
                type="number"
                name="Stock"
                value={nuevoProducto.Stock}
                onChange={handleInputChangeNuevoProducto}
                required
              />
              <label>Talla</label>
              <input
                type="text"
                name="Talla"
                value={nuevoProducto.Talla}
                onChange={handleInputChangeNuevoProducto}
                required
              />
              <label>Color</label>
              <input
                type="text"
                name="Color"
                value={nuevoProducto.Color}
                onChange={handleInputChangeNuevoProducto}
                required
              />
              <label>Imagen URL</label>
              <input
                type="url"
                name="ImagenUrl"
                value={nuevoProducto.ImagenUrl}
                onChange={handleImageUrlChange}
                required
              />
              {imagePreview && <img src={imagePreview} alt="Vista previa" className="image-preview" />}
              <label>Categoría</label>
              <input
                type="text"
                name="Categoria"
                value={nuevoProducto.Categoria}
                onChange={handleInputChangeNuevoProducto}
                required
              />
              <label>Marca</label>
              <input
                type="text"
                name="Marca"
                value={nuevoProducto.Marca}
                onChange={handleInputChangeNuevoProducto}
                required
              />
              <div className="actions">
                <button type="submit">
                  {isEditMode ? 'Actualizar Producto' : 'Agregar Producto'}
                </button>
                <button
                  type="button"
                  className="close-modal"
                  onClick={handleCerrarModal}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductosComponent;
