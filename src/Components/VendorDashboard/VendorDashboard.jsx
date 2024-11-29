import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { Package, ShoppingCart, DollarSign, Percent, Tag } from 'lucide-react';
import { useConnectivity } from '../../context/ConnectivityProvider';


const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value || 0);
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' });
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
        </div>
        <Icon className={`h-8 w-8 text-${color}-500`} />
      </div>
    </div>
  );
};

const CouponStats = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Uso de Cupones</h3>
      <table className="min-w-full bg-white border rounded-lg">
        <thead>
          <tr className="bg-gray-800"> 
            <th className="px-6 py-3 border-b text-left text-xs font-medium text-white uppercase tracking-wider">Código</th>
            <th className="px-6 py-3 border-b text-left text-xs font-medium text-white uppercase tracking-wider">Descuento</th>
            <th className="px-6 py-3 border-b text-left text-xs font-medium text-white uppercase tracking-wider">Usos Totales</th>
            <th className="px-6 py-3 border-b text-left text-xs font-medium text-white uppercase tracking-wider">En Uso</th>
          </tr>
        </thead>
        <tbody>
          {data.used.map((coupon, idx) => {
            const inUseCount = data.inUse.find(c => c.Codigo === coupon.Codigo)?.active_uses || 0;
            return (
              <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.Codigo}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.Descuento}%</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{coupon.total_uses}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inUseCount}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
const VendorDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOffers: 0,
    activeCoupons: 0, 
  });
  const [dailySales, setDailySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topProductsInCart, setTopProductsInCart] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState(7);
  const [activeTab, setActiveTab] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [couponStats, setCouponStats] = useState(null);
  const { isOnline, showNotification } = useConnectivity();


  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('userId');
      console.log('userId recuperado desde localStorage:', userId);

      if (!userId) {
        console.error('No se ha encontrado el userId en localStorage');
        return;
      }

      try {
        setLoading(true);

        if (!isOnline) {
          const cachedData = localStorage.getItem('dashboardData');
          if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            setDailySales(parsedData.dailySales);
            setStats(parsedData.stats);
            setTopProducts(parsedData.topProducts);
            setTopProductsInCart(parsedData.topProductsInCart);
            setCouponStats(parsedData.couponStats);
            showNotification(
              'Modo Offline',
              'Mostrando datos guardados localmente',
              'info'
            );
            setLoading(false);
            return;
          }
          showNotification(
            'Sin Conexión',
            'No hay datos guardados para mostrar offline',
            'warning'
          );
          return;
        }

        
        const salesResponse = await fetch(`/api/vendor/${userId}/daily-sales-trend?days=${selectedTimeRange}`);
        const salesData = await salesResponse.json();
        const formattedSalesData = salesData.map(sale => ({
          ...sale,
          date: formatDate(sale.date),
        }));
        setDailySales(formattedSalesData);

        const statsResponse = await fetch(`/api/vendor/${userId}/stats`);
        const statsData = await statsResponse.json();
        setStats(statsData);

        const topProductsResponse = await fetch(`/api/vendor/${userId}/stats`);
        const topProductsData = await topProductsResponse.json();
        setTopProducts(topProductsData.topProducts);

        const cartProductsResponse = await fetch(`/api/vendor/${userId}/products-in-cart`);
        const cartProductsData = await cartProductsResponse.json();
        setTopProductsInCart(cartProductsData);

        const couponsResponse = await fetch(`/api/vendor/${userId}/active-coupons`);
        const couponsData = await couponsResponse.json();
        setStats(prevStats => ({ ...prevStats, activeCoupons: couponsData.length }));
        
        const couponsRes = await fetch(`/api/vendor/${userId}/coupons-usage`);
        const couponData = await couponsRes.json();
        setCouponStats(couponData);
        
        const dashboardData = {
          dailySales: formattedSalesData,
          stats: { ...statsData, activeCoupons: couponsData.length },
          topProducts: topProductsData.topProducts,
          topProductsInCart: cartProductsData,
          couponStats: couponData,
          lastUpdate: Date.now()
        };
        localStorage.setItem('dashboardData', JSON.stringify(dashboardData));

      } catch (error) {
        console.error('Error al obtener datos:', error);
        const cachedData = localStorage.getItem('dashboardData');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setDailySales(parsedData.dailySales);
          setStats(parsedData.stats);
          setTopProducts(parsedData.topProducts);
          setTopProductsInCart(parsedData.topProductsInCart);
          setCouponStats(parsedData.couponStats);
          showNotification(
            'Error de Conexión',
            'Mostrando datos guardados localmente',
            'warning'
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const intervalId = setInterval(() => {
      if (isOnline) {
        fetchData();
      }
    }, 300000);

    return () => clearInterval(intervalId);
  }, [selectedTimeRange, isOnline]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 shadow-lg rounded-lg border">
          <p className="font-bold">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('revenue') 
                ? formatCurrency(entry.value)
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Productos" 
          value={stats.totalProducts} 
          icon={Package} 
          color="blue" 
        />
        <StatCard 
          title="Total Pedidos" 
          value={stats.totalOrders} 
          icon={ShoppingCart} 
          color="green" 
        />
        <StatCard 
          title="Ingresos Totales" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={DollarSign} 
          color="yellow" 
        />
        <StatCard 
          title="Ofertas Activas" 
          value={stats.activeOffers} 
          icon={Percent} 
          color="purple" 
        />
        <StatCard 
          title="Cupones Activos" 
          value={stats.activeCoupons} 
          icon={Tag} 
          color="red" 
        />
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex">
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'daily' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('daily')}
            >
              Ventas Diarias
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'top-products' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('top-products')}
            >
              Productos Más Vendidos
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'cart-products' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('cart-products')}
            >
              Productos en Carrito
            </button>

            <button
              className={`px-4 py-2 text-sm font-medium ${activeTab === 'coupons-stats' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('coupons-stats')}
            >
              Cupones
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'daily' ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Tendencia de Ventas Diarias</h2>
                <select
                  className="px-3 py-1 border rounded-md"
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
                >
                  <option value={7}>Última semana</option>
                  <option value={15}>Últimos 15 días</option>
                  <option value={30}>Último mes</option>
                </select>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailySales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="total_revenue"
                      name="Ingresos"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.3}
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="total_orders"
                      name="Pedidos"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : activeTab === 'top-products' ? (
            <>
              <h2 className="text-lg font-semibold mb-4">Productos Más Vendidos</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" fill="#82ca9d" name="Unidades Vendidas" />
                    <Bar dataKey="revenue" fill="#8884d8" name="Ingresos" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : activeTab === 'cart-products' ? (
            <>
              <h2 className="text-lg font-semibold mb-4">Productos en Carrito</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProductsInCart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="quantity" fill="#82ca9d" name="Cantidad en Carrito" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
            
          ) : activeTab === 'coupons-stats' ? (
            <>
              <h2 className="text-lg font-semibold mb-4">Estadísticas de Cupones</h2>
              {couponStats && <CouponStats data={couponStats} />}
            </>
          ) : null}
          
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
