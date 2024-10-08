// Inicializa Firebase
var firebaseConfig = {
    apiKey: "AIzaSyBNalkMiZuqQ-APbvRQC2MmF_hACQR0F3M",
    authDomain: "logisticdb-2e63c.firebaseapp.com",
    projectId: "logisticdb-2e63c",
    storageBucket: "logisticdb-2e63c.appspot.com",
    messagingSenderId: "917523682093",
    appId: "1:917523682093:web:6b03fcce4dd509ecbe79a4"
};

// Inicializa Firebase solo si no está inicializado previamente
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

var db = firebase.firestore();

// Evento que se ejecuta al cargar el DOM
document.addEventListener("DOMContentLoaded", function() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        // Redirige al usuario a la página de login si no está autenticado
        window.location.href = "../../Login/Login.html";
        return;
    }

    // Obtiene los detalles del usuario para determinar permisos
    db.collection("usuarios").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const role = doc.data().role;
            const permissions = doc.data().permissions || [];

            if (role === "admin_general") {
                habilitarTodosLosBotones();
            } else {
                aplicarPermisos(permissions);
            }

            estilizarBotones();
        } else {
            console.error("No se pudo encontrar el usuario.");
            window.location.href = "../../Login/Login.html";
        }
    }).catch((error) => {
        console.error("Error obteniendo el documento: ", error);
        window.location.href = "../../Login/Login.html";
    });
});

// Función para habilitar todos los botones (usuario admin_general)
function habilitarTodosLosBotones() {
    document.getElementById("providersBtn").disabled = false;
    document.getElementById("productsBtn").disabled = false;
    document.getElementById("addProviderBtn").disabled = false;
    document.getElementById("saveAddProviderBtn").disabled = false;
    document.getElementById("saveEditProviderBtn").disabled = false;
    document.getElementById("addProductBtn").disabled = false;
    document.getElementById("saveAddProductBtn").disabled = false;
    document.getElementById("saveEditProductBtn").disabled = false;
    document.getElementById("generateReportBtn").disabled = false;
}

// Función para aplicar permisos según el usuario
function aplicarPermisos(permissions) {
    if (permissions.includes("verProveedores")) {
        document.getElementById("providersBtn").disabled = false;
        document.getElementById("addProviderBtn").disabled = !permissions.includes("agregarProveedores");
        document.getElementById("saveAddProviderBtn").disabled = !permissions.includes("agregarProveedores");
        document.getElementById("saveEditProviderBtn").disabled = !permissions.includes("editarProveedores");
    }
    if (permissions.includes("verProductos")) {
        document.getElementById("productsBtn").disabled = false;
        document.getElementById("addProductBtn").disabled = !permissions.includes("agregarProductos");
        document.getElementById("saveAddProductBtn").disabled = !permissions.includes("agregarProductos");
        document.getElementById("saveEditProductBtn").disabled = !permissions.includes("editarProductos");
    }
    if (permissions.includes("generarReporte")) {
        document.getElementById("generateReportBtn").disabled = false;
    }
}

// Función para estilizar los botones según su estado (habilitado/deshabilitado)
function estilizarBotones() {
    const buttons = document.querySelectorAll("button");
    buttons.forEach(button => {
        if (button.disabled) {
            button.style.backgroundColor = "#ccc";
            button.style.cursor = "not-allowed";
        } else {
            // Define colores específicos si se requiere, de lo contrario mantiene el color definido en CSS
            if (button.id === "generateReportBtn") {
                button.style.backgroundColor = "#6f42c1"; // Color específico para Generar Reporte
            } else if (button.classList.contains("delete-btn")) {
                // Mantener el color rojo para botones de eliminar
                button.style.backgroundColor = "#dc3545";
            } else {
                button.style.backgroundColor = "#007BFF"; // Azul para otros botones
            }
            button.style.cursor = "pointer";
        }
    });
}

// Funciones para mostrar y ocultar secciones
function showProviders() {
    document.getElementById('providersContainer').style.display = 'block';
    document.getElementById('productsContainer').style.display = 'none';
    document.getElementById('reportContainer').style.display = 'none';
    loadProviders();
}

