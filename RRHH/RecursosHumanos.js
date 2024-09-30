// RecursosHumanos.js

// Inicializar Firestore (asegúrate de que FirebaseConfig.js ya está cargado)
var db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function() {
    inicializarDataTableEmpleados();
    cargarSucursalesSelectOptions();
    cargarEmpleados();

    // Eventos para los formularios
    document.getElementById('formEmpleado').addEventListener('submit', function(event) {
        event.preventDefault();
        guardarEmpleado();
    });

    // Resetear formulario al cerrar el modal
    $('#modalEmpleado').on('hidden.bs.modal', function () {
        document.getElementById('formEmpleado').reset();
        document.getElementById('empleadoId').value = '';
        document.getElementById('modalEmpleadoTitulo').textContent = 'Agregar Empleado';
    });

    // Evento para el filtro de sucursales
    document.getElementById('sucursalFiltro').addEventListener('change', function() {
        cargarEmpleados();
    });
});

// Inicializar DataTable para Empleados
var tablaEmpleados;

function inicializarDataTableEmpleados() {
    tablaEmpleados = $('#empleadosTable').DataTable({
        columns: [
            { data: 'nombre' },
            { data: 'puesto' },
            { data: 'sucursal' },
            { data: 'email' },
            { data: 'telefono1' },
            { data: 'telefono2' },
            { data: 'DPI' },
            { data: 'direccion' },
            { data: 'fechaNacimiento' },
            { data: 'fechaInicioLabores' },
            { data: 'salario' },
            { data: 'estado' },
            { data: 'acciones' }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
        },
        responsive: true
    });
}

// Función para cargar las sucursales en los selects de empleados
async function cargarSucursalesSelectOptions() {
    try {
        const sucursalesSnapshot = await db.collection('sucursales').where('status', '==', 'activo').orderBy('name').get();
        const sucursalSelect = document.getElementById('sucursalEmpleado');
        const sucursalFiltro = document.getElementById('sucursalFiltro');
        sucursalSelect.innerHTML = '<option value="">Selecciona una sucursal</option>';
        sucursalFiltro.innerHTML = '<option value="">Todas las sucursales</option>';

        sucursalesSnapshot.forEach(function(doc) {
            const sucursal = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = sucursal.name;
            sucursalSelect.appendChild(option);

            const optionFiltro = option.cloneNode(true);
            sucursalFiltro.appendChild(optionFiltro);
        });
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las sucursales.', 'error');
    }
}

// Función para cargar los empleados en la tabla
async function cargarEmpleados() {
    try {
        const sucursalFiltro = document.getElementById('sucursalFiltro').value;
        let empleadosRef = db.collection('empleados');

        if (sucursalFiltro) {
            empleadosRef = empleadosRef.where('sucursalId', '==', sucursalFiltro);
        }

        const empleadosSnapshot = await empleadosRef.get();
        const empleadosData = [];

        for (let doc of empleadosSnapshot.docs) {
            const empleado = doc.data();
            const sucursalDoc = await db.collection('sucursales').doc(empleado.sucursalId).get();
            const sucursalName = sucursalDoc.exists ? sucursalDoc.data().name : 'N/A';

            // Verificar y formatear campos de fecha
            const fechaNacimiento = (empleado.fechaNacimiento && empleado.fechaNacimiento.toDate) ? moment(empleado.fechaNacimiento.toDate()).format('DD/MM/YYYY') : 'N/A';
            const fechaInicioLabores = (empleado.fechaInicioLabores && empleado.fechaInicioLabores.toDate) ? moment(empleado.fechaInicioLabores.toDate()).format('DD/MM/YYYY') : 'N/A';

            // Verificar y formatear salario con símbolo Q
            const salario = (typeof empleado.salario === 'number') ? `Q${empleado.salario.toFixed(2)}` : 'N/A';

            // Verificar estado
            const estado = empleado.estado ? empleado.estado.charAt(0).toUpperCase() + empleado.estado.slice(1) : 'N/A';

            empleadosData.push({
                id: doc.id,
                nombre: empleado.nombre || 'N/A',
                puesto: empleado.puesto || 'N/A',
                sucursal: sucursalName,
                email: empleado.email || 'N/A',
                telefono1: empleado.telefono1 || 'N/A',
                telefono2: empleado.telefono2 || 'N/A',
                DPI: empleado.DPI || 'N/A',
                direccion: empleado.direccion || 'N/A',
                fechaNacimiento: fechaNacimiento,
                fechaInicioLabores: fechaInicioLabores,
                salario: salario,
                estado: estado,
                acciones: `<button class="btn btn-sm btn-primary" onclick="editarEmpleado('${doc.id}')">Editar</button>
                           <button class="btn btn-sm btn-danger" onclick="eliminarEmpleado('${doc.id}')">Eliminar</button>`
            });
        }

        tablaEmpleados.clear();
        tablaEmpleados.rows.add(empleadosData).draw();

    } catch (error) {
        console.error('Error al cargar empleados:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar los empleados.', 'error');
    }
}

// Función para abrir el modal de agregar empleado
function abrirModalAgregarEmpleado() {
    document.getElementById('modalEmpleadoTitulo').textContent = 'Agregar Empleado';
    document.getElementById('formEmpleado').reset();
    document.getElementById('empleadoId').value = '';
    $('#modalEmpleado').modal('show');
}

// Función para cerrar el modal de empleado
function cerrarModalEmpleado() {
    $('#modalEmpleado').modal('hide');
}

