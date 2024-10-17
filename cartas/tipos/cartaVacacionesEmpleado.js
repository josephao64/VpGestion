// cartas/tipos/cartaVacacionesEmpleado.js

const cartaVacacionesEmpleado = {
    tipo: 'cartaVacacionesEmpleado',
    nombre: "Carta de Vacaciones para Empleados",
    icono: '<i class="fas fa-suitcase-rolling fa-2x"></i>', // Puedes cambiar el ícono según prefieras
    campos: [
        { label: "Nombre Completo", id: "nombreCompleto", tipo: "text", required: true },
        { label: "DPI", id: "dpi", tipo: "text", required: true },
        { label: "Fecha de Ingreso", id: "fechaIngreso", tipo: "date", required: true },
        { label: "Año del Período de Vacaciones", id: "periodoVacaciones", tipo: "select", opciones: [], required: true }, // Opciones dinámicas
        { label: "Fecha de Emisión", id: "fechaEmision", tipo: "date", required: true }
    ],
    plantilla: (datos) => {
        // Parsear fechas
        const fechaIngreso = window.parsearFechaLocal(datos.fechaIngreso);
        const periodoYear = parseInt(datos.periodoVacaciones);
        const fechaEmision = window.parsearFechaLocal(datos.fechaEmision);

        // Validación básica
        if (isNaN(fechaIngreso) || isNaN(fechaEmision)) {
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

        return {
            encabezado: "", // No se utiliza encabezado en la plantilla proporcionada
            titulo: "", // No se utiliza título en la plantilla proporcionada
            fechaEmision: window.formatearFechaLarga(fechaEmision),
            nombre: datos.nombreCompleto,
            fecha_inicio_vacaciones: window.formatDate(fechaInicioVacaciones),
            fecha_fin_vacaciones: window.formatDate(fechaFinVacaciones),
            nombre_footer: datos.nombreCompleto,
            dpi_footer: datos.dpi
        };
    }
};

// Agregar al objeto global tiposDeCarta
window.tiposDeCarta = window.tiposDeCarta || {};
window.tiposDeCarta[cartaVacacionesEmpleado.tipo] = cartaVacacionesEmpleado;
