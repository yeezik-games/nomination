// ===== Nomination · modalità offline: un solo telefono che passa di mano =====
let L=null,lsetup=null,statsTab='online';
ICON.phone='<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>';
ICON.swap='<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg>';

function myLocalName(){return profile?profile.username:(guestSaved.raw||'')}
function initSetup(){
  const saved=ls.get('nomination_local')||{};
  const others=(saved.names||[]).filter(Boolean);
  lsetup={rounds:[5,10,15,20].includes(saved.rounds)?saved.rounds:10,hot:!!saved.hot,open:!!saved.open,names:[myLocalName()],recent:others.slice(0,20)};
}

// ----- schermata di preparazione -----
SCREENS.localsetup=()=>{
  if(!lsetup)initSetup();
  const S=lsetup,n=S.names.length;
  return`
  <div class="topline"><button type="button" class="iconbtn" data-go="back" aria-label="Indietro">${ICON.back}</button><b class="ttl">Un solo telefono</b><span style="width:44px"></span></div>
  <p class="sub tc">Giocate tutti con questo telefono: ve lo passate a turno per votare in segreto.</p>
  <h3>Giocatori</h3>
  <div class="flist" id="lnames">${S.names.map((v,i)=>{const col=COLORS[i%COLORS.length];
    if(i===0)return profile?`<div class="frow lname">${av({name:profile.username,color:col})}<div class="fi"><b>${nm(profile)}</b><small>Sei tu</small></div></div>`
      :`<div class="frow lname">${av({name:v||'?',color:col})}<input class="lnin" data-i="0" maxlength="14" placeholder="Il tuo nome" value="${esc(v)}" autocomplete="off" aria-label="Il tuo nome"><small class="youtag">tu</small></div>`;
    return`<div class="frow lname">${av({name:v,color:col})}<div class="fi"><b>${esc(v)}</b></div><button type="button" class="iconbtn sm" data-go="l-del" data-i="${i}" aria-label="Togli ${esc(v)}">${ICON.x}</button></div>`}).join('')}</div>
  ${n<3?`<p class="hint" style="margin:10px 0 0">Servono almeno 3 giocatori (${n}/3)</p>`:''}
  ${n<12?`<button type="button" class="btn ghost big addp" data-go="l-add">${ICON.plus}Aggiungi giocatore</button>`:''}
  <h3>Impostazioni</h3>
  <div class="setting"><span>Domande</span><div class="seg">${[5,10,15,20].map(v=>`<button type="button" data-go="l-rounds" data-v="${v}" class="${S.rounds===v?'on':''}">${v}</button>`).join('')}</div></div>
  <div class="setting tog"><span><b>Domande piccanti 🌶️</b><small>Ex, serate e figuracce.</small></span><button type="button" class="switch ${S.hot?'on':''}" data-go="l-hot" role="switch" aria-checked="${S.hot}"></button></div>
  <div class="setting tog"><span><b>Voti scoperti 👀</b><small>Alla fine di ogni domanda si vede chi ha votato chi.</small></span><button type="button" class="switch ${S.open?'on':''}" data-go="l-open" role="switch" aria-checked="${S.open}"></button></div>
  <button type="button" class="btn primary big" data-go="l-start">Inizia la partita</button>
  <p class="hint" style="margin-top:12px">${profile?'Le partite su un solo telefono finiscono nelle tue statistiche “Un telefono”, separate da quelle online.':'Accedi con un account per salvare anche queste partite nelle statistiche.'}</p>`;
};
BIND.localsetup=()=>{document.querySelectorAll('.lnin').forEach(i=>{i.oninput=()=>{lsetup.names[+i.dataset.i]=i.value;const a=i.parentElement.querySelector('.av');if(a)a.textContent=(i.value||String(+i.dataset.i+1))[0].toUpperCase()}})};

