// Informe del día: PDF con jsPDF + html2canvas (local), pre-generado, compartible
const INF={date:null,blob:null,name:''};
R.informe=async()=>{await reload();INF.date=INF.date||today();INF.blob=null;
 const d=INF.date,L=S.locs.filter(l=>(l.hist||[]).some(h=>dayOf(h.t)==d&&h.txt!='Encontrado en búsqueda')||l.fechaVisita==d)
  .map(l=>{const hs=(l.hist||[]).filter(h=>dayOf(h.t)==d&&h.txt!='Encontrado en búsqueda');return{...l,hora:hs.length?new Date(hs[hs.length-1].t).toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'}):'—'}}).sort((a,b)=>a.hora.localeCompare(b.hora));
 const tot=[['','Pendiente'],...EST].map(e=>[e,L.filter(l=>(l.principal||'')==e[0]).length]).filter(x=>x[1]),com=localStorage.getItem('tpros_comercial')||'—',fl=d.split('-').reverse().join('/');
 $('#main').innerHTML=`<div class="card row"><button class="btn gray" onclick="go('visitas')">← Volver</button><label style="margin:0">Fecha</label><input type="date" value="${d}" onchange="INF.date=this.value;R.informe()"></div>
 <div class="card"><p id="pst" class="muted">⏳ Preparando PDF…</p><div class="row wrap"><button class="btn" id="bsh" onclick="infShare()" disabled>📤 Enviar (WhatsApp / email)</button><button class="btn gray" id="bdl" onclick="infDl()" disabled>⬇ Descargar PDF</button></div></div>
 <div class="doc" id="idoc"><div class="dh"><img src="logo.png"><div><b>TENEPLAGAS S.L.</b><br><small>Control de plagas</small></div><div class="dr"><h1>INFORME DE VISITAS</h1><div>Fecha: <b>${fl}</b></div><div>Comercial: <b>${esc(com)}</b></div></div></div>
 <h3>Resumen</h3><div class="sum"><div class="tot"><b>${L.length}</b><small>establecimientos</small></div>${tot.map(([e,n])=>`<div style="--c:${estC(e[0])}"><b>${n}</b><small>${estN(e[0])}</small></div>`).join('')}</div>
 <h3>Detalle</h3>${L.length?`<table><thead><tr><th>Hora</th><th>Establecimiento</th><th>Teléfono</th><th>Categoría</th><th>Estado / marcas</th><th>Notas</th></tr></thead><tbody>${L.map(l=>`<tr><td>${l.hora}</td><td><b>${esc(l.name)}</b><br><small>${esc(l.addr)}</small></td><td>${esc(l.phone)}</td><td>${(l.cats||[]).map(catN).join(', ')}</td><td><b style="color:${estC(l.principal)}">${estN(l.principal)}</b><br><small>${(l.marks||[]).filter(m=>m!=l.principal).map(estN).join(', ')}</small></td><td>${esc(l.notas)}</td></tr>`).join('')}</tbody></table>`:'<p class="muted">No hay visitas registradas este día.</p>'}
 <p class="foot">Teneplagas S.L. · Informe generado el ${new Date().toLocaleString('es-ES')}</p></div>`;
 INF.name=`Informe-visitas-${d}-${(com||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\w]+/g,'-').slice(0,20)}.pdf`.replace(/-+\.pdf$/,'.pdf');
 try{INF.blob=await infPDF();$('#pst').textContent='✓ PDF listo para enviar';$('#bsh').disabled=$('#bdl').disabled=false}catch(e){$('#pst').textContent='Error generando PDF: '+e.message}};
async function infPDF(){const src=$('#idoc'),W=794,H=Math.round(W*297/210);const box=document.createElement('div');box.style.cssText=`position:fixed;left:-10000px;top:0;width:${W}px;background:#fff`;
 const cl=src.cloneNode(true);cl.style.cssText=`width:${W}px;max-width:none;margin:0;padding:40px;box-shadow:none;border-radius:0`;box.appendChild(cl);document.body.appendChild(box);
 await Promise.all([...cl.querySelectorAll('img')].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r})));
 const t0=cl.getBoundingClientRect().top,blocks=[...cl.querySelectorAll('tr,h3,.sum')].map(e=>{const r=e.getBoundingClientRect();return[r.top-t0,r.bottom-t0]});
 const sc=2,cv=await html2canvas(cl,{scale:sc,backgroundColor:'#fff',logging:false});box.remove();
 const total=cv.height/sc,pdf=new jspdf.jsPDF({unit:'px',format:[W,H],hotfixes:['px_scaling'],compress:true});let y=0,pg=0;
 while(y<total-2){let end=Math.min(y+H-30,total);if(end<total){const cut=blocks.filter(([a,b])=>a<end&&b>end&&a>y+60).map(([a])=>a);if(cut.length)end=Math.min(...cut)-2}
  const h=end-y,pc=document.createElement('canvas');pc.width=cv.width;pc.height=Math.ceil(h*sc);const x=pc.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,pc.width,pc.height);x.drawImage(cv,0,-y*sc);
  if(pg++)pdf.addPage([W,H]);pdf.addImage(pc.toDataURL('image/jpeg',.9),'JPEG',0,0,W,h);y=end}
 return pdf.output('blob')}
async function infShare(){const f=new File([INF.blob],INF.name,{type:'application/pdf'});
 if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f]});return}catch(e){if(e.name=='AbortError')return}}infDl()}
function infDl(){dl(INF.blob,INF.name)}
