// RRHH/Configuracion/Configuracion.js

// Inicializar Firestore (asegúrate de que FirebaseConfig.js ya está cargado)
var db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function() {
    inicializarDataTableParametros();
    cargarParametros();
    cargarParametrosPredefinidos(); // Cargar parámetros predefinidos si no existen

    // Eventos para los formularios
    document.getElementById('formParametro').addEventListener('submit', function(event) {
        event.preventDefault();
        guardarParametro();
    });

    document.getElementById('formSalarios').addEventListener('submit', function(event) {
        event.preventDefault();
        guardarSalarios();
    });

    // Eventos para calcular automáticamente los salarios
    configurarEventosCalculoSalarios();

    // Resetear formularios al cerrar los modales
    $('#modalParametro').on('hidden.bs.modal', function () {
        document.getElementById('formParametro').reset();
        document.getElementById('parametroId').value = '';
        document.getElementById('modalParametroTitulo').textContent = 'Agregar Parámetro';
        document.getElementById('claveParametro').disabled = false;
    });

    $('#modalSalarios').on('hidden.bs.modal', function () {
        document.getElementById('formSalarios').reset();
    });

    // Cargar salarios al iniciar
    cargarSalarios();
});

// Inicializar DataTable para Parámetros
var tablaParametros;

function inicializarDataTableParametros() {
    tablaParametros = $('#parametrosTable').DataTable({
        columns: [
            { data: 'clave' },
            { data: 'valor' },
            { data: 'descripcion' },
            { data: 'fechaActualizacion' },
            { data: 'acciones' }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
        },
        responsive: true
    });
}

// Función para cargar los parámetros en la tabla
async function cargarParametros() {
    try {
        const parametrosSnapshot = await db.collection('parametros').get();
        const parametrosData = [];

        parametrosSnapshot.forEach(function(doc) {
            const parametro = doc.data();
            const fechaActualizacion = parametro.fechaActualizacion ? moment(parametro.fechaActualizacion.toDate()).format('DD/MM/YYYY HH:mm') : 'N/A';

            parametrosData.push({
                id: doc.id,
                clave: parametro.clave || 'N/A',
                valor: parametro.valor || 'N/A',
                descripcion: parametro.descripcion || 'N/A',
                fechaActualizacion: fechaActualizacion,
                acciones: `
                    <button class="btn btn-sm btn-primary" onclick="editarParametro('${doc.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarParametro('${doc.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `
            });
        });

        tablaParametros.clear();
        tablaParametros.rows.add(parametrosData).draw();

    } catch (error) {
        console.error('Error al cargar parámetros:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar los parámetros.', 'error');
    }
}

// Función para cargar parámetros predefinidos si no existen
async function cargarParametrosPredefinidos() {
    try {
        const parametrosRef = db.collection('parametros');

        // Parámetros predefinidos
        const parametrosPredefinidos = [
            {
                clave: 'periodoPruebaDias',
                valor: '60', // Puedes ajustar este valor según tus necesidades
                descripcion: 'Periodo en días para el contrato de prueba',
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            },
            {
                clave: 'extraEncargado',
                valor: '500', // Valor predeterminado para el extra encargado
                descripcion: 'Monto extra para el puesto de Encargado',
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            }
            // Puedes agregar más parámetros predefinidos aquí
        ];

        for (let parametro of parametrosPredefinidos) {
            const parametroDoc = await parametrosRef.doc(parametro.clave).get();
            if (!parametroDoc.exists) {
                await parametrosRef.doc(parametro.clave).set(parametro);
            }
        }

        // Recargar los parámetros en la tabla
        cargarParametros();

    } catch (error) {
        console.error('Error al cargar parámetros predefinidos:', error);
    }
}

// Función para abrir el modal de agregar parámetro
function abrirModalAgregarParametro() {
    document.getElementById('modalParametroTitulo').textContent = 'Agregar Parámetro';
    document.getElementById('formParametro').reset();
    document.getElementById('parametroId').value = '';
    document.getElementById('claveParametro').disabled = false;
    $('#modalParametro').modal('show');
}

// Función para cerrar el modal de parámetro
function cerrarModalParametro() {
    $('#modalParametro').modal('hide');
}

