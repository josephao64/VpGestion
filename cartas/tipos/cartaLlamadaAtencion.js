// cartas/tipos/cartaLlamadaAtencion.js

const cartaLlamadaAtencion = {
    tipo: 'cartaLlamadaAtencion',
    nombre: "Llamada de Atención Disciplinaria",
    icono: '<i class="fas fa-exclamation-circle fa-2x"></i>',
    campos: [
        { label: "Empresa", id: "empresa", tipo: "select", opciones: [
            { valor: "", texto: "--Selecciona la empresa--" },
            { valor: "American Pizza", texto: "American Pizza" },
            { valor: "Brenda Elizabeth Hernández", texto: "Brenda Elizabeth Hernández" },
            { valor: "Corporación de Alimentos S.A.", texto: "Corporación de Alimentos S.A." }
        ], required: true },
        { label: "Fecha", id: "fecha", tipo: "date", required: true },
        { label: "Colaborador", id: "colaborador", tipo: "text", required: true },
        { label: "DPI", id: "dpi", tipo: "text", required: true },
        { label: "Puesto", id: "puesto", tipo: "text", required: true },
        { label: "Tipo de Llamada de Atención", id: "tipoLlamada", tipo: "checkboxGroup", opciones: [
            { valor: "Verbal", texto: "Verbal" },
            { valor: "1ra Llamada de Atención Escrita", texto: "1ra Llamada de Atención Escrita" },
            { valor: "2da Llamada de Atención", texto: "2da Llamada de Atención" },
            { valor: "3ra Llamada de Atención", texto: "3ra Llamada de Atención" }
        ], required: true },
        { label: "Motivo de la Llamada de Atención", id: "motivo", tipo: "textarea", required: true },
        { label: "Asunto", id: "asunto", tipo: "text", required: true, value: "Proceso Disciplinario" }
    ],
    plantilla: (datos) => {
        const fechaIncidente = new Date(datos.fecha + 'T12:00:00');

        let tipoLlamadaTexto = datos.tipoLlamada.join(', ');

        return {
            encabezado: datos.empresa,
            titulo: "Llamada de Atención Disciplinaria",
            contenido: `
Fecha: ${window.formatDate(fechaIncidente)}
Colaborador: ${datos.colaborador}
DPI: ${datos.dpi}
Puesto: ${datos.puesto}

Tipo de Llamada de Atención:
${tipoLlamadaTexto}

Motivo de la Llamada de Atención:
${datos.motivo}

Asunto:
${datos.asunto}

Derechos del Colaborador:
El colaborador tiene el derecho a presentar una réplica por escrito a esta notificación en un plazo de 3 días hábiles, la cual será anexada a su expediente laboral, conforme a lo establecido en el Artículo 77 del Código de Trabajo de Guatemala.

Consecuencias de Reincidencia:
Se le notifica que en caso de reincidir en conductas similares, se procederá a emitir la correspondiente medida disciplinaria. A la cuarta llamada de atención, se procederá con la terminación del contrato de trabajo conforme a lo estipulado en el Artículo 102, literal d) del Código de Trabajo de Guatemala, que establece la posibilidad de despido por faltas graves a los deberes del trabajador.

Nota: A la cuarta llamada de atención, se procederá con el despido del colaborador conforme al Código de Trabajo de Guatemala.
            `,
            firmaColaborador: "Firma de Recibido\nColaborador",
            firmaEncargado: "Encargado de Recursos Humanos",
            datosAdicionales: {
                nombreColaborador: datos.colaborador,
                empresa: datos.empresa
            }
        };
    }
};

// Agregar al objeto global tiposDeCarta
window.tiposDeCarta[cartaLlamadaAtencion.tipo] = cartaLlamadaAtencion;
