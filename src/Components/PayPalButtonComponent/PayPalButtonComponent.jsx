import React from 'react';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

const PayPalButtonComponent = ({ 
  subtotal, 
  totalValue, 
  discountAmount, 
  offerAmount,    
  invoice, 
  onSuccess,
  cartItems, 
}) => {
  const calculateTotal = (subtotal, offerDiscount, couponDiscount) => {
    const sub = parseFloat(subtotal);
    const offer = parseFloat(offerDiscount || 0);
    const coupon = parseFloat(couponDiscount || 0);
    return (sub - offer - coupon).toFixed(2);
  };

  return (
    <PayPalScriptProvider
      options={{
        "client-id": "ARXCvglQwc37WUc43QaaGkxXIxY0c1jTR8TYbmxslg3ZS0xYpviJYvax6uSL8vA40Pa-YndgmdOtayU2",
        "currency": "MXN"
      }}
    >
      <PayPalButtons
        createOrder={(data, actions) => {
          const subtotalValue = parseFloat(subtotal).toFixed(2);
          const offerDiscountValue = parseFloat(offerAmount || 0).toFixed(2);
          const couponDiscountValue = parseFloat(discountAmount || 0).toFixed(2);
          
          const totalDiscountValue = (
            parseFloat(offerDiscountValue) + 
            parseFloat(couponDiscountValue)
          ).toFixed(2);

          const calculatedTotal = calculateTotal(
            subtotalValue,
            offerDiscountValue,
            couponDiscountValue
          );

          console.log('PayPal Order Creation:', {
            subtotal: subtotalValue,
            offerDiscount: offerDiscountValue,
            couponDiscount: couponDiscountValue,
            totalDiscount: totalDiscountValue,
            calculatedTotal,
            originalTotal: totalValue,
            verificationCalc: `${subtotalValue} - ${offerDiscountValue} - ${couponDiscountValue} = ${calculatedTotal}`
          });

          if (parseFloat(calculatedTotal) <= 0 || isNaN(parseFloat(calculatedTotal))) {
            throw new Error('El total final es inválido');
          }

          return actions.order.create({
            purchase_units: [{
              description: invoice,
              amount: {
                currency_code: 'MXN',
                value: calculatedTotal,
                breakdown: {
                  item_total: {
                    currency_code: 'MXN',
                    value: subtotalValue
                  },
                  discount: {
                    currency_code: 'MXN',
                    value: totalDiscountValue
                  }
                }
              },
              items: cartItems.map(item => ({
                name: item.productName,
                unit_amount: {
                  currency_code: 'MXN',
                  value: parseFloat(item.price).toFixed(2)
                },
                quantity: item.quantity.toString(),
                description: `${item.productName} × ${item.quantity}`
              }))
            }],
            application_context: {
              shipping_preference: 'NO_SHIPPING'
            }
          });
        }}
        onApprove={async (data, actions) => {
          try {
            const order = await actions.order.capture();
            console.log('PayPal Capture Response:', order);

            const finalSubtotal = parseFloat(subtotal).toFixed(2);
            const finalOfferDiscount = parseFloat(offerAmount || 0).toFixed(2);
            const finalCouponDiscount = parseFloat(discountAmount || 0).toFixed(2);
            const finalTotal = calculateTotal(
              finalSubtotal,
              finalOfferDiscount,
              finalCouponDiscount
            );

            onSuccess({
              ...order,
              additional_details: {
                subtotal: finalSubtotal,
                offer_discount: finalOfferDiscount,
                coupon_discount: finalCouponDiscount,
                final_total: finalTotal,
                calculation_details: {
                  subtotal: finalSubtotal,
                  offerDiscount: finalOfferDiscount,
                  couponDiscount: finalCouponDiscount,
                  total: finalTotal
                }
              }
            });
          } catch (error) {
            console.error("Error al procesar el pago:", error);
            alert("Hubo un error al procesar el pago. Por favor intenta nuevamente.");
            throw error;
          }
        }}
        onError={(err) => {
          console.error("Error en la transacción de PayPal:", {
            error: err,
            context: {
              subtotal,
              totalValue,
              discountAmount,
              offerAmount
            }
          });
          alert("Error en la transacción. Por favor intenta nuevamente.");
        }}
      />
    </PayPalScriptProvider>
  );
};

export default PayPalButtonComponent;