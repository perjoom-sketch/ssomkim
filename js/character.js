(function(){
  const $ = id => document.getElementById(id);
  const character = $('character');
  const rig = $('rig');
  const speech = $('speech');
  const stage = $('stage');
  const shadow = $('shadow');
  const hair = $('hair');
  const BODY_SOFT = 'M172 26 C 112 20, 70 66, 66 132 C 46 196, 66 262, 116 270 C 132 274, 138 258, 150 258 C 162 258, 168 274, 184 270 C 226 264, 245 214, 244 158 C 246 84, 224 32, 172 26 Z';
  const BODY_BUFF = 'M150 30 C 96 30, 56 50, 50 92 C 46 128, 88 198, 114 260 C 122 274, 134 268, 150 268 C 166 268, 178 274, 186 260 C 212 198, 254 128, 250 92 C 244 50, 204 30, 150 30 Z';
  let comboScale = 0;
  function say(t, ms=750){
    if(!t) return;
    speech.textContent=t; speech.style.opacity=1;
    speech.style.transform = `translateX(-50%) scale(${1 + Math.min(comboScale*0.06, 0.28)})`;
    clearTimeout(say._t); say._t=setTimeout(()=>{ speech.style.opacity=0; speech.style.transform='translateX(-50%) scale(1)'; },ms);
  }
  function fluffs(n,x,y,types=['☁️']){
    for(let i=0;i<n;i++){
      const f=document.createElement('div'); f.className='fluff';
      f.textContent=types[Math.floor(Math.random()*types.length)];
      f.style.left=x+'px'; f.style.top=y+'px'; stage.appendChild(f);
      const a=Math.random()*Math.PI*2,d=40+Math.random()*80;
      f.animate([{transform:'translate(0,0) scale(.5)',opacity:1},
        {transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d-50}px) scale(1.4)`,opacity:0}],
        {duration:600+Math.random()*400,easing:'ease-out'}).onfinish=()=>f.remove();
    }
  }
  function updateShadow(scale, opacity, rotate=0){ shadow.style.transform = `scale(${scale}) rotate(${rotate}deg)`; shadow.style.opacity = opacity; }
  function setBuff(on){
    $('body').setAttribute('d', on? BODY_BUFF : BODY_SOFT);
    $('bellyShade').setAttribute('opacity', on? 0 : .45);
    $('armL').setAttribute('cx', on?60:54);  $('armL').setAttribute('cy', on?110:192);
    $('armL').setAttribute('rx', on?25:16);  $('armL').setAttribute('ry', on?34:28);
    $('armL').setAttribute('transform', on?'rotate(-24 60 110)':'rotate(18 54 192)');
    $('armR').setAttribute('cx', on?240:246); $('armR').setAttribute('cy', on?110:192);
    $('armR').setAttribute('rx', on?24:16);  $('armR').setAttribute('ry', on?34:28);
    $('armR').setAttribute('transform', on?'rotate(24 240 110)':'rotate(-18 246 192)');
    $('footL').setAttribute('cx', on?126:110); $('footR').setAttribute('cx', on?174:190);
  }
  function setTears(on){ ['tearL','tearR'].forEach(id=>{ $(id).setAttribute('rx',on?5.5:0); $(id).setAttribute('ry',on?7.5:0); }); }
  function setBodyColor(red){ $('body').setAttribute('fill', red? '#eea58a' : 'url(#fur)'); $('blushL').setAttribute('opacity', red? .95 : .65); $('blushR').setAttribute('opacity', red? .95 : .65); }
  function resetPupils(){ $('pupilLg').style.transform=''; $('pupilRg').style.transform=''; }
  function showBack(on){
    $('front').setAttribute('opacity', on?0:1); $('back').setAttribute('opacity', on?1:0);
    $('bandaid').setAttribute('transform', on ? 'translate(300,0) scale(-1,1) translate(24,8) rotate(-22 105 62)' : 'translate(24,8) rotate(-22 105 62)');
    if(on){ resetPupils(); hair.style.transform=''; }
  }
  function faceSmug(){
    $('lidL').setAttribute('ry',9); $('lidR').setAttribute('ry',9);
    $('browL').setAttribute('d','M84 108 Q102 98 120 108'); $('browR').setAttribute('d','M180 108 Q198 98 216 108');
    $('mouth').setAttribute('d','M134 172 Q150 184 166 172'); $('steam').setAttribute('opacity',0); $('hearts').setAttribute('opacity',0);
    setTears(0); setBodyColor(false); setBuff(false); updateShadow(1, .26, 0);
  }
  function faceAnnoyed(){ setBuff(false); $('lidL').setAttribute('ry',12); $('lidR').setAttribute('ry',12); $('browL').setAttribute('d','M84 102 Q102 110 120 114'); $('browR').setAttribute('d','M180 114 Q198 110 216 102'); $('mouth').setAttribute('d','M138 178 Q150 172 162 178'); }
  function faceAngry(){
    $('lidL').setAttribute('ry',2); $('lidR').setAttribute('ry',2); $('browL').setAttribute('d','M84 98 Q104 112 122 118'); $('browR').setAttribute('d','M178 118 Q196 112 216 98'); $('mouth').setAttribute('d','M132 182 Q150 170 168 182');
    $('steam').setAttribute('opacity',1); setBodyColor(true); setBuff(true); restartClass('jump'); updateShadow(0.6, 0.1); setTimeout(()=>updateShadow(1, 0.26), 550);
  }
  function faceTeary(){ $('lidL').setAttribute('ry',2); $('lidR').setAttribute('ry',2); $('browL').setAttribute('d','M86 104 Q102 96 118 102'); $('browR').setAttribute('d','M182 102 Q198 96 214 104'); $('mouth').setAttribute('d','M140 180 Q150 174 160 180'); setTears(1); }
  function faceHappy(){ setBuff(false); $('lidL').setAttribute('ry',2); $('lidR').setAttribute('ry',2); $('browL').setAttribute('d','M84 106 Q102 98 120 104'); $('browR').setAttribute('d','M180 104 Q198 98 216 106'); $('mouth').setAttribute('d','M132 170 Q150 188 168 170'); $('hearts').setAttribute('opacity',1); setTears(0); setBodyColor(false); }
  function faceHoldLaugh(){ $('lidL').setAttribute('ry',13); $('lidR').setAttribute('ry',13); $('mouth').setAttribute('d','M140 176 Q150 170 160 176'); $('blushL').setAttribute('opacity',1); $('blushR').setAttribute('opacity',1); }
  function faceLaugh(){ $('lidL').setAttribute('ry',22); $('lidR').setAttribute('ry',22); $('browL').setAttribute('d','M86 130 Q104 118 122 130'); $('browR').setAttribute('d','M178 130 Q196 118 214 130'); $('mouth').setAttribute('d','M128 166 Q150 198 172 166'); }
  function restoreForState(state){ if(state==='calm')faceSmug(); else if(state==='annoyed')faceAnnoyed(); else if(state==='angry')faceAngry(); }
  function restartClass(name){ character.classList.remove(name); void character.offsetWidth; character.classList.add(name); }
  function trackPointer(e, state, blocked){
    if(blocked || state === 'sulking') return;
    const rect = character.getBoundingClientRect(); const cx = rect.left + rect.width/2; const cy = rect.top + rect.height/2;
    const dx = e.clientX - cx, dy = e.clientY - cy; const dist = Math.sqrt(dx*dx + dy*dy) || 1;
    const maxMove = state === 'angry' ? 1.5 : 5; const f = state === 'angry' ? -1 : 1;
    $('pupilLg').style.transform = `translate(${(dx/dist)*maxMove*f}px, ${(dy/dist)*maxMove*f}px)`;
    $('pupilRg').style.transform = `translate(${(dx/dist)*maxMove*f}px, ${(dy/dist)*maxMove*f}px)`;
    if(!window.AppState || !window.AppState.hairDetached){ hair.style.transform = `rotate(${Math.max(-25, Math.min(25, (dx/rect.width)*35))}deg)`; }
  }
  function detachHair(dir){
    hair.style.transform='';
    hair.animate([{transform:'translate(0,0) rotate(0deg)'},{transform:`translate(${dir*70}px,-70px) rotate(${dir*200}deg)`, offset:.45},{transform:`translate(${dir*115}px,225px) rotate(${dir*380}deg)`}],{duration:750,easing:'cubic-bezier(.3,.7,.5,1)',fill:'forwards'});
    faceTeary(); restartClass('shake');
  }
  function reattachHair(){
    hair.getAnimations().forEach(a=>a.cancel());
    hair.animate([{transform:'translate(0,150px) rotate(180deg)'},{transform:'translate(0,-14px) rotate(0deg)', offset:.75},{transform:'translate(0,0) rotate(0deg)'}],{duration:480,easing:'ease-out'});
  }
  window.AppCharacter = { $, character, rig, speech, stage, shadow, hair, say, fluffs, updateShadow, setTears, showBack, faceSmug, faceAnnoyed, faceAngry, faceTeary, faceHappy, faceHoldLaugh, faceLaugh, restoreForState, restartClass, trackPointer, detachHair, reattachHair, setComboScale:n=>{comboScale=n;} };
})();
