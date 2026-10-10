(() => {
  'use strict';
  const canvas = document.querySelector('#canvas'), ctx = canvas.getContext('2d');
  const angle = document.querySelector('#angle'), power = document.querySelector('#power');
  const button = document.querySelector('#throw'), status = document.querySelector('#status');
  const W = 600, H = 510, xs = [115, 207.5, 300, 392.5, 485];
  let state, shot = null, timer = null, generation = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function reset() {
    generation++; clearTimeout(timer); shot = null;
    state = {player: Array(5).fill(true), cpu: Array(5).fill(true), turn:'player', left:3, over:false};
    angle.value = 0; power.value = 80; sync();
    status.textContent = 'Sikt på en av kubbene langs den øverste linjen.'; draw();
  }
  function sync() {
    for (const side of ['player','cpu']) {
      const fallen = 5 - state[side === 'player' ? 'cpu' : 'player'].filter(Boolean).length;
      document.querySelector(`#${side}-score`).innerHTML = `${fallen} <small>/ 5</small>`;
    }
    document.querySelector('#turn').textContent = state.over ? 'SPILLET ER FERDIG' : state.turn === 'player' ? 'DIN TUR' : 'MOTSTANDERENS TUR';
    document.querySelector('#throws').textContent = state.over ? 'NYTT SPILL ↗' : `${state.left} KAST IGJEN`;
    button.disabled = angle.disabled = power.disabled = state.over || !!shot || state.turn !== 'player';
    document.querySelector('#angle-value').textContent = `${angle.value}°`;
    document.querySelector('#power-value').textContent = `${power.value} %`;
  }
  function trajectory(side, degrees, force) {
    const start = {x:300, y:side === 'player' ? 459 : 51};
    const radians = degrees * Math.PI / 180, direction = side === 'player' ? -1 : 1;
    const length = Number(force) * 5.15;
    return {start, end:{x:start.x + Math.sin(radians)*length, y:start.y + direction*Math.cos(radians)*length}};
  }
  function collision(path, side) {
    // Long throws fly over the king; a short throw can land on it.
    const candidates = Math.hypot(path.end.x-300,path.end.y-255)<32 ? [{x:300,y:255,king:true}] : [];
    const target = side === 'player' ? 'cpu' : 'player';
    state[target].forEach((standing,i) => {if(standing)candidates.push({x:xs[i],y:target === 'cpu' ? 76 : 434,index:i});});
    const dx=path.end.x-path.start.x,dy=path.end.y-path.start.y,len=dx*dx+dy*dy;
    return candidates.map(c => {
      const t=((c.x-path.start.x)*dx+(c.y-path.start.y)*dy)/len;
      const distance=Math.hypot(c.x-path.start.x-clamp(t,0,1)*dx,c.y-path.start.y-clamp(t,0,1)*dy);
      return {...c,t,distance};
    }).filter(c=>c.t>=0 && c.t<=1 && c.distance<(c.king?19:18)).sort((a,b)=>a.t-b.t)[0];
  }
  function launch(side, degrees, force) {
    if(state.over || shot)return;
    const path=trajectory(side,degrees,force), hit=collision(path,side);
    shot={...path,hit,side,started:performance.now(),duration:700}; sync(); requestAnimationFrame(animate);
  }
  function animate(now) {
    if(!shot)return;
    const progress=Math.min(1,(now-shot.started)/shot.duration), end=shot.hit?shot.hit.t:1;
    shot.position={x:shot.start.x+(shot.end.x-shot.start.x)*progress*end,y:shot.start.y+(shot.end.y-shot.start.y)*progress*end};
    shot.rotation=progress*12;draw();
    if(progress<1)requestAnimationFrame(animate);else finish();
  }
  function finish() {
    const {side,hit}=shot;shot=null;
    const target=side==='player'?'cpu':'player';
    if(hit?.king){
      const legal=state[target].every(v=>!v), winner=legal?side:target;
      state.over=true;status.textContent=winner==='player'?'Du vant! Kongen er felt. Klar for en ny runde?':'Motstanderen vant. '+(legal?'Kongen er felt.':'Du traff kongen før alle kubbene var nede.');
    }else{
      if(hit){state[target][hit.index]=false;status.textContent=side==='player'?'Treff! En kubb er nede.':'Motstanderen felte en av kubbene dine.';}
      else status.textContent=side==='player'?'Bom! Juster retningen eller kraften og prøv igjen.':'Motstanderen bommet.';
      state.left--;
      if(state.left===0){state.turn=target;state.left=3;}
      if(state[target].every(v=>!v))status.textContent+=' Alle kubbene er nede — sikt på kongen!';
    }
    sync();draw();
    if(!state.over && state.turn==='cpu'){
      const token=generation;
      timer=setTimeout(()=>{if(token!==generation)return;cpuThrow();},1000);
    }
  }
  function cpuThrow(){
    const remaining=state.player.map((v,i)=>v?i:-1).filter(i=>i>=0);
    let x,y;
    if(remaining.length){x=xs[remaining[Math.floor(Math.random()*remaining.length)]];y=434;}else{x=300;y=255;}
    const dx=x-300,dy=y-51;
    const degrees=Math.atan2(dx,dy)*180/Math.PI+(Math.random()-.5)*5;
    const force=clamp((Math.hypot(dx,dy)+22)/5.15,20,100);
    launch('cpu',degrees,force);
  }
  function block(x,y,king,standing){
    ctx.save();ctx.translate(x,y);if(!standing)ctx.rotate(.9);
    ctx.fillStyle='#28463455';ctx.fillRect(-10, -8,king?28:24,king?37:28);
    ctx.fillStyle=king?'#dba453':'#e9c993';ctx.fillRect(-12,-15,king?24:20,king?33:25);
    ctx.fillStyle=king?'#f3c573':'#f7deaf';ctx.fillRect(-12,-15,king?24:20,6);
    ctx.strokeStyle='#ac7e453e';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-5,-4);ctx.lineTo(-5,13);ctx.moveTo(3,-3);ctx.lineTo(3,9);ctx.stroke();
    if(king){ctx.fillStyle='#946632';ctx.fillRect(-7,-20,4,7);ctx.fillRect(3,-20,4,7);}
    ctx.restore();
  }
  function draw(){
    const dpr=window.devicePixelRatio||1, rect=canvas.getBoundingClientRect();
    if(canvas.width!==Math.round(rect.width*dpr)||canvas.height!==Math.round(rect.height*dpr)){canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);}
    ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
    ctx.fillStyle='#63876a';ctx.fillRect(0,0,W,H);
    for(let row=0;row<8;row++){ctx.fillStyle=row%2?'#ffffff04':'#233f3008';ctx.fillRect(0,row*H/8,W,H/8);}
    for(let i=0;i<180;i++){const x=(i*173.3)%W,y=(i*97.7)%H;ctx.strokeStyle='#c4d8a718';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+2,y-4);ctx.stroke();}
    ctx.strokeStyle='#ebeedb80';ctx.lineWidth=1.5;ctx.strokeRect(65,76,470,358);ctx.setLineDash([5,7]);ctx.beginPath();ctx.moveTo(65,255);ctx.lineTo(535,255);ctx.stroke();ctx.setLineDash([]);
    [[65,76],[535,76],[65,434],[535,434]].forEach(([x,y])=>{ctx.fillStyle='#efe1ba';ctx.fillRect(x-2,y-7,4,14);});
    state.cpu.forEach((v,i)=>block(xs[i],76,false,v));state.player.forEach((v,i)=>block(xs[i],434,false,v));block(300,255,true,true);
    if(!state.over && state.turn==='player' && !shot){
      const path=trajectory('player',Number(angle.value),Number(power.value));
      ctx.strokeStyle='#fff4cd99';ctx.lineWidth=2;ctx.setLineDash([4,9]);ctx.beginPath();ctx.moveTo(path.start.x,path.start.y);ctx.lineTo(path.end.x,path.end.y);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle='#fff4cdaa';ctx.beginPath();ctx.arc(path.end.x,path.end.y,8,0,Math.PI*2);ctx.stroke();
    }
    ctx.fillStyle='#f2e4c2';ctx.beginPath();ctx.arc(300,459,5,0,Math.PI*2);ctx.fill();
    if(shot?.position){ctx.save();ctx.translate(shot.position.x,shot.position.y);ctx.rotate(shot.rotation);ctx.shadowColor='#203c30';ctx.shadowBlur=5;ctx.fillStyle='#ffe2ab';ctx.fillRect(-4,-19,8,38);ctx.restore();}
  }
  canvas.addEventListener('pointerdown',e=>{
    if(state.turn!=='player'||state.over||shot)return;
    const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
    angle.value=Math.round(clamp(Math.atan2(x-300,459-y)*180/Math.PI,-32,32));sync();draw();
  });
  [angle,power].forEach(input=>input.addEventListener('input',()=>{sync();draw();}));
  button.addEventListener('click',()=>{if(state.turn==='player')launch('player',Number(angle.value),Number(power.value));});
  document.querySelector('#reset').addEventListener('click',reset);
  window.addEventListener('resize',draw);reset();
})();
