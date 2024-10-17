// cartas/tipos/concesionVacaciones.js

const concesionVacaciones = {
    tipo: 'concesionVacaciones',
    nombre: "Concesión de Vacaciones",
    icono: '<i class="fas fa-plane-departure fa-2x"></i>',
    campos: [
        { label: "Nombre del Colaborador", id: "nombreColaborador", tipo: "text", required: true },
        { label: "DPI del Colaborador", id: "dpiColaborador", tipo: "text", required: true },
        { label: "Puesto", id: "puesto", tipo: "text", required: true },
        { label: "Empresa", id: "empresa", tipo: "select", opciones: [
            { valor: "", texto: "--Selecciona la empresa--" },
            { valor: "American Pizza", texto: "American Pizza" },
            { valor: "Brenda Elizabeth Hernández", texto: "Brenda Elizabeth Hernández" },
            { valor: "Corporación de Alimentos S.A.", texto: "Corporación de Alimentos S.A." }
        ], required: true },
        { label: "Inicio de Vacaciones", id: "inicioVacaciones", tipo: "date", required: true }
    ],
    plantilla: (datos) => {
        const startDate = window.addCalendarDays(new Date(datos.inicioVacaciones + 'T12:00:00'), 0);
        const endDate = window.addCalendarDays(startDate, 14);
        const workStartDate = window.addCalendarDays(endDate, 1);

        // Devolver los datos necesarios para generar el PDF
        return {
            encabezado: datos.empresa,
            titulo: "Concesión de Vacaciones",
            contenido: `
1. DATOS DEL EMPLEADO

Nombre del colaborador: ${datos.nombreColaborador}
DPI del colaborador: ${datos.dpiColaborador}
Puesto: ${datos.puesto}

2. FECHAS DE LAS VACACIONES

Inicio de Vacaciones: ${window.formatDate(startDate)}
Fin de Vacaciones: ${window.formatDate(endDate)}
Inicio de Labor: ${window.formatDate(workStartDate)}

3. NÚMERO DE DÍAS DE VACACIONES

No. de días de vacaciones: 15 DÍAS HÁBILES

Estoy de acuerdo con lo establecido en este documento y hago constar que se ha dado
 cumplimiento a lo señalado en el artículo 130 del código de trabajo el cual expone 
 “Todo trabajador sin excepción, tiene derecho a un período de vacaciones remuneradas 
 después de cada año de trabajo al servicio de un mismo patrono, cuya duración mínima 
 es de quince días hábiles”. He disfrutado de las vacaciones señaladas.
            `,
            firmaColaborador: "\nFirma del Colaborador",
            firmaEncargado: "\nFirma del Encargado",
            datosAdicionales: {
                nombreColaborador: datos.nombreColaborador,
                empresa: datos.empresa
            }
        };
    }
};

// Agregar al objeto global tiposDeCarta
window.tiposDeCarta[concesionVacaciones.tipo] = concesionVacaciones;
