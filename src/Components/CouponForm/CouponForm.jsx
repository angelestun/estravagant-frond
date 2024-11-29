import React, { useState, useEffect } from 'react';
import './CouponForm.css';
import axios from 'axios';
import { useConnectivity } from '../../context/ConnectivityProvider';

const CouponForm = () => {
  const [formData, setFormData] = useState({
    Descripcion: '',
    Codigo: '',
    Fecha_Fin: '',
    Descuento: '',
    Fecha_Inicio: '',
    Estado: 0,
    Activo: 0,
    Motivo_Rechazo: null,
  });

  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [currentDate, setCurrentDate] = useState('');
  const [idTienda, setIdTienda] = useState();
  const [loading, setLoading] = useState(true);
  const userData = localStorage.getItem('userId');
  const { isOnline, showNotification } = useConnectivity();

  useEffect(() => {
    const fetchData = async () => {
      await fetchCupones();
      await fetchIdTienda(); 
      setLoading(false);
    };

    fetchData();
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
  }, []);

  const fetchIdTienda = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/tienda/${userData}`);
      if (response.data.length > 0) {
        const tienda = response.data[0];
        if (tienda.ID_Tienda) {
          setIdTienda(tienda.ID_Tienda);
        }
      }
    } catch (error) {
      console.error("Error al obtener ID_Tienda: ", error);
    }
  };

  const fetchCupones = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/cupones/vendedor/${userData}`);
      const formattedCoupons = response.data.map(coupon => ({
        ...coupon,
        Fecha_Inicio: formatDate(coupon.Fecha_Inicio),
        Fecha_Fin: formatDate(coupon.Fecha_Fin),
      }));
      setCoupons(formattedCoupons);
    } catch (error) {
      console.error("Error al obtener cupones: ", error);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${year}-${month}-${day}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const cleanFormData = () => {
    setFormData({
      Codigo: '',
      Descripcion: '',
      Fecha_Fin: '',
      Descuento: '',
      Fecha_Inicio: '',
      Estado: 0,
      Activo: 0,
      Motivo_Rechazo: null,
    });
    setEditingCoupon(null);
  };

  const isFormValid = () => {
    if (!formData.Descripcion || !formData.Codigo || !formData.Fecha_Fin || !formData.Descuento || !idTienda) {
      return false;
    }

    const fechaInicio = new Date(formData.Fecha_Inicio);
    const fechaFin = new Date(formData.Fecha_Fin);
    const hoy = new Date().setHours(0, 0, 0, 0);

    if (fechaInicio < hoy || fechaFin < hoy) {
      alert('Las fechas no pueden ser anteriores a la fecha actual');
      return false;
    }

    if (fechaInicio >= fechaFin) {
      alert('La Fecha de Fin debe ser posterior a la Fecha de Inicio');
      return false;
    }

    if (coupons.some(coupon => coupon.Codigo === formData.Codigo && editingCoupon?.ID_Cupones !== coupon.ID_Cupones)) {
      alert('El código ya existe');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para crear o modificar cupones',
        'warning'
      );
      return;
    }
  
    if (!isFormValid()) {
      return;
    }
  
    const currentDateTime = new Date().toISOString();
  
    const newCoupon = {
      ...formData,
      FechaCreacion: currentDateTime,
      Estado: 0,
      ID_Usuario: userData,
      ID_Tienda: idTienda,
    };
  
    try {
      if (editingCoupon) {
        const updateCoupon = {
          Descripcion: formData.Descripcion,
          Codigo: formData.Codigo,
          Fecha_Fin: formData.Fecha_Fin,
          Descuento: formData.Descuento,
          Estado: 0,
          Fecha_Inicio: formData.Fecha_Inicio,
          Motivo_Rechazo: null,
          ID_Tienda: idTienda,
        };
  
        await axios.put(`http://localhost:3000/cupones/${editingCoupon.ID_Cupones}`, updateCoupon);
        alert("Cupón actualizado y enviado para aprobación");
      } else {
        await axios.post('http://localhost:3000/createcupones', newCoupon);
        alert("Cupón enviado para aprobación");
      }
  
      fetchCupones();
    } catch (error) {
      alert("Ocurrió un error al registrar o actualizar el cupón");
      console.error(error);
    }
  
    cleanFormData();
  };

  const handleEdit = (coupon) => {
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para editar cupones',
        'warning'
      );
      return;
    }
    setEditingCoupon(coupon);
    setFormData({
      Codigo: coupon.Codigo,
      Descripcion: coupon.Descripcion,
      Fecha_Fin: coupon.Fecha_Fin,
      Descuento: coupon.Descuento,
      Fecha_Inicio: coupon.Fecha_Inicio,
      Estado: coupon.Estado,
      Motivo_Rechazo: coupon.Motivo_Rechazo || '',
    });
  };