function addLocalName(raw){
  const n=String(raw||'').trim().slice(0,14);
  if(!n){toast('Scrivi un nome');return false}
  if(lsetup.names.some(x=>x.trim().toLowerCase()===n.toLowerCase())){toast(`${n} è già in partita`);return false}
  if(lsetup.names.length>=12){toast('Massimo 12 giocatori');return false}
  lsetup.names.push(n);buzz(12);if(typeof SFX!=='undefined')SFX.tap();
  if(view==='localsetup')refresh();
  const m=document.querySelector('.modal.addp-m');if(m)drawAddPlayer(m);
  return true;
}
function drawAddPlayer(m){
  const added=lsetup.names.slice(1).filter(Boolean),recent=(lsetup.recent||[]).filter(r=>!lsetup.names.some(x=>x.toLowerCase()===r.toLowerCase())).slice(0,8);
  m.querySelector('#addlist').innerHTML=(added.length?`<div class="chips left" style="margin:0 0 12px">${added.map((x,i)=>`<span class="chip done">${av({name:x,color:COLORS[(i+1)%COLORS.length]},'sm')}${esc(x)}</span>`).join('')}</div>`:'')
    +(recent.length?`<p class="lbl" style="margin:14px 0 8px">Hanno già giocato</p><div class="chips left" style="margin:0">${recent.map(r=>`<span class="rchip"><button type="button" class="rc-add" data-go="l-quick" data-n="${esc(r)}">+ ${esc(r)}</button><button type="button" class="rc-del" data-go="l-forget" data-n="${esc(r)}" aria-label="Togli ${esc(r)} dalla lista">${ICON.x}</button></span>`).join('')}</div>`:'');
}
function openAddPlayer(){
  if(lsetup.names.length>=12){toast('Massimo 12 giocatori');return}
  const m=document.createElement('div');m.className='modal addp-m';
  m.innerHTML=`<div class="sheet" role="dialog" aria-label="Aggiungi giocatore"><div class="grab"></div>
    <h2 style="text-align:left;margin:4px 0 4px">Aggiungi un giocatore</h2>
    <p class="hint" style="text-align:left;margin:0 0 14px">Scrivi il nome e premi Aggiungi. Puoi aggiungerne quanti vuoi, poi tocca Fatto.</p>
    <form id="addform"><input id="addname" maxlength="14" placeholder="Nome del giocatore" autocomplete="off" autocapitalize="words">
    <button type="submit" class="btn primary big" style="margin-top:12px">${ICON.plus}Aggiungi</button></form>
    <div id="addlist" style="margin-top:14px"></div>
    <button type="button" class="btn ghost big close" style="margin-top:12px">Fatto</button></div>`;
  const close=()=>{m.classList.add('closing');setTimeout(()=>m.remove(),200)};
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close'))close()});
  const i=m.querySelector('#addname');
  m.querySelector('#addform').onsubmit=e=>{e.preventDefault();if(addLocalName(i.value)){i.value='';i.focus()}};
  document.body.appendChild(m);drawAddPlayer(m);setTimeout(()=>i.focus(),300);
}
function startLocal(){
  const S=lsetup;
  const names=S.names.map(x=>x.trim()).filter(Boolean);
  if(names.length<3){toast('Servono almeno 3 giocatori');return}
  const low=names.map(x=>x.toLowerCase());
  if(new Set(low).size!==low.length){toast('Ci sono due giocatori con lo stesso nome');return}
  ls.set('nomination_local',{rounds:S.rounds,hot:S.hot,open:S.open,names:names.slice(profile?1:0)});
  if(!profile&&names[0]){guestSaved.raw=guestSaved.raw||names[0];ls.set('sintonia_guest',guestSaved)}
  const meFirst=!!profile&&S.names[0]===profile.username;
  L={players:names.map((n,i)=>({id:'p'+i,name:n,color:COLORS[i%COLORS.length],score:0,got:0,me:meFirst&&i===0,uid:meFirst&&i===0?profile.id:null})),
     rounds:S.rounds,hot:S.hot,open:S.open,total:S.rounds,round:0,used:[],usedHot:[],history:[],matchId:uuid(),saved:false};
  startLocalRound();show('local');buzz(30);
}
function startLocalRound(){
  const p=pickQuestion(L);L.q=p.q;L.hotQ=p.hot;L.votes={};L.pick=null;
  L.queue=shuffle(L.players.map(p=>p.id));
  L.phase='question';
}
const LP=id=>L.players.find(p=>p.id===id)||{name:'?',color:'#fff'};
function lReveal(){
  const {counts,top}=tally(L.votes),pts={};
  for(const [voter,t] of Object.entries(L.votes)){const ok=top.includes(t);pts[voter]=ok?1:0;if(ok)LP(voter).score++}
  L.players.forEach(p=>{p.got+=(counts[p.id]||0)});
  L.history.push({round:L.round,q:L.q,hot:!!L.hotQ,votes:{...L.votes},counts,top,pts});
  L.phase='reveal';
}

