import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, Download, Filter, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function Movements() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['movements', search, type, startDate, endDate, page],
    queryFn: async () => {
      const response = await api.get('/movements', {
        params: { search, type, startDate, endDate, page, limit: 20 },
      });
      return response.data;
    },
  });

  const token = localStorage.getItem('token');

  const buildExportUrl = (path, extraParams = {}) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (type) params.append('type', type);
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    if (token) {
      params.append('token', token);
    }
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${base}${path}?${params.toString()}`;
  };

  const confirmExport = (message) => {
    return window.confirm(message);
  };

  const exportPDF = () => {
    if (!confirmExport('¿Deseas generar el PDF con los movimientos filtrados?')) return;
    window.open(buildExportUrl('/export/movements/pdf'), '_blank');
  };

  const exportExcel = () => {
    if (!confirmExport('¿Deseas generar el Excel con los movimientos filtrados?')) return;
    window.open(buildExportUrl('/export/movements/excel'), '_blank');
  };

  const exportSinglePDF = (movementId) => {
    if (!confirmExport('¿Generar PDF de este movimiento?')) return;
    window.open(buildExportUrl('/export/movements/pdf', { movementId }), '_blank');
  };

  const exportSingleExcel = (movementId) => {
    if (!confirmExport('¿Generar Excel de este movimiento?')) return;
    window.open(buildExportUrl('/export/movements/excel', { movementId }), '_blank');
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Movimientos</h1>
          <p className="text-gray-600 mt-1">Historial de entradas y salidas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportPDF} className="btn btn-secondary">
            <Download size={18} className="mr-2" />
            PDF
          </button>
          <button onClick={exportExcel} className="btn btn-secondary">
            <Download size={18} className="mr-2" />
            Excel
          </button>
          <button
            onClick={() => navigate('/movements/new')}
            className="btn btn-primary"
          >
            <Plus size={18} className="mr-2" />
            Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Filter size={20} />
          <h3 className="font-semibold">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Producto..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="input"
            >
              <option value="">Todos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha Fin
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Código</th>
              <th>Cantidad total</th>
              <th>Usuario</th>
              <th>Razón</th>
              <th>Detalle</th>
              <th>Exportar</th>
            </tr>
          </thead>
          <tbody>
            {data?.movements?.map((movement) => {
              const productCount = movement.movements.length;
              const firstProduct = movement.movements[0]?.product;
              const productLabel =
                productCount > 1 ? 'Varios productos' : firstProduct?.name || 'N/A';

              return (
                <tr key={movement.id}>
                  <td>{format(new Date(movement.createdAt), 'dd/MM/yyyy HH:mm')}</td>
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
                  <td className="font-medium">{productLabel}</td>
                  <td className="font-mono text-sm">{movement.code}</td>
                  <td>{movement.totalQuantity}</td>
                  <td>{movement.user.name}</td>
                  <td className="text-gray-600">{movement.reason || '-'}</td>
                  <td>
                    <button
                      className="btn btn-secondary text-xs px-3 py-1"
                      onClick={() => navigate(`/movements/${movement.id}`)}
                    >
                      <Eye size={14} className="mr-1" />
                      Ver
                    </button>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary text-xs px-3 py-1"
                        onClick={() => exportSinglePDF(movement.id)}
                      >
                        PDF
                      </button>
                      <button
                        className="btn btn-secondary text-xs px-3 py-1"
                        onClick={() => exportSingleExcel(movement.id)}
                      >
                        Excel
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Paginación */}
        {data?.pagination && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {((data.pagination.page - 1) * data.pagination.limit) + 1} a{' '}
              {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} de{' '}
              {data.pagination.total} movimientos
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

