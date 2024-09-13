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

// Obtenemos los elementos del DOM
const form = document.getElementById('maquinariaForm');
const maquinariaTable = document.getElementById('maquinariaTable').querySelector('tbody');

// Función para cargar las sucursales desde Firebase
async function cargarSucursales() {
    const sucursalSelect = document.getElementById('sucursal');
    sucursalSelect.innerHTML = ''; // Limpiar opciones previas

    try {
        const snapshot = await db.collection('sucursales').get();
        snapshot.forEach((doc) => {
            const sucursal = doc.data();
            const option = document.createElement('option');
            option.value = sucursal.name;
            option.textContent = sucursal.name;
            sucursalSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
    }
}

// Función para calcular el próximo mantenimiento
function calcularProximoMantenimiento(ultimaFecha, intervalo) {
    const fechaUltima = new Date(ultimaFecha);
    fechaUltima.setDate(fechaUltima.getDate() + parseInt(intervalo));
    return fechaUltima.toISOString().split('T')[0];
}

// Evento para manejar el envío del formulario
form.addEventListener('submit', async function(event) {
    event.preventDefault();

    const nombre = document.getElementById('nombre').value;
    const sucursal = document.getElementById('sucursal').value;
    const intervalo = document.getElementById('intervalo').value;
    const ultimaFecha = document.getElementById('ultimaFecha').value;

    const nuevaMaquinaria = {
        nombre,
        sucursal,
        intervalo,
        ultimaFecha,
        proximoMantenimiento: calcularProximoMantenimiento(ultimaFecha, intervalo)
    };

    try {
        await db.collection('maquinarias').add(nuevaMaquinaria);
        form.reset();
        renderMaquinaria();
    } catch (error) {
        console.error("Error al agregar maquinaria: ", error);
    }
});

// Función para renderizar las maquinarias en la tabla
async function renderMaquinaria() {
    maquinariaTable.innerHTML = ''; // Limpiar la tabla antes de redibujar
    const snapshot = await db.collection('maquinarias').get();

    snapshot.forEach((doc) => {
        const maquinaria = doc.data();
        const proximoMantenimiento = calcularProximoMantenimiento(maquinaria.ultimaFecha, maquinaria.intervalo);

        const row = `
            <tr>
                <td>${maquinaria.nombre}</td>
                <td>${maquinaria.sucursal}</td>
                <td>${maquinaria.intervalo}</td>
                <td>${maquinaria.ultimaFecha}</td>
                <td>${proximoMantenimiento}</td>
                <td>
                    <button onclick="eliminarMaquinaria('${doc.id}')">Eliminar</button>
                </td>
            </tr>
        `;
        maquinariaTable.innerHTML += row;
    });
}

// Función para eliminar una maquinaria
async function eliminarMaquinaria(id) {
    try {
        await db.collection('maquinarias').doc(id).delete();
        renderMaquinaria();
    } catch (error) {
        console.error("Error al eliminar maquinaria: ", error);
    }
}

// Inicializar tabla y cargar sucursales al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarSucursales();
    renderMaquinaria();
});
