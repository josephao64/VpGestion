// empresas.js

// Inicializar Firebase Firestore
var db = firebase.firestore();

// Variables para seguimiento de selección
var selectedEmpresaId = null;
var selectedEmpresaInactivaId = null;
var selectedSucursalId = null;
var selectedSucursalInactivaId = null;

// Función que se ejecuta al cargar el DOM
document.addEventListener("DOMContentLoaded", function() {
    estilizarBotones();
    loadEmpresasActivas();
    loadEmpresasInactivas();
    loadSucursalesActivas();
    loadSucursalesInactivas();
    loadEmpresasSelectOptions();

    // Asignar eventos a los botones de agregar
    document.getElementById('addEmpresaBtn').addEventListener('click', () => {
        resetAddEmpresaForm();
        openModal('addEmpresaModal');
    });

    document.getElementById('addSucursalBtn').addEventListener('click', () => {
        resetAddSucursalForm();
        loadEmpresasSelectOptions();
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
            solicitarMotivoDesactivacionEmpresa(selectedEmpresaId);
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

    document.getElementById('activarSucursalBtn').addEventListener('click', () => {
        if (selectedSucursalInactivaId) {
            activarSucursal(selectedSucursalInactivaId);
        }
    });

    document.getElementById('verHistorialSucursalBtn').addEventListener('click', () => {
        if (selectedSucursalInactivaId) {
            verHistorialSucursal(selectedSucursalInactivaId);
        }
    });

    // Asignar eventos a las tablas para manejar selección
    assignTableSelectionEvents('empresasTable', 'empresa');
    assignTableSelectionEvents('empresasInactivasTable', 'empresaInactiva');
    assignTableSelectionEvents('sucursalesActivasTable', 'sucursalActiva');
    assignTableSelectionEvents('sucursalesInactivasTable', 'sucursalInactiva');

    // Mostrar el contenedor de empresas activas por defecto
    showEmpresasActivas();

    // Evento para el filtro de sucursales activas por empresa
    document.getElementById('empresaFilterActivasSelect').addEventListener('change', function() {
        loadSucursalesActivas();
    });

    // Evento para cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', () => {
        firebase.auth().signOut().then(() => {
            window.location.href = '../login.html'; // Redirige a la página de login
        }).catch((error) => {
            console.error('Error al cerrar sesión:', error);
            Swal.fire('Error', 'Ocurrió un error al cerrar sesión.', 'error');
        });
    });
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
            }
            button.style.cursor = "pointer";
        }
    });
}

// Funciones para mostrar y ocultar contenedores
function showEmpresasActivas() {
    document.getElementById('empresasActivasContainer').style.display = 'block';
    document.getElementById('empresasInactivasContainer').style.display = 'none';
    document.getElementById('sucursalesActivasContainer').style.display = 'none';
    document.getElementById('sucursalesInactivasContainer').style.display = 'none';
}

function showEmpresasInactivas() {
    document.getElementById('empresasActivasContainer').style.display = 'none';
    document.getElementById('empresasInactivasContainer').style.display = 'block';
    document.getElementById('sucursalesActivasContainer').style.display = 'none';
    document.getElementById('sucursalesInactivasContainer').style.display = 'none';
}

function showSucursalesActivas() {
    document.getElementById('empresasActivasContainer').style.display = 'none';
    document.getElementById('empresasInactivasContainer').style.display = 'none';
    document.getElementById('sucursalesActivasContainer').style.display = 'block';
    document.getElementById('sucursalesInactivasContainer').style.display = 'none';
}

