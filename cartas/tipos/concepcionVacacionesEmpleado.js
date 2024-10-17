// cartas/tipos/cartaVacacionesEmpleado.js

const cartaVacacionesEmpleado = {
    tipo: 'cartaVacacionesEmpleado',
    nombre: "Carta de Vacaciones para Empleados",
    icono: '<i class="fas fa-suitcase-rolling fa-2x"></i>', // Puedes cambiar el ícono según prefieras
    campos: [
        { label: "Nombre Completo", id: "nombreCompleto", tipo: "text", required: true },
        { label: "DPI", id: "dpi", tipo: "text", required: true },
        { label: "Fecha de Ingreso", id: "fechaIngreso", tipo: "date", required: true },
        { label: "Año del Período de Vacaciones", id: "periodoVacaciones", tipo: "select", opciones: [
            { valor: "", texto: "--Selecciona el año--" },
            // Las opciones dinámicas se agregarán en script.js
        ], required: true },
        { label: "Fecha de Emisión", id: "fechaEmision", tipo: "date", required: true }
    ],
    plantilla: (datos) => {
        // Validar que todas las entradas necesarias están presentes
        if (!datos.nombreCompleto || !datos.dpi || !datos.fechaIngreso || !datos.periodoVacaciones || !datos.fechaEmision) {
            alert('Por favor, complete todos los campos correctamente.');
            return null;
        }

        // Parsear fechas utilizando las funciones auxiliares
        const fechaIngreso = window.parsearFechaLocal(datos.fechaIngreso);
        const periodoYear = parseInt(datos.periodoVacaciones);
        const fechaEmision = window.parsearFechaLocal(datos.fechaEmision);

        // Validación básica de fechas
        if (isNaN(fechaIngreso) || isNaN(fechaEmision)) {
            alert('Fechas inválidas. Por favor, verifica las fechas ingresadas.');
            return null;
        }

        // Obtener el año de la fecha de ingreso
        const yearIngreso = fechaIngreso.getFullYear();

        // Calcular la diferencia de años entre el período seleccionado y el año de ingreso
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
        const fechaInicioVacacionesFormateada = window.formatearFechaCorta(fechaInicioVacaciones);
        const fechaFinVacacionesFormateada = window.formatearFechaCorta(fechaFinVacaciones);

        // Devolver los datos necesarios para generar el PDF
        return {
            encabezado: "", // No se utiliza encabezado en la plantilla proporcionada
            titulo: "", // No se utiliza título en la plantilla proporcionada
            contenido: `
${fechaEmisionFormateada}

Por medio de la presente, yo, ${datos.nombreCompleto}, dejo constancia de que he sido informado y he aceptado tomar las vacaciones que me corresponden del período del ${fechaInicioVacacionesFormateada} al ${fechaFinVacacionesFormateada}, el cual ha sido debidamente aprobado por la empresa.

Asimismo, me comprometo a coordinar con el equipo para asegurar que mi ausencia no afecte el normal desarrollo de nuestras actividades. Además, me responsabilizo de dejar todas mis tareas y responsabilidades en orden antes de mi salida.

Atentamente,
                `,
            firmaColaborador: `${datos.nombreCompleto}\nDPI: ${datos.dpi}`,
            firmaEncargado: "______________________________\nFirma del Encargado",
            datosAdicionales: {
                nombreCompleto: datos.nombreCompleto,
                dpi: datos.dpi
            }
        };
    }
};

// Agregar al objeto global tiposDeCarta
window.tiposDeCarta = window.tiposDeCarta || {};
window.tiposDeCarta[cartaVacacionesEmpleado.tipo] = cartaVacacionesEmpleado;