function showProducts() {
    document.getElementById('providersContainer').style.display = 'none';
    document.getElementById('productsContainer').style.display = 'block';
    document.getElementById('reportContainer').style.display = 'none';
    loadProviderOptions(); // Cargar proveedores para filtro en productos
    loadProducts(); // Cargar productos
}

function showAddProviderForm() {
    document.getElementById('addProviderModal').style.display = 'block';
}

function showAddProductForm() {
    document.getElementById('addProductModal').style.display = 'block';
    loadProviderOptions(); // Cargar proveedores en el dropdown
}

// Función para cerrar modales
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Función para verificar si un valor es un entero no negativo
function isInteger(value) {
    return Number.isInteger(parseFloat(value)) && Number(value) >= 0;
}

// Funciones para agregar, editar y eliminar proveedores
async function addProvider() {
    try {
        var providerName = document.getElementById('providerName').value.trim();
        var providerContactNumber = document.getElementById('providerContactNumber').value.trim();
        var providerAddress = document.getElementById('providerAddress').value.trim();
        var providerPhone = document.getElementById('providerPhone').value.trim();
        var providerEmail = document.getElementById('providerEmail').value.trim();
        var providerCreditDays = document.getElementById('providerCreditDays').value.trim();
        var providerPaymentTerms = document.getElementById('providerPaymentTerms').value.trim();
        var sellerName = document.getElementById('sellerName').value.trim();
        var sellerPhone = document.getElementById('sellerPhone').value.trim();
        var chiefSellerName = document.getElementById('chiefSellerName').value.trim();
        var chiefSellerPhone = document.getElementById('chiefSellerPhone').value.trim();
        var creditPersonName = document.getElementById('creditPersonName').value.trim();
        var creditPersonPhone = document.getElementById('creditPersonPhone').value.trim();
        var providerType = document.getElementById('providerType').value.trim();
        var preferredPaymentMethod = document.getElementById('preferredPaymentMethod').value.trim();
        var additionalNotes = document.getElementById('additionalNotes').value.trim();

        // Validaciones
        if (!providerName) throw new Error('El nombre del proveedor no puede estar vacío');
        if (providerCreditDays && !isInteger(providerCreditDays)) throw new Error('Los días de crédito deben ser un número entero no negativo');
        // Puedes agregar más validaciones según sea necesario

        await db.collection('providers').add({
            name: providerName,
            contactNumber: providerContactNumber,
            address: providerAddress,
            phone: providerPhone,
            email: providerEmail,
            creditDays: providerCreditDays ? parseInt(providerCreditDays) : 0,
            paymentTerms: providerPaymentTerms,
            sellerName: sellerName,
            sellerPhone: sellerPhone,
            chiefSellerName: chiefSellerName,
            chiefSellerPhone: chiefSellerPhone,
            creditPersonName: creditPersonName,
            creditPersonPhone: creditPersonPhone,
            type: providerType,
            preferredPaymentMethod: preferredPaymentMethod,
            additionalNotes: additionalNotes
        });

        closeModal('addProviderModal');
        loadProviders();
        // Limpiar el formulario
        document.getElementById('addProviderModal').querySelectorAll('input, textarea').forEach(input => input.value = '');
    } catch (error) {
        console.error('Error al agregar proveedor:', error);
        alert('Error al agregar proveedor: ' + error.message);
    }
}

async function loadProviders() {
    try {
        var providersSnapshot = await db.collection('providers').get();
        var providersTableBody = document.getElementById('providersTable').getElementsByTagName('tbody')[0];

        providersTableBody.innerHTML = '';

        providersSnapshot.forEach(function(doc) {
            var provider = doc.data();
            var row = providersTableBody.insertRow();
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            cell1.textContent = provider.name;
            cell2.innerHTML = `
                <button onclick="viewProviderDetails('${doc.id}')">Ver Detalles</button>
                <button onclick="showEditProviderForm('${doc.id}')">Editar</button>
                <button class="delete-btn" onclick="deleteProvider('${doc.id}')">Eliminar</button>`;
        });
    } catch (error) {
        console.error('Error al cargar proveedores:', error);
        alert('Error al cargar proveedores: ' + error.message);
    }
}

