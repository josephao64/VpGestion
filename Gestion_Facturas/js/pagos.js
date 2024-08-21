// pagos.js

let selectedFacturaId;
let montoPendiente = 0;

function openAddPaymentModal(facturaId) {
    selectedFacturaId = facturaId;
    
    // Cargar el monto pendiente de la factura seleccionada
    db.collection('facturas').doc(facturaId).get().then((doc) => {
        if (doc.exists) {
            const factura = doc.data();
            montoPendiente = factura.montoTotal - (factura.pagosTotal || 0);
            openModal('addPaymentModal');
        } else {
            alert('Factura no encontrada');
        }
    }).catch((error) => {
        console.error('Error al obtener la factura:', error);
        alert('Error al obtener la factura: ' + error.message);
    });
}

function validatePaymentAmount() {
    const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
    const paymentError = document.getElementById('paymentError');
    const addPaymentButton = document.getElementById('addPaymentButton');

    if (paymentAmount > montoPendiente) {
        paymentError.style.display = 'block';
        addPaymentButton.disabled = true;
    } else {
        paymentError.style.display = 'none';
        addPaymentButton.disabled = false;
    }
}

async function addPayment() {
    try {
        const paymentAmount = parseFloat(document.getElementById('paymentAmount').value);
        const paymentDate = document.getElementById('paymentDate').value;
        const paymentMethod = document.getElementById('paymentMethod').value;
        const paymentBoletaNumber = document.getElementById('paymentBoletaNumber').value || null;
        const paymentComprobante = document.getElementById('paymentComprobante').files[0]; // Obtener archivo

        if (!paymentAmount || !paymentDate || !paymentMethod) throw new Error('Debe completar todos los campos obligatorios de pago');

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
                numeroBoleta: paymentBoletaNumber,
                comprobante: paymentComprobante ? paymentComprobante.name : null
            }];

            if (pagosTotal > factura.montoTotal) throw new Error('El monto total de los pagos excede el monto de la factura');

            transaction.update(facturaRef, { pagosTotal, pagos: nuevosPagos });

            // Si hay un archivo de comprobante, súbelo
            if (paymentComprobante) {
                await subirComprobante(selectedFacturaId, paymentComprobante); // Llamada a la función de subida
            }
        });

        closeModal('addPaymentModal');
        alert('Pago agregado con éxito');
        loadFacturas();
    } catch (error) {
        console.error('Error al agregar pago:', error);
        alert('Error al agregar pago: ' + error.message);
    }
}

function openMostrarPagosModal(id) {
    selectedFacturaId = id;
    db.collection('facturas').doc(id).get().then(function(doc) {
        if (doc.exists) {
            const factura = doc.data();
            displayPagos(factura.pagos);
            openModal('viewFacturaModal');  // Asegúrate de que este modal esté preparado para mostrar los pagos
        } else {
            alert('Factura no encontrada');
        }
    }).catch(function(error) {
        console.error('Error al obtener los pagos de la factura:', error);
        alert('Error al obtener los pagos de la factura: ' + error.message);
    });
}

function displayPagos(pagos) {
    const pagosList = document.getElementById('pagosList');
    pagosList.innerHTML = '';
    if (Array.isArray(pagos)) {
        pagos.forEach(pago => {
            const li = document.createElement('li');
            li.textContent = `Monto: Q${pago.monto}, Fecha: ${pago.fecha}, Método: ${pago.metodoPago}, Número de Boleta: ${pago.numeroBoleta || 'N/A'}`;
            pagosList.appendChild(li);
        });
    } else {
        pagosList.innerHTML = '<li>No se encontraron pagos.</li>';
    }
}

// Función para subir el archivo de comprobante
async function subirComprobante(facturaId, archivo) {
    try {
        const storageRef = firebase.storage().ref();
        const archivoRef = storageRef.child(`comprobantes/${facturaId}/${archivo.name}`);
        await archivoRef.put(archivo);
        console.log('Comprobante subido con éxito');
    } catch (error) {
        console.error('Error al subir comprobante:', error);
        alert('Error al subir comprobante: ' + error.message);
    }
}
