// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Función para cargar datos del dashboard
async function loadDashboardData() {
    try {
        // Cargar Facturas Pendientes
        const facturasPendientesSnapshot = await db.collection('facturas').where('estadoPago', '==', 'Pendiente').get();
        document.getElementById('facturasPendientes').innerText = facturasPendientesSnapshot.size;

        // Cargar Pagos Recientes
        const pagosRecientesSnapshot = await db.collection('pagos').orderBy('fecha', 'desc').limit(5).get();
        let pagosRecientesHTML = '';
        pagosRecientesSnapshot.forEach(doc => {
            const pago = doc.data();
            pagosRecientesHTML += `<li>Pago de Q${pago.monto} - ${pago.fecha}</li>`;
        });
        document.getElementById('pagosRecientes').innerHTML = pagosRecientesHTML || '0';

        // Total Facturado Este Mes
        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const facturasMesSnapshot = await db.collection('facturas')
            .where('fechaEmision', '>=', primerDiaMes.toISOString().split('T')[0])
            .get();
        let totalFacturado = 0;
        facturasMesSnapshot.forEach(doc => {
            totalFacturado += doc.data().montoTotal;
        });
        document.getElementById('totalFacturadoMes').innerText = `Q${totalFacturado.toFixed(2)}`;

        // Cargar Facturas Recientes
        const facturasRecientesSnapshot = await db.collection('facturas').orderBy('fechaEmision', 'desc').limit(5).get();
        let facturasRecientesHTML = '';
        facturasRecientesSnapshot.forEach(doc => {
            const factura = doc.data();
            facturasRecientesHTML += `
                <tr>
                    <td>${factura.numero}</td>
                    <td>${factura.fechaEmision}</td>
                    <td>Q${factura.montoTotal.toFixed(2)}</td>
                    <td><span class="status ${factura.estadoPago.toLowerCase()}">${factura.estadoPago}</span></td>
                </tr>
            `;
        });
        document.getElementById('facturasRecientes').innerHTML = facturasRecientesHTML || '<tr><td colspan="4">No hay facturas recientes</td></tr>';

    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
    }
}

// Cargar datos al iniciar la página
document.addEventListener('DOMContentLoaded', loadDashboardData);
