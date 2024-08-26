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

let currentOrderProducts = [];
let productData = {};  // Para almacenar los datos de los productos
let inventoryData = {}; // Para almacenar los datos de inventario de los productos
let branchData = {};  // Para almacenar los datos de las sucursales
let editingOrderId = null;  // Variable para almacenar el ID del pedido en edición

document.addEventListener("DOMContentLoaded", function() {
    loadProductOptions();
    loadBranchOptions();
    loadOrders();
});

function showAddOrderForm(orderId = null) {
    document.getElementById('addOrderModal').style.display = 'block';
    editingOrderId = orderId;  // Establecer el ID del pedido en edición

    if (orderId) {
        loadOrderDetails(orderId);
    } else {
        clearOrderForm();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    clearOrderForm();
}

function clearOrderForm() {
    document.getElementById('orderId').value = '';
    document.getElementById('orderName').value = '';
    document.getElementById('orderDate').value = '';
    document.getElementById('branchSelect').value = '';
    document.getElementById('productSelect').value = '';
    document.getElementById('orderQuantity').value = '';
    currentOrderProducts = [];
    updateOrderProductTable();
}

async function loadProductOptions() {
    try {
        var productSelect = document.getElementById('productSelect');
        productSelect.innerHTML = ''; // Limpiar el dropdown antes de cargar los productos

        var productsSnapshot = await db.collection('products').get();

        for (const doc of productsSnapshot.docs) {
            var product = doc.data();
            productData[doc.id] = product;  // Guardar datos del producto para su uso posterior

            // Cargar datos de inventario para cada producto
            var inventorySnapshot = await db.collection('inventory').where('productId', '==', doc.id).get();
            if (!inventorySnapshot.empty) {
                let inventoryDoc = inventorySnapshot.docs[0]; // Considera el primer resultado
                inventoryData[doc.id] = inventoryDoc.data().currentStock;  // Guardar datos del inventario
            } else {
                inventoryData[doc.id] = 0;  // Si no existe en inventario, el stock es 0
            }

            var option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${product.name} (${product.presentation}) - Q${product.price.toFixed(2)} - Stock: ${inventoryData[doc.id]}`;
            productSelect.appendChild(option);
        }
    } catch (error) {
        console.error('Error al cargar productos en el dropdown:', error);
        alert('Error al cargar productos en el dropdown: ' + error.message);
    }
}

async function loadBranchOptions() {
    try {
        var branchSelect = document.getElementById('branchSelect');
        branchSelect.innerHTML = '<option value="">Seleccione una sucursal</option>'; // Limpiar el dropdown antes de cargar las sucursales

        var sucursalesSnapshot = await db.collection('sucursales').get();
        sucursalesSnapshot.forEach(function(doc) {
            var sucursal = doc.data();
            branchData[doc.id] = sucursal.name;  // Guardar nombre de sucursal para uso posterior
            var option = document.createElement('option');
            option.value = doc.id;
            option.textContent = sucursal.name; // Mostrar el nombre de la sucursal
            branchSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar sucursales en el dropdown:', error);
        alert('Error al cargar sucursales en el dropdown: ' + error.message);
    }
}

function addProductToOrder() {
    var productSelect = document.getElementById('productSelect');
    var productId = productSelect.value;
    var orderQuantity = parseInt(document.getElementById('orderQuantity').value);
    var branchId = document.getElementById('branchSelect').value;

    if (!productId) {
        alert('Debe seleccionar un producto.');
        return;
    }

    if (!branchId) {
        alert('Debe seleccionar una sucursal.');
        return;
    }

    if (isNaN(orderQuantity) || orderQuantity <= 0) {
        alert('La cantidad debe ser un número positivo.');
        return;
    }

    // Verificar si la cantidad solicitada excede la cantidad en inventario
    if (orderQuantity > inventoryData[productId]) {
        alert(`La cantidad solicitada excede el inventario disponible. Stock disponible: ${inventoryData[productId]}`);
        return;
    }

    currentOrderProducts.push({ productId: productId, quantity: orderQuantity, branchId: branchId });

    updateOrderProductTable();
}

function updateOrderProductTable() {
    var orderProductTableBody = document.getElementById('orderProductTable').getElementsByTagName('tbody')[0];
    orderProductTableBody.innerHTML = '';

    currentOrderProducts.forEach((product, index) => {
        var productInfo = productData[product.productId];
        var row = orderProductTableBody.insertRow();
        row.insertCell(0).textContent = productInfo.name;
        row.insertCell(1).textContent = productInfo.presentation;
        row.insertCell(2).textContent = product.quantity;
        row.insertCell(3).textContent = inventoryData[product.productId];  // Muestra el stock disponible
        row.insertCell(4).textContent = branchData[product.branchId];  // Muestra la sucursal seleccionada
        row.insertCell(5).innerHTML = `<button onclick="removeProductFromOrder(${index})">Eliminar</button>`;
    });
}

function removeProductFromOrder(index) {
    currentOrderProducts.splice(index, 1);
    updateOrderProductTable();
}

async function saveOrder() {
    try {
        var orderName = document.getElementById('orderName').value;
        var orderDate = document.getElementById('orderDate').value;

        if (!orderName || !orderDate) {
            alert('Debe completar todos los campos del pedido.');
            return;
        }

        if (currentOrderProducts.length === 0) {
            alert('Debe agregar al menos un producto al pedido.');
            return;
        }

        var batch = db.batch();

        // Si estamos editando un pedido, primero revertimos los cambios en el inventario
        if (editingOrderId) {
            let existingOrderDoc = await db.collection('orders').doc(editingOrderId).get();
            let existingOrderData = existingOrderDoc.data();
            if (existingOrderData) {
                for (let product of existingOrderData.products) {
                    let inventorySnapshot = await db.collection('inventory').where('productId', '==', product.productId).get();
                    if (!inventorySnapshot.empty) {
                        let inventoryDoc = inventorySnapshot.docs[0];
                        let currentStock = inventoryDoc.data().currentStock;
                        let newStock = currentStock + product.quantity;  // Revertir la cantidad del pedido anterior
                        batch.update(db.collection('inventory').doc(inventoryDoc.id), { currentStock: newStock });
                    }
                }
            }
        }

        // Crear o actualizar pedido
        var orderRef = editingOrderId ? db.collection('orders').doc(editingOrderId) : db.collection('orders').doc();
        batch.set(orderRef, {
            name: orderName,
            date: orderDate,
            products: currentOrderProducts
        });

        // Actualizar inventario para el nuevo pedido o el pedido editado
        for (let product of currentOrderProducts) {
            var inventorySnapshot = await db.collection('inventory').where('productId', '==', product.productId).get();
            if (!inventorySnapshot.empty) {
                var inventoryDoc = inventorySnapshot.docs[0];
                var currentStock = inventoryDoc.data().currentStock;
                var newStock = currentStock - product.quantity;

                if (newStock < 0) {
                    alert(`Stock insuficiente para el producto: ${productData[product.productId].name}. Stock disponible: ${currentStock}`);
                    return;
                }

                batch.update(db.collection('inventory').doc(inventoryDoc.id), { currentStock: newStock });
            } else {
                alert(`Producto: ${productData[product.productId].name} no encontrado en el inventario.`);
                return;
            }
        }

        await batch.commit();

        alert('Pedido guardado exitosamente.');
        closeModal('addOrderModal');
        loadOrders();
    } catch (error) {
        console.error('Error al guardar el pedido:', error);
        alert('Error al guardar el pedido: ' + error.message);
    }
}

async function loadOrders() {
    try {
        var ordersSnapshot = await db.collection('orders').get();
        var ordersTableBody = document.getElementById('ordersTable').getElementsByTagName('tbody')[0];

        ordersTableBody.innerHTML = '';

        for (const doc of ordersSnapshot.docs) {
            var order = doc.data();
            if (order.name && order.date) {  // Solo agregar pedidos válidos
                var row = ordersTableBody.insertRow();
                var cell1 = row.insertCell(0);
                var cell2 = row.insertCell(1);
                var cell3 = row.insertCell(2);

                cell1.textContent = order.name;
                cell2.textContent = order.date;

                cell3.innerHTML = `
                    <button onclick="viewOrderDetails('${doc.id}')">Ver</button>
                    <button onclick="showAddOrderForm('${doc.id}')">Editar</button>
                    <button onclick="deleteOrder('${doc.id}')">Eliminar</button>`;
            }
        }
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
        alert('Error al cargar pedidos: ' + error.message);
    }
}

async function deleteOrder(orderId) {
    if (confirm('¿Está seguro de que desea eliminar este pedido?')) {
        try {
            let orderDoc = await db.collection('orders').doc(orderId).get();
            let orderData = orderDoc.data();
            
            // Revertir el inventario antes de eliminar el pedido
            var batch = db.batch();
            for (let product of orderData.products) {
                let inventorySnapshot = await db.collection('inventory').where('productId', '==', product.productId).get();
                if (!inventorySnapshot.empty) {
                    let inventoryDoc = inventorySnapshot.docs[0];
                    let currentStock = inventoryDoc.data().currentStock;
                    let newStock = currentStock + product.quantity;  // Revertir la cantidad del pedido
                    batch.update(db.collection('inventory').doc(inventoryDoc.id), { currentStock: newStock });
                }
            }

            // Eliminar pedido
            batch.delete(db.collection('orders').doc(orderId));
            await batch.commit();

            alert('Pedido eliminado con éxito.');
            loadOrders();
        } catch (error) {
            console.error('Error al eliminar el pedido:', error);
            alert('Error al eliminar el pedido: ' + error.message);
        }
    }
}

async function viewOrderDetails(orderId) {
    try {
        let orderDoc = await db.collection('orders').doc(orderId).get();
        if (orderDoc.exists) {
            let orderData = orderDoc.data();
            displayOrderDetails(orderData, orderId);
        } else {
            alert('Pedido no encontrado.');
        }
    } catch (error) {
        console.error('Error al cargar detalles del pedido:', error);
        alert('Error al cargar detalles del pedido: ' + error.message);
    }
}

function displayOrderDetails(orderData, orderId) {
    // Crear y mostrar un modal con los detalles del pedido
    var modalContent = `
    <div class="modal-content">
        <span class="close" onclick="closeModal('orderDetailsModal')">&times;</span>
        <h2>Detalles del Pedido</h2>
        <p><strong>Nombre del Pedido:</strong> ${orderData.name}</p>
        <p><strong>ID del Pedido:</strong> ${orderId}</p>
        <p><strong>Fecha del Pedido:</strong> ${orderData.date}</p>
        <table id="orderDetailsTable">
            <thead>
                <tr>
                    <th>Sucursal</th>
                    <th>Producto</th>
                    <th>Presentación</th>
                    <th>Cantidad</th>
                </tr>
            </thead>
            <tbody>`;

    orderData.products.forEach(product => {
        const productInfo = productData[product.productId];
        modalContent += `
        <tr>
            <td>${branchData[product.branchId]}</td>
            <td>${productInfo.name}</td>
            <td>${productInfo.presentation}</td>
            <td>${product.quantity}</td>
        </tr>`;
    });

    modalContent += `
            </tbody>
        </table>
        <button onclick="downloadOrder('${orderData.name}', '${orderData.date}', '${orderId}')">Descargar PDF</button>
        <button onclick="downloadOrderImage('${orderData.name}', '${orderId}')">Descargar Imagen</button>
    </div>`;

    var modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'orderDetailsModal';
    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function downloadOrder(orderName, orderDate, orderId) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.text("Detalles del Pedido", 10, 10);
    doc.text(`Nombre del Pedido: ${orderName}`, 10, 20);
    doc.text(`ID del Pedido: ${orderId}`, 10, 30);
    doc.text(`Fecha del Pedido: ${orderDate}`, 10, 40);

    // Añadir la tabla al PDF
    doc.autoTable({ html: '#orderDetailsTable', startY: 50 });

    doc.save(`Pedido_${orderName}.pdf`);
}

function downloadOrderImage(orderName, orderId) {
    var element = document.querySelector('#orderDetailsModal .modal-content');
    window.html2canvas(element).then(canvas => {
        var link = document.createElement('a');
        link.download = `Pedido_${orderName}_${orderId}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
    });
}
