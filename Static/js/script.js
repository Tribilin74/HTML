console.log('script cargado');

const API_URL = './Static/Catalogo/productos.json';
const STORAGE_KEY = 'carrito_tienda_basica';

let productosCargados = [];
let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const listaProductosEl = document.getElementById('lista-productos');
const mensajeEstadoEl = document.getElementById('mensaje-estado');
const itemsCarritoEl = document.getElementById('items-carrito');
const contadorCarritoEl = document.getElementById('contador-carrito');
const totalCarritoEl = document.getElementById('total-carrito');
const formContactoEl = document.getElementById('form-contacto');
const mensajeFormEl = document.getElementById('mensaje-form');

function formatearPrecio(valor) {
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(valor) || 0);
}

// Cargar productos desde JSON / API REST
async function cargarProductos() {
  if (!mensajeEstadoEl || !listaProductosEl) return;

  mensajeEstadoEl.textContent = 'Cargando productos...';
  try {
    const respuesta = await fetch(API_URL);
    if (!respuesta.ok) {
      throw new Error('Error al obtener productos');
    }
    productosCargados = await respuesta.json();
    mensajeEstadoEl.textContent = '';
    renderizarProductos(productosCargados);
  } catch (error) {
    mensajeEstadoEl.innerHTML = '<div class="alert alert-danger">No se pudieron cargar los productos.</div>';
  }
}

function renderizarProductos(productos) {
  listaProductosEl.innerHTML = '';

  productos.forEach((prod) => {
    const card = document.createElement('article');
    card.className = 'producto-card';

    card.innerHTML = `
      <div>
        <img src="${prod.image}" alt="${prod.title}" />
        <h3 class="h6">${prod.title}</h3>
        <p class="small text-muted">${prod.description}</p>
        <p class="fw-bold">$${formatearPrecio(prod.price)}</p>
      </div>
      <button type="button" class="btn btn-dark btn-sm btn-agregar">
        Agregar al carrito
      </button>
    `;

    const botonAgregar = card.querySelector('.btn-agregar');
    botonAgregar.addEventListener('click', () => {
      agregarAlCarrito(prod.id);
    });

    listaProductosEl.appendChild(card);
  });
}

// Gestión del carrito con localStorage
function guardarCarrito() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
}

function agregarAlCarrito(idProducto) {
  const producto = productosCargados.find((p) => p.id === idProducto);
  if (!producto) return;

  const existente = carrito.find((item) => item.id === idProducto);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({
      id: producto.id,
      title: producto.title,
      price: Number(producto.price),
      cantidad: 1
    });
  }

  guardarCarrito();
  renderizarCarrito();
}

function cambiarCantidad(idProducto, nuevaCantidad) {
  const cantidadNum = parseInt(nuevaCantidad, 10);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    eliminarDelCarrito(idProducto);
    return;
  }

  const item = carrito.find((i) => i.id === idProducto);
  if (item) {
    item.cantidad = cantidadNum;
    guardarCarrito();
    renderizarCarrito();
  }
}

function eliminarDelCarrito(idProducto) {
  carrito = carrito.filter((item) => item.id !== idProducto);
  guardarCarrito();
  renderizarCarrito();
}

function renderizarCarrito() {
  if (!itemsCarritoEl || !contadorCarritoEl || !totalCarritoEl) return;

  itemsCarritoEl.innerHTML = '';

  if (carrito.length === 0) {
    itemsCarritoEl.innerHTML = '<p>El carrito está vacío.</p>';
    contadorCarritoEl.textContent = '0';
    totalCarritoEl.textContent = '0.00';
    return;
  }

  let totalUnidades = 0;
  let totalPrecio = 0;

  carrito.forEach((item) => {
    totalUnidades += item.cantidad;
    const subtotal = item.price * item.cantidad;
    totalPrecio += subtotal;

    const fila = document.createElement('div');
    fila.className = 'item-carrito';
    fila.innerHTML = `
      <div>
        <strong>${item.title}</strong><br />
        <span>Precio: $${formatearPrecio(item.price)} | Subtotal: $${formatearPrecio(subtotal)}</span>
      </div>
      <div class="d-flex align-items-center gap-2">
        <label for="cant-${item.id}" class="visually-hidden">Cantidad de ${item.title}</label>
        <input
          id="cant-${item.id}"
          type="number"
          min="1"
          value="${item.cantidad}"
          style="width: 65px;"
          class="form-control form-control-sm"
        />
        <button type="button" class="btn btn-danger btn-sm btn-quitar">
          Quitar
        </button>
      </div>
    `;

    const inputCant = fila.querySelector(`#cant-${item.id}`);
    inputCant.addEventListener('change', (e) => {
      cambiarCantidad(item.id, e.target.value);
    });

    const btnQuitar = fila.querySelector('.btn-quitar');
    btnQuitar.addEventListener('click', () => {
      eliminarDelCarrito(item.id);
    });

    itemsCarritoEl.appendChild(fila);
  });

  contadorCarritoEl.textContent = totalUnidades;
  totalCarritoEl.textContent = formatearPrecio(totalPrecio);
}

// Validación y envío a Formspree
if (formContactoEl) {
  formContactoEl.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nombre = document.getElementById('nombre').value.trim();
    const email = document.getElementById('email').value.trim();
    const mensaje = document.getElementById('mensaje').value.trim();
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!nombre || !email || !mensaje) {
      if (mensajeFormEl) mensajeFormEl.innerHTML = '<div class="alert alert-danger">Completa todos los campos.</div>';
      return;
    }

    if (!emailValido) {
      if (mensajeFormEl) mensajeFormEl.innerHTML = '<div class="alert alert-danger">Ingresa un correo válido.</div>';
      return;
    }

    const datos = new FormData(formContactoEl);

    try {
      const resp = await fetch(formContactoEl.action, {
        method: 'POST',
        body: datos,
        headers: { Accept: 'application/json' }
      });

      if (resp.ok) {
        formContactoEl.reset();
        if (mensajeFormEl) mensajeFormEl.innerHTML = '<div class="alert alert-success">Mensaje enviado correctamente.</div>';
      } else {
        if (mensajeFormEl) mensajeFormEl.innerHTML = '<div class="alert alert-danger">No se pudo enviar. Revisa el ID de Formspree.</div>';
      }
    } catch (err) {
      if (mensajeFormEl) mensajeFormEl.innerHTML = '<div class="alert alert-danger">Error de red al enviar el formulario.</div>';
    }
  });
}

cargarProductos();
renderizarCarrito();