let selectedFacturaId = null;

function selectFactura(id, row) {
    const previouslySelected = document.querySelector('tr.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
    }

    if (selectedFacturaId === id) {
        selectedFacturaId = null;
        disableActionButtons();
    } else {
        selectedFacturaId = id;
        row.classList.add('selected');
        enableActionButtons();
    }
}

function enableActionButtons() {
    document.getElementById('editButton').disabled = false;
    document.getElementById('deleteButton').disabled = false;
    document.getElementById('viewButton').disabled = false;
    document.getElementById('paymentButton').disabled = false;
}

function disableActionButtons() {
    document.getElementById('editButton').disabled = true;
    document.getElementById('deleteButton').disabled = true;
    document.getElementById('viewButton').disabled = true;
    document.getElementById('paymentButton').disabled = true;
}

async function loadFacturas() {
    try {
        var facturasSnapshot = await db.collection('facturas').get();
        var facturasTableBody = document.getElementById('facturasTable').getElementsByTagName('tbody')[0];
        facturasTableBody.innerHTML = '';

        var empresasSnapshot = await db.collection('empresas').get();
        var sucursalesSnapshot = await db.collection('sucursales').get();
        var proveedoresSnapshot = await db.collection('providers').get();

        var empresasMap = new Map();
        var sucursalesMap = new Map();
        var proveedoresMap = new Map();

        empresasSnapshot.forEach(function(doc) {
            empresasMap.set(doc.id, doc.data().name);
        });

        sucursalesSnapshot.forEach(function(doc) {
            sucursalesMap.set(doc.id, doc.data().name);
        });

        proveedoresSnapshot.forEach(function(doc) {
            proveedoresMap.set(doc.id, doc.data().name);
        });

        facturasSnapshot.forEach(function(doc) {
            let factura = doc.data();
            let empresaName = empresasMap.get(factura.empresaId) || 'Empresa no encontrada';
            let sucursalName = sucursalesMap.get(factura.sucursalId) || 'Sucursal no encontrada';
            let proveedorName = proveedoresMap.get(factura.proveedorId) || 'Proveedor no encontrado';

            let montoPendiente = factura.montoTotal - (factura.pagosTotal || 0);

            let row = facturasTableBody.insertRow();
            row.onclick = () => selectFactura(doc.id, row);

            row.insertCell(0).textContent = factura.numero;
            row.insertCell(1).textContent = empresaName;
            row.insertCell(2).textContent = sucursalName;
            row.insertCell(3).textContent = proveedorName;
            row.insertCell(4).textContent = factura.fechaEmision;
            row.insertCell(5).textContent = factura.fechaVencimiento;
            row.insertCell(6).textContent = `Q${factura.montoTotal}`;
            row.insertCell(7).textContent = factura.estadoPago;
            row.insertCell(8).textContent = `Q${montoPendiente}`;
        });

        disableActionButtons(); // Desactiva los botones hasta que se seleccione una factura

    } catch (error) {
        console.error('Error al cargar facturas:', error);
        alert('Error al cargar facturas: ' + error.message);
    }
}

async function loadProveedorCreditDays(proveedorId) {
    try {
        const proveedorDoc = await db.collection('providers').doc(proveedorId).get();
        if (proveedorDoc.exists) {
            const proveedor = proveedorDoc.data();
            const creditDays = proveedor.creditDays || 0; // Obtener los días de crédito o usar 0 si no está definido
            document.getElementById('creditDays').value = creditDays; // Mostrar días de crédito en la interfaz
            return creditDays;
        } else {
            throw new Error('Proveedor no encontrado');
        }
    } catch (error) {
        console.error('Error al cargar días de crédito del proveedor:', error);
        alert('Error al cargar días de crédito del proveedor: ' + error.message);
        return 0;
    }
}

function calculateVencimiento(fechaEmision, creditDays) {
    const fecha = new Date(fechaEmision);
    fecha.setDate(fecha.getDate() + parseInt(creditDays, 10));
    return fecha.toISOString().split('T')[0]; // Retorna la fecha en formato 'YYYY-MM-DD'
}

document.getElementById('facturaFechaEmision').addEventListener('change', async function() {
    const proveedorId = document.getElementById('proveedorSelect').value;
    if (proveedorId) {
        const creditDays = await loadProveedorCreditDays(proveedorId);
        const fechaEmision = document.getElementById('facturaFechaEmision').value;
        const fechaVencimiento = calculateVencimiento(fechaEmision, creditDays);
        document.getElementById('facturaFechaVencimiento').value = fechaVencimiento;
        validateFechaVencimiento(fechaEmision, fechaVencimiento, creditDays);
    } else {
        alert('Por favor, selecciona primero un proveedor.');
    }
});

