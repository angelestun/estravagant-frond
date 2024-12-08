import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './Confirmation.css';

const Confirmation = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const orderData = searchParams.get('data');
        
        if (orderData) {
            try {
                const decodedData = JSON.parse(decodeURIComponent(orderData));
                setOrder(decodedData);
            } catch (err) {
                console.error('Error al decodificar datos:', err);
                setError('Error al procesar los datos del pedido');
            }
        } else {
            setError('No se encontraron datos del pedido');
        }
        setLoading(false);
    }, []);

    const downloadTicket = () => {
        if (!order) return;

        const doc = new jsPDF();
        doc.setFont('Helvetica', 'normal');
    
        // Encabezado
        doc.setFontSize(20);
        doc.setTextColor(0, 102, 204);
        doc.text('Extravagant Style', 20, 20);
    
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('¡Gracias por tu compra!', 20, 30);

        // Línea divisoria
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // Información del pedido
        doc.setFontSize(10);
        doc.text(`ID de pedido: ${orderId}`, 20, 40);
        doc.text(`Fecha y hora: ${new Date().toLocaleString()}`, 20, 45);
        doc.text(`Método de pago: PayPal`, 20, 50);
        doc.text(`Estado de pago: Completado`, 20, 55);
    
        doc.setLineWidth(0.5);
        doc.line(20, 60, 190, 60);

        // Tabla de productos
        if (order.products && order.products.length > 0) {
            doc.setFontSize(12);
            doc.autoTable({
                head: [['Producto', 'Tienda', 'Cantidad', 'Precio', 'Total']],
                body: order.products.map(product => [
                    product.Nombre_Producto,
                    product.NombreTienda || 'N/A',
                    product.Cantidad,
                    `$${parseFloat(product.Precio_Unitario).toFixed(2)}`,
                    `$${(product.Precio_Unitario * product.Cantidad).toFixed(2)}`
                ]),
                startY: 75,
                theme: 'striped',
                headStyles: { fillColor: [0, 0, 0] },
                margin: { top: 20 }
            });
        }
    
        let yOffset = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 75;
        
        // Descuentos
        doc.setFontSize(12);
        doc.text(`Descuento por cupón: -$${order.monto_descuento || '0.00'}`, 20, yOffset);
        yOffset += 5;
        doc.text(`Descuento por oferta: -$${order.monto_oferta || '0.00'}`, 20, yOffset);
        
        yOffset += 10;
        doc.setFontSize(14);
        doc.text(`Monto Total: $${parseFloat(order.total).toFixed(2)}`, 20, yOffset);
        
        doc.save('confirmación-de-compra.pdf');
    };
    
    if (loading) return <div>Cargando...</div>;
    if (error) return <div>{error}</div>;
    if (!order) return <div>No se encontró el pedido.</div>;

    return (
        <div className="confirmation-container">
            <h1 className='tittle-con'>¡Gracias por tu compra!</h1>
            <h2 className='sub-con'>Detalles de tu pedido</h2>
            <div className="order-details">
                <p>ID de pedido: <strong>{orderId}</strong></p>
                <p>Fecha y hora: <strong>{new Date().toLocaleString()}</strong></p>
                <p>Método de pago: <strong>PayPal</strong></p>
                <p>Estado de pago: <strong>Completado</strong></p>
                
                <h3>Productos</h3>
                <div className="overflow-x-auto hidden md:block">
                    <table className="products-table table-auto w-full">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Tienda</th>
                                <th>Cantidad</th>
                                <th>Precio</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.products.map((product, index) => (
                                <tr key={index}>
                                    <td>{product.Nombre_Producto}</td>
                                    <td>{product.NombreTienda || 'N/A'}</td>
                                    <td>{product.Cantidad}</td>
                                    <td>${parseFloat(product.Precio_Unitario).toFixed(2)}</td>
                                    <td>${(product.Precio_Unitario * product.Cantidad).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="block md:hidden">
                    <ul>
                        {order.products.map((product, index) => (
                            <li key={index} className="border-b py-2">
                                <p><strong>Producto:</strong> {product.Nombre_Producto}</p>
                                <p><strong>Tienda:</strong> {product.NombreTienda || 'N/A'}</p>
                                <p><strong>Cantidad:</strong> {product.Cantidad}</p>
                                <p><strong>Precio:</strong> ${parseFloat(product.Precio_Unitario).toFixed(2)}</p>
                                <p><strong>Total:</strong> ${(product.Precio_Unitario * product.Cantidad).toFixed(2)}</p>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="order-summary">
                    <p>Descuento por cupón: -${order.monto_descuento || '0.00'}</p>
                    <p>Descuento por oferta: -${order.monto_oferta || '0.00'}</p>
                    <h3>Monto Total: <strong>${parseFloat(order.total).toFixed(2)}</strong></h3>
                </div>
            </div>
    
            <button className="download-button" onClick={downloadTicket}>
                Descargar comprobante
            </button>
        </div>
    );
};

export default Confirmation;