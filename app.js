const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const EST=[['flyer','Flyer entregado','#1e88e5'],['hablado','Hablado con el cliente','#43a047'],['sin','Sin toma de contacto','#9e9e9e'],['volver','Necesita volver','#fb8c00'],['presu','Presupuesto entregado','#8e24aa'],['noint','No interesado','#C8102E']];
const estN=k=>(EST.find(e=>e[0]==k)||[0,'Pendiente'])[1],estC=k=>(EST.find(e=>e[0]==k)||[0,0,'#4A4A4A'])[2],catN=k=>(CATS.find(c=>c[0]==k)||[0,k])[1];
const S={view:'buscar',center:JSON.parse(localStorage.getItem('tpros_center')||'null'),radius:+(localStorage.getItem('tpros_radius')||5000),
 cats:JSON.parse(localStorage.getItem('tpros_cats')||'["bar","cafe","rest","super","mini","taller"]'),f:{est:'todos',cat:'',zona:false,q:''},locs:[],ctrl:null};
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const dayOf=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
function toast(t){const d=$('#toast');d.textContent=t;d.className='on';clearTimeout(d._t);d._t=setTimeout(()=>d.className='',2600)}
async function reload(){S.locs=await DB.all()}
function go(v){S.view=v;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.v==v));scrollTo(0,0);R[v]()}
const fmtKm=m=>m>=1000?(m/1000).toFixed(m%1000?1:0)+' km':m+' m';
const R={};
/* ---------- BUSCAR ---------- */
R.buscar=()=>{const ncat=S.cats.length,minR=+(localStorage.getItem('tpros_minr')||1000),e=estimateCalls(S.radius,ncat,minR);
 $('#main').innerHTML=`${apiKey()?'':`<div class="warn">🔑 Falta la clave de Google Maps. Pégala en <a href="#" onclick="go('cfg');return false">⚙ Configuración</a> para poder buscar.</div>`}
 <div class="card"><h2>📍 Centro de la búsqueda</h2><div class="seg"><button onclick="gps()">🛰️ Mi ubicación</button><button onclick="pickMap()">🗺️ Elegir en el mapa</button></div>
 <p class="muted" id="ctxt">${S.center?`Centro: <b>${S.center.lat.toFixed(5)}, ${S.center.lng.toFixed(5)}</b>${S.center.src?' · '+S.center.src:''}`:'Aún no hay centro. Usa tu ubicación o toca el mapa.'}</p><div id="pick"></div></div>
 <div class="card"><h2>⭕ Radio: <span id="rv">${fmtKm(S.radius)}</span></h2><input type="range" min="500" max="30000" step="500" value="${S.radius}" oninput="S.radius=+this.value;$('#rv').textContent=fmtKm(S.radius)" onchange="localStorage.setItem('tpros_radius',S.radius);R.buscar()">
 <div class="chips">${[1000,2000,5000,10000,20000,30000].map(r=>`<button class="${r==S.radius?'on':''}" onclick="S.radius=${r};localStorage.setItem('tpros_radius',${r});R.buscar()">${fmtKm(r)}</button>`).join('')}</div></div>
 <div class="card"><h2>🏪 Tipos de establecimiento</h2><div class="chips"><button onclick="S.cats=CATS.map(c=>c[0]);saveCats()">Todos</button><button onclick="S.cats=[];saveCats()">Ninguno</button></div>
 <div class="cats">${CATS.map(c=>`<label class="ck"><input type="checkbox" ${S.cats.includes(c[0])?'checked':''} onchange="tCat('${c[0]}',this.checked)"> ${c[1]}</label>`).join('')}</div></div>
 <div class="card cost"><b>💶 Coste estimado:</b> entre ${e.min} y ${e.max} llamadas a Google (≈ ${(e.min*PRICE_1000/1000).toFixed(2)}–${(e.max*PRICE_1000/1000).toFixed(2)} US$ si se supera el cupo gratuito mensual). Zonas con muchos locales necesitan más llamadas.</div>
 <button class="big" ${S.center&&ncat?'':'disabled'} onclick="buscar()">🔎 Buscar establecimientos en mi zona</button>
 <div id="prog"></div>
 <details class="card"><summary>🔤 Búsqueda por texto (opcional)</summary><p class="muted">Ej.: «comunidad de propietarios», «panadería La Abuela». Busca cerca del centro elegido (máx. 20 resultados).</p><div class="row"><input id="tq" placeholder="Qué buscar"><button class="btn" onclick="buscarTexto()">Buscar</button></div></details>`};
