// RecursosHumanos.js

// Inicializar Firestore (asegúrate de que FirebaseConfig.js ya está cargado)
var db = firebase.firestore();

// Variables para almacenar los parámetros de configuración
var periodoPruebaDias = 60; // Valor por defecto
var salariosMinimos = {};
var bonificaciones = {}; // Suponiendo que hay bonificaciones configuradas
var iggsDescuento = 0; // Descuento IGSS por defecto

// Variable para almacenar los detalles del empleado para exportar (si es necesario)
var empleadoDetallesParaExportar = {};

// Evento que se ejecuta cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    inicializarDataTableEmpleados();
    cargarSucursalesSelectOptions();
    cargarParametrosConfiguracion(); // Cargar parámetros al iniciar
    cargarEmpleados();

    // Eventos para los formularios
    const formEmpleado = document.getElementById('formEmpleado');
    if (formEmpleado) {
        formEmpleado.addEventListener('submit', function(event) {
            event.preventDefault();
            guardarEmpleado();
        });
    } else {
        console.error("El elemento con ID 'formEmpleado' no se encontró en el DOM.");
    }

    // Evento para cambiar el tipo de contrato
    const tipoContratoElement = document.getElementById('tipoContrato');
    if (tipoContratoElement) {
        tipoContratoElement.addEventListener('change', function() {
            manejarTipoContrato();
        });
    } else {
        console.error("El elemento con ID 'tipoContrato' no se encontró en el DOM.");
    }

    // Evento para seleccionar si se paga IGSS o no
    const pagarIGSSElement = document.getElementById('pagarIGSS');
    if (pagarIGSSElement) {
        pagarIGSSElement.addEventListener('change', function() {
            calcularSalarioTotal();
        });
    } else {
        console.warn("El elemento con ID 'pagarIGSS' no se encontró en el DOM. Asegúrate de haberlo añadido al HTML.");
    }

    // Evento para ingresar el salario quincenal y calcular automáticamente el salario diario y total
    const salarioQuincenalElement = document.getElementById('salarioQuincenal');
    if (salarioQuincenalElement) {
        salarioQuincenalElement.addEventListener('input', function() {
            calcularSalarioDiario();
            calcularSalarioTotal();
        });
    } else {
        console.warn("El elemento con ID 'salarioQuincenal' no se encontró en el DOM. Asegúrate de haberlo añadido al HTML.");
    }

    // Evento para seleccionar sucursal y establecer salario mínimo automáticamente
    const sucursalContratoElement = document.getElementById('sucursalContrato');
    if (sucursalContratoElement) {
        sucursalContratoElement.addEventListener('change', function() {
            establecerSalarioMinimo();
        });
    } else {
        console.warn("El elemento con ID 'sucursalContrato' no se encontró en el DOM. Asegúrate de haberlo añadido al HTML.");
    }

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
        document.getElementById('salarioTotalQuincenal').value = '';
        document.getElementById('salarioDiario').value = '';
        document.getElementById('pagarIGSS').checked = false;
    });
});

// Función para inicializar el DataTable de empleados
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
            url: 'https://cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json' // Usar HTTPS para evitar problemas de CORS
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

        if (!sucursalSelectContrato || !sucursalFiltro) {
            console.error("Elementos 'sucursalContrato' o 'sucursalFiltro' no encontrados en el DOM.");
            return;
        }

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

