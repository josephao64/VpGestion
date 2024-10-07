// RecursosHumanos.js

// Inicializar Firestore (asegúrate de que FirebaseConfig.js ya está cargado)
var db = firebase.firestore();

// Variables para almacenar los parámetros de configuración
var periodoPruebaDias = 60; // Valor por defecto para contrato de prueba (60 días)
var salariosMinimos = {
    ce1: {},
    ce2: {}
};
var extraEncargado = 0; // Valor predeterminado para extra encargado

// Variable para almacenar detalles del empleado para exportar (si es necesario)
var empleadoDetallesParaExportar = {};

// Inicializar DataTable para Empleados
var tablaEmpleados;

// Variable para almacenar el ID del empleado seleccionado
var empleadoSeleccionadoId = null;

// Evento que se ejecuta cuando el DOM está completamente cargado
document.addEventListener("DOMContentLoaded", function() {
    inicializarDataTableEmpleados();
    cargarParametrosConfiguracion(); // Cargar parámetros al iniciar
    cargarSucursalesSelectOptions(); // Cargar sucursales en el select
    cargarEmpleados(); // Cargar empleados en la tabla

    // Eventos para los formularios
    const formEmpleado = document.getElementById('formEmpleado');
    if (formEmpleado) {
        formEmpleado.addEventListener('submit', function(event) {
            event.preventDefault();
            guardarEmpleado();
        });
    }

    // Eventos para cambios en tipo de contrato y sucursal
    const tipoContratoSelect = document.getElementById('tipoContrato');
    if (tipoContratoSelect) {
        tipoContratoSelect.addEventListener('change', manejarTipoContrato);
    }

    const puestoContratoSelect = document.getElementById('puestoContrato');
    if (puestoContratoSelect) {
        puestoContratoSelect.addEventListener('change', manejarPuestoContrato);
    }

    const sucursalContratoSelect = document.getElementById('sucursalContrato');
    if (sucursalContratoSelect) {
        sucursalContratoSelect.addEventListener('change', establecerSalarioMinimo);
    }

    const salarioQuincenalInput = document.getElementById('salarioQuincenal');
    if (salarioQuincenalInput) {
        salarioQuincenalInput.addEventListener('input', function() {
            calcularSalarioDiario();
            calcularSalarioTotal();
        });
    }

    const extraEncargadoInput = document.getElementById('extraEncargado');
    if (extraEncargadoInput) {
        extraEncargadoInput.addEventListener('input', calcularSalarioTotal);
    }

    const pagarIGSSCheckbox = document.getElementById('pagarIGSS');
    if (pagarIGSSCheckbox) {
        pagarIGSSCheckbox.addEventListener('change', calcularSalarioTotal);
    }

    // Eventos para duracionContrato y fechaFinContrato
    const duracionContratoInput = document.getElementById('duracionContrato');
    if (duracionContratoInput) {
        duracionContratoInput.addEventListener('input', manejarDuracionContrato);
    }

    const fechaFinContratoInput = document.getElementById('fechaFinContrato');
    if (fechaFinContratoInput) {
        fechaFinContratoInput.addEventListener('change', manejarFechaFinContrato);
    }

    const fechaInicioRelacionInput = document.getElementById('fechaInicioRelacion');
    if (fechaInicioRelacionInput) {
        fechaInicioRelacionInput.addEventListener('change', function() {
            manejarTipoContrato();
            manejarDuracionContrato(); // Recalcular fechas si cambia la fecha de inicio
        });
    }

    // Eventos para los filtros
    document.getElementById('sucursalFiltro').addEventListener('change', cargarEmpleados);
    document.getElementById('estadoFiltro').addEventListener('change', cargarEmpleados);
    document.getElementById('tipoContratoFiltro').addEventListener('change', cargarEmpleados);

    // Deshabilitar botones de acción al inicio
    actualizarEstadoBotonesAccion(false);
});