function saveCats(){localStorage.setItem('tpros_cats',JSON.stringify(S.cats));R.buscar()}
function tCat(k,on){S.cats=S.cats.filter(x=>x!=k);if(on)S.cats.push(k);saveCats()}
function setCenter(c,src){S.center={lat:c.lat,lng:c.lng,src};localStorage.setItem('tpros_center',JSON.stringify(S.center))}
function gps(){if(!navigator.geolocation)return toast('Este dispositivo no tiene GPS');toast('Obteniendo ubicación…');
 navigator.geolocation.getCurrentPosition(p=>{setCenter({lat:p.coords.latitude,lng:p.coords.longitude},'GPS ±'+Math.round(p.coords.accuracy)+' m');R.buscar()},e=>toast('No se pudo obtener la ubicación: '+e.message),{enableHighAccuracy:true,timeout:20000})}
let gmP=null;function loadMaps(){if(window.google&&google.maps&&google.maps.Map)return Promise.resolve();if(!apiKey())return Promise.reject(new Error('NOKEY'));
 return gmP||(gmP=new Promise((ok,ko)=>{window.__gm=ok;const s=document.createElement('script');s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(apiKey())+'&callback=__gm&language=es&region=ES';s.onerror=()=>{gmP=null;ko(new Error('No se pudo cargar Google Maps'))};document.head.appendChild(s)}))}
async function pickMap(){const box=$('#pick');box.innerHTML='<div class="map" id="pmap"></div><p class="muted">Toca el mapa para fijar el centro.</p>';
 try{await loadMaps()}catch(e){box.innerHTML=`<div class="warn">${e.message=='NOKEY'?'Para usar el mapa necesitas la clave de Google en ⚙ Configuración.':esc(e.message)}</div>`;return}
 const c=S.center||{lat:28.4636,lng:-16.2518},m=new google.maps.Map($('#pmap'),{center:c,zoom:12,mapTypeId:'hybrid',streetViewControl:false});
 const circ=new google.maps.Circle({map:m,center:c,radius:S.radius,strokeColor:'#C8102E',fillColor:'#C8102E',fillOpacity:.12,clickable:false});const mk=new google.maps.Marker({map:m,position:c});
 m.addListener('click',ev=>{const p={lat:ev.latLng.lat(),lng:ev.latLng.lng()};setCenter(p,'elegido en mapa');circ.setCenter(p);mk.setPosition(p);$('#ctxt').innerHTML=`Centro: <b>${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}</b> · elegido en mapa`;document.querySelector('.big').disabled=!S.cats.length})}
function toRec(x,old){const p=x.p,now=Date.now();const base={id:p.id,name:(p.displayName&&p.displayName.text)||'(sin nombre)',addr:p.formattedAddress||'',phone:p.nationalPhoneNumber||'',types:p.types||[],
 loc:x.loc,maps:p.googleMapsUri||'',rating:p.rating||null,biz:p.businessStatus||'',upd:old?old.upd:now};
 if(old)return{...old,...base,cats:[...new Set([...(old.cats||[]),...x.cats])]};return{...base,cats:x.cats,marks:[],principal:'',notas:'',fechaVisita:'',hist:[{t:now,txt:'Encontrado en búsqueda'}],creado:now}}
