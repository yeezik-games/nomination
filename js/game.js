// ===== Nomination · gioco (logica, rete, schermate della stanza) =====

// ===== Grafica: dito che indica e cerchio di facce =====
const HERO_NAMES=['M','G','S','L','A','F'];
function heroArt(cls=''){
  const n=HERO_NAMES.length;
  const bubbles=HERO_NAMES.map((ch,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,x=50+38*Math.cos(a),y=50+38*Math.sin(a);
    return`<span class="hb" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--c:${COLORS[i]};--i:${i}">${ch}</span>`}).join('');
  return`<div class="hero-art ${cls}" aria-hidden="true"><div class="hring"></div>${bubbles}<div class="hfinger"><span>👆</span></div></div>`;
}
// il dito ruota verso una faccia diversa ogni tanto
(function(){let k=0;setInterval(()=>{const els=document.querySelectorAll('.hero-art');if(!els.length||reduced())return;k=(k+1+Math.floor(Math.random()*(HERO_NAMES.length-1)))%HERO_NAMES.length;
  els.forEach(el=>{el.style.setProperty('--rot',(k*360/HERO_NAMES.length)+'deg');el.querySelectorAll('.hb').forEach((b,i)=>b.classList.toggle('on',i===k))})},1800)})();

const qText=q=>`Chi è più probabile che ${q}?`;
const andList=a=>a.length<2?a.join(''):a.slice(0,-1).join(', ')+' e '+a[a.length-1];
function verdictHtml(winners,counts){
  if(!winners.length)return`<div class="verdict tie"><span class="vf">🤷</span><b>Nessuna maggioranza</b><small>Un voto a testa: nessuno prende punti</small></div>`;
  if(winners.length===1){const w=winners[0],n=counts[w.id];return`<div class="verdict" style="--c:${w.color}"><span class="vf">👉</span>${av(w,'xl')}<b>${nm(w)}</b><small>${n} ${n===1?'voto':'voti'}</small></div>`}
  return`<div class="verdict tie"><span class="vf">🤝</span><div class="tieav">${winners.map(p=>av(p,'lg')).join('')}</div><b>Pareggio!</b><small>${esc(andList(winners.map(p=>p.name)))}</small></div>`;
}
const qCard=(q,lbl)=>`<div class="qcard"><div class="qlbl">${lbl||'Chi è più probabile che…'}</div><div class="qtxt">${esc(q)}?</div></div>`;