async function viewProviderDetails(id) {
    try {
        var doc = await db.collection('providers').doc(id).get();
        if (doc.exists) {
            var provider = doc.data();
            var details = `
                <strong>Nombre:</strong> ${provider.name}<br>
                <strong>Número de Contacto:</strong> ${provider.contactNumber || 'No disponible'}<br>
                <strong>Dirección:</strong> ${provider.address || 'No disponible'}<br>
                <strong>Teléfono:</strong> ${provider.phone || 'No disponible'}<br>
                <strong>Correo Electrónico:</strong> ${provider.email || 'No disponible'}<br>
                <strong>Días de Crédito:</strong> ${provider.creditDays || 'No disponible'}<br>
                <strong>Términos de Pago:</strong> ${provider.paymentTerms || 'No disponible'}<br>
                <strong>Nombre del Vendedor:</strong> ${provider.sellerName || 'No disponible'}<br>
                <strong>Teléfono del Vendedor:</strong> ${provider.sellerPhone || 'No disponible'}<br>
                <strong>Nombre del Jefe del Vendedor:</strong> ${provider.chiefSellerName || 'No disponible'}<br>
                <strong>Teléfono del Jefe del Vendedor:</strong> ${provider.chiefSellerPhone || 'No disponible'}<br>
                <strong>Nombre de la Persona de Créditos:</strong> ${provider.creditPersonName || 'No disponible'}<br>
                <strong>Teléfono de la Persona de Créditos:</strong> ${provider.creditPersonPhone || 'No disponible'}<br>
                <strong>Tipo de Proveedor:</strong> ${provider.type || 'No disponible'}<br>
                <strong>Método de Pago Preferido:</strong> ${provider.preferredPaymentMethod || 'No disponible'}<br>
                <strong>Notas Adicionales:</strong> ${provider.additionalNotes || 'No disponible'}<br>`;
            document.getElementById('providerDetails').innerHTML = details;
            document.getElementById('providerDetailsModal').style.display = 'block';
        } else {
            alert('No se encontraron detalles del proveedor.');
        }
    } catch (error) {
        console.error('Error al obtener detalles del proveedor:', error);
        alert('Error al obtener detalles del proveedor: ' + error.message);
    }
}

async function showEditProviderForm(id) {
    try {
        var doc = await db.collection('providers').doc(id).get();
        if (doc.exists) {
            var provider = doc.data();
            document.getElementById('editProviderId').value = id;
            document.getElementById('editProviderName').value = provider.name;
            document.getElementById('editProviderContactNumber').value = provider.contactNumber || '';
            document.getElementById('editProviderAddress').value = provider.address || '';
            document.getElementById('editProviderPhone').value = provider.phone || '';
            document.getElementById('editProviderEmail').value = provider.email || '';
            document.getElementById('editProviderCreditDays').value = provider.creditDays || '';
            document.getElementById('editProviderPaymentTerms').value = provider.paymentTerms || '';
            document.getElementById('editSellerName').value = provider.sellerName || '';
            document.getElementById('editSellerPhone').value = provider.sellerPhone || '';
            document.getElementById('editChiefSellerName').value = provider.chiefSellerName || '';
            document.getElementById('editChiefSellerPhone').value = provider.chiefSellerPhone || '';
            document.getElementById('editCreditPersonName').value = provider.creditPersonName || '';
            document.getElementById('editCreditPersonPhone').value = provider.creditPersonPhone || '';
            document.getElementById('editProviderType').value = provider.type || '';
            document.getElementById('editPreferredPaymentMethod').value = provider.preferredPaymentMethod || '';
            document.getElementById('editAdditionalNotes').value = provider.additionalNotes || '';
            document.getElementById('editProviderModal').style.display = 'block';
        } else {
            alert('Proveedor no encontrado.');
        }
    } catch (error) {
        console.error('Error al cargar datos del proveedor:', error);
        alert('Error al cargar datos del proveedor: ' + error.message);
    }
}