async function store(list){await reload();const m=new Map(S.locs.map(l=>[l.id,l]));let nuevos=0;const out=list.filter(x=>x.p.businessStatus!='CLOSED_PERMANENTLY').map(x=>{const o=m.get(x.p.id);if(!o)nuevos++;return toRec(x,o)});await DB.putMany(out);await reload();return nuevos}
async function buscar(){if(!apiKey())return toast('Falta la clave de Google en ⚙ Configuración');
 const maxCalls=+(localStorage.getItem('tpros_maxcalls')||400),minR=+(localStorage.getItem('tpros_minr')||1000),e=estimateCalls(S.radius,S.cats.length,minR);
 if(e.max>60&&!confirm(`Esta búsqueda puede hacer hasta ${e.max} llamadas a Google (≈${(e.max*PRICE_1000/1000).toFixed(2)} US$ fuera del cupo gratuito). ¿Continuar?`))return;
 S.ctrl=new AbortController();const pg=$('#prog');pg.innerHTML=`<div class="card"><div class="bar"><i id="pbar"></i></div><p id="ptxt">Iniciando…</p><button class="btn gray" onclick="S.ctrl.abort()">✖ Cancelar</button></div>`;
 try{const r=await sweep({center:S.center,radius:S.radius,cats:S.cats,minR,maxCalls,signal:S.ctrl.signal,onProgress:p=>{$('#pbar').style.width=Math.round(100*p.calls/p.planned)+'%';$('#ptxt').textContent=`Llamadas: ${p.calls} / ${p.planned} previstas · ${p.found} establecimientos únicos`}});
  const n=await store(r.list);S.lastIds=new Set(r.list.map(x=>x.p.id));
  pg.innerHTML=`<div class="card ok">✅ ${r.list.length} establecimientos encontrados (${n} nuevos) con ${r.calls} llamadas.${r.truncated?' <b>Se alcanzó el límite de llamadas</b>: puede faltar alguno en zonas muy densas.':''}<br><button class="btn" onclick="S.f.zona=true;go('visitas')">Ver listado</button> <button class="btn gray" onclick="S.f.zona=true;go('mapa')">Ver en mapa</button></div>`}
 catch(err){pg.innerHTML=`<div class="warn">${err.name=='AbortError'?'Búsqueda cancelada.':err.message=='NOKEY'?'Falta la clave.':'Error de Google: '+esc(err.message)}</div>`}}
async function buscarTexto(){const q=$('#tq').value.trim();if(!q)return;if(!S.center)return toast('Elige primero un centro');
 try{const res=await textSearch(q,S.center,S.radius);const n=await store(res.filter(p=>p.location).map(p=>({p,loc:{lat:p.location.latitude,lng:p.location.longitude},cats:[]})));toast(res.length+' resultados ('+n+' nuevos)');S.f.q='';go('visitas')}
 catch(e){toast(e.message=='NOKEY'?'Falta la clave de Google':'Error: '+e.message)}}
/* ---------- FILTROS ---------- */
function filtered(){const f=S.f,q=f.q.toLowerCase();return S.locs.filter(l=>{
 if(f.est=='pendientes'&&l.principal)return false;if(f.est=='visitados'&&!(l.principal&&l.principal!='sin'))return false;
 if(!['todos','pendientes','visitados'].includes(f.est)&&l.principal!=f.est&&!(l.marks||[]).includes(f.est))return false;
 if(f.cat&&!(l.cats||[]).includes(f.cat))return false;if(f.zona&&S.center&&distM(S.center,l.loc)>S.radius)return false;
 if(q&&!(l.name+' '+l.addr).toLowerCase().includes(q))return false;return true}).sort((a,b)=>S.center?distM(S.center,a.loc)-distM(S.center,b.loc):a.name.localeCompare(b.name))}
function filtersHTML(){const f=S.f,cnt=k=>S.locs.filter(l=>k=='pendientes'?!l.principal:k=='visitados'?l.principal&&l.principal!='sin':l.principal==k||(l.marks||[]).includes(k)).length;
 return`<div class="card filt"><div class="chips">${[['todos','Todos',S.locs.length],['pendientes','Pendientes',cnt('pendientes')],['visitados','Visitados',cnt('visitados')],...EST.map(e=>[e[0],e[1],cnt(e[0])])].map(([k,n,c])=>`<button class="${f.est==k?'on':''}" style="${EST.find(e=>e[0]==k)?'--c:'+estC(k):''}" onclick="S.f.est='${k}';R[S.view]()">${n} <small>${c}</small></button>`).join('')}</div>
 <div class="row"><select onchange="S.f.cat=this.value;R[S.view]()"><option value="">Todas las categorías</option>${CATS.map(c=>`<option value="${c[0]}" ${f.cat==c[0]?'selected':''}>${c[1]}</option>`).join('')}</select>
 <label class="ck"><input type="checkbox" ${f.zona?'checked':''} onchange="S.f.zona=this.checked;R[S.view]()"> Solo zona actual (${fmtKm(S.radius)})</label></div></div>`}
/* ---------- MIS VISITAS ---------- */
R.visitas=async()=>{await reload();const L=filtered();
 $('#main').innerHTML=`<div class="row"><button class="btn" onclick="go('informe')">📄 Informe del día</button><input placeholder="🔍 Buscar por nombre o dirección" value="${esc(S.f.q)}" oninput="S.f.q=this.value;clearTimeout(window._q);window._q=setTimeout(()=>{R.visitas().then(()=>{const i=$('#main input');i.focus();i.setSelectionRange(99,99)})},400)"></div>${filtersHTML()}
 <p class="muted">${L.length} establecimientos</p>${L.length?L.map(card).join(''):'<div class="card muted">No hay establecimientos con estos filtros. Haz una búsqueda en la pestaña Buscar.</div>'}`};
