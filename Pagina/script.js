// script.js

// Accede a jsPDF desde el objeto global
const { jsPDF } = window.jspdf;

// Función para mostrar/ocultar campos basados en el tipo de carta
function toggleFields() {
    const letterType = document.getElementById("letterType").value;
    const companySelection = document.getElementById("companySelection");
    const vacationFields = document.getElementById("vacationFields");
    const terminationFields = document.getElementById("terminationFields");

    if (letterType === "vacaciones") {
        companySelection.style.display = "block";
        vacationFields.style.display = "block";
        terminationFields.style.display = "none";
    } else if (letterType === "despido") {
        companySelection.style.display = "none";
        vacationFields.style.display = "none";
        terminationFields.style.display = "block";
    } else {
        companySelection.style.display = "none";
        vacationFields.style.display = "none";
        terminationFields.style.display = "none";
    }
}

// Función para generar la carta en HTML
function generateLetter() {
    const letterType = document.getElementById("letterType").value;
    const company = document.getElementById("company").value;
    const name = document.getElementById("name").value;
    const dpi = document.getElementById("dpi").value;
    const position = document.getElementById("position").value;
    const startVacation = document.getElementById("startVacation").value;
    const terminationDate = document.getElementById("terminationDate").value;
    const reason = document.getElementById("reason").value;

    if (!letterType || (letterType === "vacaciones" && !company)) {
        alert("Por favor, seleccione el tipo de carta y la empresa.");
        return;
    }

    let letterContent = "";
    let headerContent = "";

    // Encabezados específicos para cada empresa
    switch (company) {
        case "american_pizza":
            headerContent = `<header>
                                <img src="2.png" alt="Logo American Pizza" width="70" height="25">
                             </header>`;
            break;
        case "brenda_elizabeth":
            headerContent = `<header>
                                <img src="1.png" alt="Logo Brenda Elizabeth Hernández" width="70" height="25">
                             </header>`;
            break;
        case "corporacion_alimentos":
            headerContent = `<header>
                                <img src="1.png" alt="Logo Corporación de Alimentos S.A. American Pizza" width="70" height="25">
                             </header>`;
            break;
        default:
            headerContent = `<header>
                                <h2>Empresa</h2>
                                <p>Dirección: Dirección de la Empresa | Tel: (123) 456-7890</p>
                             </header>`;
    }

    // Contenido de la carta basado en el tipo
    if (letterType === "vacaciones") {
        if (!startVacation) {
            alert("Por favor, ingrese la fecha de inicio de vacaciones.");
            return;
        }

        // Cálculo de fechas
        const startDate = new Date(startVacation + 'T12:00:00');
        const endDate = addCalendarDays(startDate, 14); // 14 días calendario
        const workStartDate = addCalendarDays(endDate, 1); // Un día después de la fecha de fin

        letterContent = `
            ${headerContent}
            <h1>Concesión de Vacaciones</h1>
            <p><strong>Nombre del colaborador:</strong> ${name}</p>
            <p><strong>DPI del colaborador:</strong> ${dpi}</p>
            <p><strong>Puesto:</strong> ${position}</p>
            <div class="section-separator"></div>
            <h3>Fecha de las Vacaciones:</h3>
            <p><strong>Inicio de Vacaciones:</strong> ${formatDate(startDate)}</p>
            <p><strong>Fin de Vacaciones:</strong> ${formatDate(endDate)}</p>
            <p><strong>Inicio de Labor:</strong> ${formatDate(workStartDate)}</p>
            <div class="section-separator"></div>
            <h4>No. De días de vacaciones: 15 DÍAS HABILES</h4>
            <div class="section-separator"></div>
            <p><strong>Estoy de acuerdo con lo establecido en este documento y hago constar que se ha dado cumplimiento a lo señalado en el artículo 130 del código de trabajo el cual expone “Todo trabajador sin excepción, tiene derecho a un período de vacaciones remuneradas después de cada año de trabajo al servicio de un mismo patrono, cuya duración mínima es de quince días hábiles”. He disfrutado de las vacaciones señaladas</strong></p>
            <p class="colaborador-encargado"></p>
            <div class="signature">
                <div>Firma del Colaborador</div>
                <div>Firma del Encargado</div>
            </div>
        `;
    } else if (letterType === "despido") {
        if (!terminationDate || !reason) {
            alert("Por favor, ingrese la fecha de despido y el motivo.");
            return;
        }

        // Cálculo de fechas
        const terminationDateObj = new Date(terminationDate + 'T12:00:00');

        letterContent = `
            ${headerContent}
            <h1>Carta de Despido</h1>
            <p><strong>Nombre del colaborador:</strong> ${name}</p>
            <p><strong>DPI del colaborador:</strong> ${dpi}</p>
            <p><strong>Puesto:</strong> ${position}</p>
            <div class="section-separator"></div>
            <h3>Fecha de Despido:</h3>
            <p><strong>Fecha:</strong> ${formatDate(terminationDateObj)}</p>
            <div class="section-separator"></div>
            <h3>Motivo:</h3>
            <p>${reason}</p>
            <div class="section-separator"></div>
            <div class="signature">
                <div>Firma del Colaborador</div>
                <div>Firma del Encargado</div>
            </div>
        `;
    }

    document.getElementById("letterContent").innerHTML = letterContent;
    document.getElementById("letterOutput").style.display = "block";
}

