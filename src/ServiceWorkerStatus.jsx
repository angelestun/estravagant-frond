import React, { useEffect, useState } from 'react';


const ServiceWorkerStatus = () => {  
  const [registrationInfo, setRegistrationInfo] = useState(null);

  useEffect(() => {
    async function checkServiceWorker() {
      if ('serviceWorker' in navigator) {
        try {
      
          const existingRegistration = await navigator.serviceWorker.getRegistration();
          
          if (existingRegistration) {
            setRegistrationInfo(existingRegistration);
            
            if (existingRegistration.active) {
              console.log('Service Worker activo ✅'); 
            } else if (existingRegistration.installing) {
              console.log('Service Worker instalándose...'); 
            } else if (existingRegistration.waiting) {
              console.log('Service Worker esperando activación...'); 
            }

            
            existingRegistration.addEventListener('statechange', (event) => {
              if (event.target.state === 'activated') {
                console.log('Service Worker activo ✅'); 
              }
            });
          } else {
 
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            setRegistrationInfo(registration);
            
            if (registration.active) {
              console.log('Service Worker activo ✅'); 
            }
          }

        } catch (error) {
          console.error('Error con el Service Worker:', error); 
        }
      } else {
        console.log('Service Worker no soportado ❌'); 
      }
    }

    checkServiceWorker();

    const interval = setInterval(() => {
      if (registrationInfo && registrationInfo.active) {
        clearInterval(interval);
      } else {
        checkServiceWorker();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [registrationInfo]);

  return null; 
}

export default ServiceWorkerStatus;
