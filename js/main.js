(function(){
  document.title = window.AppConfig.NAME;
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
  const C = window.AppCharacter;
  const A = window.AppAudio;
  const S = window.AppState;
  const R = window.AppReactions;
  const character = C.character;
  const rig = C.rig;
  const hint = document.getElementById('hint');
  const meterFill = document.getElementById('meterFill');
  window.addEventListener('meterchange', e => { meterFill.style.width = `${e.detail.gauge}%`; });
  const HOLD_MS = 380;
  const PUSH_MS = 450;
  const PUSH_DX = 90;
  const PUSH_RATIO = 1.3;
  const TICKLE_HOLD = 140;
  const TICKLE_BURST = 460;
  const TICKLE_DECAY = 0.8;
  const PET_Y = 115;
  const PET_DIST = 180;
  const SULK_STROKE = 600;
  let pressTimer = null, pressed = false;
  let fallen=false, fallDir=1, fallTO=null, struggleInt=null;
  let sx=0, sy=0, st=0, lx=0, ly=0;
  let strokeDist=0, petDist=0, isDown=false, tickleE=0, tickling=null;
  let combo=0, comboTimer=null;

  function partFromPoint(_x,y){ if(y < 118) return 'head'; if(y > 210) return 'butt'; return 'belly'; }
  window.addEventListener('pointermove', e => C.trackPointer(e, S.state, fallen));
  function clearComboLater(){ clearTimeout(comboTimer); comboTimer=setTimeout(()=>{ combo=0; C.setComboScale(0); character.classList.remove('tremble'); },1200); }
  function restoreSoon(ms=900){ setTimeout(()=>{ if(S.state!=='sulking'&&S.state!=='reconcile') C.restoreForState(S.state); },ms); }
  function pushOver(dir){
    if(S.state==='sulking'||S.state==='reconcile'||fallen) return;
    if(S.hairDetached) S.reattachHair();
    fallen=true; fallDir=dir; tickleE=0; tickling=null;
    character.classList.remove('tremble','squash','jump','wobble','shake');
    R.run({input:'push', state:S.state}, {x:150,y:150}); C.faceTeary();
    rig.style.transformOrigin='150px 160px';
    rig.animate([{transform:'translateY(0) rotate(0deg)'}, {transform:`translateY(26px) rotate(${dir*96}deg)`}], {duration:600,easing:'cubic-bezier(.3,1.3,.6,1)',fill:'forwards'});
    C.updateShadow(1.3, 0.32, 0);
    setTimeout(()=>{ if(!fallen) return; rig.animate([{transform:`translateY(26px) rotate(${dir*96}deg)`},{transform:`translateY(26px) rotate(${dir*82}deg)`},{transform:`translateY(26px) rotate(${dir*100}deg)`}], {duration:1200,iterations:Infinity,easing:'ease-in-out'}); struggleInt=setInterval(()=>R.run({input:'fallen_wait', state:'fallen'}),1600); },600);
    fallTO=setTimeout(()=>getUp(false),9000);
  }
  function getUp(helped){
    if(!fallen) return; fallen=false; clearTimeout(fallTO); clearInterval(struggleInt);
    rig.getAnimations().forEach(a=>a.cancel());
    rig.animate([{transform:`translateY(26px) rotate(${fallDir*96}deg)`},{transform:`translateY(0) rotate(${-fallDir*15}deg)`},{transform:`rotate(${fallDir*5}deg)`},{transform:'rotate(0deg)'}], {duration:850,easing:'ease-out'}).onfinish=()=>{ rig.style.transformOrigin=''; };
    C.updateShadow(1, 0.26, 0); C.setTears(0); A.boing();
    R.run({input: helped ? 'help' : 'ignored', state:'fallen'}); restoreSoon(900);
  }
  function poke(x,y,part){
    if(S.state==='sulking'){ R.run({input:'tap', part:'any', state:'sulking'}, {x,y}); return; }
    if(S.state==='reconcile') return;
    combo++; C.setComboScale(combo); clearComboLater();
    const context = {x,y,combo};
    if(combo === 8 && !S.hairDetached){ S.detachHair(Math.random()<.5?-1:1); S.addGauge(14); return; }
    if(combo > 6){ R.run({input:'combo', state:S.state}, context); S.addGauge(14); return; }
    R.run({input:'tap', part, state:S.state}, context);
  }
  function pinchStart(){ if(S.state==='sulking'||S.state==='reconcile'||fallen) return; pressed=true; rig.style.transition='transform .15s cubic-bezier(.2,.9,.4,1.2)'; rig.style.transform='scale(1.5,.4)'; C.faceTeary(); R.run({input:'press_start', state:S.state}); }
  function pinchEnd(){ if(!pressed) return; pressed=false; rig.style.transform=''; setTimeout(()=>{ rig.style.transition=''; },400); R.run({input:'press_end', state:S.state}); restoreSoon(500); }
  character.addEventListener('pointerdown', e=>{
    e.preventDefault(); hint.style.opacity=0; isDown=true; try{ character.setPointerCapture(e.pointerId); }catch(_err){}
    const r=C.stage.getBoundingClientRect(); const x=e.clientX-r.left, y=e.clientY-r.top;
    sx=lx=e.clientX; sy=ly=e.clientY; st=Date.now(); petDist=0; strokeDist=0;
    if(!fallen) pressTimer=setTimeout(()=>{ pressTimer=null; pinchStart(); },HOLD_MS);
    character._xy=[x,y,partFromPoint(x,y)];
  });
  window.addEventListener('pointerup', ()=>{
    isDown=false; const dx=lx-sx, dy=ly-sy, dt=Date.now()-st;
    if(fallen){ if(Math.abs(dx)+Math.abs(dy)<30){ if(pressTimer){clearTimeout(pressTimer);pressTimer=null;} getUp(true); } return; }
    if(!pressed && dt<PUSH_MS && Math.abs(dx)>PUSH_DX && Math.abs(dx)>Math.abs(dy)*PUSH_RATIO){ if(pressTimer){ clearTimeout(pressTimer); pressTimer=null; } pushOver(dx>0?1:-1); return; }
    if(pressTimer){ clearTimeout(pressTimer); pressTimer=null; if(!tickling) poke(...(character._xy||[150,150,'belly'])); }
    else pinchEnd();
  });
  character.addEventListener('pointermove', e=>{
    if(!isDown) return; lx=e.clientX; ly=e.clientY; const r=C.stage.getBoundingClientRect(); const yRelative=e.clientY-r.top;
    if(fallen) return;
    if(S.state==='sulking'){ strokeDist+=Math.abs(e.movementX)+Math.abs(e.movementY); if(strokeDist>SULK_STROKE){ strokeDist=0; S.clearSulkTimer(); S.reconcile(); } return; }
    if(pressed || S.state==='reconcile') return;
    const movement=Math.abs(e.movementX)+Math.abs(e.movementY);
    if(movement>4){
      if(pressTimer){ clearTimeout(pressTimer); pressTimer=null; }
      if(yRelative<PET_Y && S.state==='calm'){
        petDist+=movement;
        if(petDist>PET_DIST){ petDist=0; R.run({input:'pet', state:S.state}, {x:e.clientX-r.left, y:e.clientY-r.top}); }
        return;
      }
      tickleE+=movement;
    }
    if(tickleE>TICKLE_HOLD && !tickling){ tickling='hold'; C.faceHoldLaugh(); R.run({input:'tickle_hold', state:S.state}); }
    if(tickleE>TICKLE_BURST && tickling==='hold'){
      tickling='burst'; C.faceLaugh(); R.run({input:'tickle_burst', state:S.state}, {x:150,y:150});
      setTimeout(()=>{ tickling=null; tickleE=0; C.restoreForState(S.state); },1500);
    }
  });
  setInterval(()=>{ if(tickling!=='burst') tickleE=Math.max(0,tickleE*TICKLE_DECAY-2); if(tickleE<60&&tickling==='hold'){ tickling=null; character.classList.remove('tremble'); C.restoreForState(S.state); } },200);
  C.faceSmug();
  C.$('body').animate([{transform:'scale(1,1)'},{transform:'scale(1.025,1.05)'},{transform:'scale(1,1)'}], {duration:2500,iterations:Infinity,easing:'ease-in-out'});
  setInterval(()=>{ if(S.state==='calm'&&!pressed&&!isDown){ C.$('browR').setAttribute('d','M180 100 Q198 92 216 100'); setTimeout(()=>{ if(S.state==='calm') C.$('browR').setAttribute('d','M180 108 Q198 98 216 108'); },400); }},4200);
})();