function showSucursalesInactivas() {
    document.getElementById('empresasActivasContainer').style.display = 'none';
    document.getElementById('empresasInactivasContainer').style.display = 'none';
    document.getElementById('sucursalesActivasContainer').style.display = 'none';
    document.getElementById('sucursalesInactivasContainer').style.display = 'block';
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
    if (!table) {
        console.error(`Tabla con ID '${tableId}' no encontrada.`);
        return;
    }

    const tbody = table.getElementsByTagName('tbody')[0];
    if (!tbody) {
        console.error(`No se encontró <tbody> en la tabla '${tableId}'.`);
        return;
    }

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
            } else if (type === 'sucursalActiva') {
                selectedSucursalId = null;
            } else if (type === 'sucursalInactiva') {
                selectedSucursalInactivaId = null;
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
                selectedSucursalInactivaId = null;
            } else if (type === 'empresaInactiva') {
                selectedEmpresaInactivaId = id;
                selectedEmpresaId = null;
                selectedSucursalId = null;
                selectedSucursalInactivaId = null;
            } else if (type === 'sucursalActiva') {
                selectedSucursalId = id;
                selectedEmpresaId = null;
                selectedEmpresaInactivaId = null;
                selectedSucursalInactivaId = null;
            } else if (type === 'sucursalInactiva') {
                selectedSucursalInactivaId = id;
                selectedSucursalId = null;
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

    // Sucursales Activas
    const editarSucursalBtn = document.getElementById('editarSucursalBtn');
    const desactivarSucursalBtn = document.getElementById('desactivarSucursalBtn');
    const eliminarSucursalBtn = document.getElementById('eliminarSucursalBtn');

    editarSucursalBtn.disabled = !selectedSucursalId;
    desactivarSucursalBtn.disabled = !selectedSucursalId;
    eliminarSucursalBtn.disabled = !selectedSucursalId;

    // Sucursales Inactivas
    const activarSucursalBtn = document.getElementById('activarSucursalBtn');
    const verHistorialSucursalBtn = document.getElementById('verHistorialSucursalBtn');

    activarSucursalBtn.disabled = !selectedSucursalInactivaId;
    verHistorialSucursalBtn.disabled = !selectedSucursalInactivaId;

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
        loadEmpresasActivas();
        Swal.fire('Éxito', 'Empresa agregada con éxito.', 'success');
        document.getElementById('addEmpresaForm').reset();
    } catch (error) {
        console.error('Error al agregar empresa:', error);
        Swal.fire('Error', 'Ocurrió un error al agregar la empresa.', 'error');
    }
}

// Función para cargar todas las empresas activas
async function loadEmpresasActivas() {
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
        console.error('Error al cargar empresas activas:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las empresas activas.', 'error');
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
            usuario: "Desconocido" // Reemplazar con el nombre del usuario autenticado si está disponible
        });

        closeModal('editEmpresaModal');
        loadEmpresasActivas();
        loadEmpresasInactivas();
        Swal.fire('Éxito', 'Empresa actualizada con éxito.', 'success');
    } catch (error) {
        console.error('Error al actualizar empresa:', error);
        Swal.fire('Error', 'Ocurrió un error al actualizar la empresa.', 'error');
    }
}

// Función para solicitar motivo de desactivación de empresa
function solicitarMotivoDesactivacionEmpresa(id) {
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
            usuario: "Desconocido" // Reemplazar con el nombre del usuario autenticado si está disponible
        });

        closeModal('motivoDesactivarEmpresaModal');
        loadEmpresasActivas();
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
                loadEmpresasActivas();
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
                loadEmpresasActivas();
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

// Función para agregar una nueva sucursal
async function addSucursal() {
    try {
        const sucursalName = document.getElementById('sucursalName').value.trim();
        const sucursalAddress = document.getElementById('sucursalAddress').value.trim();
        const sucursalPhone = document.getElementById('sucursalPhone').value.trim();
        const sucursalEmail = document.getElementById('sucursalEmail').value.trim();
        const sucursalTipo = document.getElementById('sucursalTipo').value; // CE1 o CE2
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

        if (!sucursalTipo) {
            Swal.fire('Error', 'Debes seleccionar el tipo de sucursal.', 'error');
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
            tipoSucursal: sucursalTipo,
            description: sucursalDescription,
            status: sucursalStatus,
            empresaId: empresaId
        });

        closeModal('addSucursalModal');
        loadSucursalesActivas();
        Swal.fire('Éxito', 'Sucursal agregada con éxito.', 'success');
        document.getElementById('addSucursalForm').reset();
    } catch (error) {
        console.error('Error al agregar sucursal:', error);
        Swal.fire('Error', 'Ocurrió un error al agregar la sucursal.', 'error');
    }
}