async function updateProvider() {
    try {
        var id = document.getElementById('editProviderId').value;
        var providerName = document.getElementById('editProviderName').value.trim();
        var providerContactNumber = document.getElementById('editProviderContactNumber').value.trim();
        var providerAddress = document.getElementById('editProviderAddress').value.trim();
        var providerPhone = document.getElementById('editProviderPhone').value.trim();
        var providerEmail = document.getElementById('editProviderEmail').value.trim();
        var providerCreditDays = document.getElementById('editProviderCreditDays').value.trim();
        var providerPaymentTerms = document.getElementById('editProviderPaymentTerms').value.trim();
        var sellerName = document.getElementById('editSellerName').value.trim();
        var sellerPhone = document.getElementById('editSellerPhone').value.trim();
        var chiefSellerName = document.getElementById('editChiefSellerName').value.trim();
        var chiefSellerPhone = document.getElementById('editChiefSellerPhone').value.trim();
        var creditPersonName = document.getElementById('editCreditPersonName').value.trim();
        var creditPersonPhone = document.getElementById('editCreditPersonPhone').value.trim();
        var providerType = document.getElementById('editProviderType').value.trim();
        var preferredPaymentMethod = document.getElementById('editPreferredPaymentMethod').value.trim();
        var additionalNotes = document.getElementById('editAdditionalNotes').value.trim();

        // Validaciones
        if (!providerName) throw new Error('El nombre del proveedor no puede estar vacío');
        if (providerCreditDays && !isInteger(providerCreditDays)) throw new Error('Los días de crédito deben ser un número entero no negativo');

        // Convertir creditDays a entero si no está vacío
        var creditDaysValue = providerCreditDays ? parseInt(providerCreditDays) : 0;

        var updatedProvider = {
            name: providerName,
            contactNumber: providerContactNumber,
            address: providerAddress,
            phone: providerPhone,
            email: providerEmail,
            creditDays: creditDaysValue,
            paymentTerms: providerPaymentTerms,
            sellerName: sellerName,
            sellerPhone: sellerPhone,
            chiefSellerName: chiefSellerName,
            chiefSellerPhone: chiefSellerPhone,
            creditPersonName: creditPersonName,
            creditPersonPhone: creditPersonPhone,
            type: providerType,
            preferredPaymentMethod: preferredPaymentMethod,
            additionalNotes: additionalNotes
        };

        await db.collection('providers').doc(id).update(updatedProvider);

        closeModal('editProviderModal');
        loadProviders();
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        alert('Error al actualizar proveedor: ' + error.message);
    }
}

async function deleteProvider(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este proveedor?')) {
        try {
            // Verificar si el proveedor tiene productos asociados antes de eliminar
            var productsSnapshot = await db.collection('products').where('providerId', '==', id).get();
            if (!productsSnapshot.empty) {
                throw new Error('Este proveedor tiene productos asociados y no puede ser eliminado.');
            }

            await db.collection('providers').doc(id).delete();
            loadProviders();
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            alert('Error al eliminar proveedor: ' + error.message);
        }
    }
}

// Funciones para agregar, editar y eliminar productos
async function addProduct() {
    try {
        var productName = document.getElementById('productName').value.trim();
        var productPresentation = document.getElementById('productPresentation').value.trim();
        var providerSelect = document.getElementById('providerSelect');
        var providerId = providerSelect.value;
        var productPurchaseMeasure = document.getElementById('productPurchaseMeasure').value.trim();
        var productPrice = document.getElementById('productPrice').value.trim();
        var productDescription = document.getElementById('productDescription').value.trim();

        // Validaciones
        if (!productName) throw new Error('El nombre del producto no puede estar vacío');
        if (!productPresentation) throw new Error('La presentación del producto no puede estar vacía');
        if (!providerId) throw new Error('Debes seleccionar un proveedor');
        if (productPrice === '') throw new Error('El precio del producto no puede estar vacío');
        if (isNaN(productPrice) || Number(productPrice) < 0) throw new Error('El precio del producto debe ser un número positivo');

        await db.collection('products').add({
            name: productName,
            presentation: productPresentation,
            providerId: providerId,
            purchaseMeasure: productPurchaseMeasure,
            price: parseFloat(productPrice),
            description: productDescription
        });

        closeModal('addProductModal');
        loadProducts();
        // Limpiar el formulario
        document.getElementById('addProductModal').querySelectorAll('input, textarea').forEach(input => input.value = '');
    } catch (error) {
        console.error('Error al agregar producto:', error);
        alert('Error al agregar producto: ' + error.message);
    }
}

