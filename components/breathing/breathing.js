/* ========================================================================== 
   Unified particle / 3D card breathing controller
   ========================================================================== */
(() => {
  const STORAGE_KEY='immersive-breathing-v1';
  const LEGACY_KEYS=['immersive-breathing-legacy-v30','immersive-breathing-legacy-v26'];
  const MODES={
    off:{speed:5.6,amplitude:0},
    gentle:{speed:7.6,amplitude:46},
    standard:{speed:5.6,amplitude:72},
    showcase:{speed:4.0,amplitude:100}
  };
  const DEFAULT={mode:'standard',speed:5.4,amplitude:76,panelScale:100,fluidEdge:165,fluidRhythm:'layered',glowRange:38,activeCard:true,stage:true,ambient:true,panels:true,fluid:true,particles:true};
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const clone=v=>JSON.parse(JSON.stringify(v));
  const el=id=>document.getElementById(id);
  const root=document.documentElement;
  const stage=el('folderStage');
  const fluidCards=[...document.querySelectorAll('.fluid-stat')];
  const canvas=el('breathParticles');
  const ctx=canvas?.getContext('2d');
  let config=clone(DEFAULT),cycleStart=performance.now(),forcedPhase=null,testUntil=0,testTimer=0;

  function safe(raw={}){
    const mode=Object.prototype.hasOwnProperty.call(MODES,raw.mode)?raw.mode:'standard';
    return {
      mode,
      speed:clamp(Number.isFinite(Number(raw.speed))?Number(raw.speed):MODES[mode].speed,3,14),
      amplitude:clamp(Number.isFinite(Number(raw.amplitude))?Number(raw.amplitude):MODES[mode].amplitude,0,100),
      panelScale:clamp(Number.isFinite(Number(raw.panelScale))?Number(raw.panelScale):100,0,160),
      fluidEdge:clamp(Number.isFinite(Number(raw.fluidEdge))?Number(raw.fluidEdge):165,0,220),
      fluidRhythm:['sync','stagger','layered'].includes(raw.fluidRhythm)?raw.fluidRhythm:'layered',
      glowRange:clamp(Number.isFinite(Number(raw.glowRange))?Number(raw.glowRange):42,15,100),
      activeCard:raw.activeCard!==false,
      stage:raw.stage!==false,
      ambient:raw.ambient!==false,
      panels:raw.panels!==false,
      fluid:raw.fluid!==false,
      particles:raw.particles!==false
    };
  }
  try{
    const current=localStorage.getItem(STORAGE_KEY);
    let legacy=null;
    for(const key of LEGACY_KEYS){if(!legacy){const v=localStorage.getItem(key);if(v)legacy=v}}
    config=current?safe(JSON.parse(current)):legacy?safe(JSON.parse(legacy)):clone(DEFAULT);
  }catch(_){config=clone(DEFAULT)}

  const controls={
    speed:el('breathSpeed'),speedOut:el('breathSpeedOut'),amp:el('breathAmplitude'),ampOut:el('breathAmplitudeOut'),
    panelScale:el('breathPanelScale'),panelScaleOut:el('breathPanelScaleOut'),fluidEdge:el('breathFluidEdge'),fluidEdgeOut:el('breathFluidEdgeOut'),glowRange:el('breathGlowRange'),glowRangeOut:el('breathGlowRangeOut'),
    fluidRhythmButtons:[...document.querySelectorAll('[data-fluid-rhythm-option]')],
    activeCard:el('breathActiveCard'),stage:el('breathStage'),ambient:el('breathAmbient'),panels:el('breathPanels'),fluid:el('breathFluid'),particles:el('breathParticlesToggle'),
    test:el('breathTestBtn'),testStatus:el('breathTestStatus')
  };

  const dataBreathNodes=[...document.querySelectorAll('.queue .section-head,.queue .tabs,.queue .group,.queue .note-row')];
  const queueGroups=[...document.querySelectorAll('.queue .group')];
  const queueRows=[...document.querySelectorAll('.queue .note-row')];
  const topFieldNodes=[
    document.querySelector('.topbar .title-block'),
    document.querySelector('.topbar .search'),
    ...document.querySelectorAll('.topbar .top-actions > .icon-btn,.topbar .top-actions > .pill-btn')
  ].filter(Boolean);

  function installLightLayers(){
    document.querySelectorAll('.sidebar.glass,.visual.glass,.right.glass').forEach(panel=>{
      let layer=panel.querySelector(':scope > .v3-breath-surface');
      if(!layer){layer=document.createElement('span');layer.className='v3-breath-surface';layer.setAttribute('aria-hidden','true');panel.appendChild(layer)}
    });
    document.querySelectorAll('.fluid-stat').forEach(card=>{
      let layer=card.querySelector(':scope > .v3-fluid-breath');
      if(!layer){layer=document.createElement('span');layer.className='v3-fluid-breath';layer.setAttribute('aria-hidden','true');card.appendChild(layer)}
    });
  }

  function sync(){
    document.querySelectorAll('[data-breath-mode-option]').forEach(btn=>btn.classList.toggle('active',btn.dataset.breathModeOption===config.mode));
    controls.fluidRhythmButtons?.forEach(btn=>btn.classList.toggle('active',btn.dataset.fluidRhythmOption===config.fluidRhythm));
    root.dataset.fluidRhythm=config.fluidRhythm;
    if(controls.speed){controls.speed.value=config.speed;controls.speedOut.textContent=`${config.speed.toFixed(1)}s`}
    if(controls.amp){controls.amp.value=config.amplitude;controls.ampOut.textContent=`${Math.round(config.amplitude)}%`}
    if(controls.panelScale){controls.panelScale.value=config.panelScale;controls.panelScaleOut.textContent=`${Math.round(config.panelScale)}%`}
    if(controls.fluidEdge){controls.fluidEdge.value=config.fluidEdge;controls.fluidEdgeOut.textContent=`${Math.round(config.fluidEdge)}%`}
    if(controls.glowRange){controls.glowRange.value=config.glowRange;controls.glowRangeOut.textContent=`${Math.round(config.glowRange)}%`}
    ['activeCard','stage','ambient','panels','fluid','particles'].forEach(k=>{if(controls[k])controls[k].checked=config[k]});
  }
  function applyFlags(){
    root.dataset.breathMode=config.mode;
    root.dataset.breathActive=String(config.activeCard);
    root.dataset.breathStage=String(config.stage);
    root.dataset.breathAmbient=String(config.ambient);
    root.dataset.breathPanels=String(config.panels);
    root.dataset.breathFluid=String(config.fluid);
    root.dataset.breathParticles=String(config.particles);
    sync();
  }
  function save(notify=false){
    localStorage.setItem(STORAGE_KEY,JSON.stringify(config));
    if(notify){
      const toast=el('toast');if(toast){toast.textContent='粒子 3D 卡片呼吸设置已保存';toast.classList.add('show');clearTimeout(save.t);save.t=setTimeout(()=>toast.classList.remove('show'),1700)}
    }
  }
  function restartCycle(){cycleStart=performance.now()}
  function setMode(mode){
    if(!MODES[mode])return;
    config.mode=mode;config.speed=MODES[mode].speed;config.amplitude=MODES[mode].amplitude;
    restartCycle();applyFlags();save(false);
  }
  function setVar(name,value){root.style.setProperty(name,String(value))}
  function phaseAt(now){
    if(forcedPhase!==null)return clamp(forcedPhase,0,1);
    const speed=now<testUntil?2.5:config.speed;
    const x=((now-cycleStart)/(speed*1000))%1;
    const sine=.5-.5*Math.cos(x*Math.PI*2);
    return sine*sine*(3-2*sine); // pronounced but smooth contraction / expansion
  }
  function effectiveAmplitude(now){return config.mode==='off'?0:(now<testUntil?1:config.amplitude/100)}
  function shapedWave(progress){
    const sine=.5-.5*Math.cos(progress*Math.PI*2);
    return sine*sine*(3-2*sine);
  }
  function fluidRhythmProfile(){
    switch(config.fluidRhythm){
      case 'sync': return {offsets:[0,0,0,0], amps:[1,1,1,1]};
      case 'stagger': return {offsets:[0,.055,.11,.165], amps:[.97,1.02,.99,.94]};
      case 'layered':
      default: return {offsets:[.14,0,.065,.235], amps:[.76,1.28,1.08,.68]};
    }
  }
  function applyFluidCardBreath(progress,a,fluidStrength){
    const profile=fluidRhythmProfile();
    fluidCards.forEach((card,index)=>{
      const offset=profile.offsets[index%profile.offsets.length]||0;
      const ampMul=profile.amps[index%profile.amps.length]||1;
      const localProgress=((progress+offset)%1+1)%1;
      const localWave=shapedWave(localProgress);
      const localEnergy=clamp(a*localWave*ampMul,0,1.4);
      const localSigned=((localWave*2-1)*a)*ampMul;
      const layeredBoost=config.fluidRhythm==='layered'?1.32:(config.fluidRhythm==='stagger'?1.12:1);
      const localCardScale=(1-.004*a+(.014+.017*fluidStrength)*localEnergy*layeredBoost).toFixed(4);
      const localCardLift=`${((1.05*a)-((2.9+2.2*fluidStrength)*localEnergy*layeredBoost)).toFixed(2)}px`;
      const localCardBrightness=(.975+(.065+.075*fluidStrength)*localEnergy*layeredBoost).toFixed(3);
      const localCardGlow=`${(1.5+(14*localEnergy*fluidStrength*layeredBoost)).toFixed(1)}px`;
      const localBodyScale=(1+.002*a+(.015+.014*fluidStrength)*localEnergy*layeredBoost).toFixed(4);
      const localBodyBrightness=(.975+(.08+.14*fluidStrength)*localEnergy*layeredBoost).toFixed(3);
      const localAlpha=clamp(.045+fluidStrength*(.10+.68*localEnergy*layeredBoost),.04,.99).toFixed(3);
      const localEdge=clamp(.10+fluidStrength*(.10+.72*localEnergy*layeredBoost),.08,.99).toFixed(3);
      const localScale=(1+.016*localSigned*fluidStrength*layeredBoost).toFixed(4);
      const localGlow=`${(2+13.5*localEnergy*fluidStrength*layeredBoost).toFixed(1)}px`;
      const localBrightness=(.96+.42*localEnergy*fluidStrength*layeredBoost).toFixed(3);
      card.style.setProperty('--fluid-local-card-scale',localCardScale);
      card.style.setProperty('--fluid-local-lift',localCardLift);
      card.style.setProperty('--fluid-local-card-brightness',localCardBrightness);
      card.style.setProperty('--fluid-local-card-glow',localCardGlow);
      card.style.setProperty('--fluid-local-body-scale',localBodyScale);
      card.style.setProperty('--fluid-local-body-brightness',localBodyBrightness);
      card.style.setProperty('--fluid-local-alpha',localAlpha);
      card.style.setProperty('--fluid-local-edge',localEdge);
      card.style.setProperty('--fluid-local-scale',localScale);
      card.style.setProperty('--fluid-local-glow',localGlow);
      card.style.setProperty('--fluid-local-brightness',localBrightness);
    });
  }


  function applyDashboardBreath(progress,a,energy,signed){
    const topWave=shapedWave((progress+.015)%1);
    const queueWave=shapedWave((progress+.035)%1);
    const timelineWave=shapedWave((progress+.055)%1);
    const rightWave=shapedWave((progress+.025)%1);
    const topEnergy=a*topWave,queueEnergy=a*queueWave,timelineEnergy=a*timelineWave,rightEnergy=a*rightWave;
    const topSigned=(topWave*2-1)*a,queueSigned=(queueWave*2-1)*a,timelineSigned=(timelineWave*2-1)*a,rightSigned=(rightWave*2-1)*a;

    setVar('--v33-top-lift',`${(0.35*a-1.55*topEnergy).toFixed(2)}px`);
    setVar('--v33-top-scale',(1+.0028*topSigned).toFixed(4));
    setVar('--v33-top-brightness',(1+.035*topEnergy).toFixed(3));
    setVar('--v33-queue-lift',`${(0.45*a-2.1*queueEnergy).toFixed(2)}px`);
    setVar('--v33-queue-scale',(1+.0045*queueSigned).toFixed(4));
    setVar('--v33-queue-brightness',(.985+.065*queueEnergy).toFixed(3));
    setVar('--v33-timeline-scale',(1+.0038*timelineSigned).toFixed(4));
    setVar('--v33-timeline-brightness',(.985+.055*timelineEnergy).toFixed(3));
    setVar('--v33-right-inner-scale',(1+.0032*rightSigned).toFixed(4));
    setVar('--v33-right-inner-brightness',(.99+.05*rightEnergy).toFixed(3));
    setVar('--v33-sidebar-inner-brightness',(.985+.045*energy).toFixed(3));

    // 顶栏不再只把整条 topbar 当作一个整体缩放，而是让每个字段独立呼吸。
    const topOffsets=[0,.045,.095,.14,.185,.23];
    const topAmps=[.92,1.06,.96,1.02,1.08,1.22];
    topFieldNodes.forEach((node,index)=>{
      const localProgress=((progress+(topOffsets[index]??index*.045))%1+1)%1;
      const localWave=shapedWave(localProgress);
      const ampMul=topAmps[index]??1;
      const localEnergy=clamp(a*localWave*ampMul,0,1.35);
      const localSigned=(localWave*2-1)*a*ampMul;
      const isTitle=node.classList.contains('title-block');
      const isSearch=node.classList.contains('search');
      const isScan=node.id==='primaryActionBtn';
      const scalePower=isTitle ? .010 : (isSearch ? .013 : (isScan ? .020 : .017));
      const liftPower=isTitle?2.15:(isSearch?2.55:(isScan?3.65:3.0));
      const brightPower=isTitle ? .10 : (isSearch ? .12 : (isScan ? .18 : .145));
      const glowPower=isTitle?2.5:(isSearch?5.5:(isScan?11:8));
      node.style.setProperty('--top-field-scale',(1+scalePower*localSigned).toFixed(4));
      node.style.setProperty('--top-field-lift',`${(.45*a-liftPower*localEnergy).toFixed(2)}px`);
      node.style.setProperty('--top-field-brightness',(.975+brightPower*localEnergy).toFixed(3));
      node.style.setProperty('--top-field-glow',`${(glowPower*localEnergy).toFixed(1)}px`);
      node.style.setProperty('--top-field-glow-alpha',(.025+.15*localEnergy).toFixed(3));
      node.style.setProperty('--top-field-border-alpha',(.10+.24*localEnergy).toFixed(3));
      node.dataset.breathFieldPhase=localWave.toFixed(3);
    });

    dataBreathNodes.forEach((node,index)=>{
      const isGroup=node.classList.contains('group');
      const isRow=node.classList.contains('note-row');
      const baseOffset=isGroup ? .085 : (isRow ? .12 : .04);
      const localProgress=((progress+baseOffset+(index%7)*.028)%1+1)%1;
      const localWave=shapedWave(localProgress);
      const localEnergy=a*localWave;
      const localSigned=(localWave*2-1)*a;
      const scale=1+(isGroup ? .0062 : (isRow ? .0028 : .0035))*localSigned;
      const lift=(isGroup ? .55 : .24)*a-(isGroup ? 2.6 : (isRow ? 1.15 : 1.4))*localEnergy;
      const bright=.97+(isGroup ? .09 : (isRow ? .055 : .065))*localEnergy;
      node.style.setProperty('--data-breath-scale',scale.toFixed(4));
      node.style.setProperty('--data-breath-lift',`${lift.toFixed(2)}px`);
      node.style.setProperty('--data-breath-brightness',bright.toFixed(3));
      if(isGroup){
        node.style.setProperty('--data-breath-glow',`${(1+8.5*localEnergy).toFixed(1)}px`);
        node.style.setProperty('--data-breath-alpha',(.015+.09*localEnergy).toFixed(3));
      }
      node.style.setProperty('--data-dot-glow',`${(5+8*localEnergy).toFixed(1)}px`);
      node.style.setProperty('--data-dot-alpha',(.20+.45*localEnergy).toFixed(3));
    });
  }

  function updateVisuals(now){
    const speed=now<testUntil?2.5:config.speed;
    const progress=forcedPhase!==null?clamp(forcedPhase,0,1):((((now-cycleStart)/(speed*1000))%1)+1)%1;
    const wave=shapedWave(progress),a=effectiveAmplitude(now),energy=a*wave,signed=(wave*2-1)*a;
    const dragging=stage?.classList.contains('is-dragging');
    const panelStrength=config.panelScale/100;
    const fluidStrength=config.fluidEdge/100;
    const glowRange=config.glowRange/100;

    const panelScale=1+.012*signed*panelStrength;
    const panelBrightness=1+.026*signed*panelStrength;
    const cardScale=1-.004*a+.031*energy;
    const cardLift=1.5*a-5.6*energy;
    const cardBright=1-.015*a+.10*energy;
    const near=9+(13*energy*glowRange),far=19+(23*energy*glowRange),glowAlpha=.12+.20*energy*glowRange;
    const stageLift=dragging?0:(1.2*a-4.3*energy);
    const ambientScale=.94+.18*energy*glowRange;
    const ambientOpacity=.095+.30*energy*glowRange;
    const ambientBlur=14+10*glowRange;
    const floorOpacity=.055+.17*energy*glowRange;
    const panelAlpha=.010+.045*energy;
    const panelEdge=.035+.105*energy;
    const fluidCardScale=1-.002*a+(.010+.012*fluidStrength)*energy;
    const fluidCardLift=(.55*a)-((1.8+1.5*fluidStrength)*energy);
    const fluidCardBrightness=.985+(.045+.055*fluidStrength)*energy;
    const fluidCardGlow=2+(12*energy*fluidStrength);
    const fluidBodyScale=1+.004*a+(.010+.010*fluidStrength)*energy;
    const fluidBodyBrightness=.99+(.06+.11*fluidStrength)*energy;
    const fluidAlpha=clamp(.06+fluidStrength*(.11+.58*energy),.05,.98);
    const fluidEdge=clamp(.12+fluidStrength*(.12+.58*energy),.10,.99);
    const fluidScale=1+.012*signed*fluidStrength;
    const fluidGlow=2.5+11.5*energy*fluidStrength;
    const fluidBrightness=.98+.34*energy*fluidStrength;
    const progressAlpha=.30+.24*energy;

    setVar('--v31-panel-scale',panelScale.toFixed(4));
    setVar('--v31-panel-brightness',panelBrightness.toFixed(3));
    setVar('--v31-card-scale',cardScale.toFixed(4));
    setVar('--v31-card-lift',`${cardLift.toFixed(2)}px`);
    setVar('--v31-card-brightness',cardBright.toFixed(3));
    setVar('--v31-card-glow-near',`${near.toFixed(1)}px`);
    setVar('--v31-card-glow-far',`${far.toFixed(1)}px`);
    setVar('--v31-card-glow-alpha',glowAlpha.toFixed(3));
    setVar('--v31-stage-lift',`${stageLift.toFixed(2)}px`);
    setVar('--v31-ambient-scale',ambientScale.toFixed(4));
    setVar('--v31-ambient-opacity',ambientOpacity.toFixed(3));
    setVar('--v31-ambient-blur',`${ambientBlur.toFixed(1)}px`);
    setVar('--v31-floor-opacity',floorOpacity.toFixed(3));
    setVar('--v31-floor-blur',`${(5+3*energy*glowRange).toFixed(1)}px`);
    setVar('--v31-panel-alpha',panelAlpha.toFixed(3));
    setVar('--v31-panel-edge',panelEdge.toFixed(3));
    setVar('--v31-fluid-alpha',fluidAlpha.toFixed(3));
    setVar('--v31-fluid-edge',fluidEdge.toFixed(3));
    setVar('--v31-fluid-scale',fluidScale.toFixed(4));
    setVar('--v31-fluid-glow',`${fluidGlow.toFixed(1)}px`);
    setVar('--v31-fluid-brightness',fluidBrightness.toFixed(3));
    setVar('--v31-fluid-card-scale',fluidCardScale.toFixed(4));
    setVar('--v31-fluid-card-lift',`${fluidCardLift.toFixed(2)}px`);
    setVar('--v31-fluid-card-brightness',fluidCardBrightness.toFixed(3));
    setVar('--v31-fluid-card-glow',`${fluidCardGlow.toFixed(1)}px`);
    setVar('--v31-fluid-body-scale',fluidBodyScale.toFixed(4));
    setVar('--v31-fluid-body-brightness',fluidBodyBrightness.toFixed(3));
    setVar('--v31-progress-alpha',progressAlpha.toFixed(3));
    applyFluidCardBreath(progress,a,fluidStrength);
    applyDashboardBreath(progress,a,energy,signed);
    root.dataset.breathPhase=wave.toFixed(3);
    return {wave,a,energy,signed,panelScale,fluidAlpha,ambientOpacity,progress};
  }

  // Restrained particle field ---------------------------------------------
  let dpr=1,cw=0,ch=0,particles=[];
  function seeded(index){const x=Math.sin(index*999.17+41.7)*43758.5453;return x-Math.floor(x)}
  function buildParticles(){
    if(!canvas||!ctx||!stage)return;
    const rect=stage.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);cw=Math.max(1,rect.width);ch=Math.max(1,rect.height);
    canvas.width=Math.round(cw*dpr);canvas.height=Math.round(ch*dpr);canvas.style.width=`${cw}px`;canvas.style.height=`${ch}px`;ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=Math.max(18,Math.min(34,Math.round(cw/24)));
    particles=Array.from({length:count},(_,i)=>({
      nx:.23+seeded(i*7+1)*.57,ny:.20+seeded(i*7+2)*.58,r:.45+seeded(i*7+3)*.85,
      alpha:.06+seeded(i*7+4)*.17,phase:seeded(i*7+5)*Math.PI*2,speed:.16+seeded(i*7+6)*.28,drift:(seeded(i*7+7)-.5)*10
    }));
  }
  function themeRGB(){
    const raw=getComputedStyle(root).getPropertyValue('--theme-accent-rgb').trim();
    const p=raw.split(',').map(Number);return p.length===3&&p.every(Number.isFinite)?p:[0,230,118];
  }
  function drawParticles(now,state){
    if(!ctx||!canvas)return;
    ctx.clearRect(0,0,cw,ch);
    if(config.mode==='off'||!config.particles)return;
    const [r,g,b]=themeRGB(),t=(forcedPhase!==null?forcedPhase*6:now/1000),cx=cw*.52,cy=ch*.50;
    const range=config.glowRange/100;
    const fieldScale=.94+.08*state.energy*range;
    for(const p of particles){
      const bx=p.nx*cw,by=p.ny*ch;
      const x=cx+(bx-cx)*fieldScale+Math.sin(t*p.speed+p.phase)*p.drift;
      const y=cy+(by-cy)*fieldScale+Math.cos(t*p.speed*.73+p.phase)*p.drift*.30;
      const alpha=p.alpha*(.30+.58*state.energy)*range;
      const radius=p.r*(.78+.38*state.energy);
      const grd=ctx.createRadialGradient(x,y,0,x,y,radius*2.7);
      grd.addColorStop(0,`rgba(${r},${g},${b},${Math.min(.48,alpha)})`);
      grd.addColorStop(.30,`rgba(${r},${g},${b},${alpha*.34})`);
      grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=grd;ctx.beginPath();ctx.arc(x,y,radius*2.7,0,Math.PI*2);ctx.fill();
    }
  }

  function frame(now){const state=updateVisuals(now);drawParticles(now,state);requestAnimationFrame(frame)}
  function runTest(){
    testUntil=performance.now()+10000;cycleStart=performance.now();controls.test?.classList.add('is-testing');
    clearInterval(testTimer);let left=10;
    if(controls.test)controls.test.textContent=`呼吸测试 ${left}s`;
    if(controls.testStatus)controls.testStatus.textContent='测试中：面板缩放、流体整卡与收敛光场以 100% 幅度运行。';
    testTimer=setInterval(()=>{left-=1;if(controls.test)controls.test.textContent=left>0?`呼吸测试 ${left}s`:'10 秒呼吸测试';if(left<=0){clearInterval(testTimer);controls.test?.classList.remove('is-testing');if(controls.testStatus)controls.testStatus.textContent='测试结束，已恢复当前模式参数。'}},1000);
  }

  document.querySelectorAll('[data-breath-mode-option]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.breathModeOption)));
  controls.fluidRhythmButtons?.forEach(btn=>btn.addEventListener('click',()=>{config.fluidRhythm=btn.dataset.fluidRhythmOption||'layered';restartCycle();applyFlags();save(false)}));
  controls.speed?.addEventListener('input',()=>{config.speed=Number(controls.speed.value);if(config.mode==='off')config.mode='standard';restartCycle();applyFlags();save(false)});
  controls.amp?.addEventListener('input',()=>{config.amplitude=Number(controls.amp.value);if(config.mode==='off'&&config.amplitude>0)config.mode='standard';restartCycle();applyFlags();save(false)});
  controls.panelScale?.addEventListener('input',()=>{config.panelScale=Number(controls.panelScale.value);applyFlags();save(false)});
  controls.fluidEdge?.addEventListener('input',()=>{config.fluidEdge=Number(controls.fluidEdge.value);applyFlags();save(false)});
  controls.glowRange?.addEventListener('input',()=>{config.glowRange=Number(controls.glowRange.value);applyFlags();save(false)});
  ['activeCard','stage','ambient','panels','fluid','particles'].forEach(k=>controls[k]?.addEventListener('change',()=>{config[k]=controls[k].checked;applyFlags();save(false)}));
  controls.test?.addEventListener('click',runTest);
  el('themeSave')?.addEventListener('click',()=>save(true));
  el('themeReset')?.addEventListener('click',()=>{config=clone(DEFAULT);restartCycle();applyFlags();save(false)});
  el('saveBtn')?.addEventListener('click',()=>save(false));

  installLightLayers();applyFlags();buildParticles();
  if(window.ResizeObserver&&stage)new ResizeObserver(buildParticles).observe(stage);else window.addEventListener('resize',buildParticles);
  requestAnimationFrame(frame);

  const api={
    version:'2.0.0',get:()=>clone(config),set:(patch={})=>{config=safe({...config,...patch});restartCycle();applyFlags();save(false)},setMode,
    forcePhase:value=>{forcedPhase=clamp(Number(value)||0,0,1);const state=updateVisuals(performance.now());drawParticles(performance.now(),state)},
    releasePhase:()=>{forcedPhase=null;restartCycle()},runTest,reset:()=>{config=clone(DEFAULT);restartCycle();applyFlags();save(false)},
    metrics:()=>({
      phase:Number(root.dataset.breathPhase||0),
      cardScale:getComputedStyle(root).getPropertyValue('--v31-card-scale').trim(),
      panelScale:getComputedStyle(root).getPropertyValue('--v31-panel-scale').trim(),
      fluidAlpha:getComputedStyle(root).getPropertyValue('--v31-fluid-alpha').trim(),
      fluidScale:getComputedStyle(root).getPropertyValue('--v31-fluid-scale').trim(),
      fluidCardScale:getComputedStyle(root).getPropertyValue('--v31-fluid-card-scale').trim(),
      fluidBodyScale:getComputedStyle(root).getPropertyValue('--v31-fluid-body-scale').trim(),
      fluidRhythm:config.fluidRhythm,
      topFields:topFieldNodes.map(node=>({
        id:node.id||node.className,
        phase:node.dataset.breathFieldPhase||'',
        scale:node.style.getPropertyValue('--top-field-scale'),
        lift:node.style.getPropertyValue('--top-field-lift'),
        brightness:node.style.getPropertyValue('--top-field-brightness')
      })),
      ambientOpacity:getComputedStyle(root).getPropertyValue('--v31-ambient-opacity').trim(),
      panelAlpha:getComputedStyle(root).getPropertyValue('--v31-panel-alpha').trim(),
      particles:particles.length
    })
  };
  window.__particleBreathV3=api;
  window.__dashboardBreath=api;
})();