function validateFechaVencimiento(fechaEmision, fechaVencimiento, creditDays) {
    const fechaEmisionDate = new Date(fechaEmision);
    const fechaVencimientoDate = new Date(fechaVencimiento);
    const diasCalculados = Math.floor((fechaVencimientoDate - fechaEmisionDate) / (1000 * 60 * 60 * 24));
    
    const warningElement = document.getElementById('vencimientoWarning');
    
    if (diasCalculados !== creditDays) {
        warningElement.style.display = 'block';
        warningElement.textContent = `Advertencia: La fecha de vencimiento calculada (${fechaVencimiento}) no coincide con los ${creditDays} días de crédito. Verifica la fecha.`;
    } else {
        warningElement.style.display = 'none';
    }
}

async function loadProveedoresSelectOptions(proveedorSelectId) {
    try {
        const proveedoresSnapshot = await db.collection('providers').get();
        const proveedorSelect = document.getElementById(proveedorSelectId);
        proveedorSelect.innerHTML = '<option value="">Selecciona un Proveedor</option>';

        proveedoresSnapshot.forEach(function(doc) {
            const proveedor = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = proveedor.name;
            proveedorSelect.appendChild(option);
        });

        proveedorSelect.addEventListener('change', async function() {
            const proveedorId = proveedorSelect.value;
            if (proveedorId) {
                const creditDays = await loadProveedorCreditDays(proveedorId);
                const fechaEmision = document.getElementById('facturaFechaEmision').value;
                if (fechaEmision) {
                    const fechaVencimiento = calculateVencimiento(fechaEmision, creditDays);
                    document.getElementById('facturaFechaVencimiento').value = fechaVencimiento;
                    validateFechaVencimiento(fechaEmision, fechaVencimiento, creditDays);
                } else {
                    alert('Por favor, selecciona primero una fecha de emisión.');
                }
            }
        });

    } catch (error) {
        console.error('Error al cargar opciones de proveedores:', error);
        alert('Error al cargar opciones de proveedores: ' + error.message);
    }
}

async function addFactura() {
    try {
        // Obtener los valores de los campos
        const facturaNumero = document.getElementById('facturaNumero').value;
        const empresaId = document.getElementById('empresaSelect').value;
        const sucursalId = document.getElementById('sucursalSelect').value;
        const proveedorId = document.getElementById('proveedorSelect').value;
        const fechaEmision = document.getElementById('facturaFechaEmision').value;
        const fechaVencimiento = document.getElementById('facturaFechaVencimiento').value;
        const montoTotal = document.getElementById('facturaMontoTotal').value;

        // Validar fechas
        if (new Date(fechaVencimiento) <= new Date(fechaEmision)) {
            alert('La fecha de vencimiento debe ser posterior a la fecha de emisión.');
            return;
        }

        // Lógica existente para agregar la factura...
        // ...

    } catch (error) {
        console.error('Error al agregar factura:', error);
        alert('Error al agregar factura: ' + error.message);
    }
}

function openEditFacturaModal() {
    if (selectedFacturaId) {
        db.collection('facturas').doc(selectedFacturaId).get().then(function(doc) {
            if (doc.exists) {
                var factura = doc.data();
                document.getElementById('editFacturaId').value = selectedFacturaId;
                document.getElementById('editFacturaNumero').value = factura.numero;
                loadEmpresasSelectOptions('editEmpresaSelect', 'editSucursalSelect').then(function() {
                    document.getElementById('editEmpresaSelect').value = factura.empresaId;
                    loadSucursalesSelectOptions('editSucursalSelect', factura.empresaId).then(function() {
                        document.getElementById('editSucursalSelect').value = factura.sucursalId;
                    });
                });
                loadProveedoresSelectOptions('editProveedorSelect').then(function() {
                    document.getElementById('editProveedorSelect').value = factura.proveedorId;
                });
                document.getElementById('editFacturaFechaEmision').value = factura.fechaEmision;
                document.getElementById('editFacturaFechaVencimiento').value = factura.fechaVencimiento;
                document.getElementById('editFacturaMontoTotal').value = factura.montoTotal;
                document.getElementById('editFacturaEstadoPago').value = factura.estadoPago;
                document.getElementById('editFacturaDescuentos').value = factura.descuentos;
                document.getElementById('editFacturaMontoNeto').value = factura.montoNeto;
                document.getElementById('editFacturaMetodoPago').value = factura.metodoPago;
                document.getElementById('editFacturaNotas').value = factura.notasAdicionales;
                openModal('editFacturaModal');
            } else {
                alert('Factura no encontrada');
            }
        }).catch(function(error) {
            console.error('Error al obtener factura:', error);
            alert('Error al obtener factura: ' + error.message);
        });
    }
}

