/* Atlas électoral du Québec : page d'une circonscription.
   Les données de la page sont dans <script id="data" type="application/json">. */
const DATA=JSON.parse(document.getElementById('data').textContent);
const ME='PQ';
const PO=['PQ','CAQ','PLQ','QS','PCQ','AUT'];
const PL={PQ:'Parti Québécois',CAQ:'Coalition avenir Québec',PLQ:'Parti libéral',QS:'Québec solidaire',PCQ:'Parti conservateur',AUT:'Autres'};
const AB={PQ:'PQ',CAQ:'CAQ',PLQ:'PLQ',QS:'QS',PCQ:'PCQ',AUT:'Autres'};
const LE={PQ:'Le PQ',CAQ:'La CAQ',PLQ:'Le Parti libéral',QS:'Québec solidaire',PCQ:'Le Parti conservateur',AUT:'Un autre candidat'};
const PC={PQ:'#3d8fe8',CAQ:'#22b8c8',PLQ:'#e5534b',QS:'#f28c28',PCQ:'#8a6fe0',AUT:'#8a96a3'};
const YR={y26:{yr:'2026',date:'5 octobre 2026'},y22:{yr:'2022',date:'3 octobre 2022'},y18:{yr:'2018',date:'1er octobre 2018'}};
const YKS=['y26','y22','y18'].filter(y=>DATA[y]);
const f1=x=>x.toLocaleString('fr-CA',{minimumFractionDigits:1,maximumFractionDigits:1}),n0=x=>Math.round(x).toLocaleString('fr-CA');
const st=(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}},gt=k=>{try{return localStorage.getItem(k)}catch(e){return null}};
const $=id=>document.getElementById(id);
const lc=x=>x.charAt(0).toLowerCase()+x.slice(1);
const sx=n=>n+' section'+(n>1?'s':''),ord=n=>n+(n===1?'<sup>er</sup>':'<sup>e</sup>');
const tot=d=>PO.reduce((s,p)=>s+(d[p]||0),0),pct=(d,p)=>{const t=tot(d);return t?100*(d[p]||0)/t:0;};
const isReg=d=>!d||!!d.regr||tot(d)===0;
const win=d=>PO.reduce((a,p)=>(d[p]||0)>(d[a]||0)?p:a,ME);
/* adversaire par défaut : le gagnant si ce n'est pas le PQ, sinon le 2e */
const RIVAL=(()=>{const cl=DATA.y26.res.cand,t={};cl.forEach(([p,,v])=>t[p]=(t[p]||0)+v);const s=PO.filter(p=>p!==ME&&p!=='AUT').sort((a,b)=>(t[b]||0)-(t[a]||0));return s[0];})();
let YK=YKS.includes(gt('aeq_y'))?gt('aeq_y'):'y26',Q='me',TAB='tab',SEE=gt('aeq_see')==='1',RP=ME,SORT={k:ME,d:-1},ESORT=-1,VP=RIVAL,PP=ME,EV='e22';
let FILT={ty:'all',sec:'',lead:'',tp:ME,top:'ge',tv:'',q:'',tg:''},TG={k:'close',n:10},TSORT={k:'ins',d:-1},SSORT={k:'bt',d:-1};
const RA={};
function synthA(yk){const c=DATA[yk],o={};for(const k in c.bva){const a=c.A[c.bva[k]];if(!a)continue;o[k]=Object.assign({ins:(c.R[k]&&c.R[k].ins)||0},a.v);}return o;}
const C=()=>DATA[YK],DAY=()=>C().R,R=()=>FILT.ty==='anti'?(RA[YK]||(RA[YK]=synthA(YK))):C().R;
const secOf=k=>C().sec[k]||'',bvaOf=k=>C().bva[k];
const LBL={};YKS.forEach(y=>{LBL[y]={};DATA[y].fc.features.forEach(f=>LBL[y][f.properties.k]=f.properties.n);for(const k in DATA[y].R)if(!LBL[y][k])LBL[y][k]=k.split('_')[1];});
const lab=k=>LBL[YK][k]||k,secLab=()=>C().sectyp||'Secteur';
const norm=x=>String(x).normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const tvNum=()=>{const t=parseFloat(String(FILT.tv).replace(',','.'));return isNaN(t)?null:t;};
const cmpT=v=>{const t=tvNum();return t==null||(FILT.top==='ge'?v>=t:v<=t);};
const vsP=d=>pct(d,ME)-pct(d,VP);
const INSX={};function insX(k){if(!INSX[YK]){const D=C().R,o={};for(const j in D){o[j]=(o[j]||0)+(D[j].ins||0);if(D[j].regr)o[D[j].regr]=(o[D[j].regr]||0)+(D[j].ins||0);}INSX[YK]=o;}return INSX[YK][k];}
const partK=k=>{const d=DAY()[k],i=insX(k);return d&&i&&!isReg(d)?100*(tot(d)+(d.rej||0))/i:null;};
function mix(a,b,t){const h=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16)),A=h(a),B=h(b);return '#'+A.map((v,i)=>Math.round(v*(1-t)+B[i]*t).toString(16).padStart(2,'0')).join('');}
function quint(vals,cols,fmt){const v=vals.filter(x=>x!=null&&isFinite(x)).sort((a,b)=>a-b);if(!v.length)return [[-1e9,cols[0],'—','']];
 const q=p=>v[Math.min(v.length-1,Math.floor(p*v.length))],c=[q(.8),q(.6),q(.4),q(.2)].map(x=>Math.round(x));
 const L=['Très élevé','Élevé','Moyen','Faible','Très faible'];
 return [[c[0],cols[4],L[0],fmt(c[0])+' et plus'],[c[1],cols[3],L[1],fmt(c[1])+' à '+fmt(c[0])],[c[2],cols[2],L[2],fmt(c[2])+' à '+fmt(c[1])],[c[3],cols[1],L[3],fmt(c[3])+' à '+fmt(c[2])],[-1e9,cols[0],L[4],'moins de '+fmt(c[3])]];}
const ramp=col=>[mix(col,'#0e131a',.82),mix(col,'#0e131a',.6),mix(col,'#0e131a',.35),col,mix(col,'#ffffff',.45)];
const E=k=>(DATA.evo||{})[k];
const EVY=()=>EV==='e22'?'2022':'2018';
const prog=(d,k)=>{const e=E(k);return YK==='y26'&&FILT.ty!=='anti'&&e&&e[EV]&&!isReg(d)?pct(d,ME)-e[EV][ME]:null};
const gap1=d=>pct(d,win(d))-pct(d,ME);
const second=d=>PO.filter(p=>p!=='AUT').sort((a,b)=>(d[b]||0)-(d[a]||0))[1];
const TGT={
 close:{t:'Le PQ à moins de N points du premier',f:k=>{const d=DAY()[k];return !isReg(d)&&win(d)!==ME&&gap1(d)<TG.n;}},
 lead:{t:'Le PQ arrive premier',f:k=>{const d=DAY()[k];return !isReg(d)&&win(d)===ME;}},
 fragile:{t:'Le PQ premier, mais avec moins de 5 points d’avance',f:k=>{const d=DAY()[k];return !isReg(d)&&win(d)===ME&&pct(d,ME)-pct(d,second(d))<5;}},
 strong:{t:'Le PQ à 35 % ou plus : faire sortir le vote',f:k=>{const d=DAY()[k];return !isReg(d)&&pct(d,ME)>=35;}},
 up:{t:'Le PQ en hausse depuis 2022 (estimation)',only:'y26',f:k=>{const d=DAY()[k],e=E(k);return !isReg(d)&&!!e&&!!e.e22&&pct(d,ME)-e.e22[ME]>0;}}};
const tgLabel=()=>TG.k==='close'?'Le PQ à moins de '+TG.n+' points du premier':TGT[TG.k].t;
function qOk(k){const s=norm(FILT.q.trim());if(!s)return true;if(/^\d/.test(s))return String(lab(k)).startsWith(s);return norm(secOf(k)).includes(s)||norm((FEAT[YK][k]||{}).mun||'').includes(s);}
function match(k){const d=R()[k];if(FILT.sec&&secOf(k)!==FILT.sec)return false;if(!qOk(k))return false;
 const reg=isReg(d);if(FILT.lead&&(reg||win(d)!==FILT.lead))return false;
 if(tvNum()!=null&&(reg||!cmpT(pct(d,FILT.tp))))return false;
 if(FILT.tg&&(reg||!TGT[FILT.tg].f(k)))return false;return true;}
