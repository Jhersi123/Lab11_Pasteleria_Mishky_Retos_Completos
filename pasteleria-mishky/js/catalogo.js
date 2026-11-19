// =============================================================
// Pastelería Mishky · Catálogo dinámico (Lab. 11 + 10 retos)
// =============================================================
"use strict";

const RUTA_DATOS = "data/productos.json";
const TODAS = "Todas";
const EXT_VALIDAS = /\.(jpe?g|png|webp|avif)$/i;
const NUM_FANTASMAS = 8;
const SIZES = "(max-width: 600px) calc(100vw - 2rem), (max-width: 900px) 45vw, 280px";

const contControles = document.querySelector("#controles");
const contFiltros = document.querySelector("#filtros");
const buscador = document.querySelector("#buscador");
const selOrden = document.querySelector("#orden");
const chkDisponibles = document.querySelector("#solo-disponibles");
const grilla = document.querySelector("#grilla");
const estado = document.querySelector("#estado");
const aviso = document.querySelector("#aviso");
const plantilla = document.querySelector("#tpl-producto");
const dialogo = document.querySelector("#detalle");

let productos = [];
let categoriaActiva = TODAS;
let tarjetaAbierta = null;

const soles = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

// RETO 6: validación y descarte seguro de productos
function motivosInvalido(p, idsVistos) {
  const motivos = [];
  if (typeof p !== "object" || p === null || Array.isArray(p)) {
    return ["no es un objeto"];
  }
  if (typeof p.id !== "number" || !Number.isFinite(p.id)) motivos.push("id no numérico");
  else if (idsVistos.has(p.id)) motivos.push("id repetido");
  if (typeof p.precio !== "number" || !Number.isFinite(p.precio) || p.precio <= 0) {
    motivos.push("precio no válido");
  }
  if (!Number.isInteger(p.stock) || p.stock < 0) motivos.push("stock no válido");
  if (typeof p.categoria !== "string" || p.categoria.trim() === "") {
    motivos.push("categoría vacía");
  }
  if (typeof p.imagen !== "string" || !EXT_VALIDAS.test(p.imagen)) {
    motivos.push("imagen sin extensión válida");
  }
  if (typeof p.nombre !== "string" || !p.nombre.trim()) motivos.push("nombre vacío");
  if (typeof p.descripcion !== "string") motivos.push("descripción no válida");
  return motivos;
}

function validarProductos(lista) {
  const idsVistos = new Set();
  const validos = [];
  const descartados = [];
  lista.forEach((producto, indice) => {
    const motivos = motivosInvalido(producto, idsVistos);
    if (motivos.length === 0) {
      idsVistos.add(producto.id);
      validos.push(producto);
    } else {
      descartados.push({
        posicion: indice + 1,
        id: producto && typeof producto === "object" ? producto.id : "—",
        motivos: motivos.join(", ")
      });
    }
  });
  return { validos, descartados };
}

function mostrarAviso(descartados) {
  if (descartados.length === 0) {
    aviso.hidden = true;
    aviso.textContent = "";
    return;
  }
  console.warn(`Se descartaron ${descartados.length} producto(s) inválido(s):`);
  console.table(descartados);
  aviso.textContent = `Se descartaron ${descartados.length} producto(s) con datos inválidos. Revise la consola para conocer los motivos.`;
  aviso.hidden = false;
}

// RETO 10: errores diferenciados
async function cargarProductos() {
  const respuesta = await fetch(RUTA_DATOS);
  if (!respuesta.ok) {
    const error = new Error(`HTTP ${respuesta.status}`);
    error.tipo = "http";
    error.status = respuesta.status;
    throw error;
  }
  let datos;
  try {
    datos = await respuesta.json();
  } catch (causa) {
    const error = new Error("JSON inválido", { cause: causa });
    error.tipo = "json";
    throw error;
  }
  if (!Array.isArray(datos)) {
    const error = new Error("El JSON debe ser un arreglo");
    error.tipo = "formato";
    throw error;
  }
  return datos;
}

function mensajeError(error) {
  if (error.tipo === "http" && error.status === 404) {
    return "No se encontró el archivo de productos (error 404). Compruebe la ruta data/productos.json.";
  }
  if (error.tipo === "http") {
    return `El servidor respondió con un error (${error.status}). Intente nuevamente.`;
  }
  if (error.tipo === "json" || error.tipo === "formato") {
    return "El archivo de productos tiene un formato incorrecto o está dañado. Corrija el JSON e inténtelo otra vez.";
  }
  return "No se pudo cargar el catálogo. Verifique su conexión y que esté usando Live Server.";
}

function leerControles() {
  return {
    texto: buscador.value.trim().toLocaleLowerCase("es"),
    orden: selOrden.value,
    soloDisponibles: chkDisponibles.checked
  };
}

function coincide(producto, controles) {
  return producto.nombre.toLocaleLowerCase("es").includes(controles.texto) &&
    (!controles.soloDisponibles || producto.stock > 0);
}