function card(l){const d=S.center?distM(S.center,l.loc):null;return`<div class="loc" style="--c:${estC(l.principal)}"><div onclick="ficha('${l.id}')"><b>${esc(l.name)}</b><span class="badge">${estN(l.principal)}</span>
 <div class="muted">${esc(l.addr)}</div><div class="muted">${(l.cats||[]).map(catN).join(', ')}${d!=null?' · '+fmtKm(Math.round(d/100)*100):''}${l.rating?' · ★'+l.rating:''}${l.fechaVisita?' · visita '+l.fechaVisita:''}</div>
 ${(l.marks||[]).length?`<div class="mk">${l.marks.map(m=>`<i style="background:${estC(m)}">${estN(m)}</i>`).join('')}</div>`:''}</div>${acts(l)}</div>`}
const acts=l=>`<div class="acts">${l.phone?`<a href="tel:${l.phone.replace(/\s/g,'')}">📞 Llamar</a>`:''}<a target="_blank" href="${l.maps||'https://www.google.com/maps/search/?api=1&query='+l.loc.lat+','+l.loc.lng}">📍 Maps</a><a target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${l.loc.lat},${l.loc.lng}${l.id?'&destination_place_id='+l.id:''}">🚗 Cómo llegar</a><button onclick="ficha('${l.id}')">✏️ Ficha</button><button class="presu" onclick="hacerPresu('${l.id}')">📝 Hacer presupuesto</button></div>`;
async function ficha(id){const l=await DB.get(id);const ov=document.createElement('div');ov.className='ov';ov.innerHTML=`<div class="sheet"><button class="x" onclick="this.closest('.ov').remove()">✕</button>
 <h2>${esc(l.name)}</h2><p class="muted">${esc(l.addr)}${l.phone?'<br>📞 '+esc(l.phone):''}</p>${acts(l)}
 <h3>Checklist</h3><div class="cl">${EST.map(e=>`<label class="ck big2" style="--c:${e[2]}"><input type="checkbox" value="${e[0]}" ${(l.marks||[]).includes(e[0])?'checked':''}> ${e[1]}</label>`).join('')}</div>
 <label>Estado principal</label><select id="fp"><option value="">Pendiente (sin visitar)</option>${EST.map(e=>`<option value="${e[0]}" ${l.principal==e[0]?'selected':''}>${e[1]}</option>`).join('')}</select>
 <label>Fecha de visita</label><input type="date" id="ff" value="${l.fechaVisita||''}"><label>Notas</label><textarea id="fn" rows="3" placeholder="Persona de contacto, horario, plagas detectadas…">${esc(l.notas)}</textarea>
 <button class="big" id="fs">💾 Guardar</button><h3>Historial</h3><ul class="hist">${(l.hist||[]).slice().reverse().map(h=>`<li><small>${new Date(h.t).toLocaleString('es-ES')}</small> ${esc(h.txt)}</li>`).join('')}</ul></div>`;
 document.body.appendChild(ov);
 ov.querySelectorAll('.cl input').forEach(i=>i.onchange=()=>{const ch=[...ov.querySelectorAll('.cl input:checked')].map(x=>x.value);if(i.checked)$('#fp').value=i.value;else if($('#fp').value==i.value)$('#fp').value=ch[ch.length-1]||'';if(i.checked&&!$('#ff').value)$('#ff').value=today()});
 $('#fs').onclick=async()=>{const marks=[...ov.querySelectorAll('.cl input:checked')].map(x=>x.value),pr=$('#fp').value,fv=$('#ff').value,no=$('#fn').value.trim(),ch=[];
  const add=marks.filter(m=>!(l.marks||[]).includes(m)),rem=(l.marks||[]).filter(m=>!marks.includes(m));
  if(add.length)ch.push('✔ '+add.map(estN).join(', '));if(rem.length)ch.push('✖ '+rem.map(estN).join(', '));if(pr!=l.principal)ch.push('Estado: '+estN(pr));
  if(fv!=(l.fechaVisita||''))ch.push('Fecha visita: '+(fv||'—'));if(no!=(l.notas||''))ch.push('Notas: '+no);
  if(ch.length){const now=Date.now();Object.assign(l,{marks,principal:pr,fechaVisita:fv,notas:no,upd:now});l.hist=[...(l.hist||[]),{t:now,txt:ch.join(' · ')}];await DB.put(l);toast('Guardado')}
  ov.remove();R[S.view]()}}