// Función para inicializar DataTable para Empleados
function inicializarDataTableEmpleados() {
    tablaEmpleados = $('#empleadosTable').DataTable({
        columns: [
            { data: 'nombre' },
            { data: 'DPI' },
            { data: 'puestoContrato' },
            { data: 'sucursal' },
            { data: 'telefono1' },
            { data: 'fechaInicioRelacion' }
            // La columna de acciones ha sido eliminada
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
        },
        responsive: true,
        select: 'single' // Permitir selección de una sola fila
    });

    // Evento para manejar la selección de filas
    $('#empleadosTable tbody').on('click', 'tr', function() {
        if ($(this).hasClass('selected')) {
            $(this).removeClass('selected');
            empleadoSeleccionadoId = null;
            actualizarEstadoBotonesAccion(false);
        } else {
            tablaEmpleados.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            const data = tablaEmpleados.row(this).data();
            empleadoSeleccionadoId = data.id;
            actualizarEstadoBotonesAccion(true);
        }
    });
}

// Función para actualizar el estado de los botones de acción
function actualizarEstadoBotonesAccion(habilitar) {
    document.getElementById('btnVerDetalles').disabled = !habilitar;
    document.getElementById('btnEditarEmpleado').disabled = !habilitar;
    document.getElementById('btnEliminarEmpleado').disabled = !habilitar;
}

// Función para cargar parámetros de configuración desde Firestore
async function cargarParametrosConfiguracion() {
    try {
        // Cargar periodo de prueba
        const periodoDoc = await db.collection('parametros').doc('periodoPruebaDias').get();
        if (periodoDoc.exists) {
            const periodoData = periodoDoc.data();
            periodoPruebaDias = parseInt(periodoData.valor) || 60;
        } else {
            console.warn('No se encontró el documento "periodoPruebaDias" en Firestore.');
        }

        // Cargar salarios mínimos
        const salariosDoc = await db.collection('parametros').doc('salariosMinimos').get();
        if (salariosDoc.exists) {
            const salariosData = salariosDoc.data();
            salariosMinimos.ce1 = salariosData.ce1 || {};
            salariosMinimos.ce2 = salariosData.ce2 || {};
        } else {
            console.warn('No se encontró el documento "salariosMinimos" en Firestore.');
        }

        // Cargar extra encargado
        const extraEncargadoDoc = await db.collection('parametros').doc('extraEncargado').get();
        if (extraEncargadoDoc.exists) {
            const extraData = extraEncargadoDoc.data();
            extraEncargado = parseFloat(extraData.valor) || 0;
        } else {
            console.warn('No se encontró el documento "extraEncargado" en Firestore.');
        }
    } catch (error) {
        console.error('Error al cargar parámetros de configuración:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar la configuración.', 'error');
    }
}

// Función para cargar sucursales en el select de contrato y en el filtro
async function cargarSucursalesSelectOptions() {
    try {
        const sucursalesSnapshot = await db.collection('sucursales').where('status', '==', 'activo').orderBy('name').get();
        const sucursalSelect = document.getElementById('sucursalContrato');
        const sucursalFiltro = document.getElementById('sucursalFiltro');

        if (sucursalSelect) {
            sucursalSelect.innerHTML = '<option value="">Selecciona una sucursal</option>';
            sucursalesSnapshot.forEach(function(doc) {
                const sucursal = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = sucursal.name;
                option.dataset.tipoSucursal = sucursal.tipoSucursal || 'CE1';
                sucursalSelect.appendChild(option);
            });
        } else {
            console.error("Elemento con ID 'sucursalContrato' no encontrado en el DOM.");
        }

        // Cargar sucursales en el filtro
        if (sucursalFiltro) {
            sucursalFiltro.innerHTML = '<option value="">Todas las sucursales</option>';
            sucursalesSnapshot.forEach(function(doc) {
                const sucursal = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = sucursal.name;
                sucursalFiltro.appendChild(option);
            });
        } else {
            console.error("Elemento con ID 'sucursalFiltro' no encontrado en el DOM.");
        }
    } catch (error) {
        console.error('Error al cargar sucursales:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las sucursales.', 'error');
    }
}

