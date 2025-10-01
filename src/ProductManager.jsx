import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './ProductManager.css';

function ProductManager() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price_type: 'fixed',
    buying_price: '',
    selling_price: '',
    unit: '',
    stock_quantity: '',
    stock_alert_quantity: '10',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    getProducts();
    getCategories();
  }, []);

  async function getProducts() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }]);

      if (error) throw error;
      
      setNewCategoryName('');
      setShowCategoryModal(false);
      getCategories();
      alert('Category created successfully!');
    } catch (error) {
      alert('Error creating category: ' + error.message);
    }
  }

  async function handleImageUpload(productId) {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${productId}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product_images')
        .upload(filePath, imageFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const productData = {
        name: formData.name,
        category_id: formData.category_id || null,
        price_type: formData.price_type,
        buying_price: parseFloat(formData.buying_price),
        selling_price: parseFloat(formData.selling_price),
        unit: formData.price_type === 'per_weight' ? formData.unit : null,
        stock_quantity: parseInt(formData.stock_quantity),
        stock_alert_quantity: parseInt(formData.stock_alert_quantity)
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        // Handle image upload if there's a new image
        if (imageFile) {
          const imageUrl = await handleImageUpload(editingProduct.id);
          await supabase
            .from('products')
            .update({ image_url: imageUrl })
            .eq('id', editingProduct.id);
        }

        alert('Product updated successfully!');
      } else {
        // Create new product
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;

        // Handle image upload if there's an image
        if (imageFile && newProduct) {
          const imageUrl = await handleImageUpload(newProduct.id);
          await supabase
            .from('products')
            .update({ image_url: imageUrl })
            .eq('id', newProduct.id);
        }

        alert('Product created successfully!');
      }
      
      setShowModal(false);
      setEditingProduct(null);
      setImageFile(null);
      setFormData({ 
        name: '', 
        category_id: '',
        price_type: 'fixed',
        buying_price: '', 
        selling_price: '', 
        unit: '',
        stock_quantity: '',
        stock_alert_quantity: '10',
        image_url: ''
      });
      getProducts();
    } catch (error) {
      setError('Error saving product: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      alert('Product deleted successfully!');
      getProducts();
    } catch (error) {
      alert('Error deleting product: ' + error.message);
    }
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category_id: product.category_id || '',
      price_type: product.price_type || 'fixed',
      buying_price: product.buying_price.toString(),
      selling_price: product.selling_price.toString(),
      unit: product.unit || '',
      stock_quantity: product.stock_quantity.toString(),
      stock_alert_quantity: product.stock_alert_quantity?.toString() || '10',
      image_url: product.image_url || ''
    });
    setImageFile(null);
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      category_id: '',
      price_type: 'fixed',
      buying_price: '', 
      selling_price: '', 
      unit: '',
      stock_quantity: '',
      stock_alert_quantity: '10',
      image_url: ''
    });
    setImageFile(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProduct(null);
    setImageFile(null);
    setFormData({ 
      name: '', 
      category_id: '',
      price_type: 'fixed',
      buying_price: '', 
      selling_price: '', 
      unit: '',
      stock_quantity: '',
      stock_alert_quantity: '10',
      image_url: ''
    });
    setError('');
  }

  const calculateProfit = (buyingPrice, sellingPrice) => {
    return (sellingPrice - buyingPrice).toFixed(2);
  };

  const calculateMargin = (buyingPrice, sellingPrice) => {
    if (sellingPrice === 0) return '0.00';
    return (((sellingPrice - buyingPrice) / sellingPrice) * 100).toFixed(2);
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="product-manager">
      <div className="header">
        <h2>Product Inventory</h2>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => setShowCategoryModal(true)}>
            📁 Manage Categories
          </button>
          <button className="btn-primary" onClick={openCreateModal}>
            + Add New Product
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="products-grid">
        {products.length === 0 ? (
          <div className="empty-state">
            <p>No products yet. Create your first product!</p>
          </div>
        ) : (
          products.map(product => (
            <div key={product.id} className="product-card">
              {product.image_url && (
                <div className="product-image">
                  <img src={product.image_url} alt={product.name} />
                </div>
              )}
              <div className="product-header">
                <h3>{product.name}</h3>
                <div className="product-actions">
                  <button 
                    className="btn-edit" 
                    onClick={() => openEditModal(product)}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(product.id)}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="product-details">
                {product.categories?.name && (
                  <div className="detail-row">
                    <span className="label">Category:</span>
                    <span className="value category-badge">{product.categories.name}</span>
                  </div>
                )}
                <div className="detail-row">
                  <span className="label">Price Type:</span>
                  <span className="value">{product.price_type === 'per_weight' ? `Per ${product.unit || 'weight'}` : 'Fixed'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Buying Price:</span>
                  <span className="value">{parseFloat(product.buying_price).toFixed(2)} TND</span>
                </div>
                <div className="detail-row">
                  <span className="label">Selling Price:</span>
                  <span className="value">{parseFloat(product.selling_price).toFixed(2)} TND{product.price_type === 'per_weight' ? `/${product.unit}` : ''}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Profit per Unit:</span>
                  <span className="value profit">{calculateProfit(product.buying_price, product.selling_price)} TND</span>
                </div>
                <div className="detail-row">
                  <span className="label">Margin:</span>
                  <span className="value">{calculateMargin(product.buying_price, product.selling_price)}%</span>
                </div>
                <div className="detail-row stock">
                  <span className="label">Stock:</span>
                  <span className={`value ${product.stock_quantity <= (product.stock_alert_quantity || 10) ? 'low-stock' : ''}`}>
                    {product.stock_quantity} units
                    {product.stock_quantity <= (product.stock_alert_quantity || 10) && ' ⚠️'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product' : 'Create New Product'}</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Coffee Latte"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">-- No Category --</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Price Type *</label>
                  <select
                    value={formData.price_type}
                    onChange={(e) => setFormData({ ...formData, price_type: e.target.value })}
                    required
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="per_weight">Price per Weight</option>
                  </select>
                </div>
              </div>

              {formData.price_type === 'per_weight' && (
                <div className="form-group">
                  <label>Unit (e.g., kg, g, lb) *</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required={formData.price_type === 'per_weight'}
                    placeholder="e.g., kg"
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Buying Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.buying_price}
                    onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label>Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    required
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Stock Alert Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_alert_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_alert_quantity: e.target.value })}
                    required
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                />
                {imageFile && <p className="file-name">Selected: {imageFile.name}</p>}
                {formData.image_url && !imageFile && (
                  <div className="current-image">
                    <img src={formData.image_url} alt="Current product" style={{ maxWidth: '100px', marginTop: '10px' }} />
                  </div>
                )}
              </div>

              {formData.buying_price && formData.selling_price && (
                <div className="profit-preview">
                  <p><strong>Profit per Unit:</strong> {calculateProfit(parseFloat(formData.buying_price), parseFloat(formData.selling_price))} TND</p>
                  <p><strong>Margin:</strong> {calculateMargin(parseFloat(formData.buying_price), parseFloat(formData.selling_price))}%</p>
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving || uploadingImage}>
                  {uploadingImage ? 'Uploading...' : (saving ? 'Saving...' : (editingProduct ? 'Update Product' : 'Create Product'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>Manage Categories</h3>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
            </div>
            
            <div style={{ padding: '20px' }}>
              <div className="form-group">
                <label>New Category Name</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Beverages, Snacks"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()}
                />
              </div>
              <button className="btn-primary" onClick={handleCreateCategory} style={{ marginBottom: '20px', width: '100%' }}>
                + Add Category
              </button>

              <div className="categories-list">
                <h4>Existing Categories</h4>
                {categories.length === 0 ? (
                  <p style={{ color: '#999' }}>No categories yet</p>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {categories.map(cat => (
                      <li key={cat.id} style={{ padding: '8px', background: '#f0f0f0', marginBottom: '5px', borderRadius: '5px' }}>
                        {cat.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductManager;
