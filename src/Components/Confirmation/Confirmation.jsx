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
        const fetchOrder = async () => {
            try {
                const response = await fetch(`/api/order/${orderId}`);
                if (!response.ok) {
                    throw new Error('Error al obtener el pedido');
                }
                const data = await response.json();
                setOrder(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
    
        if (orderId) {
            fetchOrder();
        } else {
            setError('ID de pedido no válido.');
            setLoading(false);
        }
    }, [orderId]);

    const downloadTicket = () => {
        const doc = new jsPDF();
        doc.setFont('Helvetica', 'normal');
    
        doc.setFontSize(20);
        doc.setTextColor(0, 102, 204);
        doc.text('Extravagant Style', 20, 20);
    
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('¡Gracias por tu compra!', 20, 30);

        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        doc.setFontSize(10);
        doc.text(`ID de pedido: ${order.id}`, 20, 40);
        doc.text(`Fecha y hora: ${new Date(order.fecha_pedido).toLocaleString()}`, 20, 45);
        doc.text(`Método de pago: ${order.metodo_pago || 'No especificado'}`, 20, 50);
        doc.text(`Estado de pago: ${order.estado || 'No especificado'}`, 20, 55);
    
        doc.setLineWidth(0.5);
        doc.line(20, 60, 190, 60);

        if (order.products && order.products.length > 0) {
            doc.setFontSize(12);
            doc.autoTable({
                head: [
                    ['Producto', 'Tienda', 'Cantidad', 'Precio', 'Total']
                ],
                body: order.products.map(product => [
                    product.Nombre_Producto,
                    product.NombreTienda || 'N/A',
                    product.Cantidad,
                    `$${product.Precio_Unitario.toFixed(2)}`,
                    `$${(product.Precio_Unitario * product.Cantidad - (product.Precio_Unitario * product.Cantidad * (order.couponDiscount || 0) / 100)).toFixed(2)}`
                ]),
                startY: 75,
                theme: 'striped',
                headStyles: { fillColor: [0, 0, 0] },
                margin: { top: 20 }
            });
        } else {
            doc.text('No hay productos en este pedido.', 20, 75);
        }
    
        let yOffset = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 75;
        doc.setFontSize(12);
        doc.text('', 20, yOffset);
        yOffset += 5;
        doc.text(`Descuento por cupón: -$${order.monto_descuento || '0.00'}`, 20, yOffset);
        yOffset += 5;
        doc.text(`Descuento por oferta: -$${order.monto_oferta || '0.00'}`, 20, yOffset);
    
        yOffset += 10;
        doc.setFontSize(14);
        doc.text(`Monto Total: $${order.total.toFixed(2)}`, 20, yOffset);  
        
        doc.setLineWidth(0.5);
        doc.line(20, yOffset + 10, 190, yOffset + 10);

        
        doc.setFontSize(8);
        doc.text('¡Gracias por elegirnos! Si tienes alguna pregunta, contáctanos a soporte@extravagantstyle.com', 20, yOffset + 20);
    
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
                <p>ID de pedido: <strong>{order.id}</strong></p>
                <p>Fecha y hora: <strong>{new Date(order.fecha_pedido).toLocaleString()}</strong></p>
                <p>Método de pago: <strong>{order.metodo_pago || 'No especificado'}</strong></p>
                <p>Estado de pago: <strong>{order.estado || 'No especificado'}</strong></p>
                
                <h3>Productos</h3>

                {/* Versión de tabla para pantallas grandes */}
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
                            {order.products.map((product, index) => {
                                const total = product.Precio_Unitario * product.Cantidad - 
                                    (product.Precio_Unitario * product.Cantidad * (order.couponDiscount || 0) / 100);
                                return (
                                    <tr key={product.ID_Producto ? product.ID_Producto : index}>
                                        <td>{product.Nombre_Producto}</td>
                                        <td>{product.NombreTienda || 'N/A'}</td>
                                        <td>{product.Cantidad}</td>
                                        <td>${product.Precio_Unitario.toFixed(2)}</td>
                                        <td>${total.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Versión simplificada de la tabla para pantallas pequeñas */}
                <div className="block md:hidden">
                    <ul>
                        {order.products.map((product, index) => {
                            const total = product.Precio_Unitario * product.Cantidad - 
                                (product.Precio_Unitario * product.Cantidad * (order.couponDiscount || 0) / 100);
                            return (
                                <li key={product.ID_Producto ? product.ID_Producto : index} className="border-b py-2">
                                    <p><strong>Producto:</strong> {product.Nombre_Producto}</p>
                                    <p><strong>Tienda:</strong> {product.NombreTienda || 'N/A'}</p>
                                    <p><strong>Cantidad:</strong> {product.Cantidad}</p>
                                    <p><strong>Precio:</strong> ${product.Precio_Unitario.toFixed(2)}</p>
                                    <p><strong>Total:</strong> ${total.toFixed(2)}</p>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <h3>Monto Total: </h3>
                <p><strong>${order.total.toFixed(2)}</strong></p> 
            </div>
    
            <button className="download-button" onClick={downloadTicket}>Descargar comprobante</button>
        </div>
    );
};

export default Confirmation;