const handleDelete = async (id) => {
  if (!isOnline) {
    showNotification(
      'Conexión Requerida',
      'Se necesita conexión a Internet para eliminar cupones',
      'warning'
    );
    return;
  }
  try {
    await axios.delete(`http://localhost:3000/cupones/${id}`);
    alert("Cupón eliminado con éxito");
    fetchCupones();
  } catch (error) {
    alert("Ocurrió un error al eliminar el cupón");
    console.error(error);
  }
};


  const getCouponStatus = (coupon) => {
    const now = new Date();
    if (coupon.Activo === 1 && now >= new Date(coupon.Fecha_Inicio) && now <= new Date(coupon.Fecha_Fin)) {
      return 'activo';
    } else if (coupon.Activo === 0 && now < new Date(coupon.Fecha_Inicio)) {
      return 'inactivo';
    } else if (coupon.Activo === 0 || now > new Date(coupon.Fecha_Fin)) {
      return 'expirado';
    }
    return '';
  };

  const getApprovalStatus = (estado) => {
    switch (estado) {
      case 0: return 'Pendiente';
      case 1: return 'Aprobado';
      case 2: return 'Rechazado';
      default: return '';
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="coupon-form">
      <h1>Registro de Cupones</h1>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="Codigo">Código:</label>
          <input
            type="text"
            id="Codigo"
            name="Codigo"
            value={formData.Codigo}
            onChange={handleChange}
            maxLength="50"
          />
        </div>

        <div className="form-group">
          <label htmlFor="Descripcion">Descripción:</label>
          <input
            type="text"
            id="Descripcion"
            name="Descripcion"
            value={formData.Descripcion}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="Fecha_Inicio">Fecha de inicio:</label>
          <input
            type="date"
            id="Fecha_Inicio"
            name="Fecha_Inicio"
            value={formData.Fecha_Inicio}
            onChange={handleChange}
            min={currentDate}
          />
        </div>

        <div className="form-group">
          <label htmlFor="Fecha_Fin">Fecha de Fin:</label>
          <input
            type="date"
            id="Fecha_Fin"
            name="Fecha_Fin"
            value={formData.Fecha_Fin}
            onChange={handleChange}
            min={currentDate}
          />
        </div>

        <div className="form-group">
          <label htmlFor="Descuento">Descuento (%):</label>
          <input
            type="number"
            id="Descuento"
            name="Descuento"
            value={formData.Descuento}
            onChange={handleChange}
            step="0.01"
            min="0"
            max="100"
          />
        </div>

        <button 
          type="submit"
          disabled={!isFormValid()}
        >
          {editingCoupon !== null ? 'Actualizar Cupón' : 'Registrar Cupón'}
        </button>
      </form>

      <h2>Cupones Registrados</h2>
      <div className="coupons-list">
        {coupons.map((coupon) => (
          <div className={`coupon-card ${getCouponStatus(coupon)}`} key={coupon.ID_Cupones}>
            <div className="coupon-details">
              <p><strong>{getApprovalStatus(coupon.Estado)}</strong></p>
              <p><strong>Folio Tienda:</strong> {coupon.ID_Tienda}</p>
              <p><strong>Código:</strong> {coupon.Codigo}</p>
              <p><strong>Descripción:</strong> {coupon.Descripcion}</p>
              <p><strong>Fecha Inicio:</strong> {coupon.Fecha_Inicio}</p>
              <p><strong>Fecha Fin:</strong> {coupon.Fecha_Fin}</p>
              <p><strong>Descuento:</strong> {coupon.Descuento}%</p>
              <p><strong>Estado:</strong> {getCouponStatus(coupon) === 'activo' ? 'Activo' : getCouponStatus(coupon) === 'inactivo' ? 'Inactivo' : 'Expirado'}</p>
              {coupon.Estado === 2 && coupon.Motivo_Rechazo && (
                <p><strong>Motivo de Rechazo:</strong> {coupon.Motivo_Rechazo}</p>
              )}
            </div>
            <div className="coupon-actions">
              {getCouponStatus(coupon) === 'expirado' ? (
                <button onClick={() => handleDelete(coupon.ID_Cupones)}>
                  Eliminar
                </button>
              ) : (
                <>
                  {coupon.Estado === 0 && (
                    <button onClick={() => handleDelete(coupon.ID_Cupones)}>
                      Eliminar
                    </button>
                  )}
                  {(coupon.Estado === 1 || coupon.Estado === 2) && (
                    <button onClick={() => handleEdit(coupon)}>
                      Editar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CouponForm;