// ----- schermate di gioco -----
const passScreen=(p,line,btn)=>`<div class="pass">
  <div class="passicon">${ICON.swap}</div>
  <p class="lbl tc">Passa il telefono a</p>
  ${av(p,'xl')}
  <h1 class="headline tc">${nm(p)}</h1>
  <p class="sub tc">${line}</p>
  <button type="button" class="btn primary big" data-go="l-next">${btn}</button>
  <p class="hint">Gli altri non devono guardare lo schermo 🙈</p></div>`;
const L_VIEWS={
  question:()=>`<p class="lbl tc">Domanda ${L.round+1}</p>${qCard(L.q,L.hotQ?'🌶️ Chi è più probabile che…':null)}
    <p class="sub tc">Leggetela ad alta voce, pensateci un attimo… poi ognuno vota in segreto.</p>
    <div class="row"><button type="button" class="btn ghost" data-go="l-reroll">🔄 Cambia</button><button type="button" class="btn primary" data-go="l-begin">Iniziamo a votare</button></div>`,
  pass:()=>passScreen(LP(L.queue[0]),'tocca a te votare in segreto.','Sono io, fammi votare'),
  vote:()=>{const p=LP(L.queue[0]);
    return`${qCard(L.q,L.hotQ?'🌶️ Chi è più probabile che…':null)}<p class="role">${nm(p)}, chi voti?</p>
    ${voteGrid(L.players,L.pick,'data-go="l-pick"')}
    <button type="button" class="btn primary big" data-go="l-vote" id="lvoteBtn" ${L.pick?'':'disabled'}>${L.pick?'Vota '+esc(LP(L.pick).name):'Scegli qualcuno'}</button>
    <p class="hint" style="margin-top:12px">${L.queue.length>1?`Ancora ${L.queue.length-1} ${L.queue.length-1===1?'giocatore':'giocatori'} dopo di te`:'Sei l\'ultimo a votare'}</p>`},
  'pass-reveal':()=>`<div class="pass"><div class="passicon">${ICON.swap}</div><p class="lbl tc">Hanno votato tutti</p><h1 class="headline tc">Riunitevi tutti<br>intorno al telefono</h1><p class="sub tc">Ora si scopre chi è il più probabile.</p><button type="button" class="btn primary big" data-go="l-reveal">Rivela il verdetto</button></div>`,
  reveal:()=>{
    const h=L.history[L.history.length-1],last=L.round+1>=L.total,winners=h.top.map(LP);
    const verdict=verdictHtml(winners,h.counts);
    const ok=L.players.filter(p=>h.pts[p.id]);
    return`${qCard(h.q,h.hot?'🌶️ Chi è più probabile che…':null)}${verdict}
      ${resultBars(L.players,h.counts,h.top,h.votes,L.open,null)}
      ${ok.length?`<div class="myres ok"><b>+1</b> a ${esc(andList(ok.map(p=>p.name)))}</div>`:''}
      <button type="button" class="btn primary big" data-go="l-nextround">${last?'Vedi la classifica 🏆':'Prossima domanda →'}</button>`},
  end:()=>`<h2>Classifica finale</h2><p class="hint">Un punto ogni volta che hai votato come la maggioranza: chi conosce meglio il gruppo?</p>${podiumHtml(L.players)}
    ${mostNamed(L.players)}${awardsHtml(L.players,L.history)}
    <button type="button" class="btn big sharebtn" data-go="share">📸 Condividi il risultato</button><button type="button" class="btn primary big" data-go="l-again" style="margin-top:10px">🔁 Rivincita</button><button type="button" class="btn ghost big" data-go="l-home" style="margin-top:10px">Torna alla home</button>`
};
SCREENS.local=()=>L?L_VIEWS[L.phase]():'';
BIND.local=()=>{
  if(!L)return goHome();
  const S=L,pct=Math.min(100,(S.round+1)/S.total*100);
  const scores=[...S.players].sort((a,b)=>b.score-a.score).map(p=>`<span class="sc">${av(p,'sm')}${nm(p)} <b>${p.score}</b></span>`).join('');
  $('#top').innerHTML=`<div class="bar g3"><button class="exit" data-go="l-exit" aria-label="Esci dalla partita"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Esci</button><span class="codechip">${ICON.phone.replace('width="28" height="28"','width="16" height="16"')} Offline</span>${soundBtn('iconbtn sm sndb')}</div>${S.phase!=='end'?`<div class="rndrow"><span class="rnd">Domanda ${Math.min(S.round+1,S.total)}/${S.total}<span class="prog"><span style="width:${pct}%"></span></span></span></div>`:''}${S.phase==='question'||S.phase==='reveal'||S.phase==='end'?`<div class="scores">${scores}</div>`:''}`;
  if(S.phase==='reveal'){const h=S.history[S.history.length-1];SFX.reveal(Object.keys(h.counts).length,false);buzz([20,60,20])}
  if(S.phase==='end'){confetti(200,1200);SFX.fanfare(1);saveLocal()}
  if(S.phase==='question')SFX.chime();
  if(/^pass/.test(S.phase))SFX.whoosh();
};
function lgo(phase){L.phase=phase;$('#app').innerHTML=SCREENS.local();enterAnim();BIND.local();window.scrollTo(0,0)}

