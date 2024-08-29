// Funciones de ayuda reutilizables

function actualizarFechaVencimiento(fechaEmision, creditDays) {
    if (fechaEmision) {
        const fecha = new Date(fechaEmision);
        fecha.setDate(fecha.getDate() + creditDays);
        const fechaVencimiento = fecha.toISOString().split('T')[0];
        document.getElementById('facturaFechaVencimiento').value = fechaVencimiento;
    }
}

document.getElementById('facturaFechaEmision').addEventListener('change', function() {
    const fechaEmision = this.value;
    const creditDays = parseInt(document.getElementById('creditDays').value) || 0;
    actualizarFechaVencimiento(fechaEmision, creditDays);
});

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

        proveedorSelect.addEventListener('change', async function() {
            const proveedorId = this.value;
            if (proveedorId) {
                try {
                    const proveedorDoc = await db.collection('providers').doc(proveedorId).get();
                    if (proveedorDoc.exists) {
                        const creditDays = parseInt(proveedorDoc.data().creditDays) || 0;
                        document.getElementById('creditDays').value = creditDays;

                        const fechaEmision = document.getElementById('facturaFechaEmision').value;
                        if (fechaEmision) {
                            actualizarFechaVencimiento(fechaEmision, creditDays);
                        }
                    }
                } catch (error) {
                    console.error('Error al obtener los datos del proveedor:', error);
                }
            }
        });
    } catch (error) {
        console.error('Error al cargar opciones de proveedores:', error);
        alert('Error al cargar opciones de proveedores: ' + error.message);
    }
}