function ordenar(lista, criterio) {
  const copia = [...lista];
  if (criterio === "precio-asc") copia.sort((a, b) => a.precio - b.precio);
  else if (criterio === "precio-desc") copia.sort((a, b) => b.precio - a.precio);
  else if (criterio === "nombre") copia.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return copia;
}

// RETOS 1-3: categoría + búsqueda + stock + orden
function obtenerVisibles() {
  const controles = leerControles();
  const filtrados = productos.filter(producto =>
    (categoriaActiva === TODAS || producto.categoria === categoriaActiva) &&
    coincide(producto, controles)
  );
  return ordenar(filtrados, controles.orden);
}

function obtenerCategorias(lista) {
  return [TODAS, ...new Set(lista.map(producto => producto.categoria))];
}

function renderizarFiltros(categorias) {
  const fragmento = document.createDocumentFragment();
  categorias.forEach(categoria => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "filtro";
    boton.dataset.categoria = categoria;
    boton.setAttribute("aria-pressed", String(categoria === categoriaActiva));
    fragmento.append(boton);
  });
  contFiltros.replaceChildren(fragmento);
  actualizarContadores();
}

// RETO 4: solo cambia el texto de los botones; no los vuelve a crear
function actualizarContadores() {
  const controles = leerControles();
  contFiltros.querySelectorAll(".filtro").forEach(boton => {
    const categoria = boton.dataset.categoria;
    const total = productos.filter(producto =>
      (categoria === TODAS || producto.categoria === categoria) &&
      coincide(producto, controles)
    ).length;
    boton.textContent = `${categoria} (${total})`;
  });
}

function marcarBotonActivo() {
  contFiltros.querySelectorAll(".filtro").forEach(boton => {
    boton.setAttribute("aria-pressed", String(boton.dataset.categoria === categoriaActiva));
  });
}

// RETO 5: lectura segura de location.hash
function categoriaDesdeHash(categorias) {
  const crudo = location.hash.slice(1);
  if (!crudo) return TODAS;
  try {
    const categoria = decodeURIComponent(crudo);
    return categorias.includes(categoria) ? categoria : TODAS;
  } catch {
    return TODAS;
  }
}

function actualizarHash() {
  const nuevoHash = categoriaActiva === TODAS ? "" : `#${encodeURIComponent(categoriaActiva)}`;
  history.replaceState(null, "", `${location.pathname}${location.search}${nuevoHash}`);
}

function variante(ruta, ancho) {
  return ruta.replace(/(\.[^./]+)$/, `-${ancho}$1`);
}

// RETO 9: imágenes responsivas, lazy loading y respaldo
function crearTarjeta(producto) {
  const nodo = plantilla.content.cloneNode(true);
  const tarjeta = nodo.querySelector(".tarjeta");
  const img = nodo.querySelector("img");
  const etiqueta = nodo.querySelector(".etiqueta");

  tarjeta.dataset.id = producto.id;
  tarjeta.tabIndex = 0;
  tarjeta.setAttribute("role", "button");
  tarjeta.setAttribute("aria-label", `${producto.nombre}, ${soles.format(producto.precio)}. Ver detalle`);

  img.addEventListener("load", () => tarjeta.classList.add("foto-cargada"));
  img.onerror = () => {
    img.onerror = null;
    img.removeAttribute("srcset");
    img.src = "img/sin-imagen.jpg";
  };
  img.alt = producto.nombre;
  img.sizes = SIZES;
  img.srcset = `${variante(producto.imagen, 300)} 300w, ${variante(producto.imagen, 600)} 600w, ${producto.imagen} 900w`;
  img.src = producto.imagen;
  if (img.complete && img.naturalWidth > 0) tarjeta.classList.add("foto-cargada");

  nodo.querySelector(".tarjeta__categoria").textContent = producto.categoria;
  nodo.querySelector(".tarjeta__nombre").textContent = producto.nombre;
  nodo.querySelector(".tarjeta__descripcion").textContent = producto.descripcion;
  nodo.querySelector(".tarjeta__precio").textContent = soles.format(producto.precio);
  nodo.querySelector(".tarjeta__porciones").textContent =
    producto.porciones > 1 ? `${producto.porciones} porciones` : "1 unidad";

  if (producto.stock === 0) {
    etiqueta.textContent = "Agotado";
    etiqueta.classList.add("etiqueta--agotado");
    etiqueta.hidden = false;
    tarjeta.classList.add("tarjeta--agotado");
  } else if (producto.destacado) {
    etiqueta.textContent = "Favorito";
    etiqueta.hidden = false;
  }
  return nodo;
}

function textoEstado(cantidad) {
  const controles = leerControles();
  const partes = [`Mostrando ${cantidad} ${cantidad === 1 ? "producto" : "productos"}`];
  partes.push(categoriaActiva === TODAS ? "en total" : `en «${categoriaActiva}»`);
  if (controles.texto) partes.push(`con «${buscador.value.trim()}» en el nombre`);
  if (controles.soloDisponibles) partes.push("(solo disponibles)");
  return `${partes.join(" ")}.`;
}

