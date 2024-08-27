document.addEventListener("DOMContentLoaded", function() {
    loadDashboard();
});

function loadDashboard() {
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('facturas').style.display = 'none';
    document.getElementById('pagos').style.display = 'none';

    cargarDatosDashboard();
    cargarFiltros();  // Función para cargar filtros de empresa y sucursal
}

function cargarFiltros() {
    // Cargar opciones de empresa y sucursal para los filtros
    const empresasSelect = document.getElementById('filterEmpresa');
    const sucursalesSelect = document.getElementById('filterSucursal');

    db.collection('empresas').get().then(snapshot => {
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name;
            empresasSelect.appendChild(option);
        });
    });

    db.collection('sucursales').get().then(snapshot => {
        snapshot.forEach(doc => {
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = doc.data().name;
            sucursalesSelect.appendChild(option);
        });
    });
}

function showFacturas(tipo) {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('facturas').style.display = 'block';
    document.getElementById('pagos').style.display = 'none';

    // Lógica para cargar las facturas según el tipo seleccionado
    loadFacturasFromDB(tipo);
}

function showAllFacturas() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('facturas').style.display = 'block';
    document.getElementById('pagos').style.display = 'none';

    // Reutiliza la estructura de Gestion_Facturas/GestionFacturas.html
    fetch('Gestion_Facturas/GestionFacturas.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('facturas').innerHTML = html;
            // Cargar funciones específicas de facturas después de insertar el HTML
            initializeFacturasScripts();
        })
        .catch(error => console.error('Error al cargar GestionFacturas.html:', error));
}

function initializeFacturasScripts() {
    // Aquí puedes inicializar las funciones que necesitas ejecutar después de cargar el HTML de las facturas
    loadFacturas();
}

function loadFacturas() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('facturas').style.display = 'block';
    document.getElementById('pagos').style.display = 'none';

    loadFacturasFromDB(); // Cargar todas las facturas desde la base de datos
}

function loadPagos() {
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('facturas').style.display = 'none';
    document.getElementById('pagos').style.display = 'block';

    loadPagosFromDB(); // Cargar pagos desde la base de datos
}

function cargarDatosDashboard() {
    // Aquí agregas la lógica para cargar datos estadísticos y gráficos en el dashboard
    const facturasHoy = 5; // Ejemplo de datos, reemplazar con datos reales
    const facturasProximas = 10;
    const facturasVencidas = 2;
    const pagosPendientes = 3;
    const facturasPagadasHoy = 7; // Ejemplo de datos
    const totalFacturas = 25; // Ejemplo de total de facturas

    document.getElementById('facturasHoy').textContent = facturasHoy;
    document.getElementById('facturasProximas').textContent = facturasProximas;
    document.getElementById('facturasVencidas').textContent = facturasVencidas;
    document.getElementById('pagosPendientes').textContent = pagosPendientes;
    document.getElementById('facturasPagadasHoy').textContent = facturasPagadasHoy;
    document.getElementById('totalFacturas').textContent = totalFacturas;

    cargarGraficos(); // Función para cargar los gráficos
}

function cargarGraficos() {
    const ctxFacturas = document.getElementById('chartFacturas').getContext('2d');
    new Chart(ctxFacturas, {
        type: 'bar',
        data: {
            labels: ['Hoy', 'Próximas', 'Vencidas'],
            datasets: [{
                label: 'Número de Facturas',
                data: [5, 10, 2], // Datos de ejemplo
                backgroundColor: ['#3C91E6', '#FFCE26', '#DB504A'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    const ctxPagos = document.getElementById('chartPagos').getContext('2d');
    new Chart(ctxPagos, {
        type: 'pie',
        data: {
            labels: ['Pagados', 'Pendientes'],
            datasets: [{
                label: 'Estado de Pagos',
                data: [70, 30], // Datos de ejemplo
                backgroundColor: ['#3C91E6', '#DB504A'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true
        }
    });
}
