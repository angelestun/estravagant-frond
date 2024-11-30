import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import './RegistroComponent.css';

export default function RegistroComponent() {
  const navigate = useNavigate();
  const [Nombre, setNombre] = useState("");
  const [Apellido, setApellido] = useState("");
  const [Correo, setCorreo] = useState("");
  const [Contraseña, setContraseña] = useState("");
  const [Rol, setRol] = useState("usuario");
  const [registroExitoso, setRegistroExitoso] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");
  const [activeTab, setActiveTab] = useState("usuario");
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const registrarUsuario = async () => {
    const objetoParaBackend = {
      Nombre,
      Apellido,
      Correo,
      Contraseña,
      Rol 
    };
  
    try {
      const responseRegistro = await fetch("https://extravagant-back.vercel.app/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(objetoParaBackend)
      });
  
      if (responseRegistro.ok) {        
        const dataRegistro = await responseRegistro.json();
        const userId = dataRegistro.user.ID_Usuario;
        await registrarCarrito(userId);

        const responseLogin = await fetch("https://extravagant-back.vercel.app/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Correo, Contraseña })
        });
  
        if (!responseLogin.ok) {
          const dataLogin = await responseLogin.json();
          throw new Error(dataLogin.error || "Error al iniciar sesión automáticamente");
        }
  
        const dataLogin = await responseLogin.json();
  
        localStorage.setItem('userId', dataLogin.usuario.ID_Usuario);
        localStorage.setItem('userRole', dataLogin.usuario.Rol);
  
        if (dataLogin.usuario.Rol === "vendedor") {
          navigate("/productos"); 
        } else {
          navigate("/home"); 
        }
      } else {
        const data = await responseRegistro.json();
        throw new Error(data.error || "Error en el registro");
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMensaje(error.message);
    }
  };

  const registrarCarrito = async (userId) => {
    const carritoObjeto = {
      ID_Usuario: userId
    };

    const responseCarrito = await fetch("https://extravagant-back.vercel.app/carrito/registro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(carritoObjeto)
    });

    if (!responseCarrito.ok) {
      const dataCarrito = await responseCarrito.json();
      throw new Error(dataCarrito.error || "Error al crear el carrito");
    }
  };

  const validarCampos = () => {
    return (
      Nombre.trim() !== "" &&
      Apellido.trim() !== "" &&
      Correo.trim() !== "" &&
      Contraseña.trim() !== ""
    );
  };

  const handleRegistroClick = () => {
    if (!isOnline) {
      setErrorMensaje("No hay conexión a internet. Por favor, conéctese e intente de nuevo.");
      return;
    }

    if (validarCampos()) {
      registrarUsuario();
    } else {
      setErrorMensaje("Por favor complete todos los campos antes de registrar.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center">
          <img src="/logo.png" alt="Logo" className="h-20 w-auto mb-6" />
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Nuevos clientes
          </h2>
        </div>

        <div className="flex border-b mb-6">
          <button
            className={`flex-1 py-2 text-center ${
              activeTab === "usuario"
                ? "text-purple-500 border-b-2 border-purple-500 font-medium"
                : "text-gray-500"
            }`}
            onClick={() => {
              setActiveTab("usuario");
              setRol("usuario");
            }}
          >
            Cuenta de Usuario
          </button>
          <button
            className={`flex-1 py-2 text-center ${
              activeTab === "vendedor"
                ? "text-purple-500 border-b-2 border-purple-500 font-medium"
                : "text-gray-500"
            }`}
            onClick={() => {
              setActiveTab("vendedor");
              setRol("vendedor");
            }}
          >
            Cuenta de Vendedor
          </button>
        </div>

        {registroExitoso && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            ¡Registro exitoso!
          </div>
        )}
        
        {errorMensaje && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {errorMensaje}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Nombre"
              value={Nombre}
              onChange={(event) => setNombre(event.target.value)}
              className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Apellido"
              value={Apellido}
              onChange={(event) => setApellido(event.target.value)}
              className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={Correo}
              onChange={(event) => setCorreo(event.target.value)}
              className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={Contraseña}
              onChange={(event) => setContraseña(event.target.value)}
              className="appearance-none rounded-full relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">
              Inicia sesión
            </Link>
          </p>
        </div>

        <div>
          <button
            onClick={handleRegistroClick}
            disabled={!isOnline}
            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-white ${
              !isOnline ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
          >
            Registrarme
          </button>
        </div>
      </div>
    </div>
  );
}