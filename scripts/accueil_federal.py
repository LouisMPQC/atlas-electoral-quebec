"""Dérive gabarits/accueil_federal.html à partir de gabarits/accueil.html (angle Bloc, 2021-2025)."""
import re
s = open('gabarits/accueil.html', encoding='utf-8').read()


def R(a, b):
    global s
    assert a in s, a[:80]
    s = s.replace(a, b)


R("<title>Provincial · Atlas électoral du Québec</title>", "<title>Fédéral · Atlas électoral du Québec</title>")
R('content="Résultats des élections générales québécoises de 2018, 2022 et 2026, région par région et section de vote par section de vote, lus du point de vue du Parti Québécois."',
  'content="Résultats des élections fédérales de 2021 et 2025 au Québec, région par région et section de vote par section de vote, lus du point de vue du Bloc Québécois."')
R('href="../assets/site.css?v=__V__">', 'href="../assets/site.css?v=__V__">\n<style>:root{--bq:#3fb6e8}</style>')
R('<div class="kick"><a href="../">Atlas électoral du Québec</a> › Provincial · élections de 2018, 2022 et 2026</div>',
  '<div class="kick"><a href="../">Atlas électoral du Québec</a> › Fédéral · élections de 2021 et 2025</div>')
R('<h1>Le Québec au provincial</h1>', '<h1>Le Québec au fédéral</h1>')
R('Les résultats des trois dernières élections générales, région par région, circonscription par circonscription et section de vote par section de vote, lus du point de vue du Parti Québécois.',
  'Les 78 circonscriptions fédérales du Québec, région par région et section de vote par section de vote, lues du point de vue du Bloc Québécois.')
i = s.index('   <p><a class="pill"'); j = s.index('</p>', i) + 4
s = s[:i] + '   <p style="margin-top:6px"><a class="pill" style="text-decoration:none;display:inline-block" href="../provincial/">Voir le provincial (PQ) →</a></p>' + s[j:]
R('placeholder="Tapez une adresse, ex. 25 rue Wolfe, Lévis"', 'placeholder="Tapez une adresse, ex. 1200 rue Saint-Denis, Montréal"')
R(' <div class="lab">Choisir une région</div>', ''' <section class="card" style="padding:16px 20px;margin-bottom:18px;border-color:rgba(242,193,78,.35)"><div class="lab" style="color:var(--warn)">Élections partielles le 7 décembre 2026</div><div id="parts" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px"></div></section>
 <div class="lab">Choisir une région</div>''')
R("const ME='PQ',PO=['PQ','CAQ','PLQ','QS','PCQ','AUT'];", "const ME='BQ',PO=['BQ','PLC','NPD','PCC','PV','AUT'];")
R("const PL={PQ:'Parti Québécois',CAQ:'Coalition avenir Québec',PLQ:'Parti libéral',QS:'Québec solidaire',PCQ:'Parti conservateur',AUT:'Autres'};",
  "const PL={BQ:'Bloc Québécois',PLC:'Parti libéral',NPD:'NPD',PCC:'Parti conservateur',PV:'Parti vert',AUT:'Autres'};")
R("const AB={PQ:'PQ',CAQ:'CAQ',PLQ:'PLQ',QS:'QS',PCQ:'PCQ',AUT:'Autres'};", "const AB={BQ:'Bloc',PLC:'PLC',NPD:'NPD',PCC:'PCC',PV:'PV',AUT:'Autres'};")
R("const PC={PQ:'#3d8fe8',CAQ:'#22b8c8',PLQ:'#e5534b',QS:'#f28c28',PCQ:'#8a6fe0',AUT:'#8a96a3'};",
  "const PC={BQ:'#3fb6e8',PLC:'#e5534b',NPD:'#f39a3d',PCC:'#5a82d0',PV:'#4caf6a',AUT:'#8a96a3'};")
