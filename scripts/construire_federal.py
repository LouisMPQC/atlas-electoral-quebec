"""Écrit les pages des partielles fédérales dans docs/federal/."""
import sys, pickle, json, os, time
S, DOCS, GAB = sys.argv[1], sys.argv[2], sys.argv[3]
P = pickle.load(open(S, 'rb'))
V = time.strftime('%Y%m%d%H%M')
gab = open(f'{GAB}/federale.html', encoding='utf-8').read()
J = lambda o: json.dumps(o, separators=(',', ':'), ensure_ascii=False).replace('</', '<\\/')
f1 = lambda x: f'{x:.1f}'.replace('.', ',')
n0 = lambda x: f'{round(x):,}'.replace(',', ' ')
pages = sorted(P.values(), key=lambda p: p['nom'])
cards = []
for p in pages:
    nav = ''.join(f'<option value="{s["slug"]}"{" selected" if s is p else ""}>{s["nom"]}</option>' for s in pages)
    html = (gab.replace('__NOM__', p['nom']).replace('__NAV__', nav).replace('__BQC__', p['bq26'])
            .replace('__V__', V).replace('__DATA__', J(p)))
    d = f'{DOCS}/federal/{p["slug"]}'; os.makedirs(d, exist_ok=True)
    open(f'{d}/index.html', 'w', encoding='utf-8').write(html)
    cfg = p['cfg']; r = p['y25']['res']; cl = r['cand']; tv = r['valid']
    t = {}
    for q, n, v in cl: t[q] = t.get(q, 0) + v
    order = sorted(t, key=lambda q: -t[q]); rk = order.index('BQ') + 1; w = order[0]
    gap = 100 * (t['BQ'] - t[w]) / tv if w != 'BQ' else 100 * (t['BQ'] - t[order[1]]) / tv
    r21 = p.get('y21', {}).get('res'); b21 = 100 * r21['v']['BQ'] / r21['valid'] if r21 else None
    bars = ''.join(f'<div class="cr{" me" if q == "BQ" else ""}"><span class="nm">{cfg["pl"][q]}</span><span class="pc">{f1(100*t[q]/tv)} %</span><span class="tr"><i style="width:{100*t[q]/t[order[0]]:.1f}%;background:{cfg["pc"][q]}"></i></span></div>' for q in order if t[q] / tv >= .01)
    cards.append(f'''<a class="card fc" href="{p["slug"]}/"><div class="lab">Candidature du Bloc : {p["bq26"]}</div><h2>{p["nom"]}</h2>
 <div class="kpis"><div class="kpi"><b style="color:var(--bq)">{f1(100*t["BQ"]/tv)} %</b><span>Bloc en 2025 ({rk}<sup>{"er" if rk == 1 else "e"}</sup>)</span></div>
 <div class="kpi"><b>{"+" if gap >= 0 else ""}{f1(gap)} pts</b><span>{"Avance sur le 2e" if w == "BQ" else "Écart avec " + cfg["le"][w].lower()}</span></div>
 <div class="kpi"><b>{f1(b21) + " %" if b21 is not None else "—"}</b><span>Bloc en 2021 (sur les limites de 2025)</span></div>
 <div class="kpi"><b>{n0(r["el"])}</b><span>Électeurs inscrits</span></div></div>
 <div class="lab" style="margin-top:14px">Résultat de 2025 · élu : {cl[0][1]} ({cfg["ab"][cl[0][0]]})</div><div class="cand">{bars}</div>
 <span class="go">Ouvrir la carte →</span></a>''')
idx = f'''<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Partielles fédérales du 7 décembre 2026 · Atlas électoral du Québec</title>
<meta name="description" content="Cartes par section de vote des trois élections partielles fédérales du 7 décembre 2026 au Québec, lues du point de vue du Bloc Québécois.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../assets/site.css?v={V}">
<style>.fgrid3{{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px;margin-top:18px}}
a.fc{{display:block;padding:20px 22px;text-decoration:none;color:var(--ink);transition:border-color .15s}}a.fc:hover{{border-color:var(--bq)}}
a.fc h2{{font:700 1.9rem/1.05 var(--hd);margin:6px 0 14px}}a.fc .kpis{{grid-template-columns:1fr 1fr}}
a.fc .go{{display:inline-block;margin-top:14px;background:var(--bq);color:#06121c;border-radius:7px;padding:7px 12px;font:600 .85rem var(--body)}}
.intro{{color:var(--ink2);max-width:70ch}}:root{{--bq:#3fb6e8}}</style></head>
<body><div class="wrap">
<div class="kick"><a href="../">Atlas électoral du Québec</a> › Fédéral</div>
<h1>Partielles fédérales du 7 décembre 2026</h1>
<p class="intro">Trois circonscriptions du Québec votent le 7 décembre 2026. Pour chacune, une carte section de vote par section de vote des élections de 2021 et de 2025, lue du point de vue du Bloc Québécois : où il est fort, où il est à portée, le vote par anticipation et les sections à cibler. <span class="by">Outil conçu par <b>Louis Morin Payette</b>.</span></p>
<div class="fgrid3">{''.join(cards)}</div>
<footer>Données : Élections Canada, résultats officiels par bureau de vote des élections générales de 2021 et 2025 et limites des sections de vote. Les résultats de 2021 sont recalculés sur les limites de 2025 (estimation). Candidatures du Bloc pour les partielles : Bloc Québécois, selon les annonces publiques. Outil conçu par <b style="color:var(--ink2)">Louis Morin Payette</b>, avec l'aide de Claude, un modèle d'intelligence artificielle d'Anthropic.</footer>
</div></body></html>'''
open(f'{DOCS}/federal/index.html', 'w', encoding='utf-8').write(idx)
print('pages fédérales', len(pages))
