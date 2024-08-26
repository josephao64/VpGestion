document.addEventListener("DOMContentLoaded", function() {
    const userId = localStorage.getItem("userId");

    // Verificar si el usuario ha iniciado sesión
    if (!userId) {
        window.location.href = "../Login/Login.html";
        return; // Detener la ejecución del resto del código
    }

    // Obtener los datos del usuario desde Firestore
    db.collection("usuarios").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const role = doc.data().role;
            const permissions = doc.data().permissions || [];

            if (role === "admin_general") {
                // Si es Administrador General, habilitar todos los botones
                document.getElementById("paginaBtn").disabled = false;
                document.getElementById("gestionUsuariosBtn").disabled = false;
                document.getElementById("empresaBtn").disabled = false;
                document.getElementById("gestionFacturasBtn").disabled = false;
                document.getElementById("inventarioBtn").disabled = false;
                document.getElementById("pedidosBtn").disabled = false;
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
            }

            // Estilizar los botones habilitados y deshabilitados
            const buttons = document.querySelectorAll("button");
            buttons.forEach(button => {
                if (button.disabled) {
                    button.style.backgroundColor = "#ccc";
                    button.style.cursor = "not-allowed";
                } else {
                    button.style.backgroundColor = "#007BFF";
                    button.style.cursor = "pointer";
                }
            });

            // Agregar eventos a los botones
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