for a, b in [("PC.PQ", "PC[ME]"), ("c.y22", "c.y21"), ("x.s.PQ", "x.s[ME]"), ("x.c.cand.PQ", "x.c.cand[ME]"), ("seats.PQ", "seats[ME]"),
             ("'CAQ');return pct(v,ME)", "'PLC');return pct(v,ME)"), ("v22", "v21")]:
    s = s.replace(a, b)
for a, b in [("Qui a gagné en 2026 ?", "Qui a gagné en 2025 ?"), ("Où le PQ est-il fort ?", "Où le Bloc est-il fort ?"), ("Le score du PQ en 2026", "Le score du Bloc en 2025"),
             ("L’écart entre le PQ et le premier (ou le deuxième s’il est élu)", "L’écart entre le Bloc et le premier (ou le deuxième s’il est élu)"),
             ("PQ élu, solide", "Bloc élu, solide"), ("PQ élu, fragile", "Bloc élu, fragile"), ("Où le PQ a-t-il progressé ?", "Où le Bloc a-t-il progressé ?"),
             ("Variation du PQ depuis 2022 (estimation sur les limites de 2026)", "Variation du Bloc depuis 2021 (estimation sur les limites de 2025)"),
             ("Le PQ arrive <b>", "Le Bloc arrive <b>"), (" Depuis 2022 : <b>", " Depuis 2021 : <b>"), (", le PQ a remporté <b>", ", le Bloc a remporté <b>"), ("</b> en 2026. ", "</b> en 2025. "),
             ("Le PQ a perdu ", "Le Bloc a perdu "), (" · élection du 5 octobre 2026</div>", " · élection du 28 avril 2025</div>"), ("<span>Sièges du PQ sur ", "<span>Sièges du Bloc sur "),
             ("%</b><span>Vote du PQ en 2026</span></div>", "%</b><span>Vote du Bloc en 2025</span></div>"), ("<span>PQ de 2022 à 2026 (", "<span>Bloc de 2021 à 2025 ("),
             ("%</b><span>Participation en 2026</span></div>", "%</b><span>Participation en 2025</span></div>"), ("Sièges PQ</th>", "Sièges Bloc</th>"),
             ("<th>PQ 2026</th><th>PQ 2022 (est.)</th>", "<th>Bloc 2025</th><th>Bloc 2021 (est.)</th>"),
             ("Courses serrées pour le PQ", "Courses serrées pour le Bloc"),
             ("Circonscriptions où l’écart entre le PQ et le premier (ou le deuxième, quand le PQ est élu) est de moins de 10 points",
              "Circonscriptions où l’écart entre le Bloc et le premier (ou le deuxième, quand le Bloc est élu) est de moins de 10 points"),
             ("Personne élue en 2026", "Personne élue en 2025"), ("Candidature du PQ", "Candidature du Bloc (2025)"), ("moins qu’en 2022", "moins qu’en 2021")]:
    R(a, b)
# KPI 2018 -> nombre de partielles
i = s.index('<div class="kpi"><b>\'+f1(pct(v18,ME))'); j = s.index('</div>', i) + 6
s = s[:i] + '<div class="kpi"><b>\'+S.filter(c=>c.bq26).length+\'</b><span>Partielle(s) le 7 décembre 2026</span></div>' + s[j:]
s = s.replace("if(c.y18)v18[p]=(v18[p]||0)+c.y18[p];", "").replace(",v18={}", "")
s = s.replace(",p18:c.y18?pct(c.v,ME)-pct(c.y18,ME):null", "")
R("+th('pr','PQ depuis 2022')+th('p18','PQ depuis 2018')", "+th('pr','Bloc depuis 2021')")
R("+th('pq','PQ 2026')+th('rk','Place du PQ')+th('gap','Écart du PQ')", "+th('pq','Bloc 2025')+th('rk','Place du Bloc')+th('gap','Écart du Bloc')")
i = s.index("+'</td><td class=\"'+(x.p18>=0?'up':'dn')+'\">'"); j = s.index("+' pts')", i) + len("+' pts')")
s = s[:i] + s[j:]
R("Écart du PQ : positif quand le PQ est élu (avance sur le deuxième), négatif quand il ne l’est pas (retard sur le premier). Les variations depuis 2022 et 2018 sont calculées sur les limites de 2026 (estimation).",
  "Écart du Bloc : positif quand le Bloc est élu (avance sur le deuxième), négatif quand il ne l’est pas (retard sur le premier). La variation depuis 2021 est calculée sur les limites de 2025 (estimation).")
