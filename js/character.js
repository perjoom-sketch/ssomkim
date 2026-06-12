(function(){
  const $ = id => document.getElementById(id);
  const character = $('character');
  const speech = $('speech');
  const stage = $('stage');
  const BODY_SOFT = "M150 26 C 92 26, 56 78, 52 150 C 49 208, 70 262, 116 270 C 132 274, 138 258, 150 258 C 162 258, 168 274, 184 270 C 230 262, 251 208, 248 150 C 244 78, 208 26, 150 26 Z";
  const BODY_BUFF = "M150 30 C 96 30, 56 50, 50 92 C 46 128, 88 198, 114 260 C 122 274, 134 268, 150 268 C 166 268, 178 274, 186 260 C 212 198, 254 128, 250 92 C 244 50, 204 30, 150 30 Z";
  function say(t, ms=750){ speech.textContent=t; speech.style.opacity=1; clearTimeout(say._t); say._t=setTimeout(()=>speech.style.opacity=0,ms); }
  function fluffs(n,x,y){
    for(let i=0;i<n;i++){
      const f=document.createElement('div'); f.className='fluff'; f.textContent='☁️';
      f.style.left=x+'px'; f.style.top=y+'px'; stage.appendChild(f);
      const a=Math.random()*Math.PI*2,d=40+Math.random()*80;
      f.animate([{transform:'translate(0,0) scale(.6)',opacity:1},
        {transform:`translate(${Math.cos(a)*d}px,${Math.sin(a)*d-40}px) scale(1.2)`,opacity:0}],
        {duration:800+Math.random()*400,easing:'ease-out'}).onfinish=()=>f.remove();
    }
  }
  function setBuff(on){
    $('body').setAttribute('d', on? BODY_BUFF : BODY_SOFT);
    $('belly').setAttribute('opacity', on? 0 : .45);
    $('armL').setAttribute('cx', on?64:78);  $('armL').setAttribute('cy', on?112:196);
    $('armL').setAttribute('rx', on?26:20);  $('armL').setAttribute('ry', on?32:26);
    $('armR').setAttribute('cx', on?236:222); $('armR').setAttribute('cy', on?112:196);
    $('armR').setAttribute('rx', on?26:20);  $('armR').setAttribute('ry', on?32:26);
    $('footL').setAttribute('cx', on?128:112);
    $('footR').setAttribute('cx', on?172:188);
  }
  function setTears(on){ ['tearL','tearR'].forEach(id=>{ $(id).setAttribute('rx',on?5:0); $(id).setAttribute('ry',on?7:0); }); }
  function setBodyColor(red){
    $('body').setAttribute('fill', red? '#eea98f' : 'url(#fur)');
    $('blushL').setAttribute('opacity', red? .9 : .65);
    $('blushR').setAttribute('opacity', red? .9 : .65);
  }
  function showBack(on){ $('front').setAttribute('opacity', on?0:1); $('back').setAttribute('opacity', on?1:0); }
  function faceSmug(){
    $('lidL').setAttribute('ry',8); $('lidR').setAttribute('ry',8);
    $('browL').setAttribute('d','M86 110 Q102 102 118 110');
    $('browR').setAttribute('d','M182 110 Q198 102 214 110');
    $('mouth').setAttribute('d','M136 172 Q150 182 164 172');
    $('steam').setAttribute('opacity',0); $('hearts').setAttribute('opacity',0);
    setTears(0); setBodyColor(false); setBuff(false);
  }
  function faceAnnoyed(){
    setBuff(false);
    $('lidL').setAttribute('ry',11); $('lidR').setAttribute('ry',11);
    $('browL').setAttribute('d','M86 104 Q102 112 118 116');
    $('browR').setAttribute('d','M182 116 Q198 112 214 104');
    $('mouth').setAttribute('d','M138 178 Q150 172 162 178');
  }
  function faceAngry(){
    $('lidL').setAttribute('ry',2); $('lidR').setAttribute('ry',2);
    $('browL').setAttribute('d','M86 100 Q104 114 120 120');
    $('browR').setAttribute('d','M180 120 Q196 114 214 100');
    $('mouth').setAttribute('d','M134 182 Q150 170 166 182');
    $('steam').setAttribute('opacity',1); setBodyColor(true); setBuff(true);
    character.classList.remove('jump'); void character.offsetWidth; character.classList.add('jump');
    window.AppAudio.angryHit();
  }
  function faceTeary(){
    $('lidL').setAttribute('ry',2); $('lidR').setAttribute('ry',2);
    $('browL').setAttribute('d','M88 106 Q102 98 116 104');
    $('browR').setAttribute('d','M184 104 Q198 98 212 106');
    $('mouth').setAttribute('d','M140 180 Q150 174 160 180');
    setTears(1);
  }
  function faceHappy(){
    setBuff(false);
    $('lidL').setAttribute('ry',2); $('lidR').setAttribute('ry',2);
    $('browL').setAttribute('d','M86 108 Q102 100 118 106');
    $('browR').setAttribute('d','M182 106 Q198 100 214 108');
    $('mouth').setAttribute('d','M134 170 Q150 188 166 170');
    $('hearts').setAttribute('opacity',1); setTears(0); setBodyColor(false);
  }
  function faceHoldLaugh(){
    $('lidL').setAttribute('ry',12); $('lidR').setAttribute('ry',12);
    $('mouth').setAttribute('d','M140 176 Q150 170 160 176');
    $('blushL').setAttribute('opacity',1); $('blushR').setAttribute('opacity',1);
  }
  function faceLaugh(){
    $('lidL').setAttribute('ry',20); $('lidR').setAttribute('ry',20);
    $('browL').setAttribute('d','M88 132 Q104 120 120 132');
    $('browR').setAttribute('d','M180 132 Q196 120 212 132');
    $('mouth').setAttribute('d','M130 166 Q150 196 170 166');
  }
  function restoreForState(state){ if(state==='calm')faceSmug(); else if(state==='annoyed')faceAnnoyed(); else if(state==='angry')faceAngry(); }
  window.AppCharacter = { $, character, speech, stage, say, fluffs, setTears, showBack, faceSmug, faceAnnoyed, faceAngry, faceTeary, faceHappy, faceHoldLaugh, faceLaugh, restoreForState };
})();
