// app/app/gestion/propiedades/editar/[id]/page.tsx
'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import {
  FaHome, FaArrowLeft, FaSave, FaTrash, FaPlus, FaImages,
  FaStar, FaRegStar, FaUpload, FaVideo, FaFilePdf, FaMapMarkerAlt,
  FaBuilding, FaMoneyBillWave, FaUser, FaCalendarAlt, FaExclamationTriangle,
  FaExpand
} from 'react-icons/fa';
import { X, GripVertical, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { formatARS } from '@/app/lib/formatcurrenci';
import ImageGrid from './components/ImageGrid';

// ─────────────────────────────────────────────────────────────
// 🔹 Tipos (mismos que en el detalle)
// ─────────────────────────────────────────────────────────────



interface Propietario {
  _id: string;
  razonSocial: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
}

interface Agente {
  _id: string;
  name: string;
  email: string;
}

interface ImagenProperty {
  url: string;
  descripcion?: string;
  principal: boolean;
  orden: number;
  tipo: 'foto' | 'plano' | 'video_thumbnail';
  _id?: string;
}


interface Property {
  _id: string;
  titulo: string;
  descripcion: string;
  codigoInterno?: string;
  tipoPropiedad: 'departamento' | 'casa' | 'local' | 'oficina' | 'terreno' | 'campo' | 'barrio cerrado' | 'urbanizacion protegida' | 'galpon' | 'ph';
  tipoOperacion: 'venta' | 'alquiler' | 'ambos';
  categoria: 'residencial' | 'comercial' | 'industrial' | 'inversion';
  direccion: {
    calle: string;
    numero: string;
    piso?: string;
    depto?: string;
    barrio: string;
    ciudad: string;
    provincia: string;
    codigoPostal?: string;
    coordenadas?: { lat: number; lng: number };
    mostrarDireccionExacta: boolean;
  };
  zona?: string;
  caracteristicas: {
    ambientes?: number;
    dormitorios?: number;
    banios?: number;
    toilets?: number;
    cochera?: boolean;
    cocheras?: number;
    metrosCubiertos?: number;
    metrosTotales?: number;
    metrosTerreno?: number;
    piso?: number;
    orientacion?: string;
    antiguedad?: number;
    estadoConservacion?: 'nuevo' | 'excelente' | 'bueno' | 'regular' | 'a renovar';
    balcon?: boolean;
    terraza?: boolean;
    patio?: boolean;
    pileta?: boolean;
    jardin?: boolean;
    ascensor?: boolean;
    seguridad?: boolean;
  };
  precios: {
    venta?: { moneda: 'ARS' | 'USD'; monto?: number; comision?: number; gastosEscrituracion?: boolean };
    alquiler?: { moneda: 'ARS' | 'USD'; monto?: number; comision?: number; ajuste?: string; garantiaRequerida?: string };
    expensas?: number;
    impuestos?: number;
  };
  imagenes: ImagenProperty[];
  videoUrl?: string;
  tourVirtualUrl?: string;
  planoUrl?: string;
  estado: 'borrador' | 'publicado' | 'reservado' | 'alquilado' | 'vendido' | 'baja';
  fechaPublicacion?: string;
  fechaDisponibilidad?: string;
  destacado: boolean;
  urgente: boolean;
  propietario: Propietario | string;
  agente: Agente | string;
  notasInternas?: string;
  activo: boolean;
  seo?: { slug?: string; metaTitle?: string; metaDescription?: string };
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────
// 🎨 Sistema de diseño premium
// ─────────────────────────────────────────────────────────────

const theme = {
  bg: 'bg-slate-950',
  bgCard: 'bg-slate-900/80',
  bgCardHover: 'bg-slate-800/90',
  border: 'border-slate-700/50',
  borderHover: 'border-violet-500/40',
  textPrimary: 'text-white',
  textSecondary: 'text-slate-400',
  textAccent: 'text-violet-400',
  gradient: 'from-violet-600/20 via-purple-600/20 to-indigo-600/20',
  gradientPrimary: 'from-violet-600 via-purple-600 to-indigo-600',
  shadow: 'shadow-2xl shadow-violet-900/20',
};

// ─────────────────────────────────────────────────────────────
// 🔹 Helpers de validación y formato
// ─────────────────────────────────────────────────────────────

const validateProperty = (data: Partial<Property>) => {
  const errors: Record<string, string> = {};

  if (!data.titulo?.trim() || data.titulo.trim().length < 10) {
    errors.titulo = 'El título debe tener al menos 10 caracteres';
  }
  if (!data.descripcion?.trim() || data.descripcion.trim().length < 50) {
    errors.descripcion = 'La descripción debe tener al menos 50 caracteres';
  }
  if (!data.tipoPropiedad) errors.tipoPropiedad = 'Seleccioná el tipo de propiedad';
  if (!data.tipoOperacion) errors.tipoOperacion = 'Seleccioná el tipo de operación';

  // Validar dirección
  const dir = data.direccion;
  if (!dir?.calle?.trim()) errors['direccion.calle'] = 'La calle es requerida';
  if (!dir?.numero?.trim()) errors['direccion.numero'] = 'El número es requerido';
  if (!dir?.barrio?.trim()) errors['direccion.barrio'] = 'El barrio es requerido';
  if (!dir?.ciudad?.trim()) errors['direccion.ciudad'] = 'La ciudad es requerida';
  if (!dir?.provincia?.trim()) errors['direccion.provincia'] = 'La provincia es requerida';

  // Validar precios: al menos uno debe tener monto
  const ventaMonto = data.precios?.venta?.monto;
  const alquilerMonto = data.precios?.alquiler?.monto;
  if (!ventaMonto && !alquilerMonto) {
    errors.precios = 'Debe especificar al menos un precio de venta o alquiler';
  }
  if (ventaMonto != null && ventaMonto < 0) errors['precios.venta.monto'] = 'Monto inválido';
  if (alquilerMonto != null && alquilerMonto < 0) errors['precios.alquiler.monto'] = 'Monto inválido';

  // Validar imágenes
  if (!data.imagenes?.length || data.imagenes.length === 0) {
    errors.imagenes = 'Debe subir al menos una imagen';
  }
  if (data.imagenes && data.imagenes.length > 22) {
    errors.imagenes = 'Máximo 22 imágenes por propiedad';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

const formatPriceInput = (value: string): number | undefined => {
  const cleaned = value.replace(/[^0-9,.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
};

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal con Suspense
// ─────────────────────────────────────────────────────────────

export default function EditarPropiedadPage() {
  return (
    <Suspense fallback={<div className={`${theme.bg} min-h-screen flex items-center justify-center`}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-violet-500 mx-auto mb-4" />
        <p className={`${theme.textSecondary}`}>Cargando formulario...</p>
      </div>
    </div>}>
      <PageContent />
    </Suspense>
  );
}

function PageContent() {
  // ─────────────────────────────────────────────────────────────
  // 🎣 Hooks y Estados
  // ─────────────────────────────────────────────────────────────
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<Partial<Property>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);

  // Image management
  const [previewImages, setPreviewImages] = useState<{ url: string; file?: File; principal?: boolean; orden?: number }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Video management
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  // UI state
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [showPassword, setShowPassword] = useState(false); // Para campos sensibles si los hubiera

  // ─────────────────────────────────────────────────────────────
  // 🔒 Validación de acceso
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const validateAccess = async () => {
      if (status === 'loading') return;
      if (status === 'unauthenticated') { router.push('/'); return; }

      const token = session?.user?.token || localStorage.getItem('token');
      if (!token) { toast.error('Acceso denegado'); router.push('/'); return; }

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const role = payload.role || session?.user.role;
        if (!['admin', 'superadmin', 'agente'].includes(role)) {
          toast.error('Acceso restringido'); router.push('/'); return;
        }
        setIsAuthorized(true);
        setUserRole(role);
      } catch {
        toast.error('Sesión inválida'); router.push('/');
      }
    };
    validateAccess();
  }, [status, session, router]);

  // ─────────────────────────────────────────────────────────────
  // 📥 Cargar propiedad para editar
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthorized || !id) return;

    const fetchProperty = async () => {
      try {
        const res = await fetch(`/api/gestion/propiedades/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            toast.error('Propiedad no encontrada');
            router.push('/gestion/propiedades');
          } else {
            toast.error('Error al cargar la propiedad');
          }
          return;
        }
        const data = await res.json();
        setProperty(data);
        setFormData(data);
        // Inicializar preview de imágenes existentes
        setPreviewImages(data.imagenes?.map((img: ImagenProperty) => ({ url: img.url })) || []);
        if (data.videoUrl) {
          setVideoPreview(data.videoUrl);
        }
      } catch (err) {
        console.error('Error fetching property:', err);
        toast.error('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [isAuthorized, id, router]);



  // ─────────────────────────────────────────────────────────────
  // 🔄 Detectar cambios en el formulario
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!property) return;

    // Comparar formData con property original (ignorando campos no editables)
    const changes: Partial<Property> = {};
    Object.keys(formData).forEach(key => {
      const k = key as keyof Property;
      if (JSON.stringify(formData[k]) !== JSON.stringify(property[k])) {
        (changes as any)[k] = formData[k];
      }
    });

    setHasChanges(Object.keys(changes).length > 0 || previewImages.length !== property.imagenes?.length);
  }, [formData, previewImages, property]);

  // ─────────────────────────────────────────────────────────────
  // 🎯 Handlers del formulario
  // ─────────────────────────────────────────────────────────────
  if (!isAuthorized || loading) return null;
  if (!property) return (
    <div className={`${theme.bg} min-h-screen flex items-center justify-center`}>
      <p className={`${theme.textSecondary}`}>Propiedad no encontrada</p>
    </div>
  );

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouchedFields(prev => new Set(prev).add(field));

    // Validar en tiempo real si el campo fue tocado
    if (touchedFields.has(field)) {
      const { errors } = validateProperty({ ...formData, [field]: value });
      setFormErrors(prev => ({ ...prev, [field]: errors[field] }));
    }
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...((prev as any)[parent] || {}), [field]: value }
    }));
    setTouchedFields(prev => new Set(prev).add(`${parent}.${field}`));
  };

  const handleDeepNestedChange = (parent: string, child: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...((prev as any)[parent] || {}),
        [child]: { ...(((prev as any)[parent]?.[child] || {})), [field]: value }
      }
    }));
  };

  // ─────────────────────────────────────────────────────────────
  // 📸 Gestión de Imágenes
  // ─────────────────────────────────────────────────────────────
const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // ✅ CORREGIDO: contar existentes + nuevas en preview + las que se quieren subir ahora
    const existentes = formData.imagenes?.length || 0;
    const nuevasEnPreview = previewImages.filter(p => p.file).length;
    const totalImages = existentes + nuevasEnPreview + files.length;

    if (totalImages > 22) {
      toast.error(
        `Máximo 22 imágenes. Tenés ${existentes} guardadas + ${nuevasEnPreview} en preview. Solo podés subir ${22 - existentes - nuevasEnPreview} más.`
      );
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`El archivo "${file.name}" no es una imagen válida`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`La imagen "${file.name}" supera los 5MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setPreviewImages(prev => [...prev, { url, file }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
};

  const removeImage = (index: number, isPreview: boolean) => {
    if (isPreview) {
      setPreviewImages(prev => prev.filter((_, i) => i !== index));
    } else {
      // Para imágenes existentes, marcar para eliminar (se procesa en submit)
      const imagenes = [...(formData.imagenes || [])];
      imagenes.splice(index, 1);
      handleChange('imagenes', imagenes);
    }
  };

  const setPrincipalImage = (index: number, isPreview: boolean) => {
    if (isPreview) {
      setPreviewImages(prev => prev.map((img, i) => ({
        ...img,
        principal: i === index
      })));
    } else {
      const imagenes = [...(formData.imagenes || [])].map((img, i) => ({
        ...img,
        principal: i === index
      }));
      handleChange('imagenes', imagenes);
    }
  };

  const reorderImages = (fromIndex: number, toIndex: number, isPreview: boolean) => {
    const list = isPreview ? [...previewImages] : [...(formData.imagenes || [])];
    const [moved] = list.splice(fromIndex, 1);
    list.splice(toIndex, 0, moved);

    // Actualizar orden numérico
    const withOrder = list.map((img, i) => ({ ...img, orden: i }));

    if (isPreview) {
      setPreviewImages(withOrder);
    } else {
      handleChange('imagenes', withOrder);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 💾 Submit del formulario
  // ─────────────────────────────────────────────────────────────
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const { isValid, errors } = validateProperty(formData);
  setFormErrors(errors);
  Object.keys(formData).forEach(key => setTouchedFields(prev => new Set(prev).add(key)));

  if (!isValid) {
    toast.error('Revisá los campos marcados en rojo');
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      const element = document.getElementById(`field-${firstError.replace(/\./g, '-')}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return;
  }

  setSaving(true);

  try {
    // Preparar payload: combinar imágenes existentes + nuevas
    let imagenesPayload = [...(formData.imagenes || [])];

    // Subir imágenes nuevas
    const newImages = previewImages.filter(p => p.file);
    if (newImages.length > 0) {
      for (const preview of newImages) {
        const formDataImg = new FormData();
        formDataImg.append('image', preview.file!);
        formDataImg.append('folder', 'properties');

        const res = await fetch('/api/uploadImage', {
          method: 'POST',
          body: formDataImg,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al subir imagen');
        }

        const data = await res.json();
        imagenesPayload.push({
          url: data.url,
          descripcion: '',
          principal: preview.principal || false,
          orden: imagenesPayload.length,
          tipo: 'foto'
        });
      }
    }

    // Asegurar que haya una imagen principal
    const hasPrincipal = imagenesPayload.some(img => img.principal);
    if (!hasPrincipal && imagenesPayload[0]) {
      imagenesPayload[0].principal = true;
    }
    imagenesPayload.sort((a, b) => (a.orden || 0) - (b.orden || 0));

    // Subir video nuevo si existe
     // Subir video nuevo si existe
    let finalVideoUrl = formData.videoUrl || null;
    if (videoFile) {
      const videoFormData = new FormData();
      videoFormData.append('file', videoFile);
      videoFormData.append('upload_preset', 'propiedades_video');
      videoFormData.append('folder', 'properties/videos');
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

      toast.info('📹 Subiendo video a Cloudinary...');
      
      // ✅ URL DE SUBIDA LIMPIA (Sin transformaciones, para evitar cuelgues)
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;

      const res = await fetch(uploadUrl, { 
        method: 'POST', 
        body: videoFormData 
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: { message: 'Error desconocido' } }));
        throw new Error(err.error?.message || 'Error al subir video');
      }

      const data = await res.json();
      finalVideoUrl = data.secure_url;
      toast.success('✅ Video subido correctamente');
    }

    // ✅ CORREGIR: Extraer solo el ID del propietario si es un objeto
    const propietarioId = typeof formData.propietario === 'object' 
      ? formData.propietario._id 
      : formData.propietario;

    // ✅ CORREGIR: Extraer solo el ID del agente si es un objeto
    const agenteId = typeof formData.agente === 'object'
      ? formData.agente._id
      : formData.agente;

    // ✅ CORREGIR: Limpiar el payload para que coincida con lo que espera la API
    const payload = {
      // Campos básicos
      titulo: formData.titulo?.trim(),
      descripcion: formData.descripcion?.trim(),
      codigoInterno: formData.codigoInterno?.trim() || null,
      tipoPropiedad: formData.tipoPropiedad,
      tipoOperacion: formData.tipoOperacion,
      categoria: formData.categoria || 'residencial',
      
      // Dirección (asegurar que todos los campos requeridos estén presentes)
      direccion: {
        calle: formData.direccion?.calle?.trim() || '',
        numero: formData.direccion?.numero?.trim() || '',
        piso: formData.direccion?.piso?.trim() || null,
        depto: formData.direccion?.depto?.trim() || null,
        barrio: formData.direccion?.barrio?.trim() || '',
        ciudad: formData.direccion?.ciudad?.trim() || '',
        provincia: formData.direccion?.provincia?.trim() || '',
        codigoPostal: formData.direccion?.codigoPostal?.trim() || null,
        coordenadas: formData.direccion?.coordenadas || null,
        mostrarDireccionExacta: formData.direccion?.mostrarDireccionExacta ?? true,
      },
      
      zona: formData.zona?.trim() || null,
      
      // Características
      caracteristicas: formData.caracteristicas || {},
      
      // Precios (estructura correcta)
      precios: {
        venta: formData.precios?.venta ? {
          moneda: formData.precios.venta.moneda || 'USD',
          monto: formData.precios.venta.monto,
          comision: formData.precios.venta.comision ?? 3,
          gastosEscrituracion: formData.precios.venta.gastosEscrituracion ?? true,
        } : undefined,
        alquiler: formData.precios?.alquiler ? {
          moneda: formData.precios.alquiler.moneda || 'USD',
          monto: formData.precios.alquiler.monto,
          comision: formData.precios.alquiler.comision ?? 4.5,
          ajuste: formData.precios.alquiler.ajuste || 'anual',
          garantiaRequerida: formData.precios.alquiler.garantiaRequerida || 'propiedad',
        } : undefined,
        expensas: formData.precios?.expensas ?? null,
        impuestos: formData.precios?.impuestos ?? null,
      },
      
      // Imágenes procesadas
      imagenes: imagenesPayload,
      
      // Multimedia
      videoUrl: finalVideoUrl,
      tourVirtualUrl: formData.tourVirtualUrl?.trim() || null,
      planoUrl: formData.planoUrl?.trim() || null,
      
      // Estado y configuración
      estado: formData.estado || 'borrador',
      fechaPublicacion: formData.fechaPublicacion || undefined,
      fechaDisponibilidad: formData.fechaDisponibilidad || undefined,
      destacado: formData.destacado || false,
      urgente: formData.urgente || false,
      
      // SEO
      seo: formData.seo ? {
        slug: formData.seo.slug?.trim() || null,
        metaTitle: formData.seo.metaTitle?.trim() || null,
        metaDescription: formData.seo.metaDescription?.trim() || null,
      } : undefined,
      
      // Notas internas
      notasInternas: formData.notasInternas?.trim() || null,
      
      // ✅ IDs de relaciones (no objetos completos)
      propietario: propietarioId,
      agente: agenteId,
    };

    // ✅ DEBUG: Ver qué se está enviando
    console.log('📤 Payload enviado:', payload);

    const res = await fetch(`/api/gestion/propiedades/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json();
      toast.success('✅ Propiedad actualizada correctamente');

      setProperty(updated);
      setFormData(updated);
      setPreviewImages(updated.imagenes?.map((img: ImagenProperty) => ({ url: img.url })) || []);
      setVideoPreview(updated.videoUrl || '');
      setVideoFile(null);
      setHasChanges(false);

      setTimeout(() => {
        router.push(`/gestion/propiedades/${id}`);
      }, 1500);
    } else {
      // ✅ MEJOR MANEJO DE ERRORES
      const error = await res.json().catch(() => ({}));
      console.error('❌ Error del servidor:', error);
      toast.error(error.error || `Error ${res.status}: No se pudo actualizar`);
    }
  } catch (err: any) {
    console.error('💥 Error saving property:', err);
    toast.error(err.message || 'Error de conexión con el servidor');
  } finally {
    setSaving(false);
  }
};

  const handleCancel = () => {
    if (hasChanges) {
      Swal.fire({
        title: '¿Descartar cambios?',
        text: 'Los cambios no guardados se perderán.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, descartar',
        cancelButtonText: 'Seguir editando',
      }).then((result) => {
        if (result.isConfirmed) {
          router.push(`/gestion/propiedades/${id}`);
        }
      });
    } else {
      router.push(`/gestion/propiedades/${id}`);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 🎨 JSX Principal
  // ─────────────────────────────────────────────────────────────
  return (
    <div className={`${theme.bg} ${theme.textPrimary} min-h-screen relative overflow-hidden`}>

      {/* ✨ Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className={`absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br ${theme.gradient} rounded-full blur-3xl opacity-20`} />
      </div>

      {/* 🚨 Espacio para navbar */}
      <div className="pt-24 lg:pt-28" />

      <div className="relative z-10 px-4 md:px-8 pb-12">

        {/* 🏷️ Header */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Link
                  href={`/gestion/propiedades/${id}`}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme.textSecondary} hover:${theme.textAccent} transition-all text-sm`}
                >
                  <FaArrowLeft className="w-4 h-4" />
                  <span>Volver</span>
                </Link>
                <span className={`${theme.textSecondary}`}>/</span>
                <span className="text-sm text-slate-400">Editar</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                <span className="bg-gradient-to-r from-white via-violet-200 to-white bg-clip-text text-transparent">
                  Editar Propiedad
                </span>
              </h1>
              <p className={`${theme.textSecondary} mt-1`}>
                {property.titulo} • <span className="capitalize">{property.tipoPropiedad}</span>
              </p>
            </div>

            {/* Indicador de cambios + botones de acción */}
            <div className="flex items-center gap-3">
              {hasChanges && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  Cambios sin guardar
                </span>
              )}
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-violet-500/40 transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="property-form"
                disabled={saving || !hasChanges}
                className={`
                  inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm
                  ${!hasChanges
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : `bg-gradient-to-r ${theme.gradientPrimary} text-white hover:shadow-lg hover:shadow-violet-900/40 hover:scale-[1.02]`
                  }
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                  transition-all duration-300
                `}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* 📋 Formulario Principal */}
        <form id="property-form" onSubmit={handleSubmit} className="space-y-6">

          {/* 🔘 Navegación de secciones (sticky en desktop) */}
          <div className={`${theme.bgCard} ${theme.border} rounded-xl p-2 backdrop-blur-sm sticky top-24 lg:top-28 z-20 overflow-x-auto`}>
            <div className="flex gap-1 min-w-max">
              {[
                { id: 'basic', label: '📋 Básicos', fields: ['titulo', 'descripcion', 'tipoPropiedad', 'tipoOperacion'] },
                { id: 'location', label: '📍 Ubicación', fields: ['direccion'] },
                { id: 'features', label: '🏠 Características', fields: ['caracteristicas'] },
                { id: 'prices', label: '💰 Precios', fields: ['precios'] },
                { id: 'images', label: `📸 Imágenes (${(formData.imagenes?.length || 0) + previewImages.filter(p => p.file).length}/22)`, fields: ['imagenes'] },
                { id: 'media', label: '🎬 Multimedia', fields: ['videoUrl', 'tourVirtualUrl', 'planoUrl'] },
                { id: 'settings', label: '⚙️ Configuración', fields: ['estado', 'destacado', 'urgente', 'seo'] },
                ...(userRole !== 'agente' ? [{ id: 'internal', label: '🔒 Internas', fields: ['notasInternas', 'propietario'] }] : []),
              ].map(section => {
                const hasError = section.fields.some(f => formErrors[f] || formErrors[`${f}.monto`]);
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => {
                      setActiveSection(section.id);
                      document.getElementById(`section-${section.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className={`
                      relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                      ${activeSection === section.id
                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/30'
                        : `${theme.textSecondary} hover:text-white hover:bg-slate-800/60`
                      }
                      ${hasError && activeSection !== section.id ? 'text-rose-400 hover:text-rose-300' : ''}
                    `}
                  >
                    {section.label}
                    {hasError && activeSection !== section.id && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────
              Sección 1: Datos Básicos
              ───────────────────────────────────────────────────── */}
          <section id="section-basic" className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm ${activeSection !== 'basic' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">1</span>
              Datos Básicos
            </h2>

            <div className="space-y-5">
              {/* Título */}
              <div>
                <label htmlFor="titulo" className="block text-sm font-medium text-slate-300 mb-2">
                  Título de la propiedad <span className="text-rose-400">*</span>
                </label>
                <input
                  id="field-titulo"
                  type="text"
                  value={formData.titulo || ''}
                  onChange={(e) => handleChange('titulo', e.target.value)}
                  className={`w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all ${formErrors.titulo && touchedFields.has('titulo') ? 'border-rose-500/50 ring-rose-500/20' : ''}`}
                  placeholder="Ej: Departamento 3 ambientes con balcón en Palermo Soho"
                  required
                />
                {formErrors.titulo && touchedFields.has('titulo') && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.titulo}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-500">Mínimo 10 caracteres. Será el título principal en la publicación.</p>
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-slate-300 mb-2">
                  Descripción <span className="text-rose-400">*</span>
                </label>
                <textarea
                  id="field-descripcion"
                  value={formData.descripcion || ''}
                  onChange={(e) => handleChange('descripcion', e.target.value)}
                  rows={5}
                  className={`w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all resize-y ${formErrors.descripcion && touchedFields.has('descripcion') ? 'border-rose-500/50 ring-rose-500/20' : ''}`}
                  placeholder="Describí la propiedad: ambientes, detalles destacados, amenities del edificio, zona, etc."
                  required
                />
                {formErrors.descripcion && touchedFields.has('descripcion') && (
                  <p className="mt-1.5 text-xs text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {formErrors.descripcion}
                  </p>
                )}
                <div className="flex justify-between mt-1.5 text-xs">
                  <span className="text-slate-500">Mínimo 50 caracteres</span>
                  <span className={`${(formData.descripcion?.length || 0) >= 4000 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {(formData.descripcion?.length || 0)}/4000
                  </span>
                </div>
              </div>

              {/* Tipo de Propiedad + Operación + Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Tipo de Propiedad */}
                <div>
                  <label htmlFor="tipoPropiedad" className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Propiedad <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="field-tipoPropiedad"
                    value={formData.tipoPropiedad || ''}
                    onChange={(e) => handleChange('tipoPropiedad', e.target.value)}
                    className={`w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer ${formErrors.tipoPropiedad && touchedFields.has('tipoPropiedad') ? 'border-rose-500/50 ring-rose-500/20' : ''}`}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="departamento">Departamento</option>
                    <option value="casa">Casa</option>
                    <option value="local">Local Comercial</option>
                    <option value="oficina">Oficina</option>
                    <option value="terreno">Terreno</option>
                    <option value="campo">Campo</option>
                    <option value="barrio cerrado">Barrios Cerrados</option>
                    <option value="urbanizacion protegida">Urbanizaciones Protegidas</option>
                    <option value="galpon">Galpón</option>
                    <option value="ph">PH</option>
                    <option value="cochera">Cochera</option>

                  </select>
                </div>

                {/* Tipo de Operación */}
                <div>
                  <label htmlFor="tipoOperacion" className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Operación <span className="text-rose-400">*</span>
                  </label>
                  <select
                    id="field-tipoOperacion"
                    value={formData.tipoOperacion || ''}
                    onChange={(e) => handleChange('tipoOperacion', e.target.value)}
                    className={`w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer ${formErrors.tipoOperacion && touchedFields.has('tipoOperacion') ? 'border-rose-500/50 ring-rose-500/20' : ''}`}
                    required
                  >
                    <option value="">Seleccionar...</option>
                    <option value="venta">Solo Venta</option>
                    <option value="alquiler">Solo Alquiler</option>
                    <option value="ambos">Venta y Alquiler</option>
                  </select>
                </div>

                {/* Categoría */}
                <div>
                  <label htmlFor="categoria" className="block text-sm font-medium text-slate-300 mb-2">
                    Categoría
                  </label>
                  <select
                    id="field-categoria"
                    value={formData.categoria || 'residencial'}
                    onChange={(e) => handleChange('categoria', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option value="residencial">Residencial</option>
                    <option value="comercial">Comercial</option>
                    <option value="industrial">Industrial</option>
                    <option value="inversion">Inversión</option>
                  </select>
                </div>
              </div>

              {/* Código Interno + SEO Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="codigoInterno" className="block text-sm font-medium text-slate-300 mb-2">
                    Código Interno <span className="text-slate-500 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="field-codigoInterno"
                    type="text"
                    value={formData.codigoInterno || ''}
                    onChange={(e) => handleChange('codigoInterno', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    placeholder="Ej: PROP-2024-001"
                  />
                  <p className="mt-1 text-xs text-slate-500">Para referencia interna. Único si se completa.</p>
                </div>
                <div>
                  <label htmlFor="seo-slug" className="block text-sm font-medium text-slate-300 mb-2">
                    Slug SEO <span className="text-slate-500 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="field-seo.slug"
                    type="text"
                    value={formData.seo?.slug || ''}
                    onChange={(e) => handleNestedChange('seo', 'slug', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all font-mono text-sm"
                    placeholder="departamento-3amb-palermo-soho"
                  />
                  <p className="mt-1 text-xs text-slate-500">Para URL amigable. Se genera automático si se deja vacío.</p>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────
              Sección 2: Ubicación
              ───────────────────────────────────────────────────── */}
          <section id="section-location" className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm ${activeSection !== 'location' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">2</span>
              Ubicación
            </h2>

            <div className="space-y-5">
              {/* Calle + Número */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                  <label htmlFor="direccion.calle" className="block text-sm font-medium text-slate-300 mb-2">
                    Calle <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="field-direccion.calle"
                    type="text"
                    value={formData.direccion?.calle || ''}
                    onChange={(e) => handleNestedChange('direccion', 'calle', e.target.value)}
                    className={`w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all ${formErrors['direccion.calle'] && touchedFields.has('direccion.calle') ? 'border-rose-500/50 ring-rose-500/20' : ''}`}
                    placeholder="Ej: Gorriti"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="direccion.numero" className="block text-sm font-medium text-slate-300 mb-2">
                    Número <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="field-direccion.numero"
                    type="text"
                    value={formData.direccion?.numero || ''}
                    onChange={(e) => handleNestedChange('direccion', 'numero', e.target.value)}
                    className={`w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all ${formErrors['direccion.numero'] && touchedFields.has('direccion.numero') ? 'border-rose-500/50 ring-rose-500/20' : ''}`}
                    placeholder="4520"
                    required
                  />
                </div>
              </div>

              {/* Piso + Depto + CP */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="direccion.piso" className="block text-sm font-medium text-slate-300 mb-2">
                    Piso <span className="text-slate-500 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="field-direccion.piso"
                    type="text"
                    value={formData.direccion?.piso || ''}
                    onChange={(e) => handleNestedChange('direccion', 'piso', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    placeholder="5, PH, S/N"
                  />
                </div>
                <div>
                  <label htmlFor="direccion.depto" className="block text-sm font-medium text-slate-300 mb-2">
                    Depto <span className="text-slate-500 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="field-direccion.depto"
                    type="text"
                    value={formData.direccion?.depto || ''}
                    onChange={(e) => handleNestedChange('direccion', 'depto', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    placeholder="A, 12, B2"
                  />
                </div>
                <div>
                  <label htmlFor="direccion.codigoPostal" className="block text-sm font-medium text-slate-300 mb-2">
                    Código Postal <span className="text-slate-500 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="field-direccion.codigoPostal"
                    type="text"
                    value={formData.direccion?.codigoPostal || ''}
                    onChange={(e) => handleNestedChange('direccion', 'codigoPostal', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    placeholder="C1414"
                  />
                </div>
              </div>

              {/* Barrio + Ciudad + Provincia */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label htmlFor="direccion.barrio" className="block text-sm font-medium text-slate-300 mb-2">
                    Barrio <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="field-direccion.barrio"
                    type="text"
                    value={formData.direccion?.barrio || ''}
                    onChange={(e) => handleNestedChange('direccion', 'barrio', e.target.value)}
                    className={`w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all ${formErrors['direccion.barrio'] && touchedFields.has('direccion.barrio') ? 'border-rose-500/50 ring-rose-500/20' : ''}`}
                    placeholder="Palermo"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="direccion.ciudad" className="block text-sm font-medium text-slate-300 mb-2">
                    Ciudad <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="field-direccion.ciudad"
                    type="text"
                    value={formData.direccion?.ciudad || ''}
                    onChange={(e) => handleNestedChange('direccion', 'ciudad', e.target.value)}
                    className={`w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all ${formErrors['direccion.ciudad'] && touchedFields.has('direccion.ciudad') ? 'border-rose-500/50 ring-rose-500/20' : ''}`}
                    placeholder="Buenos Aires"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="direccion.provincia" className="block text-sm font-medium text-slate-300 mb-2">
                    Provincia <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="field-direccion.provincia"
                    type="text"
                    value={formData.direccion?.provincia || ''}
                    onChange={(e) => handleNestedChange('direccion', 'provincia', e.target.value)}
                    className={`w-full px-4 py-3 ${theme.bgCard} ${theme.border} rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all ${formErrors['direccion.provincia'] && touchedFields.has('direccion.provincia') ? 'border-rose-500/50 ring-rose-500/20' : ''}`}
                    placeholder="CABA"
                    required
                  />
                </div>
              </div>

              {/* Zona + Privacidad de dirección */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="zona" className="block text-sm font-medium text-slate-300 mb-2">
                    Zona / Sub-barrio <span className="text-slate-500 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="field-zona"
                    type="text"
                    value={formData.zona || ''}
                    onChange={(e) => handleChange('zona', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    placeholder="Palermo Soho, Microcentro, etc."
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={!formData.direccion?.mostrarDireccionExacta}
                        onChange={(e) => handleNestedChange('direccion', 'mostrarDireccionExacta', !e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-violet-600 transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                    </div>
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                      Ocultar dirección exacta en publicación
                    </span>
                  </label>
                </div>
              </div>

              {/* Preview de dirección */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Vista previa</p>
                <p className="text-white font-medium">
                  {formData.direccion?.calle} {formData.direccion?.numero}
                  {formData.direccion?.piso && `, Piso ${formData.direccion.piso}`}
                  {formData.direccion?.depto && `, Depto ${formData.direccion.depto}`}
                </p>
                <p className="text-slate-300">
                  {formData.direccion?.barrio}, {formData.direccion?.ciudad}, {formData.direccion?.provincia}
                </p>
                {!formData.direccion?.mostrarDireccionExacta && (
                  <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> En la publicación pública se mostrará solo "{formData.direccion?.barrio}, {formData.direccion?.ciudad}"
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────
              Sección 3: Características (resumida - se puede expandir)
              ───────────────────────────────────────────────────── */}
          <section id="section-features" className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm ${activeSection !== 'features' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">3</span>
              Características
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { key: 'ambientes', label: 'Ambientes', type: 'number', min: 1 },
                { key: 'dormitorios', label: 'Dormitorios', type: 'number', min: 0 },
                { key: 'banios', label: 'Baños', type: 'number', min: 0 },
                { key: 'toilets', label: 'Toilets', type: 'number', min: 0 },
                { key: 'metrosCubiertos', label: 'M² Cubiertos', type: 'number', min: 0, suffix: 'm²' },
                { key: 'metrosTotales', label: 'M² Totales', type: 'number', min: 0, suffix: 'm²' },
                { key: 'cocheras', label: 'Cocheras', type: 'number', min: 0 },
                { key: 'piso', label: 'Piso', type: 'number', min: -1 },
                { key: 'antiguedad', label: 'Antigüedad', type: 'number', min: 0, suffix: 'años' },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.type}
                      min={field.min}
                      value={(formData.caracteristicas as any)?.[field.key] || ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? undefined : Number(e.target.value);
                        handleNestedChange('caracteristicas', field.key, val);
                      }}
                      className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all text-sm"
                      placeholder="—"
                    />
                    {field.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                        {field.suffix}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Checkboxes de extras */}
            <div className="mt-6 pt-4 border-t border-slate-700/50">
              <p className="text-xs font-medium text-slate-400 mb-3">Extras y Amenities</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { key: 'balcon', label: '🪟 Balcón' },
                  { key: 'terraza', label: '🌿 Terraza' },
                  { key: 'patio', label: '🏡 Patio' },
                  { key: 'pileta', label: '🏊 Pileta' },
                  { key: 'jardin', label: '🌳 Jardín' },
                  { key: 'ascensor', label: '🛗 Ascensor' },
                  { key: 'seguridad', label: '🔒 Seguridad' },
                  { key: 'cochera', label: '🚘 Cochera' },
                ].map(extra => (
                  <label key={extra.key} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={(formData.caracteristicas as any)?.[extra.key] || false}
                      onChange={(e) => handleNestedChange('caracteristicas', extra.key, e.target.checked)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500/20 focus:ring-offset-0"
                    />
                    <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{extra.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Estado de conservación + Orientación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estado de Conservación</label>
                <select
                  value={(formData.caracteristicas as any)?.estadoConservacion || 'bueno'}
                  onChange={(e) => handleNestedChange('caracteristicas', 'estadoConservacion', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="nuevo">✨ Nuevo / A estrenar</option>
                  <option value="excelente">✅ Excelente</option>
                  <option value="bueno">👍 Bueno</option>
                  <option value="regular">⚠️ Regular</option>
                  <option value="a renovar">🔨 A renovar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Orientación</label>
                <select
                  value={(formData.caracteristicas as any)?.orientacion || ''}
                  onChange={(e) => handleNestedChange('caracteristicas', 'orientacion', e.target.value || undefined)}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Sin especificar</option>
                  <option value="norte">🌞 Norte</option>
                  <option value="sur">🌙 Sur</option>
                  <option value="este">🌅 Este</option>
                  <option value="oeste">🌇 Oeste</option>
                  <option value="noreste">Noreste</option>
                  <option value="noroeste">Noroeste</option>
                  <option value="sureste">Sureste</option>
                  <option value="suroeste">Suroeste</option>
                </select>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────
              Sección 4: Precios (Venta / Alquiler)
              ───────────────────────────────────────────────────── */}
          <section id="section-prices" className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm ${activeSection !== 'prices' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">4</span>
              Precios y Condiciones
            </h2>

            {formErrors.precios && touchedFields.has('precios') && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formErrors.precios}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Precio de Venta */}
              {formData.tipoOperacion !== 'alquiler' && (
                <div className="p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-emerald-400 flex items-center gap-2">
                      <FaMoneyBillWave className="w-4 h-4" /> Precio de Venta
                    </h3>
                    {formData.precios?.venta?.monto && (
                      <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
                        {formData.precios.venta.moneda}
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Monto */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Monto</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.precios?.venta?.monto?.toString() || ''}
                          onChange={(e) => {
                            const monto = formatPriceInput(e.target.value);
                            handleDeepNestedChange('precios', 'venta', 'monto', monto);
                          }}
                          className={`w-full pl-8 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all ${formErrors['precios.venta.monto'] ? 'border-rose-500/50' : ''}`}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Moneda */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Moneda</label>
                        <select
                          value={formData.precios?.venta?.moneda || 'USD'}
                          onChange={(e) => handleDeepNestedChange('precios', 'venta', 'moneda', e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                        >
                          <option value="USD">USD 🇺🇸</option>
                          <option value="ARS">ARS 🇦🇷</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Comisión (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.precios?.venta?.comision?.toString() || ''}
                          onChange={(e) => handleDeepNestedChange('precios', 'venta', 'comision', e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-emerald-500/50"
                          placeholder="3"
                        />
                      </div>
                    </div>

                    {/* Gastos de escrituración */}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.precios?.venta?.gastosEscrituracion ?? true}
                        onChange={(e) => handleDeepNestedChange('precios', 'venta', 'gastosEscrituracion', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-emerald-600 focus:ring-emerald-500/20"
                      />
                      <span className="text-sm text-slate-300">Gastos de escrituración incluidos</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Precio de Alquiler */}
              {formData.tipoOperacion !== 'venta' && (
                <div className="p-5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-blue-400 flex items-center gap-2">
                      <FaMoneyBillWave className="w-4 h-4" /> Precio de Alquiler
                    </h3>
                    {formData.precios?.alquiler?.monto && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                        {formData.precios.alquiler.moneda}/mes
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    {/* Monto */}
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Monto mensual</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={formData.precios?.alquiler?.monto?.toString() || ''}
                          onChange={(e) => {
                            const monto = formatPriceInput(e.target.value);
                            handleDeepNestedChange('precios', 'alquiler', 'monto', monto);
                          }}
                          className={`w-full pl-8 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all ${formErrors['precios.alquiler.monto'] ? 'border-rose-500/50' : ''}`}
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Moneda + Ajuste */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Moneda</label>
                        <select
                          value={formData.precios?.alquiler?.moneda || 'USD'}
                          onChange={(e) => handleDeepNestedChange('precios', 'alquiler', 'moneda', e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="USD">USD 🇺🇸</option>
                          <option value="ARS">ARS 🇦🇷</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Ajuste</label>
                        <select
                          value={formData.precios?.alquiler?.ajuste || 'anual'}
                          onChange={(e) => handleDeepNestedChange('precios', 'alquiler', 'ajuste', e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="anual">Anual</option>
                          <option value="semestral">Semestral</option>
                          <option value="trimestral">Trimestral</option>
                        </select>
                      </div>
                    </div>

                    {/* Comisión + Garantía */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Comisión (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={formData.precios?.alquiler?.comision?.toString() || ''}
                          onChange={(e) => handleDeepNestedChange('precios', 'alquiler', 'comision', e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                          placeholder="4.5"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1.5">Garantía</label>
                        <select
                          value={formData.precios?.alquiler?.garantiaRequerida || 'propiedad'}
                          onChange={(e) => handleDeepNestedChange('precios', 'alquiler', 'garantiaRequerida', e.target.value)}
                          className="w-full px-3 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50"
                        >
                          <option value="propiedad">Propiedad</option>
                          <option value="fiador">Fiador</option>
                          <option value="caucion">Caución</option>
                          <option value="seguro">Seguro de Caución</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Expensas + Impuestos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Expensas Mensuales <span className="text-slate-500 font-normal">(opcional)</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.precios?.expensas?.toString() || ''}
                    onChange={(e) => handleChange('precios', { ...formData.precios, expensas: formatPriceInput(e.target.value) })}
                    className="w-full pl-8 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Impuestos (ABL, etc.) <span className="text-slate-500 font-normal">(opcional)</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={formData.precios?.impuestos?.toString() || ''}
                    onChange={(e) => handleChange('precios', { ...formData.precios, impuestos: formatPriceInput(e.target.value) })}
                    className="w-full pl-8 pr-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────
              Sección 5: Imágenes (con gestión avanzada)
              ───────────────────────────────────────────────────── */}
          <section id="section-images" className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm ${activeSection !== 'images' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">22</span>
              Imágenes
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                {(formData.imagenes?.length || 0) + previewImages.filter(p => p.file).length}/22
              </span>
            </h2>

            {formErrors.imagenes && touchedFields.has('imagenes') && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formErrors.imagenes}
              </div>
            )}

            {/* Upload area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${previewImages.filter(p => p.file).length + (formData.imagenes?.length || 0) >= 22
                ? 'border-slate-700 bg-slate-800/30 cursor-not-allowed opacity-60'
                : 'border-slate-600 hover:border-violet-500/50 hover:bg-slate-800/50'
                }`}
              onClick={() => previewImages.filter(p => p.file).length + (formData.imagenes?.length || 0) < 22 && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={previewImages.filter(p => p.file).length + (formData.imagenes?.length || 0) >= 22}
              />
              <FaUpload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
              <p className="text-white font-medium mb-1">
                {previewImages.filter(p => p.file).length + (formData.imagenes?.length || 0) >= 22
                  ? 'Límite de imágenes alcanzado'
                  : 'hacer click para subir'}
              </p>
              <p className="text-xs text-slate-500">
                JPG, PNG o WebP • Máx. 5MB cada una • Máx. 22 imágenes
              </p>
            </div>

            {/* Lista de imágenes existentes */}
            {formData.imagenes && formData.imagenes.length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-slate-400 mb-3">Imágenes guardadas</p>
                <ImageGrid
                  images={formData.imagenes}
                  isPreview={false}
                  onRemove={(i) => removeImage(i, false)}
                  onSetPrincipal={(i) => setPrincipalImage(i, false)}
                  onReorder={(from, to) => reorderImages(from, to, false)}
                />
              </div>
            )}

            {/* Lista de imágenes nuevas (preview) */}
            {previewImages.filter(p => p.file).length > 0 && (
              <div className="mt-6">
                <p className="text-sm text-slate-400 mb-3">Nuevas imágenes (pendientes de guardar)</p>
                <ImageGrid
                  images={previewImages.filter(p => p.file)}
                  isPreview={true}
                  onRemove={(i) => removeImage(i, true)}
                  onSetPrincipal={(i) => setPrincipalImage(i, true)}
                  onReorder={(from, to) => reorderImages(from, to, true)}
                />
              </div>
            )}

            {/* Tips */}
            <div className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30 text-sm text-slate-400">
              <p className="flex items-start gap-2">
                <FaExclamationTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Consejos:</strong> Subí primero la imagen que querés como portada y marcála como "Principal".
                  Podés reordenar arrastrando las imágenes. Las nuevas se subirán al guardar.
                </span>
              </p>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────
    Sección 6: Multimedia Adicional
    ───────────────────────────────────────────────────── */}
          <section id="section-media" className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm ${activeSection !== 'media' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">6</span>
              Multimedia Adicional
            </h2>

            <div className="space-y-5">
              {/* Video */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <FaVideo className="text-red-400" />
                  Video de la propiedad <span className="text-slate-500 font-normal">(opcional)</span>
                </label>

                <div className="space-y-4">
                  {/* Input para subir archivo */}
                  <div className="flex flex-wrap gap-4">
                    <label className={`
            flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${videoFile
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-600 hover:border-violet-500 hover:bg-slate-800/50'
                      }
          `}>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          if (!file.type.startsWith('video/')) {
                            toast.error('El archivo debe ser un video');
                            return;
                          }
                          if (file.size > 100 * 1024 * 1024) {
                            toast.error('El video no puede superar los 100MB');
                            return;
                          }

                          setVideoFile(file);
                          const url = URL.createObjectURL(file);
                          setVideoPreview(url);
                          handleChange('videoUrl', url); // Marcar como cambiado
                        }}
                        className="hidden"
                      />
                      {videoFile ? (
                        <div className="text-center">
                          <FaVideo className="text-2xl text-emerald-400 mx-auto mb-1" />
                          <span className="text-xs text-emerald-400">Video nuevo</span>
                        </div>
                      ) : (
                        <>
                          <FaVideo className="text-2xl text-slate-500" />
                          <span className="text-xs text-slate-400 mt-1 text-center px-2">
                            {videoPreview ? 'Cambiar' : 'Subir video'}
                          </span>
                        </>
                      )}
                    </label>

                    {videoPreview && (
                      <div className="relative group w-64 h-32 rounded-xl overflow-hidden border-2 border-slate-700">
                        <video src={videoPreview} className="w-full h-full object-cover" controls />
                        <button
                          type="button"
                          onClick={() => {
                            setVideoFile(null);
                            setVideoPreview('');
                            handleChange('videoUrl', '');
                            if (videoInputRef.current) videoInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded bg-rose-500 text-white hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar video"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        {videoFile && (
                          <span className="absolute bottom-2 left-2 px-2 py-1 rounded text-[10px] bg-amber-500 text-white font-medium">
                            Pendiente de guardar
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">MP4, WebM o MOV • Máx. 50MB</p>
                </div>
              </div>

              {/* Tour Virtual */}
              <div>
                <label htmlFor="tourVirtualUrl" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <FaExpand className="text-cyan-400" />
                  Tour Virtual 3D <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <input
                  id="field-tourVirtualUrl"
                  type="url"
                  value={formData.tourVirtualUrl || ''}
                  onChange={(e) => handleChange('tourVirtualUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  placeholder="https://my.matterport.com/show/?m=..."
                />
                <p className="mt-1 text-xs text-slate-500">Link de Matterport, Kuula, o plataforma de tour virtual.</p>
              </div>

              {/* Plano */}
              <div>
                <label htmlFor="planoUrl" className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <FaFilePdf className="text-emerald-400" />
                  Plano / Planta <span className="text-slate-500 font-normal">(opcional)</span>
                </label>
                <input
                  id="field-planoUrl"
                  type="url"
                  value={formData.planoUrl || ''}
                  onChange={(e) => handleChange('planoUrl', e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  placeholder="https://.../plano.pdf"
                />
                <p className="mt-1 text-xs text-slate-500">URL pública del plano en PDF o imagen.</p>
              </div>
            </div>
          </section>
          {/* ─────────────────────────────────────────────────────
              Sección 7: Configuración y Estado
              ───────────────────────────────────────────────────── */}
          <section id="section-settings" className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm ${activeSection !== 'settings' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">7</span>
              Configuración y Estado
            </h2>

            <div className="space-y-5">
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Estado de la Propiedad</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(['borrador', 'publicado', 'reservado', 'alquilado', 'vendido', 'baja'] as const).map(estado => {
                    const isSelected = formData.estado === estado;
                    const styles: Record<string, string> = {
                      borrador: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
                      publicado: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
                      reservado: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
                      alquilado: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
                      vendido: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
                      baja: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
                    };
                    return (
                      <button
                        key={estado}
                        type="button"
                        onClick={() => handleChange('estado', estado)}
                        className={`
                          px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left
                          ${isSelected
                            ? `${styles[estado]} ring-2 ring-offset-2 ring-offset-slate-900 ${estado === 'borrador' ? 'ring-slate-500' : estado === 'publicado' ? 'ring-emerald-500' : estado === 'reservado' ? 'ring-amber-500' : estado === 'alquilado' ? 'ring-blue-500' : estado === 'vendido' ? 'ring-purple-500' : 'ring-rose-500'}`
                            : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                          }
                        `}
                      >
                        {estado.charAt(0).toUpperCase() + estado.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fecha de Publicación</label>
                  <input
                    type="datetime-local"
                    value={formData.fechaPublicacion ? new Date(formData.fechaPublicacion).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleChange('fechaPublicacion', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fecha de Disponibilidad</label>
                  <input
                    type="datetime-local"
                    value={formData.fechaDisponibilidad ? new Date(formData.fechaDisponibilidad).toISOString().slice(0, 16) : ''}
                    onChange={(e) => handleChange('fechaDisponibilidad', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Toggles: Destacado + Urgente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 cursor-pointer hover:border-violet-500/30 transition-all">
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      <FaStar className={formData.destacado ? 'text-amber-400' : 'text-slate-500'} />
                      Propiedad Destacada
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Aparecerá en secciones destacadas del sitio</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.destacado || false}
                      onChange={(e) => handleChange('destacado', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-amber-500 transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 cursor-pointer hover:border-rose-500/30 transition-all">
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      <FaExclamationTriangle className={formData.urgente ? 'text-rose-400' : 'text-slate-500'} />
                      Oportunidad / Urgente
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Badge visual para propiedades con precio especial</p>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.urgente || false}
                      onChange={(e) => handleChange('urgente', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:bg-rose-500 transition-colors" />
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                  </div>
                </label>
              </div>

              {/* SEO Meta Tags */}
              <div className="pt-4 border-t border-slate-700/50">
                <p className="text-sm font-medium text-slate-300 mb-3">SEO - Meta Tags (opcional)</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Meta Title (máx. 60 caracteres)</label>
                    <input
                      type="text"
                      maxLength={60}
                      value={formData.seo?.metaTitle || ''}
                      onChange={(e) => handleNestedChange('seo', 'metaTitle', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                      placeholder="Departamento 3 ambientes en Palermo | Tu Inmobiliaria"
                    />
                    <div className="flex justify-end mt-1 text-xs">
                      <span className={`${(formData.seo?.metaTitle?.length || 0) > 60 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {(formData.seo?.metaTitle?.length || 0)}/60
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Meta Description (máx. 160 caracteres)</label>
                    <textarea
                      maxLength={160}
                      rows={2}
                      value={formData.seo?.metaDescription || ''}
                      onChange={(e) => handleNestedChange('seo', 'metaDescription', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
                      placeholder="Hermoso departamento de 3 ambientes en Palermo Soho. Balcon, cochera, pileta. ¡Consultá!"
                    />
                    <div className="flex justify-end mt-1 text-xs">
                      <span className={`${(formData.seo?.metaDescription?.length || 0) > 160 ? 'text-rose-400' : 'text-slate-500'}`}>
                        {(formData.seo?.metaDescription?.length || 0)}/160
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────
              Sección 8: Notas Internas + Propietario (solo admin)
              ───────────────────────────────────────────────────── */}
          {userRole !== 'agente' && (
            <section id="section-internal" className={`${theme.bgCard} ${theme.border} rounded-2xl p-6 backdrop-blur-sm border-l-4 border-l-violet-500 ${activeSection !== 'internal' ? 'opacity-60 hover:opacity-100 transition-opacity' : ''}`}>
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">8</span>
                Información Interna
                <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30">
                  Solo visible para admin/agente
                </span>
              </h2>

              <div className="space-y-5">
                {/* Notas Internas */}
                <div>
                  <label htmlFor="notasInternas" className="block text-sm font-medium text-slate-300 mb-2">
                    Notas Internas <span className="text-slate-500 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    id="field-notasInternas"
                    value={formData.notasInternas || ''}
                    onChange={(e) => handleChange('notasInternas', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all resize-y"
                    placeholder="Información sensible: contactos del propietario, observaciones de inspección, estrategia de venta, etc."
                  />
                  <p className="mt-1 text-xs text-slate-500">Estas notas NO se muestran en la publicación pública.</p>
                </div>

                {/* Propietario (solo lectura para admin, editable si se implementa relación) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Propietario</label>
                  {typeof formData.propietario === 'object' ? (
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                      <p className="text-white font-medium">{formData.propietario.razonSocial || `${formData.propietario.nombre} ${formData.propietario.apellido}`}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        {formData.propietario.telefono && (
                          <p className="text-slate-400">📞 {formData.propietario.telefono}</p>
                        )}
                        {formData.propietario.email && (
                          <p className="text-slate-400">✉️ {formData.propietario.email}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-sm">ID: {formData.propietario}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    Para cambiar el propietario, contactá al administrador del sistema.
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* 🎯 Botones de Acción Finales (sticky en mobile) */}
          <div className="sticky bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent z-30 -mx-4 px-4">
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="flex-1 px-5 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:bg-slate-700/60 hover:border-violet-500/40 transition-all disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className={`
                  flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium
                  ${!hasChanges
                    ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                    : `bg-gradient-to-r ${theme.gradientPrimary} text-white hover:shadow-lg hover:shadow-violet-900/40 hover:scale-[1.02]`
                  }
                  disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100
                  transition-all duration-300
                `}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Guardando cambios...
                  </>
                ) : (
                  <>
                    <FaSave className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}