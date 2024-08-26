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
        const facturasSnapshot = await db.collection('facturas').get();
        const facturasTableBody = document.getElementById('facturasTable').getElementsByTagName('tbody')[0];
        facturasTableBody.innerHTML = '';

        const empresasSnapshot = await db.collection('empresas').get();
        const sucursalesSnapshot = await db.collection('sucursales').get();
        const proveedoresSnapshot = await db.collection('providers').get();

        const empresasMap = new Map();
        const sucursalesMap = new Map();
        const proveedoresMap = new Map();

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
            row.setAttribute('data-id', doc.id);
            row.onclick = () => selectFactura(doc.id, row);
            row.ondblclick = () => openViewFacturaModal(); // Abrir detalles al hacer doble clic

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

async function openViewFacturaModal() {
    if (selectedFacturaId) {
        try {
            const doc = await db.collection('facturas').doc(selectedFacturaId).get();
            if (doc.exists) {
                const factura = doc.data();

                const empresaDoc = await db.collection('empresas').doc(factura.empresaId).get();
                const empresaName = empresaDoc.exists ? empresaDoc.data().name : 'Empresa no encontrada';

                const sucursalDoc = await db.collection('sucursales').doc(factura.sucursalId).get();
                const sucursalName = sucursalDoc.exists ? sucursalDoc.data().name : 'Sucursal no encontrada';

                const proveedorDoc = await db.collection('providers').doc(factura.proveedorId).get();
                const proveedorName = proveedorDoc.exists ? proveedorDoc.data().name : 'Proveedor no encontrado';

                const cuentaProveedorSnapshot = await db.collection('cuentasProveedores').where('proveedorId', '==', factura.proveedorId).get();
                let cuentaProveedor = 'No disponible';
                let tipoCuentaProveedor = 'No disponible';
                let bancoProveedor = 'No disponible';
                if (!cuentaProveedorSnapshot.empty) {
                    const cuentaDoc = cuentaProveedorSnapshot.docs[0].data();
                    cuentaProveedor = cuentaDoc.numeroCuenta;
                    tipoCuentaProveedor = cuentaDoc.tipoCuenta;
                    bancoProveedor = cuentaDoc.banco;
                }

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

                // Mostrar los detalles en el cuadro de detalles adicionales
                document.getElementById('cuadroEmpresaName').textContent = empresaName;
                document.getElementById('cuadroProveedorName').textContent = proveedorName;
                document.getElementById('cuadroSucursalName').textContent = sucursalName;
                document.getElementById('cuadroMontoPendiente').textContent = `Q${factura.montoTotal - (factura.pagosTotal || 0)}`;
                document.getElementById('cuadroCuentaProveedor').textContent = cuentaProveedor;
                document.getElementById('cuadroTipoCuentaProveedor').textContent = tipoCuentaProveedor;
                document.getElementById('cuadroCuentaProveedorBanco').textContent = bancoProveedor;

                openModal('viewFacturaModal');
            } else {
                alert('Factura no encontrada');
            }
        } catch (error) {
            console.error('Error al obtener los detalles de la factura:', error);
            alert('Error al obtener los detalles de la factura: ' + error.message);
        }
    }
}