function openViewFacturaModal() {
    if (selectedFacturaId) {
        db.collection('facturas').doc(selectedFacturaId).get().then(async function(doc) {
            if (doc.exists) {
                const factura = doc.data();

                const empresaDoc = await db.collection('empresas').doc(factura.empresaId).get();
                const empresaName = empresaDoc.exists ? empresaDoc.data().name : 'Empresa no encontrada';

                const sucursalDoc = await db.collection('sucursales').doc(factura.sucursalId).get();
                const sucursalName = sucursalDoc.exists ? sucursalDoc.data().name : 'Sucursal no encontrada';

                const proveedorDoc = await db.collection('providers').doc(factura.proveedorId).get();
                const proveedorName = proveedorDoc.exists ? proveedorDoc.data().name : 'Proveedor no encontrado';

                document.getElementById('facturaNumero').textContent = factura.numero;
                document.getElementById('empresaName').textContent = empresaName;
                document.getElementById('sucursalName').textContent = sucursalName;
                document.getElementById('proveedorName').textContent = proveedorName;
                document.getElementById('fechaEmision').textContent = factura.fechaEmision;
                document.getElementById('fechaVencimiento').textContent = factura.fechaVencimiento;
                document.getElementById('montoTotal').textContent = `Q${factura.montoTotal}`;
                document.getElementById('estadoPago').textContent = factura.estadoPago;
                document.getElementById('montoPendiente').textContent = `Q${factura.montoTotal - (factura.pagosTotal || 0)}`;
                document.getElementById('notasAdicionales').textContent = factura.notasAdicionales;

                // Mostrar los pagos realizados
                displayPagos(factura.pagos);

                openModal('viewFacturaModal');
            } else {
                alert('Factura no encontrada');
            }
        }).catch(function(error) {
            console.error('Error al obtener los detalles de la factura:', error);
            alert('Error al obtener los detalles de la factura: ' + error.message);
        });
    }
}

function openAddPaymentModal() {
    if (selectedFacturaId) {
        db.collection('facturas').doc(selectedFacturaId).get().then((doc) => {
            if (doc.exists) {
                const factura = doc.data();
                montoPendiente = factura.montoTotal - (factura.pagosTotal || 0);
                openModal('addPaymentModal');
            } else {
                alert('Factura no encontrada');
            }
        }).catch((error) => {
            console.error('Error al obtener la factura:', error);
            alert('Error al obtener la factura: ' + error.message);
        });
    }
}

function deleteFactura() {
    if (selectedFacturaId) {
        if (confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
            db.collection('facturas').doc(selectedFacturaId).delete()
                .then(() => {
                    loadFacturas();
                    selectedFacturaId = null;
                    disableActionButtons();
                    alert('Factura eliminada con éxito');
                })
                .catch((error) => {
                    console.error('Error al eliminar factura:', error);
                    alert('Error al eliminar factura: ' + error.message);
                });
        }
    }
}

function filterFacturas() {
    var numero = document.getElementById('searchNumero').value.toUpperCase();
    var proveedor = document.getElementById('searchProveedor').value.toUpperCase();
    var empresa = document.getElementById('searchEmpresa').value.toUpperCase();
    var sucursal = document.getElementById('searchSucursal').value.toUpperCase();
    var table = document.getElementById('facturasTable');
    var tr = table.getElementsByTagName('tr');

    for (var i = 1; i < tr.length; i++) {
        var tdNumero = tr[i].getElementsByTagName('td')[0];
        var tdEmpresa = tr[i].getElementsByTagName('td')[1];
        var tdSucursal = tr[i].getElementsByTagName('td')[2];
        var tdProveedor = tr[i].getElementsByTagName('td')[3];
        if (tdNumero && tdEmpresa && tdSucursal && tdProveedor) {
            var txtNumero = tdNumero.textContent || tdNumero.innerText;
            var txtEmpresa = tdEmpresa.textContent || tdEmpresa.innerText;
            var txtSucursal = tdSucursal.textContent || tdSucursal.innerText;
            var txtProveedor = tdProveedor.textContent || tdProveedor.innerText;

            if (txtNumero.toUpperCase().indexOf(numero) > -1 && 
                txtEmpresa.toUpperCase().indexOf(empresa) > -1 &&
                txtSucursal.toUpperCase().indexOf(sucursal) > -1 &&
                txtProveedor.toUpperCase().indexOf(proveedor) > -1) {
                tr[i].style.display = '';
            } else {
                tr[i].style.display = 'none';
            }
        }       
    }
}

