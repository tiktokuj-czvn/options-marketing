// Společný žebříček pro hru ShortPRO × OPTIONS 2026.
// Vložit do Google Sheetu: Rozšíření > Apps Script, uložit, Nasadit > Nová verze > Webová aplikace,
// Spustit jako: já, Přístup: kdokoli. URL webové aplikace vložit do SCORE_API v index.html.
// List „Body“: datum, přezdívka, úkol, body, sekundy, napoprvé bez chyby (1/0)
function sheet_(){ const ss = SpreadsheetApp.getActive(); return ss.getSheetByName('Body') || ss.insertSheet('Body'); }
const TASKS_ = ['story','triky','influ','tym','kdo'];
function doPost(e){
  const d = JSON.parse(e.postData.contents);
  const nick = String(d.nick||"").slice(0,18), task = String(d.task||"").slice(0,10), pts = Math.max(0, Math.min(600, Number(d.points)||0)), secs = Math.max(0, Number(d.secs)||0), first = d.first ? 1 : 0;
  if(!nick || TASKS_.indexOf(task) < 0) return ContentService.createTextOutput('bad');
  sheet_().appendRow([new Date(), nick, task, pts, secs, first]);
  return ContentService.createTextOutput('ok');
}
// Úroveň: Junior = story + kdo, Medior = + triky, Senior = všech 5. Hvězda = influ i tym napoprvé.
function lvl_(t){ const d = k => t[k] != null;
  return TASKS_.every(d) ? 'Senior' : d('story') && d('kdo') && d('triky') ? 'Medior' : d('story') && d('kdo') ? 'Junior' : ''; }
function doGet(){
  const rows = sheet_().getDataRange().getValues(), best = {}, first = {};
  rows.forEach(r => { const n = r[1], t = r[2], p = Number(r[3])||0; if(!n || TASKS_.indexOf(t) < 0) return;
    best[n] = best[n]||{}; best[n][t] = Math.max(best[n][t]||0, p);
    first[n] = first[n]||{}; if(Number(r[5]) === 1) first[n][t] = true; });
  const out = Object.keys(best).map(n => ({nick:n, total:Object.values(best[n]).reduce((a,b)=>a+b,0), lvl:lvl_(best[n]), star:!!(first[n].influ && first[n].tym)}))
    .sort((a,b)=>b.total-a.total).slice(0,20);
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