// ===== Logica di gioco (eseguita dall'host) =====
function newState(){return{phase:'lobby',hostId:me.id,players:[{id:me.id,name:me.name,score:0,got:0,color:me.color||COLORS[0],uid:me.uid||null}],rounds:10,hot:false,open:false,round:0,total:0,q:'',hotQ:false,votes:{},used:[],usedHot:[],matchId:null,history:[]}}
function pickColor(S,want){const used=new Set(S.players.map(p=>p.color));if(want&&/^#[0-9a-fA-F]{6}$/.test(want)&&!used.has(want))return want;return COLORS.find(c=>!used.has(c))||COLORS[S.players.length%COLORS.length]}
function ensureMe(){const p=state.players.find(x=>x.id===me.id);if(p){p.name=me.name;p.uid=me.uid||null}else state.players.push({id:me.id,name:me.name,score:0,got:0,color:pickColor(state,me.color),uid:me.uid||null});state.hostId=me.id;if(!state.history)state.history=[]}
// sceglie una domanda non ancora uscita; con le piccanti accese ne esce una ogni tre circa
function pickQuestion(S){
  const hot=S.hot&&Math.random()<.34;
  const list=hot?Q_HOT:Q,key=hot?'usedHot':'used';
  if(!S[key])S[key]=[];if(S[key].length>=list.length)S[key]=[];
  let i;do{i=Math.floor(Math.random()*list.length)}while(S[key].includes(i));
  S[key].push(i);return{q:list[i],hot}
}
function startRound(S=state){const p=pickQuestion(S);S.q=p.q;S.hotQ=p.hot;S.votes={};S.phase='vote'}
function startMatch(){
  const S=state;S.players.forEach(x=>{x.score=0;x.got=0});S.total=S.rounds;S.round=0;S.matchId=uuid();S.history=[];S.rematch=[];startRound();
}
function doRematch(){
  const S=state;
  S.players=S.players.filter(p=>online.has(p.id)||p.id===S.hostId);
  S.rematch=[];
  if(S.players.length<3){S.phase='lobby';S.players.forEach(x=>{x.score=0;x.got=0});return}
  startMatch();
}
function nextRound(){const S=state;S.round++;if(S.round>=S.total)S.phase='end';else startRound()}
// conteggio dei voti: chi è stato votato di più e quanti voti ha preso ognuno
function tally(votes){
  const counts={};Object.values(votes).forEach(t=>{counts[t]=(counts[t]||0)+1});
  const max=Math.max(0,...Object.values(counts));
  // un voto a testa con 3 o più votanti: nessuna maggioranza, nessun punto
  const n=Object.keys(votes).length;
  const top=max&&!(max===1&&n>=3)?Object.keys(counts).filter(k=>counts[k]===max):[];
  return{counts,top,max};
}
function reveal(){
  const S=state,{counts,top}=tally(S.votes);
  const pts={};
  for(const [voter,t] of Object.entries(S.votes)){const p=S.players.find(x=>x.id===voter);if(!p)continue;const ok=top.includes(t);pts[voter]=ok?1:0;if(ok)p.score++}
  S.players.forEach(p=>{p.got=(p.got||0)+(counts[p.id]||0)});
  if(!S.history)S.history=[];
  S.history.push({round:S.round,q:S.q,hot:!!S.hotQ,votes:{...S.votes},counts,top,pts});
  S.pts=pts;S.phase='reveal';
}
const voters=()=>state.players.filter(p=>online.has(p.id)).map(p=>p.id);
function autoReveal(){const S=state;if(!S||S.phase!=='vote')return;const vs=voters();if(vs.length>=2&&vs.every(id=>S.votes[id]!=null))reveal()}

function handle(a){
  const S=state;if(!S)return;const p=S.players.find(x=>x.id===a.from),isH=a.from===S.hostId;
  switch(a.type){
    case 'join':{const name=String(a.name||'?').trim().slice(0,22)||'?';const uid=typeof a.uid==='string'&&/^[0-9a-f-]{36}$/.test(a.uid)?a.uid:null;if(p){p.name=name;p.uid=uid}else S.players.push({id:a.from,name,score:0,got:0,color:pickColor(S,a.color),uid});break}
    case 'rounds':if(isH&&S.phase==='lobby'&&[5,10,15,20].includes(a.v|0))S.rounds=a.v|0;break;
    case 'hot':if(isH&&S.phase==='lobby')S.hot=!!a.v;break;
    case 'open':if(isH&&S.phase==='lobby')S.open=!!a.v;break;
    case 'start':if(isH&&S.phase==='lobby'&&S.players.length>=3)startMatch();break;
    case 'vote':if(S.phase==='vote'&&p&&S.players.some(x=>x.id===a.v)){S.votes[a.from]=a.v;autoReveal()}break;
    case 'unvote':if(S.phase==='vote')delete S.votes[a.from];break;
    case 'reroll':if(isH&&S.phase==='vote')startRound();break;
    case 'reveal':if(isH&&S.phase==='vote'&&Object.keys(S.votes).length)reveal();break;
    case 'next':if(isH&&S.phase==='reveal')nextRound();break;
    case 'kick':if(isH&&a.id!==S.hostId){S.players=S.players.filter(x=>x.id!==a.id);delete S.votes[a.id];for(const [k,v] of Object.entries(S.votes))if(v===a.id)delete S.votes[k];autoReveal()}break;
    case 'again':if(isH&&S.phase==='end'){S.phase='lobby';S.rematch=[];S.players.forEach(x=>{x.score=0;x.got=0})}break;
    case 'rematch':if(S.phase==='end'&&p){S.rematch=S.rematch||[];if(!S.rematch.includes(a.from))S.rematch.push(a.from);
      const here=S.players.filter(x=>online.has(x.id)).map(x=>x.id);
      if(isH||(here.length>=3&&here.every(id=>S.rematch.includes(id))))doRematch()}break;
    default:return;
  }
  push();
}

// ===== Rete =====
function push(){if(!isHost||!state)return;ls.set('nomination_host',{code,state,at:Date.now()});if(channel)channel.send({type:'broadcast',event:'state',payload:state});render()}
function send(a){a.from=me.id;if(isHost)handle(a);else if(channel)channel.send({type:'broadcast',event:'action',payload:a})}
async function enterRoom(c,host){
  try{await enterRoomInner(c,host)}catch(e){console.error(e);leave();state=null;goHome('Impossibile collegarsi: '+(e&&e.message||e))}
}
async function enterRoomInner(c,host){
  const client=getClient();
  code=c;isHost=host;online=new Set();lastKey='';prevScores={};bumpSet=new Set();seenPlayers=new Set();myPick=null;
  $('#tabs').innerHTML='';document.body.classList.remove('has-tabs');
  if(window.onEnteredRoom)onEnteredRoom(c);
  setUrl('?r='+c);
  if(channel){try{await client.removeChannel(channel)}catch(e){}}
  $('#top').innerHTML='';
  $('#app').className='';
  $('#app').innerHTML=`<div class="center"><div class="spin"></div>Connessione alla stanza ${esc(c)}…</div>`;lastKey='connecting';
  if(!host)state=null;
  channel=client.channel('nomination-'+c,{config:{broadcast:{self:false},presence:{key:me.id}}});
  channel
    .on('broadcast',{event:'state'},({payload})=>{
      if(isHost)return;clearTimeout(joinTimer);state=payload;
      if(!state.players.find(p=>p.id===me.id)&&Date.now()-lastJoin>2000){lastJoin=Date.now();send({type:'join',name:me.name,uid:me.uid,color:me.color})}
      render();
    })
    .on('broadcast',{event:'action'},({payload})=>{if(isHost)handle(payload)})
    .on('broadcast',{event:'hello'},()=>{if(isHost)push()})
    .on('presence',{event:'sync'},()=>{online=new Set(Object.keys(channel.presenceState()));if(isHost&&state){autoReveal();push()}else render()})
    .subscribe(async st=>{
      if(st==='SUBSCRIBED'){
        await channel.track({name:me.name});
        if(isHost){ensureMe();push()}
        else{
          lastJoin=Date.now();send({type:'join',name:me.name,uid:me.uid,color:me.color});
          channel.send({type:'broadcast',event:'hello',payload:{}});
          clearTimeout(joinTimer);
          joinTimer=setTimeout(()=>{if(!state){leave();goHome(`Stanza ${c} non trovata. Controlla il codice: chi l'ha creata deve avere la pagina aperta.`)}},6000);
        }
      }else if(st==='CHANNEL_ERROR'||st==='TIMED_OUT'){toast('Connessione instabile, riprovo…')}
    });
  if(host){clearTimeout(joinTimer);joinTimer=setTimeout(()=>{if(lastKey==='connecting'){leave();state=null;goHome("Il server di gioco non risponde. Apri il gioco dal suo link online (GitHub Pages) e non dall'anteprima o dal file sul computer, poi riprova.")}},9000)}
}
function leave(){clearTimeout(joinTimer);if(channel&&sbc){try{sbc.removeChannel(channel)}catch(e){}}channel=null;state=null;code=null;isHost=false;online=new Set();setUrl(location.pathname);if(window.onLeftRoom)onLeftRoom()}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&channel){try{channel.track({name:me.name})}catch(e){}if(!isHost)channel.send({type:'broadcast',event:'hello',payload:{}})}});

