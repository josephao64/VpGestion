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

    // Resetear formulario al cerrar el modal
    $('#modalParametro').on('hidden.bs.modal', function () {
        document.getElementById('formParametro').reset();
        document.getElementById('parametroId').value = '';
        document.getElementById('modalParametroTitulo').textContent = 'Agregar Parámetro';
        document.getElementById('claveParametro').disabled = false;
    });
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
                acciones: `<button class="btn btn-sm btn-primary" onclick="editarParametro('${doc.id}')">Editar</button>
                           <button class="btn btn-sm btn-danger" onclick="eliminarParametro('${doc.id}')">Eliminar</button>`
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
                valor: '60',
                descripcion: 'Periodo en días para el contrato de prueba',
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            },
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