async function addFactura() {
    try {
        const facturaNumero = document.getElementById('facturaNumero').value.trim();
        const empresaId = document.getElementById('empresaSelect').value;
        const sucursalId = document.getElementById('sucursalSelect').value;
        const proveedorId = document.getElementById('proveedorSelect').value;
        const fechaEmision = document.getElementById('facturaFechaEmision').value;
        const fechaVencimiento = document.getElementById('facturaFechaVencimiento').value;
        const montoTotal = parseFloat(document.getElementById('facturaMontoTotal').value);
        const estadoPago = document.getElementById('facturaEstadoPago').value;
        const facturaArchivo = document.getElementById('facturaArchivo').files[0];
        const descuentos = parseFloat(document.getElementById('facturaDescuentos').value) || 0;
        const montoNeto = parseFloat(document.getElementById('facturaMontoNeto').value) || montoTotal - descuentos;
        const metodoPago = document.getElementById('facturaMetodoPago').value;
        const notasAdicionales = document.getElementById('facturaNotas').value.trim();

        if (!facturaNumero || !empresaId || !sucursalId || !proveedorId || !fechaEmision || !fechaVencimiento || isNaN(montoTotal)) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        let archivoURL = '';
        if (facturaArchivo) {
            const storageRef = firebase.storage().ref();
            const archivoRef = storageRef.child(`facturas/${facturaArchivo.name}`);
            await archivoRef.put(facturaArchivo);
            archivoURL = await archivoRef.getDownloadURL();
        }

        const nuevaFactura = {
            numero: facturaNumero,
            empresaId: empresaId,
            sucursalId: sucursalId,
            proveedorId: proveedorId,
            fechaEmision: fechaEmision,
            fechaVencimiento: fechaVencimiento,
            montoTotal: montoTotal,
            estadoPago: estadoPago,
            archivoURL: archivoURL,
            descuentos: descuentos,
            montoNeto: montoNeto,
            metodoPago: metodoPago,
            notasAdicionales: notasAdicionales,
            pagosTotal: 0,
        };

        await db.collection('facturas').add(nuevaFactura);
        closeModal('addFacturaModal');
        loadFacturas();

        // Limpiar campos después de agregar la factura
        document.getElementById('facturaNumero').value = '';
        document.getElementById('empresaSelect').value = '';
        document.getElementById('sucursalSelect').value = '';
        document.getElementById('proveedorSelect').value = '';
        document.getElementById('facturaFechaEmision').value = '';
        document.getElementById('facturaFechaVencimiento').value = '';
        document.getElementById('facturaMontoTotal').value = '';
        document.getElementById('facturaEstadoPago').value = 'Pendiente';
        document.getElementById('facturaArchivo').value = '';
        document.getElementById('facturaDescuentos').value = '';
        document.getElementById('facturaMontoNeto').value = '';
        document.getElementById('facturaMetodoPago').value = 'Transferencia';
        document.getElementById('facturaNotas').value = '';

        alert('Factura agregada exitosamente.');

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
                document.getElementById('editFacturaDescuentos').value = factura.descuentos || 0;
                document.getElementById('editFacturaMontoNeto').value = factura.montoNeto || 0;
                document.getElementById('editFacturaMetodoPago').value = factura.metodoPago;
                document.getElementById('editFacturaNotas').value = factura.notasAdicionales || '';
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

async function updateFactura() {
    try {
        const facturaId = document.getElementById('editFacturaId').value;
        const facturaNumero = document.getElementById('editFacturaNumero').value.trim();
        const empresaId = document.getElementById('editEmpresaSelect').value;
        const sucursalId = document.getElementById('editSucursalSelect').value;
        const proveedorId = document.getElementById('editProveedorSelect').value;
        const fechaEmision = document.getElementById('editFacturaFechaEmision').value;
        const fechaVencimiento = document.getElementById('editFacturaFechaVencimiento').value;
        const montoTotal = parseFloat(document.getElementById('editFacturaMontoTotal').value);
        const estadoPago = document.getElementById('editFacturaEstadoPago').value;
        const descuentos = parseFloat(document.getElementById('editFacturaDescuentos').value) || 0;
        const montoNeto = parseFloat(document.getElementById('editFacturaMontoNeto').value) || montoTotal - descuentos;
        const metodoPago = document.getElementById('editFacturaMetodoPago').value;
        const notasAdicionales = document.getElementById('editFacturaNotas').value.trim();

        if (!facturaNumero || !empresaId || !sucursalId || !proveedorId || !fechaEmision || !fechaVencimiento || isNaN(montoTotal)) {
            alert('Por favor, completa todos los campos obligatorios.');
            return;
        }

        const facturaActualizada = {
            numero: facturaNumero,
            empresaId: empresaId,
            sucursalId: sucursalId,
            proveedorId: proveedorId,
            fechaEmision: fechaEmision,
            fechaVencimiento: fechaVencimiento,
            montoTotal: montoTotal,
            estadoPago: estadoPago,
            descuentos: descuentos,
            montoNeto: montoNeto,
            metodoPago: metodoPago,
            notasAdicionales: notasAdicionales
        };

        await db.collection('facturas').doc(facturaId).update(facturaActualizada);
        closeModal('editFacturaModal');
        loadFacturas();

        alert('Factura actualizada exitosamente.');

    } catch (error) {
        console.error('Error al actualizar factura:', error);
        alert('Error al actualizar factura: ' + error.message);
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
    const numero = document.getElementById('searchNumero').value.toUpperCase();
    const proveedor = document.getElementById('searchProveedor').value.toUpperCase();
    const empresa = document.getElementById('searchEmpresa').value.toUpperCase();
    const sucursal = document.getElementById('searchSucursal').value.toUpperCase();
    const table = document.getElementById('facturasTable');
    const tr = table.getElementsByTagName('tr');

    for (let i = 1; i < tr.length; i++) {
        const tdNumero = tr[i].getElementsByTagName('td')[0];
        const tdEmpresa = tr[i].getElementsByTagName('td')[1];
        const tdSucursal = tr[i].getElementsByTagName('td')[2];
        const tdProveedor = tr[i].getElementsByTagName('td')[3];
        if (tdNumero && tdEmpresa && tdSucursal && tdProveedor) {
            const txtNumero = tdNumero.textContent || tdNumero.innerText;
            const txtEmpresa = tdEmpresa.textContent || tdEmpresa.innerText;
            const txtSucursal = tdSucursal.textContent || tdSucursal.innerText;
            const txtProveedor = tdProveedor.textContent || tdProveedor.innerText;

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
    const order = document.getElementById('dateOrder').value;
    const table = document.getElementById('facturasTable');
    const rows = Array.from(table.rows).slice(1);

    rows.sort(function (a, b) {
        const dateA = new Date(a.cells[4].innerText); // Fecha de emisión
        const dateB = new Date(b.cells[4].innerText);

        if (order === 'oldest') {
            return dateA - dateB;
        } else if (order === 'newest') {
            return dateB - dateA;
        } else if (order === 'closestToDue') {
            const dueDateA = new Date(a.cells[5].innerText); // Fecha de vencimiento
            const dueDateB = new Date(b.cells[5].innerText);
            return dueDateA - dueDateB;
        }
    });

    rows.forEach(function (row) {
        table.appendChild(row);
    });
}

async function loadEmpresasSelectOptions(empresaSelectId, sucursalSelectId) {
    try {
        const empresasSnapshot = await db.collection('empresas').get();
        const empresaSelect = document.getElementById(empresaSelectId);
        const sucursalSelect = document.getElementById(sucursalSelectId);
        empresaSelect.innerHTML = '<option value="">Selecciona una Empresa</option>';
        sucursalSelect.innerHTML = '<option value="">Selecciona una Sucursal</option>';

        empresasSnapshot.forEach(function(doc) {
            const empresa = doc.data();
            const option = document.createElement('option');
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
        const sucursalesSnapshot = await db.collection('sucursales').where('empresaId', '==', empresaId).get();
        const sucursalSelect = document.getElementById(sucursalSelectId);
        sucursalSelect.innerHTML = '<option value="">Selecciona una Sucursal</option>';

        sucursalesSnapshot.forEach(function(doc) {
            const sucursal = doc.data();
            const option = document.createElement('option');
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
    } catch (error) {
        console.error('Error al cargar opciones de proveedores:', error);
        alert('Error al cargar opciones de proveedores: ' + error.message);
    }
}

function displayPagos(pagos) {
    const pagosList = document.getElementById('pagosList');
    pagosList.innerHTML = '';
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

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'block';
}

function exportarDetallesPagoImagen() {
    const detallesPagoContainer = document.getElementById('detallesPagoContainer');
    html2canvas(detallesPagoContainer).then(canvas => {
        const link = document.createElement('a');
        link.download = 'detalles_pago.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

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

window.onload = loadFacturas;
