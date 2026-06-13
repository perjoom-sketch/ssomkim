(function(){
  let actx = null;
  function context(){
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function snd(freq, dur, type='sine', vol=.22, slideTo=null) {
    const ctx = context();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(slideTo || freq * 1.4, ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001, ctx.currentTime + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + dur);
  }
  const Audio = {
    snd,
    kyu: () => snd(560,.16,'sine',.22,880),
    boing: () => snd(220,.18,'sine',.25,160),
    thud: () => snd(500,.5,'sine',.2,150),
    squeak: () => snd(300,.4,'sine',.2,140),
    grumble: () => snd(160,.22,'sawtooth',.12,120),
    sparkle: () => { snd(900,.1); setTimeout(()=>snd(1200,.12),90); setTimeout(()=>snd(1500,.18),190); },
    giggle: () => { [0,90,180,280,380].forEach((t,i)=>setTimeout(()=>snd(520+i*110,.09,'sine',.2,640+i*110),t)); },
    tiny: () => snd(200,.1,'sine',.08),
    strain: () => snd(380,.1,'sine',.12,460),
    purr: () => { snd(280,.12,'triangle',.15,240); setTimeout(()=>snd(300,.12,'triangle',.15,260),80); },
    hairPop: () => snd(700,.25,'sine',.2,1100),
    holdLaugh: () => snd(420,.15,'sine',.12,500),
    angryHit: () => snd(120,.3,'sawtooth',.18,90)
  };
  window.AppAudio = Audio;
})();
