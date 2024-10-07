/* app.js */

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

// Función para renderizar la tabla de productos en el Dashboard
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
    btnEditar.classList.add('edit');
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

  // Actualizar los selects de cada sucursal
  actualizarSelectsSucursal();
  // Actualizar el Dashboard
  actualizarDashboard();
}

// Función para renderizar los selects de productos en cada sucursal
function actualizarSelectsSucursal() {
  const productos = obtenerProductos();
  sucursales.forEach(sucursal => {
    const select = document.getElementById(`select-product-${sucursal}`);
    if (select) {
      select.innerHTML = '<option value="">-- Seleccione un Producto --</option>';
      productos.forEach(producto => {
        const option = document.createElement('option');
        option.value = producto.id;
        option.textContent = producto.nombre;
        select.appendChild(option);
      });
    }
  });
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
        pagos: []
      };
    });

    productos.push(nuevoProducto);
    alert('Producto agregado exitosamente.');
  }

  guardarProductos(productos);
  renderizarTablaProductos();
  this.reset();
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
    window.scrollTo(0, 0); // Scroll hacia arriba para ver el formulario
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

// Función para manejar la navegación entre pestañas
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    const tab = button.getAttribute('data-tab');

    // Remover clase active de todos los botones
    document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
    // Agregar clase active al botón actual
    button.classList.add('active');

    // Remover clase active de todo el contenido
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    // Agregar clase active al contenido seleccionado
    document.getElementById(tab).classList.add('active');
  });
});

// Función para gestionar cada sucursal
sucursales.forEach(sucursal => {
  const select = document.getElementById(`select-product-${sucursal}`);
  const managementDiv = document.getElementById(`management-${sucursal}`);

  select.addEventListener('change', function() {
    const productId = this.value;
    if (productId) {
      mostrarGestionSucursal(sucursal, productId);
    } else {
      managementDiv.innerHTML = '';
    }
  });
});

// Función para mostrar la gestión por sucursal para un producto seleccionado
function mostrarGestionSucursal(sucursal, productId) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === productId);
  if (!producto) return;

  const managementDiv = document.getElementById(`management-${sucursal}`);
  managementDiv.innerHTML = '';

  // Formulario para agregar pedido
  const pedidoForm = document.createElement('form');
  pedidoForm.innerHTML = `
    <h3>Agregar Pedido</h3>
    <label>Unidades:</label>
    <input type="number" min="1" class="unidades" required>
    <label>Precio por Unidad:</label>
    <input type="number" min="0" step="0.01" class="precio-unidad" required value="${producto.precio.toFixed(2)}" readonly>
    <button type="submit">Agregar Pedido</button>
  `;
  pedidoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const unidades = parseInt(this.querySelector('.unidades').value);
    // Utilizar el precio almacenado del producto
    const precioUnidad = producto.precio;

    if (isNaN(unidades) || unidades <= 0) {
      alert('Por favor, ingrese un valor válido para unidades.');
      return;
    }

    agregarPedido(productId, sucursal, unidades, precioUnidad);
    this.reset();
    // Restaurar el precio por unidad después de resetear el formulario
    this.querySelector('.precio-unidad').value = producto.precio.toFixed(2);
  });
  managementDiv.appendChild(pedidoForm);

  // Formulario para registrar pago
  const pagoForm = document.createElement('form');
  pagoForm.innerHTML = `
    <h3>Registrar Pago</h3>
    <label>Monto del Pago:</label>
    <input type="number" min="0" step="0.01" class="monto-pago" required>
    <button type="submit">Registrar Pago</button>
  `;
  pagoForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const montoPago = parseFloat(this.querySelector('.monto-pago').value).toFixed(2);

    if (isNaN(montoPago) || montoPago <= 0) {
      alert('Por favor, ingrese un monto de pago válido.');
      return;
    }

    registrarPago(productId, sucursal, parseFloat(montoPago));
    this.reset();
  });
  managementDiv.appendChild(pagoForm);

  // Tabla de Pedidos
  const pedidosTable = document.createElement('table');
  pedidosTable.innerHTML = `
    <thead>
      <tr>
        <th>Unidades</th>
        <th>Precio por Unidad</th>
        <th>Total</th>
        <th>Acciones</th>
      </tr>
    </thead>
    <tbody class="pedidos-body">
      <!-- Pedidos se generarán dinámicamente -->
    </tbody>
  `;
  managementDiv.appendChild(pedidosTable);

  // Tabla de Pagos
  const pagosTable = document.createElement('table');
  pagosTable.innerHTML = `
    <thead>
      <tr>
        <th>Monto del Pago</th>
      </tr>
    </thead>
    <tbody class="pagos-body">
      <!-- Pagos se generarán dinámicamente -->
    </tbody>
  `;
  managementDiv.appendChild(pagosTable);

  // Actualizar la gestión de sucursal
  actualizarGestionSucursal(productId, sucursal);
}

