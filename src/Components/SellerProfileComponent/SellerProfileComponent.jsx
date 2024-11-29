import { useState, useEffect, useRef } from 'react';
import './SellerProfileComponent.css';
import axios from 'axios';
import AvatarEditor from 'react-avatar-editor';
import { message } from 'react-message-popup';
import { useConnectivity } from '../../context/ConnectivityProvider';


const SellerProfileComponent = () => {
  const [formData, setFormData] = useState({
    NombreTienda: '',
    Descripcion: '',
    Logo: null,
    acceptedTerms: false,
    userId: 0
  });
  const userData = localStorage.getItem('userId');
  const [tiendas, setTiendas] = useState([]);
  const [imageScale, setImageScale] = useState(1);
  const editorRef = useRef(null);
  const [Message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTiendaId, setCurrentTiendaId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { isOnline, showNotification } = useConnectivity();


  useEffect(() => {
    fetchTiendas();
  }, [userData]);

  const fetchTiendas = async () => {
    if (!isOnline) {
      const cachedTiendas = localStorage.getItem('cachedTiendas');
      if (cachedTiendas) {
        setTiendas(JSON.parse(cachedTiendas));
        return;
      }
      showNotification(
        'Sin Conexión',
        'No hay tiendas guardadas para mostrar offline',
        'warning'
      );
      return;
    }
    try {
      const response = await axios.get(`http://localhost:3000/tienda/${userData}`);
      setTiendas(response.data);
      if (response.data.length > 0) {
        const msg = message.warning('Ya tienes una tienda creada, no puedes agregar más', 4000);
        if (msg && typeof msg.destroy === 'function') {
          setTimeout(() => {
            msg.destroy();
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error al obtener las tiendas:", userData, error);
    }
  };
  
  useEffect(() => {
    fetchTiendas();
  }, [userData, isOnline]);

  const handleChange = (e) => {
    const { name, value, files, checked } = e.target;
    if (name === 'Logo') {
      setFormData({ ...formData, Logo: files[0] });
    } else if (name === 'acceptedTerms') {
      setFormData({ ...formData, acceptedTerms: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para registrar o actualizar una tienda',
        'warning'
      );
      return;
    }
    if (!formData.NombreTienda || (!isEditing && !formData.acceptedTerms)) {
      alert("Por favor, completa todos los campos requeridos y acepta los términos.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('NombreTienda', formData.NombreTienda);
    formDataToSend.append('Descripcion', formData.Descripcion);

    if (formData.Logo) {
      formDataToSend.append('logo', formData.Logo, formData.Logo.name);
    }
    if (!isEditing) {
      formDataToSend.append('userId', userData);
    }

    try {
      if (isEditing) {
        await axios.put(`http://localhost:3000/tienda/${currentTiendaId}`, formDataToSend);
        setMessage("Tienda actualizada con éxito.");
      } else {
        if (tiendas.length === 0) {
          await axios.post('http://localhost:3000/createtienda', formDataToSend);
          message.success("Se le ha enviado al administrador para su aprobación.", 4000);
        } else {
          cleanFormData();
          message.warning('No puede agregar más tiendas', 4000).then(({ destroy }) => {
            setTimeout(() => {
              destroy();
            }, 2000);
          });
        }
      }
      fetchTiendas();
      cleanFormData();
    } catch (error) {
      alert("Ocurrió un error al enviar la tienda");
      console.error(error);
    }
  };

  const cleanFormData = () => {
    setFormData({
      NombreTienda: '',
      Descripcion: '',
      Logo: null,
      acceptedTerms: false
    });
  };

  const handleEliminar = async (id) => {
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para eliminar una tienda',
        'warning'
      );
      return;
    }

    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar esta tienda?");
    if (confirmed) {
      try {
        await axios.delete(`http://localhost:3000/tienda/${id}`);
        fetchTiendas();
        setMessage("Tienda eliminada con éxito.");
      } catch (error) {
        console.error("Error al eliminar la tienda: ", error);
      }
    }
  };

  const startEdit = (tienda) => {
    if (!isOnline) {
      showNotification(
        'Conexión Requerida',
        'Se necesita conexión a Internet para editar una tienda',
        'warning'
      );
      return;
    }
    setFormData({
      NombreTienda: tienda.NombreTienda,
      Descripcion: tienda.Descripcion,
      Logo: null,
      acceptedTerms: true,
    });
    setCurrentTiendaId(tienda.ID_Tienda);
    setIsEditing(true);
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  const isLimitReached = tiendas.length > 0;

  return (
    <div className="seller-profile-form">
      <h1>{isEditing ? "Editar Tienda" : "Registrar Tienda"}</h1>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="form-group">
          <label htmlFor="NombreTienda">Nombre de la Tienda:</label>
          <input
            type="text"
            id="NombreTienda"
            name="NombreTienda"
            value={formData.NombreTienda}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Descripcion">Descripción:</label>
          <textarea
            id="Descripcion"
            name="Descripcion"
            value={formData.Descripcion}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="Logo">Logo de la Tienda:</label>
          <input
            type="file"
            id="Logo"
            name="Logo"
            accept="image/*"
            onChange={handleChange}
          />
        </div>

        {formData.Logo && (
          <div className="image-editor-container">
            <div className="image-editor">
              <AvatarEditor
                ref={editorRef}
                image={URL.createObjectURL(formData.Logo)}
                width={150}
                height={150}
                border={50}
                borderRadius={75}
                scale={imageScale}
                rotate={0}
              />
              <input
                type="range"
                min="1"
                max="2"
                step="0.01"
                value={imageScale}
                onChange={(e) => setImageScale(parseFloat(e.target.value))}
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              name="acceptedTerms"
              checked={formData.acceptedTerms}
              onChange={handleChange}
              required
              style={{ width: 'auto', height: 'auto', marginRight: '8px' }}
            />
            He leído y acepto los
            <span
              onClick={toggleModal}
              style={{ color: 'blue', cursor: 'pointer', textDecoration: 'underline', marginLeft: '4px' }}
            >
              Términos y Condiciones
            </span>
          </label>
        </div>

        <button type="submit" disabled={isLimitReached && !isEditing}>
          {isEditing ? "Actualizar Tienda" : "Registrar Tienda"}
        </button>
      </form>

      {Message && <p>{Message}</p>}

      <h2>Mi Tienda</h2>
      <div className="tiendas-list">
        {tiendas.map((tienda) => (
          <div className="tienda-card" key={tienda.ID_Tienda}>
            <div className="tienda-details">
              <h2>(ID: {tienda.ID_Tienda})</h2>
              <h2 className="store-name-admin">{tienda.NombreTienda}</h2>
              <p>{tienda.Descripcion}</p>
              <p><strong>Estado:</strong> {tienda.activo === 0 ? 'Pendiente' : (tienda.activo === 1 ? 'Aceptada' : (tienda.activo === 2 ? 'Rechazada' : 'Baja'))}</p>
              {tienda.activo === 3 && (
                <p><strong>Motivo de Baja:</strong> {tienda.motivo_baja}</p>
              )}
              {tienda.logo && (
                <img
                  src={`http://localhost:3000/uploads/${tienda.logo}`}
                  alt={`Logo de ${tienda.NombreTienda}`}
                  className="tienda-logo"
                />
              )}
                <div className="tienda-actions">
                  {(tienda.activo === 1 || tienda.activo === 2) && (
                    <>
                      <button onClick={() => startEdit(tienda)} className="edit-btn">Editar</button>
                      <button onClick={() => handleEliminar(tienda.ID_Tienda)} className="delete-btn">Eliminar</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
   
      {isModalOpen && (
  <div className="modal-legal">
    <div className="modal-content2">
      <span className="close-s" onClick={toggleModal}>&times;</span>
   
      <h1 className="modal-title-1">Términos y Condiciones para Vendedores en Extravagant Style</h1>

      <h2 className="section-title-1">Propietario del Sitio Web</h2>
      <p>
        Este sitio web es propiedad y está operado por <strong>Extravagant Style</strong>. Estos Términos establecen las condiciones bajo las cuales puedes utilizar nuestro sitio web y los servicios que ofrecemos a los vendedores. 
        Al acceder o utilizar el sitio web de Extravagant Style, confirmas que has leído, entendido y aceptas estar vinculado por estos Términos.
      </p>

      <h2 className="section-title-1">Elegibilidad para Usar el Sitio</h2>
      <p>Para registrarte como vendedor en Extravagant Style, debes:</p>
      <ul>
        <li>Ser mayor de edad o tener la mayoría de edad legal en tu jurisdicción.</li>
        <li>Tener la autoridad legal, el derecho y la capacidad para participar en estos Términos como un acuerdo vinculante.</li>
        <li>Aceptar que, al listar un producto, eres responsable de leer la descripción completa del artículo antes de comprometerte a venderlo.</li>
      </ul>

      <h2 className="section-title-1">Precios y Pagos</h2>
      <p>
        Los precios de los productos y servicios que ofrecemos están claramente enumerados en nuestro sitio web. Nos reservamos el derecho de cambiar estos precios en cualquier momento. 
        Cualquier tarifa relacionada con el uso de nuestros servicios se cobrará mensualmente a tu método de pago.
      </p>

      <h2 className="section-title-1">Política de Devoluciones y Reembolsos</h2>
      <p>
        Si un cliente desea devolver un producto no dañado, debe hacerlo con sus accesorios y embalaje original dentro de los 14 días posteriores a la recepción. 
        Los productos solo se pueden devolver en el país donde se compraron originalmente. Algunos productos pueden no ser elegibles para devolución.
      </p>

      <h2 className="section-title-1">Modificaciones en la Oferta</h2>
      <p>
        Extravagant Style se reserva el derecho de modificar o cancelar la oferta de productos y servicios en cualquier momento y sin previo aviso.
      </p>

      <h2 className="section-title-1">Garantías y Responsabilidades</h2>
      <p>
        Si recibimos un reclamo de garantía válido sobre un producto vendido, lo repararemos o reemplazaremos. Si no podemos hacerlo en un tiempo razonable, 
        el cliente tendrá derecho a un reembolso completo. Los gastos de envío de productos reparados o reemplazados serán cubiertos por nosotros, mientras que el cliente será responsable del envío de retorno.
      </p>

      <h2 className="section-title-1">Tienda de Vendedor</h2>
      <p>
        Como vendedor en Extravagant Style, tienes la posibilidad de crear y gestionar tu propia tienda en nuestra plataforma. 
        Esto te permite exhibir tus productos y conectar con clientes de manera efectiva.
      </p>

      <h2 className="section-title-1">Suspensión o Cancelación de la Cuenta</h2>
      <p>
        Extravagant Style se reserva el derecho de suspender o cancelar tu cuenta de vendedor en cualquier momento y sin previo aviso si consideramos que has violado estos Términos o cualquier ley aplicable. 
        Esto incluye, pero no se limita a, actividades fraudulentas o incumplimiento de las políticas de la plataforma.
      </p>
      <p>
        Tienes la opción de solicitar la cancelación de tu cuenta y/o de cualquier servicio en cualquier momento. Sin embargo, ten en cuenta que al hacerlo, perderás acceso a tu tienda y a todas las funciones asociadas.
      </p>

      <h2 className="section-title-1">Indemnización</h2>
      <p>
        Aceptas indemnizar y mantener indemne a Extravagant Style frente a cualquier demanda, pérdida, responsabilidad o gasto (incluidos honorarios de abogados) que surjan de tu uso del sitio web o de los servicios ofrecidos.
      </p>

      <h2 className="section-title-1">Limitación de Responsabilidad</h2>
      <p>
        En la medida máxima permitida por la ley, Extravagant Style no será responsable de daños indirectos, punitivos, incidentales o ejemplares que surjan del uso o la imposibilidad de usar el servicio. 
        Esto incluye, pero no se limita a, la pérdida de ganancias, datos u otras pérdidas intangibles.
      </p>

      <h2 className="section-title-1">Cambios en los Términos</h2>
      <p>
        Extravagant Style se reserva el derecho de modificar estos términos en cualquier momento y a su exclusivo criterio. 
        Por ello, te recomendamos que revises esta página periódicamente. Cuando realicemos cambios significativos en los Términos, te notificaremos. 
        El uso continuado del sitio web o de nuestros servicios después de cualquier cambio constituye tu aceptación de los nuevos Términos. 
        Si no estás de acuerdo con alguno de estos términos o con cualquier versión futura, no utilices ni accedas al sitio web o a los servicios.
      </p>

      <h2 className="section-title-1">Comunicaciones y Contenido Promocional</h2>
      <p>
        Al registrarte como vendedor, aceptas recibir ocasionalmente mensajes y materiales promocionales de Extravagant Style a través de correo, email u otros medios de contacto que nos proporciones, 
        incluyendo tu número de teléfono para llamadas o mensajes de texto. Si no deseas recibir este tipo de materiales promocionales o notificaciones, puedes notificarlo en cualquier momento.
      </p>

      <h2 className="section-title-1">Ley Aplicable y Resolución de Disputas</h2>
      <p>
        Estos Términos y todos los reclamos y disputas relacionados se regirán y se interpretarán exclusivamente de acuerdo con las leyes de [país/estado]. 
        Todos los reclamos y disputas se presentarán y se resolverán exclusivamente en un tribunal de jurisdicción competente ubicado en [nombre de la ciudad]. 
        Se excluye expresamente la aplicación de la Convención de Contratos de las Naciones Unidas para la Compraventa Internacional de Mercaderías.
      </p>

      <h2 className="section-title-1">Detalles de Contacto para Atención al Cliente</h2>
      <p>
        Si necesitas asistencia o deseas comunicarte con nosotros, puedes hacerlo a través de los siguientes medios:
      </p>
      <ul>
        <li><strong>Email:</strong> soporte@extravagantstyle.com</li>
        <li><strong>Teléfono:</strong> +1 (555) 123-4567</li>
        <li><strong>Horario de Atención:</strong> Lunes a Viernes de 9:00 a 17:00 (hora local)</li>
      </ul>
      <p>
        Estamos aquí para ayudarte con cualquier pregunta o inquietud que puedas tener sobre el uso de nuestro sitio y servicios.
      </p>
    </div>
  </div>
)}
    </div>
  );
};

export default SellerProfileComponent;