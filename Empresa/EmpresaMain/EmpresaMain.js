document.addEventListener("DOMContentLoaded", function() {
    const userId = localStorage.getItem("userId");

    // Verificar si el usuario ha iniciado sesión
    if (!userId) {
        // Redirigir al login si no ha iniciado sesión
        window.location.href = "../../Login/Login.html";
        return;  // Detener la ejecución del resto del código
    }

    // Obtener los datos del usuario desde Firestore
    db.collection("usuarios").doc(userId).get().then((doc) => {
        if (doc.exists) {
            const role = doc.data().role;
            const permissions = doc.data().permissions || [];

            // Si es Administrador General, habilitar todos los botones
            if (role === "admin_general") {
                document.getElementById("gestionarEmpresasBtn").disabled = false;
                document.getElementById("gestionarSucursalesBtn").disabled = false;
                document.getElementById("recursosHumanosBtn").disabled = false;
            } else {
                // Habilitar los botones según los permisos
                if (permissions.includes("editarEmpresas") || 
                    permissions.includes("eliminarEmpresas") || 
                    permissions.includes("agregarEmpresas")) {
                    document.getElementById("gestionarEmpresasBtn").disabled = false;
                }
                if (permissions.includes("editarProveedores") || 
                    permissions.includes("eliminarProveedores") || 
                    permissions.includes("agregarProveedores")) {
                    document.getElementById("gestionarSucursalesBtn").disabled = false;
                }
                if (permissions.includes("verRecursosHumanos") || 
                    permissions.includes("agregarRecursosHumanos") || 
                    permissions.includes("editarRecursosHumanos") || 
                    permissions.includes("eliminarRecursosHumanos")) {
                    document.getElementById("recursosHumanosBtn").disabled = false;
                }
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
            document.getElementById("gestionarEmpresasBtn").addEventListener("click", function() {
                if (!this.disabled) {
                    window.location.href = "../Empresas/Empresas.html";
                }
            });

            document.getElementById("gestionarSucursalesBtn").addEventListener("click", function() {
                if (!this.disabled) {
                    window.location.href = "../Proveedores/Gestionar.html";
                }
            });

            document.getElementById("recursosHumanosBtn").addEventListener("click", function() {
                if (!this.disabled) {
                    window.location.href = "../Recursos_Humanos/RegistroRecursosHumanos.html";
                }
            });

            // Manejar el cierre de sesión
            document.getElementById("logoutBtn").addEventListener("click", function() {
                localStorage.clear();
                window.location.href = "../../Login/Login.html";
            });

        } else {
            console.error("No se pudo encontrar el usuario.");
            window.location.href = "../../Login/Login.html";
        }
    }).catch((error) => {
        console.error("Error obteniendo el documento: ", error);
        window.location.href = "../../Login/Login.html";
    });
});
