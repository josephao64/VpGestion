// Definición de las sucursales predefinidas
const sucursales = ["Jalapa", "Pinula", "Zacapa", "Eskala", "Poptun", "Santa Elena"];

// Inicializar productos en localStorage si no existen
if (!localStorage.getItem('productos')) {
  localStorage.setItem('productos', JSON.stringify([]));
}

// Función para obtener productos desde localStorage
function obtenerProductos() {
  return JSON.parse(localStorage.getItem('productos'));
}

// Función para guardar productos en localStorage
function guardarProductos(productos) {
  localStorage.setItem('productos', JSON.stringify(productos));
}

// Función para generar un ID único
function generarId() {
  return '_' + Math.random().toString(36).substr(2, 9);
}

// Función para renderizar la tabla de productos
function renderizarTablaProductos() {
  const productos = obtenerProductos();
  const tbody = document.getElementById('product-table-body');
  tbody.innerHTML = '';

  productos.forEach(producto => {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = producto.id;
    tr.appendChild(tdId);

    const tdNombre = document.createElement('td');
    tdNombre.textContent = producto.nombre;
    tr.appendChild(tdNombre);

    const tdPrecio = document.createElement('td');
    tdPrecio.textContent = parseFloat(producto.precio).toFixed(2);
    tr.appendChild(tdPrecio);

    const tdAcciones = document.createElement('td');
    tdAcciones.classList.add('action-buttons');

    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Editar';
    btnEditar.onclick = () => editarProducto(producto.id);
    tdAcciones.appendChild(btnEditar);

    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.classList.add('delete');
    btnEliminar.onclick = () => eliminarProducto(producto.id);
    tdAcciones.appendChild(btnEliminar);

    tr.appendChild(tdAcciones);

    tbody.appendChild(tr);
  });

  // Actualizar la lista de productos en las secciones de sucursales y dashboard
  actualizarResumenGeneral();
}

// Función para manejar el envío del formulario de productos
document.getElementById('product-form').addEventListener('submit', function(e) {
  e.preventDefault();

  const id = document.getElementById('product-id').value;
  const nombre = document.getElementById('product-name').value.trim();
  const precio = parseFloat(document.getElementById('product-price').value).toFixed(2);

  if (nombre === '' || isNaN(precio) || precio < 0) {
    alert('Por favor, complete todos los campos correctamente.');
    return;
  }

  let productos = obtenerProductos();

  if (id) {
    // Editar producto existente
    productos = productos.map(prod => {
      if (prod.id === id) {
        return { ...prod, nombre, precio: parseFloat(precio) };
      }
      return prod;
    });
    alert('Producto actualizado exitosamente.');
  } else {
    // Agregar nuevo producto
    const nuevoProducto = {
      id: generarId(),
      nombre,
      precio: parseFloat(precio),
      sucursales: {}
    };

    // Inicializar datos por sucursal para el nuevo producto
    sucursales.forEach(sucursal => {
      nuevoProducto.sucursales[sucursal] = {
        pedidos: [],
        pagos: 0
      };
    });

    productos.push(nuevoProducto);
    alert('Producto agregado exitosamente.');
  }

  guardarProductos(productos);
  renderizarTablaProductos();
  document.getElementById('product-form').reset();
  document.getElementById('product-submit').textContent = 'Agregar Producto';
  document.getElementById('product-id').value = '';
});

// Función para editar un producto
function editarProducto(id) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === id);
  if (producto) {
    document.getElementById('product-id').value = producto.id;
    document.getElementById('product-name').value = producto.nombre;
    document.getElementById('product-price').value = producto.precio.toFixed(2);
    document.getElementById('product-submit').textContent = 'Actualizar Producto';
    // Navegar a la pestaña de Gestión de Productos
    cambiarPestana('gestion-productos');
  }
}

// Función para eliminar un producto
function eliminarProducto(id) {
  if (confirm('¿Está seguro de eliminar este producto?')) {
    let productos = obtenerProductos();
    productos = productos.filter(p => p.id !== id);
    guardarProductos(productos);
    renderizarTablaProductos();
  }
}

