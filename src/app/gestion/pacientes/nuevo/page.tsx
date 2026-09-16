// app/gestion/pacientes/nuevo/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'react-toastify';
import {
    FaArrowLeft, FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt,
    FaHospital, FaIdCard, FaCalendarAlt, FaUpload, FaSpinner, FaCheck
} from 'react-icons/fa';

export default function NuevoPacientePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [loading, setLoading] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [previewImg, setPreviewImg] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // 🔹 En el estado inicial del formData, agregar el campo faltante:
    const [formData, setFormData] = useState({
        name: '',
        lastName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        zipCode: '',
        obraSocial: '',              // nombre
        obraSocialCodigo: '',        // ✅ correcto
        obraSocialPlan: '',          // ✅ correcto
        obraSocialNumeroAfiliado: '', // ✅ AGREGAR ESTE CAMPO (faltaba)
        diagnosticoPrincipal: '',
        fechaNacimiento: '',
    });

    // 🔹 Validar acceso
    useEffect(() => {
        const validate = async () => {
            if (status === 'loading') return;
            if (status === 'unauthenticated') {
                router.push('/login?callbackUrl=/gestion/pacientes/nuevo');
                return;
            }

            const token = session?.user?.token;
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const allowedRoles = ['admin', 'profesionales', 'administrativos'];

                if (!allowedRoles.includes(payload.role)) {
                    toast.warning('🔐 No tenés permisos para crear pacientes');
                    router.push(payload.role === 'pacientes' ? '/turnos' : '/gestion');
                    return;
                }
                setIsAuthorized(true);
            } catch {
                router.push('/login');
            }
        };
        validate();
    }, [status, session, router]);

    // 🔹 Handlers de formulario
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tipo y tamaño
            if (!file.type.startsWith('image/')) {
                toast.error('📷 Solo se permiten archivos de imagen');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                toast.error('📷 La imagen no puede superar los 5MB');
                return;
            }

            setSelectedFile(file);

            // Preview
            const reader = new FileReader();
            reader.onloadend = () => setPreviewImg(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones básicas
        if (!formData.name || !formData.lastName || !formData.email) {
            toast.error('❌ Nombre, apellido y email son obligatorios');
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
            toast.error('❌ Email inválido');
            return;
        }

        setLoading(true);

        try {
            const token = session?.user?.token;

            // Preparar datos para enviar
            const payload = {
                ...formData,
                img: previewImg || undefined, // Enviar preview (la API podría subir a Cloudinary)
            };

            const res = await fetch('/api/pacientes', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('✅ Paciente creado exitosamente');
                router.push(`/gestion/pacientes`);
            } else {
                toast.error(data.error || '❌ Error al crear paciente');
            }

        } catch (err) {
            console.error('Error:', err);
            toast.error('⚠️ Error de conexión. Intentá nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Loader / No autorizado
    if (status === 'loading' || loading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400 flex items-center gap-3">
                    <FaSpinner className="animate-spin" />
                    {loading ? 'Creando paciente...' : 'Verificando permisos...'}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">

            {/* Header */}
            <div className="max-w-4xl mx-auto mt-32 mb-8">
                <button
                    onClick={() => router.push('/gestion/pacientes')}
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
                >
                    <FaArrowLeft /> Volver al listado
                </button>
                <h1 className="text-2xl md:text-3xl font-bold">Nuevo Paciente</h1>
                <p className="text-slate-400 text-sm mt-1">
                    Completá los datos para registrar un nuevo paciente en el sistema
                </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">

                {/* 🔹 Sección: Datos Personales */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaUser className="text-sky-400" /> Datos Personales
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Nombre *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="Ej: Juan"
                                required
                            />
                        </div>

                        {/* Apellido */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Apellido *</label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="Ej: Pérez"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div className="md:col-span-2">
                            <label className="block text-sm text-slate-400 mb-1">Email *</label>
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                    placeholder="paciente@email.com"
                                    required
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                El paciente usará este email para iniciar sesión con Google
                            </p>
                        </div>

                        {/* Teléfono */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Teléfono</label>
                            <div className="relative">
                                <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                    placeholder="+54 9 11 1234-5678"
                                />
                            </div>
                        </div>

                        {/* Fecha de Nacimiento */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Fecha de Nacimiento</label>
                            <div className="relative">
                                <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="date"
                                    name="fechaNacimiento"
                                    value={formData.fechaNacimiento}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🔹 Sección: Dirección */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaMapMarkerAlt className="text-sky-400" /> Dirección
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Ciudad */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Ciudad</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="Ej: Buenos Aires"
                            />
                        </div>

                        {/* Código Postal */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Código Postal</label>
                            <input
                                type="text"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="Ej: C1000"
                            />
                        </div>

                        {/* Dirección completa */}
                        <div className="md:col-span-2">
                            <label className="block text-sm text-slate-400 mb-1">Dirección</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="Calle y número, piso, depto..."
                            />
                        </div>
                    </div>
                </div>

                {/* 🔹 Sección: Obra Social */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaHospital className="text-sky-400" /> Obra Social
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Nombre OS */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Obra Social</label>
                            <input
                                type="text"
                                name="obraSocial"
                                value={formData.obraSocial}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="Ej: OSDE, Swiss Medical..."
                            />
                        </div>

                        {/* Código OS */}
                        <div>
                            <label className="block text-sm text-slate-400 mb-1">Código de Afiliado</label>
                            <input
                                type="text"
                                name="obraSocialCodigo"
                                value={formData.obraSocialCodigo}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="Ej: 123456789"
                            />
                        </div>

                        {/* Plan */}
                         <div>
                            <label className="block text-sm text-slate-400 mb-1">Plan / Cobertura</label>
                            <input
                                type="text"
                                name="obraSocialPlan"
                                value={formData.obraSocialPlan}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="Ej: Plan 300, Platinum..."
                            />
                        </div>
                    
                          <div>
                            <label className="block text-sm text-slate-400 mb-1">N° de Afiliado</label>
                            <input
                                type="text"
                                name="obraSocialNumeroAfiliado"
                                value={formData.obraSocialNumeroAfiliado}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors"
                                placeholder="Ej: AF-123456"
                            />
                        </div>
                    </div>
                </div>

                {/* 🔹 Sección: Foto de Perfil (Cloudinary) */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaUpload className="text-sky-400" /> Foto de Perfil
                    </h2>

                    <div className="flex items-center gap-6">
                        {/* Preview */}
                        <div className="relative w-24 h-24 rounded-full bg-slate-800 overflow-hidden border-2 border-slate-700">
                            {previewImg ? (
                                <Image src={previewImg} alt="Preview" fill className="object-cover" />
                            ) : (
                                <FaUser className="w-full h-full p-6 text-slate-600" />
                            )}
                        </div>

                        {/* Upload button */}
                        <div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm transition-colors flex items-center gap-2"
                            >
                                <FaUpload /> {previewImg ? 'Cambiar foto' : 'Seleccionar imagen'}
                            </button>
                            <p className="text-xs text-slate-500 mt-2">
                                JPG, PNG • Máx. 5MB
                            </p>
                        </div>
                    </div>
                </div>

                {/* 🔹 Sección: Notas Clínicas */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <FaIdCard className="text-sky-400" /> Notas Clínicas
                    </h2>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">Diagnóstico / Observaciones</label>
                        <textarea
                            name="diagnosticoPrincipal"
                            value={formData.diagnosticoPrincipal}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-sky-500 transition-colors resize-none"
                            placeholder="Diagnóstico inicial, observaciones relevantes, etc."
                        />
                    </div>
                </div>

                {/* 🔹 Botones de Acción */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
                    <button
                        type="button"
                        onClick={() => router.push('/gestion/pacientes')}
                        className="px-6 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-sky-800 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <FaSpinner className="animate-spin" /> Guardando...
                            </>
                        ) : (
                            <>
                                <FaCheck /> Crear Paciente
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}