// ===== Pezzi di schermata condivisi (online e offline) =====
// griglia di facce da votare
function voteGrid(players,sel,attr='data-a="pick"'){
  return`<div class="vgrid">${players.map(p=>`<button type="button" class="vopt ${sel===p.id?'on':''}" ${attr} data-id="${esc(p.id)}" style="--c:${p.color}">${av(p,'lg')}<span class="vn">${nm({...p,name:String(p.name||'?').replace(/^anon_/,'')})}</span><span class="vck">${ICON.check}</span></button>`).join('')}</div>`;
}
// barre dei risultati: players ordinati per voti, con chi li ha votati se i voti sono scoperti
function resultBars(players,counts,top,votes,open,myVote){
  const total=Object.values(counts).reduce((a,b)=>a+b,0)||1;
  const rows=[...players].filter(p=>counts[p.id]).sort((a,b)=>(counts[b.id]||0)-(counts[a.id]||0));
  const byTarget={};Object.entries(votes).forEach(([v,t])=>{(byTarget[t]=byTarget[t]||[]).push(v)});
  const pl=id=>players.find(p=>p.id===id)||{name:'?',color:'#fff'};
  return`<div class="bars">${rows.map((p,i)=>{const n=counts[p.id],w=Math.round(n/total*100),win=top.includes(p.id);
    return`<div class="brow ${win?'win':''} ${myVote===p.id?'mine':''}" style="--d:${(1.1+i*.18).toFixed(2)}s;--c:${p.color}">
      ${av(p)}<div class="bmid"><div class="bname">${nm(p)}${myVote===p.id?'<em>il tuo voto</em>':''}</div><div class="btrack"><span style="--w:${w}%"></span></div>
      ${open&&byTarget[p.id]?`<div class="bwho">${byTarget[p.id].map(v=>av(pl(v),'xs')).join('')}</div>`:''}</div><b class="bn">${n}</b></div>`}).join('')}</div>`;
}
// premi di fine partita: per ognuno la domanda in cui ha preso più voti
function awards(players,history){
  const out=[];
  players.forEach(p=>{let best=null;history.forEach(h=>{const n=(h.counts||{})[p.id]||0;if(n&&(h.top||[]).includes(p.id)&&(!best||n>best.n))best={n,q:h.q}});if(best)out.push({p,q:best.q,n:best.n})});
  return out;
}
function awardsHtml(players,history){
  const aw=awards(players,history);if(!aw.length)return'';
  return`<h3>Le etichette della serata</h3><div class="awards">${aw.map((a,i)=>`<div class="award" style="--d:${(2+i*.15).toFixed(2)}s;--c:${a.p.color}">${av(a.p)}<div><b>${nm(a.p)}</b><small>è il più probabile che ${esc(a.q)}</small></div><span class="an">${a.n} ${a.n===1?'voto':'voti'}</span></div>`).join('')}</div>`;
}
function podiumHtml(players){
  const sorted=[...players].sort((a,b)=>b.score-a.score);
  const top=[sorted[1],sorted[0],sorted[2]],cls=['p2','p1','p3'],delay=[.9,1.4,.5],medal=['🥈','🥇','🥉'];
  const pod=top.map((p,i)=>p?`<div class="pod ${cls[i]}" style="--d:${delay[i]}s">${i===1?'<div class="crown">👑</div>':''}${av(p,'lg')}<div class="nm">${nm(p)}</div><div class="col"><small>${medal[i]}</small>${p.score}</div></div>`:'').join('');
  const rest=sorted.slice(3).map((p,i)=>`<div class="ri" style="animation-delay:${(1.8+i*.1).toFixed(2)}s"><span class="pos">${i+4}</span>${av(p)}${nm(p)}<b>${p.score}</b></div>`).join('');
  return`<div class="podium">${pod}</div>${rest?`<div class="res rest">${rest}</div>`:''}`;
}
function mostNamed(players){const s=[...players].sort((a,b)=>(b.got||0)-(a.got||0));const m=s[0];if(!m||!m.got)return'';return`<div class="mostnamed" style="--c:${m.color}"><span class="mfinger">👉</span>${av(m,'lg')}<div><small>Il più nominato della serata</small><b>${nm(m)}</b><span>${m.got} voti in totale</span></div></div>`}