// Función para cambiar de pestaña
function cambiarPestana(tabId) {
  // Quitar la clase 'active' de todas las pestañas y contenido
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

  // Agregar 'active' a la pestaña y contenido seleccionado
  document.querySelector(`.tab-button[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// Agregar eventos a las pestañas
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const tabId = button.getAttribute('data-tab');
    cambiarPestana(tabId);
  });
});

// Función para inicializar la gestión de cada sucursal
function inicializarGestionesSucursales() {
  sucursales.forEach(sucursal => {
    const branchDiv = document.querySelector(`.branch-management[data-branch="${sucursal}"]`);
    branchDiv.innerHTML = `
      <h3>Pedidos y Pagos para ${sucursal}</h3>
      
      <!-- Formulario para Agregar Pedido -->
      <form class="pedido-form" data-sucursal="${sucursal}">
        <label>Producto:</label>
        <select class="select-producto" required>
          <option value="">-- Seleccione un Producto --</option>
          ${obtenerProductos().map(prod => `<option value="${prod.id}">${prod.nombre}</option>`).join('')}
        </select>
        
        <label>Unidades:</label>
        <input type="number" min="1" class="unidades" required>
        
        <label>Precio por Unidad:</label>
        <input type="number" min="0" step="0.01" class="precio-unidad" required>
        
        <button type="submit">Agregar Pedido</button>
      </form>
      
      <!-- Formulario para Registrar Pago -->
      <form class="pago-form" data-sucursal="${sucursal}">
        <label>Monto del Pago:</label>
        <input type="number" min="0" step="0.01" class="monto-pago" required>
        <button type="submit">Registrar Pago</button>
      </form>
      
      <!-- Tabla de Pedidos -->
      <h4>Pedidos</h4>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Producto</th>
            <th>Unidades</th>
            <th>Precio por Unidad</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody class="pedidos-body" data-sucursal="${sucursal}">
          <!-- Pedidos se generarán dinámicamente -->
        </tbody>
      </table>
      
      <!-- Tabla de Pagos -->
      <h4>Pagos</h4>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Monto del Pago</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody class="pagos-body" data-sucursal="${sucursal}">
          <!-- Pagos se generarán dinámicamente -->
        </tbody>
      </table>
    `;
  });
}

// Función para actualizar las listas de productos en los formularios de pedidos
function actualizarSelectsSucursal() {
  const productos = obtenerProductos();
  sucursales.forEach(sucursal => {
    const branchDiv = document.querySelector(`.branch-management[data-branch="${sucursal}"]`);
    const selectProducto = branchDiv.querySelector('.select-producto');
    // Limpiar opciones excepto la primera
    selectProducto.innerHTML = '<option value="">-- Seleccione un Producto --</option>';
    productos.forEach(prod => {
      const option = document.createElement('option');
      option.value = prod.id;
      option.textContent = prod.nombre;
      selectProducto.appendChild(option);
    });
  });
}

// Evento para agregar pedido
document.addEventListener('submit', function(e) {
  if (e.target.classList.contains('pedido-form')) {
    e.preventDefault();
    const sucursal = e.target.getAttribute('data-sucursal');
    const productoId = e.target.querySelector('.select-producto').value;
    const unidades = parseInt(e.target.querySelector('.unidades').value);
    const precioUnidad = parseFloat(e.target.querySelector('.precio-unidad').value).toFixed(2);

    if (productoId === '' || isNaN(unidades) || isNaN(precioUnidad) || unidades <= 0 || precioUnidad < 0) {
      alert('Por favor, complete todos los campos correctamente.');
      return;
    }

    agregarPedido(productoId, sucursal, unidades, parseFloat(precioUnidad));
    e.target.reset();
  }

  // Evento para registrar pago
  if (e.target.classList.contains('pago-form')) {
    e.preventDefault();
    const sucursal = e.target.getAttribute('data-sucursal');
    const montoPago = parseFloat(e.target.querySelector('.monto-pago').value).toFixed(2);

    if (isNaN(montoPago) || montoPago <= 0) {
      alert('Ingrese un monto de pago válido.');
      return;
    }

    registrarPago(sucursal, parseFloat(montoPago));
    e.target.reset();
  }
});

// Función para agregar un pedido
function agregarPedido(productoId, sucursal, unidades, precioUnidad) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === productoId);
  if (!producto) {
    alert('Producto no encontrado.');
    return;
  }

  const total = unidades * precioUnidad;
  const pedidoId = generarId();

  // Agregar pedido a la sucursal correspondiente
  productos.forEach(prod => {
    if (prod.id === productoId) {
      prod.sucursales[sucursal].pedidos.push({
        id: pedidoId,
        nombre: prod.nombre,
        unidades,
        precioUnidad,
        total: parseFloat(total.toFixed(2))
      });
    }
  });

  guardarProductos(productos);
  renderPedidos(sucursal, productoId);
  actualizarResumenGeneral();
}

// Función para eliminar un pedido
function eliminarPedido(sucursal, productoId, pedidoId) {
  const productos = obtenerProductos();
  productos.forEach(prod => {
    if (prod.id === productoId) {
      prod.sucursales[sucursal].pedidos = prod.sucursales[sucursal].pedidos.filter(p => p.id !== pedidoId);
    }
  });
  guardarProductos(productos);
  renderPedidos(sucursal, productoId);
  actualizarResumenGeneral();
}

// Función para registrar un pago
function registrarPago(sucursal, montoPago) {
  const productos = obtenerProductos();

  productos.forEach(prod => {
    // Calcular total pedidos para la sucursal
    const totalPedidos = prod.sucursales[sucursal].pedidos.reduce((acc, p) => acc + p.total, 0);
    const totalPagos = prod.sucursales[sucursal].pagos;
    const saldoPendiente = totalPedidos - totalPagos;

    if (montoPago > saldoPendiente) {
      alert(`El monto excede el saldo pendiente de ${saldoPendiente.toFixed(2)} para el producto "${prod.nombre}" en la sucursal ${sucursal}.`);
      return;
    }

    prod.sucursales[sucursal].pagos += parseFloat(montoPago);
  });

  guardarProductos(productos);
  renderPagos(sucursal);
  actualizarResumenGeneral();
}

// Función para renderizar los pedidos de una sucursal
function renderPedidos(sucursal, productoId) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === productoId);
  if (!producto) return;

  const pedidosBody = document.querySelector(`.pedidos-body[data-sucursal="${sucursal}"]`);
  pedidosBody.innerHTML = '';

  producto.sucursales[sucursal].pedidos.forEach(pedido => {
    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = pedido.id;
    tr.appendChild(tdId);

    const tdNombre = document.createElement('td');
    tdNombre.textContent = pedido.nombre;
    tr.appendChild(tdNombre);

    const tdUnidades = document.createElement('td');
    tdUnidades.textContent = pedido.unidades;
    tr.appendChild(tdUnidades);

    const tdPrecioUnidad = document.createElement('td');
    tdPrecioUnidad.textContent = pedido.precioUnidad.toFixed(2);
    tr.appendChild(tdPrecioUnidad);

    const tdTotal = document.createElement('td');
    tdTotal.textContent = pedido.total.toFixed(2);
    tr.appendChild(tdTotal);

    const tdAcciones = document.createElement('td');
    const btnEliminar = document.createElement('button');
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.classList.add('delete');
    btnEliminar.onclick = () => eliminarPedido(sucursal, productoId, pedido.id);
    tdAcciones.appendChild(btnEliminar);
    tr.appendChild(tdAcciones);

    pedidosBody.appendChild(tr);
  });
}

// Función para renderizar los pagos de una sucursal
function renderPagos(sucursal) {
  const productos = obtenerProductos();
  const pagosBody = document.querySelector(`.pagos-body[data-sucursal="${sucursal}"]`);
  pagosBody.innerHTML = '';

  productos.forEach(prod => {
    const totalPedidos = prod.sucursales[sucursal].pedidos.reduce((acc, p) => acc + p.total, 0);
    const totalPagos = prod.sucursales[sucursal].pagos;
    const saldoPendiente = totalPedidos - totalPagos;

    const tr = document.createElement('tr');

    const tdId = document.createElement('td');
    tdId.textContent = prod.id;
    tr.appendChild(tdId);

    const tdMonto = document.createElement('td');
    tdMonto.textContent = totalPagos.toFixed(2);
    tr.appendChild(tdMonto);

    const tdAcciones = document.createElement('td');
    // Opcional: Puedes agregar botones para historial de pagos
    tr.appendChild(tdAcciones);

    pagosBody.appendChild(tr);
  });
}

// Función para actualizar el resumen general en el Dashboard
function actualizarResumenGeneral() {
  const productos = obtenerProductos();
  const dashboardSummary = document.getElementById('dashboard-summary');
  dashboardSummary.innerHTML = '';

  sucursales.forEach(sucursal => {
    let totalPedidos = 0;
    let totalPagos = 0;

    productos.forEach(prod => {
      totalPedidos += prod.sucursales[sucursal].pedidos.reduce((acc, p) => acc + p.total, 0);
      totalPagos += prod.sucursales[sucursal].pagos;
    });

    const saldoPendiente = totalPedidos - totalPagos;

    const card = document.createElement('div');
    card.classList.add('summary-card');
    card.innerHTML = `
      <h3>${sucursal}</h3>
      <p><strong>Total de Pedidos:</strong> $${totalPedidos.toFixed(2)}</p>
      <p><strong>Total de Pagos:</strong> $${totalPagos.toFixed(2)}</p>
      <p><strong>Saldo Pendiente:</strong> $${saldoPendiente.toFixed(2)}</p>
    `;
    dashboardSummary.appendChild(card);
  });

  // Actualizar tablas de pedidos y pagos en cada sucursal
  sucursales.forEach(sucursal => {
    const productos = obtenerProductos();
    productos.forEach(prod => {
      renderPedidos(sucursal, prod.id);
      renderPagos(sucursal);
    });
  });
}

// Función para inicializar el Dashboard
function inicializarDashboard() {
  actualizarResumenGeneral();
}

// Función para inicializar las gestiones de sucursales al cargar los productos
function inicializarGestiones() {
  inicializarGestionesSucursales();
  actualizarSelectsSucursal();
}

// Inicializar el sistema al cargar la página
function inicializarSistema() {
  renderizarTablaProductos();
  inicializarGestiones();
  inicializarDashboard();
}

// Ejecutar la inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializarSistema);

// Escuchar cambios en productos para actualizar selects en tiempo real
document.addEventListener('productUpdated', function() {
  actualizarSelectsSucursal();
  actualizarResumenGeneral();
});
