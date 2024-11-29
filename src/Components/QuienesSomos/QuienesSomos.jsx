import React from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Twitter } from 'lucide-react';

const QuienesSomos = () => {
  const founders = [
    {
      name: "Angeles Tun",
      role: "Estudiante de Entornos Virtuales y Negocios Digitales",
      image: "icono2.png",

    },
    {
      name: "Belén Sanchez",
      role: "Estudiante de Entornos Virtuales y Negocios Digitales",
      image: "icono2.png",

    },
    {
      name: "Jorge ",
      role: "Estudiante de Entornos Virtuales y Negocios Digitales",
    
      image: "icono2.png",

    },
    {
      name: "Miriam ",
      role: "Estudiante de Entornos Virtuales y Negocios Digitales",
      image: "icono2.png",

    }
  ];

  const FounderCard = ({ founder }) => {
    return (
      <div className="w-72 bg-white rounded-2xl overflow-hidden shadow-lg">
        <div className="relative h-80">
          <img 
            src={founder.image} 
            alt={founder.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
          
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="text-2xl font-bold">{founder.name}</h3>
            <p className="text-yellow-400 font-medium mt-1">{founder.role}</p>
            <p className="text-gray-200 mt-4 leading-relaxed">
              {founder.bio}
            </p>
            <div className="flex gap-4 text-white/80 mt-4">

            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 py-20">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-screen-xl mx-auto px-8"
      >
        <motion.h1 
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          className="text-5xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-12"
        >
          Quiénes Somos
        </motion.h1>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="space-y-8 text-center mb-16"
        >
          <div className="max-w-3xl mx-auto bg-white/80 backdrop-blur-sm rounded-3xl p-10 shadow-xl">
            <p className="text-xl md:text-2xl leading-relaxed mb-6">
              En <span className="font-bold text-indigo-700">Extravagant Style®</span>, 
              nuestra misión es proporcionar una experiencia de compra exclusiva para los 
              amantes de los zapatos de alta calidad.
            </p>
            <p className="text-lg md:text-xl leading-relaxed text-gray-600">
              Fundada por expertos en moda y comercio electrónico, nos enfocamos en 
              ofrecer un servicio excepcional tanto a compradores como vendedores.
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-4xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 mb-12">
            Nuestro Equipo Fundador
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {founders.map((founder, index) => (
              <FounderCard key={founder.name} founder={founder} />
            ))}
          </div>
        </motion.div>

        <motion.div 
          className="text-center"
          whileHover={{ scale: 1.05 }}
        >
          <a
            href="/registro"
            className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-8 rounded-full text-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            ¡Únete a nuestra plataforma como vendedor!
          </a>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default QuienesSomos;