// ===== Schermate della stanza =====
let myPick=null,pickRound=-1;
const playerOf=id=>state.players.find(x=>x.id===id)||{name:'?',color:'#fff'};
const VIEWS={
  lobby:()=>`
    <div class="card share"><div class="lbl">Codice stanza</div><div class="bigcode">${[...code].map((ch,i)=>`<span style="--i:${i}">${esc(ch)}</span>`).join('')}</div><div id="qr" class="qr"></div><button class="btn ghost sm" data-a="copy">Condividi link d'invito</button></div>
    <h3>Giocatori</h3>
    <div id="plist" class="plist"></div>
    <div id="invfr"></div>
    ${isHost?`<h3>Impostazioni</h3>
      <div class="setting"><span>Domande</span><div class="seg" id="rounds"></div></div>
      <div class="setting tog"><span><b>Domande piccanti 🌶️</b><small>Ex, serate e figuracce. Per gruppi senza peli sulla lingua.</small></span><button type="button" class="switch" id="hotSw" data-a="hot" role="switch"></button></div>
      <div class="setting tog"><span><b>Voti scoperti 👀</b><small>Alla fine di ogni domanda si vede chi ha votato chi.</small></span><button type="button" class="switch" id="openSw" data-a="open" role="switch"></button></div>
      <button class="btn primary big" data-a="start" id="startBtn">Inizia la partita</button>`
    :`<div id="lobbyset" class="lobbyset"></div><p class="wait">In attesa che l'host avvii la partita…</p>`}`,
  vote:()=>{
    const S=state,mine=S.votes[me.id];
    const head=qCard(S.q,S.hotQ?'🌶️ Chi è più probabile che…':null);
    if(mine!=null){const t=playerOf(mine);return`${head}<div class="voted">${av(t,'xl')}<p class="okmsg">Hai votato <b>${nm(t)}</b> ✓</p><p class="hint">Il tuo voto è segreto${S.open?' fino alla fine della domanda':''}.</p></div><button class="btn ghost big" data-a="unvote">Cambia voto</button><div id="status"></div><div id="hostbar"></div>`}
    return`${head}<p class="hint tc">Tocca la persona che secondo te ci azzecca di più. Puoi votare anche te stesso.</p>
      <div id="vgrid"></div>
      <button class="btn primary big" data-a="vote" id="voteBtn" disabled>Scegli qualcuno</button>
      <div id="status"></div><div id="hostbar"></div>`;
  },
  reveal:()=>{
    const S=state,h=S.history[S.history.length-1]||{counts:{},top:[],votes:{}};
    const winners=h.top.map(playerOf),mine=h.votes[me.id],got=h.pts&&h.pts[me.id],last=S.round+1>=S.total;
    const verdict=verdictHtml(winners,h.counts);
    const myline=mine==null?'<p class="hint tc">Non hai votato questa volta.</p>':got?'<div class="myres ok">Hai letto nella mente del gruppo · <b>+1</b></div>':'<div class="myres no">Sei andato controcorrente · <b>+0</b></div>';
    return`${qCard(h.q,h.hot?'🌶️ Chi è più probabile che…':null)}${verdict}${myline}
      ${resultBars(S.players,h.counts,h.top,h.votes,S.open,mine)}
      ${isHost?`<button class="btn primary big" data-a="next">${last?'Vedi la classifica 🏆':'Prossima domanda →'}</button>`:`<p class="wait">In attesa dell'host…</p>`}`;
  },
  end:()=>{
    const S=state;
    return`<h2>Classifica finale</h2><p class="hint">Un punto ogni volta che hai votato come la maggioranza: chi conosce meglio il gruppo?</p>${podiumHtml(S.players)}
      ${mostNamed(S.players)}${awardsHtml(S.players,S.history||[])}
      <button class="btn big sharebtn" data-go="share">📸 Condividi il risultato</button>
      <button class="btn primary big" data-a="rematch" id="rematchBtn" style="margin-top:10px">🔁 Rivincita</button>
      <div id="rematchst"></div>
      ${isHost?`<button class="btn ghost big" data-a="again" style="margin-top:10px">Cambia giocatori o regole</button>`:''}
      <button class="btn ghost big" data-a="exit-end" style="margin-top:10px">Torna alla home</button>`;
  }
};

