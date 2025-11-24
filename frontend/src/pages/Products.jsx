import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Products() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, page],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { search, page, limit: 10 },
      });
      return response.data;
    },
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const response = await api.get('/products/low-stock');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">Gestiona el inventario del almacén</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/products/new')}
            className="btn btn-primary"
          >
            <Plus size={18} className="mr-2" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {lowStock && lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="font-semibold text-red-900">Productos con Stock Bajo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
            {lowStock.slice(0, 3).map((product) => (
              <div key={product.id} className="text-sm text-red-700">
                {product.name} - Stock: {product.quantity}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre, código, modelo, marca, número de serie o ubicación..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>N° Serie</th>
              <th>Cantidad</th>
              <th>Ubicación</th>
              <th>Proveedor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {data?.products?.map((product) => (
              <tr key={product.id}>
                <td className="font-mono text-sm">{product.code}</td>
                <td className="font-medium">{product.name}</td>
                <td>{product.brand?.name || 'N/A'}</td>
                <td className="text-sm text-gray-600">{product.model?.name || 'N/A'}</td>
                <td className="text-sm text-gray-600 font-mono">{product.serialNumber || 'N/A'}</td>
                <td>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      product.quantity <= product.minStock
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {product.quantity}
                  </span>
                </td>
                <td>{product.location}</td>
                <td>{product.supplier?.name}</td>
                <td>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/products/${product.id}/edit`)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Edit size={18} />
                    </button>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => {
                          if (confirm('¿Estás seguro de eliminar este producto?')) {
                            deleteMutation.mutate(product.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        {data?.pagination && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {((data.pagination.page - 1) * data.pagination.limit) + 1} a{' '}
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} de{' '}
              {data.pagination.total} productos
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.pagination.page === 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={data.pagination.page >= data.pagination.pages}
                className="btn btn-secondary disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