function sortFacturasByDate() {
    var order = document.getElementById('dateOrder').value;
    var table = document.getElementById('facturasTable');
    var rows = Array.from(table.rows).slice(1);

    rows.sort(function (a, b) {
        var dateA = new Date(a.cells[4].innerText);
        var dateB = new Date(b.cells[4].innerText);

        if (order === 'oldest') {
            return dateA - dateB;
        } else if (order === 'newest') {
            return dateB - dateA;
        } else if (order === 'closestToDue') {
            var dueDateA = new Date(a.cells[5].innerText);
            var dueDateB = new Date(b.cells[5].innerText);
            return dueDateA - dueDateB;
        }
    });

    rows.forEach(function (row) {
        table.appendChild(row);
    });
}

async function loadEmpresasSelectOptions(empresaSelectId, sucursalSelectId) {
    try {
        var empresasSnapshot = await db.collection('empresas').get();
        var empresaSelect = document.getElementById(empresaSelectId);
        var sucursalSelect = document.getElementById(sucursalSelectId);
        empresaSelect.innerHTML = '<option value="">Selecciona una Empresa</option>';
        sucursalSelect.innerHTML = '<option value="">Selecciona una Sucursal</option>';

        empresasSnapshot.forEach(function(doc) {
            var empresa = doc.data();
            var option = document.createElement('option');
            option.value = doc.id;
            option.textContent = empresa.name;
            empresaSelect.appendChild(option);
        });

        empresaSelect.addEventListener('change', function() {
            loadSucursalesSelectOptions(sucursalSelectId, empresaSelect.value);
        });

    } catch (error) {
        console.error('Error al cargar opciones de empresas:', error);
        alert('Error al cargar opciones de empresas: ' + error.message);
    }
}

async function loadSucursalesSelectOptions(sucursalSelectId, empresaId) {
    try {
        var sucursalesSnapshot = await db.collection('sucursales').where('empresaId', '==', empresaId).get();
        var sucursalSelect = document.getElementById(sucursalSelectId);
        sucursalSelect.innerHTML = '<option value="">Selecciona una Sucursal</option>';

        sucursalesSnapshot.forEach(function(doc) {
            var sucursal = doc.data();
            var option = document.createElement('option');
            option.value = doc.id;
            option.textContent = sucursal.name;
            sucursalSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar opciones de sucursales:', error);
        alert('Error al cargar opciones de sucursales: ' + error.message);
    }
}

async function loadProveedoresSelectOptions(proveedorSelectId) {
    try {
        var proveedoresSnapshot = await db.collection('providers').get();
        var proveedorSelect = document.getElementById(proveedorSelectId);
        proveedorSelect.innerHTML = '<option value="">Selecciona un Proveedor</option>';

        proveedoresSnapshot.forEach(function(doc) {
            var proveedor = doc.data();
            var option = document.createElement('option');
            option.value = doc.id;
            option.textContent = proveedor.name;
            proveedorSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar opciones de proveedores:', error);
        alert('Error al cargar opciones de proveedores: ' + error.message);
    }
}

function displayPagos(pagos) {
    const pagosList = document.getElementById('pagosList');
    pagosList.innerHTML = ''; // Limpiar la lista de pagos
    if (pagos && pagos.length > 0) {
        pagos.forEach(pago => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="payment-date">Fecha: ${pago.fecha}</span>
                <span class="payment-method">Método: ${pago.metodoPago}</span>
                <span class="payment-amount">Monto: Q${pago.monto}</span>
            `;
            pagosList.appendChild(li);
        });
    } else {
        pagosList.innerHTML = '<li>No se encontraron pagos realizados.</li>';
    }
}

window.onload = loadFacturas;
