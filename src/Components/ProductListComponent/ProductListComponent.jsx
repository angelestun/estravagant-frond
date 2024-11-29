import React, { useEffect, useState } from "react";
import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";
import "./ProductListComponent.css";

const ProductListComponent = ({ addToCart, cartItems }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
    
        const response = await fetch('http://localhost:3000/productos/all'); 
        const data = await response.json();
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError('Error al obtener productos');
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleAddToCart = (productId) => {
    const product = products.find(product => product.ID_Producto === productId);
    if (product) {
      addToCart(product); 
      Toastify({
        text: `${product.Nombre_Producto} ha sido añadido al carrito.`,
        duration: 3000,
        close: true,
        gravity: 'top',
        position: 'right',
        backgroundColor: '#D96FF8',
      }).showToast();
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="product-list-container">
      <div className="product-list">
        {products.filter(product => product.Stock > 0).map((product) => (
          <div key={product.ID_Producto} className="product-card">
          
            <img src={`http://localhost:3000/uploads/products/${product.Imagen}`} alt={product.Nombre_Producto} className="product-image" />
            <div className="product-details">
              <h3 className="product-name">{product.Nombre_Producto}</h3>
              <p className="product-price">${product.Precio.toFixed(2)}</p>
              <button onClick={() => handleAddToCart(product.ID_Producto)}>
                Añadir al carrito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductListComponent;