async function loadProducts() {
    try {
        var productsSnapshot = await db.collection('products').get();
        var productsTableBody = document.getElementById('productsTable').getElementsByTagName('tbody')[0];

        productsTableBody.innerHTML = '';

        for (let doc of productsSnapshot.docs) {
            let product = doc.data();
            let providerDoc = await db.collection('providers').doc(product.providerId).get();
            let providerName = providerDoc.exists ? providerDoc.data().name : 'Proveedor no encontrado';

            let row = productsTableBody.insertRow();
            row.setAttribute('data-provider-id', product.providerId);
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let cell4 = row.insertCell(3);
            let cell5 = row.insertCell(4);
            let cell6 = row.insertCell(5);
            let cell7 = row.insertCell(6);

            cell1.textContent = product.name;
            cell2.textContent = product.presentation;
            cell3.textContent = providerName;
            cell4.textContent = product.purchaseMeasure || '';
            cell5.textContent = product.price ? `Q${product.price.toFixed(2)}` : '';
            cell6.textContent = product.description || '';
            cell7.innerHTML = `
                <button onclick="viewProductDetails('${doc.id}')">Ver Detalles</button>
                <button onclick="showEditProductForm('${doc.id}')">Editar</button>
                <button class="delete-btn" onclick="deleteProduct('${doc.id}')">Eliminar</button>`;
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        alert('Error al cargar productos: ' + error.message);
    }
}

async function viewProductDetails(id) {
    try {
        var doc = await db.collection('products').doc(id).get();
        if (doc.exists) {
            var product = doc.data();
            var providerDoc = await db.collection('providers').doc(product.providerId).get();
            var providerName = providerDoc.exists ? providerDoc.data().name : 'Proveedor no encontrado';

            var details = `
                <strong>Nombre:</strong> ${product.name}<br>
                <strong>Presentación:</strong> ${product.presentation}<br>
                <strong>Proveedor:</strong> ${providerName}<br>
                <strong>Medida de Compra:</strong> ${product.purchaseMeasure || 'No disponible'}<br>
                <strong>Precio:</strong> Q${product.price ? product.price.toFixed(2) : 'No disponible'}<br>
                <strong>Descripción:</strong> ${product.description || 'No disponible'}<br>`;
            document.getElementById('productDetails').innerHTML = details;
            document.getElementById('productDetailsModal').style.display = 'block';
        } else {
            alert('No se encontraron detalles del producto.');
        }
    } catch (error) {
        console.error('Error al obtener detalles del producto:', error);
        alert('Error al obtener detalles del producto: ' + error.message);
    }
}

async function showEditProductForm(id) {
    try {
        var doc = await db.collection('products').doc(id).get();
        if (doc.exists) {
            var product = doc.data();
            document.getElementById('editProductId').value = id;
            document.getElementById('editProductName').value = product.name;
            document.getElementById('editProductPresentation').value = product.presentation;
            document.getElementById('editProductPurchaseMeasure').value = product.purchaseMeasure || '';
            document.getElementById('editProductPrice').value = product.price !== undefined ? product.price : '';
            document.getElementById('editProductDescription').value = product.description || '';
            document.getElementById('editProductModal').style.display = 'block';
        } else {
            alert('Producto no encontrado.');
        }
    } catch (error) {
        console.error('Error al cargar datos del producto:', error);
        alert('Error al cargar datos del producto: ' + error.message);
    }
}

async function updateProduct() {
    try {
        var id = document.getElementById('editProductId').value;
        var productName = document.getElementById('editProductName').value.trim();
        var productPresentation = document.getElementById('editProductPresentation').value.trim();
        var productPurchaseMeasure = document.getElementById('editProductPurchaseMeasure').value.trim();
        var productPrice = document.getElementById('editProductPrice').value.trim();
        var productDescription = document.getElementById('editProductDescription').value.trim();

        // Validaciones
        if (!productName) throw new Error('El nombre del producto no puede estar vacío');
        if (!productPresentation) throw new Error('La presentación del producto no puede estar vacía');
        if (productPrice === '') throw new Error('El precio del producto no puede estar vacío');
        if (isNaN(productPrice) || Number(productPrice) < 0) throw new Error('El precio del producto debe ser un número positivo');

        var updatedProduct = {
            name: productName,
            presentation: productPresentation,
            purchaseMeasure: productPurchaseMeasure,
            price: parseFloat(productPrice),
            description: productDescription
        };

        await db.collection('products').doc(id).update(updatedProduct);

        closeModal('editProductModal');
        loadProducts();
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        alert('Error al actualizar producto: ' + error.message);
    }
}

async function deleteProduct(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        try {
            await db.collection('products').doc(id).delete();
            loadProducts();
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            alert('Error al eliminar producto: ' + error.message);
        }
    }
}

