// app/app/gestion/propiedades/nuevo/page.tsx
'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import Link from 'next/link';
import {
    FaHome, FaArrowLeft, FaPlus, FaImages, FaBuilding, FaMapMarkerAlt,
    FaMoneyBillWave, FaExclamationTriangle, FaStar, FaUser, FaVideo
} from 'react-icons/fa';
import { Loader2, AlertCircle, X } from 'lucide-react';
import { parseArgentineNumber, formatArgentineInput, formatArgentineFinal } from '@/app/lib/formatArgentine';
import { parseJwt } from '@/app/lib/jwt';
import { isValidObjectId } from '@/app/lib/validateObjectId';
import NuevoClienteModal from '@/app/components/modals/NuevoClienteModal';


// ─────────────────────────────────────────────────────────────
// 🔹 Tipos
// ─────────────────────────────────────────────────────────────

interface ImagenEntry {
    url: string;
    descripcion?: string;
    principal: boolean;
    orden: number;
    tipo: 'foto' | 'plano' | 'video_thumbnail';
}

interface OpcionesAPI {
    barrios: string[];
    ciudades: string[];
    zonas: string[];
    propietarios: Array<{ _id: string; nombre: string; razonSocial: string; apellido?: string }>;
    agentes: Array<{ _id: string; name: string; email: string }>;
}

// ─────────────────────────────────────────────────────────────
// 🔹 Componente Principal
// ─────────────────────────────────────────────────────────────

