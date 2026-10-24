// Google Places API (New) – búsqueda cercana con barrido adaptativo
const CATS=[['bar','Bares',['bar','pub']],['cafe','Cafeterías',['cafe','coffee_shop']],['rest','Restaurantes',['restaurant']],['inmo','Inmobiliarias',['real_estate_agency']],
['super','Supermercados',['supermarket']],['mini','Minimercados / ultramarinos',['convenience_store','grocery_store']],['taller','Talleres',['car_repair']],['carn','Carnicerías',['butcher_shop']],
['pan','Panaderías / pastelerías',['bakery']],['hotel','Hoteles / apartamentos',['hotel','lodging']],['farm','Farmacias',['pharmacy']],['gym','Gimnasios',['gym']],
['pelu','Peluquerías / estética',['hair_salon','beauty_salon']],['cole','Colegios / guarderías',['school','preschool']],['clin','Clínicas / veterinarios',['dental_clinic','veterinary_care','doctor']],
['alm','Almacenes / naves',['storage','warehouse_store']]];
const FIELDS='places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.types,places.businessStatus,places.googleMapsUri,places.rating';
const PRICE_1000=35;// USD aprox. por 1000 llamadas (Nearby Search, SKU Enterprise por teléfono/valoración)
const apiKey=()=>localStorage.getItem('tpros_key')||'';
async function placesCall(url,body,signal){const k=apiKey();if(!k)throw new Error('NOKEY');
 const r=await fetch(url,{method:'POST',signal,headers:{'Content-Type':'application/json','X-Goog-Api-Key':k,'X-Goog-FieldMask':FIELDS},body:JSON.stringify(body)});
 const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error((j.error&&j.error.message)||('HTTP '+r.status));return j.places||[]}
const nearby=(c,rad,types,signal)=>placesCall('https://places.googleapis.com/v1/places:searchNearby',{includedTypes:types,maxResultCount:20,languageCode:'es',regionCode:'ES',
 locationRestriction:{circle:{center:{latitude:c.lat,longitude:c.lng},radius:Math.min(50000,Math.round(rad))}}},signal);
const textSearch=(q,c,rad,signal)=>placesCall('https://places.googleapis.com/v1/places:searchText',{textQuery:q,pageSize:20,languageCode:'es',regionCode:'ES',
 locationBias:{circle:{center:{latitude:c.lat,longitude:c.lng},radius:Math.min(50000,Math.round(rad))}}},signal);
// 7 círculos de radio r/2 cubren un círculo de radio r: centro + 6 a distancia r·√3/2
function hex7(c,r){const d=r*Math.sqrt(3)/2,o=[c];for(let i=0;i<6;i++){const a=i*Math.PI/3;o.push(offset(c,d*Math.cos(a),d*Math.sin(a)))}return o}
function offset(c,dx,dy){return{lat:c.lat+dy/111320,lng:c.lng+dx/(111320*Math.cos(c.lat*Math.PI/180))}}
function distM(a,b){const R=6371e3,t=Math.PI/180,x=(b.lng-a.lng)*t*Math.cos((a.lat+b.lat)/2*t),y=(b.lat-a.lat)*t;return Math.sqrt(x*x+y*y)*R}
// estimación del peor caso: cada nivel multiplica ×7 hasta minR
function estimateCalls(R,ncat,minR){let n=1,r=R,tot=1;while(r/2>=minR){r/=2;n*=7;tot+=n}return{min:ncat,max:Math.min(tot*ncat,+(localStorage.getItem('tpros_maxcalls')||400))}}
/* Barrido adaptativo: por categoría, llama al círculo completo; si devuelve 20 (saturado), lo divide en 7 subcírculos
   de radio mitad y repite, hasta minR o hasta agotar el límite de llamadas. Deduplica por id y descarta fuera del radio. */
async function sweep({center,radius,cats,minR=1000,maxCalls=400,onProgress,signal}){
 const found=new Map();let calls=0,truncated=false;const queue=[];
 cats.forEach(k=>{const cat=CATS.find(c=>c[0]==k);queue.push({c:center,r:radius,cat})});
 let planned=queue.length;
 while(queue.length){if(signal&&signal.aborted)throw new DOMException('cancel','AbortError');
  if(calls>=maxCalls){truncated=true;break}
  const job=queue.shift();calls++;const res=await nearby(job.c,job.r,job.cat[2],signal);
  for(const p of res){if(!p.location)continue;const loc={lat:p.location.latitude,lng:p.location.longitude};if(distM(center,loc)>radius)continue;
   const o=found.get(p.id);if(o){if(!o.cats.includes(job.cat[0]))o.cats.push(job.cat[0])}else found.set(p.id,{p,loc,cats:[job.cat[0]]})}
  if(res.length>=20&&job.r/2>=minR){hex7(job.c,job.r).forEach(c=>queue.push({c,r:job.r/2,cat:job.cat}));planned+=7}
  onProgress&&onProgress({calls,planned,found:found.size})}
 return{list:[...found.values()],calls,truncated}}
