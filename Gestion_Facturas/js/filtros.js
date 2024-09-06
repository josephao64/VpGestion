// Función para aplicar los filtros
function applyFilters() {
    const inputEstado = document.getElementById('filtroEstado').value.toLowerCase();
    const inputFecha = document.getElementById('filtroFecha').value;
    const inputMontoMin = parseFloat(document.getElementById('filtroMontoMin').value) || 0;
    const inputMontoMax = parseFloat(document.getElementById('filtroMontoMax').value) || Number.MAX_VALUE;

    const table = document.getElementById('facturasTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const tdEstado = tr[i].getElementsByTagName('td')[7];
        const tdFecha = tr[i].getElementsByTagName('td')[5];
        const tdMonto = tr[i].getElementsByTagName('td')[8];

        if (tdEstado && tdFecha && tdMonto) {
            const estado = tdEstado.textContent.toLowerCase();
            const fecha = tdFecha.textContent;
            const monto = parseFloat(tdMonto.textContent.replace('Q', '')) || 0;

            if (
                (estado.indexOf(inputEstado) > -1 || inputEstado === '') &&
                (fecha === inputFecha || inputFecha === '') &&
                monto >= inputMontoMin && monto <= inputMontoMax
            ) {
                tr[i].style.display = '';
            } else {
                tr[i].style.display = 'none';
            }
        }
    }

    updateCounters(); // Actualizar los contadores después de aplicar los filtros
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
        if (tr[i].style.display === 'none') continue; // Omitir las filas que están ocultas

        const tdEstado = tr[i].getElementsByTagName('td')[7];
        const tdFechaVencimiento = tr[i].getElementsByTagName('td')[5].textContent;
        const montoPendiente = parseFloat(tr[i].getElementsByTagName('td')[8].textContent.replace('Q', ''));

        // Contar las facturas para hoy
        if (tdFechaVencimiento === hoy && tdEstado.textContent !== 'Pagado') countHoy++;

        // Contar las próximas facturas dentro de los próximos 7 días
        if (tdFechaVencimiento >= hoy && tdFechaVencimiento <= proximos7DiasISO && tdEstado.textContent !== 'Pagado') countProximas++;

        // Contar las facturas vencidas
        if (tdFechaVencimiento < hoy && tdEstado.textContent !== 'Pagado') countVencidas++;

        // Contar las facturas con pagos pendientes
        if (montoPendiente > 0 && tdEstado.textContent !== 'Pagado') countPagosPendientes++;

        // Contar facturas pagadas y pagadas hoy
        if (tdEstado && tdEstado.textContent === 'Pagado') {
            countPagadas++;
            if (tdFechaVencimiento === hoy) countPagadasHoy++;
        }

        // Contar el total de facturas visibles
        countTotal++;
    }

    // Actualizar los contadores en la interfaz
    document.getElementById('countHoy').textContent = countHoy;
    document.getElementById('countProximas').textContent = countProximas;
    document.getElementById('countVencidas').textContent = countVencidas;
    document.getElementById('countPagosPendientes').textContent = countPagosPendientes;
    document.getElementById('countPagadasHoy').textContent = countPagadasHoy;
    document.getElementById('countPagadas').textContent = countPagadas;
    document.getElementById('countTotal').textContent = countTotal;

    // Verificación: comprobar si el número total visible coincide con el contador total
    let filasVisibles = 0;
    for (let i = 1; i < tr.length; i++) {
        if (tr[i].style.display !== 'none') filasVisibles++;
    }

    if (filasVisibles !== countTotal) {
        console.warn('Discrepancia: el número de filas visibles no coincide con el contador total.');
        console.warn(`Filas visibles: ${filasVisibles}, Contador total: ${countTotal}`);
    } else {
        console.log('Todo correcto: el número de filas visibles coincide con el contador total.');
    }
}
