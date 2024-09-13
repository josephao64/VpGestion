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

let maquinariaActualId = '';

// Función para cargar las sucursales desde Firebase
async function cargarSucursales() {
    const sucursalSelect = document.getElementById('sucursal');
    sucursalSelect.innerHTML = '';

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
    const fechaUltima = moment(ultimaFecha);
    return fechaUltima.add(intervalo, 'days').format('YYYY-MM-DD');
}

// Abrir modal de registrar mantenimiento
function openModalMantenimiento(id, maquinaria) {
    maquinariaActualId = id;
    document.getElementById('modalMaquinariaNombre').textContent = maquinaria.nombre;
    document.getElementById('modalMaquinariaSucursal').textContent = maquinaria.sucursal;
    document.getElementById('nuevaFecha').value = moment().format('YYYY-MM-DD');
    document.getElementById('descripcionMantenimiento').value = '';
    document.getElementById('modalMantenimiento').style.display = 'block';
}

// Abrir modal de historial de mantenimiento
async function openModalHistorial(id) {
    const historialUl = document.getElementById('historialMantenimiento');
    historialUl.innerHTML = '';
    const maquinariaDoc = await db.collection('maquinarias').doc(id).get();
    const historial = maquinariaDoc.data().historial || [];

    historial.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.fecha}: ${item.descripcion}`;
        historialUl.appendChild(li);
    });

    document.getElementById('modalHistorial').style.display = 'block';
}

// Cerrar modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Registrar nuevo mantenimiento
async function registrarNuevoMantenimiento() {
    const fechaMantenimiento = document.getElementById('nuevaFecha').value;
    const descripcionMantenimiento = document.getElementById('descripcionMantenimiento').value;

    if (!fechaMantenimiento || !descripcionMantenimiento) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Debes completar todos los campos.',
        });
        return;
    }

    const maquinariaDoc = await db.collection('maquinarias').doc(maquinariaActualId).get();
    const maquinaria = maquinariaDoc.data();
    const nuevoProximoMantenimiento = calcularProximoMantenimiento(fechaMantenimiento, maquinaria.intervalo);

    try {
        await db.collection('maquinarias').doc(maquinariaActualId).update({
            ultimaFecha: fechaMantenimiento,
            proximoMantenimiento: nuevoProximoMantenimiento,
            historial: firebase.firestore.FieldValue.arrayUnion({
                fecha: fechaMantenimiento,
                descripcion: descripcionMantenimiento
            })
        });
        closeModal('modalMantenimiento');
        renderMaquinaria();
    } catch (error) {
        console.error("Error al registrar mantenimiento: ", error);
    }
}

// Función para renderizar las maquinarias en la tabla
async function renderMaquinaria() {
    const maquinariaTable = document.getElementById('maquinariaTable').querySelector('tbody');
    maquinariaTable.innerHTML = '';
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
                    <button onclick="openModalMantenimiento('${doc.id}', ${JSON.stringify(maquinaria)})">Registrar Mantenimiento</button>
                    <button onclick="openModalHistorial('${doc.id}')">Mostrar Historial</button>
                </td>
            </tr>
        `;
        maquinariaTable.innerHTML += row;

        verificarMantenimiento(doc.id, maquinaria);
    });
}

// Verificar si una maquinaria necesita mantenimiento
function verificarMantenimiento(id, maquinaria) {
    const hoy = moment().startOf('day');
    const proximoMantenimiento = moment(maquinaria.proximoMantenimiento);

    // Un día antes
    if (hoy.isSame(proximoMantenimiento.subtract(1, 'days'), 'day')) {
        Swal.fire({
            icon: 'warning',
            title: 'Recordatorio',
            text: `La maquinaria ${maquinaria.nombre} en la sucursal ${maquinaria.sucursal} necesita mantenimiento mañana.`,
            confirmButtonText: 'Entendido'
        });
    }

    // El día del mantenimiento
    if (hoy.isSame(proximoMantenimiento, 'day')) {
        Swal.fire({
            icon: 'info',
            title: 'Mantenimiento Programado',
            text: `La maquinaria ${maquinaria.nombre} en la sucursal ${maquinaria.sucursal} necesita mantenimiento hoy.`,
            confirmButtonText: 'Registrar Mantenimiento',
            showCancelButton: true,
            cancelButtonText: 'Posponer',
        }).then((result) => {
            if (result.isConfirmed) {
                openModalMantenimiento(id, maquinaria);
            }
        });
    }
}

// Evento para el formulario de añadir maquinaria
document.getElementById('maquinariaForm').addEventListener('submit', async function(event) {
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
        proximoMantenimiento: calcularProximoMantenimiento(ultimaFecha, intervalo),
        historial: [{
            fecha: ultimaFecha,
            descripcion: `Mantenimiento inicial registrado el ${ultimaFecha}`
        }]
    };

    try {
        await db.collection('maquinarias').add(nuevaMaquinaria);
        document.getElementById('maquinariaForm').reset();
        renderMaquinaria();
    } catch (error) {
        console.error("Error al agregar maquinaria: ", error);
    }
});

// Inicializar tabla y cargar sucursales al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarSucursales();
    renderMaquinaria();
});

// Evento para registrar mantenimiento desde el modal
document.getElementById('registrarMantenimientoBtn').addEventListener('click', registrarNuevoMantenimiento);
