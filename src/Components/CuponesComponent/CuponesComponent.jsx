import React, { useState, useEffect } from 'react';
import './CuponesComponent.css';
import axios from 'axios';
import { useConnectivity } from '../../context/ConnectivityProvider';

const CuponesComponent = () => {
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const userId = localStorage.getItem('userId');
  const { isOnline, showNotification } = useConnectivity();

  useEffect(() => {
    const fetchData = async () => {
      if (userId) {
        await fetchTiendas();
        await fetchCoupons();
      }
    };

    fetchData();

    const intervalId = setInterval(() => {
      if (isOnline) {
        fetchData();
      }
    }, 60000);

    return () => clearInterval(intervalId);
  }, [userId, isOnline]);

  const fetchTiendas = async () => {
    try {
      if (!isOnline) {
        const cachedTiendas = localStorage.getItem('cachedTiendas');
        if (cachedTiendas) {
          setTiendas(JSON.parse(cachedTiendas));
          return;
        }
      }

      const response = await axios.get('http://localhost:3000/tienda');
      setTiendas(response.data);
      localStorage.setItem('cachedTiendas', JSON.stringify(response.data));
    } catch (error) {
      console.error("Error al obtener tiendas: ", error);
      const cachedTiendas = localStorage.getItem('cachedTiendas');
      if (cachedTiendas) {
        setTiendas(JSON.parse(cachedTiendas));
      }
    }
  };

  const fetchCoupons = async () => {
    try {
      if (!isOnline) {
        const cachedCoupons = localStorage.getItem('cachedCoupons');
        if (cachedCoupons) {
          const parsedCoupons = JSON.parse(cachedCoupons);
          filterAndSetCoupons(parsedCoupons);
          showNotification(
            'Modo Offline',
            'Mostrando cupones guardados localmente',
            'info'
          );
          return;
        }
      }

      const response = await axios.get(`http://localhost:3000/cupones?userId=${userId}`, {
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      localStorage.setItem('cachedCoupons', JSON.stringify(response.data));
      localStorage.setItem('lastCouponsUpdate', Date.now().toString());
      filterAndSetCoupons(response.data);
      
    } catch (error) {
      console.error("Error al obtener los cupones: ", error);
      const cachedCoupons = localStorage.getItem('cachedCoupons');
      if (cachedCoupons) {
        filterAndSetCoupons(JSON.parse(cachedCoupons));
        showNotification(
          'Error de Conexión',
          'Mostrando cupones guardados localmente',
          'warning'
        );
      }
    }
  };

  const filterAndSetCoupons = (couponsData) => {
    const currentDate = new Date();
    const availableCoupons = couponsData.filter(coupon => 
      coupon.Activo === 1 && 
      coupon.Estado === 1 && 
      new Date(coupon.Fecha_Fin) > currentDate &&
      !coupon.isUsed &&
      !coupon.inUse
    );
    setCoupons(availableCoupons);
  };

  const getNombreTienda = (id) => {
    const tienda = tiendas.find(t => t.ID_Tienda === id);
    return tienda ? tienda.NombreTienda : 'Desconocido';
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const nextSlide = () => {
    setCurrentSlide(current => 
      current === coupons.length - 1 ? 0 : current + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide(current => 
      current === 0 ? coupons.length - 1 : current - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div className="cupones-container">
      <div className="navbar-cupon">
        <h2>Cupones Disponibles</h2>
      </div>


      <div className="table-container">
        {coupons.length === 0 ? (
          <p className="no-coupons-message">No hay cupones disponibles en este momento.</p>
        ) : (
          <table className="cupones-table">
            <thead>
              <tr>
                <th>Tienda</th>
                <th>Código</th>
                <th>Descuento</th>
                <th>Descripción</th>
                <th>Válido hasta</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => (
                <tr key={coupon.ID_Cupones}>
                  <td data-label="Tienda">{getNombreTienda(coupon.ID_Tienda)}</td>
                  <td data-label="Código">
                    <span className="coupon-code">{coupon.Codigo}</span>
                  </td>
                  <td data-label="Descuento">
                    <span className="discount-value">{coupon.Descuento}% OFF</span>
                  </td>
                  <td data-label="Descripción">{coupon.Descripcion}</td>
                  <td data-label="Válido hasta">
                    {new Date(coupon.Fecha_Fin).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </td>
                  <td data-label="Acción">
                    <button 
                      className={`copy-button ${copiedCode === coupon.Codigo ? 'copied' : ''}`}
                      onClick={() => handleCopyCode(coupon.Codigo)}
                      disabled={copiedCode === coupon.Codigo}
                    >
                      {copiedCode === coupon.Codigo ? '¡Copiado!' : 'Copiar Código'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Vista de carrusel para móvil */}
      <div className="mobile-carousel">
  {coupons.length === 0 ? (
    <p className="no-coupons-message">No hay cupones disponibles en este momento.</p>
  ) : (
    <>
      <button className="carousel-button prev" onClick={prevSlide}>←</button>
      
      <div className="carousel-container">
        <div 
          className="carousel-track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {coupons.map((coupon) => (
            <div key={coupon.ID_Cupones} className="simple-card">
              <h3 className="card-tienda">{getNombreTienda(coupon.ID_Tienda)}</h3>
              
              <div className="card-code">
                {coupon.Codigo}
              </div>
              
              <div className="card-discount">
                {coupon.Descuento}% OFF
              </div>
              
              <p className="card-description">{coupon.Descripcion}</p>
              
              <div className="card-validity">
                Válido hasta: {new Date(coupon.Fecha_Fin).toLocaleDateString()}
              </div>
              
              <button 
                className={`simple-copy-btn ${copiedCode === coupon.Codigo ? 'copied' : ''}`}
                onClick={() => handleCopyCode(coupon.Codigo)}
              >
                {copiedCode === coupon.Codigo ? '¡Copiado!' : 'Copiar Código'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <button className="carousel-button next" onClick={nextSlide}>→</button>

      <div className="carousel-dots">
        {coupons.map((_, index) => (
          <span
            key={index}
            className={`carousel-dot ${currentSlide === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </>
  )}
</div>
    </div>
  );
};

export default CuponesComponent;