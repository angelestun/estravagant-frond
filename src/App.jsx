import React, { Suspense, useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import './styles/tailwind.css';


// import './styles/dashboard.css';
import "/src/styles/connectivity.css";
import { BrowserRouter as Router, Route, Routes, Link, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faHome, faShoePrints, faUser, faSignOutAlt, faStore, faTicket, faTicketAlt } from '@fortawesome/free-solid-svg-icons';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import { ConnectivityProvider } from './context/ConnectivityProvider';
import ErrorBoundary from './utils/ErrorBoundary';
import { subscribeToPushNotifications, checkSubscriptionStatus } from './services/pushNotifications';
import NotificationTester from './Components/NotificationTester/NotificationTester';


import LoginComponent from './Components/LoginComponent/LoginComponent';
import RegistroComponent from './Components/RegistroComponent/RegistroComponent';
import HomeComponent from './Components/HomeComponent/HomeComponent';
import ProductosComponent from './Components/ProductosComponent/ProductosComponent';
import ProductListComponent from './Components/ProductListComponent/ProductListComponent';
import LandingPage from './Components/LandingPage/LandigPage';
import CartComponent from './Components/CartComponent/CartComponent';
import PerfilComponent from './Components/PerfilComponent/PerfilComponent';
import PedidosComponent from './Components/PedidosComponent/PedidosComponent';
import UsuariosComponent from './Components/UsuariosComponent/UsuariosComponent';
import StoreListComponent from './Components/StoreListComponent/StoreListComponent';
import Checkout from './Components/Checkout/Checkout';
import CuponesComponent from './Components/CuponesComponent/CuponesComponent';
import CouponForm from './Components/CouponForm/CouponForm';
import SellerProfileComponent from './Components/SellerProfileComponent/SellerProfileComponent';
import ApproveStoresComponent from './Components/ApproveStoresComponent/ApproveStoresComponent';
import ApprovedStoresComponent from './Components/ApprovedStoresComponent/ApprovedStoresComponent';
import ApproveCouponsComponent from './Components/ApproveCouponsComponent/ApproveCouponsComponent';
import ApprovedCouponsComponent from './Components/ApprovedCouponsComponent/ApprovedCouponsComponent';
import ListaProductos from './Components/ListaProductos/ListaProductos';
import OfferManager from './Components/OfferManager/OfferManager'
import PayPalButtonComponent from './Components/PayPalButtonComponent/PayPalButtonComponent';
import Confirmation from "./Components/Confirmation/Confirmation"; 
import ServiceWorkerStatus from "./ServiceWorkerStatus";
import VendorDashboard from "./Components/VendorDashboard/VendorDashboard";
import AdminDashboard from "./Components/AdminDashboard/AdminDashboard";
import NotificationBell from './NotificationBell/NotificationBell';
import QuienesSomos from './Components/QuienesSomos/QuienesSomos';

function App() {
  
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [productsWithoutOffers, setProductsWithoutOffers] = useState([]); 
  const [total, setTotal] = useState(0); 
  const [userId, setUserId] = useState(localStorage.getItem('userId'));
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    try {
        const savedCartString = localStorage.getItem('cart');
        const savedProductsString = localStorage.getItem('productsWithoutOffers');
    
        const savedCart = savedCartString ? JSON.parse(savedCartString) : [];
        const savedProductsWithoutOffers = savedProductsString ? JSON.parse(savedProductsString) : [];
    
        setCart(savedCart);
        setProductsWithoutOffers(savedProductsWithoutOffers);
        setTotal(calculateTotal(savedCart, savedProductsWithoutOffers));
    } catch (error) {
        console.error('Error al cargar datos del localStorage:', error);
        setCart([]);
        setProductsWithoutOffers([]);
        setTotal(0);
    }
}, []);

  const calculateTotal = (cartItems = [], productsWithoutOffers = []) => {
    const cartTotal = Array.isArray(cartItems) 
      ? cartItems.reduce((sum, item) => sum + (item.Precio * item.Cantidad), 0)
      : 0;
    
 
    const productsTotal = Array.isArray(productsWithoutOffers) 
      ? productsWithoutOffers.reduce((sum, item) => sum + (item.Precio * item.Cantidad), 0)
      : 0;

    return cartTotal + productsTotal;
  };


  const calculateTotalQuantity = () => {
    const cartQuantity = Array.isArray(cart) 
      ? cart.reduce((count, item) => count + item.Cantidad, 0)
      : 0;

    const productsQuantity = Array.isArray(productsWithoutOffers) 
      ? productsWithoutOffers.reduce((count, item) => count + item.Cantidad, 0)
      : 0;

    return cartQuantity + productsQuantity;
  };

  const updateCart = async (updatedCart, updatedProductsWithoutOffers) => {
    setCart(updatedCart);
    setProductsWithoutOffers(updatedProductsWithoutOffers);
    setTotal(calculateTotal(updatedCart, updatedProductsWithoutOffers));
    
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    localStorage.setItem('productsWithoutOffers', JSON.stringify(updatedProductsWithoutOffers));
};