const fActive=()=>!!(FILT.sec||FILT.lead||tvNum()!=null||FILT.q.trim()||FILT.tg);
const QUES={
 me:{t:'Où le PQ est-il fort ?',s:'Le score du PQ dans chaque section'},
 vs:{t:'Le PQ face à un autre parti',s:'',pick:'vs',m:vsP},
 par:{t:'Le score de chaque parti',s:'Choisir un parti : son pourcentage dans chaque section',pick:'par',m:d=>pct(d,PP)},
 win:{t:'Qui est arrivé premier ?',s:'Le parti en tête dans chaque section'},
 part:{t:'Où vote-t-on le moins ?',s:'La participation le jour du scrutin',day:1},
 prog:{t:'Où le PQ a-t-il progressé ?',s:'',only:'y26',day:1,pick:'ev',
  bins:[[8,'#3fb36b','Forte hausse','+8 points et plus'],[0,'#25603f','Hausse','0 à +8 points'],[-8,'#6e3531','Recul','0 à −8 points'],[-1e9,'#d9594f','Fort recul','plus de 8 points de moins']]}};
const binOf=(Qd,v)=>Qd.bins.find(b=>v>=b[0]);
const val=k=>{const d=R()[k];return Q==='prog'?prog(d,k):Q==='part'?partK(k):Q==='me'?pct(d,ME):QUES[Q].m(d)};
function prepQ(){const D=R(),O=ORDall();
 QUES.vs.s='Le PQ contre '+lc(LE[VP])+(VP===RIVAL?' (son principal adversaire ici)':'')+', section par section';
 QUES.prog.s='Le score du PQ comparé à '+EVY()+' (estimation sur les sections de 2026)';
 const pc=PC[VP],ab=AB[VP];
 QUES.vs.bins=[[10,mix(PC.PQ,'#ffffff',.35),'PQ nettement devant','plus de 10 points'],[1e-9,mix(PC.PQ,'#0e131a',.25),'PQ devant','0 à 10 points'],[-10,mix(pc,'#0e131a',.55),'Coude à coude',ab+' devant de moins de 10 points'],[-25,mix(pc,'#0e131a',.2),ab+' devant','10 à 25 points'],[-1e9,mix(pc,'#ffffff',.25),ab+' loin devant','plus de 25 points']];
 QUES.me.bins=quint(O.map(k=>pct(D[k],ME)),ramp(PC.PQ),x=>x+' %');
 QUES.par.bins=quint(O.map(k=>pct(D[k],PP)),ramp(PC[PP]),x=>x+' %');
 QUES.part.bins=quint(O.map(partK),ramp('#d9b44a'),x=>x+' %');}
function fillR(k){const d=R()[k];if(Q==='win')return PC[win(d)];if(!QUES[Q].bins)return '#2a313c';const v=val(k);return v==null?'#2a313c':binOf(QUES[Q],v)[1];}
function style(f){const k=f.properties.k,d=R()[k];
 if(fActive()&&!match(k))return{color:'#3a4556',weight:.6,dashArray:null,fillColor:'#151b24',fillOpacity:SEE?.08:.3,opacity:.45};
 if(isReg(d))return{color:'#8793a3',weight:SEE?1.2:.9,dashArray:'3 3',fillColor:'#232a35',fillOpacity:SEE?.15:.55,opacity:.8};
 if(FILT.ty==='anti')return{color:'#e3eaf2',weight:.5,dashArray:null,fillColor:fillR(k),fillOpacity:SEE?.3:.72,opacity:.18};
 return{color:SEE?'#ffffff':'#e3eaf2',weight:SEE?1.8:1,dashArray:null,fillColor:fillR(k),fillOpacity:SEE?.28:.7,opacity:SEE?.95:.55};}
/* ---------- panneau de résultats ---------- */
function renderRes(){const c=C(),r=c.res,y=YR[YK];
 $('kick').innerHTML='<a href="../../">Atlas électoral du Québec</a> › <a href="../../#r='+DATA.reg+'">'+DATA.regn+'</a> › Élections générales du '+y.date;
 if(!r.trans){const cl=r.cand,tv=r.valid;
  $('resT').textContent='Résultat officiel · '+y.yr;
  $('cand').innerHTML=cl.filter(x=>x[2]/tv>=.004).map(([p,n,v])=>'<div class="cr'+(p===ME?' me':'')+'"><span class="nm">'+n+'<small>'+(p==='AUT'?'autre':AB[p])+'</small></span><span class="pc">'+f1(100*v/tv)+' %<small>'+n0(v)+' votes</small></span><span class="tr"><i style="width:'+(100*v/cl[0][2])+'%;background:'+PC[p]+'"></i></span></div>').join('');
  const me=cl.findIndex(x=>x[0]===ME);
  const kp=[[n0(cl[0][2]-cl[1][2]),'Majorité de '+cl[0][1]],[f1(100*(tv+r.rej)/r.el)+' %','Participation ('+n0(tv+r.rej)+' / '+n0(r.el)+' inscrits)']];
  if(me>=0)kp.push([me===0?'Élu':ord(me+1),me===0?'Le PQ remporte la circonscription, avec '+f1(100*(cl[0][2]-cl[1][2])/tv)+' points d’avance':'Place du PQ, à '+f1(100*(cl[0][2]-cl[me][2])/tv)+' points du gagnant']);
  kp.push([f1(100*r.adv/tv)+' %','Des votes exprimés par anticipation']);
  $('kpis').innerHTML=kp.map(x=>'<div class="kpi"><b>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');}
 else{const v=r.v,tv=r.valid,ps=PO.slice().sort((a,b)=>v[b]-v[a]);
  $('resT').textContent='Résultat '+y.yr+' recalculé sur les limites de 2026 (estimation)';
  $('cand').innerHTML=ps.filter(p=>v[p]/tv>=.004).map(p=>'<div class="cr'+(p===ME?' me':'')+'"><span class="nm">'+PL[p]+'</span><span class="pc">'+f1(100*v[p]/tv)+' %<small>≈ '+n0(v[p])+' votes</small></span><span class="tr"><i style="width:'+(100*v[p]/v[ps[0]])+'%;background:'+PC[p]+'"></i></span></div>').join('');
  const me=ps.indexOf(ME),d26=pct(DATA.y26.res.cand.reduce((o,[p,,x])=>(o[p]=(o[p]||0)+x,o),{}),ME)-100*v[ME]/tv;
  $('kpis').innerHTML=[[ord(me+1),'Place estimée du PQ en '+y.yr],[(d26>=0?'+':'')+f1(d26)+' pts','Variation du PQ de '+y.yr+' à 2026'],[r.origins.map(o=>o[0]).slice(0,2).join(', '),'Ancienne circonscription'+(r.origins.length>1?'s':'')+' : '+r.origins.map(o=>o[0]+' ('+f1(o[1])+' %)').join(', ')]].map(x=>'<div class="kpi"><b'+(String(x[0]).length>14?' style="font-size:1.25rem;line-height:1.15"':'')+'>'+x[0]+'</b><span>'+x[1]+'</span></div>').join('');}
 const Dd=DAY(),O=Object.keys(Dd).filter(k=>!isReg(Dd[k])&&BYN[YK][k]),w={};O.forEach(k=>{const p=win(Dd[k]);w[p]=(w[p]||0)+1;});
 const ps=PO.filter(p=>w[p]).sort((a,b)=>w[b]-w[a]);
 $('stack').innerHTML=ps.map(p=>'<i style="width:'+(100*w[p]/O.length)+'%;background:'+PC[p]+'" title="'+PL[p]+' '+w[p]+'"></i>').join('');
 $('wl').innerHTML=PO.filter(p=>p!=='AUT').map(p=>'<span><i style="background:'+PC[p]+'"></i>'+AB[p]+' '+(w[p]||0)+'</span>').join('');}
