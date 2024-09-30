// empresas.js

// Inicializar Firebase Firestore
var db = firebase.firestore();

// Variables para seguimiento de selección
var selectedEmpresaId = null;
var selectedEmpresaInactivaId = null;
var selectedSucursalId = null;

// Función que se ejecuta al cargar el DOM
document.addEventListener("DOMContentLoaded", function() {
    estilizarBotones();
    loadEmpresas();
    loadEmpresasInactivas();
    loadSucursales();
    loadEmpresasSelectOptions();
    loadEncargadosSelectOptions('sucursalEncargado');

    // Asignar eventos a los botones de agregar
    document.getElementById('addEmpresaBtn').addEventListener('click', () => {
        resetAddEmpresaForm();
        openModal('addEmpresaModal');
    });

    document.getElementById('addSucursalBtn').addEventListener('click', () => {
        resetAddSucursalForm();
        loadEmpresasSelectOptions();
        loadEncargadosSelectOptions('sucursalEncargado');
        openModal('addSucursalModal');
    });

    // Asignar eventos a los botones de acción
    document.getElementById('editarEmpresaBtn').addEventListener('click', () => {
        if (selectedEmpresaId) {
            openEditEmpresaModal(selectedEmpresaId);
        }
    });

    document.getElementById('desactivarEmpresaBtn').addEventListener('click', () => {
        if (selectedEmpresaId) {
            solicitarMotivoDesactivacion(selectedEmpresaId);
        }
    });

    document.getElementById('eliminarEmpresaBtn').addEventListener('click', () => {
        if (selectedEmpresaId) {
            eliminarEmpresa(selectedEmpresaId);
        }
    });

    document.getElementById('reactivarEmpresaBtn').addEventListener('click', () => {
        if (selectedEmpresaInactivaId) {
            reactivarEmpresa(selectedEmpresaInactivaId);
        }
    });

    document.getElementById('verHistorialEmpresaBtn').addEventListener('click', () => {
        if (selectedEmpresaInactivaId) {
            verHistorialEmpresa(selectedEmpresaInactivaId);
        }
    });

    document.getElementById('editarSucursalBtn').addEventListener('click', () => {
        if (selectedSucursalId) {
            openEditSucursalModal(selectedSucursalId);
        }
    });

    document.getElementById('desactivarSucursalBtn').addEventListener('click', () => {
        if (selectedSucursalId) {
            desactivarSucursal(selectedSucursalId);
        }
    });

    document.getElementById('eliminarSucursalBtn').addEventListener('click', () => {
        if (selectedSucursalId) {
            eliminarSucursal(selectedSucursalId);
        }
    });

    // Asignar eventos a las tablas para manejar selección
    assignTableSelectionEvents('empresasTable', 'empresa');
    assignTableSelectionEvents('empresasInactivasTable', 'empresaInactiva');
    assignTableSelectionEvents('sucursalesTable', 'sucursal');

    // Mostrar el contenedor de empresas activas por defecto
    showEmpresas();
});

// Función para estilizar botones según su estado
function estilizarBotones() {
    const buttons = document.querySelectorAll(".action-buttons button");
    buttons.forEach(button => {
        if (button.disabled) {
            button.style.backgroundColor = "#ccc";
            button.style.cursor = "not-allowed";
        } else {
            if (button.classList.contains('edit-button')) {
                button.style.backgroundColor = "#28a745";
            } else if (button.classList.contains('deactivate-button')) {
                button.style.backgroundColor = "#dc3545";
            } else if (button.classList.contains('delete-button')) {
                button.style.backgroundColor = "#343a40";
            } else if (button.classList.contains('reactivate-button')) {
                button.style.backgroundColor = "#28a745";
            } else if (button.classList.contains('history-button')) {
                button.style.backgroundColor = "#17a2b8";
            } else {
                button.style.backgroundColor = "#007BFF";
            }
            button.style.cursor = "pointer";
        }
    });
}

// Funciones para mostrar y ocultar contenedores
function showEmpresas() {
    document.getElementById('empresasContainer').style.display = 'block';
    document.getElementById('empresasInactivasContainer').style.display = 'none';
    document.getElementById('sucursalesContainer').style.display = 'none';
}

function showEmpresasInactivas() {
    document.getElementById('empresasContainer').style.display = 'none';
    document.getElementById('empresasInactivasContainer').style.display = 'block';
    document.getElementById('sucursalesContainer').style.display = 'none';
}

function showSucursales() {
    document.getElementById('empresasContainer').style.display = 'none';
    document.getElementById('empresasInactivasContainer').style.display = 'none';
    document.getElementById('sucursalesContainer').style.display = 'block';
}

