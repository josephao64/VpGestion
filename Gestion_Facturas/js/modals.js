// Funciones para gestionar modales

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function openAddFacturaModal() {
    loadEmpresasSelectOptions('empresaSelect', 'sucursalSelect');
    loadProveedoresSelectOptions('proveedorSelect');
    openModal('addFacturaModal');
}

// Otras funciones relacionadas con modales omitidas por brevedadjC051183