function renderizarCatalogo() {
  const lista = obtenerVisibles();
  if (lista.length === 0) {
    grilla.replaceChildren();
    estado.textContent = "No hay productos que coincidan con su búsqueda.";
    return;
  }
  const fragmento = document.createDocumentFragment();
  lista.forEach(producto => fragmento.append(crearTarjeta(producto)));
  grilla.replaceChildren(fragmento);
  estado.textContent = textoEstado(lista.length);
}

function refrescar() {
  renderizarCatalogo();
  actualizarContadores();
}

// RETO 7: skeletons / tarjetas fantasma
function mostrarFantasmas(cantidad = NUM_FANTASMAS) {
  const fragmento = document.createDocumentFragment();
  for (let i = 0; i < cantidad; i++) {
    const tarjeta = document.createElement("li");
    tarjeta.className = "tarjeta tarjeta--fantasma";
    tarjeta.setAttribute("aria-hidden", "true");
    tarjeta.innerHTML =
      '<div class="tarjeta__foto"></div><div class="tarjeta__cuerpo">' +
      '<span class="fantasma__linea fantasma__linea--corta"></span>' +
      '<span class="fantasma__linea"></span><span class="fantasma__linea"></span></div>';
    fragmento.append(tarjeta);
  }
  grilla.replaceChildren(fragmento);
}

// Delegación única de eventos para controles
contControles.addEventListener("click", evento => {
  const boton = evento.target.closest(".filtro");
  if (!boton || !contFiltros.contains(boton) || boton.dataset.categoria === categoriaActiva) return;
  categoriaActiva = boton.dataset.categoria;
  marcarBotonActivo();
  actualizarHash();
  refrescar();
});

contControles.addEventListener("input", evento => {
  if (evento.target.matches("#buscador")) refrescar();
});

contControles.addEventListener("change", evento => {
  if (evento.target.matches("#orden, #solo-disponibles")) refrescar();
});

// RETO 8: detalle accesible en <dialog>
function abrirDetalle(tarjeta) {
  const producto = productos.find(item => item.id === Number(tarjeta.dataset.id));
  if (!producto || dialogo.open) return;
  tarjetaAbierta = tarjeta;
  const imagen = document.querySelector("#detalle-img");
  imagen.src = producto.imagen;
  imagen.alt = producto.nombre;
  document.querySelector("#detalle-categoria").textContent = producto.categoria;
  document.querySelector("#detalle-titulo").textContent = producto.nombre;
  document.querySelector("#detalle-descripcion").textContent = producto.descripcion;
  document.querySelector("#detalle-precio").textContent = soles.format(producto.precio);
  document.querySelector("#detalle-stock").textContent = producto.stock === 0
    ? "Agotado"
    : `Stock: ${producto.stock} ${producto.stock === 1 ? "unidad" : "unidades"}`;
  dialogo.showModal();
}

grilla.addEventListener("click", evento => {
  const tarjeta = evento.target.closest(".tarjeta[data-id]");
  if (tarjeta) abrirDetalle(tarjeta);
});

grilla.addEventListener("keydown", evento => {
  if (evento.key !== "Enter" && evento.key !== " ") return;
  const tarjeta = evento.target.closest(".tarjeta[data-id]");
  if (tarjeta && evento.target === tarjeta) {
    evento.preventDefault();
    abrirDetalle(tarjeta);
  }
});

dialogo.addEventListener("click", evento => {
  if (evento.target.closest("[data-cerrar]") || evento.target === dialogo) dialogo.close();
});

dialogo.addEventListener("close", () => {
  if (tarjetaAbierta && tarjetaAbierta.isConnected) tarjetaAbierta.focus();
  tarjetaAbierta = null;
});

window.addEventListener("hashchange", () => {
  if (productos.length === 0) return;
  categoriaActiva = categoriaDesdeHash(obtenerCategorias(productos));
  marcarBotonActivo();
  refrescar();
});

function limpiarError() {
  estado.classList.remove("estado--error");
  estado.querySelector(".estado__reintentar")?.remove();
}

function mostrarError(error) {
  console.error(error);
  grilla.replaceChildren();
  estado.classList.add("estado--error");
  estado.textContent = `${mensajeError(error)} `;
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "estado__reintentar";
  boton.textContent = "Reintentar";
  boton.addEventListener("click", iniciar);
  estado.append(boton);
  boton.focus();
}

async function iniciar() {
  limpiarError();
  aviso.hidden = true;
  grilla.setAttribute("aria-busy", "true");
  estado.textContent = "Cargando productos…";
  mostrarFantasmas();
  try {
    const datos = await cargarProductos();
    const resultado = validarProductos(datos);
    mostrarAviso(resultado.descartados);
    productos = resultado.validos;
    const categorias = obtenerCategorias(productos);
    categoriaActiva = categoriaDesdeHash(categorias);
    renderizarFiltros(categorias);
    marcarBotonActivo();
    refrescar();
  } catch (error) {
    mostrarError(error);
  } finally {
    grilla.setAttribute("aria-busy", "false");
  }
}

iniciar();