// Funciones para abrir y cerrar modales
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Función para reiniciar el formulario de agregar empresa
function resetAddEmpresaForm() {
    document.getElementById('addEmpresaForm').reset();
    document.getElementById('empresaStatus').value = 'activo';
}

// Función para reiniciar el formulario de agregar sucursal
function resetAddSucursalForm() {
    document.getElementById('addSucursalForm').reset();
    document.getElementById('sucursalStatus').value = 'activo';
}

// Función para asignar eventos de selección a tablas
function assignTableSelectionEvents(tableId, type) {
    const table = document.getElementById(tableId);
    const tbody = table.getElementsByTagName('tbody')[0];

    tbody.addEventListener('click', function(event) {
        const target = event.target.closest('tr');
        if (!target) return;

        // Si ya está seleccionado, deseleccionar
        if (target.classList.contains('selected')) {
            target.classList.remove('selected');
            if (type === 'empresa') {
                selectedEmpresaId = null;
            } else if (type === 'empresaInactiva') {
                selectedEmpresaInactivaId = null;
            } else if (type === 'sucursal') {
                selectedSucursalId = null;
            }
        } else {
            // Deseleccionar otras filas
            const rows = tbody.getElementsByTagName('tr');
            for (let row of rows) {
                row.classList.remove('selected');
            }
            // Seleccionar la fila actual
            target.classList.add('selected');
            // Obtener el ID de la fila (asumiendo que el ID está en un atributo data-id)
            let id = target.getAttribute('data-id');
            if (type === 'empresa') {
                selectedEmpresaId = id;
                selectedEmpresaInactivaId = null;
                selectedSucursalId = null;
            } else if (type === 'empresaInactiva') {
                selectedEmpresaInactivaId = id;
                selectedEmpresaId = null;
                selectedSucursalId = null;
            } else if (type === 'sucursal') {
                selectedSucursalId = id;
                selectedEmpresaId = null;
                selectedEmpresaInactivaId = null;
            }
        }

        // Actualizar el estado de los botones de acción
        updateActionButtons();
    });
}

// Función para actualizar el estado de los botones de acción
function updateActionButtons() {
    // Empresas Activas
    const editarEmpresaBtn = document.getElementById('editarEmpresaBtn');
    const desactivarEmpresaBtn = document.getElementById('desactivarEmpresaBtn');
    const eliminarEmpresaBtn = document.getElementById('eliminarEmpresaBtn');

    editarEmpresaBtn.disabled = !selectedEmpresaId;
    desactivarEmpresaBtn.disabled = !selectedEmpresaId;
    eliminarEmpresaBtn.disabled = !selectedEmpresaId;

    // Empresas Inactivas
    const reactivarEmpresaBtn = document.getElementById('reactivarEmpresaBtn');
    const verHistorialEmpresaBtn = document.getElementById('verHistorialEmpresaBtn');

    reactivarEmpresaBtn.disabled = !selectedEmpresaInactivaId;
    verHistorialEmpresaBtn.disabled = !selectedEmpresaInactivaId;

    // Sucursales
    const editarSucursalBtn = document.getElementById('editarSucursalBtn');
    const desactivarSucursalBtn = document.getElementById('desactivarSucursalBtn');
    const eliminarSucursalBtn = document.getElementById('eliminarSucursalBtn');

    editarSucursalBtn.disabled = !selectedSucursalId;
    desactivarSucursalBtn.disabled = !selectedSucursalId;
    eliminarSucursalBtn.disabled = !selectedSucursalId;

    // Estilizar botones según su estado
    estilizarBotones();
}

