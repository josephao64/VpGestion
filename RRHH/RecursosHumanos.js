// RecursosHumanos.js

// Inicializar Firestore (asegúrate de que FirebaseConfig.js ya está cargado)
var db = firebase.firestore();

// Variable para almacenar el Periodo de Prueba en días
var periodoPruebaDias = 60; // Valor por defecto (2 meses)

// Variable para almacenar los detalles del empleado para exportar
var empleadoDetallesParaExportar = {};

document.addEventListener("DOMContentLoaded", function() {
    inicializarDataTableEmpleados();
    cargarSucursalesSelectOptions();
    cargarParametrosConfiguracion(); // Cargar parámetros al iniciar
    cargarEmpleados();

    // Eventos para los formularios
    document.getElementById('formEmpleado').addEventListener('submit', function(event) {
        event.preventDefault();
        guardarEmpleado();
    });

    // Evento para cambiar el tipo de contrato
    document.getElementById('tipoContrato').addEventListener('change', function() {
        manejarTipoContrato();
        actualizarLapsoContrato();
    });

    // Eventos para actualizar la fecha de fin de contrato y el lapso al cambiar las fechas
    document.getElementById('fechaInicioRelacion').addEventListener('change', function() {
        manejarTipoContrato();
        actualizarLapsoContrato();
    });

    document.getElementById('fechaFinContrato').addEventListener('change', function() {
        actualizarLapsoContrato();
    });

    // Resetear formulario al cerrar el modal
    $('#modalEmpleado').on('hidden.bs.modal', function () {
        document.getElementById('formEmpleado').reset();
        document.getElementById('empleadoId').value = '';
        document.getElementById('modalEmpleadoTitulo').textContent = 'Agregar Empleado';
        document.getElementById('duracionContrato').readOnly = true;
        document.getElementById('duracionContrato').value = '';
        document.getElementById('fechaFinContrato').value = '';
        document.getElementById('fechaFinContrato').disabled = true;
        document.getElementById('lapsoContrato').value = '';
    });

    // Evento para el filtro de sucursales
    document.getElementById('sucursalFiltro').addEventListener('change', function() {
        cargarEmpleados();
    });
});

// Función para cargar los parámetros de configuración
async function cargarParametrosConfiguracion() {
    try {
        const parametroDoc = await db.collection('parametros').doc('periodoPruebaDias').get();
        if (parametroDoc.exists) {
            periodoPruebaDias = parseInt(parametroDoc.data().valor) || 60;
        }
    } catch (error) {
        console.error('Error al cargar parámetros de configuración:', error);
    }
}

// Función para manejar el cambio en el tipo de contrato
function manejarTipoContrato() {
    const tipoContrato = document.getElementById('tipoContrato').value;
    const duracionContrato = document.getElementById('duracionContrato');
    const fechaInicioRelacion = document.getElementById('fechaInicioRelacion').value;
    const fechaFinContrato = document.getElementById('fechaFinContrato');
    const lapsoContrato = document.getElementById('lapsoContrato');

    if (tipoContrato === 'prueba') {
        duracionContrato.readOnly = true;
        if (fechaInicioRelacion) {
            // Calcular la fecha de fin sumando el periodo de prueba en días
            const fechaInicio = new Date(fechaInicioRelacion);
            const fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate() + periodoPruebaDias);
            fechaFinContrato.value = fechaFin.toISOString().split('T')[0];
            fechaFinContrato.disabled = true;
            // Convertir los días a una representación en letras
            duracionContrato.value = convertirDiasEnLetras(periodoPruebaDias);
            lapsoContrato.value = duracionContrato.value;
        }
    } else if (tipoContrato === 'temporal') {
        duracionContrato.readOnly = false;
        fechaFinContrato.disabled = false;
        duracionContrato.value = '';
        lapsoContrato.value = '';
    } else {
        duracionContrato.readOnly = true;
        duracionContrato.value = 'Indefinido';
        lapsoContrato.value = 'Indefinido';
        fechaFinContrato.value = '';
        fechaFinContrato.disabled = true;
    }
}

// Función para convertir días en letras
function convertirDiasEnLetras(dias) {
    if (dias < 30) {
        return `${dias} día(s)`;
    } else if (dias < 365) {
        const meses = Math.floor(dias / 30);
        return `${meses} mes(es)`;
    } else {
        const años = Math.floor(dias / 365);
        return `${años} año(s)`;
    }
}

