// cartas/tipos/cartaDespido.js

const cartaDespido = {
    tipo: 'cartaDespido',
    nombre: "Carta de Despido",
    icono: '<i class="fas fa-user-times fa-2x"></i>',
    campos: [
        { label: "Nombre del Colaborador", id: "nombreColaborador", tipo: "text", required: true },
        { label: "DPI del Colaborador", id: "dpiColaborador", tipo: "text", required: true },
        { label: "Puesto", id: "puesto", tipo: "text", required: true },
        { label: "Fecha de Despido", id: "fechaDespido", tipo: "date", required: true },
        { label: "Motivo del Despido", id: "motivoDespido", tipo: "textarea", required: true },
        { label: "Empresa", id: "empresa", tipo: "select", opciones: [
            { valor: "", texto: "--Selecciona la empresa--" },
            { valor: "American Pizza", texto: "American Pizza" },
            { valor: "Brenda Elizabeth Hernández", texto: "Brenda Elizabeth Hernández" },
            { valor: "Corporación de Alimentos S.A.", texto: "Corporación de Alimentos S.A." }
        ], required: true }
    ],
    plantilla: (datos) => {
        const terminationDateObj = new Date(datos.fechaDespido + 'T12:00:00');

        return {
            encabezado: datos.empresa,
            titulo: "Carta de Despido",
            contenido: `
Nombre del colaborador: ${datos.nombreColaborador}
DPI del colaborador: ${datos.dpiColaborador}
Puesto: ${datos.puesto}

Fecha de Despido:
Fecha: ${window.formatDate(terminationDateObj)}

Motivo:
${datos.motivoDespido}
            `,
            firmaColaborador: "Firma del Colaborador",
            firmaEncargado: "Firma del Encargado",
            datosAdicionales: {
                nombreColaborador: datos.nombreColaborador,
                empresa: datos.empresa
            }
        };
    }
};

// Agregar al objeto global tiposDeCarta
window.tiposDeCarta[cartaDespido.tipo] = cartaDespido;
