import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeComponent.css';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { useConnectivity } from '../../context/ConnectivityProvider';



const HomeComponent = () => {
  const navigate = useNavigate();
  const { isOnline } = useConnectivity();
  useEffect(() => {
    if (isOnline) {
      localStorage.setItem('lastHomeState', JSON.stringify({
        timestamp: new Date().toISOString()
      }));
    }
  }, [isOnline]);



  const handleShopNow = () => {
    if (!isOnline) {
      navigate('/store');
    } else {
      navigate('/store');
    }
  };
    const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3200
  };

  return (
    <div className="home-component">
      <div className="welcome-section">
        <Slider {...settings} className="text-slider">
          <div className="text-content">
            <h1>Tu Look</h1>
            <h2>Tu Estilo</h2>
            <p>
            Bienvenidos a Extravagant Style®: donde cada paso es una declaración de estilo. Ofrecemos zapatos de alta calidad y últimas tendencias.</p>
            <button className="shop-now" onClick={handleShopNow}>Comprar ahora</button>
          </div>
          <div className="text-content">
            <h1>Descubre</h1>
            <h2>La Nueva Colección</h2>
            <p>
              Explora nuestra última colección de calzado que combina estilo y comodidad.
              Perfecto para cualquier ocasión y diseñado para destacar.
            </p>
            <button className="shop-now" onClick={handleShopNow}>Comprar ahora</button>
          </div>
          <div className="text-content">
            <h1>Estilo</h1>
            <h2>Comodidad</h2>
            <p>
            Encuentra el equilibrio perfecto entre estilo y comodidad en nuestra selección de calzado. No sacrifiques uno por el otro.
            </p>
            <button className="shop-now" onClick={handleShopNow}>Comprar ahora</button>
          </div>
        </Slider>
        <div className="image-content">
          <img
            src="/modelo-1.png"
            alt="Fashion"
            style={{ width: "100%", maxHeight: "900px", objectFit: "cover" }}
          />
        </div>
      </div>
    </div>
  );
};

export default HomeComponent;
