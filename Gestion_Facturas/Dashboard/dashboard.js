async function cargarDatosDashboard() {
    try {
        // Cargar las colecciones necesarias para mostrar nombres en lugar de IDs
        const empresasSnapshot = await db.collection('empresas').get();
        const sucursalesSnapshot = await db.collection('sucursales').get();
        const proveedoresSnapshot = await db.collection('providers').get();

        // Crear mapas para búsqueda rápida de nombres
        const empresasMap = new Map();
        const sucursalesMap = new Map();
        const proveedoresMap = new Map();

        empresasSnapshot.forEach(doc => empresasMap.set(doc.id, doc.data().name));
        sucursalesSnapshot.forEach(doc => sucursalesMap.set(doc.id, doc.data().name));
        proveedoresSnapshot.forEach(doc => proveedoresMap.set(doc.id, doc.data().name));

        // Cargar facturas para el dashboard
        const facturasSnapshot = await db.collection('facturas').get();
        let hoy = new Date().toISOString().split('T')[0]; // Fecha actual en formato ISO (YYYY-MM-DD)
        
        let facturasHoyCount = 0;
        let proximasFacturasCount = 0;
        let facturasVencidasCount = 0;
        let pagosPendientesCount = 0;
        let facturasPagadasHoyCount = 0;
        let todasFacturasCount = facturasSnapshot.size;

        facturasSnapshot.forEach((doc) => {
            let factura = doc.data();
            let fechaEmision = factura.fechaEmision;
            let fechaVencimiento = factura.fechaVencimiento;
            let estadoPago = factura.estadoPago;

            if (fechaEmision === hoy) {
                facturasHoyCount++;
            }
            if (new Date(fechaVencimiento) > new Date(hoy) && estadoPago === "Pendiente") {
                proximasFacturasCount++;
            }
            if (new Date(fechaVencimiento) < new Date(hoy) && estadoPago !== "Pagado") {
                facturasVencidasCount++;
            }
            if (estadoPago === "Pendiente") {
                pagosPendientesCount++;
            }
            if (estadoPago === "Pagado" && fechaEmision === hoy) {
                facturasPagadasHoyCount++;
            }
        });

        document.getElementById('facturasHoy').textContent = facturasHoyCount;
        document.getElementById('facturasProximas').textContent = proximasFacturasCount;
        document.getElementById('facturasVencidas').textContent = facturasVencidasCount;
        document.getElementById('pagosPendientes').textContent = pagosPendientesCount;
        document.getElementById('facturasPagadasHoy').textContent = facturasPagadasHoyCount;
        document.getElementById('totalFacturas').textContent = todasFacturasCount;

        // Cargar la tabla con nombres en lugar de IDs
        cargarTablaFacturas(empresasMap, sucursalesMap, proveedoresMap);
    } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        alert("Error al cargar datos del dashboard: " + error.message);
    }
}

function cargarTablaFacturas(empresasMap, sucursalesMap, proveedoresMap) {
    const tbody = document.getElementById('facturasTable').getElementsByTagName('tbody')[0];
    tbody.innerHTML = '';

    db.collection('facturas').get().then((snapshot) => {
        snapshot.forEach((doc) => {
            let factura = doc.data();
            let row = tbody.insertRow();

            let empresaName = empresasMap.get(factura.empresaId) || 'Empresa no encontrada';
            let sucursalName = sucursalesMap.get(factura.sucursalId) || 'Sucursal no encontrada';
            let proveedorName = proveedoresMap.get(factura.proveedorId) || 'Proveedor no encontrado';

            row.insertCell(0).textContent = factura.numero;
            row.insertCell(1).textContent = empresaName;
            row.insertCell(2).textContent = sucursalName;
            row.insertCell(3).textContent = proveedorName;
            row.insertCell(4).textContent = factura.fechaEmision;
            row.insertCell(5).textContent = factura.fechaVencimiento;
            row.insertCell(6).textContent = 'Q' + factura.montoTotal;
            row.insertCell(7).textContent = factura.estadoPago;
            row.insertCell(8).textContent = 'Q' + (factura.montoTotal - (factura.pagosTotal || 0));
            row.onclick = () => selectFactura(doc.id, row); // Seleccionar factura al hacer clic
        });
    }).catch((error) => {
        console.error("Error al cargar facturas:", error);
    });
}

// Cargar los datos del dashboard al cargar la página
window.onload = cargarDatosDashboard;