// Función para agregar días calendario a una fecha
function addCalendarDays(date, days) {
    let result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Función para formatear fechas como dd/mm/yyyy
function formatDate(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Función para exportar la carta a PDF con diseño mejorado
async function exportPDF() {
    const letterType = document.getElementById("letterType").value;
    const company = document.getElementById("company").value;
    const element = document.getElementById("letterContent");

    if (!letterType) {
        alert("Por favor, genere la carta antes de exportar a PDF.");
        return;
    }

    // Crear una instancia de jsPDF
    const doc = new jsPDF();

    // Establecer márgenes y posición inicial
    const marginLeft = 15;
    let y = 20;

    // Función para agregar imágenes de forma asíncrona
    const addImageToPDF = async (imgElementId, x, yPos, width, height) => {
        return new Promise((resolve, reject) => {
            const img = document.getElementById(imgElementId);
            if (!img) {
                resolve();
                return;
            }
            const image = new Image();
            image.src = img.src;
            image.crossOrigin = "Anonymous"; // Evitar problemas de CORS
            image.onload = () => {
                doc.addImage(image, 'PNG', x, yPos, width, height);
                resolve();
            };
            image.onerror = () => {
                console.error(`Error al cargar la imagen: ${img.src}`);
                resolve();
            };
        });
    };

    // Agregar el encabezado basado en la empresa
    if (company) {
        switch (company) {
            case "american_pizza":
                await addImageToPDF('logo2', marginLeft, y, 70, 25); // Tamaño ajustado: ancho=70, alto=25
                y += 20; // Ajustar y para acomodar el logo y el nombre
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(16);
                doc.text("American Pizza", 105, y, { align: "center" });
                y += 10;
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(12);
                doc.text("", 105, y, { align: "center" });
                break;
            case "brenda_elizabeth":
                await addImageToPDF('logo1', marginLeft, y, 50, 25); // Tamaño ajustado: ancho=70, alto=25
                y += 20;
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(16);
                doc.text("Brenda Elizabeth Hernández", 105, y, { align: "center" });
                y += 10;
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(12);
                doc.text("", 105, y, { align: "center" });
                break;
            case "corporacion_alimentos":
                await addImageToPDF('logo1', marginLeft, y, 50, 25); // Tamaño ajustado: ancho=70, alto=25
                y += 20;
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(16);
                doc.text("Corporación de Alimentos S.A. American Pizza", 105, y, { align: "center" });
                y += 10;
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(12);
                doc.text("", 105, y, { align: "center" });
                break;
            default:
                doc.setFont("Helvetica", "bold");
                doc.setFontSize(16);
                doc.text("Empresa", 105, y, { align: "center" });
                y += 7;
                doc.setFont("Helvetica", "normal");
                doc.setFontSize(12);
                doc.text("Dirección: Dirección de la Empresa | Tel: (123) 456-7890", 105, y, { align: "center" });
        }
    } else {
        // Si no hay empresa seleccionada (por ejemplo, en cartas de despido sin empresa)
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(16);
        doc.text("Empresa", 105, y, { align: "center" });
        y += 7;
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(12);
        doc.text("Dirección: Dirección de la Empresa | Tel: (123) 456-7890", 105, y, { align: "center" });
    }

    y += 10;

    // Agregar una línea para separar el encabezado del contenido
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, y, 195, y); // Línea horizontal
    y += 10;

    // Agregar el título de la carta
    const title = letterType === "vacaciones" ? "Concesión de Vacaciones" : "Carta de Despido";
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text(title, 105, y, { align: "center" });
    y += 10;

    // Agregar otra línea para separar el título del contenido
    doc.setLineWidth(0.2);
    doc.line(marginLeft, y, 195, y); // Línea horizontal
    y += 10;

    // Extraer el contenido de la carta
    const contentElements = element.children; // Usar 'children' en lugar de 'childNodes'

    for (let node of contentElements) {
        if (node.nodeName === "H1" || node.nodeName === "H3" || node.nodeName === "H4") {
            // Configurar estilo para encabezados
            doc.setFont("Helvetica", "bold");
            let fontSize = 12;
            if (node.nodeName === "H1") fontSize = 14;
            if (node.nodeName === "H3" || node.nodeName === "H4") fontSize = 12;
            doc.setFontSize(fontSize);
            doc.text(node.textContent, marginLeft, y);
            y += 7;
        } else if (node.nodeName === "P") {
            // Configurar estilo para párrafos
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(12);
            const splitText = doc.splitTextToSize(node.textContent, 170);
            if (node.classList.contains('colaborador-encargado')) {
                // Alinear a la izquierda
                doc.text(splitText, marginLeft, y);
            } else {
                doc.text(splitText, marginLeft, y);
            }
            y += splitText.length * 7;
        } else if (node.nodeName === "DIV" && node.classList.contains("signature")) {
            y += 10;
            // Dibujar líneas para firmas
            doc.setLineWidth(0.2);
            doc.line(marginLeft, y, 80, y); // Firma del Colaborador
            doc.line(130, y, 195, y); // Firma del Encargado
            y += 5;
            // Añadir etiquetas debajo de las líneas
            doc.setFont("Helvetica", "normal");
            doc.setFontSize(12);
            doc.text("Firma del Colaborador", marginLeft, y + 5);
            doc.text("Firma del Encargado", 130, y + 5);
        } else if (node.classList.contains("section-separator")) {
            // Agregar una línea de separación
            doc.setLineWidth(0.2);
            doc.line(marginLeft, y, 195, y);
            y += 10;
        }

        // Verificar si se ha llegado al final de la página
        if (y > 270) { // Considerando un margen inferior de 20 unidades
            doc.addPage();
            y = 20; // Reiniciar y para la nueva página
        }
    }

    // Agregar un footer con número de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: "center" });
    }

    // Agregar un borde al PDF
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, 190, 277); // x, y, width, height

    // Guardar el PDF
    doc.save('Carta_Generada.pdf');
}
