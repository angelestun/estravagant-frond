import { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom'; 
import axios from 'axios';
import './CartComponent.css';
import { useConnectivity } from '../../context/ConnectivityProvider';



const CartComponent = ({ cartItems, setCartItems }) => {
    const { isOnline, showNotification } = useConnectivity();  
    const [productsWithoutOffers, setProductsWithoutOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const userData = localStorage.getItem('userId');

    const getFromCache = () => {
        const cachedProducts = localStorage.getItem('productsWithoutOffers');
        const lastUpdate = localStorage.getItem('productsWithoutOffersTimestamp');
        const shouldUpdate = !lastUpdate || Date.now() - parseInt(lastUpdate) > 5000;

        return {
            cached: cachedProducts ? JSON.parse(cachedProducts) : null,
            shouldUpdate
        };
    };


    const loadAllData = async (force = false) => {
        if (!userData || (!force && !isOnline)) {
            setIsLoading(false);
            return;
        }

        try {
            const [cartResponse, productsResponse] = await Promise.all([
                axios.get(`https://extravagant-back-1.onrender.com/carrito/${userData}`),
                axios.get(`https://extravagant-back-1.onrender.com/carrito-sin-oferta/${userData}`)
            ]);

            if (cartResponse.status === 200) {
                const newCartItems = cartResponse.data;
                if (JSON.stringify(newCartItems) !== JSON.stringify(cartItems)) {
                    setCartItems(newCartItems);
                    localStorage.setItem('cartItems', JSON.stringify(newCartItems));
                }
            }

            if (productsResponse.status === 200) {
                const newProductsData = Array.isArray(productsResponse.data) ? productsResponse.data : [];
                if (JSON.stringify(newProductsData) !== JSON.stringify(productsWithoutOffers)) {
                    setProductsWithoutOffers(newProductsData);
                    localStorage.setItem('productsWithoutOffers', JSON.stringify(newProductsData));
                    localStorage.setItem('productsWithoutOffersTimestamp', Date.now().toString());
                }
            }
        } catch (error) {
            console.error("Error al cargar datos:", error);
            try {
                const savedCartItems = localStorage.getItem('cartItems');
                const savedProductsWithoutOffers = localStorage.getItem('productsWithoutOffers');

                if (savedCartItems) {
                    setCartItems(JSON.parse(savedCartItems));
                }
                if (savedProductsWithoutOffers) {
                    setProductsWithoutOffers(JSON.parse(savedProductsWithoutOffers));
                }
            } catch (parseError) {
                console.error("Error al cargar desde localStorage:", parseError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAllData(true);

        const handleOnline = () => {
            loadAllData(true);
        };
        window.addEventListener('online', handleOnline);

        const intervalId = setInterval(() => {
            if (isOnline) {
                loadAllData(false);
            }
        }, 5000);

        return () => {
            window.removeEventListener('online', handleOnline);
            clearInterval(intervalId);
        };
    }, [isOnline, userData]);

    useEffect(() => {
        if (!userData) {
            console.error("No se encontró userId en localStorage");
            setIsLoading(false);
            return;
        }

        const { cached, shouldUpdate } = getFromCache();
        if (cached) {
            setProductsWithoutOffers(cached);
            setIsLoading(false);
            if (!shouldUpdate) return;
        }

        const fetchData = async () => {
            if (!isOnline) {
                showNotification('Modo Offline', 'Usando datos guardados localmente', 'info');
                return;
            }
        
            try {
                const [cartResponse, productsResponse] = await Promise.all([
                    axios.get(`https://extravagant-back-1.onrender.com/carrito/${userData}`),
                    axios.get(`https://extravagant-back-1.onrender.com/carrito-sin-oferta/${userData}`)
                ]);
        
                if (cartResponse.status === 200) {
                    setCartItems(cartResponse.data);
                }
        
                if (productsResponse.status === 200) {
                    const productsData = Array.isArray(productsResponse.data) ? productsResponse.data : [];
                    setProductsWithoutOffers(productsData);
                    localStorage.setItem('productsWithoutOffers', JSON.stringify(productsData));
                    localStorage.setItem('productsWithoutOffersTimestamp', Date.now().toString());
                }
            } catch (error) {
                showNotification('Error de Conexión', 'No se pudieron cargar los datos más recientes', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();

        const intervalId = setInterval(() => {
            if (isOnline) {
                const { shouldUpdate } = getFromCache();
                if (shouldUpdate) fetchData();
            }
        }, 5000); 

        return () => clearInterval(intervalId);
    }, [userData, isOnline]);

    useEffect(() => {
    }, [isOnline]);

    const handleCheckout = () => {
        if (!isOnline) {
            showNotification(
                'Conexión Requerida',
                'Se necesita conexión a Internet para continuar con la compra',
                'warning'
            );
            return;
        }
        navigate('/checkout', { state: { cartItems: [...cartItems, ...productsWithoutOffers] } });
    };

    const calculateTotal = () => {
        const cartTotal = Array.isArray(cartItems) ? cartItems.reduce((acc, item) => {
            const precioFinal = item.Descuento ? 
                item.Precio - (item.Precio * (item.Descuento / 100)) : 
                item.Precio;
            return acc + (precioFinal * item.Cantidad);
        }, 0) : 0;
    
        const productsTotal = Array.isArray(productsWithoutOffers) ? 
            productsWithoutOffers.reduce((acc, item) => {
                return acc + (item.Precio * item.Cantidad);
            }, 0) : 0;
    
        return cartTotal + productsTotal;
    };
    

    const totalQuantity = () => {
        const cartCount = cartItems.reduce((acc, item) => acc + item.Cantidad, 0);
        const productsCount = Array.isArray(productsWithoutOffers) 
            ? productsWithoutOffers.reduce((acc, item) => acc + item.Cantidad, 0)
            : 0; 
    
        return cartCount + productsCount;
    };
    const formatNumber = (number) => {
        return number.toString().replace(/\B(?=(\d{3})+(?!))/g, ",");
    };

    const updateSubtotal = (item) => {
        const precioFinal = item.Descuento ? item.Precio - (item.Precio * (item.Descuento / 100)) : item.Precio;
        return (precioFinal * item.Cantidad).toFixed(2);
    };
    const syncCartWithDB = async (updatedCartItems) => {
        if (!userData || !isOnline) {
            if (!isOnline) {
                const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
                pendingChanges.push({
                    type: 'UPDATE_CART',
                    data: updatedCartItems,
                    timestamp: Date.now()
                });
                localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
                showNotification(
                    'Sin Conexión',
                    'Los cambios se guardarán cuando vuelva la conexión',
                    'warning'
                );
            }
            return;
        }
        
        try {
            const response = await axios.put(
                `https://extravagant-back-1.onrender.com/carrito/${userData}`, 
                { items: updatedCartItems },
                { 
                    timeout: 5000,
                    headers: { 'Cache-Control': 'no-cache' }
                }
            );
            
            if (response.status === 200) {
                localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
            }
        } catch (error) {
            if (!navigator.onLine || error.code === 'ECONNABORTED') {
                const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
                pendingChanges.push({
                    type: 'UPDATE_CART',
                    data: updatedCartItems,
                    timestamp: Date.now()
                });
                localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
                showNotification(
                    'Sin Conexión',
                    'Los cambios se guardarán cuando vuelva la conexión',
                    'warning'
                );
            } else {
                console.error("Error al sincronizar el carrito:", error);
                showNotification(
                    'Error de Sincronización',
                    'No se pudieron guardar los cambios',
                    'error'
                );
            }
        }
    };
    
    const syncPendingChanges = async () => {
        try {
            const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
            if (pendingChanges.length === 0) return;
    
            for (const change of pendingChanges) {
                switch (change.type) {
                    case 'UPDATE_CART': {
                        let response = await axios.put(
                            `https://extravagant-back-1.onrender.com/carrito/${userData}`,
                            { items: change.data }
                        );
                        if (response.status === 200) {
                            setCartItems(response.data.items || change.data);
                            localStorage.setItem('cartItems', JSON.stringify(response.data.items || change.data));
                        }
                        break;
                    }
                    case 'UPDATE_PRODUCTS_WITHOUT_OFFERS': {
                        let response = await axios.put(
                            `https://extravagant-back-1.onrender.com/carrito-sin-oferta/${userData}`,
                            { items: change.data }
                        );
                        if (response.status === 200) {
                            setProductsWithoutOffers(response.data || change.data);
                            localStorage.setItem('productsWithoutOffers', JSON.stringify(response.data || change.data));
                        }
                        break;
                    }
                    case 'REMOVE_ITEM': {
                        await axios.delete('https://extravagant-back-1.onrender.com/carrito', {
                            data: {
                                ID_Usuario: change.data.userId,
                                ID_Producto: change.data.productId,
                            },
                        });
                        
                        if (change.data.isProductWithoutOffer) {
                            const response = await axios.get(
                                `https://extravagant-back-1.onrender.com/carrito-sin-oferta/${userData}`
                            );
                            if (response.status === 200) {
                                setProductsWithoutOffers(response.data);
                                localStorage.setItem('productsWithoutOffers', JSON.stringify(response.data));
                            }
                        } else {
                            const response = await axios.get(
                                `https://extravagant-back-1.onrender.com/carrito/${userData}`
                            );
                            if (response.status === 200) {
                                setCartItems(response.data);
                                localStorage.setItem('cartItems', JSON.stringify(response.data));
                            }
                        }
                        break;
                    }
                }
            }
    
            localStorage.removeItem('pendingChanges');
            showNotification(
                'Sincronización Completada',
                'Los cambios se han guardado correctamente',
                'success'
            );
    
        } catch (error) {
            console.error("Error al sincronizar cambios pendientes:", error);
            showNotification(
                'Error de Sincronización',
                'Algunos cambios no pudieron sincronizarse',
                'error'
            );
        }
    };

    
    useEffect(() => {
        const handleOnline = async () => {
            await syncPendingChanges();
        };
    
        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, []);
    
    const syncProductsWithoutOffersWithDB = async (updatedProducts) => {
        if (!userData) return;
        
        try {
            await axios.put(`https://extravagant-back-1.onrender.com/carrito-sin-oferta/${userData}`, { items: updatedProducts });
            localStorage.setItem('productsWithoutOffers', JSON.stringify(updatedProducts));
            localStorage.setItem('productsWithoutOffersTimestamp', Date.now().toString());
        } catch (error) {
            console.error("Error al sincronizar productos sin oferta:", error);
            localStorage.setItem('productsWithoutOffers', JSON.stringify(updatedProducts));
        }
    };
    
    const changeQuantity = async (productId, isIncrease) => {
        const updatedCartItems = cartItems.map(item => {
            if (item.ID_Producto === productId) {
                const newQuantity = isIncrease ? item.Cantidad + 1 : Math.max(1, item.Cantidad - 1);
                return { ...item, Cantidad: newQuantity };
            }
            return item;
        });
    
        setCartItems([...updatedCartItems]);
        
        localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
        
        if (!isOnline) {
            const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
            const filteredChanges = pendingChanges.filter(
                change => !(change.type === 'UPDATE_CART' && 
                change.data.some(item => item.ID_Producto === productId))
            );
            filteredChanges.push({
                type: 'UPDATE_CART',
                data: updatedCartItems,
                timestamp: Date.now()
            });
            localStorage.setItem('pendingChanges', JSON.stringify(filteredChanges));
            showNotification(
                'Cambios Guardados Localmente',
                'Se sincronizará cuando vuelva la conexión',
                'info'
            );
        } else {
            await syncCartWithDB(updatedCartItems);
        }
    };

     const changeQuantityWithoutOffers = async (productId, isIncrease) => {
        const updatedProducts = productsWithoutOffers.map(item => {
            if (item.ID_Producto === productId) {
                const newQuantity = isIncrease ? item.Cantidad + 1 : Math.max(1, item.Cantidad - 1);
                return { ...item, Cantidad: newQuantity };
            }
            return item;
        });
        
        setProductsWithoutOffers([...updatedProducts]);
        
        localStorage.setItem('productsWithoutOffers', JSON.stringify(updatedProducts));
        localStorage.setItem('productsWithoutOffersTimestamp', Date.now().toString());
        
        if (!isOnline) {
            const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
            const filteredChanges = pendingChanges.filter(
                change => !(change.type === 'UPDATE_PRODUCTS_WITHOUT_OFFERS' && 
                change.data.some(item => item.ID_Producto === productId))
            );
            filteredChanges.push({
                type: 'UPDATE_PRODUCTS_WITHOUT_OFFERS',
                data: updatedProducts,
                timestamp: Date.now()
            });
            localStorage.setItem('pendingChanges', JSON.stringify(filteredChanges));
            showNotification(
                'Cambios Guardados Localmente',
                'Se sincronizará cuando vuelva la conexión',
                'info'
            );
        } else {
            await syncProductsWithoutOffersWithDB(updatedProducts);
        }
    };
    

    const removeFromCart = async (productId) => {
        if (!userData) return;
        
        const isProductWithoutOffer = productsWithoutOffers.some(
            item => item.ID_Producto === productId
        );
        
        if (isProductWithoutOffer) {
            const updatedProducts = productsWithoutOffers.filter(
                item => item.ID_Producto !== productId
            );
            setProductsWithoutOffers(updatedProducts);
            localStorage.setItem('productsWithoutOffers', JSON.stringify(updatedProducts));
        } else {
            const updatedCartItems = cartItems.filter(
                item => item.ID_Producto !== productId
            );
            setCartItems(updatedCartItems);
            localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));
        }
        
        if (!isOnline) {
            const pendingChanges = JSON.parse(localStorage.getItem('pendingChanges') || '[]');
            pendingChanges.push({
                type: 'REMOVE_ITEM',
                data: { 
                    productId, 
                    userId: userData,
                    isProductWithoutOffer
                },
                timestamp: Date.now()
            });
            localStorage.setItem('pendingChanges', JSON.stringify(pendingChanges));
            showNotification(
                'Producto Eliminado Localmente',
                'Se sincronizará cuando vuelva la conexión',
                'info'
            );
        } else {
            try {
                await axios.delete('https://extravagant-back-1.onrender.com/carrito', {
                    data: {
                        ID_Usuario: userData,
                        ID_Producto: productId,
                    },
                });
                
                if (isProductWithoutOffer) {
                    const response = await axios.get(
                        `https://extravagant-back-1.onrender.com/carrito-sin-oferta/${userData}`
                    );
                    if (response.status === 200) {
                        setProductsWithoutOffers(response.data);
                        localStorage.setItem('productsWithoutOffers', JSON.stringify(response.data));
                    }
                } else {
                    const response = await axios.get(
                        `https://extravagant-back-1.onrender.com/carrito/${userData}`
                    );
                    if (response.status === 200) {
                        setCartItems(response.data);
                        localStorage.setItem('cartItems', JSON.stringify(response.data));
                    }
                }
            } catch (error) {
                console.error("Error al eliminar producto:", error);
                showNotification(
                    'Error',
                    'No se pudo eliminar el producto del servidor',
                    'error'
                );
            }
        }
    };
    
    const handleDiscoverProducts = () => {
        navigate('/store');
    };
    return (
        <div className="cart-container">
            <h2>Carrito de Compras ({totalQuantity()})</h2>
            {isLoading ? (
                <div className="loading-container">
                    <p>Cargando carrito...</p>
                </div>
            ) : cartItems.length === 0 && productsWithoutOffers.length === 0 ? (
                <div>
                    <p>El carrito está vacío.</p>
                    <button className="continue-button" onClick={handleDiscoverProducts}>
                        Descubrir Productos
                    </button>
                </div>
            ) : (
                <div className="cart-list">
                    {cartItems.map((item) => {
                        const subtotal = updateSubtotal(item);
                        const isTwoForOne = item.Tipo_Oferta === '2x1';
                        const hasDiscount = item.Descuento;

                        return (
                            <div key={item.ID_Producto} className="cart-item">
                                <img 
                                src={item.Imagen ? item.Imagen : 'http://via.placeholder.com/150'} 
                                alt={item.Nombre_Producto || "Producto sin nombre"} 
                                className="cart-item-image"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'http://via.placeholder.com/150';
                                }}
                                />
                                <div className="cart-item-details">
                                    <h3>{item.Nombre_Producto || "Nombre no disponible"}</h3>

                                    {isTwoForOne ? (
                                        <p className="item-discounted-price">
                                            ${formatNumber(subtotal)} 
                                            <span style={{ color: 'green', fontSize: '0.9rem' }} className="discount-label">
                                                (2x1)
                                            </span>
                                        </p>
                                    ) : hasDiscount ? (
                                        <>
                                            <p className="item-original-price">
                                                ${formatNumber((item.Precio * item.Cantidad).toFixed(2))}
                                            </p>
                                            <p className="item-discounted-price">
                                                ${formatNumber(subtotal)} 
                                                <span style={{ color: 'red', fontSize: '0.9rem' }}>
                                                    ({item.Descuento}% OFF)
                                                </span>
                                            </p>
                                        </>
                                    ) : (
                                        <p className="item-price">${formatNumber(subtotal)}</p>
                                    )}

                                    <p className="item-store-name">
                                        {item.NombreTienda || "Tienda no disponible"}
                                    </p>

                                    <div className="quantity-control">
                                        <button 
                                            onClick={() => changeQuantity(item.ID_Producto, false)}
                                            className="quantity-button"
                                            disabled={isLoading}
                                        >
                                            -
                                        </button>
                                        <span className="quantity-display">{item.Cantidad}</span>
                                        <button 
                                            onClick={() => changeQuantity(item.ID_Producto, true)}
                                            className="quantity-button"
                                            disabled={isLoading}
                                        >
                                            +
                                        </button>
                                    </div>
                                    <button 
                                        className="remove-button" 
                                        onClick={() => removeFromCart(item.ID_Producto)}
                                        disabled={isLoading}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                   
                    {productsWithoutOffers.length > 0 && (
                        <div>
                            {productsWithoutOffers.map((item) => {
                                const subtotal = (item.Precio * item.Cantidad).toFixed(2);
                                return (
                                    <div key={item.ID_Producto} className="cart-item">
                                        <img 
                                            src={item.Imagen?.trim() ? 
                                                `https://extravagant-back-1.onrender.com/uploads/products/${item.Imagen}` : 
                                                'http://via.placeholder.com/150'
                                            } 
                                            alt={item.Nombre_Producto || "Producto sin nombre"} 
                                            className="cart-item-image"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'http://via.placeholder.com/150';
                                            }}
                                        />
                                        <div className="cart-item-details">
                                            <h3>{item.Nombre_Producto || "Nombre no disponible"}</h3>
                                            <p className="item-price">${formatNumber(subtotal)}</p>
                                            <p className="item-store-name">
                                                {item.NombreTienda || "Tienda no disponible"}
                                            </p>

                                            <div className="quantity-control">
                                                <button 
                                                    onClick={() => changeQuantityWithoutOffers(item.ID_Producto, false)}
                                                    className="quantity-button"
                                                    disabled={isLoading}
                                                >
                                                    -
                                                </button>
                                                <span className="quantity-display">{item.Cantidad}</span>
                                                <button 
                                                    onClick={() => changeQuantityWithoutOffers(item.ID_Producto, true)}
                                                    className="quantity-button"
                                                    disabled={isLoading}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button 
                                                className="remove-button" 
                                                onClick={() => removeFromCart(item.ID_Producto)}
                                                disabled={isLoading}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
                    {(cartItems.length > 0 || productsWithoutOffers.length > 0) && !isLoading && (
                        <div className="summary-container">
                            <h3>Total: ${formatNumber(calculateTotal().toFixed(2))}</h3>
                            <button 
                                className={`continue-button ${!isOnline ? 'offline-button' : ''}`}
                                onClick={() => {
                                    if (!isOnline) {
                                        showNotification(
                                            'Conexión Requerida',
                                            'Se necesita conexión a Internet para continuar con la compra',
                                            'warning'
                                        );
                                        return;
                                    }
                                    handleCheckout();
                                }}
                                disabled={isLoading}
                            >
                                Continuar Compra
                            </button>
                        </div>
                    )}
                    </div>
                );
            };
export default CartComponent;