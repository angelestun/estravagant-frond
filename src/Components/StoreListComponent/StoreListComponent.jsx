import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import './StoreListComponent.css'; 
import { useConnectivity } from '../../context/ConnectivityProvider';

const StoreListComponent = () => {
  const [stores, setStores] = useState([]);
  const [hoveredStoreId, setHoveredStoreId] = useState(null);
  const navigate = useNavigate();
  const { isOnline, showNotification } = useConnectivity();

  const INACTIVITY_THRESHOLD = 30 * 60 * 1000;

  const shouldShowNotification = () => {
    const lastVisit = localStorage.getItem('lastStoreVisit');
    const currentTime = new Date().getTime();


    if (!lastVisit || (currentTime - parseInt(lastVisit)) > INACTIVITY_THRESHOLD) {
      localStorage.setItem('lastStoreVisit', currentTime.toString());
      return true;
    }

    return false;
  };

  const saveToLocalStorage = (stores) => {
    localStorage.setItem('cachedStores', JSON.stringify(stores));
    localStorage.setItem('storesLastUpdate', new Date().toISOString());
  };

  const getFromLocalStorage = () => {
    const cached = localStorage.getItem('cachedStores');
    return cached ? JSON.parse(cached) : [];
  };

// En StoreListComponent.jsx
const requestNotificationPermission = async () => {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.log('Este navegador no soporta notificaciones push');
      return;
  }

  if (localStorage.getItem('notificationsDenied')) {
      return;
  }

  try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          
          // Primero verificar si ya existe una suscripción
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
              console.log('Ya existe una suscripción');
              return;
          }

          try {
              const subscription = await registration.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: 'BL8TL4HNOLqhA819AaYm7ifoluzHeabMLZtQjHnkpz_j95PxnTub_0u8lp2pG4vFXXIO01Uf6dTuXuFIjR-ctVM'
              });

              const userId = localStorage.getItem('userId');
              if (!userId) {
                  throw new Error('Usuario no identificado');
              }

              const response = await fetch('https://extravagant-back-1.onrender.com/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      subscription,
                      userId
                  }),
              });

              if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Error en la suscripción');
              }

              console.log('Suscripción exitosa');
          } catch (subscriptionError) {
              console.error('Error en la suscripción:', subscriptionError);
              // Limpiar la suscripción si hubo error
              const currentSubscription = await registration.pushManager.getSubscription();
              if (currentSubscription) {
                  await currentSubscription.unsubscribe();
              }
              throw subscriptionError;
          }
      } else if (permission === 'denied') {
          localStorage.setItem('notificationsDenied', 'true');
      }
  } catch (error) {
      console.error('Error al configurar notificaciones:', error);
      showNotification('Error', 'No se pudieron configurar las notificaciones', 'error');
  }
};

  useEffect(() => {
    const fetchStores = async () => {
      if (!isOnline) {
        const cachedStores = getFromLocalStorage();
        setStores(cachedStores);
        if (shouldShowNotification()) {
          showNotification('Modo Offline', 'Mostrando tiendas guardadas localmente', 'info');
        }
        return;
      }

      try {
        const response = await fetch('https://extravagant-back-1.onrender.com/tienda');
        if (response.ok) {
          const data = await response.json();
          const activeStores = data.filter(store => store.activo === 1);
          setStores(activeStores);
          saveToLocalStorage(activeStores);
        }
      } catch (error) {
        console.error('Error:', error);
        const cachedStores = getFromLocalStorage();
        if (cachedStores.length > 0) {
          setStores(cachedStores);
          if (shouldShowNotification()) {
            showNotification('Error de conexión', 'Mostrando tiendas guardadas localmente', 'warning');
          }
        }
      }
    };

    fetchStores();
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) {
      const lastUpdate = localStorage.getItem('storesLastUpdate');
      if (lastUpdate) {
        const timeDiff = new Date() - new Date(lastUpdate);
        if (timeDiff > 5 * 60 * 1000) {
          const fetchStores = async () => {
            try {
              const response = await fetch('https://extravagant-back-1.onrender.com/tienda');
              if (response.ok) {
                const data = await response.json();
                const activeStores = data.filter(store => store.activo === 1);
                setStores(activeStores);
                saveToLocalStorage(activeStores);
                if (shouldShowNotification()) {
                  showNotification('Sincronización', 'Lista de tiendas actualizada', 'success');
                }
              }
            } catch (error) {
              console.error('Error al sincronizar:', error);
            }
          };
          fetchStores();
        }
      }
    }
  }, [isOnline]);

  const handleVisit = async (storeId) => {
    await requestNotificationPermission();
    localStorage.setItem('lastStoreVisit', new Date().getTime().toString());
    localStorage.setItem('IdTienda', storeId);
    navigate('/lista-productos');
  };

  return (
    <div className="store-list-container">
      <div className="store-list">
        {stores.length > 0 ? (
          stores.map((store) => (
            <div
              key={store.ID_Tienda}
              className="store-card"
              onMouseEnter={() => setHoveredStoreId(store.ID_Tienda)}
              onMouseLeave={() => setHoveredStoreId(null)}
            >
              {store.logo && (
                <img
                  src={`https://extravagant-back-1.onrender.com/uploads/${store.logo}`}
                  alt={`${store.NombreTienda} logo`}
                  className="store-logo"
                />
              )}
              <div className="store-details">
                <h3 className="store-name">{store.NombreTienda}</h3>
                <p className="store-description">{store.Descripcion}</p>
              </div>
              <button
                className={`visit-button ${hoveredStoreId === store.ID_Tienda ? 'visible' : ''}`}
                onClick={() => handleVisit(store.ID_Tienda)}
              >
                Visitar
              </button>
            </div>
          ))
        ) : (
          <p>No hay tiendas disponibles</p>
        )}
      </div>
    </div>
  );
};

export default StoreListComponent;