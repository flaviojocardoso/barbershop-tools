// HoráriosBJ script: preserves behavior, adds 15-min rule, per-date storage, PWA install, and iOS icons
const horarios = ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30"];
const listaEl = document.getElementById('lista');
const inicioSel = document.getElementById('inicio');
const dateEl = document.getElementById('date');
const resultado = document.getElementById('resultado');

// populate inicio select
horarios.forEach(h => {
  const o = document.createElement('option'); o.value = h; o.textContent = h; inicioSel.appendChild(o);
});

// render list (for the full day)
function renderList(visibleFrom=null){
  listaEl.innerHTML = '';
  horarios.forEach(h=>{
    // if visibleFrom provided, only render those >= visibleFrom
    if(visibleFrom){
      if(!timeGTE(h, visibleFrom)) return;
    }
    const div = document.createElement('div'); div.className='item';
    const span = document.createElement('span'); span.textContent=h;
    const btn = document.createElement('div'); btn.className='slot';
    // load saved state per date (key uses selected date or 'global' if none)
    const keyDate = getKeyDate();
    const saved = localStorage.getItem(keyDate + '::' + h) === '1';
    if(saved) { btn.classList.add('off'); btn.textContent='❌'; }
    btn.addEventListener('click', ()=>{
      btn.classList.toggle('off');
      if(btn.classList.contains('off')) btn.textContent='❌'; else btn.textContent='';
      localStorage.setItem(keyDate + '::' + h, btn.classList.contains('off') ? '1' : '0');
    });
    div.appendChild(span); div.appendChild(btn); listaEl.appendChild(div);
  });
}

// helper: compare time strings "HH:MM"
function timeToMinutes(t){ const [hh,mm]=t.split(':').map(Number); return hh*60+mm; }
function timeGTE(a,b){ return timeToMinutes(a) >= timeToMinutes(b); }

// compute next valid start based on now + 15min rule, aligned to 30-min grid
function computeAutoStart(){
  const now = new Date();
  // user timezone local
  const plus = new Date(now.getTime() + 15*60000);
  let hh = plus.getHours(), mm = plus.getMinutes();
  // align to 30-min grid: if mm==0 => keep, if 1-30 => 30, if 31-59 => next hour 0
  let block;
  if(mm === 0) block = 0;
  else if(mm <= 30) block = 30;
  else { block = 0; hh = hh + 1; }
  if(hh > 23) { hh = 0; }
  const s = String(hh).padStart(2,'0') + ':' + String(block).padStart(2,'0');
  return s;
}

// get key date for localStorage
function getKeyDate(){
  const v = dateEl.value;
  return v ? ('date::' + v) : 'date::global';
}

// when date changes, re-render list and load per-date states
dateEl.addEventListener('change', ()=>{
  applyAutoStart();
});

// apply auto start logic and set inicioSel
function applyAutoStart(){
  // compute next start and set into select if exists
  const auto = computeAutoStart();
  // if auto is before first shift (09:00), we set to 09:00
  if(timeToMinutes(auto) < timeToMinutes(horarios[0])) inicioSel.value = horarios[0];
  else {
    // find first schedule >= auto
    let found = horarios.find(h => timeGTE(h, auto));
    if(found) inicioSel.value = found;
    else inicioSel.value = horarios[horarios.length-1];
  }
  // re-render showing only from selected inicio
  const showFrom = inicioSel.value;
  renderList(showFrom);
}

// init: set today's date by default (local)
(function init(){
  const today = new Date();
  // format yyyy-mm-dd
  const yyyy = today.getFullYear(), mm = String(today.getMonth()+1).padStart(2,'0'), dd = String(today.getDate()).padStart(2,'0');
  dateEl.value = `${yyyy}-${mm}-${dd}`;
  // populate inicio with auto start
  applyAutoStart();
})();

inicioSel.addEventListener('change', ()=>{
  // re-render from selected inicio
  renderList(inicioSel.value);
});

// generate preview text without year, and weekday
document.getElementById('gerar').addEventListener('click', ()=>{
  const dval = dateEl.value;
  if(!dval){ alert('Selecione a data'); return; }
  const [y,m,d] = dval.split('-');
  const dateObj = new Date(y, parseInt(m,10)-1, parseInt(d,10));
  const dias = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  let header = `Horários de ${dias[dateObj.getDay()]} — ${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}`;
  let out = header + '\n\n';
  // start from selected inicio
  let capture = false;
  document.querySelectorAll('.item').forEach(it=>{
    const time = it.querySelector('span').textContent;
    if(time === inicioSel.value) capture = true;
    if(capture){
      const mark = it.querySelector('.slot').classList.contains('off') ? '❌ Agendado' : '✅ Livre';
      out += `${time} ${mark}\n`;
    }
  });
  resultado.value = out;
});

// copy button
document.getElementById('copiar').addEventListener('click', ()=>{
  if(!resultado.value){ alert('Gere a pré-visualização primeiro'); return; }
  navigator.clipboard.writeText(resultado.value).then(()=>{ alert('Copiado!'); });
});

// clear all for selected date
document.getElementById('limpar').addEventListener('click', ()=>{
  if(!confirm('Limpar todos os horários marcados dessa data?')) return;
  const keyDate = getKeyDate();
  horarios.forEach(h => localStorage.setItem(keyDate + '::' + h, '0'));
  applyAutoStart();
});



// register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(()=>{console.log('SW failed');});
}