// Función para cargar todas las sucursales activas
async function loadSucursalesActivas() {
    try {
        const empresaFilter = document.getElementById('empresaFilterActivasSelect').value;
        let sucursalesQuery = db.collection('sucursales').where('status', '==', 'activo');

        if (empresaFilter) {
            sucursalesQuery = sucursalesQuery.where('empresaId', '==', empresaFilter);
        }

        const sucursalesSnapshot = await sucursalesQuery.orderBy('name').get();
        const sucursalesTableBody = document.getElementById('sucursalesActivasTable').getElementsByTagName('tbody')[0];
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
            row.insertCell(4).textContent = sucursal.tipoSucursal || 'N/A';
            row.insertCell(5).textContent = sucursal.description || 'N/A';
            row.insertCell(6).textContent = sucursal.status.charAt(0).toUpperCase() + sucursal.status.slice(1);
            row.insertCell(7).textContent = empresas[sucursal.empresaId] || 'N/A';
        });

        // Limpiar selección y deshabilitar botones
        selectedSucursalId = null;
        document.querySelectorAll('#sucursalesActivasTable tbody tr').forEach(row => {
            row.classList.remove('selected');
        });
        updateActionButtons();
    } catch (error) {
        console.error('Error al cargar sucursales activas:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las sucursales activas.', 'error');
    }
}