export default function NuevaPropiedadPage() {
    const { data: session, status, update } = useSession();
    const router = useRouter();

    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingOptions, setLoadingOptions] = useState(true);
    const [userRole, setUserRole] = useState<string>('');

    // 📸 Gestión de imágenes
    const [imagenes, setImagenes] = useState<ImagenEntry[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);

    // 📹 Gestión de video
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string>('');
    const videoInputRef = useRef<HTMLInputElement>(null);

    // 💰 Precios con formato argentino
    const [displayPrecios, setDisplayPrecios] = useState({
        venta: '',
        alquiler: '',
        expensas: '',
        impuestos: '',
    });

    // 📋 Form principal - CON TODOS LOS CAMPOS
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        codigoInterno: '',
        zona: '',
        tipoPropiedad: '' as 'departamento' | 'casa' | 'local' | 'oficina' | 'terreno' | 'barrios cerrados' | 'urbanizaciones protegidas' | 'galpón' | 'ph',
        tipoOperacion: 'venta' as 'venta' | 'alquiler' | 'ambos',
        categoria: 'residencial' as 'residencial' | 'comercial' | 'industrial' | 'inversion',
        direccion: {
            calle: '', numero: '', piso: '', depto: '',
            barrio: '', ciudad: '', provincia: '', codigoPostal: '',
            mostrarDireccionExacta: false,
        },
        caracteristicas: {
            ambientes: undefined as number | undefined,
            dormitorios: undefined as number | undefined,
            banios: undefined as number | undefined,
            metrosCubiertos: undefined as number | undefined,
            metrosTotales: undefined as number | undefined,
            cochera: false,
            balcon: false,
            pileta: false,
            ascensor: false,
            seguridad: false,
        },
        precios: {
            venta: { moneda: 'USD' as 'USD' | 'ARS', monto: null as number | null, comision: 3 },
            alquiler: { moneda: 'USD' as 'USD' | 'ARS', monto: null as number | null, comision: 4.5 },
            expensas: null as number | null,
            impuestos: null as number | null,
        },
        estado: 'borrador' as 'borrador' | 'publicado' | 'reservado' | 'alquilado' | 'vendido' | 'baja',
        destacado: false,
        urgente: false,
        propietario: '',
        agente: '',
        notasInternas: '',
    });

    // 📋 Opciones dinámicas
    const [opciones, setOpciones] = useState<OpcionesAPI | null>(null);

    // 🎛 Modos de edición para selects con "Agregar nuevo"
    const [barrioMode, setBarrioMode] = useState<'select' | 'custom'>('select');
    const [ciudadMode, setCiudadMode] = useState<'select' | 'custom'>('select');
    const [propietarioMode, setPropietarioMode] = useState<'select' | 'custom'>('select');
    const [agenteMode, setAgenteMode] = useState<'select' | 'custom'>('select');

    // 🔒 Validación de acceso
    useEffect(() => {
        const validateAccess = async () => {
            if (status === 'loading') return;
            if (status === 'unauthenticated') { router.push('/'); return; }

            const token = session?.user?.token || localStorage.getItem('token');
            if (!token) { toast.error('Acceso denegado'); router.push('/'); return; }

            try {
                const payload = parseJwt(token);
                const role = payload.role || session?.user.role;
                if (!['admin', 'superadmin', 'agente'].includes(role)) {
                    toast.error('Acceso restringido'); router.push('/'); return;
                }
                setIsAuthorized(true);
                setUserRole(role);
                if (role === 'agente' && session?.user?.id) {
                    setForm(prev => ({ ...prev, agente: session.user.id }));
                }
            } catch {
                toast.error('Sesión inválida'); router.push('/');
            }
        };
        validateAccess();
    }, [status, session, router]);

    // 🔄 Mantener sesión viva al volver a la pestaña
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                // Forzar la renovación silenciosa de la sesión al volver a la pestaña
                await update();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [update]);


    // 📥 Cargar opciones dinámicas
    const fetchOpciones = useCallback(async () => {
        if (!isAuthorized) return;
        try {
            const res = await fetch('/api/gestion/propiedades/opciones');
            if (res.ok) {
                const data: OpcionesAPI = await res.json();
                setOpciones(data);
            }
        } catch (err) {
            console.error('Error loading options:', err);
        } finally {
            setLoadingOptions(false);
        }
    }, [isAuthorized]);

    useEffect(() => {
        fetchOpciones();
    }, [fetchOpciones]);

    // 💰 Handlers de precios con formato argentino
    const handlePriceChange = (section: 'venta' | 'alquiler' | 'expensas' | 'impuestos', rawValue: string) => {
        const cleaned = formatArgentineInput(rawValue);
        setDisplayPrecios(prev => ({ ...prev, [section]: cleaned }));
        const numericValue = parseArgentineNumber(cleaned);

        if (section === 'venta' || section === 'alquiler') {
            setForm(prev => ({
                ...prev,
                precios: {
                    ...prev.precios,
                    [section]: { ...(prev.precios[section] as any), monto: numericValue }
                }
            }));
        } else {
            setForm(prev => ({
                ...prev,
                precios: { ...prev.precios, [section]: numericValue }
            }));
        }
    };


    // 💾 1. Cargar borrador al montar (si el formulario está vacío)
    useEffect(() => {
        if (isAuthorized) {
            const savedDraft = localStorage.getItem('propiedad_nueva_draft');
            if (savedDraft && !form.titulo) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    setForm(parsed);
                    toast.info('📝 Se recuperó el borrador de la propiedad.');
                } catch (e) {
                    console.error('Error al cargar borrador', e);
                }
            }
        }
    }, [isAuthorized]);

    // 💾 2. Guardar borrador cada vez que el usuario escribe
    useEffect(() => {
        if (isAuthorized && form.titulo) { // Guardar solo si ya empezó a escribir
            localStorage.setItem('propiedad_nueva_draft', JSON.stringify(form));
        }
    }, [form, isAuthorized]);

    const handlePriceBlur = (section: 'venta' | 'alquiler' | 'expensas' | 'impuestos') => {
        const value = section === 'venta' || section === 'alquiler'
            ? (form.precios[section] as any)?.monto
            : form.precios[section];
        const currency = section === 'venta' || section === 'alquiler'
            ? (form.precios[section] as any)?.moneda || 'USD'
            : 'ARS';

        setDisplayPrecios(prev => ({
            ...prev,
            [section]: formatArgentineFinal(value, currency)
        }));
    };

    // 📸 Gestión de imágenes múltiples
    const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const currentTotal = imagenes.length + imageFiles.length;
        const availableSlots = 22 - currentTotal;

        if (availableSlots <= 0) {
            toast.error('Ya alcanzaste el máximo de 22 imágenes');
            return;
        }

        const filesToProcess = files.slice(0, availableSlots);

        if (files.length > availableSlots) {
            toast.warning(`Solo se agregarán ${availableSlots} imágenes (límite de 22)`);
        }

        // Procesar archivos secuencialmente para mantener el orden
        for (const file of filesToProcess) {
            if (!file.type.startsWith('image/')) {
                toast.error(`"${file.name}" no es una imagen válida`);
                continue;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`"${file.name}" supera los 5MB`);
                continue;
            }

            try {
                const url = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => resolve(ev.target?.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });

                setImagePreviews(prev => [...prev, url]);
                setImageFiles(prev => [...prev, file]);
            } catch (err) {
                toast.error(`Error al procesar "${file.name}"`);
            }
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    const removeImage = (index: number) => {
        setImagenes(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    const setPrincipalImage = (index: number) => {
        setImagenes(prev => prev.map((img, i) => ({
            ...img,
            principal: i === index
        })));
    };

    // 🔍 Validación del formulario
    const validateForm = (): boolean => {
        if (!form.titulo.trim() || form.titulo.length < 15) {
            toast.error('El título debe tener al menos 15 caracteres');
            return false;
        }
        if (!form.descripcion.trim() || form.descripcion.length < 50) {
            toast.error('La descripción debe tener al menos 50 caracteres');
            return false;
        }
        if (!form.tipoPropiedad) {
            toast.error('Seleccioná el tipo de propiedad');
            return false;
        }
        if (!form.tipoOperacion) {
            toast.error('Seleccioná el tipo de operación');
            return false;
        }

        const dir = form.direccion;
        if (!dir.calle.trim() || !dir.numero.trim() || !dir.barrio.trim() || !dir.ciudad.trim() || !dir.provincia.trim()) {
            toast.error('Completá calle, número, barrio, ciudad y provincia');
            return false;
        }

        if (!form.precios.venta.monto && !form.precios.alquiler.monto) {
            toast.error('Especifica al menos un precio de venta o alquiler');
            return false;
        }

        if (imagenes.length + imageFiles.length === 0) {
            toast.error('Subí al menos una imagen');
            return false;
        }

        if (form.propietario && !isValidObjectId(form.propietario)) {
            toast.error('El ID del propietario no es válido (debe ser un ObjectId de 24 caracteres)');
            return false;
        }
        if (userRole !== 'agente' && form.agente && !isValidObjectId(form.agente)) {
            toast.error('El ID del agente no es válido (debe ser un ObjectId de 24 caracteres)');
            return false;
        }

        return true;
    };

    // 💾 Submit con upload de imágenes
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);

        try {
            // 🔹 1. Subir imágenes nuevas a Cloudinary
            const uploadedImages: ImagenEntry[] = [];

            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const formData = new FormData();
                formData.append('image', file);
                formData.append('folder', 'properties');

                const res = await fetch('/api/uploadImage', {
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || 'Error al subir imagen');
                }

                const data = await res.json();
                uploadedImages.push({
                    url: data.url,
                    descripcion: '',
                    principal: i === 0 && imagenes.length === 0,
                    orden: imagenes.length + i,
                    tipo: 'foto'
                });
            }



            // 🔹 2. Subir video si existe
            let uploadedVideoUrl = '';

            if (videoFile) {
                const formData = new FormData();
                formData.append('file', videoFile);
                formData.append('upload_preset', 'propiedades_video');
                formData.append('folder', 'properties/videos');

                const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

                // ✅ URL DE SUBIDA LIMPIA (Sin transformaciones)
                // Esto evita que el servidor se cuelgue procesando el video mientras se sube.
                // La compresión real se aplicará automáticamente cuando el cliente lo vea en la web.
                const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`;
                
                toast.info('📹 Subiendo video a la nube...');

                const res = await fetch(uploadUrl, { 
                    method: 'POST',
                    body: formData,
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({ error: { message: 'Error desconocido' } }));
                    throw new Error(err.error?.message || 'Error al subir video');
                }

                const data = await res.json();
                uploadedVideoUrl = data.secure_url; // Se guarda la URL base
                toast.success('✅ Video subido correctamente');
            }
            // Combinar imágenes existentes + nuevas
            const allImages = [...imagenes, ...uploadedImages];
            if (!allImages.some(img => img.principal) && allImages[0]) {
                allImages[0].principal = true;
            }
            allImages.sort((a, b) => a.orden - b.orden);

            // 🔹 2. Generar slug SEO si no se proporcionó
            const seoSlug = form.titulo
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '')
                .slice(0, 100);

            // 🔹 3. Preparar payload
            const payload = {
                ...form,
                imagenes: allImages,
                videoUrl: uploadedVideoUrl || null,
                seo: { slug: seoSlug },
                codigoInterno: form.codigoInterno || null,
                zona: form.zona || null,
                notasInternas: form.notasInternas || null,
                agente: userRole === 'agente' ? session?.user?.id : form.agente,
            };

            // 🔹 4. Crear propiedad
            const res = await fetch('/api/gestion/propiedades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                localStorage.removeItem('propiedad_nueva_draft'); // ✅ AGREGAR ESTA LÍNEA
                toast.success('✅ Propiedad creada con éxito');
                router.push('/gestion/propiedades');

            } else {
                const err = await res.json();
                toast.error(err.error || 'Error al crear la propiedad');
            }

        } catch (err: any) {
            console.error('Error en handleSubmit:', err);
            toast.error(err.message || 'Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    // Eliminar imagen existente del servidor

    const removePreview = (index: number) => {
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    if (!isAuthorized) return null;

    return (
        <div className="relative min-h-screen bg-slate-950 p-4 sm:p-6 md:p-8 pb-[env(safe-area-inset-bottom)]">

            {/* ✨ Background ambiental */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 opacity-40" style={{ filter: 'blur(150px)' }} />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]" aria-hidden="true" />
            </div>

            <br />
            <br />
            <br />
            <br />
            <br />
            <br />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link href="/gestion/propiedades" className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                    <FaArrowLeft className="w-4 h-4" /> Volver
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Nueva Propiedad</h1>
            </div>

            <div className="bg-slate-900/80 rounded-xl p-6 border border-slate-700/50 backdrop-blur-sm">
                <form onSubmit={handleSubmit} className="space-y-8">


                    {/* 📸 Imágenes */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaImages className="text-violet-400" /> Imágenes * <span className="text-xs text-slate-500 font-normal">(máx. 22)</span>
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {/* Botón para agregar */}
                            <label className={`
            flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all
            ${imagenes.length + imageFiles.length >= 22
                                    ? 'border-slate-700 bg-slate-800/30 cursor-not-allowed opacity-50'
                                    : 'border-slate-600 hover:border-violet-500 hover:bg-slate-800/50'
                                }
        `}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={handleImagesChange}
                                    className="hidden"
                                    disabled={imagenes.length + imageFiles.length >= 22}
                                />
                                <FaPlus className="text-2xl text-slate-500" />
                                <span className="text-xs text-slate-400 mt-1 text-center px-2">
                                    {imagenes.length + imageFiles.length >= 22 ? 'Límite' : 'Agregar'}
                                </span>
                            </label>

                            {/* 🖼️ Imágenes ya subidas al servidor */}
                            {imagenes.map((img, index) => (
                                <div key={`uploaded-${index}`} className="relative group w-32 h-32 rounded-xl overflow-hidden border-2 border-slate-700">
                                    <img src={img.url} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPrincipalImage(index)}
                                            className={`p-1.5 rounded ${img.principal ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                                            title="Marcar como principal"
                                        >
                                            <FaStar className={`w-4 h-4 ${img.principal ? '' : 'opacity-50'}`} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="p-1.5 rounded bg-rose-500 text-white hover:bg-rose-600"
                                            title="Eliminar"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    {img.principal && (
                                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-white font-medium">
                                            Principal
                                        </span>
                                    )}
                                </div>
                            ))}

                            {/* 📷 Previews locales (aún no subidos) */}
                            {imagePreviews.map((url, index) => (
                                <div key={`preview-${index}`} className="relative group w-32 h-32 rounded-xl overflow-hidden border-2 border-violet-500/50">
                                    <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => removePreview(index)}
                                            className="p-1.5 rounded bg-rose-500 text-white hover:bg-rose-600"
                                            title="Quitar"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] bg-violet-500/80 text-white font-medium">
                                        Nueva
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">JPG, PNG o WebP • Máx. 5MB cada una</p>
                    </section>

                    {/* 📹 Video */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaVideo className="text-violet-400" /> Video <span className="text-xs text-slate-500 font-normal">(opcional)</span>
                        </h2>
                        <div className="space-y-4">
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
                                            // Dentro del onChange del input de video:
                                            if (file.size > 100 * 1024 * 1024) { // 🔹 Cambiado de 100MB a 50MB
                                                toast.error('El video no puede superar los 100MB. Se optimizará automáticamente al subirlo.');
                                                return;
                                            }

                                            setVideoFile(file);
                                            const url = URL.createObjectURL(file);
                                            setVideoPreview(url);
                                        }}
                                        className="hidden"
                                    />
                                    {videoFile ? (
                                        <div className="text-center">
                                            <FaVideo className="text-2xl text-emerald-400 mx-auto mb-1" />
                                            <span className="text-xs text-emerald-400">Video cargado</span>
                                        </div>
                                    ) : (
                                        <>
                                            <FaVideo className="text-2xl text-slate-500" />
                                            <span className="text-xs text-slate-400 mt-1 text-center px-2">
                                                Subir video
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
                                                if (videoInputRef.current) videoInputRef.current.value = '';
                                            }}
                                            className="absolute top-2 right-2 p-1.5 rounded bg-rose-500 text-white hover:bg-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Eliminar video"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                MP4, WebM o MOV • Máx. 50MB • <span className="text-violet-400">Se optimiza y comprime automáticamente al subirlo</span>
                            </p>
                        </div>
                    </section>

                    {/* 📋 Datos Básicos - AQUÍ ESTÁ EL TÍTULO QUE FALTABA ✅ */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaBuilding className="text-violet-400" /> Datos Básicos *
                        </h2>
                        <div className="space-y-5">
                            {/* ✅ TÍTULO - EL CAMPO QUE FALTABA */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Título de la propiedad *
                                </label>
                                <input
                                    type="text"
                                    value={form.titulo}
                                    onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                    placeholder="Ej: Departamento 3 ambientes con balcón en Palermo Soho"
                                    required
                                    minLength={10}
                                />
                                <p className="text-xs text-slate-500 mt-1">Mínimo 10 caracteres. Será el título principal en la publicación.</p>
                                {form.titulo && form.titulo.length < 10 && (
                                    <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" /> Faltan {10 - form.titulo.length} caracteres
                                    </p>
                                )}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Descripción *
                                </label>
                                <textarea
                                    value={form.descripcion}
                                    onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
                                    rows={4}
                                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all resize-y"
                                    placeholder="Describí la propiedad: ambientes, detalles destacados, amenities del edificio, zona, etc."
                                    required
                                    minLength={50}
                                />
                                <div className="flex justify-between mt-1.5 text-xs">
                                    <span className="text-slate-500">Mínimo 50 caracteres</span>
                                    <span className={`${(form.descripcion?.length || 0) >= 4000 ? 'text-rose-400' : 'text-slate-500'}`}>
                                        {(form.descripcion?.length || 0)}/4000
                                    </span>
                                </div>
                            </div>

                            {/* Tipo de Propiedad + Operación + Categoría */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Propiedad *</label>
                                    <select
                                        value={form.tipoPropiedad}
                                        onChange={(e) => setForm(prev => ({ ...prev, tipoPropiedad: e.target.value as any }))}
                                        className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
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
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Operación *</label>
                                    <select
                                        value={form.tipoOperacion}
                                        onChange={(e) => setForm(prev => ({ ...prev, tipoOperacion: e.target.value as any }))}
                                        className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="venta">Solo Venta</option>
                                        <option value="alquiler">Solo Alquiler</option>
                                        <option value="ambos">Venta y Alquiler</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
                                    <select
                                        value={form.categoria}
                                        onChange={(e) => setForm(prev => ({ ...prev, categoria: e.target.value as any }))}
                                        className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="residencial">Residencial</option>
                                        <option value="comercial">Comercial</option>
                                        <option value="industrial">Industrial</option>
                                        <option value="inversion">Inversión</option>
                                    </select>
                                </div>
                            </div>

                            {/* Código Interno + Zona */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Código Interno <span className="text-slate-500 font-normal">(opcional)</span></label>
                                    <input
                                        type="text"
                                        value={form.codigoInterno}
                                        onChange={(e) => setForm(prev => ({ ...prev, codigoInterno: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                        placeholder="Ej: PROP-2024-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Zona / Sub-barrio <span className="text-slate-500 font-normal">(opcional)</span></label>
                                    <input
                                        type="text"
                                        value={form.zona}
                                        onChange={(e) => setForm(prev => ({ ...prev, zona: e.target.value }))}
                                        className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                        placeholder="Palermo Soho, Microcentro, etc."
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 📍 Ubicación */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaMapMarkerAlt className="text-violet-400" /> Ubicación *
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Calle *</label>
                                <input type="text" value={form.direccion.calle} onChange={(e) => setForm(prev => ({ ...prev, direccion: { ...prev.direccion, calle: e.target.value } }))} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Número *</label>
                                <input type="text" value={form.direccion.numero} onChange={(e) => setForm(prev => ({ ...prev, direccion: { ...prev.direccion, numero: e.target.value } }))} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Piso</label>
                                <input type="text" value={form.direccion.piso} onChange={(e) => setForm(prev => ({ ...prev, direccion: { ...prev.direccion, piso: e.target.value } }))} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" placeholder="5, PH" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Depto</label>
                                <input type="text" value={form.direccion.depto} onChange={(e) => setForm(prev => ({ ...prev, direccion: { ...prev.direccion, depto: e.target.value } }))} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" placeholder="A, 12" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Código Postal</label>
                                <input type="text" value={form.direccion.codigoPostal} onChange={(e) => setForm(prev => ({ ...prev, direccion: { ...prev.direccion, codigoPostal: e.target.value } }))} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" />
                            </div>
                            {/* Barrio */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Barrio *</label>
                                {barrioMode === 'select' ? (
                                    <div className="flex gap-1">
                                        <select value={form.direccion.barrio} onChange={(e) => { if (e.target.value === '__OTRO__') { setBarrioMode('custom'); setForm(prev => ({ ...prev, direccion: { ...prev.direccion, barrio: '' } })); } else { setForm(prev => ({ ...prev, direccion: { ...prev.direccion, barrio: e.target.value } })); } }} className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" disabled={loadingOptions}>
                                            <option value="">Seleccionar...</option>
                                            {opciones?.barrios.map(b => <option key={b} value={b}>{b}</option>)}
                                            <option value="__OTRO__">➕ Agregar nuevo</option>
                                        </select>
                                        <button type="button" onClick={() => setBarrioMode('select')} className="px-3 bg-slate-700 rounded-xl">✕</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1">
                                        <input type="text" value={form.direccion.barrio} onChange={(e) => setForm(prev => ({ ...prev, direccion: { ...prev.direccion, barrio: e.target.value } }))} placeholder="Nuevo barrio" className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" required />
                                        <button type="button" onClick={() => setBarrioMode('select')} className="px-3 bg-slate-700 rounded-xl">✕</button>
                                    </div>
                                )}
                            </div>
                            {/* Ciudad */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Ciudad *</label>
                                {ciudadMode === 'select' ? (
                                    <div className="flex gap-1">
                                        <select value={form.direccion.ciudad} onChange={(e) => { if (e.target.value === '__OTRO__') { setCiudadMode('custom'); setForm(prev => ({ ...prev, direccion: { ...prev.direccion, ciudad: '' } })); } else { setForm(prev => ({ ...prev, direccion: { ...prev.direccion, ciudad: e.target.value } })); } }} className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" disabled={loadingOptions}>
                                            <option value="">Seleccionar...</option>
                                            {opciones?.ciudades.map(c => <option key={c} value={c}>{c}</option>)}
                                            <option value="__OTRO__">➕ Agregar nueva</option>
                                        </select>
                                        <button type="button" onClick={() => setCiudadMode('select')} className="px-3 bg-slate-700 rounded-xl">✕</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1">
                                        <input type="text" value={form.direccion.ciudad} onChange={(e) => setForm(prev => ({ ...prev, direccion: { ...prev.direccion, ciudad: e.target.value } }))} placeholder="Nueva ciudad" className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" required />
                                        <button type="button" onClick={() => setCiudadMode('select')} className="px-3 bg-slate-700 rounded-xl">✕</button>
                                    </div>
                                )}
                            </div>
                            {/* Provincia */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Provincia *</label>
                                <input type="text" value={form.direccion.provincia} onChange={(e) => setForm(prev => ({ ...prev, direccion: { ...prev.direccion, provincia: e.target.value } }))} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" required />
                            </div>
                        </div>
                        {/* Toggle privacidad */}
                        <label className="flex items-center gap-3 mt-4 cursor-pointer">
                            <input type="checkbox" checked={!form.direccion.mostrarDireccionExacta} onChange={(e) => setForm(prev => ({ ...prev, direccion: { ...prev.direccion, mostrarDireccionExacta: !e.target.checked } }))} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-600" />
                            <span className="text-sm text-slate-300">Ocultar dirección exacta en publicación pública</span>
                        </label>
                    </section>

                    {/* 🏠 Características */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaHome className="text-violet-400" /> Características
                        </h2>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[{ k: 'ambientes', l: 'Ambientes' }, { k: 'dormitorios', l: 'Dormitorios' }, { k: 'banios', l: 'Baños' }, { k: 'metrosCubiertos', l: 'M² Cubiertos', s: 'm²' }].map(f => (
                                <div key={f.k}><label className="block text-xs text-slate-400 mb-1">{f.l}</label><div className="relative"><input type="number" min="0" value={(form.caracteristicas as any)[f.k] || ''} onChange={(e) => setForm(prev => ({ ...prev, caracteristicas: { ...prev.caracteristicas, [f.k]: e.target.value ? Number(e.target.value) : undefined } }))} className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg text-white" placeholder="—" />{f.s && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{f.s}</span>}</div></div>
                            ))}
                        </div>
                        {/* Checkboxes */}
                        <div className="flex flex-wrap gap-3 mt-4">
                            {[{ k: 'cochera', l: '🚘 Cochera' }, { k: 'balcon', l: '🪟 Balcón' }, { k: 'pileta', l: '🏊 Pileta' }, { k: 'ascensor', l: '🛗 Ascensor' }, { k: 'seguridad', l: '🔒 Seguridad' }].map(ex => (
                                <label key={ex.k} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={(form.caracteristicas as any)[ex.k] || false} onChange={(e) => setForm(prev => ({ ...prev, caracteristicas: { ...prev.caracteristicas, [ex.k]: e.target.checked } }))} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-600" /><span className="text-sm text-slate-300">{ex.l}</span></label>
                            ))}
                        </div>
                    </section>

                    {/* 💰 Precios */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaMoneyBillWave className="text-emerald-400" /> Precios *
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {form.tipoOperacion !== 'alquiler' && (
                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                    <p className="text-sm font-medium text-emerald-400 mb-3">Venta</p>
                                    <div className="flex gap-2 mb-3">
                                        <select value={form.precios.venta.moneda} onChange={(e) => setForm(prev => ({ ...prev, precios: { ...prev.precios, venta: { ...prev.precios.venta, moneda: e.target.value as 'USD' | 'ARS' } } }))} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white">
                                            <option value="USD">USD</option><option value="ARS">ARS</option>
                                        </select>
                                        <input type="text" inputMode="decimal" value={displayPrecios.venta} onChange={(e) => handlePriceChange('venta', e.target.value)} onBlur={() => handlePriceBlur('venta')} placeholder="0,00" className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white" />
                                    </div>
                                    <div className="text-sm">
                                        <label className="block text-slate-400 mb-1">Comisión (%)</label>
                                        <input type="number" min="0" max="100" step="0.1" value={form.precios.venta.comision} onChange={(e) => setForm(prev => ({ ...prev, precios: { ...prev.precios, venta: { ...prev.precios.venta, comision: Number(e.target.value) } } }))} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white" />
                                    </div>
                                </div>
                            )}
                            {form.tipoOperacion !== 'venta' && (
                                <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                    <p className="text-sm font-medium text-blue-400 mb-3">Alquiler</p>
                                    <div className="flex gap-2 mb-3">
                                        <select value={form.precios.alquiler.moneda} onChange={(e) => setForm(prev => ({ ...prev, precios: { ...prev.precios, alquiler: { ...prev.precios.alquiler, moneda: e.target.value as 'USD' | 'ARS' } } }))} className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white">
                                            <option value="USD">USD</option><option value="ARS">ARS</option>
                                        </select>
                                        <input type="text" inputMode="decimal" value={displayPrecios.alquiler} onChange={(e) => handlePriceChange('alquiler', e.target.value)} onBlur={() => handlePriceBlur('alquiler')} placeholder="0,00" className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white" />
                                    </div>
                                    <div className="text-sm">
                                        <label className="block text-slate-400 mb-1">Comisión (%)</label>
                                        <input type="number" min="0" max="100" step="0.1" value={form.precios.alquiler.comision} onChange={(e) => setForm(prev => ({ ...prev, precios: { ...prev.precios, alquiler: { ...prev.precios.alquiler, comision: Number(e.target.value) } } }))} className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white" />
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Expensas + Impuestos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
                            <div><label className="block text-sm text-slate-400 mb-1">Expensas</label><input type="text" inputMode="decimal" value={displayPrecios.expensas} onChange={(e) => handlePriceChange('expensas', e.target.value)} onBlur={() => handlePriceBlur('expensas')} placeholder="0,00" className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" /></div>
                            <div><label className="block text-sm text-slate-400 mb-1">Impuestos</label><input type="text" inputMode="decimal" value={displayPrecios.impuestos} onChange={(e) => handlePriceChange('impuestos', e.target.value)} onBlur={() => handlePriceBlur('impuestos')} placeholder="0,00" className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white" /></div>
                        </div>
                    </section>

                    {/* 👥 Equipo: Propietario + Agente */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <FaUser className="text-violet-400" /> Equipo *
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* Propietario */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Propietario *</label>
                                {propietarioMode === 'select' ? (
                                    <div className="flex gap-1">
                                        <select
                                            value={form.propietario}
                                            onChange={(e) => {
                                                if (e.target.value === '__OTRO__') {
                                                    // 🔹 Abrir modal en vez de modo custom
                                                    setIsClienteModalOpen(true);
                                                    // No cambiamos propietarioMode, mantenemos 'select'
                                                } else {
                                                    setForm(prev => ({ ...prev, propietario: e.target.value }));
                                                }
                                            }}
                                            className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white"
                                            disabled={loadingOptions}
                                        >
                                            <option value="">Seleccionar propietario...</option>
                                            {(opciones?.propietarios?.length || 0) > 0 ? (
                                                opciones?.propietarios.map(p => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.razonSocial || `${p.nombre} ${p.apellido}`}
                                                    </option>
                                                ))
                                            ) : (
                                                <option value="" disabled>{loadingOptions ? 'Cargando...' : 'Sin propietarios'}</option>
                                            )}
                                            <option value="__OTRO__">➕ Agregar nuevo</option>
                                        </select>
                                        <button type="button" onClick={() => setPropietarioMode('select')} className="px-3 bg-slate-700 rounded-xl">✕</button>
                                    </div>
                                ) : (
                                    <div className="flex gap-1">
                                        <input
                                            type="text"
                                            value={form.propietario}
                                            onChange={(e) => setForm(prev => ({ ...prev, propietario: e.target.value }))}
                                            placeholder="ID del propietario o nombre"
                                            className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white"
                                            required
                                        />
                                        <button type="button" onClick={() => setPropietarioMode('select')} className="px-3 bg-slate-700 rounded-xl">✕</button>
                                    </div>
                                )}
                                <p className="text-xs text-slate-500 mt-1">Buscá por ID o seleccioná de la lista</p>
                            </div>


                            {/* Agente - SOLO si NO es agente logueado */}
                            {userRole !== 'agente' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">
                                        Agente Responsable *
                                    </label>

                                    {/* Estado para modo custom del agente */}
                                    {agenteMode === 'select' ? (
                                        /* 👇 MODO SELECT: lista de agentes desde API */
                                        <div className="flex gap-1">
                                            <select
                                                value={form.agente}
                                                onChange={(e) => {
                                                    if (e.target.value === '__OTRO__') {
                                                        // Cambiar a modo custom para ingresar ID manual
                                                        setAgenteMode('custom');
                                                        setForm(prev => ({ ...prev, agente: '' }));
                                                    } else {
                                                        setForm(prev => ({ ...prev, agente: e.target.value }));
                                                    }
                                                }}
                                                className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white"
                                                disabled={loadingOptions}
                                            >
                                                <option value="">Seleccionar agente...</option>
                                                {(opciones?.agentes?.length || 0) > 0 ? (
                                                    opciones?.agentes?.map(a => (
                                                        <option key={a._id} value={a._id}>
                                                            {a.name} ({a.email})
                                                        </option>
                                                    ))
                                                ) : (
                                                    <option value="" disabled>{loadingOptions ? 'Cargando...' : 'Sin agentes en sistema'}</option>
                                                )}

                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setAgenteMode('select')}
                                                className="px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition"
                                                title="Volver a lista"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ) : (
                                        /* 👇 MODO CUSTOM: input para ingresar ID manual */
                                        <div className="flex gap-1">
                                            <input
                                                type="text"
                                                value={form.agente}
                                                onChange={(e) => setForm(prev => ({ ...prev, agente: e.target.value }))}
                                                placeholder="ID del agente (ej: 64f1a2b3...)"
                                                className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setAgenteMode('select')}
                                                className="px-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white transition"
                                                title="Volver a lista"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-xs text-slate-500 mt-1">
                                        {agenteMode === 'select'
                                            ? 'Seleccioná de la lista o ingresá el ID manualmente'
                                            : 'Ingresá el ID del agente o volvé a la lista'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>









                    {/* ⚙️ Configuración */}
                    <section>
                        <h2 className="text-lg font-semibold text-white mb-4">Configuración</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm text-slate-400 mb-2">Estado</label>
                                <select value={form.estado} onChange={(e) => setForm(prev => ({ ...prev, estado: e.target.value as any }))} className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white">
                                    <option value="borrador">Borrador</option>
                                    <option value="publicado">Publicado</option>
                                    <option value="reservado">Reservado</option>
                                    <option value="alquilado">Alquilado</option>
                                    <option value="vendido">Vendido</option>
                                    <option value="baja">Baja</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.destacado} onChange={(e) => setForm(prev => ({ ...prev, destacado: e.target.checked }))} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500" />
                                    <span className="text-sm text-slate-300 flex items-center gap-1"><FaStar className="w-3 h-3" /> Destacada</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={form.urgente} onChange={(e) => setForm(prev => ({ ...prev, urgente: e.target.checked }))} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-rose-500" />
                                    <span className="text-sm text-slate-300 flex items-center gap-1"><FaExclamationTriangle className="w-3 h-3" /> Urgente</span>
                                </label>
                            </div>
                        </div>
                    </section>

                    {/* 🎯 Botones */}
                    <div className="flex gap-3 pt-4 border-t border-slate-700/50">
                        <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium py-3 rounded-xl transition disabled:opacity-70 shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2">
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creando...</> : 'Crear Propiedad'}
                        </button>
                        <Link href="/gestion/propiedades"
                            onClick={() => localStorage.removeItem('propiedad_nueva_draft')} // ✅ AGREGAR ESTA LÍNEA
                            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-xl text-center transition">Cancelar</Link>
                    </div>
                </form>
            </div>

            {/* 🎭 Modal: Agregar Nuevo Cliente/Propietario */}
            <NuevoClienteModal
                isOpen={isClienteModalOpen}
                onClose={() => setIsClienteModalOpen(false)}
                onSuccess={(clienteId, clienteData) => {
                    // ✅ 1. Actualizar el form principal con el nuevo ID
                    setForm(prev => ({ ...prev, propietario: clienteId }));

                    // ✅ 2. Opcional: recargar la lista de propietarios si tenés la función
                    if (typeof fetchOpciones === 'function') {
                        fetchOpciones();
                    }

                    // ✅ 3. Feedback visual (el toast ya lo muestra el modal, pero podés agregar más)
                    console.log('Cliente creado:', clienteData);
                }}
            />
        </div>
    );
}