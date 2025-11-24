import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import {
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 30000, // Refrescar cada 30 segundos
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Productos',
      value: stats?.totalProducts || 0,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Cantidad Total',
      value: stats?.totalQuantity || 0,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Stock Bajo',
      value: stats?.lowStockCount || 0,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
    {
      title: 'Total Movimientos',
      value: stats?.totalMovements || 0,
      icon: ArrowUpCircle,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Resumen general del almacén</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value.toLocaleString()}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Movimientos últimos 7 días */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Movimientos (Últimos 7 días)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.movementsLast7Days || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Movimientos"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Movimientos por tipo */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Movimientos por Tipo (30 días)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: 'Entradas',
                  value: stats?.movementsByType?.ENTRADA || 0,
                },
                {
                  name: 'Salidas',
                  value: stats?.movementsByType?.SALIDA || 0,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Movimientos recientes */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Movimientos Recientes</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentMovements?.map((movement) => (
                <tr key={movement.id}>
                  <td>
                    {new Date(movement.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        movement.type === 'ENTRADA'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {movement.type}
                    </span>
                  </td>
                  <td>{movement.product.name}</td>
                  <td>{movement.quantity}</td>
                  <td>{movement.user.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