/* ---------- MAPA ---------- */
R.mapa=async()=>{await reload();const L=filtered();
 $('#main').innerHTML=`${filtersHTML()}<div class="map big" id="gmap"></div><div class="legend">${[['','Pendiente'],...EST].map(e=>`<span><i style="background:${estC(e[0])}"></i>${estN(e[0])}</span>`).join('')}</div><p class="muted">${L.length} en el mapa</p>`;
 try{await loadMaps()}catch(e){$('#gmap').innerHTML=`<div class="warn">${e.message=='NOKEY'?'Para ver el mapa pega la clave de Google en ⚙ Configuración.':esc(e.message)}</div>`;return}
 const c=S.center||(L[0]&&L[0].loc)||{lat:28.4636,lng:-16.2518},m=new google.maps.Map($('#gmap'),{center:c,zoom:13,streetViewControl:false});
 if(S.center)new google.maps.Circle({map:m,center:S.center,radius:S.radius,strokeColor:'#C8102E',fillOpacity:.05,fillColor:'#C8102E',clickable:false});
 const b=new google.maps.LatLngBounds(),iw=new google.maps.InfoWindow();L.forEach(l=>{const mk=new google.maps.Marker({map:m,position:l.loc,title:l.name,icon:{path:google.maps.SymbolPath.CIRCLE,scale:9,fillColor:estC(l.principal),fillOpacity:1,strokeColor:'#fff',strokeWeight:2}});b.extend(l.loc);
  mk.addListener('click',()=>{iw.setContent(`<div style="max-width:240px"><b>${esc(l.name)}</b><br><small>${esc(l.addr)}</small><br><b style="color:${estC(l.principal)}">${estN(l.principal)}</b><br><a href="#" onclick="ficha('${l.id}');return false">✏️ Abrir ficha</a></div>`);iw.open(m,mk)})});
 if(L.length>1)m.fitBounds(b)};
/* ---------- CONFIG ---------- */
R.cfg=()=>{const k=apiKey();$('#main').innerHTML=`<div class="card"><h2>🔑 Clave de Google Maps</h2><p class="muted">Necesita <b>Places API (New)</b> y <b>Maps JavaScript API</b>. Se guarda solo en este dispositivo.</p>
 <input id="ck" type="password" placeholder="AIza…" value="${esc(k)}"><div class="row"><button class="btn" onclick="localStorage.setItem('tpros_key',$('#ck').value.trim());gmP=null;toast('Clave guardada')">Guardar clave</button><button class="btn gray" onclick="$('#ck').type=$('#ck').type=='password'?'text':'password'">👁 Ver</button></div><p class="muted">Estado: ${k?'✅ clave configurada':'❌ sin clave'}</p></div>
 <div class="card"><h2>👤 Comercial</h2><label>Nombre del comercial (sale en el informe)</label><input id="cn" value="${esc(localStorage.getItem('tpros_comercial')||'')}" onchange="localStorage.setItem('tpros_comercial',this.value.trim());toast('Guardado')"></div>
 <div class="card"><h2>⚙ Barrido</h2><label>Límite de llamadas por búsqueda</label><input type="number" min="10" max="3000" value="${localStorage.getItem('tpros_maxcalls')||400}" onchange="localStorage.setItem('tpros_maxcalls',this.value)">
 <label>Radio mínimo de subdivisión (m)</label><input type="number" min="300" max="5000" step="100" value="${localStorage.getItem('tpros_minr')||1000}" onchange="localStorage.setItem('tpros_minr',this.value)"><p class="muted">Más pequeño = encuentra más locales en zonas densas, pero más llamadas.</p></div>
 <div class="card"><h2>💾 Copias de seguridad</h2><div class="row wrap"><button class="btn" onclick="exportJSON()">⬇ Exportar copia (JSON)</button><button class="btn" onclick="$('#imp').click()">⬆ Restaurar copia</button><button class="btn gray" onclick="exportCSV()">📊 Exportar CSV (Excel)</button></div><input type="file" id="imp" accept=".json,application/json" hidden onchange="importJSON(this.files[0])">
 <p class="muted">${S.locs.length} establecimientos guardados.</p><button class="btn red" onclick="if(confirm('¿Borrar TODOS los establecimientos y visitas?'))DB.clear().then(reload).then(()=>{toast('Borrado');R.cfg()})">🗑 Borrar todo</button></div>`};
