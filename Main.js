document.addEventListener("DOMContentLoaded", function() {
    const userId = localStorage.getItem("userId");

    // Verificar si el usuario ha iniciado sesión
    if (!userId) {
        window.location.href = "../Login/Login.html";
        return; // Detener la ejecución del resto del código
    }

    // Inicializar Firestore (asegúrate de que Firebase esté correctamente configurado en FirebaseConfig.js)
    const db = firebase.firestore();

    // Obtener los datos del usuario desde Firestore
    db.collection("usuarios").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const role = doc.data().role;
            const permissions = doc.data().permissions || [];
            const username = doc.data().username; // Obtener el nombre del usuario

            // Mostrar el nombre del usuario en la página
            document.getElementById("username").textContent = username;

            if (role === "admin_general") {
                // Si es Administrador General, habilitar todos los botones
                document.getElementById("paginaBtn").disabled = false;
                document.getElementById("gestionUsuariosBtn").disabled = false;
                document.getElementById("empresaBtn").disabled = false;
                document.getElementById("gestionFacturasBtn").disabled = false;
                document.getElementById("inventarioBtn").disabled = false;
                document.getElementById("pedidosBtn").disabled = false;
                document.getElementById("mantenimientosBtn").disabled = false; // Nuevo botón
                document.getElementById("recursosHumanosBtn").disabled = false; // Nuevo botón
            } else {
                // Habilitar los botones según los permisos
                if (permissions.includes("accessPagina")) {
                    document.getElementById("paginaBtn").disabled = false;
                }
                if (permissions.includes("accessGestionUsuarios")) {
                    document.getElementById("gestionUsuariosBtn").disabled = false;
                }
                if (permissions.includes("accessGestionFacturas")) {
                    document.getElementById("gestionFacturasBtn").disabled = false;
                }
                if (permissions.includes("accessInventario")) {
                    document.getElementById("inventarioBtn").disabled = false;
                }
                if (permissions.includes("accessPedidos")) {
                    document.getElementById("pedidosBtn").disabled = false;
                }
                // Permitir acceso a la página de empresa a todos los usuarios
                document.getElementById("empresaBtn").disabled = false;

                // Habilitar nuevos botones según permisos
                if (permissions.includes("accessMantenimientos")) {
                    document.getElementById("mantenimientosBtn").disabled = false;
                }
                if (permissions.includes("accessRecursosHumanos")) {
                    document.getElementById("recursosHumanosBtn").disabled = false;
                }
            }

            // Estilizar los botones habilitados y deshabilitados
            const buttons = document.querySelectorAll(".nav-btn");
            buttons.forEach(button => {
                if (button.disabled) {
                    button.style.backgroundColor = "#ccc";
                    button.style.cursor = "not-allowed";
                } else {
                    button.style.backgroundColor = "#007BFF";
                    button.style.cursor = "pointer";
                }
            });

            // Agregar eventos a los botones existentes
            document.getElementById("paginaBtn").addEventListener("click", function() {
                if (!this.disabled) {
                    window.location.href = "../Pagina/Pagina.html";
                }
            });

            document.getElementById("gestionUsuariosBtn").addEventListener("click", function() {
                if (!this.disabled) {
                    window.location.href = "../Gestion_Usuarios/GestionUsuarios.html";
                }
            });

            document.getElementById("empresaBtn").addEventListener("click", function() {
                window.location.href = "../Empresa/EmpresaMain/EmpresaMain.html";
            });

            document.getElementById("gestionFacturasBtn").addEventListener("click", function() {
                if (!this.disabled) {
                    window.location.href = "../Gestion_Facturas/GestionFacturas.html";
                }
            });

            document.getElementById("inventarioBtn").addEventListener("click", function() {
                window.location.href = "../Inventario/inventario.html";
            });

            document.getElementById("pedidosBtn").addEventListener("click", function() {
                window.location.href = "../Pedidos/pedidos.html";
            });

            // Agregar eventos a los nuevos botones
            document.getElementById("mantenimientosBtn").addEventListener("click", function() {
                if (!this.disabled) {
                    window.location.href = "../mantenimiento/Mantenimientos.html";
                }
            });

            document.getElementById("recursosHumanosBtn").addEventListener("click", function() {
                if (!this.disabled) {
                    window.location.href = "../RRHH/RecursosHumanos.html";
                }
            });

            // Manejar el cierre de sesión
            document.getElementById("logoutBtn").addEventListener("click", function() {
                localStorage.clear();
                window.location.href = "../Login/Login.html";
            });

        } else {
            console.error("No se pudo encontrar el usuario.");
            window.location.href = "../Login/Login.html";
        }
    }).catch((error) => {
        console.error("Error obteniendo el documento: ", error);
        window.location.href = "../Login/Login.html";
    });
});
