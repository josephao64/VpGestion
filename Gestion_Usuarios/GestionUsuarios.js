document.addEventListener("DOMContentLoaded", function() {
    const userId = localStorage.getItem("userId");

    if (!userId) {
        window.location.href = "../Login/Login.html";
        return;
    }

    db.collection("usuarios").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const role = doc.data().role;

            document.getElementById("loggedUser").textContent = `Usuario: ${doc.data().username}`;

            if (role === "admin_general") {
                habilitarTodo();
            } else {
                cargarUsuarios();
            }
        } else {
            console.error("No se pudo encontrar el usuario.");
            window.location.href = "../Login/Login.html";
        }
    }).catch((error) => {
        console.error("Error obteniendo el documento: ", error);
        window.location.href = "../Login/Login.html";
    });

    let usuarioSeleccionadoId = null;

    function habilitarTodo() {
        document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
            checkbox.checked = true;
            checkbox.disabled = true;
        });
    }

    function cargarUsuarios() {
        const userList = document.getElementById("userList");
        userList.innerHTML = "";

        db.collection("usuarios").get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${doc.data().username}</td>`;
                tr.addEventListener("click", () => seleccionarUsuario(doc.id, doc.data(), tr));
                userList.appendChild(tr);
            });
        });
    }

    function seleccionarUsuario(id, userData, rowElement) {
        usuarioSeleccionadoId = id;

        document.querySelectorAll("tbody tr").forEach(row => row.classList.remove("selected"));
        rowElement.classList.add("selected");

        document.getElementById("username").value = userData.username;
        document.getElementById("password").value = userData.password;
        document.getElementById("role").value = userData.role;

        document.getElementById("verUsuarios").checked = userData.permissions.includes("verUsuarios");
        document.getElementById("editarUsuarios").checked = userData.permissions.includes("editarUsuarios");
        document.getElementById("agregarUsuarios").checked = userData.permissions.includes("agregarUsuarios");

        document.getElementById("editarEmpresas").checked = userData.permissions.includes("editarEmpresas");
        document.getElementById("eliminarEmpresas").checked = userData.permissions.includes("eliminarEmpresas");
        document.getElementById("agregarEmpresas").checked = userData.permissions.includes("agregarEmpresas");

        document.getElementById("editarProveedores").checked = userData.permissions.includes("editarProveedores");
        document.getElementById("eliminarProveedores").checked = userData.permissions.includes("eliminarProveedores");
        document.getElementById("agregarProveedores").checked = userData.permissions.includes("agregarProveedores");

        document.getElementById("verRecursosHumanos").checked = userData.permissions.includes("verRecursosHumanos");
        document.getElementById("editarRecursosHumanos").checked = userData.permissions.includes("editarRecursosHumanos");
        document.getElementById("agregarRecursosHumanos").checked = userData.permissions.includes("agregarRecursosHumanos");
        document.getElementById("eliminarRecursosHumanos").checked = userData.permissions.includes("eliminarRecursosHumanos");
        document.getElementById("mostrarDetallesRecursosHumanos").checked = userData.permissions.includes("mostrarDetallesRecursosHumanos");

        document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
            checkbox.disabled = true;
        });
    }

    function crearUsuario(event) {
        event.preventDefault();

        if (usuarioSeleccionadoId) {
            editarUsuario(event);
            return;
        }

        const newUser = {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value,
            role: document.getElementById("role").value,
            permissions: getSelectedPermissions()
        };

        db.collection("usuarios").add(newUser).then(() => {
            alert("Usuario creado con éxito");
            cargarUsuarios();
            document.getElementById("userForm").reset();
        }).catch((error) => {
            console.error("Error al crear el usuario: ", error);
        });
    }

    function editarUsuario(event) {
        event.preventDefault();

        if (!usuarioSeleccionadoId) {
            alert("Seleccione un usuario de la lista.");
            return;
        }

        const updatedUser = {
            username: document.getElementById("username").value,
            password: document.getElementById("password").value,
            role: document.getElementById("role").value,
            permissions: getSelectedPermissions()
        };

        db.collection("usuarios").doc(usuarioSeleccionadoId).update(updatedUser).then(() => {
            alert("Usuario actualizado con éxito");
            cargarUsuarios();
            document.getElementById("userForm").reset();
            closeModal();
        }).catch((error) => {
            console.error("Error al actualizar el usuario: ", error);
        });
    }

    function eliminarUsuario() {
        if (!usuarioSeleccionadoId) {
            alert("Seleccione un usuario de la lista.");
            return;
        }

        const role = document.getElementById("role").value;

        if (role === "admin_general") {
            alert("No se puede eliminar el Administrador General.");
            return;
        }

        if (confirm("¿Estás seguro de que deseas eliminar este usuario?")) {
            db.collection("usuarios").doc(usuarioSeleccionadoId).delete().then(() => {
                alert("Usuario eliminado con éxito");
                cargarUsuarios();
                document.getElementById("userForm").reset();
                usuarioSeleccionadoId = null;
            }).catch((error) => {
                console.error("Error al eliminar el usuario: ", error);
            });
        }
    }

    function getSelectedPermissions() {
        const permissions = [];
        document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
            if (checkbox.checked) {
                permissions.push(checkbox.value);
            }
        });
        return permissions;
    }

    document.getElementById("newBtn").addEventListener("click", () => {
        document.getElementById("modalTitle").textContent = "Crear Usuario";
        document.getElementById("userForm").reset();
        usuarioSeleccionadoId = null;
        openModal();

        document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
            checkbox.disabled = false;
        });
    });

    document.getElementById("editBtn").addEventListener("click", () => {
        if (!usuarioSeleccionadoId) {
            alert("Seleccione un usuario de la lista.");
            return;
        }
        document.getElementById("modalTitle").textContent = "Editar Usuario";
        openModal();

        document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
            checkbox.disabled = false;
        });
    });

    document.getElementById("deleteBtn").addEventListener("click", eliminarUsuario);
    document.getElementById("saveBtn").addEventListener("click", editarUsuario);
    
    // Cambiar la redirección del botón "Regresar" a Main.HTML sin cerrar sesión
    document.getElementById("logoutBtn").addEventListener("click", () => {
        window.location.href = "../../Main.HTML"; // Redirigir a Main.HTML sin cerrar sesión
    });

    document.getElementById("closeModal").addEventListener("click", closeModal);

    document.getElementById("userForm").onsubmit = crearUsuario;
    cargarUsuarios();

    function openModal() {
        document.getElementById("userModal").style.display = "block";
    }

    function closeModal() {
        document.getElementById("userModal").style.display = "none";
    }
});