// Función para cargar empleados desde Firestore y llenar la tabla
async function cargarEmpleados() {
    try {
        const sucursalFiltro = document.getElementById('sucursalFiltro').value;
        const estadoFiltro = document.getElementById('estadoFiltro').value;
        const tipoContratoFiltro = document.getElementById('tipoContratoFiltro').value;

        let empleadosRef = db.collection('empleados');

        // Aplicar filtros
        if (sucursalFiltro) {
            empleadosRef = empleadosRef.where('sucursalId', '==', sucursalFiltro);
        }
        if (estadoFiltro) {
            empleadosRef = empleadosRef.where('estado', '==', estadoFiltro);
        }
        if (tipoContratoFiltro) {
            empleadosRef = empleadosRef.where('tipoContrato', '==', tipoContratoFiltro);
        }

        empleadosRef = empleadosRef.orderBy('nombre');

        const empleadosSnapshot = await empleadosRef.get();
        const empleadosData = [];

        // Obtener nombres de sucursales para mostrar en la tabla
        const sucursalesSnapshot = await db.collection('sucursales').get();
        const sucursalesMap = {};
        sucursalesSnapshot.forEach(doc => {
            sucursalesMap[doc.id] = doc.data().name;
        });

        empleadosSnapshot.forEach(doc => {
            const empleado = doc.data();
            empleadosData.push({
                id: doc.id,
                nombre: empleado.nombre || 'N/A',
                DPI: empleado.DPI || 'N/A',
                puestoContrato: empleado.puestoContrato || 'N/A',
                sucursal: sucursalesMap[empleado.sucursalId] || 'N/A',
                telefono1: empleado.telefono1 || 'N/A',
                fechaInicioRelacion: empleado.fechaInicioRelacion ? moment(empleado.fechaInicioRelacion.toDate()).format('DD/MM/YYYY') : 'N/A'
            });
        });

        tablaEmpleados.clear();
        tablaEmpleados.rows.add(empleadosData).draw();

        // Deshabilitar botones de acción al recargar la tabla
        empleadoSeleccionadoId = null;
        actualizarEstadoBotonesAccion(false);

    } catch (error) {
        console.error('Error al cargar empleados:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar los empleados.', 'error');
    }
}

// Función para abrir el modal de agregar empleado
function abrirModalAgregarEmpleado() {
    // Resetear el formulario
    document.getElementById('formEmpleado').reset();
    document.getElementById('empleadoId').value = '';
    document.getElementById('duracionContrato').value = '';
    document.getElementById('lapsoContrato').value = '';
    document.getElementById('fechaFinContrato').value = '';
    document.getElementById('salarioTotalQuincenal').value = '';
    document.getElementById('salarioDiario').value = '';
    document.getElementById('pagarIGSS').checked = false;
    document.getElementById('bonificacionDecreto').value = '';
    document.getElementById('descuentoIGSS').value = '';
    document.getElementById('extraEncargado').value = extraEncargado.toFixed(2);
    document.getElementById('extraEncargado').readOnly = true;
    document.getElementById('extraEncargado').style.display = 'none';
    document.querySelector("label[for='extraEncargado']").style.display = 'none';

    // Habilitar todos los campos
    document.getElementById('fechaFinContrato').disabled = true;
    document.getElementById('duracionContrato').disabled = true;
    document.getElementById('lapsoContrato').readOnly = true;

    // Ocultar campos según el tipo de contrato y puesto
    manejarTipoContrato();
    manejarPuestoContrato();

    // Abrir el modal (usando Bootstrap)
    $('#modalEmpleado').modal('show');
}

// Función para cerrar el modal de empleado
function cerrarModalEmpleado() {
    $('#modalEmpleado').modal('hide');
}