// Función para guardar (agregar o actualizar) un empleado
async function guardarEmpleado() {
    const empleadoId = document.getElementById('empleadoId').value;
    const nombre = document.getElementById('nombreEmpleado').value.trim();
    const email = document.getElementById('emailEmpleado').value.trim();
    const telefono1 = document.getElementById('telefono1Empleado').value.trim();
    const telefono2 = document.getElementById('telefono2Empleado').value.trim();
    const DPI = document.getElementById('dpiEmpleado').value.trim();
    const direccion = document.getElementById('direccionEmpleado').value.trim();
    const fechaNacimiento = document.getElementById('fechaNacimientoEmpleado').value;
    const puesto = document.getElementById('puestoEmpleado').value;
    const sucursalId = document.getElementById('sucursalEmpleado').value;
    const fechaInicioLabores = document.getElementById('fechaInicioLaboresEmpleado').value;
    const salarioInput = document.getElementById('salarioEmpleado').value;
    const salario = parseFloat(salarioInput);
    const estado = document.getElementById('estadoEmpleado').value;

    // Validaciones
    if (!nombre || !email || !telefono1 || !DPI || !direccion || !fechaNacimiento || !puesto || !sucursalId || !fechaInicioLabores || isNaN(salario)) {
        Swal.fire('Error', 'Todos los campos excepto Teléfono 2 son obligatorios.', 'error');
        return;
    }

    if (!/^\d{8}$/.test(telefono1)) {
        Swal.fire('Error', 'El Teléfono 1 debe tener exactamente 8 dígitos.', 'error');
        return;
    }

    if (telefono2 && !/^\d{8}$/.test(telefono2)) {
        Swal.fire('Error', 'El Teléfono 2 debe tener exactamente 8 dígitos si se ingresa.', 'error');
        return;
    }

    if (salario <= 0) {
        Swal.fire('Error', 'El salario debe ser un número positivo.', 'error');
        return;
    }

    try {
        const empleadoData = {
            nombre: nombre,
            email: email,
            telefono1: telefono1,
            telefono2: telefono2 || null,
            DPI: DPI,
            direccion: direccion,
            fechaNacimiento: firebase.firestore.Timestamp.fromDate(new Date(fechaNacimiento)),
            puesto: puesto,
            sucursalId: sucursalId,
            fechaInicioLabores: firebase.firestore.Timestamp.fromDate(new Date(fechaInicioLabores)),
            salario: salario,
            estado: estado.toLowerCase()
        };

        if (empleadoId) {
            // Actualizar empleado
            await db.collection('empleados').doc(empleadoId).update(empleadoData);
            Swal.fire('Éxito', 'Empleado actualizado correctamente.', 'success');
        } else {
            // Agregar nuevo empleado
            await db.collection('empleados').add(empleadoData);
            Swal.fire('Éxito', 'Empleado agregado correctamente.', 'success');
        }

        $('#modalEmpleado').modal('hide');
        cargarEmpleados();

    } catch (error) {
        console.error('Error al guardar empleado:', error);
        Swal.fire('Error', 'Ocurrió un error al guardar el empleado.', 'error');
    }
}

// Función para editar un empleado
async function editarEmpleado(id) {
    try {
        const empleadoDoc = await db.collection('empleados').doc(id).get();
        if (empleadoDoc.exists) {
            const empleado = empleadoDoc.data();

            document.getElementById('modalEmpleadoTitulo').textContent = 'Editar Empleado';
            document.getElementById('empleadoId').value = id;
            document.getElementById('nombreEmpleado').value = empleado.nombre || '';
            document.getElementById('emailEmpleado').value = empleado.email || '';
            document.getElementById('telefono1Empleado').value = empleado.telefono1 || '';
            document.getElementById('telefono2Empleado').value = empleado.telefono2 || '';
            document.getElementById('dpiEmpleado').value = empleado.DPI || '';
            document.getElementById('direccionEmpleado').value = empleado.direccion || '';
            document.getElementById('fechaNacimientoEmpleado').value = (empleado.fechaNacimiento && empleado.fechaNacimiento.toDate) ? moment(empleado.fechaNacimiento.toDate()).format('YYYY-MM-DD') : '';
            document.getElementById('puestoEmpleado').value = empleado.puesto || '';
            document.getElementById('sucursalEmpleado').value = empleado.sucursalId || '';
            document.getElementById('fechaInicioLaboresEmpleado').value = (empleado.fechaInicioLabores && empleado.fechaInicioLabores.toDate) ? moment(empleado.fechaInicioLabores.toDate()).format('YYYY-MM-DD') : '';
            document.getElementById('salarioEmpleado').value = empleado.salario || '';
            document.getElementById('estadoEmpleado').value = empleado.estado || 'activo';

            $('#modalEmpleado').modal('show');
        } else {
            Swal.fire('Error', 'El empleado no existe.', 'error');
        }
    } catch (error) {
        console.error('Error al obtener empleado:', error);
        Swal.fire('Error', 'Ocurrió un error al obtener los datos del empleado.', 'error');
    }
}

// Función para eliminar un empleado
function eliminarEmpleado(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará al empleado permanentemente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await db.collection('empleados').doc(id).delete();
                cargarEmpleados();
                Swal.fire('Eliminado', 'El empleado ha sido eliminado.', 'success');
            } catch (error) {
                console.error('Error al eliminar empleado:', error);
                Swal.fire('Error', 'Ocurrió un error al eliminar el empleado.', 'error');
            }
        }
    });
}