// Función para agregar una nueva empresa
async function addEmpresa() {
    try {
        const empresaName = document.getElementById('empresaName').value.trim();
        const empresaAddress = document.getElementById('empresaAddress').value.trim();
        const empresaPhone = document.getElementById('empresaPhone').value.trim();
        const empresaEmail = document.getElementById('empresaEmail').value.trim();
        const empresaDescription = document.getElementById('empresaDescription').value.trim();

        // Validaciones
        if (!empresaName) {
            Swal.fire('Error', 'El nombre de la empresa es obligatorio.', 'error');
            return;
        }

        if (!empresaAddress) {
            Swal.fire('Error', 'La dirección es obligatoria.', 'error');
            return;
        }

        if (!empresaPhone) {
            Swal.fire('Error', 'El teléfono es obligatorio.', 'error');
            return;
        }

        if (!/^\d{8}$/.test(empresaPhone)) {
            Swal.fire('Error', 'El teléfono debe tener exactamente 8 dígitos.', 'error');
            return;
        }

        if (!empresaEmail) {
            Swal.fire('Error', 'El correo electrónico es obligatorio.', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|es|net|org|edu)$/.test(empresaEmail)) {
            Swal.fire('Error', 'Ingresa un correo válido (ej. usuario@dominio.com).', 'error');
            return;
        }

        // Verificar nombres duplicados
        const empresasSnapshot = await db.collection('empresas').where('name', '==', empresaName).get();
        if (!empresasSnapshot.empty) {
            Swal.fire('Error', 'Ya existe una empresa con este nombre.', 'error');
            return;
        }

        // Verificar si el teléfono ya existe
        const telefonoSnapshot = await db.collection('empresas').where('phone', '==', empresaPhone).get();
        if (!telefonoSnapshot.empty) {
            Swal.fire('Error', 'Ya existe una empresa con este teléfono.', 'error');
            return;
        }

        // Agregar empresa
        await db.collection('empresas').add({
            name: empresaName,
            address: empresaAddress,
            phone: empresaPhone,
            email: empresaEmail,
            creationDate: firebase.firestore.FieldValue.serverTimestamp(),
            description: empresaDescription,
            status: 'activo'
        });

        closeModal('addEmpresaModal');
        loadEmpresas();
        Swal.fire('Éxito', 'Empresa agregada con éxito.', 'success');
        document.getElementById('addEmpresaForm').reset();
    } catch (error) {
        console.error('Error al agregar empresa:', error);
        Swal.fire('Error', 'Ocurrió un error al agregar la empresa.', 'error');
    }
}

// Función para cargar todas las empresas activas
async function loadEmpresas() {
    try {
        const empresasSnapshot = await db.collection('empresas').where('status', '==', 'activo').orderBy('name').get();
        const empresasTableBody = document.getElementById('empresasTable').getElementsByTagName('tbody')[0];
        empresasTableBody.innerHTML = '';

        empresasSnapshot.forEach(function(doc) {
            const empresa = doc.data();
            const row = empresasTableBody.insertRow();

            // Agregar ID como atributo data-id
            row.setAttribute('data-id', doc.id);

            row.insertCell(0).textContent = empresa.name;
            row.insertCell(1).textContent = empresa.address;
            row.insertCell(2).textContent = empresa.phone;
            row.insertCell(3).textContent = empresa.email;
            row.insertCell(4).textContent = empresa.description || 'N/A';
            row.insertCell(5).textContent = empresa.status.charAt(0).toUpperCase() + empresa.status.slice(1);
        });

        // Limpiar selección y deshabilitar botones
        selectedEmpresaId = null;
        document.querySelectorAll('#empresasTable tbody tr').forEach(row => {
            row.classList.remove('selected');
        });
        updateActionButtons();
    } catch (error) {
        console.error('Error al cargar empresas:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las empresas.', 'error');
    }
}

// Función para cargar todas las empresas inactivas
async function loadEmpresasInactivas() {
    try {
        const empresasSnapshot = await db.collection('empresas').where('status', '==', 'inactivo').orderBy('name').get();
        const empresasTableBody = document.getElementById('empresasInactivasTable').getElementsByTagName('tbody')[0];
        empresasTableBody.innerHTML = '';

        empresasSnapshot.forEach(function(doc) {
            const empresa = doc.data();
            const row = empresasTableBody.insertRow();

            // Agregar ID como atributo data-id
            row.setAttribute('data-id', doc.id);

            row.insertCell(0).textContent = empresa.name;
            row.insertCell(1).textContent = empresa.address;
            row.insertCell(2).textContent = empresa.phone;
            row.insertCell(3).textContent = empresa.email;
            row.insertCell(4).textContent = empresa.description || 'N/A';
            row.insertCell(5).textContent = empresa.status.charAt(0).toUpperCase() + empresa.status.slice(1);
        });

        // Limpiar selección y deshabilitar botones
        selectedEmpresaInactivaId = null;
        document.querySelectorAll('#empresasInactivasTable tbody tr').forEach(row => {
            row.classList.remove('selected');
        });
        updateActionButtons();
    } catch (error) {
        console.error('Error al cargar empresas inactivas:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las empresas inactivas.', 'error');
    }
}

