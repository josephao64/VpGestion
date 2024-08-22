// facturas.js

let selectedFacturaId = null;
let creditDays = 0;

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

        empresasSnapshot.forEach(doc => {
            empresasMap.set(doc.id, doc.data().name);
        });

        sucursalesSnapshot.forEach(doc => {
            sucursalesMap.set(doc.id, doc.data().name);
        });

        proveedoresSnapshot.forEach(doc => {
            proveedoresMap.set(doc.id, doc.data().name);
        });

        facturasSnapshot.forEach(doc => {
            const factura = doc.data();
            const empresaName = empresasMap.get(factura.empresaId) || 'Empresa no encontrada';
            const sucursalName = sucursalesMap.get(factura.sucursalId) || 'Sucursal no encontrada';
            const proveedorName = proveedoresMap.get(factura.proveedorId) || 'Proveedor no encontrado';

            const montoPendiente = factura.montoTotal - (factura.pagosTotal || 0);

            const row = facturasTableBody.insertRow();
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

async function addFactura() {
    try {
        const facturaNumero = document.getElementById('facturaNumero').value;
        const empresaId = document.getElementById('empresaSelect').value;
        const sucursalId = document.getElementById('sucursalSelect').value;
        const proveedorId = document.getElementById('proveedorSelect').value;
        const facturaFechaEmision = document.getElementById('facturaFechaEmision').value;
        const facturaFechaVencimiento = document.getElementById('facturaFechaVencimiento').value;
        const facturaMontoTotal = document.getElementById('facturaMontoTotal').value;
        const facturaEstadoPago = document.getElementById('facturaEstadoPago').value;
        const facturaArchivo = document.getElementById('facturaArchivo').files[0];
        const facturaDescuentos = document.getElementById('facturaDescuentos').value;
        const facturaMontoNeto = document.getElementById('facturaMontoNeto').value;
        const facturaMetodoPago = document.getElementById('facturaMetodoPago').value;
        const facturaNotas = document.getElementById('facturaNotas').value;

        if (!facturaNumero || !empresaId || !sucursalId || !proveedorId || !facturaFechaEmision || !facturaMontoTotal) {
            throw new Error('Todos los campos son obligatorios.');
        }

        let facturaData = {
            numero: facturaNumero,
            empresaId: empresaId,
            sucursalId: sucursalId,
            proveedorId: proveedorId,
            fechaEmision: facturaFechaEmision,
            fechaVencimiento: facturaFechaVencimiento,
            montoTotal: parseFloat(facturaMontoTotal),
            estadoPago: facturaEstadoPago,
            descuentos: parseFloat(facturaDescuentos) || 0,
            montoNeto: parseFloat(facturaMontoNeto) || parseFloat(facturaMontoTotal),
            metodoPago: facturaMetodoPago,
            notasAdicionales: facturaNotas,
            pagosTotal: 0
        };

        if (facturaArchivo) {
            const storageRef = firebase.storage().ref();
            const archivoRef = storageRef.child(`facturas/${facturaNumero}/${facturaArchivo.name}`);
            await archivoRef.put(facturaArchivo);
            facturaData.archivoURL = await archivoRef.getDownloadURL();
        }

        await db.collection('facturas').add(facturaData);
        closeModal('addFacturaModal');
        loadFacturas();
        alert('Factura agregada con éxito');
    } catch (error) {
        console.error('Error al agregar factura:', error);
        alert('Error al agregar factura: ' + error.message);
    }
}

function calculateDueDate(mode = 'add') {
    const fechaEmisionInput = document.getElementById(`${mode === 'add' ? 'facturaFechaEmision' : 'editFacturaFechaEmision'}`);
    const fechaVencimientoInput = document.getElementById(`${mode === 'add' ? 'facturaFechaVencimiento' : 'editFacturaFechaVencimiento'}`);
    
    const fechaEmision = new Date(fechaEmisionInput.value);

    if (!isNaN(fechaEmision.getTime()) && creditDays > 0) {
        fechaEmision.setDate(fechaEmision.getDate() + creditDays);

        // Ajusta la fecha de vencimiento al formato yyyy-mm-dd
        const day = String(fechaEmision.getDate()).padStart(2, '0');
        const month = String(fechaEmision.getMonth() + 1).padStart(2, '0');
        const year = fechaEmision.getFullYear();

        fechaVencimientoInput.value = `${year}-${month}-${day}`;
    }
}

async function loadCreditDays(mode = 'add') {
    const proveedorId = document.getElementById(`${mode === 'add' ? 'proveedorSelect' : 'editProveedorSelect'}`).value;
    if (proveedorId) {
        const proveedorDoc = await db.collection('providers').doc(proveedorId).get();
        if (proveedorDoc.exists) {
            creditDays = proveedorDoc.data().creditDays || 0;
            document.getElementById(`${mode === 'add' ? 'creditDaysInfo' : 'editCreditDaysInfo'}`).textContent = `Días de Crédito: ${creditDays}`;
            calculateDueDate(mode);
        }
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
}

function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files.length) {
        document.getElementById('facturaArchivo').files = files;
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
                    loadCreditDays('edit');
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

window.onload = function() {
    loadFacturas();
};

function loadEmpresasSelectOptions(empresaSelectId, sucursalSelectId) {
    return db.collection('empresas').get().then(snapshot => {
        const empresaSelect = document.getElementById(empresaSelectId);
        empresaSelect.innerHTML = '<option value="">Selecciona una Empresa</option>';
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name;
            empresaSelect.appendChild(option);
        });
        document.getElementById(empresaSelectId).addEventListener('change', function() {
            loadSucursalesSelectOptions(sucursalSelectId, this.value);
        });
    }).catch(error => {
        console.error('Error al cargar empresas:', error);
        alert('Error al cargar empresas: ' + error.message);
    });
}

function loadSucursalesSelectOptions(sucursalSelectId, empresaId) {
    return db.collection('sucursales').where('empresaId', '==', empresaId).get().then(snapshot => {
        const sucursalSelect = document.getElementById(sucursalSelectId);
        sucursalSelect.innerHTML = '<option value="">Selecciona una Sucursal</option>';
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name;
            sucursalSelect.appendChild(option);
        });
    }).catch(error => {
        console.error('Error al cargar sucursales:', error);
        alert('Error al cargar sucursales: ' + error.message);
    });
}

function loadProveedoresSelectOptions(proveedorSelectId) {
    return db.collection('providers').get().then(snapshot => {
        const proveedorSelect = document.getElementById(proveedorSelectId);
        proveedorSelect.innerHTML = '<option value="">Selecciona un Proveedor</option>';
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name;
            proveedorSelect.appendChild(option);
        });
    }).catch(error => {
        console.error('Error al cargar proveedores:', error);
        alert('Error al cargar proveedores: ' + error.message);
    });
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
        const dateA = new Date(a.cells[4].innerText);
        const dateB = new Date(b.cells[4].innerText);

        if (order === 'oldest') {
            return dateA - dateB;
        } else if (order === 'newest') {
            return dateB - dateA;
        } else if (order === 'closestToDue') {
            const dueDateA = new Date(a.cells[5].innerText);
            const dueDateB = new Date(b.cells[5].innerText);
            return dueDateA - dueDateB;
        }
    });

    rows.forEach(function (row) {
        table.appendChild(row);
    });
}