// Función para manejar el cambio en el tipo de contrato
function manejarTipoContrato() {
    const tipoContrato = document.getElementById('tipoContrato').value;
    const fechaInicioRelacion = document.getElementById('fechaInicioRelacion').value;
    const fechaFinContratoInput = document.getElementById('fechaFinContrato');
    const duracionContratoInput = document.getElementById('duracionContrato');
    const lapsoContratoInput = document.getElementById('lapsoContrato');
    const fechaFinContratoContainer = document.getElementById('fechaFinContratoContainer');
    const duracionContratoContainer = document.getElementById('duracionContratoContainer');
    const bonificacionDecretoInput = document.getElementById('bonificacionDecreto');
    const pagarIGSSCheckbox = document.getElementById('pagarIGSS');
    const descuentoIGSSInput = document.getElementById('descuentoIGSS');

    if (tipoContrato === 'prueba') {
        // Contrato de prueba
        duracionContratoInput.disabled = true;
        fechaFinContratoInput.disabled = true;
        pagarIGSSCheckbox.checked = false;
        pagarIGSSCheckbox.disabled = true;
        bonificacionDecretoInput.value = 0;
        bonificacionDecretoInput.disabled = true;
        descuentoIGSSInput.disabled = true;

        if (fechaInicioRelacion) {
            const fechaInicio = new Date(fechaInicioRelacion);
            const fechaFin = new Date(fechaInicio);
            fechaFin.setDate(fechaFin.getDate() + periodoPruebaDias);
            fechaFinContratoInput.value = moment(fechaFin).format('YYYY-MM-DD');
            duracionContratoInput.value = periodoPruebaDias;
            lapsoContratoInput.value = convertirDiasEnLetras(periodoPruebaDias);
        }
        fechaFinContratoContainer.style.display = 'block';
        duracionContratoContainer.style.display = 'block';

        calcularSalarioTotal();

    } else if (tipoContrato === 'temporal') {
        // Contrato temporal
        duracionContratoInput.disabled = false;
        fechaFinContratoInput.disabled = false;
        pagarIGSSCheckbox.disabled = false;
        bonificacionDecretoInput.disabled = false;
        descuentoIGSSInput.disabled = false;
        fechaFinContratoContainer.style.display = 'block';
        duracionContratoContainer.style.display = 'block';

    } else if (tipoContrato === 'indefinido') {
        // Contrato indefinido
        duracionContratoInput.disabled = true;
        fechaFinContratoInput.disabled = true;
        duracionContratoInput.value = '';
        fechaFinContratoInput.value = '';
        lapsoContratoInput.value = 'Indefinido';
        fechaFinContratoContainer.style.display = 'none';
        duracionContratoContainer.style.display = 'none';
        pagarIGSSCheckbox.disabled = false;
        bonificacionDecretoInput.disabled = false;
        descuentoIGSSInput.disabled = false;

    } else {
        // Si no se selecciona ningún tipo, resetear campos
        duracionContratoInput.disabled = true;
        fechaFinContratoInput.disabled = true;
        duracionContratoInput.value = '';
        fechaFinContratoInput.value = '';
        lapsoContratoInput.value = '';
        fechaFinContratoContainer.style.display = 'block';
        duracionContratoContainer.style.display = 'block';
        pagarIGSSCheckbox.disabled = false;
        bonificacionDecretoInput.disabled = false;
        descuentoIGSSInput.disabled = false;
    }
}

// Función para manejar el cambio en el puesto
function manejarPuestoContrato() {
    const puestoContrato = document.getElementById('puestoContrato').value;
    const extraEncargadoInput = document.getElementById('extraEncargado');
    const extraEncargadoLabel = document.querySelector("label[for='extraEncargado']");

    if (puestoContrato === 'Encargado') {
        extraEncargadoInput.style.display = 'block';
        extraEncargadoLabel.style.display = 'block';
        extraEncargadoInput.readOnly = false;
        extraEncargadoInput.value = extraEncargado.toFixed(2);
    } else {
        extraEncargadoInput.style.display = 'none';
        extraEncargadoLabel.style.display = 'none';
        extraEncargadoInput.readOnly = true;
        extraEncargadoInput.value = '0.00';
    }
    calcularSalarioTotal();
}

// Función para manejar el ingreso de duración del contrato
function manejarDuracionContrato() {
    const duracionContratoInput = document.getElementById('duracionContrato');
    const fechaInicioRelacion = document.getElementById('fechaInicioRelacion').value;
    const fechaFinContratoInput = document.getElementById('fechaFinContrato');
    const lapsoContratoInput = document.getElementById('lapsoContrato');

    const duracionDias = parseInt(duracionContratoInput.value);
    if (fechaInicioRelacion && duracionDias > 0) {
        const fechaInicio = new Date(fechaInicioRelacion);
        const fechaFin = new Date(fechaInicio);
        fechaFin.setDate(fechaFin.getDate() + duracionDias);
        fechaFinContratoInput.value = moment(fechaFin).format('YYYY-MM-DD');
        lapsoContratoInput.value = convertirDiasEnLetras(duracionDias);
    }
}

