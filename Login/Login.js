document.addEventListener("DOMContentLoaded", function() {
    // Limpiar cualquier sesión previa almacenada en localStorage
    localStorage.clear();

    // Crear el usuario "Administrador General" si no existe
    const adminGeneralUsername = "Administrador General";
    const adminGeneralPassword = "admin123"; // Contraseña por defecto, cámbiala según sea necesario

    db.collection("usuarios").where("username", "==", adminGeneralUsername).get().then((querySnapshot) => {
        if (querySnapshot.empty) {
            // Crear "Administrador General"
            db.collection("usuarios").add({
                username: adminGeneralUsername,
                password: adminGeneralPassword,
                role: "admin_general",
                permissions: ["accessPagina", "accessGestionUsuarios", "accessEmpresaMain"] // Acceso a todos los permisos
            }).then(() => {
                console.log("Usuario 'Administrador General' creado con éxito.");
                cargarUsuarios(); // Cargar usuarios después de crear "Administrador General"
            }).catch((error) => {
                console.error("Error al crear el usuario 'Administrador General': ", error);
            });
        } else {
            // Si ya existe, cargar usuarios directamente
            cargarUsuarios();
        }
    }).catch((error) => {
        console.error("Error al verificar el usuario 'Administrador General': ", error);
    });

    // Función para cargar usuarios en el dropdown
    function cargarUsuarios() {
        db.collection("usuarios").get().then((querySnapshot) => {
            const userSelect = document.getElementById("userSelect");
            querySnapshot.forEach((doc) => {
                let option = document.createElement("option");
                option.value = doc.id;
                option.text = doc.data().username;
                userSelect.add(option);
            });
        });
    }

    // Manejar el submit del formulario
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(event) {
            event.preventDefault();
            const userId = document.getElementById("userSelect").value;
            const password = document.getElementById("password").value;
            const errorMessage = document.getElementById("error-message");

            db.collection("usuarios").doc(userId).get().then((doc) => {
                if (doc.exists) {
                    if (doc.data().password === password) {
                        const role = doc.data().role;
                        localStorage.setItem("userRole", role);
                        localStorage.setItem("userId", userId); // Guardar ID de usuario
                        window.location.href = "../Main/Main.HTML"; // Redirigir a la página principal
                    } else {
                        errorMessage.textContent = "Contraseña incorrecta";
                    }
                } else {
                    errorMessage.textContent = "Usuario no encontrado";
                }
            }).catch((error) => {
                console.error("Error obteniendo el documento: ", error);
                errorMessage.textContent = "Ocurrió un error. Inténtalo de nuevo.";
            });
        });
    }
});