// Función para guardar (agregar o actualizar) un parámetro
async function guardarParametro() {
    const parametroId = document.getElementById('parametroId').value;
    const clave = document.getElementById('claveParametro').value.trim();
    const valor = document.getElementById('valorParametro').value.trim();
    const descripcion = document.getElementById('descripcionParametro').value.trim();

    // Validaciones
    if (!clave || !valor || !descripcion) {
        Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
        return;
    }

    if (isNaN(valor) || parseFloat(valor) < 0) {
        Swal.fire('Error', 'El valor del parámetro debe ser un número positivo.', 'error');
        return;
    }

    try {
        const parametroData = {
            clave: clave,
            valor: valor,
            descripcion: descripcion,
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (parametroId) {
            // Actualizar parámetro
            await db.collection('parametros').doc(clave).update(parametroData);
            Swal.fire('Éxito', 'Parámetro actualizado correctamente.', 'success');
        } else {
            // Verificar si la clave ya existe
            const parametroExistente = await db.collection('parametros').doc(clave).get();
            if (parametroExistente.exists) {
                Swal.fire('Error', 'La clave del parámetro ya existe. Por favor, elige otra clave.', 'error');
                return;
            }
            // Agregar nuevo parámetro
            await db.collection('parametros').doc(clave).set(parametroData);
            Swal.fire('Éxito', 'Parámetro agregado correctamente.', 'success');
        }

        $('#modalParametro').modal('hide');
        cargarParametros();

    } catch (error) {
        console.error('Error al guardar parámetro:', error);
        Swal.fire('Error', 'Ocurrió un error al guardar el parámetro.', 'error');
    }
}

// Función para editar un parámetro
async function editarParametro(id) {
    try {
        const parametroDoc = await db.collection('parametros').doc(id).get();
        if (parametroDoc.exists) {
            const parametro = parametroDoc.data();

            document.getElementById('modalParametroTitulo').textContent = 'Editar Parámetro';
            document.getElementById('parametroId').value = id;
            document.getElementById('claveParametro').value = parametro.clave || '';
            document.getElementById('valorParametro').value = parametro.valor || '';
            document.getElementById('descripcionParametro').value = parametro.descripcion || '';
            document.getElementById('claveParametro').disabled = true;

            $('#modalParametro').modal('show');
        } else {
            Swal.fire('Error', 'El parámetro no existe.', 'error');
        }
    } catch (error) {
        console.error('Error al obtener parámetro:', error);
        Swal.fire('Error', 'Ocurrió un error al obtener los datos del parámetro.', 'error');
    }
}

// Función para eliminar un parámetro
function eliminarParametro(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará el parámetro permanentemente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await db.collection('parametros').doc(id).delete();
                cargarParametros();
                Swal.fire('Eliminado', 'El parámetro ha sido eliminado.', 'success');
            } catch (error) {
                console.error('Error al eliminar parámetro:', error);
                Swal.fire('Error', 'Ocurrió un error al eliminar el parámetro.', 'error');
            }
        }
    });
}

// Función para configurar eventos de cálculo automático de salarios
function configurarEventosCalculoSalarios() {
    // CE1
    document.getElementById('ce1SalarioQuincenal').addEventListener('input', calcularSalarioCE1);
    document.getElementById('ce1BonificacionDecreto').addEventListener('input', calcularSalarioTotalCE1);
    document.getElementById('ce1DescuentoIGSS').addEventListener('input', calcularSalarioTotalCE1);

    // CE2
    document.getElementById('ce2SalarioQuincenal').addEventListener('input', calcularSalarioCE2);
    document.getElementById('ce2BonificacionDecreto').addEventListener('input', calcularSalarioTotalCE2);
    document.getElementById('ce2DescuentoIGSS').addEventListener('input', calcularSalarioTotalCE2);
}

// Función para calcular el Salario Diario de CE1
function calcularSalarioCE1() {
    const salarioQuincenal = parseFloat(document.getElementById('ce1SalarioQuincenal').value) || 0;
    const salarioDiario = ((salarioQuincenal * 2) * 12) / 365;
    document.getElementById('ce1SalarioDiario').value = salarioDiario.toFixed(2);
    calcularSalarioTotalCE1();
}

// Función para calcular el Salario Total Quincenal de CE1
function calcularSalarioTotalCE1() {
    const salarioQuincenal = parseFloat(document.getElementById('ce1SalarioQuincenal').value) || 0;
    const bonificacionDecreto = parseFloat(document.getElementById('ce1BonificacionDecreto').value) || 0;
    const descuentoIGSS = parseFloat(document.getElementById('ce1DescuentoIGSS').value) || 0;
    const salarioTotalQuincenal = salarioQuincenal + bonificacionDecreto - descuentoIGSS;
    document.getElementById('ce1SalarioTotalQuincenal').value = salarioTotalQuincenal.toFixed(2);
}

// Función para calcular el Salario Diario de CE2
function calcularSalarioCE2() {
    const salarioQuincenal = parseFloat(document.getElementById('ce2SalarioQuincenal').value) || 0;
    const salarioDiario = ((salarioQuincenal * 2) * 12) / 365;
    document.getElementById('ce2SalarioDiario').value = salarioDiario.toFixed(2);
    calcularSalarioTotalCE2();
}

// Función para calcular el Salario Total Quincenal de CE2
function calcularSalarioTotalCE2() {
    const salarioQuincenal = parseFloat(document.getElementById('ce2SalarioQuincenal').value) || 0;
    const bonificacionDecreto = parseFloat(document.getElementById('ce2BonificacionDecreto').value) || 0;
    const descuentoIGSS = parseFloat(document.getElementById('ce2DescuentoIGSS').value) || 0;
    const salarioTotalQuincenal = salarioQuincenal + bonificacionDecreto - descuentoIGSS;
    document.getElementById('ce2SalarioTotalQuincenal').value = salarioTotalQuincenal.toFixed(2);
}