// Función para manejar el ingreso de fecha fin de contrato
function manejarFechaFinContrato() {
    const fechaInicioRelacion = document.getElementById('fechaInicioRelacion').value;
    const fechaFinContratoInput = document.getElementById('fechaFinContrato').value;
    const duracionContratoInput = document.getElementById('duracionContrato');
    const lapsoContratoInput = document.getElementById('lapsoContrato');

    if (fechaInicioRelacion && fechaFinContratoInput) {
        const fechaInicio = new Date(fechaInicioRelacion);
        const fechaFin = new Date(fechaFinContratoInput);
        const duracionMs = fechaFin - fechaInicio;
        const duracionDias = Math.ceil(duracionMs / (1000 * 60 * 60 * 24));
        duracionContratoInput.value = duracionDias;
        lapsoContratoInput.value = convertirDiasEnLetras(duracionDias);
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

// Función para establecer el salario mínimo automáticamente según la sucursal seleccionada
function establecerSalarioMinimo() {
    const sucursalSelect = document.getElementById('sucursalContrato');
    const sucursalId = sucursalSelect.value;
    const selectedOption = sucursalSelect.options[sucursalSelect.selectedIndex];
    const tipoSucursal = selectedOption ? selectedOption.dataset.tipoSucursal : 'CE1';

    let salarioMinimoData;

    if (tipoSucursal === 'CE1') {
        salarioMinimoData = salariosMinimos.ce1;
    } else if (tipoSucursal === 'CE2') {
        salarioMinimoData = salariosMinimos.ce2;
    } else {
        salarioMinimoData = salariosMinimos.ce1;
    }

    document.getElementById('salarioQuincenal').value = salarioMinimoData.salarioQuincenal || '';
    document.getElementById('salarioDiario').value = salarioMinimoData.salarioDiario || '';
    document.getElementById('bonificacionDecreto').value = salarioMinimoData.bonificacionDecreto || '';
    document.getElementById('descuentoIGSS').value = salarioMinimoData.descuentoIGSS || '';
    calcularSalarioTotal();
}

// Función para calcular el salario diario automáticamente
function calcularSalarioDiario() {
    const salarioQuincenal = parseFloat(document.getElementById('salarioQuincenal').value) || 0;
    const salarioDiario = (salarioQuincenal * 2 * 12) / 365;
    document.getElementById('salarioDiario').value = salarioDiario.toFixed(2);
}

// Función para calcular el salario total quincenal automáticamente
function calcularSalarioTotal() {
    const salarioQuincenal = parseFloat(document.getElementById('salarioQuincenal').value) || 0;
    let bonificacionDecreto = parseFloat(document.getElementById('bonificacionDecreto').value) || 0;
    const descuentoIGSS = parseFloat(document.getElementById('descuentoIGSS').value) || 0;
    const pagarIGSS = document.getElementById('pagarIGSS').checked;
    const tipoContrato = document.getElementById('tipoContrato').value;
    const puestoContrato = document.getElementById('puestoContrato').value;
    const extraEncargadoValor = parseFloat(document.getElementById('extraEncargado').value) || 0;

    if (tipoContrato === 'prueba') {
        bonificacionDecreto = 0;
        document.getElementById('bonificacionDecreto').value = 0;
    }

    let salarioTotalQuincenal = salarioQuincenal + bonificacionDecreto;

    if (puestoContrato === 'Encargado') {
        salarioTotalQuincenal += extraEncargadoValor;
    }

    if (pagarIGSS) {
        salarioTotalQuincenal -= descuentoIGSS;
    }

    document.getElementById('salarioTotalQuincenal').value = salarioTotalQuincenal.toFixed(2);
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
    const estado = document.getElementById('estadoEmpleado').value;

    const fechaInicioRelacion = document.getElementById('fechaInicioRelacion').value;
    const tipoContrato = document.getElementById('tipoContrato').value;
    const duracionContrato = document.getElementById('duracionContrato').value;
    const fechaFinContrato = document.getElementById('fechaFinContrato').value;
    const lapsoContrato = document.getElementById('lapsoContrato').value;
    const puestoContrato = document.getElementById('puestoContrato').value;
    const sucursalId = document.getElementById('sucursalContrato').value;
    const tipoJornada = document.getElementById('tipoJornada').value;
    const salarioQuincenal = parseFloat(document.getElementById('salarioQuincenal').value) || 0;
    const salarioTotalQuincenal = parseFloat(document.getElementById('salarioTotalQuincenal').value) || 0;
    const salarioDiario = parseFloat(document.getElementById('salarioDiario').value) || 0;
    const bonificacionDecreto = parseFloat(document.getElementById('bonificacionDecreto').value) || 0;
    const descuentoIGSS = parseFloat(document.getElementById('descuentoIGSS').value) || 0;
    const extraEncargadoValor = parseFloat(document.getElementById('extraEncargado').value) || 0;
    const pagarIGSS = document.getElementById('pagarIGSS').checked;
    const lugarFirmaContrato = document.getElementById('lugarFirmaContrato').value.trim();
    const fechaFirmaContrato = document.getElementById('fechaFirmaContrato').value;

    // Validaciones
    if (!nombre || !email || !telefono1 || !DPI || !direccion || !fechaNacimiento || !estado ||
        !fechaInicioRelacion || !tipoContrato || !puestoContrato || !sucursalId ||
        !tipoJornada || !salarioQuincenal || !lugarFirmaContrato || !fechaFirmaContrato) {
        Swal.fire('Error', 'Todos los campos obligatorios deben estar completos.', 'error');
        return;
    }

    // Validaciones de formato
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        Swal.fire('Error', 'Ingresa un correo electrónico válido.', 'error');
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

    if (!/^\d{13}$/.test(DPI)) {
        Swal.fire('Error', 'El DPI debe tener exactamente 13 dígitos.', 'error');
        return;
    }

    // Obtener el tipo de sucursal para verificar el salario mínimo
    try {
        const sucursalDoc = await db.collection('sucursales').doc(sucursalId).get();
        if (!sucursalDoc.exists) {
            Swal.fire('Error', 'La sucursal seleccionada no existe.', 'error');
            return;
        }

        const sucursal = sucursalDoc.data();
        const tipoSucursal = sucursal.tipoSucursal || 'CE1';

        // Obtener el salario mínimo según la sucursal
        let salarioMinimoQuincenal = 0;
        if (tipoSucursal === 'CE1' && salariosMinimos.ce1.salarioQuincenal) {
            salarioMinimoQuincenal = salariosMinimos.ce1.salarioQuincenal;
        } else if (tipoSucursal === 'CE2' && salariosMinimos.ce2.salarioQuincenal) {
            salarioMinimoQuincenal = salariosMinimos.ce2.salarioQuincenal;
        } else {
            Swal.fire('Error', 'No se encontró el salario mínimo para la sucursal seleccionada.', 'error');
            return;
        }

        if (salarioQuincenal < salarioMinimoQuincenal) {
            Swal.fire('Error', `El salario quincenal debe ser al menos Q${salarioMinimoQuincenal.toFixed(2)} para la sucursal seleccionada.`, 'error');
            return;
        }

    } catch (error) {
        console.error('Error al verificar salario mínimo:', error);
        Swal.fire('Error', 'Ocurrió un error al verificar el salario mínimo.', 'error');
        return;
    }

    // Preparar los datos del empleado
    const empleadoData = {
        nombre: nombre,
        email: email,
        telefono1: telefono1,
        telefono2: telefono2 || '',
        DPI: DPI,
        direccion: direccion,
        fechaNacimiento: fechaNacimiento ? firebase.firestore.Timestamp.fromDate(new Date(fechaNacimiento)) : null,
        estado: estado,
        fechaInicioRelacion: fechaInicioRelacion ? firebase.firestore.Timestamp.fromDate(new Date(fechaInicioRelacion)) : null,
        tipoContrato: tipoContrato,
        duracionContrato: duracionContrato || '',
        lapsoContrato: lapsoContrato || '',
        fechaFinContrato: fechaFinContrato ? firebase.firestore.Timestamp.fromDate(new Date(fechaFinContrato)) : null,
        puestoContrato: puestoContrato,
        sucursalId: sucursalId,
        tipoJornada: tipoJornada,
        salarioQuincenal: salarioQuincenal,
        salarioTotalQuincenal: salarioTotalQuincenal,
        salarioDiario: salarioDiario,
        bonificacionDecreto: bonificacionDecreto,
        descuentoIGSS: descuentoIGSS,
        extraEncargado: extraEncargadoValor,
        pagarIGSS: pagarIGSS,
        lugarFirmaContrato: lugarFirmaContrato,
        fechaFirmaContrato: fechaFirmaContrato ? firebase.firestore.Timestamp.fromDate(new Date(fechaFirmaContrato)) : null,
        creationDate: firebase.firestore.FieldValue.serverTimestamp(),
        lastUpdateDate: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        if (empleadoId) {
            // Actualizar empleado existente
            await db.collection('empleados').doc(empleadoId).update(empleadoData);
            Swal.fire('Éxito', 'Empleado actualizado correctamente.', 'success');
        } else {
            // Agregar nuevo empleado
            await db.collection('empleados').add(empleadoData);
            Swal.fire('Éxito', 'Empleado agregado correctamente.', 'success');
        }

        // Cerrar el modal y recargar la tabla de empleados
        cerrarModalEmpleado();
        cargarEmpleados();

    } catch (error) {
        console.error('Error al guardar empleado:', error);
        Swal.fire('Error', 'Ocurrió un error al guardar el empleado.', 'error');
    }
}

// Función para editar un empleado
async function editarEmpleado() {
    if (!empleadoSeleccionadoId) {
        Swal.fire('Atención', 'Por favor, selecciona un empleado de la tabla.', 'warning');
        return;
    }
    try {
        const empleadoDoc = await db.collection('empleados').doc(empleadoSeleccionadoId).get();
        if (empleadoDoc.exists) {
            const empleado = empleadoDoc.data();

            // Verificar que todos los elementos existen antes de asignarles valores
            const campos = [
                'empleadoId', 'nombreEmpleado', 'emailEmpleado', 'telefono1Empleado', 'telefono2Empleado',
                'dpiEmpleado', 'direccionEmpleado', 'fechaNacimientoEmpleado', 'estadoEmpleado',
                'fechaInicioRelacion', 'tipoContrato', 'fechaFinContrato', 'duracionContrato', 'lapsoContrato',
                'puestoContrato', 'sucursalContrato', 'tipoJornada', 'salarioQuincenal', 'salarioTotalQuincenal',
                'salarioDiario', 'bonificacionDecreto', 'descuentoIGSS', 'pagarIGSS', 'lugarFirmaContrato', 'fechaFirmaContrato', 'extraEncargado'
            ];

            for (const campo of campos) {
                if (!document.getElementById(campo)) {
                    console.error(`Elemento con ID '${campo}' no encontrado en el DOM.`);
                    Swal.fire('Error', `No se encontró el elemento '${campo}' en el formulario.`, 'error');
                    return;
                }
            }

            // Asignar valores a los campos
            document.getElementById('empleadoId').value = empleadoSeleccionadoId;
            document.getElementById('nombreEmpleado').value = empleado.nombre || '';
            document.getElementById('emailEmpleado').value = empleado.email || '';
            document.getElementById('telefono1Empleado').value = empleado.telefono1 || '';
            document.getElementById('telefono2Empleado').value = empleado.telefono2 || '';
            document.getElementById('dpiEmpleado').value = empleado.DPI || '';
            document.getElementById('direccionEmpleado').value = empleado.direccion || '';
            document.getElementById('fechaNacimientoEmpleado').value = empleado.fechaNacimiento ? moment(empleado.fechaNacimiento.toDate()).format('YYYY-MM-DD') : '';
            document.getElementById('estadoEmpleado').value = empleado.estado || 'activo';

            document.getElementById('fechaInicioRelacion').value = empleado.fechaInicioRelacion ? moment(empleado.fechaInicioRelacion.toDate()).format('YYYY-MM-DD') : '';
            document.getElementById('tipoContrato').value = empleado.tipoContrato || '';
            manejarTipoContrato(); // Actualizar la interfaz según el tipo de contrato
            document.getElementById('fechaFinContrato').value = empleado.fechaFinContrato ? moment(empleado.fechaFinContrato.toDate()).format('YYYY-MM-DD') : '';
            document.getElementById('duracionContrato').value = empleado.duracionContrato || '';
            document.getElementById('lapsoContrato').value = empleado.lapsoContrato || '';
            document.getElementById('puestoContrato').value = empleado.puestoContrato || '';
            document.getElementById('sucursalContrato').value = empleado.sucursalId || '';
            establecerSalarioMinimo(); // Ajustar salario mínimo según sucursal
            document.getElementById('tipoJornada').value = empleado.tipoJornada || '';
            document.getElementById('salarioQuincenal').value = empleado.salarioQuincenal || '';
            document.getElementById('salarioTotalQuincenal').value = empleado.salarioTotalQuincenal || '';
            document.getElementById('salarioDiario').value = empleado.salarioDiario || '';
            document.getElementById('bonificacionDecreto').value = empleado.bonificacionDecreto || '';
            document.getElementById('descuentoIGSS').value = empleado.descuentoIGSS || '';
            document.getElementById('pagarIGSS').checked = empleado.pagarIGSS || false;
            document.getElementById('lugarFirmaContrato').value = empleado.lugarFirmaContrato || '';
            document.getElementById('fechaFirmaContrato').value = empleado.fechaFirmaContrato ? moment(empleado.fechaFirmaContrato.toDate()).format('YYYY-MM-DD') : '';
            document.getElementById('extraEncargado').value = empleado.extraEncargado || extraEncargado.toFixed(2);
            manejarPuestoContrato(); // Actualizar la interfaz según el puesto

            calcularSalarioDiario();
            calcularSalarioTotal();

            // Abrir el modal
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
function eliminarEmpleado() {
    if (!empleadoSeleccionadoId) {
        Swal.fire('Atención', 'Por favor, selecciona un empleado de la tabla.', 'warning');
        return;
    }
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
                await db.collection('empleados').doc(empleadoSeleccionadoId).delete();
                cargarEmpleados();
                Swal.fire('Eliminado', 'El empleado ha sido eliminado.', 'success');
                empleadoSeleccionadoId = null;
                actualizarEstadoBotonesAccion(false);
            } catch (error) {
                console.error('Error al eliminar empleado:', error);
                Swal.fire('Error', 'Ocurrió un error al eliminar el empleado.', 'error');
            }
        }
    });
}

// Función para ver detalles del empleado
async function verDetallesEmpleado() {
    if (!empleadoSeleccionadoId) {
        Swal.fire('Atención', 'Por favor, selecciona un empleado de la tabla.', 'warning');
        return;
    }
    try {
        const empleadoDoc = await db.collection('empleados').doc(empleadoSeleccionadoId).get();
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
                <p><strong>Lapso del Contrato:</strong> ${empleado.lapsoContrato || 'N/A'}</p>
                <p><strong>Puesto:</strong> ${empleado.puestoContrato || 'N/A'}</p>
                <p><strong>Sucursal:</strong> ${sucursalName}</p>
                <p><strong>Tipo de Jornada:</strong> ${empleado.tipoJornada || 'N/A'}</p>
                <p><strong>Salario Quincenal:</strong> Q${empleado.salarioQuincenal ? empleado.salarioQuincenal.toFixed(2) : 'N/A'}</p>
                <p><strong>Bonificación Decreto:</strong> Q${empleado.bonificacionDecreto ? empleado.bonificacionDecreto.toFixed(2) : 'N/A'}</p>
                <p><strong>Descuento IGSS:</strong> Q${empleado.descuentoIGSS ? empleado.descuentoIGSS.toFixed(2) : 'N/A'}</p>
                <p><strong>Extra Encargado:</strong> Q${empleado.extraEncargado ? empleado.extraEncargado.toFixed(2) : 'N/A'}</p>
                <p><strong>Salario Total Quincenal:</strong> Q${empleado.salarioTotalQuincenal ? empleado.salarioTotalQuincenal.toFixed(2) : 'N/A'}</p>
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
    // Implementación de la exportación a PDF si es necesaria
}