function renderTop(){
  const S=state,sorted=[...S.players].sort((a,b)=>b.score-a.score),inGame=S.phase!=='lobby';
  const changed=S.players.filter(p=>prevScores[p.id]!=null&&p.score>prevScores[p.id]).map(p=>p.id);
  if(changed.length){bumpSet=new Set(changed);bumpPhase=S.phase}else if(S.phase!==bumpPhase)bumpSet=new Set();
  prevScores=Object.fromEntries(S.players.map(p=>[p.id,p.score]));
  const pct=S.total?Math.min(100,(S.round+1)/S.total*100):0;
  $('#top').innerHTML=`<div class="bar g3"><button class="exit" data-a="exit" aria-label="Esci dalla partita"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>Esci</button><button class="codechip" data-a="copy" aria-label="Condividi il codice ${esc(code)}">🔗 ${esc(code)}</button>${soundBtn('iconbtn sm sndb')}</div>${inGame&&S.phase!=='end'?`<div class="rndrow"><span class="rnd">Domanda ${Math.min(S.round+1,S.total)}/${S.total}<span class="prog"><span style="width:${pct}%"></span></span></span></div>`:''}
  ${inGame?`<div class="scores">${sorted.map(p=>`<span class="sc ${online.has(p.id)?'':'off'} ${bumpSet.has(p.id)?'bump':''}">${av(p,'sm')}${nm(p)} <b>${p.score}</b></span>`).join('')}</div>`:''}`;
}
function render(){
  if(!state||!code)return;
  const S=state;
  if($('#tabs').innerHTML){$('#tabs').innerHTML='';document.body.classList.remove('has-tabs')}
  if(pickRound!==S.round+'|'+S.q){myPick=null;pickRound=S.round+'|'+S.q}
  renderTop();
  const voted=S.votes&&S.votes[me.id]!=null;
  const key=[S.phase,S.round,S.q,isHost?'H':'',S.phase==='vote'?voted:''].join('#');
  if(key!==lastKey){
    const prevPhase=lastKey.split('#')[0];
    lastKey=key;
    $('#app').innerHTML=(VIEWS[S.phase]||VIEWS.lobby)();
    enterAnim();
    const qr=$('#qr');if(qr&&window.QRCode){try{new QRCode(qr,{text:inviteLink(),width:150,height:150,colorDark:'#0b0a0d',colorLight:'#ffffff'})}catch(e){}}
    if(S.phase==='reveal'&&prevPhase!=='reveal'){const h=S.history[S.history.length-1]||{};buzz([20,60,20]);SFX.reveal(Object.keys(h.counts||{}).length,(h.pts||{})[me.id]===1);if((h.top||[]).includes(me.id))confetti(110,900)}
    if(S.phase==='end'&&prevPhase!=='end'){confetti(200,1500);SFX.fanfare(1.2);setTimeout(()=>confetti(120),2600);if(window.recordMatch)recordMatch()}
    if(S.phase==='vote'&&prevPhase!=='vote'){buzz(20);SFX.chime()}
  }
  updateDyn();
}
function paintPick(){
  document.querySelectorAll('.vopt').forEach(b=>b.classList.toggle('on',b.dataset.id===myPick));
  const vb=$('#voteBtn');if(vb){vb.disabled=!myPick;vb.textContent=myPick?`Vota ${state?playerOf(myPick).name:''}`:'Scegli qualcuno'}
}
function updateDyn(){
  const S=state;
  const pl=$('#plist');if(pl){pl.innerHTML=S.players.map(p=>{const isNew=!seenPlayers.has(p.id);return`<div class="pl ${online.has(p.id)?'':'off'} ${isNew?'new':''}">${av(p)}<span>${nm(p)}</span>${p.id===S.hostId?'<em>host</em>':''}${p.id===me.id?'<em>tu</em>':''}${isHost&&!online.has(p.id)&&p.id!==S.hostId?`<button class="x" data-a="kick" data-id="${p.id}">rimuovi</button>`:''}</div>`}).join('');if(seenPlayers.size&&S.players.some(p=>!seenPlayers.has(p.id)&&p.id!==me.id))SFX.join();S.players.forEach(p=>seenPlayers.add(p.id))}
  const rd=$('#rounds');if(rd)rd.innerHTML=[5,10,15,20].map(v=>`<button data-a="rounds" data-v="${v}" class="${S.rounds===v?'on':''}">${v}</button>`).join('');
  const hs=$('#hotSw');if(hs){hs.classList.toggle('on',!!S.hot);hs.setAttribute('aria-checked',!!S.hot)}
  const os=$('#openSw');if(os){os.classList.toggle('on',!!S.open);os.setAttribute('aria-checked',!!S.open)}
  const ls_=$('#lobbyset');if(ls_)ls_.innerHTML=`<span class="tag">${S.rounds} domande</span>${S.hot?'<span class="tag gold">🌶️ Piccanti</span>':''}${S.open?'<span class="tag">👀 Voti scoperti</span>':'<span class="tag">🤫 Voti segreti</span>'}`;
  const vg=$('#vgrid');if(vg){vg.innerHTML=voteGrid(S.players.filter(p=>online.has(p.id)||S.votes[p.id]!=null),myPick);paintPick()}
  const rb=$('#rematchBtn');if(rb){const votes=(S.rematch||[]).filter(id=>S.players.some(p=>p.id===id)),mine=votes.includes(me.id);
    rb.disabled=!isHost&&mine;rb.textContent=isHost?(votes.filter(v=>v!==me.id).length?(n=>`🔁 Rivincita · ${n} ${n===1?'pronto':'pronti'}`)(votes.filter(v=>v!==me.id).length):'🔁 Rivincita'):mine?'Pronto! Aspetto gli altri…':'🔁 Rivincita';
    const rs=$('#rematchst');if(rs)rs.innerHTML=votes.length?`<p class="hint" style="margin:10px 0 0">Vogliono la rivincita:</p><div class="chips" style="margin-top:6px">${votes.map(id=>{const p=playerOf(id);return`<span class="chip done">${av(p,'sm')}${nm(p)}</span>`}).join('')}</div>${isHost?'':'<p class="hint" style="margin-top:6px">Si riparte quando sono pronti tutti o quando l\'host conferma</p>'}`:''}
  const startB=$('#startBtn');if(startB){const few=S.players.length<3;startB.disabled=few;startB.textContent=few?`Servono almeno 3 giocatori (${S.players.length}/3)`:`Inizia la partita (${S.players.length} giocatori)`}
  const st=$('#status');if(st){const ps=S.players.filter(p=>online.has(p.id)||S.votes[p.id]!=null),n=ps.filter(p=>S.votes[p.id]!=null).length;
    st.innerHTML=`<p class="vcount"><b>${n}</b> su ${ps.length} hanno votato</p><div class="chips">${ps.map(p=>{const d=S.votes[p.id]!=null;return`<span class="chip ${d?'done':''} ${online.has(p.id)?'':'off'}">${av(p,'sm')}${nm(p)} <span class="st">${d?'✅':'⏳'}</span></span>`}).join('')}</div>`}
  if(window.renderInviteFriends)renderInviteFriends();
  const hb=$('#hostbar');if(hb)hb.innerHTML=isHost&&S.phase==='vote'?`${Object.keys(S.votes).length?'<button class="btn ghost sm" data-a="reveal">Rivela ora</button>':''}<button class="btn ghost sm" data-a="reroll">🔄 Cambia domanda</button>`:'';
}

