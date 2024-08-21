// modals.js

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
