import { useEffect, useState } from "react";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import ProductPreviewModal from './ProductPreviewModal';
import "./ListaProductos.css";
import { useConnectivity } from '../../context/ConnectivityProvider';

const ListaProductos = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const { isOnline, showNotification } = useConnectivity();
  

  const userId = localStorage.getItem('userId');
  const storeId = localStorage.getItem('IdTienda');


  const syncPendingCartItems = async () => {
    try {
      const pendingItems = JSON.parse(localStorage.getItem('pendingCartItems') || '[]');
      if (pendingItems.length === 0) return;
  
      for (const item of pendingItems) {
        await fetch('http://localhost:3000/carrito', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      }
  
      localStorage.removeItem('pendingCartItems');
      showNotification(
        'Sincronización Completada',
        'Los productos se han añadido al carrito',
        'success'
      );
    } catch (error) {
      console.error("Error al sincronizar carrito:", error);
    }
  };
 
  useEffect(() => {
    const fetchProducts = async () => {
        if (!userId || !storeId) {
            setError('ID de usuario o tienda no encontrados.');
            showNotification('Error', 'ID de usuario o tienda no encontrados', 'error');
            setLoading(false);
            return;
        }

        if (!isOnline) {
            const combinedProducts = localStorage.getItem('combinedProducts');
            if (combinedProducts) {
                const parsed = JSON.parse(combinedProducts);
                setProducts(parsed);
                findFeaturedOffers(parsed);
                showNotification('Modo Offline', 'Mostrando productos guardados localmente', 'info');
            }
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:3000/producto/tienda?ID_Usuario=${userId}&ID_Tienda=${storeId}`,
                { headers: { 'Cache-Control': 'no-cache' } }
            );
            if (!response.ok) throw new Error('Error al obtener productos');

            const data = await response.json();
            localStorage.setItem('cachedProducts', JSON.stringify(data));
            await fetchOffers(data);
        } catch (err) {
            const combinedProducts = localStorage.getItem('combinedProducts');
            if (combinedProducts) {
                const parsed = JSON.parse(combinedProducts);
                setProducts(parsed);
                findFeaturedOffers(parsed);
            }
            setError('Error al obtener productos: ' + err.message);
            showNotification('Error', 'No se pudieron cargar los productos', 'error');
            setLoading(false);
        }
    };

    fetchProducts();

    const intervalId = setInterval(() => {
        if (isOnline) {
            fetchProducts();
        }
    }, 60000);

    return () => clearInterval(intervalId);
}, [userId, storeId, isOnline]);


  const fetchOffers = async (products) => {
    try {
        const response = await fetch(`http://localhost:3000/oferta/tienda/${storeId}`);
        if (!response.ok) throw new Error('Error al obtener ofertas');

        const offersData = await response.json();
        localStorage.setItem('cachedOffers', JSON.stringify(offersData));

        const currentDate = new Date();
        const activeOffers = offersData.filter(offer =>
            offer.Activo === 1 &&
            new Date(offer.Fecha_Inicio) <= currentDate &&
            new Date(offer.Fecha_Fin) >= currentDate
        );

        const combinedProducts = products.map(product => {
            const offer = activeOffers.find(offer => offer.ID_Producto === product.ID_Producto);
            return {
                ...product,
                Oferta: offer ? true : false,
                Descuento: offer ? offer.Descuento : 0,
                Tipo_Oferta: offer ? offer.Tipo_Oferta : null,
            };
        });

        localStorage.setItem('combinedProducts', JSON.stringify(combinedProducts));
        localStorage.setItem('lastUpdate', Date.now().toString());

        setProducts(combinedProducts);
        findFeaturedOffers(combinedProducts);
        setLoading(false);
    } catch (err) {
        setError('Error al obtener ofertas: ' + err.message);
        setLoading(false);
    }
};


  const findFeaturedOffers = (products) => {
    const offers = products.filter(product => product.Oferta);

    const discountOffers = offers.filter(product => product.Descuento > 0);
    const twoForOneOffers = offers.filter(product => product.Tipo_Oferta === '2x1');

    const sortedDiscounts = discountOffers.sort((a, b) => b.Descuento - a.Descuento);

    let highlighted;
    if (twoForOneOffers.length > 0) {
      const highestTwoForOne = twoForOneOffers[0];
      const topDiscounts = sortedDiscounts.slice(0, 4);
      highlighted = [...topDiscounts, highestTwoForOne];
    } else {
      highlighted = sortedDiscounts.slice(0, 5);
    }

    setFeaturedOffers(highlighted);

    setProducts(products);
  };

  const handleAddToCart = async (productId) => {
    const product = products.find(product => product.ID_Producto === productId);
    if (!product) return;
  
    const cartItem = {
      ID_Usuario: userId,
      ID_Producto: product.ID_Producto,
      Cantidad: 1,
    };
  
    if (!isOnline) {
      const pendingItems = JSON.parse(localStorage.getItem('pendingCartItems') || '[]');
      pendingItems.push(cartItem);
      localStorage.setItem('pendingCartItems', JSON.stringify(pendingItems));
      
      showNotification(
        'Guardado Localmente',
        'El producto se agregará al carrito cuando vuelva la conexión',
        'info'
      );
      return;
    }
  
    try {
      const response = await fetch('http://localhost:3000/carrito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cartItem),
      });
  
      if (!response.ok) throw new Error('Error al agregar el producto al carrito');
  
      Toastify({
        text: `${product.Nombre_Producto} ha sido añadido al carrito.`,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: '##2ecc71',
      }).showToast();
    } catch (error) {
      console.error("Error al agregar al carrito:", error);
      Toastify({
        text: `Error al añadir ${product.Nombre_Producto} al carrito.`,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: '#FF5733',
      }).showToast();
    }
  };

  const handlePreview = (product) => {
    setSelectedProduct(product);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
  };

  useEffect(() => {
    if (isOnline) {
      syncPendingCartItems();
    }
  }, [isOnline]);

  const formatPrice = (price) => {
    return `$${price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  const formatSoldCount = (count) => {
    return count > 99 ? count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : count;
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="lista-productos-container">
    {featuredOffers.length > 0 && (
      <div className="ofertas-destacadas">
        <h2 className="titulo-ofertas-destacadas">Ofertas Destacadas</h2>
        <div className="lista-productos">
          {featuredOffers.map(offer => (
            <div key={offer.ID_Producto}
              className="tarjeta-producto-destacada"
              onMouseEnter={() => setHoveredProductId(offer.ID_Producto)}
              onMouseLeave={() => setHoveredProductId(null)}>
              <img 
                src={`http://localhost:3000/uploads/products/${offer.Imagen}`} 
                alt={offer.Nombre_Producto} 
                className="imagen-producto" 
              />
              <div className="detalles-producto">
                <h3 className="nombre-producto">{offer.Nombre_Producto}</h3>
                {offer.Tipo_Oferta === '2x1' ? (
                  <p className="oferta-dos-por-uno" style={{ color: 'black' }}>
                    {formatPrice(offer.Precio)} <span style={{ fontSize: '0.8em', color: 'green' }}>2x1 OFF</span>
                  </p>
                ) : (
                  <>
                    <p className="precio-original" style={{ textDecoration: 'line-through', color: 'gray' }}>
                      {formatPrice(offer.Precio)}
                    </p>
                    <p className="precio-descuento" style={{ color: 'black', fontWeight: 'bold' }}>
                      {formatPrice(offer.Precio - (offer.Precio * (offer.Descuento / 100)))} 
                      <span style={{ fontSize: '0.8em', color: 'red' }}> ({offer.Descuento}% OFF)</span>
                    </p>
                  </>
                )}
                <div className="contenedor-botones">
                  <button 
                    onClick={() => handleAddToCart(offer.ID_Producto)} 
                    className="boton-agregar-carrito"
                  >
                    Añadir al carrito
                  </button>
                  <button 
                    onClick={() => handlePreview(offer)} 
                    className="boton-previsualizar"
                  >
                    Previsualizar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
      <div className="lista-productos">
        {products.filter(product => product.Stock > 0).map(product => {
          const isFeatured = featuredOffers.some(offer => offer.ID_Producto === product.ID_Producto);
          return (
            <div key={product.ID_Producto} className={`tarjeta-producto ${isFeatured ? 'destacada' : ''}`}
              onMouseEnter={() => setHoveredProductId(product.ID_Producto)}
              onMouseLeave={() => setHoveredProductId(null)}>
              <img src={`http://localhost:3000/uploads/products/${product.Imagen}`} alt={product.Nombre_Producto} className="imagen-producto" />
              <div className="detalles-producto">
                <h3 className="nombre-producto">{product.Nombre_Producto}</h3>
                {product.Oferta ? (
                  <>
                    {product.Tipo_Oferta === '2x1' ? (
                      <p className="oferta-dos-por-uno" style={{ color: 'black' }}>
                        {formatPrice(product.Precio)}
                        <span style={{ fontSize: '0.8em', color: 'green' }}>2x1 OFF</span>
                      </p>
                    ) : (
                      <>
                        <p className="precio-original" style={{ textDecoration: 'line-through', color: 'gray' }}>
                          {formatPrice(product.Precio)}
                        </p>
                        <p className="precio-descuento" style={{ color: 'black' }}>
                          {formatPrice(product.Precio - (product.Precio * (product.Descuento / 100)))}
                          <span style={{ fontSize: '0.8em', color: 'red' }}> ({product.Descuento}% OFF)</span>
                        </p>
                      </>
                    )}
                  </>
                ) : (
                  <p className="precio-producto">{formatPrice(product.Precio)}</p>
                )}

                <div className={`contenedor-botones ${hoveredProductId === product.ID_Producto ? 'visible' : ''}`}>
                <button 
                  onClick={() => handleAddToCart(product.ID_Producto)} 
                  className="boton-agregar-carrito"
                >
                  Añadir al carrito
                </button>
                <button 
                  onClick={() => handlePreview(product)} 
                  className="boton-previsualizar"
                >
                  Previsualizar
                </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {modalVisible && (
        <ProductPreviewModal 
          product={selectedProduct} 
          onClose={closeModal} 
          handleAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default ListaProductos;