/* ---------- carte ---------- */
const map=L.map('map',{zoomControl:false,minZoom:5,maxZoom:17,attributionControl:true}).setView([46.8,-71.2],11);
L.control.zoom({position:'topright'}).addTo(map);
const ERR='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const ESRI='https://server.arcgisonline.com/ArcGIS/rest/services/';
L.tileLayer(ESRI+'Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',{maxNativeZoom:16,maxZoom:19,errorTileUrl:ERR,attribution:'Fond : Esri · Données : Élections Québec'}).addTo(map);
map.createPane('mask');map.getPane('mask').style.zIndex=340;map.getPane('mask').style.pointerEvents='none';
map.createPane('roads');map.getPane('roads').style.zIndex=420;map.getPane('roads').style.pointerEvents='none';
map.createPane('labels');map.getPane('labels').style.zIndex=450;map.getPane('labels').style.pointerEvents='none';
const ROADS=L.tileLayer(ESRI+'Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{pane:'roads',maxNativeZoom:19,maxZoom:19,errorTileUrl:ERR,opacity:.5}).addTo(map);
L.tileLayer(ESRI+'Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',{pane:'labels',maxNativeZoom:16,maxZoom:19,errorTileUrl:ERR}).addTo(map);
const WORLD=[[70,-100],[70,-40],[35,-40],[35,-100]],MASK={};
YKS.forEach(yk=>{if(DATA[yk].m&&DATA[yk].m.length)MASK[yk]=L.polygon([WORLD,...DATA[yk].m],{pane:'mask',interactive:false,stroke:false,fillColor:'#0b0f14',fillOpacity:.9});});
function maskLayer(){YKS.forEach(yk=>{if(!MASK[yk])return;yk===YK?map.addLayer(MASK[yk]):map.removeLayer(MASK[yk]);});ROADS.setOpacity(SEE?.85:.5);}
function sentence(d,k){
 if(isReg(d))return 'Petite section (souvent une résidence ou un immeuble). Ses votes ont été comptés avec la <b>section '+(d&&d.regr?lab(d.regr):'voisine')+'</b>.';
 const rank=1+PO.filter(x=>x!=='AUT'&&(d[x]||0)>(d[ME]||0)).length,w=win(d);
 let s='Le PQ arrive <b>'+ord(rank)+'</b> avec <b>'+f1(pct(d,ME))+' %</b>. ';
 if(rank>1)s+=LE[w]+' arrive premier avec '+f1(pct(d,w))+' %. ';
 else{const s2=second(d);s+='Avance de '+f1(pct(d,ME)-pct(d,s2))+' points sur '+lc(LE[s2])+'. ';}
 return s;}
function popup(p){const k=p.k,d=R()[k];
 const A=FILT.ty==='anti'?C().A[bvaOf(k)]:null,dd=DAY()[k];
 let h='<div class="pp"><h3>Section '+lab(k)+'</h3><div class="m">'+YR[YK].yr+' · '+(p.mun?p.mun+' · ':'')+n0(dd?insX(k)||dd.ins:0)+' électeurs inscrits'+(A?' · '+A.lab:'')+'</div>'+(A?'<div class="st">Vote par anticipation : résultats du '+A.lab+', qui regroupe les sections '+A.s.map(lab).join(', ')+'.</div>':'')+'<div class="big">'+sentence(d,k)+'</div>';
 if(!isReg(d)){PO.filter(x=>pct(d,x)>=1.5).sort((a,b)=>(d[b]||0)-(d[a]||0)).forEach(x=>{const v=pct(d,x);
  h+='<div class="pb'+(x===ME?' me':'')+'"><span class="nm">'+PL[x]+'</span><span class="tr"><i style="width:'+Math.min(100,v/70*100)+'%;background:'+PC[x]+'"></i></span><span class="pc">'+f1(v)+' %</span></div>';});
  const e=E(k);let ev='';if(YK==='y26'&&e&&!A){['e22','e18'].forEach(y=>{if(e[y]){const v=pct(d,ME)-e[y][ME];ev+=' Depuis '+(y==='e22'?'2022':'2018')+' : <b>'+(v>=0?'+':'')+f1(v)+' pts</b>.';}});if(ev)ev=' PQ (estimation sur cette section) :'+ev;}
  h+='<div class="ft">'+n0(tot(d))+(A?' votes par anticipation dans ce bureau.':' votes le jour du scrutin.')+ev+'</div>';}
 return h+'</div>';}
function tipTxt(p){const k=p.k,d=R()[k],n='Section '+lab(k)+(FILT.ty==='anti'&&C().A[bvaOf(k)]?' ('+C().A[bvaOf(k)].lab+')':'');if(isReg(d))return n+' · comptée avec la '+(d&&d.regr?lab(d.regr):'voisine');
 if(Q==='win')return n+' · 1er : '+PL[win(d)];
 if(Q==='vs'){const g=vsP(d);return n+' · '+(g>0?'PQ devant '+lc(LE[VP])+' de ':AB[VP]+' devant de ')+f1(Math.abs(g))+' pts';}
 if(Q==='par')return n+' · '+AB[PP]+' '+f1(pct(d,PP))+' %';
 if(Q==='part'){const v=partK(k);return n+' · participation '+(v==null?'—':f1(v)+' %');}
 if(Q==='prog'){const v=prog(d,k);return v==null?n+' · pas de comparaison':n+' · '+(v>=0?'+':'')+f1(v)+' pts depuis '+EVY();}
 return n+' · PQ '+f1(pct(d,ME))+' %';}
map.createPane('bva');map.getPane('bva').style.zIndex=455;map.getPane('bva').style.pointerEvents='none';
const ALAY={},ALBL={};
YKS.forEach(yk=>{ALAY[yk]=L.geoJSON(DATA[yk].Afc,{pane:'bva',interactive:false,style:{color:'#ffffff',weight:2.6,opacity:.95,fill:false}});
 ALBL[yk]=L.layerGroup(DATA[yk].Afc.features.map(f=>L.marker(L.geoJSON(f).getBounds().getCenter(),{pane:'bva',interactive:false,keyboard:false,icon:L.divIcon({className:'bvalbl',iconSize:[0,0],html:'<span>'+f.properties.lab+'</span>'})})));});
function bvaLayer(){YKS.forEach(yk=>{const on=yk===YK&&FILT.ty==='anti';[ALAY[yk],ALBL[yk]].forEach(l=>on?map.addLayer(l):map.removeLayer(l));});}
const LAY={},BYN={},FEAT={};
YKS.forEach(yk=>{BYN[yk]={};FEAT[yk]={};LAY[yk]=L.geoJSON(DATA[yk].fc,{style,onEachFeature:(f,l)=>{BYN[yk][f.properties.k]=l;FEAT[yk][f.properties.k]=f.properties;
 l.bindPopup(()=>popup(f.properties),{maxWidth:320});
 l.bindTooltip(()=>tipTxt(f.properties),{sticky:true,className:'tip',direction:'top',offset:[0,-8]});
 l.on('mouseover',e=>{e.target.setStyle({weight:2.4,color:'#ffffff'});e.target.bringToFront();});
 l.on('mouseout',e=>{LAY[YK].resetStyle(e.target);});}});});
const fit=()=>{try{map.fitBounds(LAY[YK].getBounds(),{padding:[20,20]});}catch(e){}};
function ORDall(){return Object.keys(R()).filter(k=>!isReg(R()[k])&&BYN[YK][k]);}
function ORD(){return ORDall().filter(match);}
function legRow(c,name,sub,n){return '<div class="lr"><i style="background:'+c+'"></i><span><b>'+name+'</b>'+(sub?' <span style="color:var(--ink3)">· '+sub+'</span>':'')+'</span><span class="n">'+n+' sect.</span></div>';}
function renderSide(){const c=C(),O=ORD(),Rr=R();const qs=Object.keys(QUES).filter(k=>(!QUES[k].only||QUES[k].only===YK)&&!(QUES[k].day&&FILT.ty==='anti'));if(!qs.includes(Q))Q='me';
 $('qs').innerHTML=qs.map(k=>'<button class="qb'+(k===Q?' on':'')+'" data-q="'+k+'"><span class="rd"></span><span><b>'+QUES[k].t+'</b><small>'+QUES[k].s+'</small></span></button>').join('');
 const pk=QUES[Q].pick;
 if(pk==='ev')$('qpick').innerHTML='<span class="lab">Comparer avec</span><div class="chips">'+[['e22','2022'],['e18','2018']].map(([k,t])=>'<button data-e="'+k+'" class="'+(EV===k?'on':'')+'" style="'+(EV===k?'background:var(--bq)':'')+'">'+t+'</button>').join('')+'</div>';
 else $('qpick').innerHTML=pk?'<span class="lab">'+(pk==='vs'?'Comparer le PQ avec':'Parti')+'</span><div class="chips">'+PO.filter(p=>p!=='AUT'&&!(pk==='vs'&&p===ME)).map(p=>{const on=(pk==='vs'?VP:PP)===p;return '<button data-p="'+p+'" class="'+(on?'on':'')+'" style="'+(on?'background:'+PC[p]:'')+'">'+AB[p]+'</button>';}).join('')+'</div>':'';
 document.querySelectorAll('#qpick button').forEach(b=>b.onclick=()=>{if(b.dataset.e)EV=b.dataset.e;else if(pk==='vs')VP=b.dataset.p;else PP=b.dataset.p;prepQ();LAY[YK].setStyle(style);renderSide();});
 document.querySelectorAll('.qb').forEach(b=>b.onclick=()=>{Q=b.dataset.q;prepQ();LAY[YK].setStyle(style);renderSide();});
 let lg='';
 if(Q==='win'){const n={};O.forEach(k=>{const w=win(Rr[k]);n[w]=(n[w]||0)+1;});PO.filter(p=>n[p]).sort((a,b)=>n[b]-n[a]).forEach(p=>lg+=legRow(PC[p],PL[p],'',n[p]));}
 else{const Qd=QUES[Q],n=Qd.bins.map(()=>0);let nn=0;O.forEach(k=>{const v=val(k);if(v==null)nn++;else n[Qd.bins.indexOf(binOf(Qd,v))]++;});Qd.bins.forEach((b,i)=>lg+=legRow(b[1],b[2],b[3],n[i]));if(nn)lg+=legRow('#2a313c','Pas de comparaison','',nn);}
 const nreg=Object.keys(Rr).filter(k=>isReg(Rr[k])&&BYN[YK][k]).length;if(nreg)lg+='<div class="lr reg"><i></i><span><b>Comptées avec une voisine</b></span><span class="n">'+nreg+' sect.</span></div>';
 $('leg').innerHTML=lg;
 const P=k=>pct(Rr[k],ME),N=O.length,BIG=O.filter(k=>tot(Rr[k])>=40);let items=[],title='',vf=k=>'',take='';
 if(Q==='me'){items=BIG.slice().sort((a,b)=>P(b)-P(a)).slice(0,10);title='Les 10 meilleures sections du PQ';vf=k=>f1(P(k))+' %';
  const nw=O.filter(k=>win(Rr[k])===ME).length;
  take='Le PQ arrive premier dans <b>'+sx(nw)+' sur '+N+'</b> et fait 35 % ou plus dans <b>'+sx(O.filter(k=>P(k)>=35).length)+'</b>. '+(items.length?'Sa meilleure est la <b>section '+lab(items[0])+'</b>, avec '+f1(P(items[0]))+' %. ':'')+'Les couleurs découpent les sections en 5 groupes égaux.';}
 else if(Q==='vs'){const ah=O.filter(k=>vsP(Rr[k])>0),cl=O.filter(k=>vsP(Rr[k])<=0&&vsP(Rr[k])>-10),le=lc(LE[VP]);
  items=cl.filter(k=>tot(Rr[k])>=40).sort((a,b)=>vsP(Rr[b])-vsP(Rr[a])).slice(0,15);title=items.length?'Les sections où '+le+' devance le PQ de moins de 10 points':'';vf=k=>f1(-vsP(Rr[k]))+' pts';
  take='Le PQ devance '+le+' dans <b>'+sx(ah.length)+' sur '+N+'</b>. Dans <b>'+cl.length+'</b> autre'+(cl.length>1?'s':'')+', il lui manque moins de 10 points.';}
 else if(Q==='par'){const PPc=k=>pct(Rr[k],PP);items=BIG.slice().sort((a,b)=>PPc(b)-PPc(a)).slice(0,10);title='Les 10 meilleures sections : '+PL[PP];vf=k=>f1(PPc(k))+' %';
  let sv=0,s2=0;O.forEach(k=>{sv+=Rr[k][PP]||0;s2+=tot(Rr[k]);});
  take=LE[PP]+' obtient <b>'+f1(100*sv/(s2||1))+' %</b> dans ces '+N+' sections (jour du scrutin). '+(items.length?'Sa meilleure est la <b>section '+lab(items[0])+'</b>, avec '+f1(PPc(items[0]))+' %. ':'')+'Les couleurs découpent les sections en 5 groupes égaux.';}
 else if(Q==='part'){const pv=partK,ok=BIG.filter(k=>pv(k)!=null);items=ok.slice().sort((a,b)=>pv(a)-pv(b)).slice(0,10);title='Les 10 sections où l’on vote le moins';vf=k=>f1(pv(k))+' %';
  const vs=ok.map(pv).sort((a,b)=>a-b);
  take='Le jour du scrutin, la participation va de <b>'+f1(vs[0]||0)+' %</b> à <b>'+f1(vs[vs.length-1]||0)+' %</b> selon la section. Les votes par anticipation ne sont pas comptés ici.'+(c.res.el?' La participation totale de la circonscription est de '+f1(100*(c.res.valid+c.res.rej)/c.res.el)+' %.':'');}
 else if(Q==='win'){const cnt=p=>O.filter(k=>win(Rr[k])===p).length;items=O.filter(k=>win(Rr[k])===ME).sort((a,b)=>P(b)-P(a)).slice(0,15);title=items.length?'Les sections gagnées par le PQ':'';vf=k=>f1(P(k))+' %';
  take='Sur '+N+' sections : '+PO.filter(p=>p!=='AUT'&&cnt(p)).sort((a,b)=>cnt(b)-cnt(a)).map(p=>AB[p]+' <b>'+cnt(p)+'</b>').join(', ')+'.';}
 else{const ok=O.filter(k=>prog(Rr[k],k)!=null);items=ok.filter(k=>tot(Rr[k])>=40).sort((a,b)=>prog(Rr[b],b)-prog(Rr[a],a)).slice(0,10);title='Les 10 plus fortes hausses du PQ';vf=k=>{const v=prog(Rr[k],k);return (v>=0?'+':'')+f1(v)+' pts'};
  const y=EV==='e22'?'y22':'y18',tr=DATA[y]?DATA[y].res:null,before=tr?100*tr.v[ME]/tr.valid:null,now=pct(DATA.y26.res.cand.reduce((o,[p,,x])=>(o[p]=(o[p]||0)+x,o),{}),ME);
  take='Le PQ progresse dans <b>'+sx(ok.filter(k=>prog(Rr[k],k)>0).length)+' sur '+ok.length+'</b> depuis '+EVY()+'.'+(before!=null?' Dans l’ensemble de la circonscription, il passe de '+f1(before)+' % à '+f1(now)+' %.':'');}
 let mk=k=>'Section '+lab(k),go=k=>goto(k);
 if(FILT.ty==='anti'){const A=c.A,Dd=DAY(),ks=Object.keys(A).filter(a=>!FILT.sec||A[a].w[FILT.sec]),tA=a=>tot(A[a].v),pA=a=>100*A[a].v[ME]/(tA(a)||1);
  const sa=ks.reduce((s,a)=>s+A[a].v[ME],0),ta=ks.reduce((s,a)=>s+tA(a),0);let sd=0,td=0;Object.keys(Dd).forEach(k=>{if(isReg(Dd[k])||(FILT.sec&&secOf(k)!==FILT.sec))return;sd+=Dd[k][ME]||0;td+=tot(Dd[k]);});
  items=ks.sort((a,b)=>pA(b)-pA(a));title='Bureaux par anticipation, du meilleur au moins bon pour le PQ';vf=a=>f1(pA(a))+' %';mk=a=>A[a].lab+' <span style="color:var(--ink3)">· '+A[a].s.length+' sect.</span>';go=gotoA;
  take='Par anticipation, le PQ obtient <b>'+f1(100*sa/(ta||1))+' %</b> ('+n0(ta)+' votes), contre '+f1(100*sd/(td||1))+' % le jour du scrutin'+(FILT.sec?' ('+FILT.sec+')':'')+'. Chaque section prend ici la couleur de son bureau par anticipation.';}
 else if(fActive())take='<span style="color:var(--ink2)">Dans la sélection ('+N+' sections) :</span> '+take;
 $('take').innerHTML='<b>À retenir.</b> '+take;
 $('listT').textContent=title;
 $('list').style.display=items.length?'':'none';
 $('list').innerHTML=items.map((k,i)=>'<div class="li" data-k="'+k+'"><span class="lrk">'+(i+1)+'</span><span>'+mk(k)+'</span><span class="v">'+vf(k)+'</span></div>').join('');
 document.querySelectorAll('#list .li').forEach(e=>e.onclick=()=>go(e.dataset.k));}
let ns=[];function nums(){ns.forEach(m=>map.removeLayer(m));ns=[];if(!$('lbl').checked)return;
 LAY[YK].eachLayer(l=>ns.push(L.marker(l.getBounds().getCenter(),{interactive:false,icon:L.divIcon({className:'numlabel',html:String(lab(l.feature.properties.k)).split(' ')[0],iconSize:[30,14]})}).addTo(map)));}
$('lbl').onchange=nums;
const seeB=$('see');seeB.checked=SEE;if(SEE)$('lbl').checked=true;seeB.onchange=()=>{SEE=seeB.checked;st('aeq_see',SEE?'1':'0');LAY[YK].setStyle(style);$('lbl').checked=SEE;nums();maskLayer();};
function goto(k){const l=BYN[YK][k];if(!l)return;$('mapcard').scrollIntoView({behavior:'smooth',block:'start'});
 map.flyToBounds(l.getBounds(),{maxZoom:16,padding:[60,60]});setTimeout(()=>l.openPopup(),600);}
const q=$('q'),sug=$('sug');
q.oninput=()=>{const v=q.value.trim();sug.innerHTML='';if(!v){sug.classList.remove('on');return;}
 const m=Object.keys(BYN[YK]).filter(k=>String(lab(k)).startsWith(v)).sort((a,b)=>parseInt(lab(a))-parseInt(lab(b))).slice(0,7);if(!m.length){sug.classList.remove('on');return;}
 m.forEach(k=>{const d=R()[k],e=document.createElement('div');
  e.innerHTML='<span class="sd" style="background:'+(isReg(d)?'#2a313c':fillR(k))+'"></span>Section '+lab(k)+'<span class="sr">'+(isReg(d)?'comptée avec une voisine':'PQ '+f1(pct(d,ME))+' %')+'</span>';
  e.onclick=()=>{q.value='';sug.classList.remove('on');goto(k);};sug.appendChild(e);});sug.classList.add('on');};
document.addEventListener('click',e=>{if(!e.target.closest('.search'))sug.classList.remove('on');});
/* ---------- onglets ---------- */
const tag=p=>'<span class="tag" style="background:'+PC[p]+'">'+AB[p]+'</span>';
function toast(t){const e=$('toast');e.textContent=t;e.style.display='block';setTimeout(()=>e.style.display='none',2600);}
function rowsTab(){const Rr=R();return ORD().map(k=>{const d=Rr[k],o={k,tv:tot(d)};PO.forEach(p=>o[p]=pct(d,p));return o;});}
const SCOLS=[['k','N° de bureau'],['PQ','% PQ'],['CAQ','% CAQ'],['PLQ','% PLQ'],['QS','% QS'],['PCQ','% PCQ'],['gap','Écart 1er–2e (pts)'],['tv','Bulletins valides'],['br','Bulletins rejetés'],['part','Participation'],['ins','Électeurs inscrits'],['sec','Secteur'],['win','Parti en tête']];
const dayMatch=k=>(!FILT.sec||secOf(k)===FILT.sec)&&qOk(k);
const TYO={'Jour du scrutin':0,'Anticipation':1,'Votes spéciaux':2};
function mkRow(k,lb,typ,sec,ins,v,sub,br){const o={k,lab:lb,typ,sec,ins,v,tv:tot(v),win:win(v),sub:sub||'',br:br||0};PO.forEach(p=>o[p]=o.tv?100*(v[p]||0)/o.tv:0);
 const srt=PO.map(p=>v[p]||0).sort((a,b)=>b-a);o.gapV=srt[0]-srt[1];o.gap=o.tv?100*o.gapV/o.tv:0;o.part=(typ==='Jour du scrutin'&&ins)?100*(o.tv+o.br)/ins:null;return o;}
function rowsBur(){const c=C(),out=[],ty=FILT.ty,qq=norm(FILT.q.trim());
 if(ty==='all'||ty==='jour'){const D=DAY();Object.keys(D).filter(k=>!isReg(D[k])&&match(k)).forEach(k=>{const f=FEAT[YK][k];out.push(mkRow(k,lab(k),'Jour du scrutin',secOf(k),insX(k),D[k],f&&f.mun&&f.mun!==secOf(k)?f.mun:'',D[k].rej));});}
 if((ty==='all'||ty==='anti')&&!FILT.tg)for(const a in c.A){const A=c.A[a],v=A.v;if(FILT.sec&&!A.w[FILT.sec])continue;
  if(qq){if(/^\d/.test(qq)){if(!A.s.some(k=>String(lab(k)).startsWith(qq)))continue;}else if(!A.s.some(k=>qOk(k)))continue;}
  if(FILT.lead&&win(v)!==FILT.lead)continue;if(tvNum()!=null&&!cmpT(pct(v,FILT.tp)))continue;
  const secs=Object.keys(A.w).filter(x=>A.w[x]>=.1&&x).sort((x,y)=>A.w[y]-A.w[x]);
  out.push(mkRow('A'+a,A.lab,'Anticipation',secs.join(', '),A.ins,v,'Sections '+A.s.map(lab).join(', ')+(A.part?' (et d’autres hors des limites de 2026)':''),A.rej));}
 if((ty==='all'||ty==='spec')&&!FILT.tg&&!FILT.sec&&!(qq&&!/^v/.test(qq)))for(const k in c.SP){const v=c.SP[k];if(FILT.lead&&win(v)!==FILT.lead)continue;if(tvNum()!=null&&!cmpT(pct(v,FILT.tp)))continue;
  out.push(mkRow('S'+k,k.replace(/\s*\([A-Z]+\)$/,''),'Votes spéciaux','',null,v,'',(c.SPr||{})[k]));}
 return out;}
function sortRows(rows,S){const num=x=>parseInt(String(x).replace(/\D/g,''))||0;rows.sort((a,b)=>{let r;
 if(S.k==='k')r=(TYO[a.typ]-TYO[b.typ])||(num(a.lab)-num(b.lab))||String(a.lab).localeCompare(String(b.lab),'fr');else{const x=a[S.k],y=b[S.k];if(x==null||y==null)return (x==null)-(y==null);r=(typeof x==='string'||typeof y==='string')?String(x||'').localeCompare(String(y||''),'fr'):(x-y);}
 return r*S.d;});return rows;}
function secRows(){const c=C(),D=DAY(),S={};const ini=code=>S[code]||(S[code]={code,nm:code,n:0,ins:0,j:{},a:{},e0:0,et:0});
 for(const k in D){const code=secOf(k);if(!code)continue;const s=ini(code);s.ins+=D[k].ins||0;if(isReg(D[k]))continue;s.n++;PO.forEach(p=>s.j[p]=(s.j[p]||0)+(D[k][p]||0));
  const e=YK==='y26'?E(k):null;if(e&&e.e22){s.e0+=e.e22[ME]*tot(D[k]);s.et+=tot(D[k]);}}
 for(const a in c.A){const A=c.A[a];for(const code in A.w){if(!S[code])continue;PO.forEach(p=>S[code].a[p]=(S[code].a[p]||0)+A.v[p]*A.w[code]);}}
 const rv=VP;return Object.values(S).filter(s=>s.n).map(s=>{const t={};PO.forEach(p=>t[p]=(s.j[p]||0)+(s.a[p]||0));const tt=tot(t),tj=tot(s.j),ta=tot(s.a);
  return Object.assign(s,{t,tt,tj,ta,bj:100*(s.j[ME]||0)/(tj||1),ba:ta?100*(s.a[ME]||0)/ta:0,bt:100*t[ME]/(tt||1),rv:100*t[rv]/(tt||1),win:win(t),vn:100*(t[ME]-t[rv])/(tt||1),dv:s.et?100*(s.j[ME]||0)/tj-s.e0/s.et:null});});}
function tgRows(){const D=DAY();return Object.keys(D).filter(k=>!isReg(D[k])&&BYN[YK][k]&&(!FILT.sec||secOf(k)===FILT.sec)&&TGT[TG.k].f(k)).map(k=>{const d=D[k],w=win(d),s2=second(d);return {k,lab:lab(k),sec:secOf(k),ins:insX(k)||d.ins,PQ:pct(d,ME),win:w,gap:w===ME?pct(d,ME)-pct(d,s2):-gap1(d)};});}
function copyCSV(lines){const t=lines.map(r=>r.map(x=>{x=x==null?'':String(x);return /[",\n]/.test(x)?'"'+x.replace(/"/g,'""')+'"':x;}).join(',')).join('\n');
 (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Tableau copié : collez-le dans un tableur.'),()=>toast('Copie impossible dans ce navigateur.'));}
const th=(k,t,S,cls)=>'<th data-s="'+k+'" class="'+(cls||'')+(S.k===k?' s':'')+'">'+t+(S.k===k?(S.d<0?' ↓':' ↑'):'')+'</th>';
const pc=(v,b)=>'<td'+(b?' style="color:var(--bq);font-weight:600"':'')+'>'+f1(v)+'</td>';
function renderTab(){const el=$('tab');
 const tgs=Object.keys(TGT).filter(k=>!TGT[k].only||TGT[k].only===YK);if(!tgs.includes(TG.k))TG.k='close';
 document.querySelectorAll('#tabs button').forEach(b=>{b.classList.toggle('on',b.dataset.t===TAB);b.style.display=(b.dataset.t==='evo'&&YK!=='y26')?'none':'';});
 if(TAB==='evo'&&YK!=='y26')TAB='tab';
 if(TAB==='tab'){const rows=sortRows(rowsBur(),SORT);const n={};rows.forEach(r=>n[r.typ]=(n[r.typ]||0)+1);
  const agg={};PO.forEach(p=>agg[p]=rows.reduce((s,r)=>s+(r.v[p]||0),0));const at=tot(agg),abr=rows.reduce((s,r)=>s+r.br,0);
  const onlyDay=rows.every(r=>r.typ==='Jour du scrutin'),official=FILT.ty==='all'&&!fActive()&&!C().res.trans;
  const tIns=official?C().res.el:onlyDay?rows.reduce((s,r)=>s+(r.ins||0),0):null,tPart=tIns?100*(at+abr)/tIns:null;
  const wl={};rows.forEach(r=>wl[r.win]=(wl[r.win]||0)+1);
  const P5=PO.filter(p=>p!=='AUT'),cur=k=>SORT.k===k?' cur':'';
  const cell=(r,p)=>'<td class="pc2'+cur(p)+'"><b'+(p===ME?' style="color:var(--bq)"':'')+'>'+f1(r[p])+' %</b><small>'+n0(r.v[p]||0)+'</small><i style="width:calc((100% - 24px)*'+(Math.min(r[p],70)/70).toFixed(3)+');background:'+PC[p]+'"></i></td>';
  el.innerHTML='<div class="ctrl"><span class="lab">'+(rows.length?Object.keys(n).sort((a,b)=>TYO[a]-TYO[b]).map(t=>n[t]+' '+(t==='Jour du scrutin'?'sections (jour du scrutin)':t==='Anticipation'?'bureaux par anticipation':'bureaux de votes spéciaux')).join(' · ')+' · en tête : '+PO.filter(p=>wl[p]).sort((a,b)=>wl[b]-wl[a]).map(p=>AB[p]+' '+wl[p]).join(', '):'Aucun bureau ne correspond aux filtres')+'</span><button class="btn" id="csv">Copier le tableau (CSV)</button></div>'+
   '<div class="tw"><table><thead><tr>'+th('k','Bureau',SORT,'l')+th('sec',secLab(),SORT,'l')+P5.map(p=>th(p,'<span class="tag" style="background:'+PC[p]+';padding:0 4px;margin-right:4px">&nbsp;</span>'+AB[p],SORT,cur(p))).join('')+th('AUT','Autres',SORT)+th('win','En tête',SORT,'l')+th('gap','Écart',SORT,cur('gap'))+th('tv','B.V.',SORT,cur('tv'))+th('br','B.R.',SORT,cur('br'))+th('ins','É.I.',SORT,cur('ins'))+th('part','Particip.',SORT,cur('part'))+'</tr></thead><tbody>'+
   rows.map(r=>'<tr data-k="'+r.k+'"><td>'+r.lab+(r.typ!=='Jour du scrutin'?'<span class="ty2">'+r.typ+'</span>':'')+(r.sub?'<span class="sub" title="'+r.sub+'">'+r.sub+'</span>':'')+'</td><td class="l">'+(r.sec||'<span style="color:var(--ink3)">—</span>')+'</td>'+P5.map(p=>cell(r,p)).join('')+'<td>'+f1(r.AUT)+'</td><td class="l">'+tag(r.win)+'</td><td class="'+cur('gap').trim()+'">'+f1(r.gap)+' pts<span class="sub" style="text-align:right">'+n0(r.gapV)+(r.gapV>1?' votes':' vote')+'</span></td><td>'+n0(r.tv)+'</td><td>'+n0(r.br)+'</td><td>'+(r.ins==null?'—':n0(r.ins))+'</td><td>'+(r.part==null?'—':f1(r.part)+' %')+'</td></tr>').join('')+
   (rows.length>1&&at?'<tr class="tot"><td>Total<span class="ty2">'+rows.length+' bureaux</span></td><td></td>'+P5.map(p=>'<td'+(p===ME?' style="color:var(--bq)"':'')+'>'+f1(100*agg[p]/at)+' %<span class="sub" style="text-align:right">'+n0(agg[p])+'</span></td>').join('')+'<td>'+f1(100*agg.AUT/at)+'</td><td class="l">'+tag(win(agg))+'</td><td></td><td>'+n0(at)+'</td><td>'+n0(abr)+'</td><td>'+(tIns?n0(tIns):'—')+'</td><td>'+(tPart?f1(tPart)+' %':'—')+'</td></tr>':'')+'</tbody></table></div>'+
   '<p class="note"><b>B.V.</b> bulletins valides · <b>B.R.</b> bulletins rejetés · <b>É.I.</b> électeurs inscrits · <b>Écart</b> entre le 1<sup>er</sup> et le 2<sup>e</sup>. La participation d’une section ne compte que le jour du scrutin, elle paraît donc basse. '+(C().res.trans?'En '+YR[YK].yr+', le tableau montre les bureaux de l’ancienne carte situés surtout dans les limites actuelles : leur total n’est pas un résultat officiel.':'Sans filtre, la ligne Total redonne exactement le résultat officiel de la circonscription.')+'</p>';
  el.querySelectorAll('th[data-s]').forEach(t=>t.onclick=()=>{const k=t.dataset.s;SORT=SORT.k===k?{k,d:-SORT.d}:{k,d:(k==='k'||k==='win'||k==='sec'||k==='gap'||k==='part')?1:-1};syncFUI();renderTab();});
  el.querySelector('#csv').onclick=()=>copyCSV([['bureau','type',secLab().toLowerCase(),...PO.map(p=>p+'_pct'),...PO.map(p=>p+'_votes'),'en_tete','ecart_pts','ecart_votes','bulletins_valides','bulletins_rejetes','electeurs_inscrits','participation']].concat(rows.map(r=>[r.lab,r.typ,r.sec,...PO.map(p=>r[p].toFixed(1)),...PO.map(p=>r.v[p]||0),r.win,r.gap.toFixed(1),r.gapV,r.tv,r.br,r.ins,r.part==null?'':r.part.toFixed(1)])));}
 else if(TAB==='sec'){const rows=secRows(),S=SSORT;rows.sort((a,b)=>{const x=a[S.k],y=b[S.k];return (typeof x==='string'?x.localeCompare(y,'fr',{numeric:true}):((x==null?-99:x)-(y==null?-99:y)))*S.d;});
  const mx=Math.max(...rows.map(r=>r.bt),1),T={};PO.forEach(p=>T[p]=rows.reduce((s,r)=>s+r.t[p],0));const TT=tot(T)||1;
  el.innerHTML='<div class="ctrl"><span class="lab">'+rows.length+' '+(secLab()==='Municipalité'?'municipalités':'secteurs électoraux')+' · jour du scrutin et anticipation · '+YR[YK].yr+'</span><button class="btn" id="csv">Copier le tableau (CSV)</button></div>'+
   '<div class="tw"><table><thead><tr>'+th('nm',secLab(),S,'l')+th('n','Sections',S)+th('ins','Inscrits',S)+th('tt','Votes',S)+th('win','En tête',S,'l')+th('bt','PQ % (total)',S,'l')+th('bj','PQ % jour',S)+th('ba','PQ % anticip.',S)+th('rv',AB[VP]+' %',S)+th('vn','PQ − '+AB[VP],S)+(YK==='y26'?th('dv','PQ depuis 2022',S):'')+'</tr></thead><tbody>'+
   rows.map(r=>'<tr data-sec="'+r.code+'"'+(FILT.sec===r.code?' style="background:rgba(61,143,232,.1)"':'')+'><td>'+r.nm+'</td><td>'+r.n+'</td><td>'+n0(r.ins)+'</td><td>'+n0(r.tt)+'</td><td class="l">'+tag(r.win)+'</td><td class="l"><span class="bar1" style="width:'+(70*r.bt/mx)+'px"></span><b style="color:var(--bq)">'+f1(r.bt)+' %</b></td><td>'+f1(r.bj)+'</td><td>'+f1(r.ba)+'</td><td>'+f1(r.rv)+'</td><td class="'+(r.vn>0?'up':'dn')+'">'+(r.vn>0?'+':'')+f1(r.vn)+'</td>'+(YK==='y26'?'<td class="'+(r.dv>=0?'up':'dn')+'">'+(r.dv==null?'—':(r.dv>=0?'+':'')+f1(r.dv)+' pts')+'</td>':'')+'</tr>').join('')+
   '<tr class="tot"><td>Ensemble</td><td>'+rows.reduce((s,r)=>s+r.n,0)+'</td><td>'+n0(rows.reduce((s,r)=>s+r.ins,0))+'</td><td>'+n0(TT)+'</td><td class="l">'+tag(win(T))+'</td><td class="l"><b>'+f1(100*T[ME]/TT)+' %</b></td><td></td><td></td><td>'+f1(100*T[VP]/TT)+'</td><td>'+(T[ME]>T[VP]?'+':'')+f1(100*(T[ME]-T[VP])/TT)+'</td>'+(YK==='y26'?'<td></td>':'')+'</tr></tbody></table></div>'+
   '<p class="note">Cliquez sur une ligne pour filtrer la carte et les tableaux. '+(secLab()==='Municipalité'?'Les secteurs sont les municipalités de la circonscription.':'La circonscription compte une seule municipalité : les secteurs sont ceux d’Élections Québec (groupes de sections qui votent au même endroit).')+' Le vote par anticipation est réparti selon les électeurs inscrits de chaque section (estimation). Les votes spéciaux n’ont pas de secteur.</p>';
  el.querySelectorAll('th[data-s]').forEach(t=>t.onclick=()=>{const k=t.dataset.s;SSORT=SSORT.k===k?{k,d:-SSORT.d}:{k,d:(k==='nm'||k==='win')?1:-1};renderTab();});
  el.querySelectorAll('tr[data-sec]').forEach(r=>r.onclick=()=>{FILT.sec=FILT.sec===r.dataset.sec?'':r.dataset.sec;syncFUI();applyF();fitSel();});
  el.querySelector('#csv').onclick=()=>copyCSV([[secLab().toLowerCase(),'sections','inscrits','votes','en_tete','pq_total_pct','pq_jour_pct','pq_anticipation_pct',VP.toLowerCase()+'_pct','pq_moins_'+VP.toLowerCase(),'pq_depuis_2022']].concat(rows.map(r=>[r.nm,r.n,r.ins,Math.round(r.tt),r.win,r.bt.toFixed(1),r.bj.toFixed(1),r.ba.toFixed(1),r.rv.toFixed(1),r.vn.toFixed(1),r.dv==null?'':r.dv.toFixed(1)])));}
 else if(TAB==='tg'){const rows=tgRows(),S=TSORT;rows.sort((a,b)=>{const x=a[S.k],y=b[S.k];return (typeof x==='string'?(S.k==='lab'?parseInt(x)-parseInt(y):x.localeCompare(y,'fr')):x-y)*S.d;});
  const ins=rows.reduce((s,r)=>s+r.ins,0),on=FILT.tg===TG.k;
  el.innerHTML='<div class="ctrl"><span class="lab">Critère</span><select id="tgk">'+tgs.map(k=>'<option value="'+k+'"'+(k===TG.k?' selected':'')+'>'+(k==='close'?'Le PQ à moins de N points du premier':TGT[k].t)+'</option>').join('')+'</select>'+
   (TG.k==='close'?'<span class="lab">N =</span><select id="tgn">'+[5,10,15,20,25].map(n=>'<option'+(n===TG.n?' selected':'')+'>'+n+'</option>').join('')+'</select>':'')+
   '<button class="btn" id="tgmap">'+(on?'Retirer de la carte':'Afficher ces sections sur la carte')+'</button><button class="btn" id="csv">Copier la liste (CSV)</button></div>'+
   '<p class="note" style="margin:0 0 12px"><b style="color:var(--ink)">'+rows.length+' sections</b>'+(FILT.sec?' ('+FILT.sec+')':'')+' · <b style="color:var(--ink)">'+n0(ins)+' électeurs inscrits</b> au total. Résultats du jour du scrutin '+YR[YK].yr+', triés par nombre d’inscrits : les plus grosses d’abord.</p>'+
   (rows.length?'<div class="tw"><table><thead><tr><th class="l">#</th>'+th('lab','Section',S,'l')+th('sec',secLab(),S,'l')+th('ins','Inscrits',S)+th('PQ','PQ %',S)+th('win','En tête',S,'l')+th('gap','Écart du PQ',S)+'</tr></thead><tbody>'+
   rows.map((r,i)=>'<tr data-k="'+r.k+'"><td class="l ty">'+(i+1)+'</td><td>'+r.lab+'</td><td class="l">'+r.sec+'</td><td>'+n0(r.ins)+'</td>'+pc(r.PQ,1)+'<td class="l">'+tag(r.win)+'</td><td class="'+(r.gap>=0?'up':'dn')+'">'+(r.gap>=0?'+':'')+f1(r.gap)+' pts</td></tr>').join('')+'</tbody></table></div>':'<p class="note">Aucune section ne répond à ce critère.</p>');
  el.querySelectorAll('th[data-s]').forEach(t=>t.onclick=()=>{const k=t.dataset.s;TSORT=TSORT.k===k?{k,d:-TSORT.d}:{k,d:(k==='lab'||k==='sec'||k==='win')?1:-1};renderTab();});
  $('tgk').onchange=e=>{TG.k=e.target.value;if(FILT.tg)FILT.tg=TG.k;applyF();};
  const tn=$('tgn');if(tn)tn.onchange=e=>{TG.n=+e.target.value;applyF();};
  $('tgmap').onclick=()=>{FILT.tg=on?'':TG.k;applyF();if(!on)fitSel();};
  el.querySelector('#csv').onclick=()=>copyCSV([['section',secLab().toLowerCase(),'inscrits','pq_pct','en_tete','ecart_du_pq']].concat(rows.map(r=>[r.lab,r.sec,r.ins,r.PQ.toFixed(1),r.win,r.gap.toFixed(1)])));}
 else if(TAB==='rank'){const rows=rowsTab().sort((a,b)=>b[RP]-a[RP]),mx=rows.length?rows[0][RP]:1;
  el.innerHTML='<div class="ctrl"><span class="lab">Parti</span><div class="chips">'+PO.filter(p=>p!=='AUT').map(p=>'<button data-p="'+p+'" class="'+(p===RP?'on':'')+'" style="'+(p===RP?'background:'+PC[p]:'')+'">'+PL[p]+'</button>').join('')+'</div></div>'+
   '<div class="rank">'+rows.map((r,i)=>'<div class="rk" data-k="'+r.k+'"><span class="n">'+(i+1)+'</span><span>Section '+lab(r.k)+'<span class="tr"><i style="width:'+(100*r[RP]/(mx||1))+'%;background:'+PC[RP]+'"></i></span></span><span class="v">'+f1(r[RP])+' %</span></div>').join('')+'</div>';
  el.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{RP=b.dataset.p;renderTab();});}
 else{const Rr=DAY(),rows=Object.keys(Rr).filter(k=>!isReg(Rr[k])&&BYN[YK][k]&&E(k)&&E(k)[EV]&&dayMatch(k)).map(k=>{const d=Rr[k],e=E(k)[EV],w0=PO.reduce((a,p)=>e[p]>e[a]?p:a,ME);return {k,b0:e[ME],b1:pct(d,ME),dv:pct(d,ME)-e[ME],w0,w1:win(d)};});
  rows.sort((a,b)=>(a.dv-b.dv)*ESORT);const up=rows.filter(r=>r.dv>0).length,ch=rows.filter(r=>r.w0!==r.w1).length;
  el.innerHTML='<div class="ctrl"><span class="lab">Comparer avec</span><div class="chips">'+[['e22','2022'],['e18','2018']].map(([k,t])=>'<button data-e="'+k+'" class="'+(EV===k?'on':'')+'" style="'+(EV===k?'background:var(--bq)':'')+'">'+t+'</button>').join('')+'</div><span class="lab">'+rows.length+' sections · PQ en hausse dans '+up+', en baisse dans '+(rows.length-up)+' · '+ch+' changements de parti en tête</span><button class="btn" id="es">'+(ESORT<0?'Plus fortes hausses d’abord':'Plus fortes baisses d’abord')+'</button></div>'+
   '<div class="tw"><table><thead><tr><th class="l">Section 2026</th><th>PQ '+EVY()+' (est.)</th><th>PQ 2026</th><th>Variation</th><th class="l">En tête '+EVY()+' → 2026</th></tr></thead><tbody>'+
   rows.map(r=>'<tr data-k="'+r.k+'"><td>'+lab(r.k)+'</td><td>'+f1(r.b0)+' %</td><td style="color:var(--bq);font-weight:600">'+f1(r.b1)+' %</td><td class="'+(r.dv>=0?'up':'dn')+'">'+(r.dv>=0?'+':'')+f1(r.dv)+' pts</td><td class="l">'+tag(r.w0)+' → '+tag(r.w1)+'</td></tr>').join('')+'</tbody></table></div>'+
   '<p class="note">Comparaison du vote du jour du scrutin seulement. La carte électorale a changé en 2026 : les résultats de '+EVY()+' sont estimés sur chaque section de 2026 en répartissant les votes des anciennes sections selon la part de leur territoire habité qui s’y trouve.</p>';
  $('es').onclick=()=>{ESORT=-ESORT;renderTab();};
  el.querySelectorAll('.chips button').forEach(b=>b.onclick=()=>{EV=b.dataset.e;prepQ();LAY[YK].setStyle(style);renderSide();renderTab();});}
 el.querySelectorAll('[data-k]').forEach(r=>{if(r.tagName!=='TH')r.onclick=()=>{const k=r.dataset.k;if(k[0]==='A')gotoA(k.slice(1));else if(k[0]!=='S')goto(k);};});}
/* ---------- barre de filtres ---------- */
function fillSel(id,opts,v){const e=$(id);e.innerHTML=opts.map(([a,t])=>'<option value="'+a+'">'+t+'</option>').join('');e.value=v;}
function syncFUI(){const secs=[...new Set(Object.values(C().sec))].filter(x=>x).sort((a,b)=>a.localeCompare(b,'fr',{numeric:true}));if(FILT.sec&&!secs.includes(FILT.sec))FILT.sec='';
 $('lsecT').textContent=secLab();
 fillSel('fsec',[['','Tous']].concat(secs.map(x=>[x,x])),FILT.sec);
 fillSel('flead',[['','Tous les partis']].concat(PO.filter(p=>p!=='AUT').map(p=>[p,PL[p]])),FILT.lead);
 fillSel('ftp',PO.filter(p=>p!=='AUT').map(p=>[p,AB[p]]),FILT.tp);
 fillSel('fsort',SCOLS,SORT.k);
 $('fty').value=FILT.ty;$('ftop').value=FILT.top;if(document.activeElement!==$('ftv'))$('ftv').value=FILT.tv;if(document.activeElement!==$('fq'))$('fq').value=FILT.q;$('fsd').textContent=SORT.d<0?'↓':'↑';
 $('lq').classList.toggle('on',!!FILT.q.trim());$('lty').classList.toggle('on',FILT.ty!=='all');$('lsec').classList.toggle('on',!!FILT.sec);$('llead').classList.toggle('on',!!FILT.lead);$('ltv').classList.toggle('on',tvNum()!=null);}
function fsum(){const all=ORDall().length,n=ORD().length;let h;
 if(FILT.ty==='spec')h='Les votes spéciaux n’ont pas de territoire : ils sont dans le tableau des bureaux. La carte montre le jour du scrutin.';
 else h=fActive()?'<b>'+n+'</b> sections sur '+all+' correspondent':'<b>'+all+'</b> sections · aucun filtre';
 if(FILT.ty==='anti')h+=' · carte : vote par anticipation';
 if(FILT.tg)h+='<span class="chip">À cibler : '+tgLabel()+'<button id="tgx" aria-label="Retirer">×</button></span>';
 $('fsum').innerHTML=h;const x=$('tgx');if(x)x.onclick=()=>{FILT.tg='';applyF();};}
function applyF(){syncFUI();bvaLayer();prepQ();LAY[YK].setStyle(style);renderSide();renderTab();fsum();}
function fitSel(){const ks=ORD();if(!ks.length){toast('Aucune section ne correspond aux filtres.');return;}const b=L.latLngBounds([]);ks.forEach(k=>b.extend(BYN[YK][k].getBounds()));
 $('mapcard').scrollIntoView({behavior:'smooth',block:'start'});map.flyToBounds(b,{padding:[40,40],maxZoom:16});}
function gotoA(a){const A=C().A[a];if(!A)return;const ls=A.s.map(k=>BYN[YK][k]).filter(Boolean);if(!ls.length)return;const b=L.latLngBounds([]);ls.forEach(l=>b.extend(l.getBounds()));
 $('mapcard').scrollIntoView({behavior:'smooth',block:'start'});map.flyToBounds(b,{padding:[50,50],maxZoom:16});
 ls.forEach(l=>{l.setStyle({weight:3,color:'#ffffff',opacity:1});l.bringToFront();});setTimeout(()=>ls.forEach(l=>LAY[YK].resetStyle(l)),3500);}
$('fq').oninput=e=>{FILT.q=e.target.value;applyF();};
$('fty').onchange=e=>{FILT.ty=e.target.value;applyF();nums();};
$('fsec').onchange=e=>{FILT.sec=e.target.value;applyF();};
$('flead').onchange=e=>{FILT.lead=e.target.value;applyF();};
$('ftp').onchange=e=>{FILT.tp=e.target.value;applyF();};
$('ftop').onchange=e=>{FILT.top=e.target.value;applyF();};
$('ftv').oninput=e=>{FILT.tv=e.target.value;applyF();};
$('fsort').onchange=e=>{const k=e.target.value;SORT={k,d:(k==='k'||k==='win'||k==='sec')?1:-1};applyF();};
$('fsd').onclick=()=>{SORT.d=-SORT.d;applyF();};
$('fzoom').onclick=fitSel;
function racGo(sort,qq,pp){if(FILT.ty==='anti'&&qq==='part')FILT.ty='all';SORT=sort;if(qq)Q=qq;if(pp)PP=pp;TAB='tab';applyF();$('tabs').scrollIntoView({behavior:'smooth',block:'start'});}
(function(){const P5=PO.filter(p=>p!=='AUT');let h='<span class="lab">Raccourcis</span>';
 P5.forEach(p=>{h+='<button data-r="'+p+'|-1"><i style="background:'+PC[p]+'"></i>'+AB[p]+' le plus haut</button><button data-r="'+p+'|1">'+AB[p]+' le plus bas</button>';});
 h+='<button data-r="gap|1">Courses serrées</button><button data-r="part|1">Participation la plus faible</button>';
 $('rac').innerHTML=h;
 $('rac').querySelectorAll('button').forEach(b=>b.onclick=()=>{const [k,d]=b.dataset.r.split('|');
  if(k==='gap')racGo({k:'gap',d:1},'win');else if(k==='part')racGo({k:'part',d:1},'part');else racGo({k,d:+d},k===ME?'me':'par',k);});})();
$('freset').onclick=()=>{FILT={ty:'all',sec:'',lead:'',tp:ME,top:'ge',tv:'',q:'',tg:''};applyF();fit();};
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{TAB=b.dataset.t;renderTab();});
$('years').innerHTML=YKS.map(y=>'<button data-y="'+y+'">Élection '+YR[y].yr+'</button>').join('');
function setYear(yk){map.closePopup();if(map.hasLayer(LAY[YK]))map.removeLayer(LAY[YK]);YK=yk;st('aeq_y',yk);
 document.querySelectorAll('#years button').forEach(b=>b.classList.toggle('on',b.dataset.y===yk));
 LAY[yk].addTo(map);syncFUI();bvaLayer();maskLayer();prepQ();LAY[yk].setStyle(style);renderRes();renderSide();renderTab();fsum();nums();}
document.querySelectorAll('#years button').forEach(b=>b.onclick=()=>{setYear(b.dataset.y);fit();});
setYear(YK);fit();setTimeout(()=>{map.invalidateSize();fit();locate();},250);
/* arrivée depuis la recherche d'adresse de l'accueil : ?lat=..&lng=.. */
function inRing(x,y,r){let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const[xi,yi]=r[i],[xj,yj]=r[j];if((yi>y)!=(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;}
function inGeom(x,y,g){const ps=g.type==='Polygon'?[g.coordinates]:g.coordinates;return ps.some(p=>inRing(x,y,p[0])&&!p.slice(1).some(h=>inRing(x,y,h)));}
function locate(){const u=new URLSearchParams(location.search),la=parseFloat(u.get('lat')),lo=parseFloat(u.get('lng'));if(isNaN(la)||isNaN(lo))return;
 if(YK!=='y26')setYear('y26');const f=DATA.y26.fc.features.find(f=>inGeom(lo,la,f.geometry));
 L.circleMarker([la,lo],{radius:7,color:'#fff',weight:2,fillColor:'#f2c14e',fillOpacity:1,pane:'bva'}).addTo(map).bindTooltip(u.get('adr')||'Votre adresse',{permanent:true,direction:'right',className:'tip'});
 if(f){$('mapcard').scrollIntoView({behavior:'smooth',block:'start'});map.setView([la,lo],16);setTimeout(()=>BYN.y26[f.properties.k].openPopup([la,lo]),700);return;}
 const alt=(u.get('alt')||'').split(',').filter(Boolean);if(alt.length){u.set('alt',alt.slice(1).join(','));location.href='../'+alt[0]+'/?'+u.toString();return;}
 map.setView([la,lo],15);toast('Adresse hors des sections de cette circonscription.');}
