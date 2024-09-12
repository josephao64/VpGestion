// Facturas de ejemplo (múltiples facturas)
const facturas = [
    { sucursal: 'Sucursal 1', fechaFactura: '2024-09-01', numeroFactura: 'F001', monto: 100.50, saldoPendiente: 100.50, estado: 'Pendiente', vence: '2024-09-30', boletas: [] },
    { sucursal: 'Sucursal 1', fechaFactura: '2024-09-02', numeroFactura: 'F002', monto: 200.00, saldoPendiente: 200.00, estado: 'Pendiente', vence: '2024-09-29', boletas: [] },
    { sucursal: 'Sucursal 2', fechaFactura: '2024-09-03', numeroFactura: 'F003', monto: 150.75, saldoPendiente: 150.75, estado: 'Pendiente', vence: '2024-09-28', boletas: [] },
    { sucursal: 'Sucursal 2', fechaFactura: '2024-09-04', numeroFactura: 'F004', monto: 300.50, saldoPendiente: 300.50, estado: 'Pendiente', vence: '2024-09-27', boletas: [] },
    { sucursal: 'Sucursal 3', fechaFactura: '2024-09-05', numeroFactura: 'F005', monto: 500.00, saldoPendiente: 500.00, estado: 'Pendiente', vence: '2024-09-26', boletas: [] },
    { sucursal: 'Sucursal 3', fechaFactura: '2024-09-06', numeroFactura: 'F006', monto: 650.00, saldoPendiente: 650.00, estado: 'Pendiente', vence: '2024-09-25', boletas: [] }
];

// Lista de facturas seleccionadas
let facturasSeleccionadas = [];

// Actualizar el total pendiente seleccionado
function actualizarTotalPendiente() {
    let totalPendiente = facturasSeleccionadas.reduce((total, factura) => total + factura.saldoPendiente, 0);
    document.getElementById('total-pendiente').innerText = `Q${totalPendiente.toFixed(2)}`;
}