// Funciones para cargar opciones de proveedores en los formularios de productos
async function loadProviderOptions() {
    try {
        var providerSelect = document.getElementById('providerSelect');
        var providerFilterSelect = document.getElementById('productProviderFilter');
        providerSelect.innerHTML = '<option value="">Selecciona un Proveedor</option>'; // Agrega una opción por defecto
        providerFilterSelect.innerHTML = '<option value="">Todos los Proveedores</option>'; // Limpiar y resetear el filtro de proveedor

        var providersSnapshot = await db.collection('providers').get();
        providersSnapshot.forEach(function(doc) {
            var provider = doc.data();
            var option = document.createElement('option');
            option.value = doc.id;
            option.textContent = provider.name;
            providerSelect.appendChild(option);
            providerFilterSelect.appendChild(option.cloneNode(true));
        });
    } catch (error) {
        console.error('Error al cargar proveedores en el dropdown:', error);
        alert('Error al cargar proveedores en el dropdown: ' + error.message);
    }
}

// Funciones de filtrado
function filterProviders() {
    var input = document.getElementById('providerSearchInput');
    var filter = input.value.toUpperCase();
    var table = document.getElementById('providersTable');
    var tr = table.getElementsByTagName('tr');

    for (var i = 1; i < tr.length; i++) { // Empieza en 1 para omitir el encabezado
        var td = tr[i].getElementsByTagName('td')[0];
        if (td) {
            var txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = '';
            } else {
                tr[i].style.display = 'none';
            }
        }       
    }
}

function filterProductsByName() {
    var input = document.getElementById('productSearchInput');
    var filter = input.value.toUpperCase();
    var table = document.getElementById('productsTable');
    var tr = table.getElementsByTagName('tr');

    for (var i = 1; i < tr.length; i++) { // Empieza en 1 para omitir el encabezado
        var td = tr[i].getElementsByTagName('td')[0];
        if (td) {
            var txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = '';
            } else {
                tr[i].style.display = 'none';
            }
        }       
    }
}

function filterProductsByProvider() {
    var select = document.getElementById('productProviderFilter');
    var filter = select.value;
    var table = document.getElementById('productsTable');
    var tr = table.getElementsByTagName('tr');

    for (var i = 1; i < tr.length; i++) { // Empieza en 1 para omitir el encabezado
        var providerId = tr[i].getAttribute('data-provider-id');
        if (filter === '' || providerId === filter) {
            tr[i].style.display = '';
        } else {
            tr[i].style.display = 'none';
        }
    }
}

