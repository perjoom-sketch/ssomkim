(function(){
  document.title = window.AppConfig.NAME;
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
  const C = window.AppCharacter;
  const A = window.AppAudio;
  const S = window.AppState;
  const R = window.AppReactions;
  const character = C.character;
  const rig = C.rig;
  const hint = document.getElementById('hint');
  let pressTimer = null;
  let pressed = false;
  let fallen = false;
  let fallDir = 1;
  let fallTO = null;
  let struggleInt = null;
  let sx = 0, sy = 0, st = 0, lx = 0, ly = 0;
  let strokeDist = 0, petDist = 0, isDown = false, tickleE = 0, tickling = null;
  let combo = 0, comboTimer = null;

  function partFromPoint(_x, y){
    if(y < 118) return 'head';
    if(y > 210) return 'butt';
    return 'belly';
  }

  window.addEventListener('pointermove', e => C.trackPointer(e, S.state, fallen));

  function pushOver(dir){
    if(S.state === 'sulking' || S.state === 'reconcile' || fallen) return;
    fallen = true; fallDir = dir; tickleE = 0; tickling = null;
    character.classList.remove('tremble','squash','jump','wobble','shake');
    R.run({input:'push', state:S.state}, {x:150,y:150});
    C.faceTeary();
    rig.style.transformOrigin = '150px 160px';
    rig.animate([
      {transform:'translateY(0) rotate(0deg)'},
      {transform:`translateY(12px) rotate(${dir*96}deg)`}
    ], {duration:650, easing:'cubic-bezier(.35,1.3,.6,1)', fill:'forwards'});
    C.updateShadow(1.35, .28, dir * 8);
    setTimeout(()=>{
      if(!fallen) return;
      rig.animate([
        {transform:`translateY(12px) rotate(${dir*96}deg)`},
        {transform:`translateY(12px) rotate(${dir*76}deg)`},
        {transform:`translateY(12px) rotate(${dir*102}deg)`}
      ], {duration:1100, iterations:Infinity, easing:'ease-in-out'});
      struggleInt = setInterval(()=>R.run({input:'fallen_wait', state:'fallen'}), 1500);
    }, 650);
    fallTO = setTimeout(()=>getUp(false), 7500);
  }

  function getUp(helped){
    if(!fallen) return;
    fallen = false;
    clearTimeout(fallTO);
    clearInterval(struggleInt);
    rig.getAnimations().forEach(a=>a.cancel());
    rig.animate([
      {transform:`translateY(12px) rotate(${fallDir*96}deg)`},
      {transform:`translateY(0) rotate(${-fallDir*12}deg)`},
      {transform:`rotate(${fallDir*5}deg)`},
      {transform:'rotate(0deg)'}
    ], {duration:900, easing:'ease-out'}).onfinish = ()=>{ rig.style.transformOrigin = ''; };
    C.updateShadow(1, .26, 0);
    C.setTears(0);
    A.boing();
    R.run({input: helped ? 'help' : 'ignored', state:'fallen'});
    setTimeout(()=>C.restoreForState(S.state), 950);
  }

  function poke(x, y, part){
    if(S.state === 'sulking'){
      R.run({input:'tap', part:'any', state:'sulking'}, {x,y});
      return;
    }
    if(S.state === 'reconcile') return;
    combo += 1;
    C.setComboScale(combo);
    clearTimeout(comboTimer);
    comboTimer = setTimeout(()=>{ combo = 0; C.setComboScale(0); character.classList.remove('tremble'); }, 1200);
    const reaction = R.run({input:'tap', part, state:S.state}, {x,y, combo});
    if(combo > 4) character.classList.add('tremble');
    if(combo > 6 && reaction) S.addGauge(8);
  }

  function pinchStart(){
    if(S.state === 'sulking' || S.state === 'reconcile' || fallen) return;
    pressed = true;
    rig.style.transition = 'transform .15s cubic-bezier(.2,.9,.4,1.2)';
    rig.style.transform = 'scale(1.5,.4)';
    C.faceTeary();
    R.run({input:'pinch_start', state:S.state});
  }

  function pinchEnd(){
    if(!pressed) return;
    pressed = false;
    rig.style.transform = '';
    setTimeout(()=>{ rig.style.transition = ''; }, 400);
    R.run({input:'pinch_end', state:S.state});
    setTimeout(()=>{ if(S.state !== 'sulking' && S.state !== 'reconcile') C.restoreForState(S.state); }, 500);
  }

  character.addEventListener('pointerdown', e=>{
    e.preventDefault();
    hint.style.opacity = 0;
    isDown = true;
    try{ character.setPointerCapture(e.pointerId); }catch(_err){}
    const r = C.stage.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    sx = lx = e.clientX; sy = ly = e.clientY; st = Date.now();
    strokeDist = 0; petDist = 0;
    if(!fallen) pressTimer = setTimeout(()=>{ pressTimer = null; pinchStart(); }, 380);
    character._xy = [x, y, partFromPoint(x, y)];
  });

  window.addEventListener('pointerup', ()=>{
    isDown = false;
    const dx = lx - sx;
    const dy = ly - sy;
    const dt = Date.now() - st;
    if(fallen){
      if(Math.abs(dx) + Math.abs(dy) < 30){
        if(pressTimer){ clearTimeout(pressTimer); pressTimer = null; }
        getUp(true);
      }
      return;
    }
    if(!pressed && dt < 450 && Math.abs(dx) > 90 && Math.abs(dx) > Math.abs(dy) * 1.3){
      if(pressTimer){ clearTimeout(pressTimer); pressTimer = null; }
      pushOver(dx > 0 ? 1 : -1);
      return;
    }
    if(pressTimer){
      clearTimeout(pressTimer);
      pressTimer = null;
      if(!tickling) poke(...(character._xy || [150,150,'belly']));
    } else {
      pinchEnd();
    }
  });

  character.addEventListener('pointermove', e=>{
    if(!isDown) return;
    lx = e.clientX; ly = e.clientY;
    const r = C.stage.getBoundingClientRect();
    const yRelative = e.clientY - r.top;
    if(fallen) return;
    if(S.state === 'sulking'){
      strokeDist += Math.abs(e.movementX) + Math.abs(e.movementY);
      if(strokeDist > 600){ strokeDist = 0; S.clearSulkTimer(); S.reconcile(); }
      return;
    }
    if(pressed || S.state === 'reconcile') return;
    const movement = Math.abs(e.movementX) + Math.abs(e.movementY);
    if(movement > 4){
      if(pressTimer){ clearTimeout(pressTimer); pressTimer = null; }
      if(yRelative < 115 && S.state === 'calm'){
        petDist += movement;
        if(petDist > 180){
          petDist = 0;
          R.run({input:'pet', part:'head', state:S.state}, {x:e.clientX-r.left, y:e.clientY-r.top});
        }
        return;
      }
      tickleE += movement;
    }
    if(tickleE > 140 && !tickling){
      tickling = 'hold';
      C.faceHoldLaugh();
      R.run({input:'tickle_hold', state:S.state});
    }
    if(tickleE > 460 && tickling === 'hold'){
      tickling = 'burst';
      C.faceLaugh();
      R.run({input:'tickle_burst', state:S.state}, {x:150,y:150});
      setTimeout(()=>{ tickling = null; tickleE = 0; C.restoreForState(S.state); }, 1500);
    }
  });

  setInterval(()=>{
    if(tickling !== 'burst') tickleE = Math.max(0, tickleE * 0.8 - 2);
    if(tickleE < 60 && tickling === 'hold'){
      tickling = null;
      character.classList.remove('tremble');
      C.restoreForState(S.state);
    }
  }, 200);

  C.faceSmug();
  C.$('body').animate([
    {transform:'scale(1,1)'},
    {transform:'scale(1.025,1.05)'},
    {transform:'scale(1,1)'}
  ], {duration:2500, iterations:Infinity, easing:'ease-in-out'});
  setInterval(()=>{
    if(S.state === 'calm' && !pressed && !isDown){
      C.$('browR').setAttribute('d','M180 100 Q198 92 216 100');
      setTimeout(()=>{ if(S.state === 'calm') C.$('browR').setAttribute('d','M180 108 Q198 98 216 108'); }, 400);
    }
  }, 4200);
})();
