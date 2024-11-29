import React from 'react';
import './ProductPreviewModal.css';

const ProductPreviewModal = ({ product, onClose, handleAddToCart }) => {
  if (!product) return null;

  const sizes = product.Talla ? product.Talla.split(',') : [];
  const colors = product.Color ? [product.Color] : [];

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose(); 
    }
  };

  const formatColor = (color) => {
    const colorMapping = {
      negro: 'black',
      blanco: 'white',
      rojo: 'red',
      azul: 'blue',
      verde: 'green',
      amarillo: 'yellow',
      naranja: 'orange',
      gris: 'gray',
      marrón: 'brown',
      rosa: 'pink',
      morado: 'purple',
      plata: 'silver',
      dorado: 'gold',
      crema: '#f5f5dc',
      aqua: 'aqua',
      teal: 'teal',
      lavanda: 'lavender',
      salmón: 'lightcoral',
      coral: 'coral',
      oliva: 'olive',
      cian: 'cyan',
    };
    return colorMapping[color.toLowerCase()] || color;
  };

  const formatPrice = (price) => {
    return `$${price.toFixed(2).replace(/\B(?=(\d{3})+(?!))/g, ",")}`;
  };

  return (
    <div className="custom-modal-overlay" onClick={handleOverlayClick}>
      <div className="custom-modal-content">
        <button className="custom-modal-close-button" onClick={onClose}>
          <span className="custom-modal-close-line"></span>
          <span className="custom-modal-close-line rotated"></span>
        </button>
        <div className="custom-modal-body">
          <div className="custom-modal-image-container">
            <img 
              src={`http://localhost:3000/uploads/products/${product.Imagen}`} 
              alt={product.Nombre_Producto} 
              className="custom-modal-product-image" 
            />
          </div>
          <div className="custom-modal-product-info">
            <h2 className="product-name">{product.Nombre_Producto}</h2>
            {product.Oferta ? (
              <>
                {product.Tipo_Oferta === '2x1' ? (
                  <p className="custom-modal-price">
                    {formatPrice(product.Precio)} <span style={{ fontSize: '0.8em', color: 'green' }}>2x1 OFF</span>
                  </p>
                ) : (
                  <>
                    <p className="original-price" style={{ textDecoration: 'line-through', color: 'gray' }}>
                      {formatPrice(product.Precio)}
                    </p>
                    <p className="discounted-price" style={{ color: 'black', fontWeight: 'bold' }}>
                      {formatPrice(product.Precio - (product.Precio * (product.Descuento / 100)))} 
                      <span style={{ fontSize: '0.8em', color: 'red' }}> ({product.Descuento}% OFF)</span>
                    </p>
                  </>
                )}
              </>
            ) : (
              <p className="custom-modal-price">{formatPrice(product.Precio)}</p>
            )}
            <p className="product-description">{product.Descripcion}</p>

            <div className="custom-modal-sizes-colors">
              {sizes.length > 0 && (
                <div className="custom-modal-sizes">
                  <h4>Tallas:</h4>
                  {sizes.map(talla => (
                    <span key={talla} className="size-box">{talla}</span>
                  ))}
                </div>
              )}
              {colors.length > 0 && (
                <div className="custom-modal-colors">
                  <h4>Colores:</h4>
                  {colors.map(color => (
                    <span 
                      key={color} 
                      className="color-box" 
                      style={{ background: formatColor(color) }} 
                    ></span>
                  ))}
                </div>
              )}
            </div>
            <p>Marca: {product.Marca}</p>
            <div className="custom-modal-button-container">
              <button 
                className="custom-modal-add-to-cart-button" 
                onClick={() => handleAddToCart(product.ID_Producto)}
              >
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPreviewModal;
