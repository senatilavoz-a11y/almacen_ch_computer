import { useState, useEffect, useMemo } from 'react';
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
  const [editingProduct, setEditingProduct] = useState(null);
 
  const openEditModal = (product) => {
    setEditingProduct(product);
  };
 
  const closeEditModal = () => {
    setEditingProduct(null);
  };
 
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
 
  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data;
    },
  });
 
  const { data: brands } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await api.get('/brands');
      return response.data;
    },
  });
 
  const { data: models } = useQuery({
    queryKey: ['models'],
    queryFn: async () => {
      const response = await api.get('/models');
      return response.data;
    },
  });
 
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await api.get('/locations');
      return response.data;
    },
  });
 
  const locations = locationsData?.locations || [];
 
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
                    className={`px-2 py-1 rounded text-xs font-medium ${product.quantity <= product.minStock
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
                      onClick={() => openEditModal(product)}
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
 
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={closeEditModal}
          brands={brands}
          models={models}
          suppliers={suppliers}
          locations={locations}
        />
      )}
    </div>
  );
}
 
function ProductEditModal({ product, onClose, brands, models, suppliers, locations }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    brandId: '',
    modelId: '',
    serialNumber: '',
    serialNumberType: 'manual',
    quantity: 0,
    minStock: 0,
    supplierId: '',
    location: '',
    description: '',
    photo: null,
  });
 
  useEffect(() => {
    if (!product) return;
    const isGeneric = product.serialNumber === 'Genérico';
    setFormData({
      name: product.name || '',
      code: product.code || '',
      brandId: product.brandId || product.brand?.id || '',
      modelId: product.modelId || product.model?.id || '',
      serialNumber: isGeneric ? '' : (product.serialNumber || ''),
      serialNumberType: isGeneric ? 'generic' : 'manual',
      quantity: product.quantity ?? 0,
      minStock: product.minStock ?? 0,
      supplierId: product.supplierId || product.supplier?.id || '',
      location: product.location || '',
      description: product.description || '',
      photo: null,
    });
  }, [product]);
 
  const modelsForBrand = useMemo(() => {
    if (!models) return [];
    if (!formData.brandId) return models;
    return models.filter((model) => model.brandId === formData.brandId);
  }, [models, formData.brandId]);
 
  useEffect(() => {
    if (!formData.modelId) return;
    const exists = modelsForBrand.some((model) => model.id === formData.modelId);
    if (!exists) {
      setFormData((prev) => ({ ...prev, modelId: '' }));
    }
  }, [formData.modelId, modelsForBrand]);
 
  const mutation = useMutation({
    mutationFn: async (data) => {
      const formPayload = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'photo') return;
        if (value !== null && value !== undefined) {
          formPayload.append(key, value);
        }
      });
      if (data.photo) {
        formPayload.append('photo', data.photo);
      }
      return api.put(`/products/${product.id}`, formPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      onClose();
    },
  });
 
  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: formData.name,
      code: formData.code,
      brandId: formData.brandId || null,
      modelId: formData.modelId || null,
      serialNumber: formData.serialNumberType === 'generic' ? 'Genérico' : formData.serialNumber,
      quantity: formData.quantity,
      minStock: formData.minStock,
      supplierId: formData.supplierId || null,
      location: formData.location,
      description: formData.description,
      photo: formData.photo,
    };
    mutation.mutate(payload);
  };
 
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
      <div className="bg-white max-w-5xl w-full rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Editar producto</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            Cerrar
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código
              </label>
              <input
                type="text"
                value={formData.code}
                disabled
                className="input bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marca
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => setFormData({ ...formData, brandId: e.target.value, modelId: '' })}
                className="input"
              >
                <option value="">{brands ? 'Seleccionar marca' : 'Cargando marcas...'}</option>
                {brands?.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo
              </label>
              <select
                value={formData.modelId}
                onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                className="input"
                disabled={!formData.brandId}
              >
                <option value="">
                  {formData.brandId
                    ? modelsForBrand.length
                      ? 'Seleccionar modelo'
                      : 'Sin modelos para esta marca'
                    : 'Selecciona una marca primero'}
                </option>
                {modelsForBrand.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número de serie
              </label>
              <div className="flex gap-4 mb-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`serial-${product.id}`}
                    value="generic"
                    checked={formData.serialNumberType === 'generic'}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        serialNumberType: 'generic',
                        serialNumber: '',
                      }))
                    }
                  />
                  <span className="text-sm">Genérico</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name={`serial-${product.id}`}
                    value="manual"
                    checked={formData.serialNumberType === 'manual'}
                    onChange={() =>
                      setFormData((prev) => ({
                        ...prev,
                        serialNumberType: 'manual',
                      }))
                    }
                  />
                  <span className="text-sm">Manual</span>
                </label>
              </div>
              {formData.serialNumberType === 'manual' && (
                <input
                  type="text"
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="input"
                  placeholder="Número de serie"
                />
              )}
              {formData.serialNumberType === 'generic' && (
                <p className="text-sm text-gray-500 italic">Se usará "Genérico".</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock mínimo *
              </label>
              <input
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <select
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="input"
              >
                <option value="">{suppliers ? 'Seleccionar proveedor' : 'Cargando proveedores...'}</option>
                {suppliers?.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="input"
                list="product-locations"
                placeholder="Ej: Estante A1"
              />
              <datalist id="product-locations">
                {locations?.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto del producto
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] || null })}
                className="input"
              />
              {product.photo && !formData.photo && (
                <p className="text-sm text-gray-500 mt-1">Foto actual: {product.photo}</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isLoading}
              className="btn btn-primary"
            >
              {mutation.isLoading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
 
 