// Función para cargar todas las sucursales inactivas
async function loadSucursalesInactivas() {
    try {
        const sucursalesSnapshot = await db.collection('sucursales').where('status', '==', 'inactivo').orderBy('name').get();
        const sucursalesTableBody = document.getElementById('sucursalesInactivasTable').getElementsByTagName('tbody')[0];
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
            row.insertCell(4).textContent = sucursal.tipoSucursal || 'N/A';
            row.insertCell(5).textContent = sucursal.description || 'N/A';
            row.insertCell(6).textContent = sucursal.status.charAt(0).toUpperCase() + sucursal.status.slice(1);
            row.insertCell(7).textContent = empresas[sucursal.empresaId] || 'N/A';
        });

        // Limpiar selección y deshabilitar botones
        selectedSucursalInactivaId = null;
        document.querySelectorAll('#sucursalesInactivasTable tbody tr').forEach(row => {
            row.classList.remove('selected');
        });
        updateActionButtons();
    } catch (error) {
        console.error('Error al cargar sucursales inactivas:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las sucursales inactivas.', 'error');
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
            document.getElementById('editSucursalTipo').value = sucursal.tipoSucursal || '';
            document.getElementById('editSucursalDescription').value = sucursal.description || '';
            document.getElementById('editSucursalStatus').value = sucursal.status;
            document.getElementById('editEmpresaSelect').value = sucursal.empresaId || '';

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
        const sucursalTipo = document.getElementById('editSucursalTipo').value; // CE1 o CE2
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

        if (!sucursalTipo) {
            Swal.fire('Error', 'Debes seleccionar el tipo de sucursal.', 'error');
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
            tipoSucursal: sucursalTipo,
            description: sucursalDescription,
            status: sucursalStatus,
            empresaId: empresaId
        });

        // Guardar en el historial de cambios
        await db.collection('sucursalHistorial').add({
            sucursalId: id,
            motivoCambio: "Actualización de sucursal",
            fecha: firebase.firestore.FieldValue.serverTimestamp(),
            usuario: "Desconocido" // Reemplazar con el nombre del usuario autenticado si está disponible
        });

        closeModal('editSucursalModal');
        loadSucursalesActivas();
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
                loadSucursalesActivas();
                Swal.fire('Eliminada', 'La sucursal ha sido eliminada.', 'success');

                // Limpiar selección y deshabilitar botones
                selectedSucursalId = null;
                document.querySelectorAll('#sucursalesActivasTable tbody tr').forEach(row => {
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

                // Guardar en el historial de cambios
                await db.collection('sucursalHistorial').add({
                    sucursalId: id,
                    motivoCambio: "Desactivación de sucursal",
                    fecha: firebase.firestore.FieldValue.serverTimestamp(),
                    usuario: "Desconocido" // Reemplazar con el nombre del usuario autenticado si está disponible
                });

                loadSucursalesActivas();
                loadSucursalesInactivas();
                Swal.fire('Desactivada', 'La sucursal ha sido desactivada.', 'success');

                // Limpiar selección y deshabilitar botones
                selectedSucursalId = null;
                document.querySelectorAll('#sucursalesActivasTable tbody tr').forEach(row => {
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

// Función para activar una sucursal inactiva
async function activarSucursal(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¿Deseas activar esta sucursal?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Sí, activar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await db.collection('sucursales').doc(id).update({
                    status: 'activo',
                    fechaActivacion: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Guardar en el historial de cambios
                await db.collection('sucursalHistorial').add({
                    sucursalId: id,
                    motivoCambio: "Activación de sucursal",
                    fecha: firebase.firestore.FieldValue.serverTimestamp(),
                    usuario: "Desconocido" // Reemplazar con el nombre del usuario autenticado si está disponible
                });

                loadSucursalesActivas();
                loadSucursalesInactivas();
                Swal.fire('Activada', 'La sucursal ha sido activada.', 'success');

                // Limpiar selección y deshabilitar botones
                selectedSucursalInactivaId = null;
                document.querySelectorAll('#sucursalesInactivasTable tbody tr').forEach(row => {
                    row.classList.remove('selected');
                });
                updateActionButtons();
            } catch (error) {
                console.error('Error al activar sucursal:', error);
                Swal.fire('Error', 'Ocurrió un error al activar la sucursal.', 'error');
            }
        }
    });
}

// Función para ver el historial de cambios de una sucursal
async function verHistorialSucursal(id) {
    try {
        const historialSnapshot = await db.collection('sucursalHistorial')
            .where('sucursalId', '==', id)
            .orderBy('fecha', 'desc')
            .get();

        const historialTableBody = document.getElementById('historialSucursalTable').getElementsByTagName('tbody')[0];
        historialTableBody.innerHTML = '';

        historialSnapshot.forEach(function(doc) {
            const cambio = doc.data();
            const row = historialTableBody.insertRow();

            const fecha = cambio.fecha.toDate().toLocaleString();
            row.insertCell(0).textContent = fecha;
            row.insertCell(1).textContent = cambio.motivoCambio;
            row.insertCell(2).textContent = cambio.usuario || 'Desconocido';
        });

        openModal('historialSucursalModal');
    } catch (error) {
        console.error('Error al cargar historial de sucursal:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar el historial de la sucursal.', 'error');
    }
}

// Función para cargar las opciones de empresas en los selects
async function loadEmpresasSelectOptions() {
    try {
        const empresasSnapshot = await db.collection('empresas').where('status', '==', 'activo').orderBy('name').get();
        const empresaSelect = document.getElementById('empresaSelect');
        const editEmpresaSelect = document.getElementById('editEmpresaSelect');
        const empresaFilterActivasSelect = document.getElementById('empresaFilterActivasSelect');

        empresaSelect.innerHTML = '<option value="">Selecciona una empresa</option>';
        editEmpresaSelect.innerHTML = '<option value="">Selecciona una empresa</option>';
        empresaFilterActivasSelect.innerHTML = '<option value="">Todas las empresas</option>';

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
            empresaFilterActivasSelect.appendChild(filterOption);
        });
    } catch (error) {
        console.error('Error al cargar opciones de empresas:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las empresas.', 'error');
    }
}

// Función para cerrar modales al hacer clic fuera de ellos
window.onclick = function(event) {
    const modales = document.querySelectorAll('.modal');
    modales.forEach(modal => {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    });
}