// Renderizar facturas en la tabla
function renderFacturas() {
    const tableBody = document.getElementById('facturas-table');
    tableBody.innerHTML = '';
    facturas.forEach((factura, index) => {
        const row = document.createElement('tr');

        // Asignar color según estado: Sin pago (rojo), Pendiente (amarillo), Pagada (verde)
        if (factura.boletas.length === 0) {
            row.classList.add('sin-pago');  // Rojo
        } else if (factura.saldoPendiente > 0) {
            row.classList.add('pendiente'); // Amarillo
        } else {
            row.classList.add('pagada');    // Verde
        }

        row.innerHTML = `
            <td><input type="checkbox" class="factura-checkbox" data-index="${index}" data-monto="${factura.saldoPendiente}"></td>
            <td>${factura.sucursal}</td>
            <td>${factura.fechaFactura}</td>
            <td>${factura.numeroFactura}</td>
            <td>Q${factura.monto.toFixed(2)}</td>
            <td id="saldo-${index}">Q${factura.saldoPendiente.toFixed(2)}</td>
            <td id="estado-${index}" class="estado">
                ${factura.saldoPendiente === 0 ? 'Pagada' : 'Pendiente'}
            </td>
            <td>${factura.vence}</td>
            <td id="boleta-${index}">${factura.boletas.length > 0 ? factura.boletas.map(boleta => boleta.boletaId).join(', ') : 'N/A'}</td>
            <td>
                <button class="btn" id="ver-pago-${index}" onclick="verPago(${index})" ${factura.boletas.length > 0 ? '' : 'disabled'}>Ver Pago Realizado</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Evento para habilitar/deshabilitar el botón y actualizar el total pendiente cuando se seleccionan facturas
document.addEventListener('change', function (event) {
    if (event.target.classList.contains('factura-checkbox')) {
        const index = event.target.dataset.index;
        const saldoPendiente = parseFloat(event.target.dataset.monto);
        
        if (event.target.checked) {
            facturasSeleccionadas.push({ index, saldoPendiente });
        } else {
            facturasSeleccionadas = facturasSeleccionadas.filter(factura => factura.index !== index);
        }

        // Actualizar el total pendiente seleccionado
        actualizarTotalPendiente();

        // Habilitar el botón si hay al menos una factura seleccionada
        document.getElementById('aplicar-pago').disabled = facturasSeleccionadas.length === 0;
    }
});

// Función para validar el monto de pago
function validarPago() {
    const montoTotal = parseFloat(document.getElementById('monto').value);
    const bancoSeleccionado = document.getElementById('banco').value;

    // Verificar si el monto y el banco son válidos
    if (isNaN(montoTotal) || montoTotal <= 0) {
        Swal.fire('Error', 'Por favor ingrese un monto válido.', 'error');
        return false;
    }

    if (bancoSeleccionado === "") {
        Swal.fire('Error', 'Por favor seleccione un banco.', 'error');
        return false;
    }

    return true;
}

// Aplicar pagos a las facturas seleccionadas
document.getElementById('aplicar-pago').addEventListener('click', function () {
    if (!validarPago()) return;

    const montoTotal = parseFloat(document.getElementById('monto').value);
    const fechaPago = document.getElementById('fecha').value;
    const numeroBoleta = document.getElementById('numero-boleta').value;
    const bancoSeleccionado = document.getElementById('banco').value;

    if (!fechaPago || !numeroBoleta || bancoSeleccionado === "") {
        Swal.fire('Error', 'Por favor complete todos los campos: fecha, número de boleta y banco.', 'error');
        return;
    }

    let montoRestante = montoTotal;
    const pagos = [];

    // Para múltiples pagos en varias facturas
    facturasSeleccionadas.forEach(facturaSeleccionada => {
        const factura = facturas[facturaSeleccionada.index];
        let pagoAplicado = 0;

        // Aplicar solo lo que se puede al saldo pendiente de cada factura
        if (montoRestante >= factura.saldoPendiente) {
            pagoAplicado = factura.saldoPendiente;
            montoRestante -= factura.saldoPendiente;
            factura.saldoPendiente = 0;
            factura.estado = 'Pagada';
        } else {
            pagoAplicado = montoRestante;
            factura.saldoPendiente -= montoRestante;
            montoRestante = 0;
            factura.estado = 'Pendiente';
        }

        // Agregar la boleta, banco y el monto aplicado a la factura
        factura.boletas.push({
            boletaId: numeroBoleta,
            monto: parseFloat(pagoAplicado), // Asegurarse de que el monto sea numérico
            fecha: fechaPago,
            banco: bancoSeleccionado
        });

        pagos.push({
            facturaId: factura.numeroFactura,
            monto: pagoAplicado,
            banco: bancoSeleccionado,
            fecha: fechaPago
        });

        // Actualizar el DOM con el nuevo saldo
        document.getElementById(`saldo-${facturaSeleccionada.index}`).innerText = `Q${factura.saldoPendiente.toFixed(2)}`;
        document.getElementById(`estado-${facturaSeleccionada.index}`).innerText = factura.estado;

        // Actualizar el color de la fila según el nuevo estado
        const row = document.querySelector(`tr td input[data-index="${facturaSeleccionada.index}"]`).parentElement.parentElement;
        row.classList.remove('sin-pago', 'pendiente', 'pagada');
        if (factura.saldoPendiente === 0) {
            row.classList.add('pagada');  // Verde
        } else if (factura.saldoPendiente > 0 && factura.boletas.length > 0) {
            row.classList.add('pendiente');  // Amarillo
        } else {
            row.classList.add('sin-pago');  // Rojo
        }

        document.getElementById(`boleta-${facturaSeleccionada.index}`).innerText = factura.boletas.map(boleta => boleta.boletaId).join(', ');
        document.getElementById(`ver-pago-${facturaSeleccionada.index}`).disabled = false;
    });

    // Mostrar notificación de éxito usando SweetAlert
    Swal.fire({
        title: '¡Pago aplicado con éxito!',
        text: `Fecha: ${fechaPago}, Número de Boleta: ${numeroBoleta}, Banco: ${bancoSeleccionado}`,
        icon: 'success',
        confirmButtonText: 'Aceptar'
    });

    // Limpiar el formulario
    document.getElementById('monto').value = '';
    document.getElementById('fecha').value = '';
    document.getElementById('numero-boleta').value = '';
    document.getElementById('banco').value = '';

    // Deshabilitar el botón de aplicar pago
    document.getElementById('aplicar-pago').disabled = true;

    // Desmarcar todas las casillas
    const checkboxes = document.querySelectorAll('.factura-checkbox');
    checkboxes.forEach(checkbox => checkbox.checked = false);

    // Limpiar la lista de facturas seleccionadas
    facturasSeleccionadas = [];

    // Actualizar el total pendiente a 0
    actualizarTotalPendiente();
});

// Función para ver los detalles del pago realizado
function verPago(index) {
    const factura = facturas[index];
    const modal = document.getElementById('modal');
    const detallesPago = document.getElementById('detalles-pago');

    if (factura.boletas.length > 0) {
        const boletasDetalles = factura.boletas.map(boleta => `
            <strong>Boleta ID:</strong> ${boleta.boletaId}<br>
            <strong>Monto Pagado:</strong> Q${boleta.monto.toFixed(2)}<br>
            <strong>Banco:</strong> ${boleta.banco}<br>
            <strong>Fecha de Pago:</strong> ${boleta.fecha}
        `).join('<hr>');
        
        detallesPago.innerHTML = boletasDetalles;
        modal.style.display = 'flex';
    }
}

// Cerrar el modal cuando se haga clic en la "x"
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

// Función para generar el reporte con facturas y boletas asociadas
function generarReporte() {
    const reporteContenido = document.getElementById('reporte-contenido');
    reporteContenido.innerHTML = '';

    facturas.forEach((factura, index) => {
        if (factura.boletas.length > 0) {
            const rowCount = factura.boletas.length;

            // Fila para la factura y primera boleta
            const filaFactura = document.createElement('tr');
            filaFactura.innerHTML = `
                <td rowspan="${rowCount}">${factura.sucursal}</td>
                <td rowspan="${rowCount}">${factura.fechaFactura}</td>
                <td rowspan="${rowCount}">${factura.numeroFactura}</td>
                <td rowspan="${rowCount}">Q${factura.monto.toFixed(2)}</td>
                <td rowspan="${rowCount}">Q${factura.saldoPendiente.toFixed(2)}</td>
                <td rowspan="${rowCount}">${factura.estado}</td>
                <td rowspan="${rowCount}">${factura.vence}</td>
                <td>${factura.boletas[0].boletaId}</td>
                <td>${factura.boletas[0].fecha}</td>
                <td>Q${factura.boletas[0].monto.toFixed(2)}</td>
                <td>${factura.boletas[0].banco}</td>
            `;
            reporteContenido.appendChild(filaFactura);

            // Filas para las siguientes boletas de la misma factura
            for (let i = 1; i < rowCount; i++) {
                const filaBoleta = document.createElement('tr');
                filaBoleta.innerHTML = `
                    <td>${factura.boletas[i].boletaId}</td>
                    <td>${factura.boletas[i].fecha}</td>
                    <td>Q${factura.boletas[i].monto.toFixed(2)}</td>
                    <td>${factura.boletas[i].banco}</td>
                `;
                reporteContenido.appendChild(filaBoleta);
            }
        } else {
            // Si la factura no tiene boletas
            const filaFactura = document.createElement('tr');
            filaFactura.innerHTML = `
                <td>${factura.sucursal}</td>
                <td>${factura.fechaFactura}</td>
                <td>${factura.numeroFactura}</td>
                <td>Q${factura.monto.toFixed(2)}</td>
                <td>Q${factura.saldoPendiente.toFixed(2)}</td>
                <td>${factura.estado}</td>
                <td>${factura.vence}</td>
                <td colspan="4">Sin boletas</td>
            `;
            reporteContenido.appendChild(filaFactura);
        }
    });

    document.getElementById('reporte-section').style.display = 'block';
}

// Añadir el evento de clic para generar el reporte
document.getElementById('generar-reporte').addEventListener('click', generarReporte);

// Inicializar la tabla de facturas al cargar la página
window.onload = renderFacturas;