// salva la partita offline nelle statistiche separate, se il primo giocatore è l'account
async function saveLocal(){
  const mp=L&&L.players.find(p=>p.me);if(!profile||!mp||L.saved)return;L.saved=true;
  const mine=L.history.filter(h=>h.votes[mp.id]!=null);
  const sync=mine.length?Math.round(mine.filter(h=>h.pts[mp.id]).length/mine.length*100):null;
  const {error}=await sbc.from('nomination_offline_results').insert({client_id:L.matchId,score:mp.score,position:1+L.players.filter(p=>p.score>mp.score).length,players:L.players.length,rounds:L.total,sync,got_votes:mp.got,others:L.players.filter(p=>p!==mp).map(p=>p.name.slice(0,22))});
  if(error){console.warn(error);if(error.code!=='23505')L.saved=false;return}
  statsCache=null;toast('Partita salvata nelle statistiche “Un telefono”');
}

// ----- azioni -----
const LOCAL_GO={
  local:()=>{initSetup();show('localsetup')},
  'l-add':()=>openAddPlayer(),
  'l-quick':el=>{addLocalName(el.dataset.n)},
  'l-forget':el=>{const n=el.dataset.n.toLowerCase();lsetup.recent=(lsetup.recent||[]).filter(r=>r.toLowerCase()!==n);
    const sv=ls.get('nomination_local')||{};sv.names=(sv.names||[]).filter(r=>String(r).toLowerCase()!==n);ls.set('nomination_local',sv);
    const m=document.querySelector('.modal.addp-m');if(m)drawAddPlayer(m);buzz(10)},
  'l-del':el=>{lsetup.names.splice(+el.dataset.i,1);refresh()},
  'l-rounds':el=>{lsetup.rounds=+el.dataset.v;refresh()},
  'l-hot':()=>{lsetup.hot=!lsetup.hot;refresh()},
  'l-open':()=>{lsetup.open=!lsetup.open;refresh()},
  'l-start':()=>startLocal(),
  'l-reroll':()=>{const p=pickQuestion(L);L.q=p.q;L.hotQ=p.hot;lgo('question')},
  'l-begin':()=>{buzz(20);lgo('pass')},
  'l-next':()=>{L.pick=null;lgo('vote')},
  'l-pick':el=>{L.pick=el.dataset.id;SFX.tap();buzz(8);document.querySelectorAll('.vopt').forEach(b=>b.classList.toggle('on',b.dataset.id===L.pick));const b=$('#lvoteBtn');if(b){b.disabled=false;b.textContent='Vota '+LP(L.pick).name}},
  'l-vote':()=>{if(!L.pick)return;buzz(25);SFX.pop();L.votes[L.queue[0]]=L.pick;L.pick=null;L.queue.shift();lgo(L.queue.length?'pass':'pass-reveal')},
  'l-reveal':()=>{lReveal();lgo('reveal')},
  'l-nextround':()=>{L.round++;if(L.round>=L.total)lgo('end');else{startLocalRound();lgo('question')}},
  'l-again':()=>{const names=L.players.map(p=>p.name);lsetup={rounds:L.rounds,hot:L.hot,open:L.open,names,recent:[]};startLocal()},
  'l-home':()=>{L=null;goHome()},
  'l-exit':()=>{if(L.phase==='end'||confirm('Uscire dalla partita? I punti di questa partita andranno persi.')){L=null;goHome()}},
  stab:el=>{statsTab=el.dataset.t;refresh()}
};
function localGuard(){
  if(view==='local'&&L&&L.phase!=='end'){
    if(confirm('Uscire dalla partita? I punti di questa partita andranno persi.')){L=null;return false}
    return true;
  }
  return false;
}