// Función para cargar los parámetros de configuración desde Firestore
async function cargarParametrosConfiguracion() {
    try {
        // Cargar periodoPruebaDias
        const parametroDoc = await db.collection('parametros').doc('periodoPruebaDias').get();
        if (parametroDoc.exists) {
            periodoPruebaDias = parseInt(parametroDoc.data().valor) || 60;
        }

        // Cargar salarios mínimos
        const salariosDoc = await db.collection('parametros').doc('salariosMinimos').get();
        if (salariosDoc.exists) {
            salariosMinimos = salariosDoc.data();
        }

        // Cargar bonificaciones (si existen)
        const bonificacionDoc = await db.collection('parametros').doc('bonificaciones').get();
        if (bonificacionDoc.exists) {
            bonificaciones = bonificacionDoc.data();
        }

        // Cargar IGGS Descuento
        const iggsDoc = await db.collection('parametros').doc('igssDescuento').get();
        if (iggsDoc.exists) {
            iggsDescuento = parseFloat(iggsDoc.data().valor) || 0;
        }
    } catch (error) {
        console.error('Error al cargar parámetros de configuración:', error);
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
    const modalTitulo = document.getElementById('modalEmpleadoTitulo');
    const empleadoIdInput = document.getElementById('empleadoId');
    const formEmpleado = document.getElementById('formEmpleado');

    if (!modalTitulo || !empleadoIdInput || !formEmpleado) {
        console.error("Elementos necesarios para abrir el modal de agregar empleado no encontrados en el DOM.");
        return;
    }

    modalTitulo.textContent = 'Agregar Empleado';
    formEmpleado.reset();
    empleadoIdInput.value = '';
    document.getElementById('duracionContrato').readOnly = true;
    document.getElementById('duracionContrato').value = '';
    document.getElementById('fechaFinContrato').value = '';
    document.getElementById('fechaFinContrato').disabled = true;
    document.getElementById('lapsoContrato').value = '';
    document.getElementById('salarioTotalQuincenal').value = '';
    document.getElementById('salarioDiario').value = '';
    document.getElementById('pagarIGSS').checked = false;
    establecerSalarioMinimo(); // Establecer salario mínimo automáticamente si se selecciona una sucursal por defecto
    calcularSalarioDiario();
    calcularSalarioTotal();
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
    const salarioQuincenalInput = document.getElementById('salarioQuincenal').value;
    const salarioQuincenal = parseFloat(salarioQuincenalInput);
    const lugarFirmaContrato = document.getElementById('lugarFirmaContrato').value.trim();
    const fechaFirmaContrato = document.getElementById('fechaFirmaContrato').value;
    const pagarIGSS = document.getElementById('pagarIGSS').checked;
    const salarioTotalQuincenalInput = document.getElementById('salarioTotalQuincenal').value;
    const salarioTotalQuincenal = parseFloat(salarioTotalQuincenalInput);

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
        !salarioQuincenalInput || !lugarFirmaContrato || !fechaFirmaContrato ||
        !nombre || !email || !telefono1 || !DPI || !direccion || !fechaNacimiento) {
        Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
        return;
    }

    if (tipoContrato !== 'prueba' && (!fechaFinContrato || !duracionContrato)) {
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

    if (salarioQuincenal <= 0) {
        Swal.fire('Error', 'El salario quincenal debe ser un número positivo.', 'error');
        return;
    }

    if (tipoContrato !== 'prueba' && salarioTotalQuincenal <= 0) {
        Swal.fire('Error', 'El salario total quincenal debe ser un número positivo.', 'error');
        return;
    }

    // Validar que la fecha de inicio relación sea posterior o igual a la fecha de firma del contrato
    if (new Date(fechaInicioRelacion) < new Date(fechaFirmaContrato)) {
        Swal.fire('Error', 'La Fecha de Inicio de Relación debe ser posterior o igual a la Fecha de Firma de Contrato.', 'error');
        return;
    }

    // Validar que el salario no sea menor que el salario mínimo correspondiente
    if (salariosMinimos && (salariosMinimos.ce1 || salariosMinimos.ce2)) {
        let salarioMinimoAplicable = 0;
        // Determinar si es CE1 o CE2 basado en la sucursal
        const sucursalDoc = await db.collection('sucursales').doc(sucursalId).get();
        let tipoSucursal = 'CE1';
        if (sucursalDoc.exists && sucursalDoc.data().tipo) {
            tipoSucursal = sucursalDoc.data().tipo;
        }

        if (tipoSucursal === 'CE1' && salariosMinimos.ce1) {
            salarioMinimoAplicable = tipoContrato === 'prueba' ? salariosMinimos.ce1.salarioQuincenal : salariosMinimos.ce1.salarioTotalQuincenal;
        } else if (tipoSucursal === 'CE2' && salariosMinimos.ce2) {
            salarioMinimoAplicable = tipoContrato === 'prueba' ? salariosMinimos.ce2.salarioQuincenal : salariosMinimos.ce2.salarioTotalQuincenal;
        }

        if (tipoContrato === 'prueba') {
            // Para contratos de prueba, el salario mínimo aplicable es el salario quincenal
            if (salarioQuincenal < salarioMinimoAplicable) {
                Swal.fire('Error', `El salario quincenal no puede ser menor que el salario mínimo aplicable (Q${salarioMinimoAplicable.toFixed(2)}).`, 'error');
                return;
            }
        } else {
            // Para otros contratos, el salario total quincenal incluye bonificaciones
            if (salarioTotalQuincenal < salarioMinimoAplicable) {
                Swal.fire('Error', `El salario total quincenal no puede ser menor que el salario mínimo aplicable (Q${salarioMinimoAplicable.toFixed(2)}).`, 'error');
                return;
            }
        }
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
            salarioQuincenal: salarioQuincenal,
            salarioTotalQuincenal: salarioTotalQuincenal,
            salarioDiario: parseFloat(document.getElementById('salarioDiario').value) || 0,
            pagarIGSS: pagarIGSS,
            lugarFirmaContrato: lugarFirmaContrato,
            fechaFirmaContrato: firebase.firestore.Timestamp.fromDate(new Date(fechaFirmaContrato)),
            lapsoContrato: document.getElementById('lapsoContrato').value || null,
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
            document.getElementById('salarioQuincenal').value = empleado.salarioQuincenal || '';
            document.getElementById('salarioTotalQuincenal').value = empleado.salarioTotalQuincenal || '';
            document.getElementById('salarioDiario').value = empleado.salarioDiario || '';
            document.getElementById('pagarIGSS').checked = empleado.pagarIGSS || false;
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

            // Establecer salario mínimo según sucursal
            establecerSalarioMinimo();

            calcularSalarioDiario();
            calcularSalarioTotal();

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

            // Calcular IGSS si se paga
            const iggs = empleado.pagarIGSS ? iggsDescuento : 0;
            const salarioTotal = empleado.salarioTotalQuincenal;

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
                <p><strong>Salario Quincenal:</strong> Q${empleado.salarioQuincenal ? empleado.salarioQuincenal.toFixed(2) : 'N/A'}</p>
                <p><strong>Bonificación Decreto:</strong> Q${bonificaciones && bonificaciones.decreto ? bonificaciones.decreto.toFixed(2) : 'N/A'}</p>
                <p><strong>Descuento IGSS:</strong> Q${iggs.toFixed(2)}</p>
                <p><strong>Salario Total Quincenal:</strong> Q${salarioTotal ? salarioTotal.toFixed(2) : 'N/A'}</p>
                <p><strong>Lugar Firma Contrato:</strong> ${empleado.lugarFirmaContrato || 'N/A'}</p>
                <p><strong>Fecha Firma Contrato:</strong> ${fechaFirmaContrato}</p>
            `;

            const detallesBody = document.getElementById('detallesEmpleadoBody');
            if (detallesBody) {
                detallesBody.innerHTML = detallesHTML;
            } else {
                console.error("Elemento con ID 'detallesEmpleadoBody' no encontrado en el DOM.");
            }

            const modalDetallesTitulo = document.getElementById('modalDetallesTitulo');
            if (modalDetallesTitulo) {
                modalDetallesTitulo.textContent = `Detalles de ${empleado.nombre || 'Empleado'}`;
            } else {
                console.error("Elemento con ID 'modalDetallesTitulo' no encontrado en el DOM.");
            }

            $('#modalDetallesEmpleado').modal('show');

            // Guardar los detalles para exportar (si es necesario)
            empleadoDetallesParaExportar = {
                nombre: empleado.nombre || 'N/A',
                detallesHTML: detallesHTML
            };

        } else {
            Swal.fire('Error', 'El empleado no existe.', 'error');
        }
    } catch (error) {
        console.error('Error al obtener empleado:', error);
        Swal.fire('Error', 'Ocurrió un error al obtener los datos del empleado.', 'error');
    }
}

// Función para cerrar el modal de detalles
function cerrarModalDetalles() {
    $('#modalDetallesEmpleado').modal('hide');
}

// Función para exportar los detalles del empleado a PDF (opcional)
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

// Función para calcular el salario diario automáticamente
function calcularSalarioDiario() {
    const salarioQuincenal = parseFloat(document.getElementById('salarioQuincenal').value) || 0;
    const salarioDiario = (salarioQuincenal * 2 * 12) / 365;
    const salarioDiarioElement = document.getElementById('salarioDiario');
    if (salarioDiarioElement) {
        salarioDiarioElement.value = salarioDiario.toFixed(2);
    } else {
        console.error("Elemento con ID 'salarioDiario' no encontrado en el DOM.");
    }
}

// Función para calcular el salario total quincenal automáticamente
function calcularSalarioTotal() {
    const tipoContrato = document.getElementById('tipoContrato').value;
    const salarioQuincenal = parseFloat(document.getElementById('salarioQuincenal').value) || 0;
    const bonificacionDecreto = bonificaciones && bonificaciones.decreto ? parseFloat(bonificaciones.decreto) : 0;
    const pagarIGSS = document.getElementById('pagarIGSS').checked;
    const descuentoIGSS = pagarIGSS ? iggsDescuento : 0;

    let salarioTotalQuincenal = 0;

    if (tipoContrato === 'prueba') {
        // Para contratos de prueba, el salario total es solo el salario quincenal sin bonificaciones
        salarioTotalQuincenal = salarioQuincenal - descuentoIGSS;
    } else {
        // Para otros contratos, el salario total incluye bonificaciones
        salarioTotalQuincenal = salarioQuincenal + bonificacionDecreto - descuentoIGSS;
    }

    const salarioTotalQuincenalElement = document.getElementById('salarioTotalQuincenal');
    if (salarioTotalQuincenalElement) {
        salarioTotalQuincenalElement.value = salarioTotalQuincenal.toFixed(2);
    } else {
        console.error("Elemento con ID 'salarioTotalQuincenal' no encontrado en el DOM.");
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
    } else {
        duracionContrato.readOnly = false;
        fechaFinContrato.disabled = false;
        duracionContrato.value = '';
        lapsoContrato.value = '';
        fechaFinContrato.value = '';
    }

    calcularSalarioTotal();
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

// Función para establecer el salario mínimo automáticamente según la sucursal seleccionada
async function establecerSalarioMinimo() {
    const sucursalId = document.getElementById('sucursalContrato').value;
    const tipoContrato = document.getElementById('tipoContrato').value;

    if (!sucursalId) {
        // Si no se ha seleccionado una sucursal, no hacer nada
        return;
    }

    try {
        const sucursalDoc = await db.collection('sucursales').doc(sucursalId).get();
        if (!sucursalDoc.exists) {
            console.error('La sucursal seleccionada no existe.');
            return;
        }

        const sucursal = sucursalDoc.data();
        const tipoSucursal = sucursal.tipo || 'CE1'; // Por defecto CE1 si no se especifica

        let salarioMinimoQuincenal = 0;
        let salarioMinimoTotalQuincenal = 0;

        if (tipoSucursal === 'CE1' && salariosMinimos.ce1) {
            salarioMinimoQuincenal = salariosMinimos.ce1.salarioQuincenal;
            salarioMinimoTotalQuincenal = salariosMinimos.ce1.salarioTotalQuincenal;
        } else if (tipoSucursal === 'CE2' && salariosMinimos.ce2) {
            salarioMinimoQuincenal = salariosMinimos.ce2.salarioQuincenal;
            salarioMinimoTotalQuincenal = salariosMinimos.ce2.salarioTotalQuincenal;
        } else {
            console.warn('No se encontraron salarios mínimos para el tipo de sucursal seleccionado.');
            return;
        }

        const salarioQuincenalElement = document.getElementById('salarioQuincenal');
        const salarioTotalQuincenalElement = document.getElementById('salarioTotalQuincenal');

        if (salarioQuincenalElement && salarioTotalQuincenalElement) {
            // Establecer el salario quincenal al mínimo automáticamente
            salarioQuincenalElement.value = salarioMinimoQuincenal.toFixed(2);
            calcularSalarioDiario();
            calcularSalarioTotal();
        } else {
            console.error("Elementos 'salarioQuincenal' o 'salarioTotalQuincenal' no encontrados en el DOM.");
        }

    } catch (error) {
        console.error('Error al establecer salario mínimo:', error);
    }
}
