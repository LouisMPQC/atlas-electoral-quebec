/* Accès réservé : chaque circonscription a son propre code. Rien n'est mémorisé :
   le code est redemandé à chaque ouverture de la page. La page ne contient que l'empreinte SHA-256 du code. */
(function(){
 try{localStorage.removeItem('aeq_acces');}catch(e){}
 var G=window.AEQ_G,M={s:"b83644fb6d1e0146",h:"f8f968e55dc15d62b748d58a3fbf6389f32b746d17d34fe9293dd679e41cb168"};if(!G)return;
 document.documentElement.classList.add('gated');
 var css=document.createElement('style');
 css.textContent='html.gated body>*:not(#gate){display:none!important}html.gated body{overflow:hidden}'+
 '#gate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;background:#0b0d12;font-family:Inter,system-ui,sans-serif;color:#f2f4f8}'+
 '#gate::before{content:"";position:absolute;inset:0;background:radial-gradient(45vw 45vw at 0% 0%,rgba(74,141,255,.45),transparent 70%),radial-gradient(40vw 40vw at 100% 15%,rgba(139,108,240,.35),transparent 70%)}'+
 '#gate form{position:relative;width:100%;max-width:390px;background:rgba(22,26,34,.7);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:28px 26px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 30px 70px rgba(0,0,0,.5)}'+
 '#gate .lg{width:44px;height:44px;border-radius:13px;background:linear-gradient(135deg,#4a8dff,#7b5cf0);margin-bottom:16px;display:grid;place-items:center}'+
 '#gate .k{font:700 .7rem Inter,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#737b8a;margin-bottom:6px}'+
 '#gate h1{font:800 1.45rem/1.15 Inter,system-ui,sans-serif;letter-spacing:-.02em;margin:0 0 6px}'+
 '#gate p{color:#a9b0bd;font-size:.9rem;line-height:1.45;margin:0 0 18px}'+
 '#gate input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;color:#f2f4f8;font:600 1.05rem Inter,system-ui,sans-serif;letter-spacing:.3em;text-align:center;font-size:1.4rem;outline:none}'+
 '#gate input::placeholder{letter-spacing:0;font-size:1rem;font-weight:500}'+
 '#gate input:focus{border-color:rgba(255,255,255,.3)}'+
 '#gate button{width:100%;margin-top:10px;border:0;border-radius:12px;padding:12px;background:#f2f4f8;color:#111;font:700 .95rem Inter,system-ui,sans-serif;cursor:pointer}'+
 '#gate .er{color:#ff8f86;font-size:.84rem;min-height:1.2em;margin-top:10px}'+
 '#gate a{color:#a9b0bd;font-size:.84rem}';
 document.head.appendChild(css);
 function sha(t){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('')});}
 var essais=0;
 function show(){var g=document.createElement('div');g.id='gate';
  var nom=(document.title||'').split(' · ')[0];
  g.innerHTML='<form autocomplete="off"><div class="lg"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>'+
  '<div class="k">Accès réservé</div><h1></h1><p>La carte par section de vote de cette circonscription est réservée à son équipe. Entrez le code d’accès qu’on vous a transmis. Il sera redemandé à chaque visite.</p>'+
  '<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="Code à 3 chiffres" aria-label="Code d’accès" required><button type="submit">Entrer</button><div class="er" role="alert"></div>'+
  '<a href="../../">← Retour à l’accueil de l’atlas</a></form>';
  g.querySelector('h1').textContent=nom;
  document.body.appendChild(g);var f=g.querySelector('form'),i=g.querySelector('input'),er=g.querySelector('.er'),b=g.querySelector('button');i.focus();
  f.onsubmit=function(e){e.preventDefault();if(b.disabled)return;
   var v=i.value.replace(/\D/g,'');
   Promise.all([sha(G.s+':'+v),sha(M.s+':'+v)]).then(function(r){
    if(r[0]===G.h||r[1]===M.h){document.documentElement.classList.remove('gated');g.remove();window.dispatchEvent(new Event('aeq-unlock'));}
    else{essais++;er.textContent='Code incorrect.';i.select();
     if(essais>=5){b.disabled=true;var t=30;er.textContent='Trop d’essais. Réessayez dans '+t+' s.';var it=setInterval(function(){t--;if(t<=0){clearInterval(it);b.disabled=false;essais=0;er.textContent='';}else er.textContent='Trop d’essais. Réessayez dans '+t+' s.';},1000);}}});};}
 if(document.body)show();else document.addEventListener('DOMContentLoaded',show);
})();