// Función para abrir el modal de editar empresa y rellenar los campos
async function openEditEmpresaModal(id) {
    try {
        const empresaDoc = await db.collection('empresas').doc(id).get();
        if (empresaDoc.exists) {
            const empresa = empresaDoc.data();
            document.getElementById('editEmpresaId').value = id;
            document.getElementById('editEmpresaName').value = empresa.name;
            document.getElementById('editEmpresaAddress').value = empresa.address;
            document.getElementById('editEmpresaPhone').value = empresa.phone;
            document.getElementById('editEmpresaEmail').value = empresa.email;
            document.getElementById('editEmpresaDescription').value = empresa.description || '';
            document.getElementById('editEmpresaStatus').value = empresa.status;
            document.getElementById('motivoCambio').value = ''; // Resetear el motivo de cambio
            openModal('editEmpresaModal');
        } else {
            Swal.fire('Error', 'La empresa seleccionada no existe.', 'error');
        }
    } catch (error) {
        console.error('Error al obtener la empresa:', error);
        Swal.fire('Error', 'Ocurrió un error al obtener los datos de la empresa.', 'error');
    }
}

// Función para actualizar una empresa existente
async function updateEmpresa() {
    try {
        const id = document.getElementById('editEmpresaId').value;
        const empresaName = document.getElementById('editEmpresaName').value.trim();
        const empresaAddress = document.getElementById('editEmpresaAddress').value.trim();
        const empresaPhone = document.getElementById('editEmpresaPhone').value.trim();
        const empresaEmail = document.getElementById('editEmpresaEmail').value.trim();
        const empresaDescription = document.getElementById('editEmpresaDescription').value.trim();
        const empresaStatus = document.getElementById('editEmpresaStatus').value;
        const motivoCambio = document.getElementById('motivoCambio').value.trim();

        // Validaciones
        if (!empresaName) {
            Swal.fire('Error', 'El nombre de la empresa es obligatorio.', 'error');
            return;
        }

        if (!empresaAddress) {
            Swal.fire('Error', 'La dirección es obligatoria.', 'error');
            return;
        }

        if (!empresaPhone) {
            Swal.fire('Error', 'El teléfono es obligatorio.', 'error');
            return;
        }

        if (!/^\d{8}$/.test(empresaPhone)) {
            Swal.fire('Error', 'El teléfono debe tener exactamente 8 dígitos.', 'error');
            return;
        }

        if (!empresaEmail) {
            Swal.fire('Error', 'El correo electrónico es obligatorio.', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|es|net|org|edu)$/.test(empresaEmail)) {
            Swal.fire('Error', 'Ingresa un correo válido (ej. usuario@dominio.com).', 'error');
            return;
        }

        if (!motivoCambio) {
            Swal.fire('Error', 'El motivo de cambio es obligatorio.', 'error');
            return;
        }

        // Verificar nombres duplicados (excluir la empresa actual)
        const empresasSnapshot = await db.collection('empresas')
            .where('name', '==', empresaName)
            .get();
        let nombreDuplicado = false;
        empresasSnapshot.forEach(doc => {
            if (doc.id !== id) {
                nombreDuplicado = true;
            }
        });
        if (nombreDuplicado) {
            Swal.fire('Error', 'Ya existe una empresa con este nombre.', 'error');
            return;
        }

        // Verificar si el teléfono ya existe (excluir la empresa actual)
        const telefonoSnapshot = await db.collection('empresas')
            .where('phone', '==', empresaPhone)
            .get();
        let telefonoDuplicado = false;
        telefonoSnapshot.forEach(doc => {
            if (doc.id !== id) {
                telefonoDuplicado = true;
            }
        });
        if (telefonoDuplicado) {
            Swal.fire('Error', 'Ya existe una empresa con este teléfono.', 'error');
            return;
        }

        // Actualizar empresa
        await db.collection('empresas').doc(id).update({
            name: empresaName,
            address: empresaAddress,
            phone: empresaPhone,
            email: empresaEmail,
            description: empresaDescription,
            status: empresaStatus
        });

        // Guardar en el historial de cambios
        await db.collection('empresaHistorial').add({
            empresaId: id,
            motivoCambio: motivoCambio,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            usuario: "Desconocido"
        });

        closeModal('editEmpresaModal');
        loadEmpresas();
        loadEmpresasInactivas();
        Swal.fire('Éxito', 'Empresa actualizada con éxito.', 'success');
    } catch (error) {
        console.error('Error al actualizar empresa:', error);
        Swal.fire('Error', 'Ocurrió un error al actualizar la empresa.', 'error');
    }
}

// Función para solicitar motivo de desactivación
function solicitarMotivoDesactivacion(id) {
    document.getElementById('motivoDesactivar').value = '';
    document.getElementById('empresaDesactivarId').value = id;
    openModal('motivoDesactivarEmpresaModal');
}

