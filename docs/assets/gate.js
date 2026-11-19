/* Accès réservé : chaque circonscription a son propre code. Rien n'est mémorisé :
   le code est redemandé à chaque ouverture de la page. La page ne contient que l'empreinte SHA-256 du code. */
(function(){
 try{localStorage.removeItem('aeq_acces');}catch(e){}
 /* Barrière désactivée le 19 novembre 2026 à la demande de Louis : remettre true pour exiger les codes. */
 var ACTIF=/*A*/false/*A*/;if(!ACTIF)return;
 var P=/*P*/[{"i":"p01","s":"3cf2bd7a41f9f0ff","h":"9a9a88b3d996c2cc3c35551fad51c43cfec80bed2fd67d2dea4c9db9ce2fdac8","a":[]},{"i":"p02","s":"65043fd266ac7268","h":"a0488a274814f668909588486753abd571ea7264456b81e4838c74b986892a0d","a":[]},{"i":"p03","s":"cf6a93ba3dd1f52e","h":"5eb7036d061ee6958f69ee73dc0f1b9d6a4c5772e697bf86ca2d05ffd13811ef","a":[]},{"i":"p04","s":"175a57b5abea79ea","h":"b58bb085d96b75b24cc3b6f0bff2bf04d61cc249f2f418fbe69768dcb34dcf29","a":[]},{"i":"p05","s":"d324523474a6cf39","h":"b8c5978c4a4e9dcee2452ffcd078134164504283132a23e4ad10ce79986b8897","a":[]},{"i":"p06","s":"8076ecb2166b84c6","h":"8cd13745def0e5f2774f7f213e221114e056757ed71baded946fc5ba76c5bcc0","a":[]},{"i":"p07","s":"53a1ca41827748ec","h":"462c94febc5db8db8730e64cc8c760ae3cdd52a8837546265bd7bd7729987d77","a":[]}]/*P*/,L=/*L*/""/*L*/;
 var G=window.AEQ_G,M={s:"541b0a8d451bfb9a",h:"488e0c6e53722074ff1008bee7060d47854951c1b66d2d34d7ca7bbf9044db3e"};if(!G)return;
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
 var CLE=location.pathname.replace(/index\.html$/,'').replace(/\/+$/,'').split('/').slice(-2).join('/');
 function permis(a){return (a||[]).some(function(m){return m==='*'||m===CLE||(m.slice(-2)==='/*'&&CLE.indexOf(m.slice(0,-1))===0);});}
 function journal(res,qui){if(!L)return;try{var d=JSON.stringify({page:CLE,resultat:res,qui:qui,appareil:/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?'téléphone':'ordinateur',ecran:screen.width+'x'+screen.height});
  if(!(navigator.sendBeacon&&navigator.sendBeacon(L,d)))fetch(L,{method:'POST',body:d,mode:'no-cors',keepalive:true});}catch(e){}}
 var essais=0;
 function show(){var g=document.createElement('div');g.id='gate';
  var nom=(document.title||'').split(' · ')[0];
  g.innerHTML='<form autocomplete="off"><div class="lg"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg></div>'+
  '<div class="k">Accès réservé</div><h1></h1><p>La carte par section de vote de cette circonscription est réservée à son équipe. Entrez le code d’accès qu’on vous a transmis. Il sera redemandé à chaque visite. Les accès sont journalisés pour la sécurité de l’outil.</p>'+
  '<input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" placeholder="Code d’accès" aria-label="Code d’accès" required><button type="submit">Entrer</button><div class="er" role="alert"></div>'+
  '<a href="../../">← Retour à l’accueil de l’atlas</a></form>';
  g.querySelector('h1').textContent=nom;
  document.body.appendChild(g);var f=g.querySelector('form'),i=g.querySelector('input'),er=g.querySelector('.er'),b=g.querySelector('button');i.focus();
  f.onsubmit=function(e){e.preventDefault();if(b.disabled)return;
   var v=i.value.replace(/\D/g,'');
   Promise.all([sha(G.s+':'+v),sha(M.s+':'+v)].concat(P.map(function(x){return sha(x.s+':'+v);}))).then(function(r){
    var qui='',res='refus';
    if(r[0]===G.h){qui='equipe';res='ok';}else if(r[1]===M.h){qui='universel';res='ok';}
    else for(var n=0;n<P.length;n++)if(r[n+2]===P[n].h){qui=P[n].i;res=permis(P[n].a)?'ok':'hors';break;}
    journal(res,qui);
    if(res==='ok'){document.documentElement.classList.remove('gated');g.remove();window.dispatchEvent(new Event('aeq-unlock'));}
    else{essais++;er.textContent=res==='hors'?'Ce code ne donne pas accès à cette circonscription.':'Code incorrect.';i.select();
     if(essais>=5){b.disabled=true;var t=30;er.textContent='Trop d’essais. Réessayez dans '+t+' s.';var it=setInterval(function(){t--;if(t<=0){clearInterval(it);b.disabled=false;essais=0;er.textContent='';}else er.textContent='Trop d’essais. Réessayez dans '+t+' s.';},1000);}}});};}
 if(document.body)show();else document.addEventListener('DOMContentLoaded',show);
})();
