// Společný žebříček pro hru ShortPRO × OPTIONS 2026.
// Vložit do Google Sheetu: Rozšíření > Apps Script, uložit, Nasadit > Nová verze > Webová aplikace,
// Spustit jako: já, Přístup: kdokoli. URL webové aplikace vložit do SCORE_API v index.html.
function sheet_(){ const ss = SpreadsheetApp.getActive(); return ss.getSheetByName('Body') || ss.insertSheet('Body'); }
function doPost(e){
  const d = JSON.parse(e.postData.contents);
  const nick = String(d.nick||'').slice(0,18), task = String(d.task||'').slice(0,10), pts = Math.max(0, Math.min(100, Number(d.points)||0));
  if(!nick || !task) return ContentService.createTextOutput('bad');
  sheet_().appendRow([new Date(), nick, task, pts]);
  return ContentService.createTextOutput('ok');
}
function doGet(){
  const rows = sheet_().getDataRange().getValues(), best = {};
  rows.forEach(r => { const n = r[1], t = r[2], p = Number(r[3])||0; if(!n) return; best[n] = best[n]||{}; best[n][t] = Math.max(best[n][t]||0, p); });
  const out = Object.keys(best).map(n => ({nick:n, total:Object.values(best[n]).reduce((a,b)=>a+b,0)})).sort((a,b)=>b.total-a.total).slice(0,20);
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
