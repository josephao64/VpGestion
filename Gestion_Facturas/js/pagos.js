let montoPendiente = 0;

function openAddPaymentModal() {
    if (selectedFacturaId) {
        db.collection('facturas').doc(selectedFacturaId).get().then((doc) => {
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
    } else {
        alert('No se ha seleccionado ninguna factura.');
    }
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
        const paymentComprobante = document.getElementById('paymentComprobante').files[0];

        if (!paymentAmount || !paymentDate || !paymentMethod) {
            throw new Error('Debe completar todos los campos obligatorios de pago.');
        }

        const facturaRef = db.collection('facturas').doc(selectedFacturaId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(facturaRef);
            if (!doc.exists) {
                throw new Error('Factura no encontrada');
            }

            const factura = doc.data();
            const pagosTotal = (factura.pagosTotal || 0) + paymentAmount;
            const nuevosPagos = [...(factura.pagos || []), {
                monto: paymentAmount,
                fecha: paymentDate,
                metodoPago: paymentMethod,
                numeroBoleta: paymentBoletaNumber,
                comprobante: paymentComprobante ? paymentComprobante.name : null
            }];

            if (pagosTotal > factura.montoTotal) {
                throw new Error('El monto total de los pagos excede el monto de la factura');
            }

            transaction.update(facturaRef, { pagosTotal, pagos: nuevosPagos });

            if (paymentComprobante) {
                await subirComprobante(selectedFacturaId, paymentComprobante);
            }
        });

        closeModal('addPaymentModal');
        alert('Pago agregado con éxito');
        openViewFacturaModal();  // Actualizar los detalles de la factura después de agregar el pago

    } catch (error) {
        console.error('Error al agregar pago:', error);
        alert('Error al agregar pago: ' + error.message);
    }
}

function displayPagos(pagos) {
    const pagosList = document.getElementById('pagosList');
    pagosList.innerHTML = '';
    if (Array.isArray(pagos) && pagos.length > 0) {
        pagos.forEach(pago => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="payment-date">Fecha: ${pago.fecha}</span>
                <span class="payment-method">Método: ${pago.metodoPago}</span>
                <span class="payment-amount">Monto: Q${pago.monto}</span>
                <span class="payment-boleta">Boleta: ${pago.numeroBoleta || 'N/A'}</span>
            `;
            pagosList.appendChild(li);
        });
    } else {
        pagosList.innerHTML = '<li>No se encontraron pagos realizados.</li>';
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
