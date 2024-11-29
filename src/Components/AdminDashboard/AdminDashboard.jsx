import React, { useState, useEffect } from 'react';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area, BarChart, Bar, LineChart, Line, RadialBarChart, RadialBar, ComposedChart
} from 'recharts';
import { Users, Store, ShoppingCart, DollarSign } from 'lucide-react';
import { useConnectivity } from '../../context/ConnectivityProvider';



const COLORS = {
  PRIMARY: ['#0088FE', '#00C49F'],
  STORES: ['#8884d8', '#83a6ed', '#8dd1e1'],
  COUPONS: ['#a4de6c', '#d0ed57']
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value || 0);
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow">
        <p className="font-semibold">{label}</p>
        {payload.map((pld, index) => (
          <p key={index} style={{ color: pld.color }}>
            {pld.name}: {pld.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const UserDistributionChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const transformedData = data.map(item => ({
    name: item.role === 'usuario' ? 'Cliente' : 'Vendedor',
    value: item.count
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={transformedData}
          cx="50%"
          cy="50%"
          labelLine={true}
          label={({ name, value, percent }) => 
            `${name} (${value} - ${(percent * 100).toFixed(0)}%)`
          }
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
        >
          {transformedData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.name === 'Cliente' ? COLORS.PRIMARY[0] : COLORS.PRIMARY[1]} 
            />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStores: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0
  });
  const [storeStats, setStoreStats] = useState([]);
  const [promotionsStats, setPromotionsStats] = useState({ cupones: [], ofertas: [] });
  const [userRoles, setUserRoles] = useState([]);
  const [dateRange, setDateRange] = useState('6');
  const [loading, setLoading] = useState(true);
  const [usersMonthly, setUsersMonthly] = useState([]);
  const [couponStats, setCouponStats] = useState({ used: [], inUse: [] });
  const { isOnline, showNotification } = useConnectivity();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isOnline) {
          const cachedData = localStorage.getItem('adminDashboardData');
          if (cachedData) {
            const {
              statsData,
              storeData,
              promoData,
              rolesData,
              monthlyData,
              couponsData
            } = JSON.parse(cachedData);

            setStats(statsData);
            setStoreStats(storeData);
            setPromotionsStats(promoData);
            setUserRoles(rolesData);
            setUsersMonthly(monthlyData);
            setCouponStats(couponsData);
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
        const [statsRes, storeRes, promoRes, rolesRes, monthlyRes, couponRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/store-stats'),
          fetch('/api/admin/promotions-stats'),
          fetch('/api/admin/user-role-distribution'),
          fetch(`/api/admin/users-monthly?months=${dateRange}`), 
          fetch('/api/admin/coupons-usage')
        ]);

        const [statsData, storeData, promoData, rolesData, monthlyData, couponsData] = await Promise.all([
          statsRes.json(),
          storeRes.json(),
          promoRes.json(),
          rolesRes.json(),
          monthlyRes.json(),
          couponRes.json()
        ]);

        const dashboardData = {
          statsData,
          storeData,
          promoData,
          rolesData,
          monthlyData,
          couponsData,
          lastUpdate: Date.now()
        };
        localStorage.setItem('adminDashboardData', JSON.stringify(dashboardData));

        setStats(statsData);
        setStoreStats(storeData);
        setPromotionsStats(promoData);
        setUserRoles(rolesData);
        setUsersMonthly(monthlyData);
        setCouponStats(couponsData);

      } catch (error) {
        console.error('Error:', error);
        const cachedData = localStorage.getItem('adminDashboardData');
        if (cachedData) {
          const parsedData = JSON.parse(cachedData);
          setStats(parsedData.statsData);
          setStoreStats(parsedData.storeData);
          setPromotionsStats(parsedData.promoData);
          setUserRoles(parsedData.rolesData);
          setUsersMonthly(parsedData.monthlyData);
          setCouponStats(parsedData.couponsData);
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
  }, [dateRange, isOnline]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white">
      <div className="flex justify-between items-center mb-6">
        <select 
          className="px-3 py-2 border rounded-md"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="3">Últimos 3 meses</option>
          <option value="6">Últimos 6 meses</option>
          <option value="12">Último año</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Usuarios" 
          value={stats.totalUsers.toLocaleString()} 
          icon={Users} 
          color="blue" 
        />
        <StatCard 
          title="Total Tiendas" 
          value={stats.totalStores.toLocaleString()} 
          icon={Store} 
          color="green" 
        />
        <StatCard 
          title="Total Pedidos" 
          value={stats.totalOrders.toLocaleString()} 
          icon={ShoppingCart} 
          color="yellow" 
        />
        <StatCard 
          title="Ventas Totales" 
          value={formatCurrency(stats.totalSales)} 
          icon={DollarSign} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Distribución de Usuarios por Rol</h2>
          <div className="h-[400px]">
            <UserDistributionChart data={userRoles} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Registro Mensual de Usuarios</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usersMonthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0088FE" 
                  name="Nuevos Usuarios"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Uso de Cupones Global</h2>
            <select 
              className="px-3 py-1 border rounded-md"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="3">Últimos 3 meses</option>
              <option value="6">Últimos 6 meses</option>
              <option value="12">Último año</option>
            </select>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={couponStats.used}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="total_uses" name="Cupones Usados" fill="#8884d8" />
                <Line 
                  type="monotone" 
                  dataKey="active_uses" 
                  name="Cupones En Uso" 
                  stroke="#82ca9d" 
                  data={couponStats.inUse}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>


        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Actividad de Tiendas</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={storeStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="active" name="Activas" stroke="#0088FE" />
                <Line type="monotone" dataKey="pending" name="Pendientes" stroke="#00C49F" />
                <Line type="monotone" dataKey="rejected" name="Rechazadas" stroke="#FF8042" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Estado de Cupones</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={promotionsStats.cupones} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" stackId="a" name="Aprobados" fill={COLORS.COUPONS[0]} />
                <Bar dataKey="pending" stackId="a" name="Pendientes" fill={COLORS.COUPONS[1]} />
                <Bar dataKey="rejected" stackId="a" name="Rechazados" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>


        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Tendencias de Ofertas</h2>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={promotionsStats.ofertas}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="active" name="Activas" stroke={COLORS.COUPONS[0]} fill={COLORS.COUPONS[0]} fillOpacity={0.4} />
                <Area type="monotone" dataKey="total" name="Total" stroke={COLORS.COUPONS[1]} fill={COLORS.COUPONS[1]} fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
