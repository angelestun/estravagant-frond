import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Cookies from 'js-cookie';
import { navigateWithFallback } from '../../utils/navigation';
import './Checkout.css';
import { useConnectivity } from '../../context/ConnectivityProvider';


const Checkout = () => {
  const location = useLocation();
  const { cartItems } = location.state || { cartItems: [] };
  const [couponStoreId, setCouponStoreId] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [total, setTotal] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [totalDirectDiscount, setTotalDirectDiscount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState('0.00');
  const userData = localStorage.getItem('userId');
  const [notes, setNotes] = useState('');
  const { isOnline } = useConnectivity();

  useEffect(() => {
    if (cartItems?.length > 0) {
      localStorage.setItem('checkoutCart', JSON.stringify({
        items: cartItems,
        subtotal,
        total,
        discountAmount,
        timestamp: new Date().toISOString()
      }));
    }
  }, [cartItems, subtotal, total, discountAmount]);

  useEffect(() => {
    if (!isOnline) {
      const savedCheckout = localStorage.getItem('checkoutCart');
      if (savedCheckout) {
        const parsed = JSON.parse(savedCheckout);
       
        const timeDiff = new Date() - new Date(parsed.timestamp);
        if (timeDiff < 60 * 60 * 1000) { 
          setCartItems(parsed.items);
          setSubtotal(parsed.subtotal);
          setTotal(parsed.total);
          setDiscountAmount(parsed.discountAmount);
        }
      }
    }
  }, [isOnline]);



  const calculateInitialTotals = () => {
    const totalSubtotal = cartItems.reduce((acc, item) => {
      return acc + (item.Precio * item.Cantidad);
    }, 0);

    const totalOfferDiscount = cartItems.reduce((acc, item) => {
      if (item.Descuento > 0) {
        const itemTotal = item.Precio * item.Cantidad;
        return acc + (itemTotal * (item.Descuento / 100));
      } else if (item.Tipo_Oferta === '2x1' && item.Cantidad >= 2) {
        const pairsCount = Math.floor(item.Cantidad / 2);
        const discountPerPair = item.Precio;
        return acc + (pairsCount * discountPerPair);
      }
      return acc;
    }, 0);

    return {
      subtotal: totalSubtotal,
      offerDiscount: totalOfferDiscount,
      total: totalSubtotal - totalOfferDiscount
    };
};
  useEffect(() => {
    const totals = calculateInitialTotals();
    setSubtotal(totals.subtotal);
    setTotalDirectDiscount(totals.offerDiscount);
    setTotal(totals.total);

    console.log('Initial calculations:', {
      subtotal: totals.subtotal,
      offerDiscount: totals.offerDiscount,
      total: totals.total
    });
  }, [cartItems]);

  useEffect(() => {
    return () => {
      if (isCouponApplied && couponCode) {
        fetch(`http://localhost:3000/api/coupons/release/${couponCode}?userId=${userData}`, {
          method: 'DELETE'
        }).catch(error => {
          console.error('Error al liberar cupón:', error);
        });
      }
    };
  }, [isCouponApplied, couponCode, userData]);

  const handleCouponApply = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/coupons/${couponCode}?subtotal=${subtotal}&userId=${userData}`
      );
      const result = await response.json();
  
      if (!response.ok) {
        setCouponError(result.error || 'El cupón no es válido.');
        return;
      }
  
      const storeProducts = cartItems.filter(item => 
        parseInt(item.ID_Tienda) === parseInt(result.storeId)
      );
  
      const storeSubtotal = storeProducts.reduce((acc, item) => 
        acc + (item.Precio * item.Cantidad), 0
      );
  
      if (storeSubtotal === 0) {
        setCouponError('El cupón no es aplicable a los productos en tu carrito.');
        return;
      }
  
      const calculatedDiscount = parseFloat((storeSubtotal * result.discount) / 100).toFixed(2);
  
      const couponInfo = {
        code: couponCode,
        discount: calculatedDiscount,
        storeId: result.storeId,
        percentage: result.discount
      };
  
      setDiscountPercentage(result.discount);
      setDiscountAmount(calculatedDiscount);
      setIsCouponApplied(true);
      setCouponError('');
      setCouponStoreId(result.storeId);
  
      const newTotal = (
        parseFloat(subtotal) - 
        parseFloat(totalDirectDiscount) - 
        parseFloat(calculatedDiscount)
      ).toFixed(2);
      
      setTotal(parseFloat(newTotal));
  
      Cookies.set('couponInfo', JSON.stringify(couponInfo));
      Cookies.set('couponDiscount', calculatedDiscount);
      Cookies.set('couponCode', couponCode);
      Cookies.set('couponStoreId', result.storeId);
  
      console.log('Cupón aplicado:', {
        storeId: result.storeId,
        storeSubtotal,
        discountPercentage: result.discount,
        calculatedDiscount,
        newTotal
      });
  
    } catch (error) {
      setCouponError('Error al procesar el cupón.');
    }
  };

  const formatNumber = (number) => {
    if (number === undefined || number === null) {
      return "0.00";
    }
    return parseFloat(number).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleCreateOrder = async (paypalOrderId, finalTotal, discounts) => {
    const orderData = {
      total: finalTotal,
      subtotal: parseFloat(subtotal).toFixed(2),
      couponCode: isCouponApplied ? couponCode : null,
      products: cartItems.map(item => ({
        ID_Producto: item.ID_Producto,
        Cantidad: item.Cantidad,
        Precio_Unitario: parseFloat(item.Precio).toFixed(2),
      })),
      paymentMethod: 'PayPal',
      ID_Usuario: userData,
      Monto_Descuento: parseFloat(discounts.couponDiscount).toFixed(2),
      Monto_Oferta: parseFloat(discounts.offerDiscount).toFixed(2),
    };
  
    console.log('Datos de orden a enviar:', orderData);
  
    try {
      const response = await fetch('http://localhost:3000/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
  
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error Response:', data);
        throw new Error(data.message || 'Error al crear el pedido');
      }
  
      return data;
    } catch (error) {
      console.error('Error en handleCreateOrder:', error);
      throw error;
    }
  };

  return (
    <div className="checkout">
      <div className="order-summary">
        <h2>Resumen de la Compra</h2>
        {cartItems.map((item) => {
            const precioOriginal = item.Precio * item.Cantidad;
            let precioFinal;

            if (item.Tipo_Oferta === '2x1' && item.Cantidad >= 2) {
              const pairsCount = Math.floor(item.Cantidad / 2);
              const remainingItems = item.Cantidad % 2;
              precioFinal = (pairsCount * item.Precio) + (remainingItems * item.Precio);
            } else if (item.Descuento > 0) {
              precioFinal = (item.Precio - (item.Precio * (item.Descuento / 100))) * item.Cantidad;
            } else {
              precioFinal = precioOriginal;
            }

            return (
              <div key={item.ID_Producto} className="item">
                <p className="item-name">
                  {item.Nombre_Producto} × {item.Cantidad}
                  {item.Tipo_Oferta === '2x1' && item.Cantidad >= 2 && (
                    <span className="offer-tag"> (2x1 aplicado)</span>
                  )}
                </p>
                <div className="price-container">
                  {(item.Descuento > 0 || (item.Tipo_Oferta === '2x1' && item.Cantidad >= 2)) && (
                    <p className="item-price-original">
                      ${formatNumber(precioOriginal)}
                    </p>
                  )}
                  <p className="item-price-c">
                    ${formatNumber(precioFinal)}
                  </p>
                </div>
              </div>
            );
          })}
        <div className="summary-details">
          <div className="subtotal">
            <p>Subtotal</p>
            <p>${formatNumber(subtotal)}</p>
          </div>
          <hr />
          {totalDirectDiscount > 0 && (
            <div className="discount">
              <p>Descuento del producto</p>
              <p>-${formatNumber(totalDirectDiscount)}</p>
            </div>
          )}
          {isCouponApplied && parseFloat(discountAmount) > 0 && (
            <div className="coupon">
              <p>Descuento por cupón ({discountPercentage}%)</p>
              <p>-${formatNumber(discountAmount)}</p>
            </div>
          )}
          <hr />
          <div className="total">
            <p>Total</p>
            <p>${formatNumber(total)}</p>
          </div>
        </div>
      </div>

      <div className="coupon-section">
        <h3>¿Tienes un cupón de descuento?</h3>
        <div className="coupon-input-container">
          <input
            type="text"
            placeholder="Ingresa tu cupón"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            disabled={isCouponApplied}
          />
          <button 
            className="apply-coupon-btn" 
            onClick={handleCouponApply}
            disabled={!couponCode || isCouponApplied}
          >
            Aplicar
          </button>
        </div>
        {couponError && <p className="error-message">{couponError}</p>}
      </div>

      <div className="payment-section">
        <h3>Método de Pago</h3>
        <PayPalScriptProvider options={{ 
          "client-id": "ARXCvglQwc37WUc43QaaGkxXIxY0c1jTR8TYbmxslg3ZS0xYpviJYvax6uSL8vA40Pa-YndgmdOtayU2",
          "currency": "MXN"
        }}>
        <PayPalButtons
          createOrder={(data, actions) => {
            const savedCouponDiscount = parseFloat(Cookies.get('couponDiscount') || '0');
            
            const orderSubtotal = Math.max(parseFloat(subtotal || 0), 0).toFixed(2);
            const orderOfferDiscount = Math.max(parseFloat(totalDirectDiscount || 0), 0).toFixed(2);
            const orderCouponDiscount = Math.max(parseFloat(savedCouponDiscount || 0), 0).toFixed(2);
            
            const totalDiscounts = Math.min(
              parseFloat(orderOfferDiscount) + parseFloat(orderCouponDiscount),
              parseFloat(orderSubtotal) - 0.01
            ).toFixed(2);

            const finalTotal = Math.max(
              parseFloat(orderSubtotal) - parseFloat(totalDiscounts),
              0.01
            ).toFixed(2);

            console.log('PayPal Order Creation:', {
              orderDetails: {
                subtotal: orderSubtotal,
                offerDiscount: orderOfferDiscount,
                couponDiscount: orderCouponDiscount,
                totalDiscounts,
                finalTotal
              }
            });

            return actions.order.create({
              purchase_units: [{
                amount: {
                  currency_code: 'MXN',
                  value: finalTotal,
                  breakdown: {
                    item_total: {
                      currency_code: 'MXN',
                      value: orderSubtotal
                    },
                    discount: {
                      currency_code: 'MXN',
                      value: totalDiscounts
                    }
                  }
                }
              }]
            });
          }}
          onApprove={async (data, actions) => {
            try {
              console.log('Iniciando proceso de aprobación PayPal');
              const orderData = await actions.order.capture();
              console.log('PayPal Capture Response:', orderData);
          
              const savedCouponDiscount = parseFloat(Cookies.get('couponDiscount') || '0');
              const couponCode = Cookies.get('couponCode');
              
              const orderSubtotal = Math.max(parseFloat(subtotal || 0), 0).toFixed(2);
              const orderOfferDiscount = Math.max(parseFloat(totalDirectDiscount || 0), 0).toFixed(2);
              const orderCouponDiscount = Math.max(parseFloat(savedCouponDiscount || 0), 0).toFixed(2);
              
              const finalTotal = Math.max(
                parseFloat(orderSubtotal) - 
                parseFloat(orderOfferDiscount) - 
                parseFloat(orderCouponDiscount),
                0.01
              ).toFixed(2);
          
              console.log('Enviando orden al servidor:', {
                paypalOrderId: orderData.id,
                total: finalTotal,
                discounts: {
                  offerDiscount: orderOfferDiscount,
                  couponDiscount: orderCouponDiscount
                }
              });
          
              const response = await handleCreateOrder(
                orderData.id,
                finalTotal,
                {
                  offerDiscount: orderOfferDiscount,
                  couponDiscount: orderCouponDiscount
                }
              );
          
              console.log('Respuesta del servidor:', response);
          
              if (response && response.orderId) {
                console.log('Orden creada exitosamente, ID:', response.orderId);
                
                try {
                  if (couponCode) {
                    console.log('Intentando mover cupón:', {
                      couponCode,
                      userId: userData,
                      orderId: response.orderId
                    });
          
                    const moveResponse = await fetch('http://localhost:3000/api/coupons/move-to-used', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        couponCode,
                        userId: userData,
                        orderId: response.orderId
                      })
                    });
          
                    const moveResult = await moveResponse.json();
                    console.log('Respuesta del servidor al mover cupón:', moveResult);
          
                    if (!moveResponse.ok) {
                      console.error('Error al mover el cupón:', moveResult);
                    }
                  }
          
                  try {
                    console.log('Iniciando limpieza del carrito...');
                    const cartClearResponse = await fetch(`http://localhost:3000/carrito/clear/${userData}`, {
                      method: 'DELETE'
                    });
                    
                    if (!cartClearResponse.ok) {
                      throw new Error('Error al limpiar el carrito');
                    }
          
                    console.log('Limpiando cookies y localStorage...');
                    Cookies.remove('couponInfo');
                    Cookies.remove('couponDiscount');
                    Cookies.remove('couponCode');
                    Cookies.remove('couponStoreId');
                    localStorage.removeItem('cart');
                    localStorage.removeItem('cartTimestamp');
          
                    console.log('Limpieza completada exitosamente');
                  } catch (cleanupError) {
                    console.error('Error en la limpieza:', cleanupError);
                  }
          
                  alert('¡Pago realizado con éxito!');
                  console.log('Redirigiendo a:', `/confirmacion/${response.orderId}`);
                  await navigateWithFallback(`/confirmacion/${response.orderId}`);
                } catch (error) {
                  console.error('Error en el proceso post-pago:', error);
                  window.location.href = `/confirmacion/${response.orderId}`;
                }
              } else {
                throw new Error('No se recibió el ID de la orden del servidor');
              }
            } catch (error) {
              console.error('Error completo en onApprove:', error);
              
              if (couponCode) {
                try {
                  await fetch(
                    `http://localhost:3000/api/coupons/release/${couponCode}?userId=${userData}`,
                    { method: 'DELETE' }
                  );
                } catch (releaseError) {
                  console.error('Error al liberar cupón:', releaseError);
                }
              }
              
              alert(error.message || "Error al procesar el pago. Por favor, intenta nuevamente.");
            }
          }}
          
          onError={(err) => {
            console.error('PayPal Error:', err);
            if (isCouponApplied && couponCode) {
              fetch(`http://localhost:3000/api/coupons/release/${couponCode}?userId=${userData}`, {
                method: 'DELETE'
              }).catch(error => {
                console.error('Error al liberar cupón:', error);
              });
            }
            alert("Hubo un error con PayPal. Por favor, intenta nuevamente.");
          }}
          onCancel={() => {
            console.log('Pago cancelado por el usuario');
            if (isCouponApplied && couponCode) {
              fetch(`http://localhost:3000/api/coupons/release/${couponCode}?userId=${userData}`, {
                method: 'DELETE'
              }).catch(error => {
                console.error('Error al liberar cupón después de cancelación:', error);
              });
            }
          }}
          style={{
            layout: 'vertical',
            shape: 'rect',
            tagline: false,
            menuPlacement: 'below'
          }}
        />
        </PayPalScriptProvider>
      </div>
    </div>
  );
};

export default Checkout;