// Función para actualizar el lapso del contrato al cambiar las fechas
function actualizarLapsoContrato() {
    const fechaInicioRelacion = document.getElementById('fechaInicioRelacion').value;
    const fechaFinContrato = document.getElementById('fechaFinContrato').value;
    const lapsoContrato = document.getElementById('lapsoContrato');

    if (fechaInicioRelacion && fechaFinContrato) {
        const fechaInicio = new Date(fechaInicioRelacion);
        const fechaFin = new Date(fechaFinContrato);
        const diasDiferencia = Math.ceil(
            (fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)
        );
        lapsoContrato.value = convertirDiasEnLetras(diasDiferencia);
    } else {
        lapsoContrato.value = '';
    }
}

// Inicializar DataTable para Empleados
var tablaEmpleados;

function inicializarDataTableEmpleados() {
    tablaEmpleados = $('#empleadosTable').DataTable({
        columns: [
            { data: 'nombre' },
            { data: 'DPI' },
            { data: 'puesto' },
            { data: 'sucursal' },
            { data: 'telefono1' },
            { data: 'fechaInicioRelacion' },
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
        const sucursalSelectContrato = document.getElementById('sucursalContrato');
        const sucursalFiltro = document.getElementById('sucursalFiltro');
        sucursalSelectContrato.innerHTML = '<option value="">Selecciona una sucursal</option>';
        sucursalFiltro.innerHTML = '<option value="">Todas las sucursales</option>';

        sucursalesSnapshot.forEach(function(doc) {
            const sucursal = doc.data();
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = sucursal.name;
            sucursalSelectContrato.appendChild(option);

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

            // Formatear campos de fecha
            const fechaInicioRelacion = (empleado.fechaInicioRelacion && empleado.fechaInicioRelacion.toDate) ? moment(empleado.fechaInicioRelacion.toDate()).format('DD/MM/YYYY') : 'N/A';

            empleadosData.push({
                id: doc.id,
                nombre: empleado.nombre || 'N/A',
                DPI: empleado.DPI || 'N/A',
                puesto: empleado.puestoContrato || 'N/A',
                sucursal: sucursalName,
                telefono1: empleado.telefono1 || 'N/A',
                fechaInicioRelacion: fechaInicioRelacion,
                acciones: `
                    <button class="btn btn-sm btn-primary" onclick="verDetallesEmpleado('${doc.id}')">Ver Detalles</button>
                    <button class="btn btn-sm btn-warning" onclick="editarEmpleado('${doc.id}')">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarEmpleado('${doc.id}')">Eliminar</button>
                `
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
    document.getElementById('duracionContrato').readOnly = true;
    document.getElementById('duracionContrato').value = '';
    document.getElementById('fechaFinContrato').value = '';
    document.getElementById('fechaFinContrato').disabled = true;
    document.getElementById('lapsoContrato').value = '';
    $('#modalEmpleado').modal('show');
}

// Función para cerrar el modal de empleado
function cerrarModalEmpleado() {
    $('#modalEmpleado').modal('hide');
}

// Función para guardar (agregar o actualizar) un empleado
async function guardarEmpleado() {
    const empleadoId = document.getElementById('empleadoId').value;
    // Información del Contrato
    const fechaInicioRelacion = document.getElementById('fechaInicioRelacion').value;
    const fechaFinContrato = document.getElementById('fechaFinContrato').value;
    const tipoContrato = document.getElementById('tipoContrato').value;
    const duracionContrato = document.getElementById('duracionContrato').value.trim();
    const puestoContrato = document.getElementById('puestoContrato').value;
    const sucursalId = document.getElementById('sucursalContrato').value;
    const tipoJornada = document.getElementById('tipoJornada').value;
    const salarioContratoInput = document.getElementById('salarioContrato').value;
    const salarioContrato = parseFloat(salarioContratoInput);
    const lugarFirmaContrato = document.getElementById('lugarFirmaContrato').value.trim();
    const fechaFirmaContrato = document.getElementById('fechaFirmaContrato').value;
    // Información del Empleado
    const nombre = document.getElementById('nombreEmpleado').value.trim();
    const email = document.getElementById('emailEmpleado').value.trim();
    const telefono1 = document.getElementById('telefono1Empleado').value.trim();
    const telefono2 = document.getElementById('telefono2Empleado').value.trim();
    const DPI = document.getElementById('dpiEmpleado').value.trim();
    const direccion = document.getElementById('direccionEmpleado').value.trim();
    const fechaNacimiento = document.getElementById('fechaNacimientoEmpleado').value;
    const estado = document.getElementById('estadoEmpleado').value;

    // Validaciones
    if (!fechaInicioRelacion || !tipoContrato || !puestoContrato || !sucursalId || !tipoJornada ||
        !salarioContratoInput || !lugarFirmaContrato || !fechaFirmaContrato ||
        !nombre || !email || !telefono1 || !DPI || !direccion || !fechaNacimiento) {
        Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
        return;
    }

    if (tipoContrato !== 'indefinido' && (!fechaFinContrato || !duracionContrato)) {
        Swal.fire('Error', 'Debe especificar la Fecha Fin y Duración del Contrato.', 'error');
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

    if (salarioContrato <= 0) {
        Swal.fire('Error', 'El salario debe ser un número positivo.', 'error');
        return;
    }

    // Validar que la fecha de inicio relación sea posterior o igual a la fecha de firma del contrato
    if (new Date(fechaInicioRelacion) < new Date(fechaFirmaContrato)) {
        Swal.fire('Error', 'La Fecha de Inicio de Relación debe ser posterior o igual a la Fecha de Firma de Contrato.', 'error');
        return;
    }

    try {
        const empleadoData = {
            // Información del Contrato
            fechaInicioRelacion: firebase.firestore.Timestamp.fromDate(new Date(fechaInicioRelacion)),
            fechaFinContrato: fechaFinContrato ? firebase.firestore.Timestamp.fromDate(new Date(fechaFinContrato)) : null,
            tipoContrato: tipoContrato,
            duracionContrato: duracionContrato || null,
            puestoContrato: puestoContrato,
            sucursalId: sucursalId,
            tipoJornada: tipoJornada,
            salario: salarioContrato,
            lugarFirmaContrato: lugarFirmaContrato,
            fechaFirmaContrato: firebase.firestore.Timestamp.fromDate(new Date(fechaFirmaContrato)),
            // Información del Empleado
            nombre: nombre,
            email: email,
            telefono1: telefono1,
            telefono2: telefono2 || null,
            DPI: DPI,
            direccion: direccion,
            fechaNacimiento: firebase.firestore.Timestamp.fromDate(new Date(fechaNacimiento)),
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
            // Información del Contrato
            document.getElementById('fechaInicioRelacion').value = (empleado.fechaInicioRelacion && empleado.fechaInicioRelacion.toDate) ? moment(empleado.fechaInicioRelacion.toDate()).format('YYYY-MM-DD') : '';
            document.getElementById('tipoContrato').value = empleado.tipoContrato || '';
            manejarTipoContrato(); // Actualizar la interfaz según el tipo de contrato
            document.getElementById('fechaFinContrato').value = (empleado.fechaFinContrato && empleado.fechaFinContrato.toDate) ? moment(empleado.fechaFinContrato.toDate()).format('YYYY-MM-DD') : '';
            document.getElementById('duracionContrato').value = empleado.duracionContrato || '';
            document.getElementById('lapsoContrato').value = empleado.duracionContrato || '';
            document.getElementById('puestoContrato').value = empleado.puestoContrato || '';
            document.getElementById('sucursalContrato').value = empleado.sucursalId || '';
            document.getElementById('tipoJornada').value = empleado.tipoJornada || '';
            document.getElementById('salarioContrato').value = empleado.salario || '';
            document.getElementById('lugarFirmaContrato').value = empleado.lugarFirmaContrato || '';
            document.getElementById('fechaFirmaContrato').value = (empleado.fechaFirmaContrato && empleado.fechaFirmaContrato.toDate) ? moment(empleado.fechaFirmaContrato.toDate()).format('YYYY-MM-DD') : '';
            // Información del Empleado
            document.getElementById('nombreEmpleado').value = empleado.nombre || '';
            document.getElementById('emailEmpleado').value = empleado.email || '';
            document.getElementById('telefono1Empleado').value = empleado.telefono1 || '';
            document.getElementById('telefono2Empleado').value = empleado.telefono2 || '';
            document.getElementById('dpiEmpleado').value = empleado.DPI || '';
            document.getElementById('direccionEmpleado').value = empleado.direccion || '';
            document.getElementById('fechaNacimientoEmpleado').value = (empleado.fechaNacimiento && empleado.fechaNacimiento.toDate) ? moment(empleado.fechaNacimiento.toDate()).format('YYYY-MM-DD') : '';
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

// Función para ver detalles del empleado
async function verDetallesEmpleado(id) {
    try {
        const empleadoDoc = await db.collection('empleados').doc(id).get();
        if (empleadoDoc.exists) {
            const empleado = empleadoDoc.data();

            // Obtener el nombre de la sucursal
            const sucursalDoc = await db.collection('sucursales').doc(empleado.sucursalId).get();
            const sucursalName = sucursalDoc.exists ? sucursalDoc.data().name : 'N/A';

            // Formatear fechas
            const fechaNacimiento = empleado.fechaNacimiento ? moment(empleado.fechaNacimiento.toDate()).format('DD/MM/YYYY') : 'N/A';
            const fechaInicioRelacion = empleado.fechaInicioRelacion ? moment(empleado.fechaInicioRelacion.toDate()).format('DD/MM/YYYY') : 'N/A';
            const fechaFinContrato = empleado.fechaFinContrato ? moment(empleado.fechaFinContrato.toDate()).format('DD/MM/YYYY') : 'N/A';
            const fechaFirmaContrato = empleado.fechaFirmaContrato ? moment(empleado.fechaFirmaContrato.toDate()).format('DD/MM/YYYY') : 'N/A';

            // Construir el contenido HTML para mostrar los detalles
            const detallesHTML = `
                <h5>Información del Empleado</h5>
                <p><strong>Nombre:</strong> ${empleado.nombre || 'N/A'}</p>
                <p><strong>Email:</strong> ${empleado.email || 'N/A'}</p>
                <p><strong>Teléfono 1:</strong> ${empleado.telefono1 || 'N/A'}</p>
                <p><strong>Teléfono 2:</strong> ${empleado.telefono2 || 'N/A'}</p>
                <p><strong>DPI:</strong> ${empleado.DPI || 'N/A'}</p>
                <p><strong>Dirección:</strong> ${empleado.direccion || 'N/A'}</p>
                <p><strong>Fecha de Nacimiento:</strong> ${fechaNacimiento}</p>
                <p><strong>Estado:</strong> ${empleado.estado || 'N/A'}</p>
                <hr>
                <h5>Información del Contrato</h5>
                <p><strong>Fecha Inicio Relación:</strong> ${fechaInicioRelacion}</p>
                <p><strong>Fecha Fin Contrato:</strong> ${fechaFinContrato}</p>
                <p><strong>Tipo de Contrato:</strong> ${empleado.tipoContrato || 'N/A'}</p>
                <p><strong>Duración del Contrato:</strong> ${empleado.duracionContrato || 'N/A'}</p>
                <p><strong>Puesto:</strong> ${empleado.puestoContrato || 'N/A'}</p>
                <p><strong>Sucursal:</strong> ${sucursalName}</p>
                <p><strong>Tipo de Jornada:</strong> ${empleado.tipoJornada || 'N/A'}</p>
                <p><strong>Salario:</strong> Q${empleado.salario ? empleado.salario.toFixed(2) : 'N/A'}</p>
                <p><strong>Lugar Firma Contrato:</strong> ${empleado.lugarFirmaContrato || 'N/A'}</p>
                <p><strong>Fecha Firma Contrato:</strong> ${fechaFirmaContrato}</p>
            `;

            document.getElementById('detallesEmpleadoBody').innerHTML = detallesHTML;
            document.getElementById('modalDetallesTitulo').textContent = `Detalles de ${empleado.nombre || 'Empleado'}`;
            $('#modalDetallesEmpleado').modal('show');

            // Guardar los detalles para exportar
            empleadoDetallesParaExportar = {
                nombre: empleado.nombre || 'N/A',
                detallesHTML: detallesHTML
            };

        } else {
            Swal.fire('Error', 'El empleado no existe.', 'error');
        }
    } catch (error) {
        console.error('Error al obtener detalles del empleado:', error);
        Swal.fire('Error', 'Ocurrió un error al obtener los detalles del empleado.', 'error');
    }
}

// Función para cerrar el modal de detalles
function cerrarModalDetalles() {
    $('#modalDetallesEmpleado').modal('hide');
}

// Función para exportar los detalles del empleado a PDF
function exportarDetallesEmpleado() {
    if (!empleadoDetallesParaExportar || !empleadoDetallesParaExportar.detallesHTML) {
        Swal.fire('Error', 'No hay detalles disponibles para exportar.', 'error');
        return;
    }

    const { nombre, detallesHTML } = empleadoDetallesParaExportar;

    // Crear un nuevo documento PDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Añadir título
    doc.setFontSize(16);
    doc.text(`Detalles de ${nombre}`, 10, 20);

    // Añadir contenido
    doc.setFontSize(12);
    const content = detallesHTML.replace(/<\/?[^>]+(>|$)/g, "").replace(/&nbsp;/g, " ");
    const splitText = doc.splitTextToSize(content, 180);
    doc.text(splitText, 10, 30);

    // Descargar el PDF
    doc.save(`Detalles_${nombre.replace(/\s+/g, '_')}.pdf`);
}