// Función para confirmar desactivación de empresa
async function confirmDesactivarEmpresa() {
    try {
        const id = document.getElementById('empresaDesactivarId').value;
        const motivoDesactivar = document.getElementById('motivoDesactivar').value.trim();

        if (!motivoDesactivar) {
            Swal.fire('Error', 'El motivo de desactivación es obligatorio.', 'error');
            return;
        }

        // Desactivar empresa
        await db.collection('empresas').doc(id).update({
            status: 'inactivo'
        });

        // Guardar en el historial de cambios
        await db.collection('empresaHistorial').add({
            empresaId: id,
            motivoCambio: motivoDesactivar,
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            usuario: "Desconocido"
        });

        closeModal('motivoDesactivarEmpresaModal');
        loadEmpresas();
        loadEmpresasInactivas();
        Swal.fire('Éxito', 'Empresa desactivada con éxito.', 'success');
    } catch (error) {
        console.error('Error al desactivar empresa:', error);
        Swal.fire('Error', 'Ocurrió un error al desactivar la empresa.', 'error');
    }
}

// Función para eliminar una empresa
async function eliminarEmpresa(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará la empresa permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#343a40',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await db.collection('empresas').doc(id).delete();
                loadEmpresas();
                Swal.fire('Eliminada', 'La empresa ha sido eliminada.', 'success');

                // Limpiar selección y deshabilitar botones
                selectedEmpresaId = null;
                document.querySelectorAll('#empresasTable tbody tr').forEach(row => {
                    row.classList.remove('selected');
                });
                updateActionButtons();
            } catch (error) {
                console.error('Error al eliminar empresa:', error);
                Swal.fire('Error', 'Ocurrió un error al eliminar la empresa.', 'error');
            }
        }
    });
}

// Función para reactivar una empresa
async function reactivarEmpresa(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas reactivar esta empresa?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await db.collection('empresas').doc(id).update({
                    status: 'activo'
                });
                loadEmpresas();
                loadEmpresasInactivas();
                Swal.fire('Reactivada', 'La empresa ha sido reactivada.', 'success');

                // Limpiar selección y deshabilitar botones
                selectedEmpresaInactivaId = null;
                document.querySelectorAll('#empresasInactivasTable tbody tr').forEach(row => {
                    row.classList.remove('selected');
                });
                updateActionButtons();
            } catch (error) {
                console.error('Error al reactivar empresa:', error);
                Swal.fire('Error', 'Ocurrió un error al reactivar la empresa.', 'error');
            }
        }
    });
}

// Función para ver el historial de cambios de una empresa
async function verHistorialEmpresa(id) {
    try {
        const historialSnapshot = await db.collection('empresaHistorial')
            .where('empresaId', '==', id)
            .orderBy('fecha', 'desc')
            .get();

        const historialTableBody = document.getElementById('historialEmpresaTable').getElementsByTagName('tbody')[0];
        historialTableBody.innerHTML = '';

        historialSnapshot.forEach(function(doc) {
            const cambio = doc.data();
            const row = historialTableBody.insertRow();

            const fecha = cambio.fecha.toDate().toLocaleString();
            row.insertCell(0).textContent = fecha;
            row.insertCell(1).textContent = cambio.motivoCambio;
            row.insertCell(2).textContent = cambio.usuario || 'Desconocido';
        });

        openModal('historialEmpresaModal');
    } catch (error) {
        console.error('Error al cargar historial de empresa:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar el historial de la empresa.', 'error');
    }
}

// Funciones relacionadas con sucursales (addSucursal, loadSucursales, openEditSucursalModal, updateSucursal, eliminarSucursal, desactivarSucursal)

