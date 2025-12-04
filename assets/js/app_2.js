/* app.js - Simulación ligera: renderiza ejemplos estáticos (index/listado) y maneja formularios en localStorage
   Nota: Para producción reemplaza almacenamiento por API/DB.
*/

(function(){
  const STORAGE_KEY = 'apoyos_solicitudes_v1';
  const demoData = [
    { id:'1', nombre:'Escuela Primaria A', puesto:'Directora', telefono:'4421000000', correo:'escuelaA@ejemplo.org', descripcion:'Solicitan útiles escolares para 120 alumnos.', imagen:null, entregado:false, activo:true, creado: Date.now()-86400000*3 },
    { id:'2', nombre:'Comedor La Esperanza', puesto:'Coordinador', telefono:'4422000000', correo:'comedor@ejemplo.org', descripcion:'Solicitan despensas para temporada invernal.', imagen:null, entregado:true, activo:true, creado: Date.now()-86400000*10 },
    { id:'3', nombre:'Centro Juvenil', puesto:'Presidente', telefono:'4423000000', correo:'juventud@ejemplo.org', descripcion:'Donativos para uniformes deportivos.', imagen:null, entregado:false, activo:true, creado: Date.now()-86400000*7 },
    { id:'4', nombre:'Asociación Vecinal', puesto:'Presidente', telefono:'4424000000', correo:'vecinos@ejemplo.org', descripcion:'Solicitan herramientas para talleres comunitarios.', imagen:null, entregado:false, activo:true, creado: Date.now()-86400000*12 }
  ];

  function loadData(){
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw){ localStorage.setItem(STORAGE_KEY, JSON.stringify(demoData)); return demoData.slice(); }
      return JSON.parse(raw) || [];
    } catch(e){ return demoData.slice(); }
  }
  function saveData(data){ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  function uid(){ return Math.random().toString(36).slice(2,9); }
  function escapeHtml(t=''){ return String(t).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

  // Index: render estático (ya incluidos ejemplos en HTML). También rellenar adminList cuando exista.
  function renderAdminList(){
    const container = document.getElementById('adminList');
    if(!container) return;
    const data = loadData();
    if(!data.length){ container.innerHTML = '<div class="list-group-item">No hay registros</div>'; return; }

    container.innerHTML = data.map(item => `
      <div class="list-group-item d-flex align-items-center justify-content-between">
        <div class="d-flex align-items-center">
          <div class="me-3" style="width:72px">
            <div class="image-placeholder" style="height:56px">${item.imagen?'<img src="'+item.imagen+'" class="img-fluid rounded">':'Imagen aquí'}</div>
          </div>
          <div>
            <div class="fw-bold">${escapeHtml(item.nombre)}</div>
            <div class="small text-muted">${escapeHtml(item.descripcion).slice(0,80)}${item.descripcion.length>80?'...':''}</div>
            <div class="small mt-1">Estado: ${item.activo?'<span class="badge bg-success">Activo</span>':'<span class="badge bg-secondary">Desactivado</span>'} ${item.entregado?'<span class="badge bg-primary ms-1">Entregado</span>':''}</div>
          </div>
        </div>

        <div class="btn-group">
          <a class="btn btn-sm btn-outline-primary" href="editar.html?id=${item.id}"><i class="bi bi-pencil"></i></a>
          <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${item.id}"><i class="bi bi-trash"></i></button>
          <button class="btn btn-sm btn-outline-secondary" data-action="toggle" data-id="${item.id}">${item.activo?'Desactivar':'Activar'}</button>
        </div>
      </div>
    `).join('');

    // bind actions
    container.querySelectorAll('button[data-action]').forEach(btn=>{
      btn.addEventListener('click', function(){
        const id = this.dataset.id; const action = this.dataset.action;
        if(action === 'delete') { confirmDelete(id); }
        if(action === 'toggle') { toggleActive(id); }
      });
    });
  }

  // eliminar confirm
  let pendingDeleteId = null;
  function confirmDelete(id){
    pendingDeleteId = id;
    const modal = new bootstrap.Modal(document.getElementById('confirmDeleteModal'));
    modal.show();
    document.getElementById('confirmDeleteBtn').onclick = function(){
      deleteById(pendingDeleteId);
      modal.hide();
      renderAdminList();
    };
  }
  function deleteById(id){
    const newData = loadData().filter(d => d.id !== id);
    saveData(newData);
  }
  function toggleActive(id){
    const newData = loadData().map(d => d.id === id ? {...d, activo: !d.activo} : d);
    saveData(newData);
    renderAdminList();
  }

  // Formulario nueva solicitud (solicitud.html)
  function bindSolicitudForm(){
    const form = document.getElementById('solicitudForm'); if(!form) return;
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const nombre = document.getElementById('nombre').value.trim();
      const correo = document.getElementById('correo').value.trim();
      const telefono = document.getElementById('telefono').value.trim();
      const puesto = document.getElementById('puesto').value.trim();
      const descripcion = document.getElementById('descripcion').value.trim();
      const imagenInput = document.getElementById('imagen');

      if(!nombre || !correo || !telefono || !descripcion){ alert('Completa los campos obligatorios.'); return; }

      let imagenData = null;
      if(imagenInput && imagenInput.files && imagenInput.files[0]){
        imagenData = await fileToDataURL(imagenInput.files[0]);
      }

      const data = loadData();
      data.push({ id: uid(), nombre, correo, telefono, puesto, descripcion, imagen: imagenData, entregado:false, activo:true, creado: Date.now() });
      saveData(data);

      const alertEl = document.getElementById('formAlert');
      if(alertEl){ alertEl.classList.remove('d-none'); }
      form.reset();
      setTimeout(()=> window.location.href = 'index.html', 900);
    });
  }

  // Edit page
  function bindEditPage(){
    const params = new URLSearchParams(location.search);
    const id = params.get('id'); if(!id) return;
    const data = loadData(); const item = data.find(d=>d.id === id); if(!item) return;

    document.getElementById('editId').value = item.id;
    document.getElementById('editNombre').value = item.nombre;
    document.getElementById('editCorreo').value = item.correo;
    document.getElementById('editTelefono').value = item.telefono;
    document.getElementById('editPuesto').value = item.puesto;
    document.getElementById('editDescripcion').value = item.descripcion;

    const form = document.getElementById('editForm');
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const nombre = document.getElementById('editNombre').value.trim();
      const correo = document.getElementById('editCorreo').value.trim();
      const telefono = document.getElementById('editTelefono').value.trim();
      const puesto = document.getElementById('editPuesto').value.trim();
      const descripcion = document.getElementById('editDescripcion').value.trim();
      const imgInput = document.getElementById('editImagen');

      let imagenData = item.imagen;
      if(imgInput && imgInput.files && imgInput.files[0]) imagenData = await fileToDataURL(imgInput.files[0]);

      const newData = loadData().map(d => d.id === id ? {...d, nombre, correo, telefono, puesto, descripcion, imagen: imagenData} : d);
      saveData(newData);

      const alertEl = document.getElementById('editAlert'); if(alertEl) alertEl.classList.remove('d-none');
      setTimeout(()=> window.location.href = 'listado.html', 900);
    });
  }

  // convert file to base64 dataURL
  function fileToDataURL(file){ return new Promise((res,rej)=>{ const fr = new FileReader(); fr.onload = ()=>res(fr.result); fr.onerror = rej; fr.readAsDataURL(file); }); }

  document.addEventListener('DOMContentLoaded', function(){
    // render admin list
    renderAdminList();
    // bind forms
    bindSolicitudForm();
    bindEditPage();
  });

})();
