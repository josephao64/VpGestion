// Inicializa Firebase
var firebaseConfig = {
    apiKey: "AIzaSyBNalkMiZuqQ-APbvRQC2MmF_hACQR0F3M",
    authDomain: "logisticdb-2e63c.firebaseapp.com",
    projectId: "logisticdb-2e63c",
    storageBucket: "logisticdb-2e63c.appspot.com",
    messagingSenderId: "917523682093",
    appId: "1:917523682093:web:6b03fcce4dd509ecbe79a4"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function() {
    loadInventory();
    loadProductOptions();
    loadBranchOptions();  // Cargar las sucursales para el reporte
});

function showAddInventoryForm() {
    document.getElementById('addInventoryModal').style.display = 'block';
}

function showAdjustInventoryForm(productId) {
    document.getElementById('adjustInventoryModal').style.display = 'block';
    document.getElementById('adjustInventoryId').value = productId;
}

function showIncreaseInventoryForm(productId) {
    document.getElementById('increaseInventoryModal').style.display = 'block';
    document.getElementById('increaseInventoryId').value = productId;
}

function showReportTab() {
    document.getElementById('inventoryContainer').style.display = 'none';
    document.getElementById('reportContainer').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function loadProductOptions() {
    try {
        var productSelect = document.getElementById('productSelect');
        var reportProductSelect = document.getElementById('reportProductSelect');
        productSelect.innerHTML = ''; // Limpiar el dropdown antes de cargar los productos
        reportProductSelect.innerHTML = '<option value="">Seleccione un producto</option>'; // Limpiar y resetear el selector de reportes

        var productsSnapshot = await db.collection('products').get();
        productsSnapshot.forEach(function(doc) {
            var product = doc.data();
            var option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${product.name} (${product.presentation})`;
            productSelect.appendChild(option);

            var reportOption = option.cloneNode(true);
            reportProductSelect.appendChild(reportOption);
        });
    } catch (error) {
        console.error('Error al cargar productos en el dropdown:', error);
        alert('Error al cargar productos en el dropdown: ' + error.message);
    }
}

async function loadBranchOptions() {
    try {
        var reportBranchSelect = document.getElementById('reportBranchSelect');
        reportBranchSelect.innerHTML = '<option value="">Todas las Sucursales</option>';

        var branchesSnapshot = await db.collection('branches').get();
        branchesSnapshot.forEach(function(doc) {
            var branch = doc.data();
            var option = document.createElement('option');
            option.value = doc.id;
            option.textContent = branch.name;
            reportBranchSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
        alert('Error al cargar sucursales: ' + error.message);
    }
}

async function generateReport() {
    try {
        var productId = document.getElementById('reportProductSelect').value;
        var branchId = document.getElementById('reportBranchSelect').value;

        if (!productId) {
            alert('Por favor, seleccione un producto.');
            return;
        }

        var reportTableBody = document.getElementById('reportTable').getElementsByTagName('tbody')[0];
        reportTableBody.innerHTML = '';

        var query = db.collection('inventory').where('productId', '==', productId);
        if (branchId) {
            query = query.where('branchId', '==', branchId);
        }

        var inventorySnapshot = await query.get();

        for (let doc of inventorySnapshot.docs) {
            let inventoryItem = doc.data();
            let productDoc = await db.collection('products').doc(inventoryItem.productId).get();
            let product = productDoc.data();
            let branchName = 'General';

            if (inventoryItem.branchId) {
                let branchDoc = await db.collection('branches').doc(inventoryItem.branchId).get();
                branchName = branchDoc.exists ? branchDoc.data().name : 'Sucursal no encontrada';
            }

            // Obtener las salidas del producto (pedidos)
            let ordersSnapshot = await db.collection('orders').where('productId', '==', productId).get();
            let salidas = ordersSnapshot.docs.map(orderDoc => {
                let order = orderDoc.data();
                return `Fecha: ${order.date}, Cantidad: ${order.quantity}`;
            }).join('<br>');

            let row = reportTableBody.insertRow();
            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let cell4 = row.insertCell(3);
            let cell5 = row.insertCell(4);
            let cell6 = row.insertCell(5);

            cell1.textContent = product.name;
            cell2.textContent = branchName;
            cell3.textContent = inventoryItem.initialStock;
            cell4.textContent = inventoryItem.newIncome || 0;
            cell5.innerHTML = salidas || 'N/A';  // Mostrar salidas con fecha y cantidad
            cell6.textContent = inventoryItem.currentStock;
        }
    } catch (error) {
        console.error('Error al generar el reporte:', error);
        alert('Error al generar el reporte: ' + error.message);
    }
}

async function addInventory() {
    try {
        var productSelect = document.getElementById('productSelect');
        var productId = productSelect.value;
        var initialStock = parseInt(document.getElementById('initialStock').value);
        var currentStock = parseInt(document.getElementById('currentStock').value);

        if (!productId) throw new Error('Debes seleccionar un producto');
        if (isNaN(initialStock) || initialStock < 0) throw new Error('El stock inicial debe ser un número no negativo');
        if (isNaN(currentStock) || currentStock < 0) throw new Error('El stock actual debe ser un número no negativo');

        // Recupera el precio del producto de la base de datos
        var productDoc = await db.collection('products').doc(productId).get();
        if (!productDoc.exists) throw new Error('Producto no encontrado en la base de datos.');
        var price = productDoc.data().price;

        await db.collection('inventory').add({
            productId: productId,
            initialStock: initialStock,
            currentStock: currentStock,
            cost: price  // Utiliza el precio recuperado
        });

        closeModal('addInventoryModal');
        loadInventory();
    } catch (error) {
        console.error('Error al agregar producto al inventario:', error);
        alert('Error al agregar producto al inventario: ' + error.message);
    }
}

async function loadInventory() {
    try {
        var inventorySnapshot = await db.collection('inventory').get();
        var inventoryTableBody = document.getElementById('inventoryTable').getElementsByTagName('tbody')[0];
        inventoryTableBody.innerHTML = '';

        for (let doc of inventorySnapshot.docs) {
            let inventoryItem = doc.data();
            let productDoc = await db.collection('products').doc(inventoryItem.productId).get();
            let product = productDoc.data();

            let providerDoc = await db.collection('providers').doc(product.providerId).get();
            let providerName = providerDoc.exists ? providerDoc.data().name : 'Proveedor no encontrado';

            let row = inventoryTableBody.insertRow();
            row.setAttribute('data-id', doc.id);  // Almacenar el ID de la fila para usar en las acciones
            row.onclick = selectRow;  // Añadir el evento de selección de fila

            let cell1 = row.insertCell(0);
            let cell2 = row.insertCell(1);
            let cell3 = row.insertCell(2);
            let cell4 = row.insertCell(3);
            let cell5 = row.insertCell(4);
            let cell6 = row.insertCell(5);

            cell1.textContent = product.name;
            cell2.textContent = product.presentation;
            cell3.textContent = providerName;
            cell4.textContent = `Q${product.price.toFixed(2)}`;  // Mostrar precio del producto
            cell5.textContent = inventoryItem.initialStock;
            cell6.textContent = inventoryItem.currentStock;
        }
    } catch (error) {
        console.error('Error al cargar el inventario:', error);
        alert('Error al cargar el inventario: ' + error.message);
    }
}

function selectRow(event) {
    const rows = document.querySelectorAll('#inventoryTable tbody tr');
    rows.forEach(row => row.classList.remove('selected'));  // Eliminar la clase 'selected' de todas las filas

    const selectedRow = event.currentTarget;
    selectedRow.classList.add('selected');  // Añadir la clase 'selected' a la fila seleccionada

    // Obtener el ID de inventario de la fila seleccionada
    const inventoryId = selectedRow.getAttribute('data-id');

    // Habilitar botones de acciones
    document.getElementById('adjustInventoryBtn').disabled = false;
    document.getElementById('removeInventoryBtn').disabled = false;
    document.getElementById('increaseInventoryBtn').disabled = false;

    // Guardar el ID de inventario seleccionado en un atributo de botón para su uso en la función
    document.getElementById('adjustInventoryBtn').setAttribute('data-id', inventoryId);
    document.getElementById('removeInventoryBtn').setAttribute('data-id', inventoryId);
    document.getElementById('increaseInventoryBtn').setAttribute('data-id', inventoryId);
}

function adjustSelectedInventory() {
    const inventoryId = document.getElementById('adjustInventoryBtn').getAttribute('data-id');
    showAdjustInventoryForm(inventoryId);
}

function removeSelectedInventory() {
    const inventoryId = document.getElementById('removeInventoryBtn').getAttribute('data-id');
    removeInventoryItem(inventoryId);
}

function increaseSelectedInventory() {
    const inventoryId = document.getElementById('increaseInventoryBtn').getAttribute('data-id');
    showIncreaseInventoryForm(inventoryId);
}

async function adjustInventory() {
    try {
        var inventoryId = document.getElementById('adjustInventoryId').value;
        var currentStock = parseInt(document.getElementById('adjustCurrentStock').value);

        if (isNaN(currentStock) || currentStock < 0) throw new Error('El stock actual debe ser un número no negativo');

        await db.collection('inventory').doc(inventoryId).update({
            currentStock: currentStock
        });

        closeModal('adjustInventoryModal');
        loadInventory();
    } catch (error) {
        console.error('Error al reajustar el inventario:', error);
        alert('Error al reajustar el inventario: ' + error.message);
    }
}

async function removeInventoryItem(inventoryId) {
    if (confirm('¿Está seguro de que desea eliminar este producto del inventario?')) {
        try {
            await db.collection('inventory').doc(inventoryId).delete();
            loadInventory();
        } catch (error) {
            console.error('Error al eliminar el producto del inventario:', error);
            alert('Error al eliminar el producto del inventario: ' + error.message);
        }
    }
}

async function increaseInventory() {
    try {
        var inventoryId = document.getElementById('increaseInventoryId').value;
        var increaseQuantity = parseInt(document.getElementById('increaseStockQuantity').value);

        if (isNaN(increaseQuantity) || increaseQuantity <= 0) {
            alert('La cantidad a ingresar debe ser un número positivo.');
            return;
        }

        let inventoryRef = db.collection('inventory').doc(inventoryId);
        let inventoryDoc = await inventoryRef.get();
        if (inventoryDoc.exists) {
            let currentStock = inventoryDoc.data().currentStock;
            let newStock = currentStock + increaseQuantity;

            await inventoryRef.update({
                currentStock: newStock
            });

            alert('Producto ingresado al inventario exitosamente.');
            closeModal('increaseInventoryModal');
            loadInventory();
        } else {
            alert('El producto no se encontró en el inventario.');
        }
    } catch (error) {
        console.error('Error al ingresar producto al inventario:', error);
        alert('Error al ingresar producto al inventario: ' + error.message);
    }
}

function filterInventory() {
    var input, filter, table, tr, td, i, txtValue;
    input = document.getElementById('inventorySearchInput');
    filter = input.value.toUpperCase();
    table = document.getElementById('inventoryTable');
    tr = table.getElementsByTagName('tr');

    for (i = 1; i < tr.length; i++) { // Empieza en 1 para omitir el encabezado
        td = tr[i].getElementsByTagName('td')[0];
        if (td) {
            txtValue = td.textContent || td.innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                tr[i].style.display = '';
            } else {
                tr[i].style.display = 'none';
            }
        }       
    }
}

function exportTableToPDF() {
    const { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    doc.autoTable({ html: '#inventoryTable' });
    doc.save('inventario.pdf');
}

function exportTableToImage() {
    html2canvas(document.querySelector("#inventoryTable")).then(canvas => {
        var imgData = canvas.toDataURL("image/png");
        var link = document.createElement('a');
        link.href = imgData;
        link.download = 'inventario.png';
        link.click();
    });
}