async function addSucursal() {
    try {
        const sucursalName = document.getElementById('sucursalName').value.trim();
        const sucursalAddress = document.getElementById('sucursalAddress').value.trim();
        const sucursalPhone = document.getElementById('sucursalPhone').value.trim();
        const sucursalEmail = document.getElementById('sucursalEmail').value.trim();
        const sucursalEncargado = document.getElementById('sucursalEncargado').value;
        const sucursalDescription = document.getElementById('sucursalDescription').value.trim();
        const empresaId = document.getElementById('empresaSelect').value;
        const sucursalStatus = document.getElementById('sucursalStatus').value;

        // Validaciones
        if (!sucursalName) {
            Swal.fire('Error', 'El nombre de la sucursal es obligatorio.', 'error');
            return;
        }

        if (!sucursalAddress) {
            Swal.fire('Error', 'La dirección es obligatoria.', 'error');
            return;
        }

        if (!sucursalPhone) {
            Swal.fire('Error', 'El teléfono es obligatorio.', 'error');
            return;
        }

        if (!/^\d{8}$/.test(sucursalPhone)) {
            Swal.fire('Error', 'El teléfono debe tener exactamente 8 dígitos.', 'error');
            return;
        }

        if (!sucursalEmail) {
            Swal.fire('Error', 'El correo electrónico es obligatorio.', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|es|net|org|edu)$/.test(sucursalEmail)) {
            Swal.fire('Error', 'Ingresa un correo válido (ej. usuario@dominio.com).', 'error');
            return;
        }

        if (!sucursalEncargado) {
            Swal.fire('Error', 'Debes seleccionar un encargado.', 'error');
            return;
        }

        if (!empresaId) {
            Swal.fire('Error', 'Debes seleccionar una empresa.', 'error');
            return;
        }

        // Verificar nombres duplicados
        const sucursalesSnapshot = await db.collection('sucursales').where('name', '==', sucursalName).get();
        if (!sucursalesSnapshot.empty) {
            Swal.fire('Error', 'Ya existe una sucursal con este nombre.', 'error');
            return;
        }

        // Verificar si el teléfono ya existe
        const telefonoSnapshot = await db.collection('sucursales').where('phone', '==', sucursalPhone).get();
        if (!telefonoSnapshot.empty) {
            Swal.fire('Error', 'Ya existe una sucursal con este teléfono.', 'error');
            return;
        }

        // Agregar sucursal
        await db.collection('sucursales').add({
            name: sucursalName,
            address: sucursalAddress,
            phone: sucursalPhone,
            email: sucursalEmail,
            creationDate: firebase.firestore.FieldValue.serverTimestamp(),
            encargado: sucursalEncargado,
            description: sucursalDescription,
            status: sucursalStatus,
            empresaId: empresaId
        });

        closeModal('addSucursalModal');
        loadSucursales();
        Swal.fire('Éxito', 'Sucursal agregada con éxito.', 'success');
        document.getElementById('addSucursalForm').reset();
    } catch (error) {
        console.error('Error al agregar sucursal:', error);
        Swal.fire('Error', 'Ocurrió un error al agregar la sucursal.', 'error');
    }
}

// Función para cargar todas las sucursales
async function loadSucursales() {
    try {
        const empresaFilter = document.getElementById('empresaFilterSelect').value;
        let sucursalesQuery = db.collection('sucursales').where('status', '==', 'activo');

        if (empresaFilter) {
            sucursalesQuery = sucursalesQuery.where('empresaId', '==', empresaFilter);
        }

        const sucursalesSnapshot = await sucursalesQuery.orderBy('name').get();
        const sucursalesTableBody = document.getElementById('sucursalesTable').getElementsByTagName('tbody')[0];
        sucursalesTableBody.innerHTML = '';

        // Obtener nombres de empresas para mostrar en la tabla
        const empresasSnapshot = await db.collection('empresas').where('status', '==', 'activo').get();
        const empresas = {};
        empresasSnapshot.forEach(function(doc) {
            const empresa = doc.data();
            empresas[doc.id] = empresa.name;
        });

        sucursalesSnapshot.forEach(function(doc) {
            const sucursal = doc.data();
            const row = sucursalesTableBody.insertRow();

            // Agregar ID como atributo data-id
            row.setAttribute('data-id', doc.id);

            row.insertCell(0).textContent = sucursal.name;
            row.insertCell(1).textContent = sucursal.address;
            row.insertCell(2).textContent = sucursal.phone;
            row.insertCell(3).textContent = sucursal.email;
            row.insertCell(4).textContent = sucursal.encargado;
            row.insertCell(5).textContent = sucursal.description || 'N/A';
            row.insertCell(6).textContent = sucursal.status.charAt(0).toUpperCase() + sucursal.status.slice(1);
            row.insertCell(7).textContent = empresas[sucursal.empresaId] || 'N/A';
        });

        // Limpiar selección y deshabilitar botones
        selectedSucursalId = null;
        document.querySelectorAll('#sucursalesTable tbody tr').forEach(row => {
            row.classList.remove('selected');
        });
        updateActionButtons();
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las sucursales.', 'error');
    }
}

