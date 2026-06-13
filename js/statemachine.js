(function(){
  let gauge = 0;
  let state = 'calm';
  let sulkTimer = null;
  const C = window.AppCharacter;
  function setState(s){
    if(state === s) return;
    state = s;
    if(s === 'calm'){ C.showBack(false); C.faceSmug(); }
    if(s === 'annoyed'){ C.faceAnnoyed(); }
    if(s === 'angry'){ C.faceAngry(); window.AppReactions.run({input:'state_enter', state:'angry'}); }
    if(s === 'sulking'){
      C.showBack(true);
      window.AppReactions.run({input:'state_enter', state:'sulking'});
      clearTimeout(sulkTimer);
      sulkTimer = setTimeout(reconcile, 10000);
    }
    if(s === 'reconcile'){
      C.showBack(false); C.faceTeary();
      setTimeout(()=>{
        C.faceHappy();
        window.AppReactions.run({input:'state_enter', state:'reconcile'});
        C.character.classList.add('wobble');
        setTimeout(()=>{ gauge = 0; setState('calm'); }, 2200);
      }, 1400);
    }
  }
  function reconcile(){ setState('reconcile'); }
  function applyState(){
    if(state === 'sulking' || state === 'reconcile') return;
    if(gauge >= 100) setState('sulking');
    else if(gauge >= 70) setState('angry');
    else if(gauge >= 30) setState('annoyed');
    else if(state !== 'calm') setState('calm');
  }
  function addGauge(n){ gauge = Math.min(100, gauge + n); applyState(); }
  function changeGauge(n){ gauge = Math.max(0, Math.min(100, gauge + n)); applyState(); }
  function clearSulkTimer(){ clearTimeout(sulkTimer); }
  setInterval(()=>{ if(gauge > 0 && state !== 'sulking' && state !== 'reconcile'){ gauge = Math.max(0, gauge - 1.5); applyState(); } }, 1000);
  window.AppState = { get state(){ return state; }, get gauge(){ return gauge; }, setState, reconcile, addGauge, changeGauge, clearSulkTimer };
})();
