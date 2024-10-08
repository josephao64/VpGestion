document.addEventListener('DOMContentLoaded', () => {
    const providers = [];
    const providerForm = document.getElementById('provider-form');
    const productForm = document.getElementById('product-form');
    const providerSelect = document.getElementById('provider-select');
    const providersList = document.getElementById('providers-list');

    // Función para renderizar proveedores y productos
    function renderProviders() {
        providersList.innerHTML = '';
        providers.forEach((provider, index) => {
            const providerDiv = document.createElement('div');
            providerDiv.classList.add('provider');
            providerDiv.innerHTML = `
                <h3>${provider.name} (Contacto: ${provider.contact})</h3>
                <ul>
                    ${provider.products.map(product => `<li>${product}</li>`).join('')}
                </ul>
            `;
            providersList.appendChild(providerDiv);
        });

        // Actualizar el selector de proveedores
        providerSelect.innerHTML = '<option value="">Seleccione un Proveedor</option>';
        providers.forEach((provider, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = provider.name;
            providerSelect.appendChild(option);
        });
    }

    // Agregar un nuevo proveedor
    providerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const providerName = document.getElementById('provider-name').value;
        const providerContact = document.getElementById('provider-contact').value;
        if (providerName && providerContact) {
            providers.push({ name: providerName, contact: providerContact, products: [] });
            providerForm.reset();
            renderProviders();
        }
    });

    // Agregar un nuevo producto
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const productName = document.getElementById('product-name').value;
        const providerIndex = providerSelect.value;

        if (productName && providerIndex !== '') {
            providers[providerIndex].products.push(productName);
            productForm.reset();
            renderProviders();
        }
    });
});
