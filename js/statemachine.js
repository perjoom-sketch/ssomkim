(function(){
  let gauge = 0;
  let state = 'calm';
  let sulkTimer = null;
  let hairDetached = false;
  let hairTimer = null;
  const NATURAL_DECAY = 1.5;
  const SULK_MS = 10000;
  const C = window.AppCharacter;
  function emit(){ window.dispatchEvent(new CustomEvent('meterchange', { detail: { gauge, state } })); }
  function setState(s){
    if(state===s) return;
    state=s; emit();
    if(s==='calm'){ C.showBack(false); C.faceSmug(); }
    if(s==='annoyed'){ C.faceAnnoyed(); }
    if(s==='angry'){ C.faceAngry(); window.AppReactions.run({input:'state_enter', state:'angry'}); }
    if(s==='sulking'){
      if(hairDetached) reattachHair();
      C.showBack(true); window.AppReactions.run({input:'state_enter', state:'sulking'});
      clearTimeout(sulkTimer); sulkTimer = setTimeout(reconcile, SULK_MS);
    }
    if(s==='reconcile'){
      C.showBack(false); C.faceTeary();
      setTimeout(()=>{ C.faceHappy(); window.AppReactions.run({input:'state_enter', state:'reconcile'}); C.restartClass('wobble');
        setTimeout(()=>{ gauge=0; setState('calm'); },2200);
      },1400);
    }
  }
  function reconcile(){ setState('reconcile'); }
  function addGauge(n){ gauge=Math.max(0, Math.min(100,gauge+n)); emit(); if(state==='sulking'||state==='reconcile') return; if(gauge>=100) setState('sulking'); else if(gauge>=70) setState('angry'); else if(gauge>=30) setState('annoyed'); }
  function changeGauge(n){ gauge = Math.max(0, Math.min(100, gauge + n)); emit(); }
  function clearSulkTimer(){ clearTimeout(sulkTimer); }
  function detachHair(dir){ if(hairDetached) return; hairDetached=true; C.detachHair(dir); window.AppReactions.run({input:'hair_detach', state}); clearTimeout(hairTimer); hairTimer=setTimeout(reattachHair, 5000); }
  function reattachHair(){ if(!hairDetached) return; hairDetached=false; clearTimeout(hairTimer); C.reattachHair(); window.AppReactions.run({input:'hair_attach', state}); setTimeout(()=>C.restoreForState(state),300); }
  setInterval(()=>{ if(gauge>0&&state!=='sulking'&&state!=='reconcile'){ gauge=Math.max(0,gauge-NATURAL_DECAY); emit(); if(gauge<30&&state!=='calm') setState('calm'); else if(gauge<70&&state==='angry') setState('annoyed'); } },1000);
  window.AppState = { get state(){ return state; }, get gauge(){ return gauge; }, get hairDetached(){ return hairDetached; }, setState, reconcile, addGauge, changeGauge, clearSulkTimer, detachHair, reattachHair };
})();
