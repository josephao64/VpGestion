document.addEventListener("DOMContentLoaded", function() {
    const db = firebase.firestore();
    let selectedEmpleadoId = null;

    // Cargar permisos del usuario
    const userId = localStorage.getItem("userId");

    if (!userId) {
        window.location.href = "../../Login/Login.html";
        return;
    }

    db.collection("usuarios").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const role = doc.data().role;
            const permissions = doc.data().permissions || [];
            configurarPermisos(role, permissions);
        } else {
            console.error("No se pudo encontrar el usuario.");
            window.location.href = "../../Login/Login.html";
        }
    }).catch((error) => {
        console.error("Error obteniendo el documento: ", error);
        window.location.href = "../../Login/Login.html";
    });

    function configurarPermisos(role, permissions) {
        if (role === "admin_general") {
            habilitarTodosLosBotones();
        } else {
            if (!permissions.includes("agregarRecursosHumanos")) {
                document.getElementById("nuevoBtn").disabled = true;
            }
            if (!permissions.includes("editarRecursosHumanos")) {
                document.getElementById("editarBtn").disabled = true;
            }
            if (!permissions.includes("eliminarRecursosHumanos")) {
                document.getElementById("eliminarBtn").disabled = true;
            }
            if (!permissions.includes("mostrarDetallesRecursosHumanos")) {
                document.getElementById("detallesBtn").disabled = true;
            }
        }
    }

    function habilitarTodosLosBotones() {
        document.getElementById("nuevoBtn").disabled = false;
        document.getElementById("editarBtn").disabled = false;
        document.getElementById("eliminarBtn").disabled = false;
        document.getElementById("detallesBtn").disabled = false;
    }

    cargarSucursales();
    cargarRecursosHumanos();

    document.getElementById("nuevoForm").addEventListener("submit", function(event) {
        event.preventDefault();
        registrarRecursoHumano();
    });

    document.getElementById("editForm").addEventListener("submit", function(event) {
        event.preventDefault();
        actualizarRecursoHumano();
    });

    function cargarSucursales() {
        db.collection("sucursales").get().then((querySnapshot) => {
            const sucursalSelect = document.getElementById("sucursal");
            const editSucursalSelect = document.getElementById("editSucursal");
            querySnapshot.forEach((doc) => {
                let option = document.createElement("option");
                option.value = doc.id;
                option.text = doc.data().name;
                sucursalSelect.add(option);
                editSucursalSelect.add(option.cloneNode(true));
            });
        });
    }

    function cargarRecursosHumanos() {
        db.collection("recursos_humanos").get().then((querySnapshot) => {
            const recursosHumanosTableBody = document.getElementById("recursosHumanosTable").getElementsByTagName("tbody")[0];
            recursosHumanosTableBody.innerHTML = "";
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const row = recursosHumanosTableBody.insertRow();
                row.innerHTML = `
                    <td>${data.nombre}</td>
                    <td>${data.direccion}</td>
                    <td>${data.telefono1}</td>
                    <td>${data.puesto}</td>
                    <td>${data.sucursal}</td>
                `;
                row.addEventListener("click", () => seleccionarEmpleado(doc.id, data));
            });
        });
    }

    function seleccionarEmpleado(id, data) {
        selectedEmpleadoId = id;
        habilitarBotones();
    }

    function habilitarBotones() {
        document.getElementById("editarBtn").disabled = false;
        document.getElementById("detallesBtn").disabled = false;
        document.getElementById("eliminarBtn").disabled = false;
    }

    function registrarRecursoHumano() {
        const nuevoRegistro = {
            nombre: document.getElementById("nombre").value,
            direccion: document.getElementById("direccion").value,
            telefono1: document.getElementById("telefono1").value,
            telefono2: document.getElementById("telefono2").value,
            fechaInicio: document.getElementById("fechaInicio").value,
            fechaFinal: document.getElementById("fechaFinal").value,
            puesto: document.getElementById("puesto").value,
            salario: document.getElementById("salario").value,
            inscritoIgss: document.getElementById("inscritoIgss").value,
            sucursal: document.getElementById("sucursal").value
        };

        db.collection("recursos_humanos").add(nuevoRegistro).then(() => {
            alert("Registro guardado con éxito");
            document.getElementById("nuevoForm").reset();
            cargarRecursosHumanos();
        }).catch((error) => {
            console.error("Error al guardar el registro: ", error);
        });

        closeModal("nuevoModal");
    }

    function actualizarRecursoHumano() {
        const id = selectedEmpleadoId;
        const registroActualizado = {
            nombre: document.getElementById("editNombre").value,
            direccion: document.getElementById("editDireccion").value,
            telefono1: document.getElementById("editTelefono1").value,
            telefono2: document.getElementById("editTelefono2").value,
            fechaInicio: document.getElementById("editFechaInicio").value,
            fechaFinal: document.getElementById("editFechaFinal").value,
            puesto: document.getElementById("editPuesto").value,
            salario: document.getElementById("editSalario").value,
            inscritoIgss: document.getElementById("editInscritoIgss").value,
            sucursal: document.getElementById("editSucursal").value
        };

        db.collection("recursos_humanos").doc(id).update(registroActualizado).then(() => {
            alert("Registro actualizado con éxito");
            cargarRecursosHumanos();
        }).catch((error) => {
            console.error("Error al actualizar el registro: ", error);
        });

        closeModal("editModal");
    }

    window.eliminarRecursoHumano = function() {
        if (selectedEmpleadoId && confirm("¿Estás seguro de que deseas eliminar este registro?")) {
            db.collection("recursos_humanos").doc(selectedEmpleadoId).delete().then(() => {
                alert("Registro eliminado con éxito");
                cargarRecursosHumanos();
                deshabilitarBotones();
            }).catch((error) => {
                console.error("Error al eliminar el registro: ", error);
            });
        }
    }

    window.openModal = function(modalId) {
        if (modalId === "editModal" && selectedEmpleadoId) {
            cargarDatosEmpleado(selectedEmpleadoId);
        } else if (modalId === "detallesModal" && selectedEmpleadoId) {
            mostrarDetallesEmpleado(selectedEmpleadoId);
        }
        document.getElementById(modalId).style.display = "block";
    }

    function cargarDatosEmpleado(id) {
        db.collection("recursos_humanos").doc(id).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                document.getElementById("editId").value = id;
                document.getElementById("editNombre").value = data.nombre;
                document.getElementById("editDireccion").value = data.direccion;
                document.getElementById("editTelefono1").value = data.telefono1;
                document.getElementById("editTelefono2").value = data.telefono2;
                document.getElementById("editFechaInicio").value = data.fechaInicio;
                document.getElementById("editFechaFinal").value = data.fechaFinal;
                document.getElementById("editPuesto").value = data.puesto;
                document.getElementById("editSalario").value = data.salario;
                document.getElementById("editInscritoIgss").value = data.inscritoIgss;
                document.getElementById("editSucursal").value = data.sucursal;
            }
        }).catch((error) => {
            console.error("Error al cargar los datos del empleado: ", error);
        });
    }

    function mostrarDetallesEmpleado(id) {
        db.collection("recursos_humanos").doc(id).get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                const detalles = `
                    <p><strong>Nombre:</strong> ${data.nombre}</p>
                    <p><strong>Dirección:</strong> ${data.direccion}</p>
                    <p><strong>Teléfono 1:</strong> ${data.telefono1}</p>
                    <p><strong>Teléfono 2:</strong> ${data.telefono2}</p>
                    <p><strong>Fecha de Inicio:</strong> ${data.fechaInicio}</p>
                    <p><strong>Fecha de Final:</strong> ${data.fechaFinal}</p>
                    <p><strong>Puesto:</strong> ${data.puesto}</p>
                    <p><strong>Salario:</strong> ${data.salario}</p>
                    <p><strong>Inscrito en IGSS:</strong> ${data.inscritoIgss}</p>
                    <p><strong>Sucursal:</strong> ${data.sucursal}</p>
                `;
                document.getElementById("detallesContenido").innerHTML = detalles;
            }
        }).catch((error) => {
            console.error("Error al cargar los detalles del empleado: ", error);
        });
    }

    function deshabilitarBotones() {
        document.getElementById("editarBtn").disabled = true;
        document.getElementById("detallesBtn").disabled = true;
        document.getElementById("eliminarBtn").disabled = true;
    }

    window.closeModal = function(modalId) {
        document.getElementById(modalId).style.display = "none";
    }
});
