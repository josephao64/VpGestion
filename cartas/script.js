// cartas/script.js

document.addEventListener('DOMContentLoaded', () => {
    const botonesTipoCartaDiv = document.getElementById('botonesTipoCarta');
    const formulario = document.getElementById('formularioCarta');
    const camposDinamicosDiv = document.getElementById('camposDinamicos');
    const cartaGeneradaDiv = document.getElementById('cartaGenerada');
    const contenidoCartaDiv = document.getElementById('contenidoCarta');

    let tipoCartaSeleccionado = '';

    // Función para generar botones de tipos de carta dinámicamente
    function generarBotonesTiposDeCarta() {
        for (const tipo in window.tiposDeCarta) {
            const button = document.createElement('button');
            button.type = 'button';
            button.innerHTML = `${window.tiposDeCarta[tipo].icono}<br>${window.tiposDeCarta[tipo].nombre}`;
            button.setAttribute('data-tipo', tipo);
            button.classList.add('letter-type-button');
            button.addEventListener('click', () => selectLetterType(tipo));
            botonesTipoCartaDiv.appendChild(button);
        }
    }

    // Llamar a la función para generar los botones
    generarBotonesTiposDeCarta();

    // Función para seleccionar el tipo de carta
    function selectLetterType(tipo) {
        tipoCartaSeleccionado = tipo;
        mostrarCamposDinamicos(tipoCartaSeleccionado);
        formulario.style.display = 'block';
        cartaGeneradaDiv.style.display = 'none'; // Ocultar carta previa si existe
    }

    // Función para mostrar los campos dinámicos
    function mostrarCamposDinamicos(tipoCarta) {
        camposDinamicosDiv.innerHTML = '';
        if (window.tiposDeCarta[tipoCarta]) {
            const campos = window.tiposDeCarta[tipoCarta].campos;
            campos.forEach(campo => {
                const label = document.createElement('label');
                label.textContent = campo.label;
                label.setAttribute('for', campo.id);

                let input;
                if (campo.tipo === 'textarea') {
                    input = document.createElement('textarea');
                } else if (campo.tipo === 'select') {
                    input = document.createElement('select');
                    campo.opciones.forEach(opcion => {
                        const option = document.createElement('option');
                        option.value = opcion.valor;
                        option.textContent = opcion.texto;
                        input.appendChild(option);
                    });
                } else if (campo.tipo === 'checkboxGroup') {
                    input = document.createElement('div');
                    campo.opciones.forEach(opcion => {
                        const checkboxLabel = document.createElement('label');
                        const checkbox = document.createElement('input');
                        checkbox.type = 'checkbox';
                        checkbox.value = opcion.valor;
                        checkbox.name = campo.id;
                        checkboxLabel.appendChild(checkbox);
                        checkboxLabel.appendChild(document.createTextNode(' ' + opcion.texto));
                        input.appendChild(checkboxLabel);
                        input.appendChild(document.createElement('br'));
                    });
                } else {
                    input = document.createElement('input');
                    input.type = campo.tipo;
                    if (campo.value) input.value = campo.value;
                }
                input.id = campo.id;
                input.name = campo.id;
                if (campo.required) input.required = true;

                camposDinamicosDiv.appendChild(label);
                camposDinamicosDiv.appendChild(input);
                camposDinamicosDiv.appendChild(document.createElement('br'));
            });
        }
    }

    // Función para generar la carta
    window.generarCarta = async function() {
        if (!tipoCartaSeleccionado) {
            alert('Por favor, selecciona un tipo de carta.');
            return;
        }

        const datos = {};

        const campos = window.tiposDeCarta[tipoCartaSeleccionado].campos;
        let valid = true;
        for (const campo of campos) {
            if (campo.tipo === 'checkboxGroup') {
                const checkboxes = document.getElementsByName(campo.id);
                const valoresSeleccionados = [];
                checkboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        valoresSeleccionados.push(checkbox.value);
                    }
                });
                if (campo.required && valoresSeleccionados.length === 0) {
                    alert(`Por favor, selecciona al menos una opción en: ${campo.label}`);
                    valid = false;
                }
                datos[campo.id] = valoresSeleccionados;
            } else {
                const input = document.getElementById(campo.id);
                if (campo.required && !input.value) {
                    alert(`Por favor, completa el campo: ${campo.label}`);
                    valid = false;
                }
                datos[campo.id] = input.value;
            }
        }

        if (!valid) return;

        // Generar el contenido de la carta
        const contenidoCarta = await window.tiposDeCarta[tipoCartaSeleccionado].plantilla(datos);

        // Guardamos el contenido para usarlo en exportarPDF
        window.contenidoCartaGenerada = contenidoCarta;
        cartaGeneradaDiv.style.display = 'block';

        // Mostrar una vista previa en pantalla (opcional)
        contenidoCartaDiv.innerHTML = `
            <h1>${contenidoCarta.titulo}</h1>
            <pre>${contenidoCarta.contenido}</pre>
        `;
    };

    // Función para exportar la carta a PDF
    window.exportarPDF = function() {
        if (!tipoCartaSeleccionado) {
            alert('Por favor, genera la carta antes de exportar a PDF.');
            return;
        }

        exportPDF();
    };

    // Función para exportar la carta a PDF utilizando jsPDF
    async function exportPDF() {
        const contenido = window.contenidoCartaGenerada;

        if (!contenido) {
            alert('Por favor, genera la carta antes de exportar a PDF.');
            return;
        }

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF('p', 'pt', 'letter');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const marginLeft = 40;
        const marginTop = 60;
        const lineHeight = 20;
        let yPosition = marginTop;

        // Agregar el membrete como fondo
        const imgData = await obtenerImagenMembrete(contenido.encabezado);
        if (imgData) {
            pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
            yPosition += 50; // Ajustar la posición vertical para que el texto no se solape con el membrete
        } else {
            console.error('No se pudo cargar el membrete para la empresa:', contenido.encabezado);
        }

        // Escribir el texto sobre la imagen de fondo
        pdf.setFontSize(16);
        pdf.text(contenido.titulo, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += lineHeight * 2;

        pdf.setFontSize(12);

        // Dividir el contenido en líneas
        const lines = contenido.contenido.split('\n');

        lines.forEach(line => {
            // Detectar líneas de separación
            if (line.trim().startsWith('1.') || line.trim().startsWith('2.') || line.trim().startsWith('3.')) {
                pdf.text(line, marginLeft, yPosition);
                yPosition += lineHeight / 2;
                // Dibujar línea de separación
                pdf.setLineWidth(0.5);
                pdf.line(marginLeft, yPosition, pageWidth - marginLeft, yPosition);
                yPosition += lineHeight;
            } else {
                pdf.text(line, marginLeft, yPosition);
                yPosition += lineHeight;
            }
        });

        // Agregar líneas para las firmas
        yPosition += lineHeight; // Espacio antes de las firmas

        // Firma del Colaborador
        const firmaColaboradorY = yPosition;
        pdf.setLineWidth(1);
        pdf.line(marginLeft, firmaColaboradorY, marginLeft + 200, firmaColaboradorY);
        pdf.text(contenido.firmaColaborador, marginLeft, firmaColaboradorY + 15);

        // Firma del Encargado
        const firmaEncargadoY = firmaColaboradorY;
        pdf.line(pageWidth - marginLeft - 200, firmaEncargadoY, pageWidth - marginLeft, firmaEncargadoY);
        pdf.text(contenido.firmaEncargado, pageWidth - marginLeft - 200, firmaEncargadoY + 15);

        // Nombre del archivo
        const fechaActual = new Date();
        const fechaFormateada = `${fechaActual.getFullYear()}-${(fechaActual.getMonth()+1).toString().padStart(2,'0')}-${fechaActual.getDate().toString().padStart(2,'0')}`;
        const nombreArchivo = `${contenido.datosAdicionales.nombreColaborador}_${tipoCartaSeleccionado}_${fechaFormateada}_${contenido.datosAdicionales.empresa}.pdf`;

        pdf.save(nombreArchivo);
    }

    // Función para obtener la imagen del membrete según la empresa
    async function obtenerImagenMembrete(empresa) {
        let rutaImagen = '';
        switch (empresa) {
            case 'American Pizza':
                rutaImagen = 'MEMBRETEAMERICAN.png';
                break;
            case 'Brenda Elizabeth Hernández':
                rutaImagen = 'MEMBRETEBRENDA.png';
                break;
            case 'Corporación de Alimentos S.A.':
                rutaImagen = 'MEMBRETECORPORACION.png';
                break;
            default:
                return null;
        }

        // Verificar la ruta de la imagen
        console.log('Intentando cargar la imagen del membrete en:', rutaImagen);

        // Cargar la imagen y convertirla a base64
        try {
            const imgResponse = await fetch(rutaImagen);
            if (!imgResponse.ok) {
                throw new Error(`HTTP error! status: ${imgResponse.status}`);
            }
            const imgBlob = await imgResponse.blob();
            return await convertirBlobADataURL(imgBlob);
        } catch (error) {
            console.error('Error al cargar la imagen del membrete:', error);
            return null;
        }
    }

    // Función para convertir Blob a DataURL
    function convertirBlobADataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = function() {
                resolve(reader.result);
            };
            reader.onerror = function() {
                reject(new Error('Error al convertir la imagen'));
            };
            reader.readAsDataURL(blob);
        });
    }

    // Funciones auxiliares
    window.addCalendarDays = function(date, days) {
        let result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }

    window.formatDate = function(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

});
