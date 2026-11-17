/* Accès réservé : page de mot de passe devant les cartes par section de vote.
   Simple barrière (le mot de passe n'est pas écrit en clair, seulement son empreinte SHA-256). */
(function(){
 var H='f27ea2c9ced12e01e115794ea7ff54a87ac1ed5fe2a78d163ebd0ced761526d5',K='aeq_acces';
 try{if(localStorage.getItem(K)===H)return;}catch(e){}
 document.documentElement.classList.add('gated');
 var css=document.createElement('style');
 css.textContent='html.gated body>*:not(#gate){display:none!important}html.gated body{overflow:hidden}'+
 '#gate{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;padding:20px;background:#0b0d12;font-family:Inter,system-ui,sans-serif;color:#f2f4f8}'+
 '#gate::before{content:"";position:absolute;inset:0;background:radial-gradient(45vw 45vw at 0% 0%,rgba(74,141,255,.45),transparent 70%),radial-gradient(40vw 40vw at 100% 15%,rgba(139,108,240,.35),transparent 70%)}'+
 '#gate form{position:relative;width:100%;max-width:380px;background:rgba(22,26,34,.7);border:1px solid rgba(255,255,255,.1);border-radius:24px;padding:28px 26px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:0 30px 70px rgba(0,0,0,.5)}'+
 '#gate .lg{width:44px;height:44px;border-radius:13px;background:linear-gradient(135deg,#4a8dff,#7b5cf0);margin-bottom:16px;display:grid;place-items:center}'+
 '#gate h1{font:800 1.45rem/1.15 Inter,system-ui,sans-serif;letter-spacing:-.02em;margin:0 0 6px}'+
 '#gate p{color:#a9b0bd;font-size:.9rem;line-height:1.45;margin:0 0 18px}'+
 '#gate input{width:100%;box-sizing:border-box;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;color:#f2f4f8;font:500 1rem Inter,system-ui,sans-serif;outline:none}'+
 '#gate input:focus{border-color:rgba(255,255,255,.3)}'+
 '#gate button{width:100%;margin-top:10px;border:0;border-radius:12px;padding:12px;background:#f2f4f8;color:#111;font:700 .95rem Inter,system-ui,sans-serif;cursor:pointer}'+
 '#gate .er{color:#ff8f86;font-size:.84rem;min-height:1.2em;margin-top:10px}'+
 '#gate a{color:#a9b0bd;font-size:.84rem}';
 document.head.appendChild(css);
 function sha(t){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)).then(function(b){return Array.from(new Uint8Array(b)).map(function(x){return x.toString(16).padStart(2,'0')}).join('')});}
 function show(){var g=document.createElement('div');g.id='gate';
  g.innerHTML='<form><div class="lg"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>'+
  '<h1>Accès réservé</h1><p>Les cartes par section de vote de l’Atlas électoral du Québec sont réservées aux équipes. Entrez le mot de passe qu’on vous a transmis.</p>'+
  '<input type="password" autocomplete="current-password" placeholder="Mot de passe" aria-label="Mot de passe" required><button type="submit">Entrer</button><div class="er" role="alert"></div>'+
  '<a href="../../">← Retour à l’accueil de l’atlas</a></form>';
  document.body.appendChild(g);var f=g.querySelector('form'),i=g.querySelector('input'),er=g.querySelector('.er');i.focus();
  f.onsubmit=function(e){e.preventDefault();sha('aeq:'+i.value.trim()).then(function(h){
   if(h===H){try{localStorage.setItem(K,H);}catch(x){}location.reload();}
   else{er.textContent='Mot de passe incorrect.';i.select();}});};}
 if(document.body)show();else document.addEventListener('DOMContentLoaded',show);
})();
