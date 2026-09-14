'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { FaBox, FaShieldAlt, FaPlus, FaEdit, FaTrash, FaImage, FaTimes, FaUpload, FaSpinner } from 'react-icons/fa';

// ─────────────────────────────────────────────────────────────
// 🔹 Tipos actualizados para múltiples imágenes
// ─────────────────────────────────────────────────────────────
interface Product {
    _id?: string;
    nombre: string;
    descripcion: string;
    categoria: 'vestidos' | 'remeras' | 'pantalones' | 'accesorios' | 'outwear';
    precio: number;
    moneda: 'ARS' | 'USD';
    imagenes: string[]; // <--- AHORA ES UN ARRAY
    slug: string;
    destacado: boolean;
    nuevo: boolean;
    caracteristicas: {
        talle: string;
        color: string;
        material: string;
    };
}

const theme = {
    bg: 'bg-slate-950',
    bgCard: 'bg-slate-900/80',
    border: 'border-slate-700/50',
    textPrimary: 'text-white',
    textSecondary: 'text-slate-400',
    accent: 'text-rose-400',
    gradient: 'from-rose-500/20 via-fuchsia-500/20 to-amber-500/20',
};

const initialFormState: Product = {
    nombre: '',
    descripcion: '',
    categoria: 'vestidos',
    precio: 0,
    moneda: 'ARS',
    imagenes: [],
    slug: '',
    destacado: false,
    nuevo: true,
    caracteristicas: { talle: 'M', color: '', material: '' }
};