const addToCart = async (product) => {
    setCart(prevCart => {
        const existingProduct = prevCart.find(item => item.ID_Producto === product.ID_Producto);
        const updatedCart = existingProduct
            ? prevCart.map(item =>
                item.ID_Producto === product.ID_Producto
                    ? { ...item, Cantidad: item.Cantidad + 1 }
                    : item
            )
            : [...prevCart, { ...product, Cantidad: 1 }];
        
        updateCart(updatedCart, productsWithoutOffers);
        return updatedCart;
    });
};

const removeFromCart = async (productId) => {
    setCart(prevCart => {
        const updatedCart = prevCart.filter(item => item.ID_Producto !== productId);
        updateCart(updatedCart, productsWithoutOffers);
        return updatedCart;
    });
};




useEffect(() => {
  if (!userId) return; 

  const fetchProductsWithoutOffers = async () => {
    try {
      const response = await axios.get(`https://extravagant-back-tidu.vercel.app/carrito-sin-oferta/${userId}`);
      const fetchedProducts = response.data || [];
      setProductsWithoutOffers(fetchedProducts); 
      localStorage.setItem('productsWithoutOffers', JSON.stringify(fetchedProducts)); 
      setTotal(calculateTotal(cart, fetchedProducts)); 
    } catch (error) {
      console.error("Error al obtener productos sin oferta", error);
    }
  };
  
  fetchProductsWithoutOffers();

  const interval = setInterval(fetchProductsWithoutOffers, 1000); 

  return () => clearInterval(interval);
}, [userId]); 
  
  const cartCount = calculateTotalQuantity();

  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleStop = () => setIsLoading(false);

    window.addEventListener('popstate', handleStart);
    window.addEventListener('load', handleStop);
    
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.addEventListener('controllerchange', () => {
          handleStop();
        });
      });
    }

    return () => {
      window.removeEventListener('popstate', handleStart);
      window.removeEventListener('load', handleStop);
    };
  }, []);

  useEffect(() => {
    const setupPushNotifications = async () => {
        try {
            const isSubscribed = await checkSubscriptionStatus();
            if (!isSubscribed) {
                await subscribeToPushNotifications();
            }
        } catch (error) {
            console.error('Error al configurar notificaciones:', error);
        }
    };

    setupPushNotifications();
}, []);


  return (
    <ErrorBoundary>
 
    <ConnectivityProvider>
    <Router>
       <ServiceWorkerStatus />
       {isLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '3px',
          background: '#7c4dff',
          zIndex: 9999,
          animation: 'loading 1s infinite'
        }} />
      )}
      <style>
        {`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      <Routes>
        
        <Route path="/login" element={<LoginComponent />} />
        <Route path="/registro" element={<RegistroComponent />} />
        <Route path="/Landing" element={<LandingPage />} />

        <Route element={<DashboardLayout cartCount={cartCount} />}>
        
          <Route path="/perfil" element={<PerfilComponent />} />
          <Route path="/" element={<HomeComponent />} />
          <Route path="/home" element={<HomeComponent />} />
          <Route path="/pedidos" element={<PedidosComponent />} />
          <Route path="/productos" element={<ProductosComponent />} />
          <Route path="/usuarios" element={<UsuariosComponent />} />
          <Route path="/store" element={<StoreListComponent />} />
          <Route path="/cupon" element={<CuponesComponent />} />
          <Route path="/ofertas" element={<OfferManager />} />
          <Route path="/cupones" element={<CouponForm />} />
          <Route path="/checkout" element={<Checkout cartItems={cart} />} />
          <Route path="/dashboard-vendor" element={<VendorDashboard />} />
          <Route path="/dashboard-admin" element={<AdminDashboard />} />
          <Route path="/confirmacion/:orderId" element={
          <Suspense fallback={<div>Cargando confirmación...</div>}>
            <Confirmation />
          </Suspense>
        } />
          <Route path="/notifications" component={NotificationBell} />
          <Route path="/quienes-somos" element={<QuienesSomos />} />
          <Route path="/paypal" element={<PayPalButtonComponent />} />
          <Route path="/test-notifications" element={<NotificationTester />} />
          <Route path="/seller" element={<SellerProfileComponent />} />
          <Route path="/aprobar-tiendas" element={<ApproveStoresComponent />} />
          <Route path="/tiendas-registradas" element={<ApprovedStoresComponent />} />
          <Route path="/aprobar-cupones" element={<ApproveCouponsComponent />} />
          <Route path="/cupones-registrados" element={<ApprovedCouponsComponent />} />
          <Route path="/lista-Productos" element={<ListaProductos addToCart={addToCart} cartItems={cart} />} />
          <Route path="/lista" element={<ProductListComponent addToCart={addToCart} cartItems={cart} />} />
          <Route path="/carro" element={<CartComponent cartItems={cart} setCartItems={updateCart} total={total} removeFromCart={removeFromCart} />} />
          </Route>
      </Routes>
    </Router>
    </ConnectivityProvider>
    </ErrorBoundary>


  );
}


function DashboardLayout({ cartCount }) {
  const userEmail = localStorage.getItem('userEmail');
  const userRole = localStorage.getItem('userRole');

  if (userEmail === 'adm@gmail.com') {
    return <AdminLayout cartCount={cartCount} />;
  } else if (userRole === 'vendedor') {
    return <VendedorLayout cartCount={cartCount} />;
  } else {
    return <UsuarioLayout cartCount={cartCount} />;
  }
}
function AdminLayout() {
  const [navbarColor, ] = useState("lila");

  return (
    <div className="dashboard">
      <Navbar variant="dark" bg={navbarColor} expand="lg" className={`navbar-${navbarColor}`}>
        <Container fluid>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Brand href="#home">
            <img src="/ES-B.png" alt="Logo Extravagant Style" style={{ height: '60px' }} />
          </Navbar.Brand>

          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/dashboard-admin" className={`nav-item-${navbarColor}`}>
                Dashboard
              </Nav.Link>
       
              <NavDropdown
                title={<span className={`nav-item-${navbarColor}`}>Cupones</span>}
                id="nav-dropdown"
                menuVariant="dark"
                className={`dropdown-${navbarColor}`}
              >
                <NavDropdown.Item as={Link} to="/cupones-registrados" className={`dropdown-item-${navbarColor}`}>
                  Cupones Registrados
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/aprobar-cupones" className={`dropdown-item-${navbarColor}`}>
                  Aprobar Cupones
                </NavDropdown.Item>
              </NavDropdown>

              <NavDropdown
                title={<span className={`nav-item-${navbarColor}`}>Tiendas</span>}
                id="nav-dropdown"
                menuVariant="dark"
                className={`dropdown-${navbarColor}`}
              >
                <NavDropdown.Item as={Link} to="/tiendas-registradas" className={`dropdown-item-${navbarColor}`}>
                  Tiendas Registradas
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/aprobar-tiendas" className={`dropdown-item-${navbarColor}`}>
                  Aprobar Tiendas
                </NavDropdown.Item>
              </NavDropdown>

              <Nav.Link as={Link} to="/usuarios" className={`nav-item-${navbarColor}`}>
                Usuarios
              </Nav.Link>
            </Nav>

            <div className="desktop-profile">
              <NavDropdown
                align="end"
                title={<FontAwesomeIcon icon={faUser} />}
                id="nav-dropdown"
                className={`dropdown-${navbarColor}`}
              >
                <NavDropdown.Item as={Link} to="/login">
                  <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
                </NavDropdown.Item>
              </NavDropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function VendedorLayout() {
  const [navbarColor] = useState("lila");

  return (
    <div className="dashboard">
      <Navbar variant="dark" bg={navbarColor} expand="lg" className={`navbar-${navbarColor}`}>
        <Container fluid>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Brand href="#home">
            <img src="/ES-B.png" alt="Logo Extravagant Style" style={{ height: '60px' }} />
          </Navbar.Brand>

          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/dashboard-vendor" className={`nav-item-${navbarColor}`}>
                Dashboard
              </Nav.Link>
              <NavDropdown 
                title={<span className={`nav-item-${navbarColor}`}>Productos</span>} 
                id="nav-dropdown" 
                menuVariant="dark" 
                className={`dropdown-${navbarColor}`}
              >
                <NavDropdown.Item as={Link} to="/productos" className={`dropdown-item-${navbarColor}`}>
                  <FontAwesomeIcon icon={faShoePrints} /> Productos
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/pedidos" className={`dropdown-item-${navbarColor}`}>
                  <FontAwesomeIcon icon={faCartShopping} /> Pedidos
                </NavDropdown.Item>
              </NavDropdown>

              <NavDropdown 
                title={<span className={`nav-item-${navbarColor}`}>Descuentos</span>} 
                id="nav-dropdown" 
                menuVariant="dark" 
                className={`dropdown-${navbarColor}`}
              >
                <NavDropdown.Item as={Link} to="/cupones" className={`dropdown-item-${navbarColor}`}>
                  <FontAwesomeIcon icon={faTicketAlt} /> Cupones
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/ofertas" className={`dropdown-item-${navbarColor}`}>
                  Ofertas
                </NavDropdown.Item>
              </NavDropdown>

              <NavDropdown 
                title={<span className={`nav-item-${navbarColor}`}>Mi tienda</span>} 
                id="nav-dropdown" 
                menuVariant="dark" 
                className={`dropdown-${navbarColor}`}
              >
                <NavDropdown.Item as={Link} to="/seller" className={`dropdown-item-${navbarColor}`}>
                  <FontAwesomeIcon icon={faStore} /> Tienda
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>

            <div className="desktop-profile">
              <NavDropdown
                align="end"
                title={<FontAwesomeIcon icon={faUser} />}
                id="nav-dropdown"
                className={`dropdown-${navbarColor}`}
              >
                <NavDropdown.Item as={Link} to="/perfil">Perfil</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/login">
                  <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
                </NavDropdown.Item>
              </NavDropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function UsuarioLayout({ cartCount }) {
  const [navbarColor] = useState("lila");

  return (
    <div className="dashboard">
      <Navbar variant="dark" bg={navbarColor} expand="lg" className={`navbar-${navbarColor}`}>
        <Container fluid>
          <Navbar.Toggle aria-controls="navbar-nav" />
          <Navbar.Brand href="#home">
            <img src="/ES-B.png" alt="Logo Extravagant Style" style={{ height: '60px' }} />
          </Navbar.Brand>

          <Navbar.Collapse id="navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/" className={`nav-item-${navbarColor}`}>
                <FontAwesomeIcon icon={faHome} /> Inicio
              </Nav.Link>
              <Nav.Link as={Link} to="/cupon" className={`nav-item-${navbarColor}`}>
                <FontAwesomeIcon icon={faTicket} /> Cupones
              </Nav.Link>
              <Nav.Link as={Link} to="/store" className={`nav-item-${navbarColor}`}>
                <FontAwesomeIcon icon={faStore} /> Tiendas
              </Nav.Link>
              <Nav.Link as={Link} to="/carro" className={`nav-item-${navbarColor}`}>
                <FontAwesomeIcon icon={faCartShopping} /> Carrito ({cartCount})
              </Nav.Link>
              <Nav.Link className={`nav-item-${navbarColor}`}>
                <NotificationBell />
              </Nav.Link>
              <div className="mobile-profile">
                <NavDropdown
                  title={<><FontAwesomeIcon icon={faUser} /> Perfil</>}
                  id="nav-dropdown"
                  className={`dropdown-${navbarColor}`}
                >
                  <NavDropdown.Item as={Link} to="/perfil">Perfil</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/login">
                    <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
                  </NavDropdown.Item>
                </NavDropdown>
              </div>
            </Nav>

            <div className="desktop-profile">
              <NavDropdown
                align="end"
                title={<FontAwesomeIcon icon={faUser} />}
                id="nav-dropdown"
                className={`dropdown-${navbarColor}`}
              >
                <NavDropdown.Item as={Link} to="/perfil">Perfil</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/login">
                  <FontAwesomeIcon icon={faSignOutAlt} /> Cerrar Sesión
                </NavDropdown.Item>
              </NavDropdown>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default App;