// Función para abrir el modal de salarios
function abrirModalSalarios() {
    cargarSalarios(); // Cargar los salarios actuales
    $('#modalSalarios').modal('show');
}

// Función para cerrar el modal de salarios
function cerrarModalSalarios() {
    $('#modalSalarios').modal('hide');
}

// Función para guardar salarios mínimos
async function guardarSalarios() {
    // CE1 (Capital)
    const ce1SalarioQuincenal = parseFloat(document.getElementById('ce1SalarioQuincenal').value) || 0;
    const ce1SalarioDiario = parseFloat(document.getElementById('ce1SalarioDiario').value) || 0;
    const ce1BonificacionDecreto = parseFloat(document.getElementById('ce1BonificacionDecreto').value) || 0;
    const ce1DescuentoIGSS = parseFloat(document.getElementById('ce1DescuentoIGSS').value) || 0;
    const ce1SalarioTotalQuincenal = parseFloat(document.getElementById('ce1SalarioTotalQuincenal').value) || 0;

    // CE2 (Departamentos)
    const ce2SalarioQuincenal = parseFloat(document.getElementById('ce2SalarioQuincenal').value) || 0;
    const ce2SalarioDiario = parseFloat(document.getElementById('ce2SalarioDiario').value) || 0;
    const ce2BonificacionDecreto = parseFloat(document.getElementById('ce2BonificacionDecreto').value) || 0;
    const ce2DescuentoIGSS = parseFloat(document.getElementById('ce2DescuentoIGSS').value) || 0;
    const ce2SalarioTotalQuincenal = parseFloat(document.getElementById('ce2SalarioTotalQuincenal').value) || 0;

    // Validaciones
    if (ce1SalarioQuincenal <= 0 || ce1BonificacionDecreto < 0 || ce1DescuentoIGSS < 0 ||
        ce2SalarioQuincenal <= 0 || ce2BonificacionDecreto < 0 || ce2DescuentoIGSS < 0) {
        Swal.fire('Error', 'Los valores ingresados deben ser números positivos.', 'error');
        return;
    }

    try {
        const salariosData = {
            ce1: {
                salarioQuincenal: ce1SalarioQuincenal,
                salarioDiario: ce1SalarioDiario,
                bonificacionDecreto: ce1BonificacionDecreto,
                descuentoIGSS: ce1DescuentoIGSS,
                salarioTotalQuincenal: ce1SalarioTotalQuincenal
            },
            ce2: {
                salarioQuincenal: ce2SalarioQuincenal,
                salarioDiario: ce2SalarioDiario,
                bonificacionDecreto: ce2BonificacionDecreto,
                descuentoIGSS: ce2DescuentoIGSS,
                salarioTotalQuincenal: ce2SalarioTotalQuincenal
            },
            fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('parametros').doc('salariosMinimos').set(salariosData);

        Swal.fire('Éxito', 'Salarios mínimos guardados correctamente.', 'success');
        $('#modalSalarios').modal('hide');
    } catch (error) {
        console.error('Error al guardar salarios mínimos:', error);
        Swal.fire('Error', 'Ocurrió un error al guardar los salarios mínimos.', 'error');
    }
}

// Función para cargar salarios mínimos
async function cargarSalarios() {
    try {
        const salariosDoc = await db.collection('parametros').doc('salariosMinimos').get();
        if (salariosDoc.exists) {
            const salarios = salariosDoc.data();
            // CE1 (Capital)
            document.getElementById('ce1SalarioQuincenal').value = salarios.ce1.salarioQuincenal || '';
            document.getElementById('ce1BonificacionDecreto').value = salarios.ce1.bonificacionDecreto || '';
            document.getElementById('ce1DescuentoIGSS').value = salarios.ce1.descuentoIGSS || '';
            document.getElementById('ce1SalarioDiario').value = salarios.ce1.salarioDiario || '';
            document.getElementById('ce1SalarioTotalQuincenal').value = salarios.ce1.salarioTotalQuincenal || '';

            // CE2 (Departamentos)
            document.getElementById('ce2SalarioQuincenal').value = salarios.ce2.salarioQuincenal || '';
            document.getElementById('ce2BonificacionDecreto').value = salarios.ce2.bonificacionDecreto || '';
            document.getElementById('ce2DescuentoIGSS').value = salarios.ce2.descuentoIGSS || '';
            document.getElementById('ce2SalarioDiario').value = salarios.ce2.salarioDiario || '';
            document.getElementById('ce2SalarioTotalQuincenal').value = salarios.ce2.salarioTotalQuincenal || '';

            // Recalcular salarios al cargar
            calcularSalarioCE1();
            calcularSalarioCE2();
        }
    } catch (error) {
        console.error('Error al cargar salarios mínimos:', error);
    }
}
