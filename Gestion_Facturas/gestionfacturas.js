// Configuración de Firebase
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

// Variables globales
let selectedFacturaId;

// Funciones de Modales
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Función para abrir el modal de agregar factura
function openAddFacturaModal() {
    openModal('addFacturaModal');
}

// Función para agregar un pago
async function addPayment() {
    try {
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
        const paymentDate = document.getElementById('paymentDate').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const paymentReceiptNumber = document.getElementById('paymentReceiptNumber').value;
        const paymentReceiptAmount = parseFloat(document.getElementById('paymentReceiptAmount').value);
        const paymentReceiptFile = document.getElementById('paymentReceiptFile').files[0]; // archivo de comprobante

        if (!paymentAmount || !paymentDate || !paymentMethod || !paymentReceiptNumber || !paymentReceiptAmount) {
            throw new Error('Debe completar todos los campos de pago');
        }

        // Referencia de la factura
        const facturaRef = db.collection('facturas').doc(selectedFacturaId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(facturaRef);
            if (!doc.exists) throw new Error('Factura no encontrada');

            const factura = doc.data();
            const pagosTotal = (factura.pagosTotal || 0) + paymentAmount;
            const nuevosPagos = [...(factura.pagos || []), {
                monto: paymentAmount,
                fecha: paymentDate,
                metodoPago: paymentMethod,
                numeroBoleta: paymentReceiptNumber,
                montoBoleta: paymentReceiptAmount
            }];

            // Actualización de la factura con los nuevos pagos
            transaction.update(facturaRef, { pagosTotal, pagos: nuevosPagos });
        });

        // Si el archivo de comprobante existe, subimos a Firebase Storage
        if (paymentReceiptFile) {
            const storageRef = firebase.storage().ref();
            const fileRef = storageRef.child(`comprobantes/${paymentReceiptFile.name}`);
            await fileRef.put(paymentReceiptFile);
        }

        closeModal('addPaymentModal');
        alert('Pago agregado con éxito');
        loadFacturas();
    } catch (error) {
        console.error('Error al agregar pago:', error);
        alert('Error al agregar pago: ' + error.message);
    }
}

// Función para cargar las facturas desde Firestore
async function loadFacturas() {
    try {
        const facturasSnapshot = await db.collection('facturas').get();
        const facturasTableBody = document.getElementById('facturasTable').getElementsByTagName('tbody')[0];
        facturasTableBody.innerHTML = '';

        facturasSnapshot.forEach(function (doc) {
            let factura = doc.data();
            let montoPendiente = factura.montoTotal - (factura.pagosTotal || 0);

            let row = facturasTableBody.insertRow();
            row.insertCell(0).textContent = factura.numero;
            row.insertCell(1).textContent = factura.empresaId; // Asume que ya estás obteniendo el nombre de la empresa
            row.insertCell(2).textContent = factura.sucursalId; // Asume que ya estás obteniendo el nombre de la sucursal
            row.insertCell(3).textContent = factura.proveedorId; // Asume que ya estás obteniendo el nombre del proveedor
            row.insertCell(4).textContent = factura.fechaEmision;
            row.insertCell(5).textContent = factura.fechaVencimiento;
            row.insertCell(6).textContent = factura.montoTotal;
            row.insertCell(7).textContent = factura.estadoPago;
            row.insertCell(8).textContent = montoPendiente;
            row.insertCell(9).innerHTML = `
                <button onclick="openAddPaymentModal('${doc.id}')">Agregar Pago</button>
            `;
        });
    } catch (error) {
        console.error('Error al cargar facturas:', error);
        alert('Error al cargar facturas: ' + error.message);
    }
}

// Cargar facturas al cargar la página
window.onload = loadFacturas;
