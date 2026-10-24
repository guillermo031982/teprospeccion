/* Actualizador in-app. NUNCA toca IndexedDB ni localStorage. En cada release subir APP_V y version.json */
const APP_V=4,APP_CP='tpros-';
(function(){
let LAST=0,NEWV=0;
function tst(m){if(window.toast)toast(m);else alert(m)}
async function remoteV(){const r=await fetch('version.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('http');return +(await r.json()).v}
function banner(v){if(document.getElementById('updBanner'))return;const b=document.createElement('div');b.id='updBanner';b.style.cssText='position:relative;z-index:50;background:#C8102E;color:#fff;padding:10px 14px;font:600 15px system-ui;display:flex;justify-content:center;gap:10px;align-items:center;box-shadow:0 2px 8px #0004';b.innerHTML='Hay una versión nueva (v'+v+') · <button style="background:#fff;color:#C8102E;border:0;border-radius:6px;padding:6px 12px;font-weight:700" onclick="appUpdateNow()">Actualizar</button><button style="background:none;border:0;color:#fff;font-size:18px" onclick="this.parentNode.remove()" aria-label="Cerrar">✕</button>';document.body.prepend(b)}
async function autoCheck(){if(Date.now()-LAST<30*60e3)return;LAST=Date.now();try{const v=await remoteV();if(v>APP_V){NEWV=v;banner(v)}}catch(e){}}
window.appUpdateNow=async function(){
 try{if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.getRegistration();if(reg){try{await reg.update()}catch(e){}const w=reg.waiting||reg.installing;if(w)w.postMessage('skipWaiting')}}}catch(e){}
 try{if(window.caches){const ks=await caches.keys();await Promise.all(ks.filter(k=>k.startsWith(APP_CP)).map(k=>caches.delete(k)))}}catch(e){}
 const u=new URL(location.href);u.searchParams.set('u',Date.now());location.replace(u.toString())};
window.appCheckUpdate=async function(){const el=document.getElementById('updMsg');const say=h=>{if(el)el.innerHTML=h};say('Buscando…');
 if(!navigator.onLine){say('⚠ Sin conexión a internet. Conéctate y vuelve a intentarlo.');return}
 try{const v=await remoteV();if(v>APP_V){NEWV=v;say('Hay una versión nueva: <b>'+v+'</b> <button style="margin-left:8px;background:#C8102E;color:#fff;border:0;border-radius:8px;padding:9px 14px;font-weight:700;font-size:15px" onclick="appUpdateNow()">Actualizar ahora</button>')}else{say('✓ Ya tienes la última versión');tst('✓ Ya tienes la última versión')}}
 catch(e){say('⚠ No se pudo comprobar (sin conexión o servidor no disponible).')}};
window.updCard=()=>'<div class="card" id="updCard"><h3 style="margin:0 0 8px;color:#C8102E">🔄 Actualizaciones</h3><div>Versión instalada: <b>'+APP_V+'</b></div><button style="margin-top:8px;background:#C8102E;color:#fff;border:0;border-radius:8px;padding:9px 14px;font-weight:700;font-size:15px" onclick="appCheckUpdate()">🔄 Buscar actualización</button><div id="updMsg" style="margin-top:8px"></div><small style="color:#777">Actualizar no borra tus datos.</small></div>';
addEventListener('load',autoCheck);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')autoCheck()});
})();
