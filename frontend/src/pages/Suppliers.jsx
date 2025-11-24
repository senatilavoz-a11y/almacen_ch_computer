import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Plus, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Suppliers() {
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await api.get('/suppliers');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/suppliers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
    },
  });

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier);
    setShowForm(true);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingSupplier(null);
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
          <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600 mt-1">Gestiona los proveedores del almacén</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
          >
            <Plus size={18} className="mr-2" />
            Nuevo Proveedor
          </button>
        )}
      </div>

      {showForm && (
        <SupplierForm
          supplier={editingSupplier}
          onClose={handleClose}
          onSuccess={() => {
            handleClose();
            queryClient.invalidateQueries(['suppliers']);
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers?.map((supplier) => (
          <div key={supplier.id} className="card">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold">{supplier.name}</h3>
              {user?.role === 'ADMIN' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(supplier)}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Estás seguro de eliminar este proveedor?')) {
                        deleteMutation.mutate(supplier.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              {supplier.contact && (
                <p className="flex items-center space-x-2">
                  <span>Contacto:</span>
                  <span>{supplier.contact}</span>
                </p>
              )}
              {supplier.email && (
                <p className="flex items-center space-x-2">
                  <Mail size={16} />
                  <span>{supplier.email}</span>
                </p>
              )}
              {supplier.phone && (
                <p className="flex items-center space-x-2">
                  <Phone size={16} />
                  <span>{supplier.phone}</span>
                </p>
              )}
              {supplier.address && (
                <p className="flex items-center space-x-2">
                  <MapPin size={16} />
                  <span>{supplier.address}</span>
                </p>
              )}
              <p className="text-xs text-gray-500 mt-4">
                {supplier._count?.products || 0} productos asociados
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SupplierForm({ supplier, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: supplier?.name || '',
    contact: supplier?.contact || '',
    email: supplier?.email || '',
    phone: supplier?.phone || '',
    address: supplier?.address || '',
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (supplier) {
        return api.put(`/suppliers/${supplier.id}`, data);
      } else {
        return api.post('/suppliers', data);
      }
    },
    onSuccess: onSuccess,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">
        {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contacto
            </label>
            <input
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="input"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={mutation.isLoading}
            className="btn btn-primary"
          >
            {mutation.isLoading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}

