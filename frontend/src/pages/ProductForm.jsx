import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowLeft, Plus, Trash2, Save, RefreshCcw } from 'lucide-react';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    modelId: '',
    brandId: '',
    serialNumber: '',
    serialNumberType: 'generic', // 'generic' o 'manual'
    quantity: 0,
    minStock: 0,
    supplierId: '',
    location: '',
    description: '',
    photo: null,
  });

  const [productQueue, setProductQueue] = useState([]);

  const [brandSelectionType, setBrandSelectionType] = useState('manual');
  const [modelSelectionType, setModelSelectionType] = useState('manual');

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCode, setNewBrandCode] = useState('');
  const [isGeneratingBrandCode, setIsGeneratingBrandCode] = useState(false);

  const [showModelModal, setShowModelModal] = useState(false);
  const [newModelName, setNewModelName] = useState('');
  const [newModelCode, setNewModelCode] = useState('');
  const [isGeneratingModelCode, setIsGeneratingModelCode] = useState(false);

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  const { data: product } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
    enabled: isEdit,
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

  useEffect(() => {
    if (product) {
      const isGeneric = product.serialNumber === 'Genérico';
      setFormData({
        name: product.name || '',
        code: product.code || '',
        modelId: product.modelId || product.model?.id || '',
        brandId: product.brandId || '',
        serialNumber: isGeneric ? '' : (product.serialNumber || ''),
        serialNumberType: isGeneric ? 'generic' : 'manual',
        quantity: product.quantity || 0,
        minStock: product.minStock || 0,
        supplierId: product.supplierId || '',
        location: product.location || '',
        description: product.description || '',
        photo: null,
      });
    }
  }, [product]);

  const generateProductCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/products/generate-code');
      return response.data;
    },
    onSuccess: (data) => {
      setFormData((prev) => ({ ...prev, code: data.code }));
    },
  });

  const generateBrandCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/brands/generate-code');
      return response.data;
    },
    onSuccess: (data) => {
      setNewBrandCode(data.code);
      setIsGeneratingBrandCode(false);
    },
  });

  const createBrandMutation = useMutation({
    mutationFn: async ({ name, code }) => {
      const response = await api.post('/brands', { name, code: code || null });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['brands']);
      setFormData((prev) => ({ ...prev, brandId: data.brand.id }));
      setShowBrandModal(false);
      setNewBrandName('');
      setNewBrandCode('');
    },
  });

  const generateModelCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await api.get('/models/generate-code');
      return response.data;
    },
    onSuccess: (data) => {
      setNewModelCode(data.code);
      setIsGeneratingModelCode(false);
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async ({ name, brandId, code }) => {
      const response = await api.post('/models', { name, brandId, code: code || null });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['models']);
      setFormData((prev) => ({ ...prev, modelId: data.model.id }));
      setShowModelModal(false);
      setNewModelName('');
      setNewModelCode('');
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (name) => {
      const response = await api.post('/locations', { name });
      return response.data;
    },
    onSuccess: (_, newName) => {
      queryClient.invalidateQueries(['locations']);
      setFormData((prev) => ({ ...prev, location: newName }));
      setShowLocationModal(false);
      setNewLocationName('');
    },
  });

  const mutation = useMutation({
    mutationFn: async (data) => {
      const formDataToSend = new FormData();
      Object.keys(data).forEach((key) => {
        if (key !== 'photo' && data[key] !== null) {
          formDataToSend.append(key, data[key]);
        }
      });
      if (data.photo) {
        formDataToSend.append('photo', data.photo);
      }

      if (isEdit) {
        return api.put(`/products/${id}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        return api.post('/products', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      navigate('/products');
    },
  });

  const batchMutation = useMutation({
    mutationFn: async (products) => {
      const response = await api.post('/products/batch', { products });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setProductQueue([]);
      navigate('/products');
    },
  });

  const genericBrand = useMemo(() => {
    return brands?.find((brand) => brand.name.toLowerCase() === 'genérico');
  }, [brands]);

  const modelsForSelectedBrand = useMemo(() => {
    if (!models) return [];
    if (!formData.brandId) return models;
    return models.filter((model) => model.brandId === formData.brandId);
  }, [models, formData.brandId]);

  const genericModelForBrand = useMemo(() => {
    if (!modelsForSelectedBrand) return undefined;
    return modelsForSelectedBrand.find((model) => model.name.toLowerCase() === 'genérico');
  }, [modelsForSelectedBrand]);

  useEffect(() => {
    if (product && brands) {
      const generic = genericBrand;
      if (generic && product.brandId === generic.id) {
        setBrandSelectionType('generic');
      }
    }
  }, [product, brands, genericBrand]);

  useEffect(() => {
    if (product && models) {
      const genericModel = models.find((model) => model.name.toLowerCase() === 'genérico' && model.id === product.modelId);
      if (genericModel) {
        setModelSelectionType('generic');
      }
    }
  }, [product, models]);

  useEffect(() => {
    if (!isEdit) {
      if (brandSelectionType === 'generic' && genericBrand) {
        setFormData((prev) => ({ ...prev, brandId: genericBrand.id }));
      }
      if (brandSelectionType === 'generic' && !genericBrand) {
        setFormData((prev) => ({ ...prev, brandId: '' }));
      }
    }
  }, [brandSelectionType, genericBrand, isEdit]);

  useEffect(() => {
    if (!isEdit) {
      if (modelSelectionType === 'generic' && genericModelForBrand) {
        setFormData((prev) => ({ ...prev, modelId: genericModelForBrand.id }));
      }
      if (modelSelectionType === 'generic' && !genericModelForBrand) {
        setFormData((prev) => ({ ...prev, modelId: '' }));
      }
    }
  }, [modelSelectionType, genericModelForBrand, isEdit]);

  useEffect(() => {
    if (brandSelectionType === 'manual' && modelsForSelectedBrand.length > 0) {
      const exists = modelsForSelectedBrand.some((model) => model.id === formData.modelId);
      if (!exists) {
        setFormData((prev) => ({ ...prev, modelId: '' }));
      }
    }
  }, [formData.brandId, brandSelectionType, modelsForSelectedBrand, formData.modelId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isEdit) {
      const dataToSend = { ...formData };
      if (dataToSend.serialNumberType === 'generic') {
        dataToSend.serialNumber = 'Genérico';
      }
      delete dataToSend.serialNumberType;
      mutation.mutate(dataToSend);
    } else {
      // Modo agregar múltiples: agregar a la cola
      const productToAdd = { ...formData };
      if (productToAdd.serialNumberType === 'generic') {
        productToAdd.serialNumber = 'Genérico';
      }
      delete productToAdd.serialNumberType;
      delete productToAdd.photo; // Las fotos se manejan individualmente
      
      setProductQueue([...productQueue, productToAdd]);
      
      // Limpiar formulario para el siguiente producto
      setFormData({
        name: '',
        code: '',
        modelId: formData.modelId, // Mantener modelo y marca
        brandId: formData.brandId,
        serialNumber: '',
        serialNumberType: 'generic',
        quantity: 0,
        minStock: formData.minStock, // Mantener algunos valores
        supplierId: formData.supplierId,
        location: formData.location,
        description: '',
        photo: null,
      });
    }
  };

  const handleSaveBatch = () => {
    if (productQueue.length === 0) return;
    batchMutation.mutate(productQueue);
  };

  const removeFromQueue = (index) => {
    setProductQueue(productQueue.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/products')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Modifica la información del producto' : 'Agrega productos al almacén (puedes agregar múltiples)'}
          </p>
        </div>
      </div>

      {/* Cola de productos pendientes */}
      {!isEdit && productQueue.length > 0 && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-blue-900">
              Productos pendientes ({productQueue.length})
            </h2>
            <button
              onClick={handleSaveBatch}
              disabled={batchMutation.isLoading}
              className="btn btn-primary"
            >
              <Save size={18} className="mr-2" />
              {batchMutation.isLoading ? 'Guardando...' : 'Guardar todos'}
            </button>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {productQueue.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {brands?.find(b => b.id === item.brandId)?.name} - 
                    {models?.find(m => m.id === item.modelId)?.name} - 
                    Cantidad: {item.quantity}
                  </p>
                </div>
                <button
                  onClick={() => removeFromQueue(index)}
                  className="text-red-600 hover:text-red-700 ml-4"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código {!isEdit && '(se genera automáticamente si se deja vacío)'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="input flex-1"
                disabled={isEdit}
              />
              {!isEdit && (
                <button
                  type="button"
                  onClick={() => generateProductCodeMutation.mutate()}
                  disabled={generateProductCodeMutation.isLoading}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  <RefreshCcw size={16} className="mr-2" />
                  Generar
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Marca *
            </label>
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="brandSelectionType"
                    value="generic"
                    checked={brandSelectionType === 'generic'}
                    onChange={() => setBrandSelectionType('generic')}
                    className="mr-2"
                  />
                  <span className="text-sm">Genérico</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="brandSelectionType"
                    value="manual"
                    checked={brandSelectionType === 'manual'}
                    onChange={() => setBrandSelectionType('manual')}
                    className="mr-2"
                  />
                  <span className="text-sm">Manual</span>
                </label>
              </div>
              {brandSelectionType === 'manual' ? (
                <div className="flex gap-2">
                  <select
                    value={formData.brandId}
                    onChange={(e) => {
                      setFormData({ ...formData, brandId: e.target.value, modelId: '' });
                      setModelSelectionType('manual');
                    }}
                    className="input flex-1"
                    required
                  >
                    <option value="">Seleccionar marca</option>
                    {brands?.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name} {brand.code ? `(${brand.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowBrandModal(true)}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    + Nueva
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Se usará la marca Genérico. {genericBrand ? '' : 'Crea la marca Genérico para habilitar esta opción.'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Modelo *
            </label>
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="modelSelectionType"
                    value="generic"
                    checked={modelSelectionType === 'generic'}
                    onChange={() => setModelSelectionType('generic')}
                    className="mr-2"
                    disabled={!formData.brandId}
                  />
                  <span className="text-sm">Genérico</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="modelSelectionType"
                    value="manual"
                    checked={modelSelectionType === 'manual'}
                    onChange={() => setModelSelectionType('manual')}
                    className="mr-2"
                  />
                  <span className="text-sm">Manual</span>
                </label>
              </div>
              {modelSelectionType === 'manual' ? (
                <div className="flex gap-2">
                  <select
                    value={formData.modelId}
                    onChange={(e) => setFormData({ ...formData, modelId: e.target.value })}
                    className="input flex-1"
                    required
                    disabled={!formData.brandId}
                  >
                    <option value="">Seleccionar modelo</option>
                    {modelsForSelectedBrand?.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} {model.code ? `(${model.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowModelModal(true)}
                    className="btn btn-secondary whitespace-nowrap"
                    disabled={!formData.brandId}
                  >
                    + Nuevo
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Se usará el modelo Genérico de la marca seleccionada. {genericModelForBrand ? '' : 'Crea un modelo Genérico para esta marca.'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Serie *
            </label>
            <div className="space-y-2">
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="serialNumberType"
                    value="generic"
                    checked={formData.serialNumberType === 'generic'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      serialNumberType: 'generic',
                      serialNumber: ''
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm">Genérico</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="serialNumberType"
                    value="manual"
                    checked={formData.serialNumberType === 'manual'}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      serialNumberType: 'manual'
                    })}
                    className="mr-2"
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
                  placeholder="Ingrese el número de serie"
                  required
                />
              )}
              {formData.serialNumberType === 'generic' && (
                <p className="text-sm text-gray-500 italic">Se usará "Genérico" como número de serie</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad *
            </label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              className="input"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Mínimo *
            </label>
            <input
              type="number"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
              className="input"
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor *
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="input"
              required
            >
              <option value="">Seleccionar proveedor</option>
              {suppliers?.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación *
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  list="locations-list"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="input flex-1"
                  placeholder="Selecciona o escribe una ubicación"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="btn btn-secondary whitespace-nowrap"
                >
                  + Ubicación
                </button>
              </div>
              <datalist id="locations-list">
                {locations.map((location) => (
                  <option key={location} value={location} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Descripción
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input"
            rows="4"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Foto del Producto
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, photo: e.target.files[0] })}
            className="input"
          />
          {product?.photo && !formData.photo && (
            <p className="mt-2 text-sm text-gray-600">
              Foto actual: {product.photo}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              mutation.isLoading ||
              (!isEdit && brandSelectionType === 'generic' && !genericBrand) ||
              (!isEdit && modelSelectionType === 'generic' && !genericModelForBrand)
            }
            className="btn btn-primary"
          >
            {isEdit ? (
              mutation.isLoading ? 'Guardando...' : 'Actualizar'
            ) : (
              <>
                <Plus size={18} className="mr-2" />
                {mutation.isLoading ? 'Agregando...' : 'Agregar a la lista'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal para crear nueva marca */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Nueva Marca</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Marca *
                </label>
                <input
                  type="text"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="input w-full"
                  placeholder="Ej: HP, Dell, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código (opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newBrandCode}
                    onChange={(e) => setNewBrandCode(e.target.value)}
                    className="input flex-1"
                    placeholder="Genera o escribe un código"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsGeneratingBrandCode(true);
                      generateBrandCodeMutation.mutate();
                    }}
                    disabled={isGeneratingBrandCode || generateBrandCodeMutation.isLoading}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    {generateBrandCodeMutation.isLoading ? 'Generando...' : 'Generar'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newBrandName.trim()) {
                      createBrandMutation.mutate({ 
                        name: newBrandName.trim(), 
                        code: newBrandCode.trim() ? newBrandCode.trim() : null
                      });
                    }
                  }}
                  disabled={!newBrandName.trim() || createBrandMutation.isLoading}
                  className="btn btn-primary flex-1"
                >
                  {createBrandMutation.isLoading ? 'Agregando...' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBrandModal(false);
                    setNewBrandName('');
                    setNewBrandCode('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nuevo modelo */}
      {showModelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Nuevo Modelo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Modelo *
                </label>
                <input
                  type="text"
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  className="input w-full"
                  placeholder="Ej: ThinkPad X1, Genérico, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código (opcional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newModelCode}
                    onChange={(e) => setNewModelCode(e.target.value)}
                    className="input flex-1"
                    placeholder="Genera o escribe un código"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsGeneratingModelCode(true);
                      generateModelCodeMutation.mutate();
                    }}
                    disabled={isGeneratingModelCode || generateModelCodeMutation.isLoading}
                    className="btn btn-secondary whitespace-nowrap"
                  >
                    {generateModelCodeMutation.isLoading ? 'Generando...' : 'Generar'}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newModelName.trim()) {
                      createModelMutation.mutate({ 
                        name: newModelName.trim(), 
                        brandId: formData.brandId || null,
                        code: newModelCode.trim() ? newModelCode.trim() : null
                      });
                    }
                  }}
                  disabled={!newModelName.trim() || createModelMutation.isLoading || !formData.brandId}
                  className="btn btn-primary flex-1"
                >
                  {createModelMutation.isLoading ? 'Agregando...' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModelModal(false);
                    setNewModelName('');
                    setNewModelCode('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para gestionar ubicaciones */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Nueva Ubicación</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Ubicación *
                </label>
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="input w-full"
                  placeholder="Ej: Estante G1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (newLocationName.trim()) {
                      createLocationMutation.mutate(newLocationName.trim());
                    }
                  }}
                  disabled={!newLocationName.trim() || createLocationMutation.isLoading}
                  className="btn btn-primary flex-1"
                >
                  {createLocationMutation.isLoading ? 'Agregando...' : 'Agregar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationModal(false);
                    setNewLocationName('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
