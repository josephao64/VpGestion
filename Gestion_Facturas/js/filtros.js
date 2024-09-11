// Funciones para filtrar facturas

function filterFacturas() {
    const numero = document.getElementById('searchNumero').value.toUpperCase();
    const empresa = document.getElementById('empresaFilter').value;
    const sucursal = document.getElementById('sucursalFilter').value;
    const proveedor = document.getElementById('proveedorFilter').value;
    const fechaInicio = document.getElementById('fechaInicio').value;
    const fechaFin = document.getElementById('fechaFin').value;
    const table = document.getElementById('facturasTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const tdNumero = tr[i].getElementsByTagName('td')[0];
        const tdEmpresa = tr[i].getElementsByTagName('td')[1];
        const tdSucursal = tr[i].getElementsByTagName('td')[2];
        const tdProveedor = tr[i].getElementsByTagName('td')[3];
        const tdFechaVencimiento = tr[i].getElementsByTagName('td')[5];
        const fechaVencimiento = tdFechaVencimiento ? new Date(tdFechaVencimiento.textContent).toISOString().split('T')[0] : '';

        if (tdNumero && tdEmpresa && tdSucursal && tdProveedor) {
            const txtNumero = tdNumero.textContent || tdNumero.innerText;
            const txtEmpresa = tdEmpresa.textContent || tdEmpresa.innerText;
            const txtSucursal = tdSucursal.textContent || tdSucursal.innerText;
            const txtProveedor = tdProveedor.textContent || tdProveedor.innerText;

            if (txtNumero.toUpperCase().indexOf(numero) > -1 && 
                (empresa === '' || txtEmpresa === empresa) &&
                (sucursal === '' || txtSucursal === sucursal) &&
                (proveedor === '' || txtProveedor === proveedor) &&
                (!fechaInicio || fechaVencimiento >= fechaInicio) &&
                (!fechaFin || fechaVencimiento <= fechaFin)) {
                tr[i].style.display = '';
            } else {
                tr[i].style.display = 'none';
            }
        }       
    }
    updateCounters();
}

function filterFacturasHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    filterFacturasByDate(hoy, hoy);
    updateCounters(); // Asegúrate de que los contadores se actualicen después de filtrar
}

function filterProximasFacturas() {
    const hoy = new Date().toISOString().split('T')[0];
    const proximos7Dias = new Date();
    proximos7Dias.setDate(new Date().getDate() + 7);
    filterFacturasByDate(hoy, proximos7Dias.toISOString().split('T')[0], true);
    updateCounters(); // Asegúrate de que los contadores se actualicen después de filtrar
}

function filterFacturasVencidas() {
    const hoy = new Date().toISOString().split('T')[0];
    filterFacturasByDate(null, hoy, true);
    updateCounters(); // Asegúrate de que los contadores se actualicen después de filtrar
}

function filterPagosPendientes() {
    const table = document.getElementById('facturasTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const tdEstado = tr[i].getElementsByTagName('td')[7];
        const montoPendiente = parseFloat(tr[i].getElementsByTagName('td')[8].textContent.replace('Q', ''));
        if (tdEstado && montoPendiente > 0 && tdEstado.textContent !== 'Pagado') {
            tr[i].style.display = '';
        } else {
            tr[i].style.display = 'none';
        }
    }
    updateCounters();
}

function filterFacturasPagadasHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const table = document.getElementById('facturasTable');
    const tr = table.getElementsByTagName('tr');
    let count = 0;

    for (let i = 1; i < tr.length; i++) {
        const tdEstado = tr[i].getElementsByTagName('td')[7];
        const tdFechaVencimiento = tr[i].getElementsByTagName('td')[5].textContent;
        if (tdEstado && tdEstado.textContent === 'Pagado' && tdFechaVencimiento === hoy) {
            tr[i].style.display = '';
            count++;
        } else {
            tr[i].style.display = 'none';
        }
    }
    document.getElementById('countPagadasHoy').textContent = count;
}

// Función para filtrar facturas pagadas
function filterFacturasPagadas() {
    const table = document.getElementById('facturasTable');
    const tr = table.getElementsByTagName('tr');
    let count = 0;

    for (let i = 1; i < tr.length; i++) {
        const tdEstado = tr[i].getElementsByTagName('td')[7];
        if (tdEstado && tdEstado.textContent === 'Pagado') {
            tr[i].style.display = '';
            count++;
        } else {
            tr[i].style.display = 'none';
        }
    }
    document.getElementById('countPagadas').textContent = count;
}

function filterFacturasByDate(startDate, endDate, excludePagadas = false) {
    const table = document.getElementById('facturasTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const tdFechaVencimiento = tr[i].getElementsByTagName('td')[5].textContent;
        const tdEstado = tr[i].getElementsByTagName('td')[7];
        if (tdFechaVencimiento) {
            const fechaVencimiento = new Date(tdFechaVencimiento).toISOString().split('T')[0];
            if ((!startDate || fechaVencimiento >= startDate) && 
                (!endDate || fechaVencimiento <= endDate) &&
                (!excludePagadas || tdEstado.textContent !== 'Pagado')) {
                tr[i].style.display = '';
            } else {
                tr[i].style.display = 'none';
            }
        }
    }
}

// Función para actualizar los contadores de las facturas
function updateCounters() {
    const table = document.getElementById('facturasTable');
    const tr = table.getElementsByTagName('tr');
    let countHoy = 0;
    let countProximas = 0;
    let countVencidas = 0;
    let countPagosPendientes = 0;
    let countPagadasHoy = 0;
    let countPagadas = 0;
    let countTotal = 0;

    const hoy = new Date().toISOString().split('T')[0];
    const proximos7Dias = new Date();
    proximos7Dias.setDate(new Date().getDate() + 7);
    const proximos7DiasISO = proximos7Dias.toISOString().split('T')[0];

    for (let i = 1; i < tr.length; i++) {
        const tdEstado = tr[i].getElementsByTagName('td')[7];
        const tdFechaVencimiento = tr[i].getElementsByTagName('td')[5].textContent;
        const montoPendiente = parseFloat(tr[i].getElementsByTagName('td')[8].textContent.replace('Q', ''));

        if (tdFechaVencimiento === hoy && tdEstado.textContent !== 'Pagado') countHoy++;
        if (tdFechaVencimiento >= hoy && tdFechaVencimiento <= proximos7DiasISO && tdEstado.textContent !== 'Pagado') countProximas++;
        if (tdFechaVencimiento < hoy && tdEstado.textContent !== 'Pagado') countVencidas++;
        if (montoPendiente > 0 && tdEstado.textContent !== 'Pagado') countPagosPendientes++;
        if (tdEstado && tdEstado.textContent === 'Pagado') {
            countPagadas++;
            if (tdFechaVencimiento === hoy) countPagadasHoy++;
        }
        countTotal++;
    }

    document.getElementById('countHoy').textContent = countHoy;
    document.getElementById('countProximas').textContent = countProximas;
    document.getElementById('countVencidas').textContent = countVencidas;
    document.getElementById('countPagosPendientes').textContent = countPagosPendientes;
    document.getElementById('countPagadasHoy').textContent = countPagadasHoy;
    document.getElementById('countPagadas').textContent = countPagadas;
    document.getElementById('countTotal').textContent = countTotal;
}

// Ejecuta esta función cuando la página se carga
document.addEventListener('DOMContentLoaded', function() {
    updateCounters();
});