// Función para generar el reporte con filas unidas usando rowspan
async function generateReport() {
    try {
        // Mostrar el contenedor del reporte y ocultar otros contenedores
        document.getElementById('reportContainer').style.display = 'block';
        document.getElementById('providersContainer').style.display = 'none';
        document.getElementById('productsContainer').style.display = 'none';

        var reportTableBody = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
        reportTableBody.innerHTML = '';

        // Obtener proveedores y productos
        var providersSnapshot = await db.collection('providers').get();
        var productsSnapshot = await db.collection('products').get();

        var providers = {};
        providersSnapshot.forEach((doc) => {
            providers[doc.id] = doc.data();
        });

        var reportData = {};

        productsSnapshot.forEach((doc) => {
            var product = doc.data();
            var providerId = product.providerId;

            if (!reportData[providerId]) {
                reportData[providerId] = {
                    provider: providers[providerId],
                    products: []
                };
            }

            reportData[providerId].products.push(product);
        });

        // Generar las filas del reporte con rowspan
        for (let providerId in reportData) {
            let providerData = reportData[providerId];
            let products = providerData.products;
            let provider = providerData.provider;

            // Manejar caso donde el proveedor no tiene productos
            if (products.length === 0) {
                let row = reportTableBody.insertRow();

                let cell1 = row.insertCell();
                cell1.textContent = provider.name;

                let cell2 = row.insertCell();
                cell2.textContent = provider.contactNumber || 'No disponible';

                let cell3 = row.insertCell();
                cell3.textContent = 'No hay productos asociados';

                let cell4 = row.insertCell();
                cell4.textContent = 'No disponible';

                let cell5 = row.insertCell();
                cell5.textContent = 'No disponible';

                continue; // Salta al siguiente proveedor
            }

            products.forEach((product, index) => {
                let row = reportTableBody.insertRow();

                if (index === 0) {
                    // Insertar celdas para Proveedor y Número de Contacto con rowspan
                    let cell1 = document.createElement('td');
                    cell1.textContent = provider.name;
                    cell1.rowSpan = products.length; // Establece el rowspan
                    row.appendChild(cell1);

                    let cell2 = document.createElement('td');
                    cell2.textContent = provider.contactNumber || 'No disponible';
                    cell2.rowSpan = products.length; // Establece el rowspan
                    row.appendChild(cell2);
                }

                // Insertar celdas para Producto, Medida de Compra y Precio
                let cell3 = row.insertCell();
                cell3.textContent = product.name;

                let cell4 = row.insertCell();
                cell4.textContent = product.purchaseMeasure || 'No disponible';

                let cell5 = row.insertCell();
                cell5.textContent = product.price ? `Q${product.price.toFixed(2)}` : 'No disponible';
            });
        }

    } catch (error) {
        console.error('Error al generar el reporte:', error);
        alert('Error al generar el reporte: ' + error.message);
    }
}

// Función para exportar el reporte como Imagen
async function exportReportAsImage() {
    try {
        const report = document.getElementById('reportContainer');

        // Guardar el estilo actual del reporte
        const originalBorder = report.style.border;

        // Ocultar bordes durante la captura
        report.style.border = 'none';

        // Opciones para html2canvas
        const options = {
            scale: 3, // Aumenta la escala para mejorar la calidad
            useCORS: true, // Habilita CORS para imágenes externas
            backgroundColor: '#fff' // Establece un fondo blanco
        };

        // Captura del reporte
        const canvas = await html2canvas(report, options);
        const imgData = canvas.toDataURL('image/png');

        // Restaurar el estilo original del reporte
        report.style.border = originalBorder;

        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'reporte.png';
        link.click();
    } catch (error) {
        console.error('Error al exportar como imagen:', error);
        alert('Error al exportar como imagen: ' + error.message);
    }
}

// Función para exportar el reporte como PDF
async function exportReportAsPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const report = document.getElementById('reportContainer');
        const canvas = await html2canvas(report, { scale: 3, useCORS: true, backgroundColor: '#fff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('reporte.pdf');
    } catch (error) {
        console.error('Error al exportar como PDF:', error);
        alert('Error al exportar como PDF: ' + error.message);
    }
}

// Función para exportar el reporte como Excel
async function exportReportAsExcel() {
    try {
        const reportTable = document.getElementById('reportTable');
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.table_to_sheet(reportTable);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
        XLSX.writeFile(workbook, 'reporte.xlsx');
    } catch (error) {
        console.error('Error al exportar como Excel:', error);
        alert('Error al exportar como Excel: ' + error.message);
    }
}
