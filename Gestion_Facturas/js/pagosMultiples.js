// Funciones para gestionar el pago de múltiples facturas

async function openMultiplePaymentModal() {
    // Asegurar que el modal esté visible antes de cargar las opciones
    openModal('multiplePaymentModal');
    await loadEmpresasSelectOptions('empresaSelectMultiple');
}

async function loadFacturasForMultiplePayment() {
    const empresaId = document.getElementById('empresaSelectMultiple').value;

    if (!empresaId) {
        alert('Selecciona una empresa primero.');
        return;
    }

    try {
        const facturasSnapshot = await db.collection('facturas')
            .where('empresaId', '==', empresaId)
            .where('estadoPago', '==', 'Pendiente')
            .get();

        const facturasContainer = document.getElementById('facturasMultipleContainer');
        facturasContainer.innerHTML = '';

        if (facturasSnapshot.empty) {
            facturasContainer.innerHTML = '<p>No hay facturas pendientes para esta empresa.</p>';
            return;
        }

        facturasSnapshot.forEach(function(doc) {
            const factura = doc.data();
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = doc.id;
            facturasContainer.appendChild(checkbox);

            const label = document.createElement('label');
            label.textContent = `Factura ${factura.numero} - Monto Pendiente: Q${factura.montoTotal - (factura.pagosTotal || 0)}`;
            facturasContainer.appendChild(label);

            facturasContainer.appendChild(document.createElement('br'));
        });

    } catch (error) {
        console.error('Error al cargar facturas:', error);
        alert('Error al cargar facturas: ' + error.message);
    }
}

async function applyMultiplePayments() {
    const selectedFacturas = Array.from(document.querySelectorAll('#facturasMultipleContainer input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
    const paymentAmount = parseFloat(document.getElementById('paymentAmountMultiple').value);
    const paymentDate = document.getElementById('paymentDateMultiple').value;
    const paymentMethod = document.getElementById('paymentMethodMultiple').value;
    const paymentBoletaNumber = document.getElementById('paymentBoletaNumberMultiple').value || null;

    if (!selectedFacturas.length || isNaN(paymentAmount) || !paymentDate || !paymentMethod) {
        alert('Debes seleccionar facturas y completar toda la información del pago.');
        return;
    }

    try {
        await db.runTransaction(async (transaction) => {
            let totalPendiente = 0;
            let pagosPorFactura = {};

            // Calcular total pendiente y crear pagos para cada factura
            for (let facturaId of selectedFacturas) {
                const facturaDoc = await transaction.get(db.collection('facturas').doc(facturaId));
                if (!facturaDoc.exists) {
                    throw new Error('Factura no encontrada');
                }

                const factura = facturaDoc.data();
                const montoPendiente = factura.montoTotal - (factura.pagosTotal || 0);
                totalPendiente += montoPendiente;
                pagosPorFactura[facturaId] = montoPendiente;
            }

            if (paymentAmount > totalPendiente) {
                throw new Error('El monto del pago excede el total pendiente.');
            }

            // Aplicar el pago proporcionalmente a las facturas seleccionadas
            for (let facturaId of selectedFacturas) {
                const montoFactura = pagosPorFactura[facturaId];
                const pagoAplicado = Math.min(paymentAmount, montoFactura);

                const facturaRef = db.collection('facturas').doc(facturaId);
                const facturaDoc = await transaction.get(facturaRef);
                const factura = facturaDoc.data();
                
                const nuevosPagos = [...(factura.pagos || []), {
                    monto: pagoAplicado,
                    fecha: paymentDate,
                    metodoPago: paymentMethod,
                    numeroBoleta: paymentBoletaNumber
                }];
                const pagosTotal = (factura.pagosTotal || 0) + pagoAplicado;

                transaction.update(facturaRef, { pagosTotal, pagos: nuevosPagos });
                paymentAmount -= pagoAplicado;

                if (paymentAmount <= 0) break;
            }
        });

        closeModal('multiplePaymentModal');
        alert('Pago múltiple aplicado con éxito.');
        loadFacturas();  // Actualizar la lista de facturas

    } catch (error) {
        console.error('Error al aplicar pago múltiple:', error);
        alert('Error al aplicar pago múltiple: ' + error.message);
    }
}

// Helper functions to open and close modals
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function loadEmpresasSelectOptions(empresaSelectId) {
    try {
        const empresaSelect = document.getElementById(empresaSelectId);
        if (!empresaSelect) {
            console.error('Elemento empresaSelect no encontrado');
            return;
        }
        
        const empresasSnapshot = await db.collection('empresas').get();
        empresaSelect.innerHTML = '<option value="">Selecciona una Empresa</option>';

        empresasSnapshot.forEach(function(doc) {
            const empresa = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = empresa.name;
            empresaSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error al cargar opciones de empresas:', error);
        alert('Error al cargar opciones de empresas: ' + error.message);
    }
}