// ===== Azioni UI =====
async function copyLink(){const link=inviteLink();if(navigator.share){try{await navigator.share({title:'Nomination',text:'Entra nella mia stanza di Nomination: '+code,url:link});return}catch(e){if(e&&e.name==='AbortError')return}}try{await navigator.clipboard.writeText(link);toast('Link copiato!')}catch(e){prompt('Copia il link:',link)}}
function act(a,el){
  switch(a){
    case 'copy':copyLink();break;
    case 'exit':if(confirm(isHost?"Sei l'host: se esci la partita si ferma per tutti (potrai riprenderla dalla home). Uscire?":'Uscire dalla stanza?')){leave();goHome()}break;
    case 'start':buzz(30);send({type:'start'});break;
    case 'rounds':send({type:'rounds',v:+el.dataset.v});break;
    case 'hot':send({type:'hot',v:!state.hot});break;
    case 'open':send({type:'open',v:!state.open});break;
    case 'kick':send({type:'kick',id:el.dataset.id});break;
    case 'pick':myPick=el.dataset.id;SFX.tap();buzz(8);paintPick();break;
    case 'vote':if(!myPick){toast('Scegli qualcuno');return}buzz(25);SFX.pop();send({type:'vote',v:myPick});break;
    case 'unvote':send({type:'unvote'});break;
    case 'reroll':if(confirm('Cambiare domanda? I voti di questa andranno persi.'))send({type:'reroll'});break;
    case 'reveal':send({type:'reveal'});break;
    case 'next':send({type:'next'});break;
    case 'again':send({type:'again'});break;
    case 'rematch':buzz(20);SFX.pop();send({type:'rematch'});break;
    case 'exit-end':leave();goHome();break;
  }
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(b&&!b.disabled)act(b.dataset.a,b)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b&&!b.disabled&&window.go)go(b.dataset.go,b)});
