// cartas/tipos/cartaVacacionesEmpleado.js

const cartaVacacionesEmpleado = {
    tipo: 'cartaVacacionesEmpleado',
    nombre: "Carta de Vacaciones para Empleados",
    icono: '<i class="fas fa-suitcase-rolling fa-2x"></i>',
    campos: [
        { label: "Nombre Completo", id: "nombreCompleto", tipo: "text", required: true },
        { label: "DPI", id: "dpi", tipo: "text", required: true },
        { label: "Fecha de Ingreso", id: "fechaIngreso", tipo: "date", required: true },
        { label: "Año del Período de Vacaciones", id: "periodoVacaciones", tipo: "select", opciones: generarOpcionesPeriodo(), required: true },
        { label: "Fecha de Emisión", id: "fechaEmision", tipo: "date", required: true }
    ],
    plantilla: (datos) => {
        // Parsear fechas
        const fechaIngreso = window.parsearFechaLocal(datos.fechaIngreso);
        const periodoYear = parseInt(datos.periodoVacaciones);
        const fechaEmision = window.parsearFechaLocal(datos.fechaEmision);

        // Validación básica
        if (isNaN(fechaIngreso) || isNaN(fechaEmision) || isNaN(periodoYear)) {
            alert('Fechas inválidas. Por favor, verifica las fechas ingresadas.');
            return null;
        }

        // Obtener el año de la fecha de ingreso
        const yearIngreso = fechaIngreso.getFullYear();

        // Calcular la diferencia de años entre el periodo seleccionado y el año de ingreso
        const diferenciaAnios = periodoYear - yearIngreso;

        if (diferenciaAnios < 1) {
            alert('El año del período de vacaciones debe ser al menos un año después del año de ingreso.');
            return null;
        }

        // Calcular Fecha de Inicio de Vacaciones: Fecha de Ingreso + (diferenciaAnios -1) años
        const fechaInicioVacaciones = window.agregarAnios(fechaIngreso, diferenciaAnios - 1);

        // Calcular Fecha de Fin de Vacaciones: Fecha de Inicio + 364 días
        const fechaFinVacaciones = window.agregarDias(fechaInicioVacaciones, 364);

        // Formatear fechas
        const fechaEmisionFormateada = window.formatearFechaLarga(fechaEmision);
        const fechaInicioVacacionesFormateada = window.formatDate(fechaInicioVacaciones);
        const fechaFinVacacionesFormateada = window.formatDate(fechaFinVacaciones);

        return {
            encabezado: "", // No se utiliza encabezado en esta carta
            titulo: "", // No se utiliza título en esta carta
            contenido: `
${fechaEmisionFormateada}

Por medio de la presente, yo, ${datos.nombreCompleto.toUpperCase()}, dejo constancia de que he sido informado y he aceptado tomar las vacaciones que me corresponden del período del ${fechaInicioVacacionesFormateada} al ${fechaFinVacacionesFormateada}, el cual ha sido debidamente aprobado por la empresa.

Asimismo, me comprometo a coordinar con el equipo para asegurar que mi ausencia no afecte el normal desarrollo de nuestras actividades. Además, me responsabilizo de dejar todas mis tareas y responsabilidades en orden antes de mi salida.

Atentamente,

Firmado,

${datos.nombreCompleto.toUpperCase()}
DPI: ${datos.dpi}
            `,
            firmaColaborador: "",
            firmaEncargado: "",
            datosAdicionales: {
                nombreCompleto: datos.nombreCompleto,
                dpi: datos.dpi
            }
        };
    }
};

// Función para generar opciones de años para el período de vacaciones
function generarOpcionesPeriodo() {
    const opciones = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i <= currentYear + 5; i++) {
        opciones.push({ valor: i.toString(), texto: i.toString() });
    }
    return opciones;
}

// Agregar al objeto global tiposDeCarta
window.tiposDeCarta[cartaVacacionesEmpleado.tipo] = cartaVacacionesEmpleado;
