document.addEventListener("DOMContentLoaded", function() {
    loadEmpresasSelectOptions();
    loadCuentasEmpresas();
    loadCuentasProveedores();
    loadProveedorOptions();
    loadBancoOptions();
});

let selectedCuentaEmpresaId = null;
let selectedCuentaProveedorId = null;

function showCuentasEmpresas() {
    document.getElementById('cuentasEmpresasContainer').style.display = 'block';
    document.getElementById('cuentasProveedoresContainer').style.display = 'none';
    clearSelection();
}

function showCuentasProveedores() {
    document.getElementById('cuentasEmpresasContainer').style.display = 'none';
    document.getElementById('cuentasProveedoresContainer').style.display = 'block';
    clearSelection();
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function clearSelection() {
    selectedCuentaEmpresaId = null;
    selectedCuentaProveedorId = null;
    document.getElementById('editCuentaEmpresaBtn').disabled = true;
    document.getElementById('deleteCuentaEmpresaBtn').disabled = true;
    document.getElementById('editCuentaProveedorBtn').disabled = true;
    document.getElementById('deleteCuentaProveedorBtn').disabled = true;

    const selectedRows = document.querySelectorAll('tr.selected');
    selectedRows.forEach(row => row.classList.remove('selected'));
}

async function addCuentaEmpresa() {
    try {
        const empresaId = document.getElementById('empresaSelect').value;
        const banco = document.getElementById('bancoEmpresa').value;
        const numeroCuenta = document.getElementById('numeroCuentaEmpresa').value;
        const tipoCuenta = document.getElementById('tipoCuentaEmpresa').value;
        const descripcion = document.getElementById('descripcionCuentaEmpresa').value;

        if (!empresaId || !banco || !numeroCuenta || !tipoCuenta) {
            throw new Error('Todos los campos son obligatorios');
        }

        await db.collection('cuentasEmpresas').add({
            empresaId: empresaId,
            banco: banco,
            numeroCuenta: numeroCuenta,
            tipoCuenta: tipoCuenta,
            descripcion: descripcion
        });

        closeModal('addCuentaEmpresaModal');
        loadCuentasEmpresas();
        alert('Cuenta de empresa agregada con éxito');
    } catch (error) {
        console.error('Error al agregar cuenta de empresa:', error);
        alert('Error al agregar cuenta de empresa: ' + error.message);
    }
}

async function addCuentaProveedor() {
    try {
        const proveedorId = document.getElementById('proveedorSelect').value;
        const banco = document.getElementById('bancoProveedor').value;
        const numeroCuenta = document.getElementById('numeroCuentaProveedor').value;
        const tipoCuenta = document.getElementById('tipoCuentaProveedor').value;
        const descripcion = document.getElementById('descripcionCuentaProveedor').value;

        if (!proveedorId || !banco || !numeroCuenta || !tipoCuenta) {
            throw new Error('Todos los campos son obligatorios');
        }

        await db.collection('cuentasProveedores').add({
            proveedorId: proveedorId,
            banco: banco,
            numeroCuenta: numeroCuenta,
            tipoCuenta: tipoCuenta,
            descripcion: descripcion
        });

        closeModal('addCuentaProveedorModal');
        loadCuentasProveedores();
        alert('Cuenta de proveedor agregada con éxito');
    } catch (error) {
        console.error('Error al agregar cuenta de proveedor:', error);
        alert('Error al agregar cuenta de proveedor: ' + error.message);
    }
}

async function loadCuentasEmpresas() {
    try {
        const cuentasEmpresasSnapshot = await db.collection('cuentasEmpresas').get();
        const cuentasEmpresasTableBody = document.getElementById('cuentasEmpresasTable').getElementsByTagName('tbody')[0];
        cuentasEmpresasTableBody.innerHTML = '';

        const empresasSnapshot = await db.collection('empresas').get();
        const empresas = {};
        empresasSnapshot.forEach(doc => {
            empresas[doc.id] = doc.data().name;
        });

        cuentasEmpresasSnapshot.forEach(doc => {
            const cuenta = doc.data();
            const row = cuentasEmpresasTableBody.insertRow();
            row.onclick = () => toggleSelectCuentaEmpresaRow(row, doc.id);
            row.innerHTML = `
                <td>${empresas[cuenta.empresaId] || 'N/A'}</td>
                <td>${cuenta.banco}</td>
                <td>${cuenta.numeroCuenta}</td>
                <td>${cuenta.tipoCuenta}</td>
                <td>${cuenta.descripcion}</td>`;
        });
    } catch (error) {
        console.error('Error al cargar cuentas de empresas:', error);
        alert('Error al cargar cuentas de empresas: ' + error.message);
    }
}

async function loadCuentasProveedores() {
    try {
        const cuentasProveedoresSnapshot = await db.collection('cuentasProveedores').get();
        const cuentasProveedoresTableBody = document.getElementById('cuentasProveedoresTable').getElementsByTagName('tbody')[0];
        cuentasProveedoresTableBody.innerHTML = '';

        const proveedoresSnapshot = await db.collection('providers').get();
        const proveedores = {};
        proveedoresSnapshot.forEach(doc => {
            proveedores[doc.id] = doc.data().name;
        });

        cuentasProveedoresSnapshot.forEach(doc => {
            const cuenta = doc.data();
            const row = cuentasProveedoresTableBody.insertRow();
            row.onclick = () => toggleSelectCuentaProveedorRow(row, doc.id);
            row.innerHTML = `
                <td>${proveedores[cuenta.proveedorId] || 'N/A'}</td>
                <td>${cuenta.banco}</td>
                <td>${cuenta.numeroCuenta}</td>
                <td>${cuenta.tipoCuenta}</td>
                <td>${cuenta.descripcion}</td>`;
        });
    } catch (error) {
        console.error('Error al cargar cuentas de proveedores:', error);
        alert('Error al cargar cuentas de proveedores: ' + error.message);
    }
}

function toggleSelectCuentaEmpresaRow(row, cuentaId) {
    if (selectedCuentaEmpresaId === cuentaId) {
        row.classList.remove('selected');
        selectedCuentaEmpresaId = null;
    } else {
        clearSelection();
        row.classList.add('selected');
        selectedCuentaEmpresaId = cuentaId;
        document.getElementById('editCuentaEmpresaBtn').disabled = false;
        document.getElementById('deleteCuentaEmpresaBtn').disabled = false;
    }
}

function toggleSelectCuentaProveedorRow(row, cuentaId) {
    if (selectedCuentaProveedorId === cuentaId) {
        row.classList.remove('selected');
        selectedCuentaProveedorId = null;
    } else {
        clearSelection();
        row.classList.add('selected');
        selectedCuentaProveedorId = cuentaId;
        document.getElementById('editCuentaProveedorBtn').disabled = false;
        document.getElementById('deleteCuentaProveedorBtn').disabled = false;
    }
}

function confirmDelete(type) {
    if (type === 'empresa' && !selectedCuentaEmpresaId) {
        openModal('warningModal');
        return;
    } else if (type === 'proveedor' && !selectedCuentaProveedorId) {
        openModal('warningModal');
        return;
    }

    openModal('confirmDeleteModal');
    document.getElementById('confirmDeleteBtn').onclick = () => {
        if (type === 'empresa') {
            deleteSelectedCuentaEmpresa();
        } else if (type === 'proveedor') {
            deleteSelectedCuentaProveedor();
        }
        closeModal('confirmDeleteModal');
    };
}

async function deleteSelectedCuentaEmpresa() {
    if (selectedCuentaEmpresaId) {
        await deleteCuentaEmpresa(selectedCuentaEmpresaId);
        clearSelection();
    }
}

async function deleteSelectedCuentaProveedor() {
    if (selectedCuentaProveedorId) {
        await deleteCuentaProveedor(selectedCuentaProveedorId);
        clearSelection();
    }
}

async function deleteCuentaEmpresa(id) {
    try {
        await db.collection('cuentasEmpresas').doc(id).delete();
        loadCuentasEmpresas();
    } catch (error) {
        console.error('Error al eliminar cuenta de empresa:', error);
        alert('Error al eliminar cuenta de empresa: ' + error.message);
    }
}

async function deleteCuentaProveedor(id) {
    try {
        await db.collection('cuentasProveedores').doc(id).delete();
        loadCuentasProveedores();
    } catch (error) {
        console.error('Error al eliminar cuenta de proveedor:', error);
        alert('Error al eliminar cuenta de proveedor: ' + error.message);
    }
}

async function editCuentaEmpresa() {
    if (!selectedCuentaEmpresaId) {
        openModal('warningModal');
        return;
    }

    const doc = await db.collection('cuentasEmpresas').doc(selectedCuentaEmpresaId).get();
    if (doc.exists) {
        const cuenta = doc.data();
        document.getElementById('editEmpresaSelect').value = cuenta.empresaId;
        document.getElementById('editBancoEmpresa').value = cuenta.banco;
        document.getElementById('editNumeroCuentaEmpresa').value = cuenta.numeroCuenta;
        document.getElementById('editTipoCuentaEmpresa').value = cuenta.tipoCuenta;
        document.getElementById('editDescripcionCuentaEmpresa').value = cuenta.descripcion;
        openModal('editCuentaEmpresaModal');
    }
}

async function editCuentaProveedor() {
    if (!selectedCuentaProveedorId) {
        openModal('warningModal');
        return;
    }

    const doc = await db.collection('cuentasProveedores').doc(selectedCuentaProveedorId).get();
    if (doc.exists) {
        const cuenta = doc.data();
        document.getElementById('editProveedorSelect').value = cuenta.proveedorId;
        document.getElementById('editBancoProveedor').value = cuenta.banco;
        document.getElementById('editNumeroCuentaProveedor').value = cuenta.numeroCuenta;
        document.getElementById('editTipoCuentaProveedor').value = cuenta.tipoCuenta;
        document.getElementById('editDescripcionCuentaProveedor').value = cuenta.descripcion;
        openModal('editCuentaProveedorModal');
    }
}

async function updateCuentaEmpresa() {
    try {
        const empresaId = document.getElementById('editEmpresaSelect').value;
        const banco = document.getElementById('editBancoEmpresa').value;
        const numeroCuenta = document.getElementById('editNumeroCuentaEmpresa').value;
        const tipoCuenta = document.getElementById('editTipoCuentaEmpresa').value;
        const descripcion = document.getElementById('editDescripcionCuentaEmpresa').value;

        await db.collection('cuentasEmpresas').doc(selectedCuentaEmpresaId).update({
            empresaId: empresaId,
            banco: banco,
            numeroCuenta: numeroCuenta,
            tipoCuenta: tipoCuenta,
            descripcion: descripcion
        });

        closeModal('editCuentaEmpresaModal');
        loadCuentasEmpresas();
        alert('Cuenta de empresa actualizada con éxito');
    } catch (error) {
        console.error('Error al actualizar cuenta de empresa:', error);
        alert('Error al actualizar cuenta de empresa: ' + error.message);
    }
}

async function updateCuentaProveedor() {
    try {
        const proveedorId = document.getElementById('editProveedorSelect').value;
        const banco = document.getElementById('editBancoProveedor').value;
        const numeroCuenta = document.getElementById('editNumeroCuentaProveedor').value;
        const tipoCuenta = document.getElementById('editTipoCuentaProveedor').value;
        const descripcion = document.getElementById('editDescripcionCuentaProveedor').value;

        await db.collection('cuentasProveedores').doc(selectedCuentaProveedorId).update({
            proveedorId: proveedorId,
            banco: banco,
            numeroCuenta: numeroCuenta,
            tipoCuenta: tipoCuenta,
            descripcion: descripcion
        });

        closeModal('editCuentaProveedorModal');
        loadCuentasProveedores();
        alert('Cuenta de proveedor actualizada con éxito');
    } catch (error) {
        console.error('Error al actualizar cuenta de proveedor:', error);
        alert('Error al actualizar cuenta de proveedor: ' + error.message);
    }
}

async function loadEmpresasSelectOptions() {
    try {
        const empresasSnapshot = await db.collection('empresas').get();
        const empresaSelect = document.getElementById('empresaSelect');
        const editEmpresaSelect = document.getElementById('editEmpresaSelect');
        empresaSelect.innerHTML = '';
        editEmpresaSelect.innerHTML = '';

        empresasSnapshot.forEach(doc => {
            const empresa = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = empresa.name;
            empresaSelect.appendChild(option);
            editEmpresaSelect.appendChild(option.cloneNode(true));
        });
    } catch (error) {
        console.error('Error al cargar opciones de empresas:', error);
        alert('Error al cargar opciones de empresas: ' + error.message);
    }
}

async function loadProveedorOptions() {
    try {
        const providersSnapshot = await db.collection('providers').get();
        const proveedorSelect = document.getElementById('proveedorSelect');
        const editProveedorSelect = document.getElementById('editProveedorSelect');
        proveedorSelect.innerHTML = '';
        editProveedorSelect.innerHTML = '';

        providersSnapshot.forEach(doc => {
            const provider = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = provider.name;
            proveedorSelect.appendChild(option);
            editProveedorSelect.appendChild(option.cloneNode(true));
        });
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        alert('Error al cargar proveedores: ' + error.message);
    }
}

function loadBancoOptions() {
    const bancos = [
        "Banco Industrial, S.A.", 
        "Banco G&T Continental, S.A.", 
        "Banrural, S.A.", 
        "Banco de los Trabajadores (Bantrab)", 
        "Banco Agromercantil de Guatemala, S.A. (BAM)", 
        "Banco Inmobiliario, S.A.", 
        "Banco Promerica Guatemala, S.A.", 
        "Banco Internacional, S.A.", 
        "Banco de Antigua, S.A.", 
        "Banco Ficohsa Guatemala, S.A.", 
        "Banco Azteca de Guatemala, S.A.", 
        "Vivibanco, S.A.", 
        "Banco de Crédito, S.A."
    ];

    const bancoEmpresaSelect = document.getElementById('bancoEmpresa');
    const editBancoEmpresaSelect = document.getElementById('editBancoEmpresa');
    const bancoProveedorSelect = document.getElementById('bancoProveedor');
    const editBancoProveedorSelect = document.getElementById('editBancoProveedor');

    bancos.forEach(banco => {
        const option = document.createElement('option');
        option.value = banco;
        option.textContent = banco;

        bancoEmpresaSelect.appendChild(option.cloneNode(true));
        editBancoEmpresaSelect.appendChild(option.cloneNode(true));
        bancoProveedorSelect.appendChild(option.cloneNode(true));
        editBancoProveedorSelect.appendChild(option.cloneNode(true));
    });
}