s = s.replace("' · PQ '", "' · Bloc '")
R("[32,PC[ME],'Fort','32 à 40 %'],[24,mix(PC[ME],'#0e131a',.35),'Moyen','24 à 32 %'],[16,mix(PC[ME],'#0e131a',.6),'Faible','16 à 24 %'],[-1e9,mix(PC[ME],'#0e131a',.82),'Très faible','moins de 16 %']",
  "[30,PC[ME],'Fort','30 à 40 %'],[20,mix(PC[ME],'#0e131a',.35),'Moyen','20 à 30 %'],[10,mix(PC[ME],'#0e131a',.6),'Faible','10 à 20 %'],[-1e9,mix(PC[ME],'#0e131a',.82),'Très faible','moins de 10 %']")
s = s.replace("plus qu’en 2022", "plus qu’en 2021")
# chemins
s = s.replace("location.href='../circonscription/'+t.dataset.s+'/'", "location.href=t.dataset.s+'/'")
s = s.replace("'../circonscription/'+", "''+").replace('"../circonscription/\'+', '"\'+')
s = s.replace("fetch('../assets/quebec.json?v=__V__')", "fetch('accueil.json?v=__V__')")
i = s.index(' <div class="help">'); j = s.index('</footer>') + len('</footer>')
s = s[:i] + ''' <div class="help">
  <div><b>Comment s’en servir.</b> Choisissez une région, puis une circonscription (sur la carte ou dans le tableau). Chaque circonscription a sa propre page avec la carte de ses sections de vote, des filtres, une liste de sections à cibler et l’évolution depuis 2021.</div>
  <div><b>2021 sur la carte de 2025.</b> Les circonscriptions fédérales ont été redessinées en 2023 (78 au Québec). Les résultats de 2021 sont recalculés sur les limites actuelles en répartissant les votes de chaque ancienne section selon son territoire habité. Ce sont des estimations : les totaux du Québec sont conservés.</div>
  <div><b>Régions.</b> Chaque circonscription est rattachée à la région administrative où habite la majorité de ses électeurs.</div>
 </div>
 <footer>Données : Élections Canada, résultats officiels par bureau de vote des élections générales de 2021 et 2025 et limites des sections de vote. Secteurs à Montréal : quartiers de référence de la Ville de Montréal. Les comparaisons entre élections sont des estimations calculées par l’outil, et non des données officielles. Géolocalisation des adresses : Adresses Québec. Fond de carte : Esri. Outil conçu par <b style="color:var(--ink2)">Louis Morin Payette</b>, avec l’aide de Claude, un modèle d’intelligence artificielle d’Anthropic.</footer>''' + s[j:]
R("const rk=Object.keys(N.regions)", "$('parts').innerHTML=N.circ.filter(c=>c.bq26).map(c=>'<a class=\"btn\" style=\"text-decoration:none\" href=\"'+c.s+'/\"><b>'+c.n+'</b> · '+c.bq26+' pour le Bloc</a>').join('');\n const rk=Object.keys(N.regions)")
s = s.replace("attribution:'Fond : Esri · Données : Élections Québec'", "attribution:'Fond : Esri · Données : Élections Canada'")
open('gabarits/accueil_federal.html', 'w', encoding='utf-8').write(s)
for m in sorted(set(re.findall(r"[^'\"<>]{0,40}(?:PQ|2026|2022|2018|y18|y22|circonscription/|quebec\.json)[^'\"<>]{0,40}", s))):
    print('>>', m)
