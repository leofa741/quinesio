export interface PlantillaClinica {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  diagnostico: string;
  tecnicas: string;
  ejercicios: string;
  indicaciones: string;
  contraindicaciones: string;
  sesionesEstimadas: number;
}

export const plantillasClinicas: PlantillaClinica[] = [
  {
    id: 'lumbalgia',
    nombre: 'Lumbalgia Mecánica',
    icono: 'fa-person',
    color: 'sky',
    diagnostico: 'Lumbalgia mecánica con contractura paravertebral',
    tecnicas: 'Electroterapia TENS 20min, ultrasonido en zona lumbar, movilización vertebral grado II, técnicas miofasciales en paravertebrales y cuadrado lumbar.',
    ejercicios: 'Ejercicios de estabilización lumbar (McKenzie), puente de glúteos 3x15, plancha abdominal modificada 3x30seg, estiramientos de isquiotibiales y psoas.',
    indicaciones: 'Aplicar calor local 10 min antes de los ejercicios. Evitar estar sentado más de 45 min seguidos.',
    contraindicaciones: 'Evitar levantamiento de peso, flexiones profundas de tronco y movimientos bruscos.',
    sesionesEstimadas: 10
  },
  {
    id: 'esguince-tobillo',
    nombre: 'Esguince de Tobillo',
    icono: 'fa-shoe-prints',
    color: 'emerald',
    diagnostico: 'Esguince de tobillo grado I-II (ligamento peroneo-astragalino anterior)',
    tecnicas: 'Drenaje linfático manual, crioterapia 15min, ultrasonido, movilización articular grado I-II, vendaje funcional.',
    ejercicios: 'Ejercicios propioceptivos en tabla inestable, alfabeto con el pie, fortalecimiento con banda elástica (inversión/eversión), gemelos en escalón.',
    indicaciones: 'Reposo relativo las primeras 48h, usar calzado estable, aplicar hielo 15min después de ejercicios.',
    contraindicaciones: 'Evitar correr, saltos, superficies irregulares hasta completar la rehabilitación.',
    sesionesEstimadas: 12
  },
  {
    id: 'hombro-rotador',
    nombre: 'Lesión Manguito Rotador',
    icono: 'fa-hand',
    color: 'amber',
    diagnostico: 'Tendinopatía del manguito rotador (supraespinoso)',
    tecnicas: 'Electroterapia analgésica, ultrasonido en tendón supraespinoso, masoterapia descontracturante de trapecios, movilizaciones pasivas.',
    ejercicios: 'Pendulares de Codman, rotaciones externas con banda elástica 3x12, ejercicios isométricos, fortalecimiento escapular (Y-T-W).',
    indicaciones: 'Evitar movimientos por encima de la cabeza durante las primeras 2 semanas. Dormir sobre el lado sano.',
    contraindicaciones: 'No levantar objetos pesados, evitar movimientos repetitivos por encima de 90°.',
    sesionesEstimadas: 15
  },
  {
    id: 'lca-rodilla',
    nombre: 'Rehab Post-Quirúrgica LCA',
    icono: 'fa-bone',
    color: 'rose',
    diagnostico: 'Rehabilitación post-quirúrgica de reconstrucción de LCA',
    tecnicas: 'Crioterapia, electroestimulación de cuádriceps, movilización pasiva de rodilla, drenaje linfático, masoterapia de cicatriz.',
    ejercicios: 'Isométricos de cuádriceps, elevación de pierna recta, mini-sentadillas 0-45°, bicicleta estática sin resistencia, propiocepción.',
    indicaciones: 'Crioterapia 20min después de ejercicios. Uso de bastones según indicación médica.',
    contraindicaciones: 'NO pivotar, NO correr, NO sentadillas profundas hasta indicación médica. Evitar hiperextensión.',
    sesionesEstimadas: 30
  },
  {
    id: 'cervicalgia',
    nombre: 'Cervicalgia',
    icono: 'fa-head-side-virus',
    color: 'violet',
    diagnostico: 'Cervicalgia con contractura muscular y limitación funcional',
    tecnicas: 'Electroterapia TENS cervical, masoterapia descontracturante, tracción cervical manual, movilización articular, punción seca (si aplica).',
    ejercicios: 'Retracción cervical (doble mentón), estiramientos de trapecio superior y elevador de escápula, fortalecimiento de flexores profundos.',
    indicaciones: 'Ajustar altura del monitor a la altura de los ojos. Pausas activas cada hora si trabaja en computadora.',
    contraindicaciones: 'Evitar movimientos bruscos de cabeza, dormir boca abajo, cargar peso en un solo lado.',
    sesionesEstimadas: 8
  },
  {
    id: 'contractura-general',
    nombre: 'Contractura Muscular',
    icono: 'fa-person-walking',
    color: 'teal',
    diagnostico: 'Contractura muscular generalizada',
    tecnicas: 'Masoterapia descontracturante, calor local 15min, stretching pasivo, liberación miofascial, electroterapia.',
    ejercicios: 'Estiramientos generales de cadena posterior, movilidad articular completa, ejercicios de relajación muscular.',
    indicaciones: 'Baños de agua caliente, actividad física aeróbica suave (caminata, natación).',
    contraindicaciones: 'Evitar sobreesfuerzos, estrés prolongado y posturas estáticas.',
    sesionesEstimadas: 6
  }
];

// Función helper para aplicar plantilla a un formulario
export const aplicarPlantilla = (
  plantilla: PlantillaClinica,
  setFormData: (data: any) => void
) => {
  setFormData((prev: any) => ({
    ...prev,
    diagnostico: plantilla.diagnostico,
    tecnicasAplicadas: plantilla.tecnicas,
    proximosPasos: plantilla.ejercicios,
    indicaciones: plantilla.indicaciones,
    contraindicaciones: plantilla.contraindicaciones,
    sesionesEstimadas: plantilla.sesionesEstimadas
  }));
};