// Función para abrir el modal de editar sucursal y rellenar los campos
async function openEditSucursalModal(id) {
    try {
        const sucursalDoc = await db.collection('sucursales').doc(id).get();
        if (sucursalDoc.exists) {
            const sucursal = sucursalDoc.data();
            document.getElementById('editSucursalId').value = id;
            document.getElementById('editSucursalName').value = sucursal.name;
            document.getElementById('editSucursalAddress').value = sucursal.address;
            document.getElementById('editSucursalPhone').value = sucursal.phone;
            document.getElementById('editSucursalEmail').value = sucursal.email;
            document.getElementById('editSucursalDescription').value = sucursal.description || '';
            document.getElementById('editSucursalStatus').value = sucursal.status;
            document.getElementById('editEmpresaSelect').value = sucursal.empresaId;

            // Cargar encargados y seleccionar el actual
            await loadEncargadosSelectOptionsEditar('editSucursalEncargado', sucursal.encargado);
            await loadEmpresasSelectOptions(); // Asegurar que las opciones de empresas estén actualizadas

            openModal('editSucursalModal');
        } else {
            Swal.fire('Error', 'La sucursal seleccionada no existe.', 'error');
        }
    } catch (error) {
        console.error('Error al obtener la sucursal:', error);
        Swal.fire('Error', 'Ocurrió un error al obtener los datos de la sucursal.', 'error');
    }
}

// Función para actualizar una sucursal existente
async function updateSucursal() {
    try {
        const id = document.getElementById('editSucursalId').value;
        const sucursalName = document.getElementById('editSucursalName').value.trim();
        const sucursalAddress = document.getElementById('editSucursalAddress').value.trim();
        const sucursalPhone = document.getElementById('editSucursalPhone').value.trim();
        const sucursalEmail = document.getElementById('editSucursalEmail').value.trim();
        const sucursalEncargado = document.getElementById('editSucursalEncargado').value;
        const sucursalDescription = document.getElementById('editSucursalDescription').value.trim();
        const empresaId = document.getElementById('editEmpresaSelect').value;
        const sucursalStatus = document.getElementById('editSucursalStatus').value;

        // Validaciones
        if (!sucursalName) {
            Swal.fire('Error', 'El nombre de la sucursal es obligatorio.', 'error');
            return;
        }

        if (!sucursalAddress) {
            Swal.fire('Error', 'La dirección es obligatoria.', 'error');
            return;
        }

        if (!sucursalPhone) {
            Swal.fire('Error', 'El teléfono es obligatorio.', 'error');
            return;
        }

        if (!/^\d{8}$/.test(sucursalPhone)) {
            Swal.fire('Error', 'El teléfono debe tener exactamente 8 dígitos.', 'error');
            return;
        }

        if (!sucursalEmail) {
            Swal.fire('Error', 'El correo electrónico es obligatorio.', 'error');
            return;
        }

        if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|es|net|org|edu)$/.test(sucursalEmail)) {
            Swal.fire('Error', 'Ingresa un correo válido (ej. usuario@dominio.com).', 'error');
            return;
        }

        if (!sucursalEncargado) {
            Swal.fire('Error', 'Debes seleccionar un encargado.', 'error');
            return;
        }

        if (!empresaId) {
            Swal.fire('Error', 'Debes seleccionar una empresa.', 'error');
            return;
        }

        // Verificar nombres duplicados (excluir la sucursal actual)
        const sucursalesSnapshot = await db.collection('sucursales')
            .where('name', '==', sucursalName)
            .get();
        let nombreDuplicado = false;
        sucursalesSnapshot.forEach(doc => {
            if (doc.id !== id) {
                nombreDuplicado = true;
            }
        });
        if (nombreDuplicado) {
            Swal.fire('Error', 'Ya existe una sucursal con este nombre.', 'error');
            return;
        }

        // Verificar si el teléfono ya existe (excluir la sucursal actual)
        const telefonoSnapshot = await db.collection('sucursales')
            .where('phone', '==', sucursalPhone)
            .get();
        let telefonoDuplicado = false;
        telefonoSnapshot.forEach(doc => {
            if (doc.id !== id) {
                telefonoDuplicado = true;
            }
        });
        if (telefonoDuplicado) {
            Swal.fire('Error', 'Ya existe una sucursal con este teléfono.', 'error');
            return;
        }

        // Actualizar sucursal
        await db.collection('sucursales').doc(id).update({
            name: sucursalName,
            address: sucursalAddress,
            phone: sucursalPhone,
            email: sucursalEmail,
            encargado: sucursalEncargado,
            description: sucursalDescription,
            status: sucursalStatus,
            empresaId: empresaId
        });

        closeModal('editSucursalModal');
        loadSucursales();
        Swal.fire('Éxito', 'Sucursal actualizada con éxito.', 'success');
    } catch (error) {
        console.error('Error al actualizar sucursal:', error);
        Swal.fire('Error', 'Ocurrió un error al actualizar la sucursal.', 'error');
    }
}