// Función para agregar un pedido
function agregarPedido(productId, sucursal, unidades, precioUnidad) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === productId);
  if (!producto) return;

  const total = unidades * precioUnidad;

  producto.sucursales[sucursal].pedidos.push({
    id: generarId(),
    unidades,
    precioUnidad: parseFloat(precioUnidad),
    total: parseFloat(total.toFixed(2))
  });

  guardarProductos(productos);
  actualizarGestionSucursal(productId, sucursal);
  actualizarDashboard();
}

// Función para eliminar un pedido
function eliminarPedido(productId, sucursal, pedidoId) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === productId);
  if (!producto) return;

  producto.sucursales[sucursal].pedidos = producto.sucursales[sucursal].pedidos.filter(p => p.id !== pedidoId);
  guardarProductos(productos);
  actualizarGestionSucursal(productId, sucursal);
  actualizarDashboard();
}

// Función para registrar un pago
function registrarPago(productId, sucursal, montoPago) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === productId);
  if (!producto) return;

  const totalPedidos = producto.sucursales[sucursal].pedidos.reduce((acc, p) => acc + p.total, 0);
  const totalPagos = producto.sucursales[sucursal].pagos.reduce((acc, p) => acc + p.monto, 0);
  const saldoPendiente = totalPedidos - totalPagos;

  if (montoPago > saldoPendiente) {
    alert(`El monto excede el saldo pendiente de ${saldoPendiente.toFixed(2)}.`);
    return;
  }

  producto.sucursales[sucursal].pagos.push({
    id: generarId(),
    monto: parseFloat(montoPago)
  });

  guardarProductos(productos);
  actualizarGestionSucursal(productId, sucursal);
  actualizarDashboard();
}

// Función para actualizar la gestión de sucursal (pedidos y pagos)
function actualizarGestionSucursal(productId, sucursal) {
  const productos = obtenerProductos();
  const producto = productos.find(p => p.id === productId);
  if (!producto) return;

  const managementDiv = document.getElementById(`management-${sucursal}`);
  if (!managementDiv) return;

  // Actualizar tabla de pedidos
  const pedidosBody = managementDiv.querySelector('.pedidos-body');
  pedidosBody.innerHTML = '';
  producto.sucursales[sucursal].pedidos.forEach(pedido => {
    const tr = document.createElement('tr');

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
    btnEliminar.onclick = () => eliminarPedido(productId, sucursal, pedido.id);
    tdAcciones.appendChild(btnEliminar);
    tr.appendChild(tdAcciones);

    pedidosBody.appendChild(tr);
  });

  // Actualizar tabla de pagos
  const pagosBody = managementDiv.querySelector('.pagos-body');
  pagosBody.innerHTML = '';
  producto.sucursales[sucursal].pagos.forEach(pago => {
    const tr = document.createElement('tr');

    const tdMonto = document.createElement('td');
    tdMonto.textContent = pago.monto.toFixed(2);
    tr.appendChild(tdMonto);

    pagosBody.appendChild(tr);
  });
}

// Función para actualizar el Dashboard
function actualizarDashboard() {
  const productos = obtenerProductos();
  const tbody = document.getElementById('summary-table-body');
  tbody.innerHTML = '';

  productos.forEach(producto => {
    sucursales.forEach(sucursal => {
      const totalPedidos = producto.sucursales[sucursal].pedidos.reduce((acc, p) => acc + p.total, 0);
      const totalPagos = producto.sucursales[sucursal].pagos.reduce((acc, p) => acc + p.monto, 0);
      const saldoPendiente = totalPedidos - totalPagos;

      const tr = document.createElement('tr');

      const tdProducto = document.createElement('td');
      tdProducto.textContent = producto.nombre;
      tr.appendChild(tdProducto);

      const tdSucursal = document.createElement('td');
      tdSucursal.textContent = sucursal;
      tr.appendChild(tdSucursal);

      const tdTotalPedidos = document.createElement('td');
      tdTotalPedidos.textContent = totalPedidos.toFixed(2);
      tr.appendChild(tdTotalPedidos);

      const tdTotalPagos = document.createElement('td');
      tdTotalPagos.textContent = totalPagos.toFixed(2);
      tr.appendChild(tdTotalPagos);

      const tdSaldo = document.createElement('td');
      tdSaldo.textContent = saldoPendiente.toFixed(2);
      tr.appendChild(tdSaldo);

      tbody.appendChild(tr);
    });
  });
}

// Inicializar el sistema al cargar la página
function inicializarSistema() {
  renderizarTablaProductos();

  // Inicializar la gestión de sucursales para cada sucursal
  sucursales.forEach(sucursal => {
    const select = document.getElementById(`select-product-${sucursal}`);
    if (select) {
      select.addEventListener('change', function() {
        const productId = this.value;
        if (productId) {
          mostrarGestionSucursal(sucursal, productId);
        } else {
          const managementDiv = document.getElementById(`management-${sucursal}`);
          managementDiv.innerHTML = '';
        }
      });
    }
  });
}

// Ejecutar la inicialización al cargar la ventana
window.onload = inicializarSistema;
