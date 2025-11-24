import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowLeft, Plus, Trash2, Save, RefreshCcw } from 'lucide-react';

export default function MovementForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [meta, setMeta] = useState({
    code: '',
    type: 'ENTRADA',
    reason: '',
    notes: '',
  });
  const [item, setItem] = useState({
    productId: '',
    quantity: 1,
  });
  const [movementQueue, setMovementQueue] = useState([]);
  const [lockedType, setLockedType] = useState(null);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await api.get('/products', { params: { limit: 1000 } });
      return response.data.products;
    },
  });

  const createMovementMutation = useMutation({
    mutationFn: async (payload) => api.post('/movements', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['movements']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboard-stats']);
      navigate('/movements');
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (payload) => api.post('/movements/batch', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['movements']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['dashboard-stats']);
      setMovementQueue([]);
      setLockedType(null);
      navigate('/movements');
    },
  });

  const selectedProduct = products?.find((p) => p.id === item.productId);

  const validateQuantity = () => {
    if (
      meta.type === 'SALIDA' &&
      selectedProduct &&
      item.quantity > selectedProduct.quantity
    ) {
      alert(
        `No puedes retirar más de lo disponible. Stock: ${selectedProduct.quantity}`
      );
      return false;
    }
    return true;
  };

  const handleAddToQueue = () => {
    if (!item.productId) return;
    if (!validateQuantity()) return;

    if (lockedType && lockedType !== meta.type) {
      alert('No puedes mezclar Entradas y Salidas en el mismo lote.');
      return;
    }

    if (!lockedType) {
      setLockedType(meta.type);
    }

    setMovementQueue((prev) => [
      ...prev,
      {
        productId: item.productId,
        quantity: item.quantity,
      },
    ]);

    setItem({
      productId: '',
      quantity: 1,
    });
  };

  const handleDirectSubmit = () => {
    if (!item.productId) return;
    if (!validateQuantity()) return;

    createMovementMutation.mutate({
      productId: item.productId,
      quantity: item.quantity,
      type: meta.type,
      reason: meta.reason,
      notes: meta.notes,
      code: meta.code || undefined,
    });
  };

  const handleSaveBatch = () => {
    if (movementQueue.length === 0) return;

    batchMutation.mutate({
      code: meta.code || undefined,
      type: lockedType || meta.type,
      reason: meta.reason,
      notes: meta.notes,
      movements: movementQueue,
    });
  };

  const removeFromQueue = (index) => {
    setMovementQueue((prev) => prev.filter((_, i) => i !== index));
    if (movementQueue.length === 1) {
      setLockedType(null);
    }
  };

  const totalQueued = movementQueue.reduce((sum, movement) => sum + movement.quantity, 0);

  const handleGenerateCode = async () => {
    setIsGeneratingCode(true);
    try {
      const response = await api.get('/movements/generate-code');
      setMeta((prev) => ({ ...prev, code: response.data.code }));
    } catch (error) {
      console.error('Error al generar código desde la API, usando fallback:', error);
      const fallback = `MOV-${Date.now().toString(36).toUpperCase()}`;
      setMeta((prev) => ({ ...prev, code: fallback }));
      alert('No se pudo obtener el código del servidor. Se generó uno temporal.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Nuevo Movimiento</h1>
          <p className="text-gray-600 mt-1">
            Registra múltiples productos en un solo movimiento.
          </p>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código del Movimiento
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={meta.code}
                onChange={(e) => setMeta((prev) => ({ ...prev, code: e.target.value }))}
                className="input flex-1"
                placeholder="Ej: MOV-001"
              />
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="btn btn-secondary whitespace-nowrap"
              >
                <RefreshCcw size={16} className="mr-2" />
                {isGeneratingCode ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Tipo de Movimiento *
    </label>
    <select
      value={meta.type}
      onChange={(e) => {
        const newType = e.target.value;
        setMeta((prev) => ({ ...prev, type: newType }));
      }}
      className="input"
      required
      disabled={lockedType !== null}
    >
      <option value="ENTRADA">Entrada</option>
      <option value="SALIDA">Salida</option>
    </select>
    {lockedType && (
      <p className="text-xs text-gray-500 mt-1">
        Tipo fijado en {lockedType}. Vacía la lista para cambiarlo.
      </p>
    )}
  </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón
            </label>
            <input
              type="text"
              value={meta.reason}
              onChange={(e) => setMeta((prev) => ({ ...prev, reason: e.target.value }))}
              className="input"
              placeholder="Ej: Compra, Venta, Ajuste..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas
            </label>
            <textarea
              value={meta.notes}
              onChange={(e) => setMeta((prev) => ({ ...prev, notes: e.target.value }))}
              className="input"
              rows="3"
              placeholder="Información adicional sobre el movimiento..."
            />
          </div>
        </div>
      </div>

      {movementQueue.length > 0 && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-blue-900">
                Movimientos pendientes ({movementQueue.length})
              </h2>
              <p className="text-sm text-blue-800">
                Total de unidades: {totalQueued}
              </p>
            </div>
            <button
              onClick={handleSaveBatch}
              disabled={batchMutation.isLoading}
              className="btn btn-primary"
            >
              <Save size={18} className="mr-2" />
              {batchMutation.isLoading ? 'Registrando...' : 'Registrar todos'}
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {movementQueue.map((movement, index) => {
              const product = products?.find((p) => p.id === movement.productId);
              return (
                <div
                  key={`${movement.productId}-${index}`}
                  className="flex items-center justify-between p-3 bg-white rounded border"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      {product?.code} - {product?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Cantidad: {movement.quantity}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromQueue(index)}
                    className="text-red-600 hover:text-red-700 ml-4"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddToQueue();
        }}
        className="card space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Producto *
            </label>
            <select
              value={item.productId}
              onChange={(e) => setItem((prev) => ({ ...prev, productId: e.target.value }))}
              className="input"
              required
            >
              <option value="">Seleccionar producto</option>
              {products?.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.code} - {product.name} (Stock: {product.quantity})
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="mt-2 text-sm text-gray-600">
                Ubicación: {selectedProduct.location} | Proveedor: {selectedProduct.supplier?.name}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad *
            </label>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) =>
                setItem((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))
              }
              className="input"
              required
              min="1"
            />
            {meta.type === 'SALIDA' && selectedProduct && (
              <p className="mt-2 text-sm text-red-600">
                Stock disponible: {selectedProduct.quantity}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/movements')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDirectSubmit}
            disabled={createMovementMutation.isLoading || !item.productId || movementQueue.length > 0}
            className="btn btn-secondary"
          >
            {createMovementMutation.isLoading ? 'Registrando...' : 'Registrar directo'}
          </button>
          <button
            type="submit"
            disabled={!item.productId}
            className="btn btn-primary"
          >
            <Plus size={18} className="mr-2" />
            Agregar a la lista
          </button>
        </div>
      </form>
    </div>
  );
}

