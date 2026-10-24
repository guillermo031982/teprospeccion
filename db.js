const DB={db:null,open(){return this.db?Promise.resolve(this.db):new Promise((ok,ko)=>{const r=indexedDB.open('teprospeccion',1);r.onupgradeneeded=()=>r.result.createObjectStore('locales',{keyPath:'id'});r.onsuccess=()=>ok(this.db=r.result);r.onerror=()=>ko(r.error)})},
async tx(m,f){const d=await this.open();return new Promise((ok,ko)=>{const t=d.transaction('locales',m),s=t.objectStore('locales'),q=f(s);t.oncomplete=()=>ok(q&&q.result);t.onerror=()=>ko(t.error)})},
all(){return this.tx('readonly',s=>s.getAll())},get(id){return this.tx('readonly',s=>s.get(id))},put(o){return this.tx('readwrite',s=>s.put(o))},
putMany(a){return this.tx('readwrite',s=>{a.forEach(o=>s.put(o))})},clear(){return this.tx('readwrite',s=>s.clear())}};
