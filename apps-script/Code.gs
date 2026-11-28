// Společný žebříček pro hru ShortPRO × OPTIONS 2026.
// Vložit do Google Sheetu: Rozšíření > Apps Script, uložit, Nasadit > Spravovat nasazení > Upravit > Verze: Nová verze
// (URL zůstane stejná). Spustit jako: já, Přístup: kdokoli.
// Správa žebříčku: Nastavení projektu > Vlastnosti skriptu > ADMIN_KEY = kód správce (nikdy ne do kódu ani do gitu).
// List „Body“: datum, přezdívka, úkol, body, sekundy, napoprvé bez chyby (1/0). Řádky se nikdy nemažou,
// vyčištění žebříčku a skrytí hráče jsou jen značky ve vlastnostech skriptu a dají se vrátit.
function sheet_(){ const ss = SpreadsheetApp.getActive(); return ss.getSheetByName('Body') || ss.insertSheet('Body'); }
const TASKS_ = ['story','triky','influ','tym','kdo'];
// Strop bodů za úkol = 100 × násobek úrovně + časový bonus (limit v sekundách), víc se ve hře získat nedá.
const CAP_ = {story:400, kdo:280, triky:390, influ:440, tym:500};
const P_ = () => PropertiesService.getScriptProperties();
const json_ = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
function hidden_(){ try{ return JSON.parse(P_().getProperty('HIDDEN') || '[]') }catch(e){ return [] } }
function resetAt_(){ return Number(P_().getProperty('RESET_AT') || 0) }

function doPost(e){
  const d = JSON.parse(e.postData.contents);
  if(d.admin != null) return admin_(d);
  const nick = String(d.nick||"").trim().slice(0,18), task = String(d.task||"").slice(0,10);
  if(!nick || TASKS_.indexOf(task) < 0) return ContentService.createTextOutput('bad');
  const pts = Math.max(0, Math.min(CAP_[task], Number(d.points)||0)), secs = Math.max(0, Number(d.secs)||0), first = d.first ? 1 : 0;
  sheet_().appendRow([new Date(), nick, task, pts, secs, first]);
  return ContentService.createTextOutput('ok');
}

// Úroveň: Junior = story + kdo, Medior = + triky, Senior = všech 5. Hvězda = influ i tym napoprvé.
function lvl_(t){ const d = k => t[k] != null;
  return TASKS_.every(d) ? 'Senior' : d('story') && d('kdo') && d('triky') ? 'Medior' : d('story') && d('kdo') ? 'Junior' : ''; }

// Všichni hráči od posledního vyčištění (včetně skrytých, s příznakem hidden)
function players_(){
  const rows = sheet_().getDataRange().getValues(), best = {}, first = {}, from = resetAt_(), hid = hidden_();
  rows.forEach(r => { const n = r[1], t = r[2], p = Number(r[3])||0;
    if(!n || TASKS_.indexOf(t) < 0) return;
    if(from && r[0] instanceof Date && r[0].getTime() < from) return;
    best[n] = best[n]||{}; best[n][t] = Math.max(best[n][t]||0, p);
    first[n] = first[n]||{}; if(Number(r[5]) === 1) first[n][t] = true; });
  return Object.keys(best).map(n => ({nick:n, total:Object.values(best[n]).reduce((a,b)=>a+b,0), lvl:lvl_(best[n]),
    star:!!(first[n].influ && first[n].tym), hidden: hid.indexOf(n) >= 0})).sort((a,b)=>b.total-a.total);
}

function doGet(){
  return json_(players_().filter(p => !p.hidden).slice(0,20).map(p => ({nick:p.nick, total:p.total, lvl:p.lvl, star:p.star})));
}

// Správa: {admin: kód, action: 'list'|'hide'|'unhide'|'reset'|'undo', nick}
function admin_(d){
  const key = P_().getProperty('ADMIN_KEY');
  if(!key || String(d.admin) !== key){ Utilities.sleep(1500); return json_({ok:false, error:'denied'}) }
  const lock = LockService.getScriptLock(); lock.waitLock(5000);
  try{
    const nick = String(d.nick||''), hid = hidden_();
    if(d.action === 'hide' && nick && hid.indexOf(nick) < 0){ hid.push(nick); P_().setProperty('HIDDEN', JSON.stringify(hid)) }
    if(d.action === 'unhide'){ P_().setProperty('HIDDEN', JSON.stringify(hid.filter(n => n !== nick))) }
    if(d.action === 'reset'){ P_().setProperty('PREV_RESET_AT', String(resetAt_())); P_().setProperty('RESET_AT', String(Date.now())) }
    if(d.action === 'undo'){ P_().setProperty('RESET_AT', P_().getProperty('PREV_RESET_AT') || '0') }
  } finally { lock.releaseLock() }
  return json_({ok:true, resetAt:resetAt_(), players:players_()});
}
