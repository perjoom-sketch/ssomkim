(function(){
  function loadData(){
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/reactions.json', false);
    xhr.send(null);
    if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 0) return JSON.parse(xhr.responseText);
    throw new Error('reactions.json load failed: ' + xhr.status);
  }
  const data = loadData();
  const C = window.AppCharacter;
  const A = window.AppAudio;
  function matches(actual, expected){ return expected === undefined || expected === '*' || actual === expected; }
  function candidates(trigger){
    return data.reactions.filter(r => matches(trigger.input, r.trigger.input) && matches(trigger.part, r.trigger.part) && matches(trigger.state, r.trigger.state));
  }
  function choose(list){
    const total = list.reduce((sum, r)=>sum+(r.weight || 1), 0);
    let roll = Math.random() * total;
    for (const item of list){ roll -= item.weight || 1; if (roll <= 0) return item; }
    return list[0];
  }
  function playAnim(anim, context={}){
    const target = anim.target === 'stage' ? C.stage : C.$(anim.target) || C.character;
    if(anim.type === 'class'){
      C.character.classList.remove(anim.name); void C.character.offsetWidth; C.character.classList.add(anim.name);
      return;
    }
    if(anim.type === 'squash'){
      C.character.classList.remove('squash'); void C.character.offsetWidth; C.character.classList.add('squash');
      return;
    }
    if(anim.type === 'jump'){
      C.character.classList.remove('jump'); void C.character.offsetWidth; C.character.classList.add('jump');
      return;
    }
    if(anim.type === 'shake'){
      C.character.classList.remove('shake'); void C.character.offsetWidth; C.character.classList.add('shake');
      return;
    }
    if(anim.type === 'jiggle'){
      target.animate([{transform:'scale(1,1)'},{transform:'scale(1.08,.9)'},{transform:'scale(.98,1.04)'},{transform:'scale(1,1)'}], {duration: anim.dur || 600, easing:'ease-out'});
      return;
    }
    if(anim.type === 'wobble'){
      C.character.classList.remove('wobble'); void C.character.offsetWidth; C.character.classList.add('wobble');
      return;
    }
    if(anim.type === 'tremble'){
      C.character.classList.add('tremble');
      return;
    }
    if(anim.type === 'stop_tremble'){
      C.character.classList.remove('tremble');
      return;
    }
    if(anim.type === 'fluff'){
      C.fluffs(anim.count || 3, context.x || 150, context.y || 150);
      return;
    }
    if(anim.type === 'turn_away'){
      C.showBack(true);
      return;
    }
    if(anim.type === 'blink'){
      C.$('lidL').animate([{ry:8},{ry:20},{ry:8}], {duration: anim.dur || 260});
      C.$('lidR').animate([{ry:8},{ry:20},{ry:8}], {duration: anim.dur || 260});
      return;
    }
    if(anim.type === 'blush'){
      C.$('blushL').setAttribute('opacity', anim.opacity ?? 1);
      C.$('blushR').setAttribute('opacity', anim.opacity ?? 1);
    }
  }
  function run(trigger, context={}){
    const list = candidates(trigger);
    if(!list.length) return null;
    const reaction = choose(list);
    (reaction.anim || []).forEach(anim => playAnim(anim, context));
    if(reaction.face && C[reaction.face]) C[reaction.face]();
    if(reaction.sound && A[reaction.sound.fn]) A[reaction.sound.fn](reaction.sound.pitch);
    (reaction.sounds || []).forEach(sound => { if(A[sound.fn]) A[sound.fn](sound.pitch); });
    if(reaction.line && reaction.line.pool && reaction.line.pool.length){
      C.say(reaction.line.pool[Math.floor(Math.random()*reaction.line.pool.length)], reaction.line.show_ms || 750);
    }
    if(typeof reaction.gauge === 'number') window.AppState.addGauge(reaction.gauge);
    if(typeof reaction.gauge_delta === 'number') window.AppState.changeGauge(reaction.gauge_delta);
    if(reaction.vibrate && navigator.vibrate) navigator.vibrate(reaction.vibrate);
    return reaction;
  }
  window.AppReactions = { data, count: data.reactions.length, run, candidates };
})();
