//main.js
// Exportar Factura como PDF
async function exportarFacturaPDF() {
    const facturaId = selectedFacturaId;
    const facturaRef = db.collection('facturas').doc(facturaId);

    const facturaDoc = await facturaRef.get();
    if (facturaDoc.exists) {
        const factura = facturaDoc.data();

        const empresaDoc = await db.collection('empresas').doc(factura.empresaId).get();
        const sucursalDoc = await db.collection('sucursales').doc(factura.sucursalId).get();
        const proveedorDoc = await db.collection('providers').doc(factura.proveedorId).get();

        const empresaName = empresaDoc.exists ? empresaDoc.data().name : 'Empresa';
        const sucursalName = sucursalDoc.exists ? sucursalDoc.data().name : 'Sucursal';
        const proveedorName = proveedorDoc.exists ? proveedorDoc.data().name : 'Proveedor';

        const element = document.getElementById('invoiceContent');
        const buttons = element.querySelectorAll('button');
        buttons.forEach(button => button.style.display = 'none');  // Ocultar botones antes de imprimir

        const win = window.open('', '', 'width=800,height=600');
        win.document.write(`
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; }
                    .invoice-header { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .company-details, .invoice-details { width: 45%; }
                    .invoice-title { text-align: center; font-size: 20px; margin-bottom: 20px; }
                    .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .total-row { font-weight: bold; }
                    .notes { margin-top: 20px; }
                </style>
            </head>
            <body>
                ${element.innerHTML}
            </body>
            </html>
        `);
        win.document.close();
        win.print();

        buttons.forEach(button => button.style.display = 'inline-block');  // Volver a mostrar los botones después de imprimir

        const fileName = `${factura.numero}_${proveedorName}_${sucursalName}_${factura.fechaEmision}.pdf`;
        win.document.title = fileName;
    } else {
        alert('Factura no encontrada');
    }
}

// Exportar Factura como Imagen
async function exportarFacturaImagen() {
    const facturaId = selectedFacturaId;
    const facturaRef = db.collection('facturas').doc(facturaId);

    const facturaDoc = await facturaRef.get();
    if (facturaDoc.exists) {
        const factura = facturaDoc.data();
        
        const empresaDoc = await db.collection('empresas').doc(factura.empresaId).get();
        const sucursalDoc = await db.collection('sucursales').doc(factura.sucursalId).get();
        const proveedorDoc = await db.collection('providers').doc(factura.proveedorId).get();

        const empresaName = empresaDoc.exists ? empresaDoc.data().name : 'Empresa';
        const sucursalName = sucursalDoc.exists ? sucursalDoc.data().name : 'Sucursal';
        const proveedorName = proveedorDoc.exists ? proveedorDoc.data().name : 'Proveedor';

        const element = document.getElementById('invoiceContent');
        const buttons = element.querySelectorAll('button');

        buttons.forEach(button => button.style.display = 'none');  // Ocultar botones antes de capturar la imagen
        
        html2canvas(element).then(canvas => {
            const link = document.createElement('a');
            link.download = `${factura.numero}_${proveedorName}_${sucursalName}_${factura.fechaEmision}.png`;
            link.href = canvas.toDataURL();
            link.click();
            buttons.forEach(button => button.style.display = 'inline-block');  // Volver a mostrar los botones después de capturar
        });
    } else {
        alert('Factura no encontrada');
    }
}

// Mostrar pagos realizados en la factura
function displayPagos(pagos) {
    const pagosList = document.getElementById('pagosList');
    pagosList.innerHTML = '';

    if (Array.isArray(pagos) && pagos.length > 0) {
        pagos.forEach(pago => {
            const li = document.createElement('li');

            const pagoInfo = document.createElement('div');
            pagoInfo.innerHTML = `
                <span class="payment-date">Fecha: ${pago.fecha}</span>
                <span class="payment-method">Método: ${pago.metodoPago}</span>
                <span class="payment-amount">Monto: Q${pago.monto}</span>
                <span class="payment-boleta">Boleta: ${pago.numeroBoleta || 'N/A'}</span>
            `;

            const comprobanteButton = document.createElement('button');
            comprobanteButton.textContent = 'Ver Comprobante';
            comprobanteButton.className = 'comprobante-button';
            comprobanteButton.onclick = () => {
                if (pago.comprobante) {
                    descargarComprobante(pago.comprobante);
                } else {
                    alert('No se encontró ningún comprobante para este pago.');
                }
            };

            li.appendChild(pagoInfo);
            li.appendChild(comprobanteButton);
            pagosList.appendChild(li);
        });
    } else {
        pagosList.innerHTML = '<li>No se encontraron pagos.</li>';
    }
}

// Descargar comprobante de pago
function descargarComprobante(nombreArchivo) {
    const facturaId = selectedFacturaId;
    const storageRef = firebase.storage().ref();
    const archivoRef = storageRef.child(`comprobantes/${facturaId}/${nombreArchivo}`);

    archivoRef.getDownloadURL()
        .then(url => {
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.download = nombreArchivo;
            link.click();
        })
        .catch(error => {
            console.error('Error al descargar comprobante:', error);
            alert('Error al descargar comprobante: ' + error.message);
        });
}

// Cargar facturas al iniciar la página
window.onload = function() {
    loadFacturas();
};
