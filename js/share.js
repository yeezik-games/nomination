// ===== Nomination · immagine del risultato da condividere (formato storia 1080×1920) =====
// data: {mode:'solo'|'team', players:[{name,color,score,uid}], team, max, best:{clue,card,line}}
async function makeResultImage(data){
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  try{await document.fonts.load('900 80px Rubik');await document.fonts.load('600 40px Rubik')}catch(e){}
  const F=(w,s)=>`${w} ${s}px Rubik, system-ui, sans-serif`;
  // sfondo
  let g=x.createLinearGradient(0,0,0,H);g.addColorStop(0,'#3d0f30');g.addColorStop(.45,'#1a0f16');g.addColorStop(1,'#09080a');x.fillStyle=g;x.fillRect(0,0,W,H);
  const blob=(cx,cy,r,col)=>{const rg=x.createRadialGradient(cx,cy,0,cx,cy,r);rg.addColorStop(0,col);rg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=rg;x.fillRect(0,0,W,H)};
  blob(900,180,620,'rgba(230,0,126,.35)');blob(120,1500,700,'rgba(184,134,43,.28)');
  // pallini colorati come nell'icona
  const cols=['#a66bff','#e6007e','#f2c14e','#7cff6b','#b18cff','#ff9f43'];
  const dots=[[90,140,14],[260,70,8],[980,90,12],[1020,420,9],[60,560,10],[1030,760,7],[50,1060,12],[1040,1180,10],[70,1720,9],[1010,1640,14],[540,1860,7],[300,1820,10],[820,1830,8]];
  dots.forEach(([dx,dy,r],i)=>{const col=cols[i%cols.length];x.save();x.shadowColor=col;x.shadowBlur=r*3;x.fillStyle=col;x.beginPath();x.arc(dx,dy,r,0,7);x.fill();x.restore();x.fillStyle='rgba(255,255,255,.55)';x.beginPath();x.arc(dx-r*.3,dy-r*.35,r*.28,0,7);x.fill()});
  for(let i=0;i<40;i++){x.fillStyle=`rgba(255,255,255,${.15+Math.random()*.45})`;x.beginPath();x.arc(Math.random()*W,Math.random()*H,1.5+Math.random()*2.5,0,7);x.fill()}
  // icona
  await new Promise(res=>{const im=new Image();im.onload=()=>{x.save();x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=40;x.shadowOffsetY=16;x.drawImage(im,W/2-115,80,230,230);x.restore();res()};im.onerror=res;im.src='icons/icon-512.png'});
  // titolo
  x.textAlign='center';x.textBaseline='alphabetic';
  x.font=F(900,124);let tg=x.createLinearGradient(W/2-330,0,W/2+330,0);tg.addColorStop(0,'#a66bff');tg.addColorStop(.5,'#e6007e');tg.addColorStop(1,'#f2c14e');x.fillStyle=tg;x.fillText('Nomination',W/2,440);
  x.font=F(600,42);x.fillStyle='#d4cab4';x.fillText('Chi conosce meglio il gruppo?',W/2,505);
  const rr=(X,Y,w,h,r)=>{x.beginPath();x.moveTo(X+r,Y);x.arcTo(X+w,Y,X+w,Y+h,r);x.arcTo(X+w,Y+h,X,Y+h,r);x.arcTo(X,Y+h,X,Y,r);x.arcTo(X,Y,X+w,Y,r);x.closePath()};
  const avatar=(cx,cy,r,p)=>{x.save();x.shadowColor=p.color;x.shadowBlur=30;x.fillStyle=p.color;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.restore();
    const hg=x.createRadialGradient(cx-r*.35,cy-r*.4,0,cx-r*.35,cy-r*.4,r);hg.addColorStop(0,'rgba(255,255,255,.55)');hg.addColorStop(.5,'rgba(255,255,255,0)');x.fillStyle=hg;x.beginPath();x.arc(cx,cy,r,0,7);x.fill();
    x.lineWidth=6;x.strokeStyle='#0b0a0d';x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();
    x.fillStyle='#0b0a0d';x.font=F(900,r*.95);x.textBaseline='middle';x.fillText((p.name||'?').replace(/^anon_/,'')[0].toUpperCase(),cx,cy+r*.04);x.textBaseline='alphabetic'};
  const nameFit=(t,max,size)=>{x.font=F(800,size);let s=t;while(x.measureText(s).width>max&&s.length>2)s=s.slice(0,-2)+'…';return s};
  const verified=(tx,ty,size,p)=>{if(!(p.uid&&typeof devIds!=='undefined'&&devIds.has(p.uid)))return;x.font=F(800,size);const w=x.measureText(p._shown).width;const cx=tx+w/2+size*.55,cy=ty-size*.35,r=size*.42;x.fillStyle='#a66bff';x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.strokeStyle='#0b0a0d';x.lineWidth=size*.1;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(cx-r*.45,cy);x.lineTo(cx-r*.1,cy+r*.35);x.lineTo(cx+r*.5,cy-r*.35);x.stroke()};
  let y=560;
  if(data.mode==='team'){
    rr(140,y,800,520,48);x.fillStyle='rgba(25,22,29,.85)';x.fill();x.lineWidth=4;x.strokeStyle='rgba(242,193,78,.55)';x.stroke();
    x.font=F(900,230);x.fillStyle='#f2c14e';x.fillText(String(data.team),W/2,y+290);
    x.font=F(600,44);x.fillStyle='#d4cab4';x.fillText(`su ${data.max} punti`,W/2,y+360);
    const pct=data.max?data.team/data.max:0;rr(220,y+410,640,26,13);x.fillStyle='#2a2530';x.fill();
    const bg2=x.createLinearGradient(220,0,860,0);bg2.addColorStop(0,'#a66bff');bg2.addColorStop(.5,'#e6007e');bg2.addColorStop(1,'#f2c14e');rr(220,y+410,Math.max(26,640*pct),26,13);x.fillStyle=bg2;x.fill();
    y+=580;
    const ps=data.players.slice(0,8),gap=Math.min(120,860/ps.length);
    ps.forEach((p,i)=>avatar(W/2-(ps.length-1)*gap/2+i*gap,y+50,44,p));
    y+=150;
  }else{
    const s=[...data.players].sort((a,b)=>b.score-a.score);
    const cols3=[{p:s[1],x:250,h:210,m:'2°',c1:'#e2dccb',c2:'#9a8f7a',t:'#2e2618'},{p:s[0],x:540,h:300,m:'1°',c1:'#f2c14e',c2:'#b8862b',t:'#3a2a00'},{p:s[2],x:830,h:160,m:'3°',c1:'#ffae73',c2:'#c8692a',t:'#3d1a00'}];
    cols3.forEach(k=>{if(k.p)k.pos=1+s.filter(q=>q.score>k.p.score).length});
    const base=y+560;
    cols3.forEach(k=>{if(!k.p)return;const top=base-k.h;
      const cg=x.createLinearGradient(0,top,0,base);cg.addColorStop(0,k.c1);cg.addColorStop(1,k.c2);rr(k.x-120,top,240,k.h+20,28);x.fillStyle=cg;x.fill();
      x.fillStyle=k.t;x.font=F(900,64);x.fillText(String(k.p.score),k.x,top+90);x.font=F(800,34);x.fillText(k.pos+'°',k.x,top+135);
      avatar(k.x,top-(k.m==='1°'?150:132),k.m==='1°'?82:66,k.p);
      const shown=nameFit(k.p.name,250,40);k.p._shown=shown;x.fillStyle='#fbf6ea';x.font=F(800,40);x.fillText(shown,k.x,top-22);verified(k.x,top-22,40,k.p);
      if(k.m==='1°'){x.font=F(400,70);x.fillText('👑',k.x,top-246)}
    });
    y=base+50;
    s.slice(3,5).forEach((p,i)=>{rr(160,y,760,84,24);x.fillStyle='rgba(25,22,29,.85)';x.fill();x.fillStyle='#b5aa98';x.font=F(900,36);x.textAlign='left';x.fillText(`${1+s.filter(q=>q.score>p.score).length}°`,190,y+56);avatar(290,y+42,28,p);x.textAlign='left';x.fillStyle='#fbf6ea';x.font=F(700,36);x.fillText(nameFit(p.name,420,36),340,y+55);x.textAlign='right';x.fillStyle='#f2c14e';x.font=F(900,40);x.fillText(String(p.score),890,y+57);x.textAlign='center';y+=96});
    if(s.length>5){x.fillStyle='#b5aa98';x.font=F(600,30);x.fillText(s.length-5===1?'e un altro giocatore':`e altri ${s.length-5} giocatori`,W/2,y+30);y+=50}
    y+=20;
  }
  // il più nominato della serata
  if(data.named){
    const by=Math.min(Math.max(y,1280),H-470);rr(110,by,860,290,40);x.fillStyle='rgba(25,22,29,.88)';x.fill();x.setLineDash([14,10]);x.lineWidth=3;x.strokeStyle='rgba(230,0,126,.6)';x.stroke();x.setLineDash([]);
    x.fillStyle='#e6007e';x.font=F(800,30);x.fillText('👉 IL PIÙ NOMINATO DELLA SERATA',W/2,by+70);
    x.fillStyle='#ffffff';let fs=72;x.font=F(900,fs);const q=data.named.name;while(x.measureText(q).width>780&&fs>34){fs-=4;x.font=F(900,fs)}x.fillText(q,W/2,by+155);
    x.fillStyle='#c2b8a3';x.font=F(500,32);x.fillText(`${data.named.got} voti in totale`,W/2,by+205);
    if(data.named.q){let t='il più probabile che '+data.named.q;x.font=F(600,30);while(x.measureText(t).width>780&&t.length>10)t=t.slice(0,-2)+'…';x.fillStyle='#f2c14e';x.fillText(t,W/2,by+255)}
  }
  // piè di pagina
  x.fillStyle='#b5aa98';x.font=F(500,30);x.fillText(new Date().toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}),W/2,H-120);
  x.fillStyle='#fbf6ea';x.font=F(700,36);x.fillText('Gioca anche tu: yeezik-games.github.io/nomination',W/2,H-70);
  return new Promise(res=>c.toBlob(res,'image/png'));
}
function namedOf(players,history){
  const m=[...players].sort((a,b)=>(b.got||0)-(a.got||0))[0];if(!m||!m.got)return null;
  const aw=awards(players,history).find(a=>a.p.id===m.id);
  return{name:m.name,got:m.got,q:aw?aw.q:''};
}
async function shareResult(data){
  toast('Preparo l’immagine…',1500);
  const blob=await makeResultImage(data);if(!blob){toast('Non riesco a creare l’immagine');return}
  const file=new File([blob],'nomination-risultato.png',{type:'image/png'});
  try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Nomination',text:'Guarda com’è andata a Nomination! https://yeezik-games.github.io/nomination/'});return}}catch(e){if(e&&e.name==='AbortError')return}
  const url=URL.createObjectURL(blob);
  const m=document.createElement('div');m.className='modal center-modal';
  m.innerHTML=`<div class="sharebox"><img src="${url}" alt="Immagine del risultato"><p class="hint">Tieni premuto sull’immagine per salvarla, oppure scaricala.</p><div class="grid2"><a class="btn primary" href="${url}" download="nomination-risultato.png">Scarica</a><button class="btn ghost close" type="button">Chiudi</button></div></div>`;
  m.addEventListener('click',e=>{if(e.target===m||e.target.closest('.close')){m.remove();URL.revokeObjectURL(url)}});
  document.body.appendChild(m);
}
function shareOnline(){
  const S=state;if(!S)return;
  shareResult({mode:'solo',players:S.players.map(p=>({name:p.name,color:p.color,score:p.score,uid:p.uid})),named:namedOf(S.players,S.history||[])});
}
function shareLocal(){
  if(!L)return;
  shareResult({mode:'solo',players:L.players.map(p=>({name:p.name,color:p.color,score:p.score,uid:p.uid})),named:namedOf(L.players,L.history)});
}
