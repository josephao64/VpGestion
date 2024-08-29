// Funciones para exportar facturas

function exportarFacturaPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.text('Factura', 20, 20);
    doc.save('factura.pdf');
}

function exportarFacturaImagen() {
    const invoiceContent = document.getElementById('invoiceContent');
    html2canvas(invoiceContent).then(canvas => {
        const link = document.createElement('a');
        link.download = 'factura.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}
