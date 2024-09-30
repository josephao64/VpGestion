// Configuracion.js

// Inicializar Firestore (asegúrate de que FirebaseConfig.js ya está cargado)
var db = firebase.firestore();

document.addEventListener("DOMContentLoaded", function() {
    inicializarDataTablePoliticas();
    cargarPoliticas();

    // Eventos para los formularios
    document.getElementById('formPolitica').addEventListener('submit', function(event) {
        event.preventDefault();
        guardarPolitica();
    });

    // Resetear formulario al cerrar el modal
    $('#modalPolitica').on('hidden.bs.modal', function () {
        document.getElementById('formPolitica').reset();
        document.getElementById('politicaId').value = '';
        document.getElementById('modalPoliticaTitulo').textContent = 'Agregar Política';
    });
});

// Inicializar DataTable para Políticas
var tablaPoliticas;

function inicializarDataTablePoliticas() {
    tablaPoliticas = $('#politicasTable').DataTable({
        columns: [
            { data: 'titulo' },
            { data: 'descripcion' },
            { data: 'fechaCreacion' },
            { data: 'acciones' }
        ],
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.24/i18n/Spanish.json'
        },
        responsive: true
    });
}

// Función para cargar las políticas en la tabla
async function cargarPoliticas() {
    try {
        const politicasSnapshot = await db.collection('politicas').orderBy('fechaCreacion', 'desc').get();
        const politicasData = [];

        politicasSnapshot.forEach(function(doc) {
            const politica = doc.data();

            const fechaCreacion = (politica.fechaCreacion && politica.fechaCreacion.toDate) ? moment(politica.fechaCreacion.toDate()).format('DD/MM/YYYY') : 'N/A';

            politicasData.push({
                id: doc.id,
                titulo: politica.titulo || 'N/A',
                descripcion: politica.descripcion || 'N/A',
                fechaCreacion: fechaCreacion,
                acciones: `<button class="btn btn-sm btn-primary" onclick="editarPolitica('${doc.id}')">Editar</button>
                           <button class="btn btn-sm btn-danger" onclick="eliminarPolitica('${doc.id}')">Eliminar</button>`
            });
        });

        tablaPoliticas.clear();
        tablaPoliticas.rows.add(politicasData).draw();

    } catch (error) {
        console.error('Error al cargar políticas:', error);
        Swal.fire('Error', 'Ocurrió un error al cargar las políticas.', 'error');
    }
}

// Función para abrir el modal de agregar política
function abrirModalAgregarPolitica() {
    document.getElementById('modalPoliticaTitulo').textContent = 'Agregar Política';
    document.getElementById('formPolitica').reset();
    document.getElementById('politicaId').value = '';
    $('#modalPolitica').modal('show');
}

// Función para cerrar el modal de política
function cerrarModalPolitica() {
    $('#modalPolitica').modal('hide');
}

// Función para guardar (agregar o actualizar) una política
async function guardarPolitica() {
    const politicaId = document.getElementById('politicaId').value;
    const titulo = document.getElementById('tituloPolitica').value.trim();
    const descripcion = document.getElementById('descripcionPolitica').value.trim();

    // Validaciones
    if (!titulo || !descripcion) {
        Swal.fire('Error', 'Todos los campos son obligatorios.', 'error');
        return;
    }

    try {
        const politicaData = {
            titulo: titulo,
            descripcion: descripcion,
            fechaCreacion: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (politicaId) {
            // Actualizar política
            await db.collection('politicas').doc(politicaId).update(politicaData);
            Swal.fire('Éxito', 'Política actualizada correctamente.', 'success');
        } else {
            // Agregar nueva política
            await db.collection('politicas').add(politicaData);
            Swal.fire('Éxito', 'Política agregada correctamente.', 'success');
        }

        $('#modalPolitica').modal('hide');
        cargarPoliticas();

    } catch (error) {
        console.error('Error al guardar política:', error);
        Swal.fire('Error', 'Ocurrió un error al guardar la política.', 'error');
    }
}

// Función para editar una política
async function editarPolitica(id) {
    try {
        const politicaDoc = await db.collection('politicas').doc(id).get();
        if (politicaDoc.exists) {
            const politica = politicaDoc.data();

            document.getElementById('modalPoliticaTitulo').textContent = 'Editar Política';
            document.getElementById('politicaId').value = id;
            document.getElementById('tituloPolitica').value = politica.titulo || '';
            document.getElementById('descripcionPolitica').value = politica.descripcion || '';

            $('#modalPolitica').modal('show');
        } else {
            Swal.fire('Error', 'La política no existe.', 'error');
        }
    } catch (error) {
        console.error('Error al obtener política:', error);
        Swal.fire('Error', 'Ocurrió un error al obtener los datos de la política.', 'error');
    }
}

// Función para eliminar una política
function eliminarPolitica(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción eliminará la política permanentemente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                await db.collection('politicas').doc(id).delete();
                cargarPoliticas();
                Swal.fire('Eliminado', 'La política ha sido eliminada.', 'success');
            } catch (error) {
                console.error('Error al eliminar política:', error);
                Swal.fire('Error', 'Ocurrió un error al eliminar la política.', 'error');
            }
        }
    });
}
