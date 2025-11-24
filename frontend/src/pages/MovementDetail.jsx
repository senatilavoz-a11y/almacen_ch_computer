import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowLeft } from 'lucide-react';

export default function MovementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: movement, isLoading } = useQuery({
    queryKey: ['movement-detail', id],
    queryFn: async () => {
      const response = await api.get(`/movements/${id}`);
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!movement) {
    return (
      <div className="space-y-4">
        <p className="text-center text-gray-600">Movimiento no encontrado.</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/movements')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Movimiento {movement.code}</h1>
          <p className="text-gray-600 mt-1">Detalle completo del movimiento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-2">
          <h2 className="text-xl font-semibold">Información general</h2>
          <p><strong>Tipo:</strong> {movement.type}</p>
          <p><strong>Fecha:</strong> {new Date(movement.createdAt).toLocaleString('es-ES')}</p>
          <p><strong>Usuario:</strong> {movement.user.name}</p>
          <p><strong>Cantidad total:</strong> {movement.totalQuantity}</p>
        </div>
        <div className="card space-y-2">
          <h2 className="text-xl font-semibold">Notas</h2>
          <p><strong>Razón:</strong> {movement.reason || '—'}</p>
          <p><strong>Notas:</strong> {movement.notes || '—'}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Productos Movidos</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Código</th>
                <th>Cantidad</th>
                <th>Ubicación</th>
                <th>Proveedor</th>
              </tr>
            </thead>
            <tbody>
              {movement.movements.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.product.name}</td>
                  <td className="font-mono text-sm">{item.product.code}</td>
                  <td>{item.quantity}</td>
                  <td>{item.product.location}</td>
                  <td>{item.product.supplier?.name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