function dl(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);toast('Descargado: '+name)}
async function exportJSON(){await reload();dl(new Blob([JSON.stringify({app:'teprospeccion',v:1,fecha:new Date().toISOString(),locales:S.locs},null,1)],{type:'application/json'}),'teprospeccion-copia-'+today()+'.json')}
async function importJSON(f){if(!f)return;try{const j=JSON.parse(await f.text());const a=j.locales||j;if(!Array.isArray(a))throw 0;await DB.putMany(a);await reload();toast(a.length+' establecimientos restaurados');R.cfg()}catch(e){toast('Archivo no válido')}}
async function exportCSV(){await reload();const q=v=>'"'+String(v??'').replace(/"/g,'""')+'"',h=['Nombre','Dirección','Teléfono','Categorías','Estado','Marcas','Fecha visita','Notas','Valoración','Lat','Lng','Google Maps'];
 const rows=S.locs.map(l=>[l.name,l.addr,l.phone,(l.cats||[]).map(catN).join(', '),estN(l.principal),(l.marks||[]).map(estN).join(', '),l.fechaVisita,l.notas,l.rating,l.loc.lat,l.loc.lng,l.maps].map(q).join(';'));
 dl(new Blob(['\ufeff'+[h.map(q).join(';'),...rows].join('\r\n')],{type:'text/csv'}),'teprospeccion-'+today()+'.csv')}
if('serviceWorker' in navigator&&location.protocol=='https:')navigator.serviceWorker.register('sw.js');
syncPresu().catch(e=>console.warn(e)).then(reload).then(()=>go('buscar'));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState=='visible')syncPresu().then(n=>{if(n&&['visitas','mapa'].includes(S.view))R[S.view]()}).catch(e=>console.warn(e))});
window.addEventListener('pageshow',e=>{if(e.persisted)syncPresu().then(n=>{if(n)R[S.view]()})});

/* ---------- INTEGRACIÓN TePresupuesto ---------- */
var TP_CAT_PRI=['bar','cafe','rest','carn','pan','super','mini','taller','inmo','hotel','farm','gym','pelu','cole','clin','alm'];
async function hacerPresu(id){const l=await DB.get(id);if(!l)return;const cat=TP_CAT_PRI.find(c=>(l.cats||[]).includes(c))||(l.cats||[])[0]||'';
 l.hist=[...(l.hist||[]),{t:Date.now(),txt:'Abierto en TePresupuesto'}];l.upd=Date.now();await DB.put(l);
 const q=new URLSearchParams({nuevo:'1',from:'tpros',pid:l.id,nombre:l.name||'',dir:l.addr||'',tel:l.phone||'',cat,lat:l.loc?l.loc.lat:'',lon:l.loc?l.loc.lng:''});
 location.href='../tepresupuesto/?'+q.toString()}
var _syncing=null;
function syncPresu(){return _syncing||(_syncing=(async()=>{let a;try{a=JSON.parse(localStorage.getItem('tpros_sync')||'[]')}catch(e){a=[]}if(!Array.isArray(a)||!a.length)return 0;
 let n=0;const done=new Set();
 for(const it of a){const l=it&&it.pid&&await DB.get(it.pid);done.add(it);if(!l)continue;const t=Date.parse(it.fecha)||Date.now();
  if((l.hist||[]).some(h=>h.ref&&h.ref==it.ref))continue;
  l.marks=[...new Set([...(l.marks||[]),'presu'])];l.principal='presu';if(!l.fechaVisita)l.fechaVisita=dayOf(t);
  l.hist=[...(l.hist||[]),{t,ref:it.ref,txt:'Presupuesto entregado'+(it.ref?' ('+it.ref+')':'')+' · desde TePresupuesto'}];l.upd=Date.now();await DB.put(l);n++}
 let cur;try{cur=JSON.parse(localStorage.getItem('tpros_sync')||'[]')}catch(e){cur=[]}
 const left=cur.filter(x=>![...done].some(d=>d.pid==x.pid&&d.ref==x.ref&&d.fecha==x.fecha));
 left.length?localStorage.setItem('tpros_sync',JSON.stringify(left)):localStorage.removeItem('tpros_sync');
 if(n){await reload();toast(n==1?'✓ 1 local marcado como «Presupuesto entregado»':'✓ '+n+' locales marcados como «Presupuesto entregado»')}return n})().finally(()=>{_syncing=null}))}