export default function GestionProductosPage() {
    const { status, data: session } = useSession();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [mounted, setMounted] = useState(false);

    // Estados del CRUD
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<Product>(initialFormState);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✅ 1. Montaje seguro
    useEffect(() => { setMounted(true); }, []);

    // 🔒 2. Validación de acceso
    useEffect(() => {
        const validateAccess = async () => {
            if (status === 'loading' || !mounted) return;
            if (status === 'unauthenticated') { router.push('/login'); return; }

            const token = session?.user?.token || localStorage.getItem('token');
            if (!token) { router.push('/login'); return; }

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const allowedRoles = ['superadmin', 'admin', 'vendedor'];
                if (!allowedRoles.includes(payload.role)) { router.push('/'); return; }
                setIsAuthorized(true);
            } catch {
                router.push('/login');
            }
        };
        validateAccess();
    }, [status, session, router, mounted]);

    // 📥 3. Cargar productos
    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/gestion/productos');
            if (res.ok) {
                const data = await res.json();
                setProducts(data.productos || []);
            }
        } catch (error) {
            console.error('Error cargando productos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAuthorized) fetchProducts();
    }, [isAuthorized]);

    // 📝 4. Manejo del Formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (name.startsWith('caracteristicas.')) {
            const field = name.split('.')[1];
            setFormData(prev => ({
                ...prev,
                caracteristicas: { ...prev.caracteristicas, [field]: value }
            }));
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // 🖼️ 5. Manejo de Imágenes (Subida a Cloudinary)
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const files = Array.from(e.target.files);

        if (formData.imagenes.length + files.length > 5) {
            alert('Máximo 5 imágenes por producto');
            return;
        }

        setUploadingImages(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const formDataUpload = new FormData();
                formDataUpload.append('image', file);

                const res = await fetch('/api/uploadImage', {
                    method: 'POST',
                    body: formDataUpload,
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                return data.url;
            });

            const newUrls = await Promise.all(uploadPromises);
            setFormData(prev => ({
                ...prev,
                imagenes: [...prev.imagenes, ...newUrls]
            }));
        } catch (error) {
            console.error('Error subiendo imágenes:', error);
            alert('Error al subir las imágenes. Intenta de nuevo.');
        } finally {
            setUploadingImages(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const removeImage = (indexToRemove: number) => {
        setFormData(prev => ({
            ...prev,
            imagenes: prev.imagenes.filter((_, index) => index !== indexToRemove)
        }));
    };

    const openModal = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setFormData(product);
        } else {
            setEditingProduct(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.imagenes.length === 0) {
            alert('Debes subir al menos una imagen del producto.');
            return;
        }

        setSubmitting(true);
        try {
            const slug = formData.slug || formData.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            const payload = { ...formData, slug };

            const method = editingProduct ? 'PUT' : 'POST';
            const url = editingProduct ? `/api/gestion/productos?id=${editingProduct._id}` : '/api/gestion/productos';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchProducts();
            } else {
                alert('Error al guardar el producto');
            }
        } catch (error) {
            console.error(error);
            alert('Error de conexión');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) return;
        try {
            const res = await fetch(`/api/gestion/productos?id=${id}`, { method: 'DELETE' });
            if (res.ok) fetchProducts();
        } catch (error) {
            console.error(error);
        }
    };

    if (status === 'loading' || isAuthorized === null || !mounted) {
        return (
            <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-rose-500 border-r-fuchsia-500" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div className={`min-h-screen ${theme.bg} ${theme.textPrimary} relative`}>
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-30`} />
            </div>
            <br /><br /><br />
            <br /><br /><br />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-24 sm:pt-28">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 mb-3">
                            <FaShieldAlt className="text-rose-400 text-xs" />
                            <span className="text-[10px] tracking-[0.2em] uppercase text-slate-400">Panel de Gestión</span>
                        </div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            Gestión de Productos
                        </h1>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white font-medium text-sm hover:shadow-lg hover:shadow-rose-900/30 transition-all active:scale-95"
                    >
                        <FaPlus /> Nuevo Producto
                    </button>
                </div>

                {/* Tabla de Productos */}
                <div className={`${theme.bgCard} border ${theme.border} rounded-2xl overflow-hidden backdrop-blur-sm`}>
                    {loading ? (
                        <div className="p-12 text-center text-slate-500">Cargando productos...</div>
                    ) : products.length === 0 ? (
                        <div className="p-12 text-center">
                            <FaBox className="mx-auto text-4xl text-slate-700 mb-4" />
                            <p className="text-slate-400">No hay productos registrados aún.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/50 text-slate-400 uppercase text-xs tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Producto</th>
                                        <th className="px-6 py-4">Categoría</th>
                                        <th className="px-6 py-4">Precio</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {products.map((prod) => (
                                        <tr key={prod._id} className="hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                                                        {prod.imagenes && prod.imagenes.length > 0 ? (
                                                            <img src={prod.imagenes[0]} alt={prod.nombre} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <FaImage className="w-full h-full p-3 text-slate-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-white">{prod.nombre}</p>
                                                        <p className="text-xs text-slate-500">{prod.imagenes?.length || 0} imagen(es)</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 capitalize text-slate-300">{prod.categoria}</td>
                                            <td className="px-6 py-4 font-medium text-amber-400">
                                                {prod.moneda === 'ARS' ? '$' : 'USD'} {prod.precio.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {prod.destacado && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase">Destacado</span>}
                                                    {prod.nuevo && <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase">Nuevo</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openModal(prod)} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors">
                                                        <FaEdit />
                                                    </button>
                                                    <button onClick={() => handleDelete(prod._id!)} className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ───────── MODAL DE CREACIÓN / EDICIÓN ───────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>

                        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/95 backdrop-blur-xl">
                            <h2 className="text-xl font-bold text-white">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Fila 1: Nombre y Categoría */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Nombre del Producto *</label>
                                    <input name="nombre" value={formData.nombre} onChange={handleInputChange} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Categoría *</label>
                                    <select name="categoria" value={formData.categoria} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors">
                                        <option value="vestidos">Vestidos</option>
                                        <option value="remeras">Remeras & Tops</option>
                                        <option value="pantalones">Pantalones</option>
                                        <option value="accesorios">Accesorios</option>
                                        <option value="outwear">Outwear / Abrigos</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fila 2: Precio y Moneda */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Precio *</label>
                                    <input type="number" name="precio" value={formData.precio} onChange={handleInputChange} required min="0" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Moneda</label>
                                    <select name="moneda" value={formData.moneda} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors">
                                        <option value="ARS">ARS ($)</option>
                                        <option value="USD">USD (US$)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fila 3: Características */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Talle *</label>
                                    <input name="caracteristicas.talle" value={formData.caracteristicas.talle} onChange={handleInputChange} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors" placeholder="Ej: M, 42, Único" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Color *</label>
                                    <input name="caracteristicas.color" value={formData.caracteristicas.color} onChange={handleInputChange} required className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Material</label>
                                    <input name="caracteristicas.material" value={formData.caracteristicas.material} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors" placeholder="Ej: Algodón, Seda" />
                                </div>
                            </div>

                            {/* 🖼️ SECCIÓN DE IMÁGENES MULTIPLES */}
                            <div>
                                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">
                                    Imágenes del Producto (Máx. 5) *
                                </label>
                                <div className="flex flex-wrap gap-3 mb-3">
                                    {formData.imagenes.map((img, index) => (
                                        <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-700 group">
                                            <img src={img} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(index)}
                                                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))}

                                    {formData.imagenes.length < 5 && (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingImages}
                                            className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-700 hover:border-rose-500 flex flex-col items-center justify-center text-slate-500 hover:text-rose-400 transition-colors disabled:opacity-50"
                                        >
                                            {uploadingImages ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                                            <span className="text-[10px] mt-1">Agregar</span>
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                                <p className="text-[10px] text-slate-500">
                                    {uploadingImages ? 'Subiendo imágenes a Cloudinary...' : 'Haz clic en "+" para subir imágenes desde tu dispositivo.'}
                                </p>
                            </div>

                            {/* Fila 5: Descripción */}
                            <div>
                                <label className="block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1.5">Descripción</label>
                                <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={3} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-rose-500 transition-colors resize-none" />
                            </div>

                            {/* Fila 6: Checkboxes */}
                            <div className="flex gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="destacado" checked={formData.destacado} onChange={handleInputChange} className="w-4 h-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500 bg-slate-950" />
                                    <span className="text-sm text-slate-300">Marcar como Destacado</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" name="nuevo" checked={formData.nuevo} onChange={handleInputChange} className="w-4 h-4 rounded border-slate-600 text-rose-500 focus:ring-rose-500 bg-slate-950" />
                                    <span className="text-sm text-slate-300">Marcar como Nuevo</span>
                                </label>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={submitting || uploadingImages} className="px-6 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-rose-900/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                    {submitting && <FaSpinner className="animate-spin" />}
                                    {submitting ? 'Guardando...' : (editingProduct ? 'Actualizar Producto' : 'Crear Producto')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}