// Función para eliminar una sucursal
async function eliminarSucursal(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará la sucursal permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#343a40',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await db.collection('sucursales').doc(id).delete();
                loadSucursales();
                Swal.fire('Eliminada', 'La sucursal ha sido eliminada.', 'success');

                // Limpiar selección y deshabilitar botones
                selectedSucursalId = null;
                document.querySelectorAll('#sucursalesTable tbody tr').forEach(row => {
                    row.classList.remove('selected');
                });
                updateActionButtons();
            } catch (error) {
                console.error('Error al eliminar sucursal:', error);
                Swal.fire('Error', 'Ocurrió un error al eliminar la sucursal.', 'error');
            }
        }
    });
}

// Función para desactivar una sucursal
async function desactivarSucursal(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas desactivar esta sucursal? Ya no aparecerá en las sucursales activas.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, desactivar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await db.collection('sucursales').doc(id).update({
                    status: 'inactivo',
                    fechaDesactivacion: firebase.firestore.FieldValue.serverTimestamp()
                });
                loadSucursales();
                Swal.fire('Desactivada', 'La sucursal ha sido desactivada.', 'success');

                // Limpiar selección y deshabilitar botones
                selectedSucursalId = null;
                document.querySelectorAll('#sucursalesTable tbody tr').forEach(row => {
                    row.classList.remove('selected');
                });
                updateActionButtons();
            } catch (error) {
                console.error('Error al desactivar sucursal:', error);
                Swal.fire('Error', 'Ocurrió un error al desactivar la sucursal.', 'error');
            }
        }
    });
}

// Función para cargar las opciones de empresas en los selects
async function loadEmpresasSelectOptions() {
    try {
        const empresasSnapshot = await db.collection('empresas').where('status', '==', 'activo').orderBy('name').get();
        const empresaSelect = document.getElementById('empresaSelect');
        const editEmpresaSelect = document.getElementById('editEmpresaSelect');
        const empresaFilterSelect = document.getElementById('empresaFilterSelect');

        empresaSelect.innerHTML = '<option value="">Selecciona una empresa</option>';
        editEmpresaSelect.innerHTML = '<option value="">Selecciona una empresa</option>';
        empresaFilterSelect.innerHTML = '<option value="">Todas las empresas</option>';

        empresasSnapshot.forEach(function(doc) {
            const empresa = doc.data();

            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = empresa.name;
            empresaSelect.appendChild(option);

            const editOption = document.createElement('option');
            editOption.value = doc.id;
            editOption.textContent = empresa.name;
            editEmpresaSelect.appendChild(editOption);

            const filterOption = document.createElement('option');
            filterOption.value = doc.id;
            filterOption.textContent = empresa.name;
            empresaFilterSelect.appendChild(filterOption);
        });
    } catch (error) {
        console.error('Error al cargar opciones de empresas:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las empresas.', 'error');
    }
}

// Función para cargar las opciones de encargados en los selects
async function loadEncargadosSelectOptions(selectId) {
    try {
        // Supongamos que los encargados están en una colección llamada 'encargados'
        const encargadosSnapshot = await db.collection('encargados').orderBy('nombre').get();
        const encargadoSelect = document.getElementById(selectId);

        encargadoSelect.innerHTML = '<option value="">Selecciona un encargado</option>';

        encargadosSnapshot.forEach(function(doc) {
            const encargado = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = encargado.nombre;
            encargadoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar opciones de encargados:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar los encargados.', 'error');
    }
}

// Función para cargar las opciones de encargados en los selects de edición con selección predefinida
async function loadEncargadosSelectOptionsEditar(selectId, encargadoId) {
    try {
        const encargadosSnapshot = await db.collection('encargados').orderBy('nombre').get();
        const encargadoSelect = document.getElementById(selectId);

        encargadoSelect.innerHTML = '<option value="">Selecciona un encargado</option>';

        encargadosSnapshot.forEach(function(doc) {
            const encargado = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = encargado.nombre;
            if (doc.id === encargadoId) {
                option.selected = true;
            }
            encargadoSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar opciones de encargados:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar los encargados.', 'error');
    }
}

// Evento para el filtro de sucursales por empresa
document.getElementById('empresaFilterSelect').addEventListener('change', function() {
    loadSucursales();
});

// Función para cerrar modales al hacer clic fuera de ellos
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
}
