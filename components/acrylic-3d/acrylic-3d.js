/* Immersive UI System · Sponsor Access · Personal Non-Commercial
   Particle-driven 3D acrylic folder stack and rotatable orbit with five dark themes and a real frosted-material system that separates surface haze from background blur, supports per-region scope and offsets, independently adjustable card dimensions, freely positioned orbit stage and progress card, configurable selection/snap motion, non-modal live settings, local editing/saving, table switching and demo interactions.
   NOTE: Demo data is generic. Integrate your own application data through adapters. */

(() => {
  const STORAGE_KEY = 'dark-glass-cockpit-ui-state-v1';
  const toast = document.getElementById('toast');
  const showToast = msg => { toast.textContent = msg; toast.classList.add('show'); clearTimeout(showToast.t); showToast.t=setTimeout(()=>toast.classList.remove('show'),1700); };

  const notes = [
    {name:'Core Engine',count:128,status:'Active',date:'2026-08-08',title:'Core Rendering Engine',desc:'Shared rendering, scheduling and state infrastructure for the immersive interface.',icon:'⌑'},
    {name:'Data Layer',count:84,status:'Complete',date:'2026-08-07',title:'Data & State Layer',desc:'Generic state adapters and data presentation patterns for dashboard applications.',icon:'◇'},
    {name:'Automation',count:72,status:'Active',date:'2026-08-06',title:'Automation Modules',desc:'Optional workflow surfaces and automated interface behaviors.',icon:'✦'},
    {name:'Frontend',count:146,status:'Review',date:'2026-08-05',title:'Frontend Components',desc:'Reusable controls, panels, tables and dense information layouts.',icon:'✎'},
    {name:'Platform',count:312,status:'Active',date:'2026-08-08',title:'Platform Runtime',desc:'The integrated visual runtime combining glass material, WebGL, 3D cards and synchronized motion.',icon:'✣'},
    {name:'Integrations',count:58,status:'Complete',date:'2026-08-04',title:'Integration Layer',desc:'Generic integration surfaces for connecting the UI to external application data.',icon:'◴'},
    {name:'Analytics',count:94,status:'Active',date:'2026-08-03',title:'Analytics Surfaces',desc:'Information-dense views for metrics, trends and operational health.',icon:'▱'},
    {name:'Experiments',count:41,status:'Review',date:'2026-08-02',title:'Visual Experiments',desc:'Optional experimental interaction and material treatments.',icon:'✓'},
    {name:'Archive',count:67,status:'Complete',date:'2026-08-01',title:'Archived Modules',desc:'Stable modules retained for reference and compatibility.',icon:'□'},
    {name:'Settings',count:24,status:'Complete',date:'2026-07-31',title:'Configuration System',desc:'Live settings panels, local persistence and configurable design tokens.',icon:'⚙'},
    {name:'Backlog',count:33,status:'Pending',date:'2026-07-30',title:'Pending Improvements',desc:'Non-critical improvements available for future iteration.',icon:'!'},
    {name:'Review Queue',count:51,status:'Review',date:'2026-07-29',title:'Review Queue',desc:'Modules waiting for design or implementation review.',icon:'↧'}
  ];

  const folderStage = document.getElementById('folderStage');
  const folderDeck = document.getElementById('folderDeck');
  const activeName = document.getElementById('activeFolderName');
  const modeBadge = document.getElementById('stackModeBadge');
  const captionHint = document.getElementById('folderCaptionHint');
  const stack3dBtn = document.getElementById('stack3dBtn');
  const stackOrbitBtn = document.getElementById('stackOrbitBtn');
  const stackAutoBtn = document.getElementById('stackAutoBtn');
  const stackResetBtn = document.getElementById('stackResetBtn');
  const stackSettingsBtn = document.getElementById('stackSettingsBtn');
  const FOLDER_DEFAULTS = Object.freeze({
    perspective:1380,spread:61,depth:44,tilt:52,lift:48,scale:1.00,cardWidth:116,cardHeight:204,stackScale:.92,orbitScale:.78,activeScale:1.04,orbitRearScale:.70,blur:1.55,glow:.76,
    acrylic:.16,frost:.82,rim:.72,parallax:true,reflection:true,
    progressX:8,progressY:15,progressWidth:122,progressHeight:138,progressRotate:-2.2,progressOpacity:.94,progressVisible:true,
    orbitOffsetX:0,orbitOffsetY:0,selectDuration:520,snapDuration:360,highlightDuration:420,orbitEasing:'smooth',
    orbitRadiusX:252,orbitRadiusZ:162,orbitHeight:9,orbitLean:19,orbitInertia:.94,cruiseSpeed:.22,
    autoCenter:true,autoCruise:false
  });
  let folderConfig={...FOLDER_DEFAULTS};
  let folderMode='orbit';
  let activeIndex=4;
  let pointerRX=0,pointerRY=0;
  let cards=[];
  let orbitRotation=0,orbitTarget=null,orbitVelocity=0,orbitAnimation=null;
  let orbitDragging=false,orbitMoved=false,orbitSnapPending=false;
  let pointerId=null,lastPointerX=0,lastPointerT=0,dragDistance=0,ignoreClickUntil=0;
  let lastFrame=performance.now();

  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const TAU=Math.PI*2;
  const stepAngle=()=>TAU/notes.length;
  const completionFor=note=>note.status==='Complete'?100:note.status==='Review'?78:note.status==='Active'?68:24;
  const wrapIndex=n=>((n%notes.length)+notes.length)%notes.length;
  function safeFolderConfig(raw){
    const r=raw&&typeof raw==='object'?raw:{};
    return {
      perspective:clamp(Number(r.perspective)||FOLDER_DEFAULTS.perspective,850,1800),
      spread:clamp(Number(r.spread)||FOLDER_DEFAULTS.spread,20,96),
      depth:clamp(Number(r.depth)||FOLDER_DEFAULTS.depth,16,100),
      tilt:clamp(Number(r.tilt)||FOLDER_DEFAULTS.tilt,24,70),
      lift:clamp(Number(r.lift)||FOLDER_DEFAULTS.lift,12,90),
      scale:clamp(Number(r.scale)||FOLDER_DEFAULTS.scale,.35,1.25),
      cardWidth:clamp(Number(r.cardWidth)||FOLDER_DEFAULTS.cardWidth,48,190),
      cardHeight:clamp(Number(r.cardHeight)||FOLDER_DEFAULTS.cardHeight,78,300),
      stackScale:clamp(Number.isFinite(Number(r.stackScale))?Number(r.stackScale):FOLDER_DEFAULTS.stackScale,.35,1.40),
      orbitScale:clamp(Number.isFinite(Number(r.orbitScale))?Number(r.orbitScale):FOLDER_DEFAULTS.orbitScale,.35,1.40),
      activeScale:clamp(Number.isFinite(Number(r.activeScale))?Number(r.activeScale):FOLDER_DEFAULTS.activeScale,.85,1.40),
      orbitRearScale:clamp(Number.isFinite(Number(r.orbitRearScale))?Number(r.orbitRearScale):FOLDER_DEFAULTS.orbitRearScale,.30,.95),
      blur:clamp(Number.isFinite(Number(r.blur))?Number(r.blur):FOLDER_DEFAULTS.blur,0,3.2),
      glow:clamp(Number.isFinite(Number(r.glow))?Number(r.glow):FOLDER_DEFAULTS.glow,0,1),
      acrylic:clamp(Number.isFinite(Number(r.acrylic))?Number(r.acrylic):FOLDER_DEFAULTS.acrylic,.05,.36),
      frost:clamp(Number.isFinite(Number(r.frost))?Number(r.frost):FOLDER_DEFAULTS.frost,.42,1),
      rim:clamp(Number.isFinite(Number(r.rim))?Number(r.rim):FOLDER_DEFAULTS.rim,.2,1),
      parallax:typeof r.parallax==='boolean'?r.parallax:FOLDER_DEFAULTS.parallax,
      reflection:typeof r.reflection==='boolean'?r.reflection:FOLDER_DEFAULTS.reflection,
      progressX:clamp(Number.isFinite(Number(r.progressX))?Number(r.progressX):FOLDER_DEFAULTS.progressX,-10,80),
      progressY:clamp(Number.isFinite(Number(r.progressY))?Number(r.progressY):FOLDER_DEFAULTS.progressY,-10,78),
      progressWidth:clamp(Number(r.progressWidth)||FOLDER_DEFAULTS.progressWidth,90,260),
      progressHeight:clamp(Number(r.progressHeight)||FOLDER_DEFAULTS.progressHeight,105,270),
      progressRotate:clamp(Number.isFinite(Number(r.progressRotate))?Number(r.progressRotate):FOLDER_DEFAULTS.progressRotate,-16,16),
      progressOpacity:clamp(Number.isFinite(Number(r.progressOpacity))?Number(r.progressOpacity):FOLDER_DEFAULTS.progressOpacity,.15,1),
      progressVisible:typeof r.progressVisible==='boolean'?r.progressVisible:FOLDER_DEFAULTS.progressVisible,
      orbitOffsetX:clamp(Number.isFinite(Number(r.orbitOffsetX))?Number(r.orbitOffsetX):FOLDER_DEFAULTS.orbitOffsetX,-35,35),
      orbitOffsetY:clamp(Number.isFinite(Number(r.orbitOffsetY))?Number(r.orbitOffsetY):FOLDER_DEFAULTS.orbitOffsetY,-25,25),
      selectDuration:clamp(Number(r.selectDuration)||FOLDER_DEFAULTS.selectDuration,120,1800),
      snapDuration:clamp(Number(r.snapDuration)||FOLDER_DEFAULTS.snapDuration,100,1400),
      highlightDuration:clamp(Number(r.highlightDuration)||FOLDER_DEFAULTS.highlightDuration,100,1200),
      orbitEasing:['smooth','quick','spring'].includes(r.orbitEasing)?r.orbitEasing:FOLDER_DEFAULTS.orbitEasing,
      orbitRadiusX:clamp(Number(r.orbitRadiusX)||FOLDER_DEFAULTS.orbitRadiusX,120,380),
      orbitRadiusZ:clamp(Number(r.orbitRadiusZ)||FOLDER_DEFAULTS.orbitRadiusZ,80,235),
      orbitHeight:clamp(Number.isFinite(Number(r.orbitHeight))?Number(r.orbitHeight):FOLDER_DEFAULTS.orbitHeight,0,28),
      orbitLean:clamp(Number.isFinite(Number(r.orbitLean))?Number(r.orbitLean):FOLDER_DEFAULTS.orbitLean,0,38),
      orbitInertia:clamp(Number.isFinite(Number(r.orbitInertia))?Number(r.orbitInertia):FOLDER_DEFAULTS.orbitInertia,.78,.98),
      cruiseSpeed:clamp(Number.isFinite(Number(r.cruiseSpeed))?Number(r.cruiseSpeed):FOLDER_DEFAULTS.cruiseSpeed,.05,.60),
      autoCenter:typeof r.autoCenter==='boolean'?r.autoCenter:FOLDER_DEFAULTS.autoCenter,
      autoCruise:typeof r.autoCruise==='boolean'?r.autoCruise:FOLDER_DEFAULTS.autoCruise
    };
  }
  function makeFolderCard(note,index){
    const card=document.createElement('article');
    card.className='folder-card';
    card.dataset.index=String(index);
    card.setAttribute('role','button');
    card.setAttribute('tabindex','0');
    card.setAttribute('aria-label',`${note.name}, ${note.count} items, status ${note.status}`);
    card.innerHTML=`
      <div class="folder-card-art">
        <div class="card-side left"></div><div class="card-side right"></div><div class="card-top-edge"></div>
        <div class="acrylic-shell">
          <div class="folder-code"><span>UI · ${String(index+1).padStart(2,'0')}</span><i></i></div>
          <div class="folder-core"></div><div class="folder-paper"></div>
          <div class="folder-glyph">${note.icon}</div>
          <div class="folder-meta"><span>${note.count} items</span><span>${note.status}</span></div>
          <div class="folder-name">${note.name}</div>
        </div><div class="folder-rim"></div>
      </div>`;
    const activate=()=>{if(performance.now()<ignoreClickUntil)return;selectFolder(index,true)};
    card.addEventListener('click',activate);
    card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
    folderDeck.appendChild(card);
    return card;
  }
  cards=notes.map(makeFolderCard);

  function signedOffset(index,center){
    let d=index-center;const half=notes.length/2;
    if(d>half)d-=notes.length;if(d<-half)d+=notes.length;return d;
  }
  function nearestRotationFor(index,current=orbitRotation){
    const base=-index*stepAngle();
    return base+Math.round((current-base)/TAU)*TAU;
  }
  function nearestFrontIndex(){return wrapIndex(Math.round(-orbitRotation/stepAngle()));}
  function orbitEase(t,name=folderConfig.orbitEasing){
    const x=clamp(t,0,1);
    if(name==='quick')return 1-Math.pow(1-x,5);
    if(name==='spring'){
      const c1=1.35,c3=c1+1;
      return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);
    }
    return x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
  }
  function startOrbitAnimation(target,duration=folderConfig.selectDuration,easing=folderConfig.orbitEasing){
    orbitTarget=target;orbitVelocity=0;orbitSnapPending=false;
    orbitAnimation={from:orbitRotation,to:target,start:performance.now(),duration:Math.max(1,Number(duration)||1),easing};
  }
  function cancelOrbitAnimation(){orbitAnimation=null;orbitTarget=null;}
  function applyFolderCSSVars(){
    folderStage.style.setProperty('--stack-perspective',`${folderConfig.perspective}px`);
    folderStage.style.setProperty('--stack-spread',`${folderConfig.spread}px`);
    folderStage.style.setProperty('--stack-depth',`${folderConfig.depth}px`);
    folderStage.style.setProperty('--stack-tilt',`${folderConfig.tilt}deg`);
    folderStage.style.setProperty('--active-lift',`${folderConfig.lift}px`);
    folderStage.style.setProperty('--folder-scale',folderConfig.scale);
    folderStage.style.setProperty('--folder-card-width',folderConfig.cardWidth);
    folderStage.style.setProperty('--folder-card-height',folderConfig.cardHeight);
    folderStage.style.setProperty('--folder-card-scale-x',(folderConfig.cardWidth/116).toFixed(5));
    folderStage.style.setProperty('--folder-card-scale-y',(folderConfig.cardHeight/204).toFixed(5));
    folderStage.style.setProperty('--progress-x',folderConfig.progressX);
    folderStage.style.setProperty('--progress-y',folderConfig.progressY);
    folderStage.style.setProperty('--progress-width',folderConfig.progressWidth);
    folderStage.style.setProperty('--progress-height',folderConfig.progressHeight);
    folderStage.style.setProperty('--progress-rotate',folderConfig.progressRotate);
    folderStage.style.setProperty('--progress-opacity',folderConfig.progressOpacity);
    folderStage.style.setProperty('--orbit-offset-x',folderConfig.orbitOffsetX);
    folderStage.style.setProperty('--orbit-offset-y',folderConfig.orbitOffsetY);
    folderStage.style.setProperty('--highlight-duration',`${folderConfig.highlightDuration}ms`);
    folderStage.classList.toggle('progress-hidden',!folderConfig.progressVisible);
    folderStage.style.setProperty('--stack-blur',`${folderConfig.blur}px`);
    folderStage.style.setProperty('--stack-glow',folderConfig.glow);
    folderStage.style.setProperty('--acrylic-alpha',folderConfig.acrylic);
    folderStage.style.setProperty('--frost-strength',folderConfig.frost);
    folderStage.style.setProperty('--rim-strength',folderConfig.rim);
    folderStage.classList.toggle('no-reflection',!folderConfig.reflection);
    folderStage.classList.toggle('auto-cruising',folderMode==='orbit'&&folderConfig.autoCruise);
  }
  function layoutStack(){
    const deckScale=folderConfig.scale*folderConfig.stackScale;
    const rx=folderConfig.parallax?pointerRY:0;
    const ry=folderConfig.parallax?pointerRX:0;
    folderDeck.style.transform=`translate3d(0,0,0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${deckScale})`;
    cards.forEach((card,index)=>{
      const d=signedOffset(index,activeIndex),a=Math.abs(d),sign=d<0?-1:1;
      const compressed=a*folderConfig.spread-Math.pow(a,1.22)*1.55;
      const x=d===0?0:sign*compressed;
      const y=d===0?-2:a*1.55+Math.max(0,a-3)*.75;
      const z=d===0?folderConfig.lift:-a*folderConfig.depth*.26;
      const rotateY=d===0?-6:sign*-folderConfig.tilt*(.70+Math.min(a,5)*.052);
      const rotateZ=d===0?.15:sign*a*.62;
      const scale=d===0?folderConfig.activeScale:Math.max(.48,1-a*.027);
      const opacity=d===0?1:Math.max(.64,1-a*.048);
      const blur=d===0?0:Math.max(0,(a-2)*folderConfig.blur*.18);
      const brightness=d===0?1.08:Math.max(.76,1-a*.028);
      card.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${rotateY.toFixed(1)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity=opacity.toFixed(3);
      card.style.filter=`brightness(${brightness.toFixed(3)}) blur(${blur.toFixed(2)}px) drop-shadow(0 24px 28px rgba(0,0,0,.62))`;
      card.style.zIndex=String(d===0?400:200-a*10+(d>0?1:0));
    });
  }
  function layoutOrbit(){
    const rx=folderConfig.parallax&&!orbitDragging?pointerRY*.42:0;
    const ry=folderConfig.parallax&&!orbitDragging?pointerRX*.34:0;
    folderDeck.style.transform=`translate3d(0,0,0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) scale(${(folderConfig.scale*folderConfig.orbitScale).toFixed(4)})`;
    cards.forEach((card,index)=>{
      const angle=orbitRotation+index*stepAngle();
      const sin=Math.sin(angle),cos=Math.cos(angle);
      const depthNorm=(cos+1)/2;
      const x=sin*folderConfig.orbitRadiusX;
      const z=cos*folderConfig.orbitRadiusZ;
      const y=Math.sin(angle*2)*folderConfig.orbitHeight+(1-depthNorm)*8-4;
      const isActive=index===activeIndex;
      const scale=(folderConfig.orbitRearScale+depthNorm*(1-folderConfig.orbitRearScale))*(isActive?folderConfig.activeScale:1);
      const rotateY=-sin*folderConfig.orbitLean;
      const rotateZ=-sin*2.2;
      const opacity=clamp(.25+depthNorm*.75,.22,1);
      const blur=isActive&&depthNorm>.82?0:(1-depthNorm)*folderConfig.blur;
      const brightness=.61+depthNorm*.49+(isActive?.045:0);
      card.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,${z.toFixed(1)}px) rotateY(${rotateY.toFixed(1)}deg) rotateZ(${rotateZ.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      card.style.opacity=opacity.toFixed(3);
      card.style.filter=`brightness(${brightness.toFixed(3)}) blur(${blur.toFixed(2)}px) drop-shadow(0 24px 28px rgba(0,0,0,.64))`;
      card.style.zIndex=String(100+Math.round(depthNorm*300)+(isActive?3:0));
    });
  }
  function layoutFolders(immediate=false){
    applyFolderCSSVars();folderStage.dataset.mode=folderMode;
    if(folderMode==='orbit')layoutOrbit();else layoutStack();
    if(immediate){cards.forEach(c=>c.style.transition='none');requestAnimationFrame(()=>requestAnimationFrame(()=>cards.forEach(c=>c.style.removeProperty('transition'))));}
  }
  function updateFolderDetails(index){
    const n=notes[index],percent=completionFor(n);
    activeName.textContent=n.name;
    document.getElementById('focusFolderName').textContent=n.name;
    document.getElementById('focusFolderCount').textContent=`${n.count} items`;
    document.getElementById('focusFolderPercent').textContent=String(percent);
    document.getElementById('focusFolderLabel').textContent=n.status==='Complete'?'Complete':n.status==='Review'?'In review':'Completion';
    document.getElementById('focusProgressBar').style.width=`${percent}%`;
    const id=document.getElementById('detailId'),title=document.getElementById('detailTitle'),desc=document.getElementById('detailDesc'),folder=document.getElementById('detailFolder'),date=document.getElementById('detailDate'),status=document.getElementById('detailStatus');
    if(id)id.textContent=`FOLDER-${String(index+1).padStart(2,'0')}-${n.count}`;
    if(title)title.textContent=n.title;if(desc)desc.textContent=n.desc;if(folder)folder.textContent=n.name;
    if(date)date.textContent=`${n.date} 18:55`;if(status)status.innerHTML=`<span class="state-dot"></span>${n.status}`;
  }
  function markActive(index,update=true){
    activeIndex=wrapIndex(index);
    cards.forEach((card,i)=>{card.classList.toggle('active',i===activeIndex);card.setAttribute('aria-pressed',i===activeIndex?'true':'false')});
    if(update)updateFolderDetails(activeIndex);
  }
  function selectFolder(index,animate=true){
    markActive(index,true);
    if(folderMode==='orbit'){
      folderConfig.autoCruise=false;orbitVelocity=0;orbitSnapPending=false;
      const target=nearestRotationFor(activeIndex);
      syncCruiseButtons();
      if(animate)startOrbitAnimation(target,folderConfig.selectDuration,folderConfig.orbitEasing);
      else{cancelOrbitAnimation();orbitRotation=target;layoutFolders(true)}
    }else layoutFolders(!animate);
  }
  function setFolderMode(mode,notify=false){
    folderMode=mode==='stack'?'stack':'orbit';
    stack3dBtn.classList.toggle('active',folderMode==='stack');
    stackOrbitBtn.classList.toggle('active',folderMode==='orbit');
    document.getElementById('panel3dMode')?.classList.toggle('active',folderMode==='stack');
    document.getElementById('panelOrbitMode')?.classList.toggle('active',folderMode==='orbit');
    modeBadge.textContent=folderMode==='orbit'?'3D 环形 · 可拖拽':'3D 亚克力堆栈';
    captionHint.textContent=folderMode==='orbit'?'按住拖动旋转 · 点击卡片自动居中':'移动鼠标查看折射 · 点击卡片聚焦';
    if(folderMode==='orbit'){
      orbitRotation=nearestRotationFor(activeIndex,orbitRotation);cancelOrbitAnimation();orbitVelocity=0;orbitSnapPending=false;
    }else{folderConfig.autoCruise=false;syncCruiseButtons()}
    layoutFolders(false);syncFolderSettingsUI();
    if(notify)showToast(folderMode==='orbit'?'已切换为可拖拽 3D 环形旋转':'已切换为 3D 亚克力堆栈');
  }
  function syncCruiseButtons(){
    const on=folderMode==='orbit'&&folderConfig.autoCruise;
    stackAutoBtn.classList.toggle('active',on);stackAutoBtn.textContent=on?'Ⅱ 暂停巡航':'▶ 自动巡航';
    const toggle=document.getElementById('autoCruiseToggle');if(toggle)toggle.checked=folderConfig.autoCruise;
  }
  function toggleCruise(){
    if(folderMode!=='orbit')setFolderMode('orbit',false);
    folderConfig.autoCruise=!folderConfig.autoCruise;cancelOrbitAnimation();orbitVelocity=0;orbitSnapPending=false;
    syncCruiseButtons();layoutFolders(false);showToast(folderConfig.autoCruise?'已开启 3D 环形自动巡航':'已暂停自动巡航');
  }
  function snapOrbitToNearest(){
    const idx=nearestFrontIndex();markActive(idx,true);orbitVelocity=0;orbitSnapPending=false;
    startOrbitAnimation(nearestRotationFor(idx),folderConfig.snapDuration,folderConfig.orbitEasing);
  }

  stack3dBtn.addEventListener('click',()=>setFolderMode('stack',true));
  stackOrbitBtn.addEventListener('click',()=>setFolderMode('orbit',true));
  stackAutoBtn.addEventListener('click',toggleCruise);
  stackResetBtn.addEventListener('click',()=>{
    pointerRX=0;pointerRY=0;folderConfig.autoCruise=false;orbitVelocity=0;orbitSnapPending=false;cancelOrbitAnimation();
    markActive(4,true);folderMode='orbit';orbitRotation=-activeIndex*stepAngle();
    setFolderMode('orbit',false);syncCruiseButtons();layoutFolders(true);showToast('环形视角已复位');
  });
  folderStage.addEventListener('pointerdown',e=>{
    if(folderMode!=='orbit'||e.button!==0)return;
    orbitDragging=true;orbitMoved=false;dragDistance=0;pointerId=e.pointerId;lastPointerX=e.clientX;lastPointerT=performance.now();cancelOrbitAnimation();orbitVelocity=0;folderConfig.autoCruise=false;syncCruiseButtons();
    folderStage.classList.add('is-dragging');folderStage.setPointerCapture?.(e.pointerId);
  });
  folderStage.addEventListener('pointermove',e=>{
    const r=folderStage.getBoundingClientRect();
    if(folderMode==='stack'){
      if(!folderConfig.parallax)return;
      pointerRX=clamp(((e.clientX-r.left)/r.width-.5)*8,-4,4);pointerRY=clamp(-((e.clientY-r.top)/r.height-.5)*5,-2.5,2.5);layoutFolders(false);return;
    }
    if(!orbitDragging||e.pointerId!==pointerId)return;
    const now=performance.now(),dx=e.clientX-lastPointerX,dt=Math.max(.008,(now-lastPointerT)/1000),delta=dx*.0062;
    orbitRotation+=delta;orbitVelocity=orbitVelocity*.52+(delta/dt)*.48;dragDistance+=Math.abs(dx);orbitMoved=dragDistance>5;
    lastPointerX=e.clientX;lastPointerT=now;layoutFolders(false);
  });
  function endOrbitDrag(e){
    if(!orbitDragging||(e&&pointerId!==null&&e.pointerId!==pointerId))return;
    orbitDragging=false;folderStage.classList.remove('is-dragging');
    try{if(e&&folderStage.hasPointerCapture?.(e.pointerId))folderStage.releasePointerCapture(e.pointerId)}catch(_){}
    pointerId=null;if(orbitMoved){ignoreClickUntil=performance.now()+180;orbitSnapPending=folderConfig.autoCenter}
  }
  folderStage.addEventListener('pointerup',endOrbitDrag);folderStage.addEventListener('pointercancel',endOrbitDrag);
  folderStage.addEventListener('pointerleave',e=>{if(folderMode==='stack'){pointerRX=0;pointerRY=0;layoutFolders(false)}else if(orbitDragging&&e.buttons===0)endOrbitDrag(e)});
  folderStage.addEventListener('wheel',e=>{e.preventDefault();folderConfig.scale=clamp(folderConfig.scale-e.deltaY*.0005,.35,1.25);layoutFolders(false);syncFolderSettingsUI()},{passive:false});

  function animateOrbit(ts){
    const dt=Math.min(.05,Math.max(.001,(ts-lastFrame)/1000));lastFrame=ts;
    if(folderMode==='orbit'&&!orbitDragging){
      let changed=false;
      if(orbitAnimation){
        const raw=clamp((ts-orbitAnimation.start)/orbitAnimation.duration,0,1);
        const eased=orbitEase(raw,orbitAnimation.easing);
        orbitRotation=orbitAnimation.from+(orbitAnimation.to-orbitAnimation.from)*eased;changed=true;
        if(raw>=1){orbitRotation=orbitAnimation.to;orbitAnimation=null;orbitTarget=null;orbitVelocity=0}
      }else if(folderConfig.autoCruise){
        orbitRotation+=folderConfig.cruiseSpeed*dt;changed=true;
        const front=nearestFrontIndex();if(front!==activeIndex)markActive(front,true);
      }else if(Math.abs(orbitVelocity)>.003){
        orbitRotation+=orbitVelocity*dt;orbitVelocity*=Math.pow(folderConfig.orbitInertia,dt*60);changed=true;
      }else if(orbitSnapPending&&folderConfig.autoCenter){snapOrbitToNearest();changed=true}
      if(changed)layoutFolders(false);
    }
    requestAnimationFrame(animateOrbit);
  }
  requestAnimationFrame(animateOrbit);

  const settingsPanel=document.getElementById('folderSettingsPanel');
  const settingsBackdrop=document.getElementById('folderSettingsBackdrop');
  function openFolderSettings(){settingsBackdrop.hidden=true;settingsBackdrop.classList.remove('is-open');requestAnimationFrame(()=>{settingsPanel.classList.add('is-open');settingsPanel.setAttribute('aria-hidden','false')});syncFolderSettingsUI()}
  function closeFolderSettings(){settingsPanel.classList.remove('is-open');settingsPanel.setAttribute('aria-hidden','true')}
  stackSettingsBtn.addEventListener('click',openFolderSettings);
  document.getElementById('folderSettingsClose').addEventListener('click',closeFolderSettings);
  document.getElementById('panel3dMode').addEventListener('click',()=>setFolderMode('stack',true));
  document.getElementById('panelOrbitMode').addEventListener('click',()=>setFolderMode('orbit',true));
  const rangeBindings=[
    ['perspectiveRange','perspective','perspectiveOut',v=>Math.round(v)],
    ['spreadRange','spread','spreadOut',v=>Math.round(v)],
    ['depthRange','depth','depthOut',v=>Math.round(v)],
    ['tiltRange','tilt','tiltOut',v=>`${Math.round(v)}°`],
    ['liftRange','lift','liftOut',v=>Math.round(v)],
    ['scaleRange','scale','scaleOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['cardWidthRange','cardWidth','cardWidthOut',v=>`${Math.round(v)} px`],
    ['cardHeightRange','cardHeight','cardHeightOut',v=>`${Math.round(v)} px`],
    ['activeScaleRange','activeScale','activeScaleOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['stackScaleRange','stackScale','stackScaleOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['orbitOffsetXRange','orbitOffsetX','orbitOffsetXOut',v=>`${Number(v).toFixed(1)}%`],
    ['orbitOffsetYRange','orbitOffsetY','orbitOffsetYOut',v=>`${Number(v).toFixed(1)}%`],
    ['selectDurationRange','selectDuration','selectDurationOut',v=>`${Math.round(v)} ms`],
    ['snapDurationRange','snapDuration','snapDurationOut',v=>`${Math.round(v)} ms`],
    ['highlightDurationRange','highlightDuration','highlightDurationOut',v=>`${Math.round(v)} ms`],
    ['orbitScaleRange','orbitScale','orbitScaleOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['orbitRearScaleRange','orbitRearScale','orbitRearScaleOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['progressXRange','progressX','progressXOut',v=>`${Number(v).toFixed(1)}%`],
    ['progressYRange','progressY','progressYOut',v=>`${Number(v).toFixed(1)}%`],
    ['progressWidthRange','progressWidth','progressWidthOut',v=>`${Math.round(v)} px`],
    ['progressHeightRange','progressHeight','progressHeightOut',v=>`${Math.round(v)} px`],
    ['progressRotateRange','progressRotate','progressRotateOut',v=>`${Number(v).toFixed(1)}°`],
    ['progressOpacityRange','progressOpacity','progressOpacityOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['blurRange','blur','blurOut',v=>Number(v).toFixed(2)],
    ['glowRange','glow','glowOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['acrylicRange','acrylic','acrylicOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['frostRange','frost','frostOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['rimRange','rim','rimOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['orbitRadiusXRange','orbitRadiusX','orbitRadiusXOut',v=>Math.round(v)],
    ['orbitRadiusZRange','orbitRadiusZ','orbitRadiusZOut',v=>Math.round(v)],
    ['orbitHeightRange','orbitHeight','orbitHeightOut',v=>Math.round(v)],
    ['orbitLeanRange','orbitLean','orbitLeanOut',v=>`${Math.round(v)}°`],
    ['orbitInertiaRange','orbitInertia','orbitInertiaOut',v=>`${Math.round(v*100)}%`,v=>v/100],
    ['cruiseSpeedRange','cruiseSpeed','cruiseSpeedOut',v=>`${Math.round(v*100)}%`,v=>v/100]
  ];
  rangeBindings.forEach(([id,key,outId,format,parse])=>{
    const input=document.getElementById(id),out=document.getElementById(outId);if(!input)return;
    input.addEventListener('input',()=>{const raw=Number(input.value);folderConfig[key]=parse?parse(raw):raw;out.textContent=String(format(folderConfig[key]));layoutFolders(false)});
  });
  document.getElementById('orbitEasingSelect').addEventListener('change',e=>{folderConfig.orbitEasing=e.currentTarget.value;});
  document.getElementById('parallaxToggle').addEventListener('change',e=>{folderConfig.parallax=e.currentTarget.checked;if(!folderConfig.parallax){pointerRX=0;pointerRY=0}layoutFolders(false)});
  document.getElementById('reflectionToggle').addEventListener('change',e=>{folderConfig.reflection=e.currentTarget.checked;layoutFolders(false)});
  document.getElementById('progressVisibleToggle').addEventListener('change',e=>{folderConfig.progressVisible=e.currentTarget.checked;layoutFolders(false)});
  document.getElementById('autoCenterToggle').addEventListener('change',e=>{folderConfig.autoCenter=e.currentTarget.checked});
  document.getElementById('autoCruiseToggle').addEventListener('change',e=>{folderConfig.autoCruise=e.currentTarget.checked;if(folderConfig.autoCruise&&folderMode!=='orbit')setFolderMode('orbit',false);orbitTarget=null;orbitVelocity=0;syncCruiseButtons();layoutFolders(false)});
  function syncFolderSettingsUI(){
    const values={perspectiveRange:folderConfig.perspective,spreadRange:folderConfig.spread,depthRange:folderConfig.depth,tiltRange:folderConfig.tilt,liftRange:folderConfig.lift,scaleRange:folderConfig.scale*100,cardWidthRange:folderConfig.cardWidth,cardHeightRange:folderConfig.cardHeight,activeScaleRange:folderConfig.activeScale*100,stackScaleRange:folderConfig.stackScale*100,orbitOffsetXRange:folderConfig.orbitOffsetX,orbitOffsetYRange:folderConfig.orbitOffsetY,selectDurationRange:folderConfig.selectDuration,snapDurationRange:folderConfig.snapDuration,highlightDurationRange:folderConfig.highlightDuration,orbitScaleRange:folderConfig.orbitScale*100,orbitRearScaleRange:folderConfig.orbitRearScale*100,progressXRange:folderConfig.progressX,progressYRange:folderConfig.progressY,progressWidthRange:folderConfig.progressWidth,progressHeightRange:folderConfig.progressHeight,progressRotateRange:folderConfig.progressRotate,progressOpacityRange:folderConfig.progressOpacity*100,blurRange:folderConfig.blur,glowRange:folderConfig.glow*100,acrylicRange:folderConfig.acrylic*100,frostRange:folderConfig.frost*100,rimRange:folderConfig.rim*100,orbitRadiusXRange:folderConfig.orbitRadiusX,orbitRadiusZRange:folderConfig.orbitRadiusZ,orbitHeightRange:folderConfig.orbitHeight,orbitLeanRange:folderConfig.orbitLean,orbitInertiaRange:folderConfig.orbitInertia*100,cruiseSpeedRange:folderConfig.cruiseSpeed*100};
    Object.entries(values).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.value=String(val)});
    const texts={perspectiveOut:Math.round(folderConfig.perspective),spreadOut:Math.round(folderConfig.spread),depthOut:Math.round(folderConfig.depth),tiltOut:`${Math.round(folderConfig.tilt)}°`,liftOut:Math.round(folderConfig.lift),scaleOut:`${Math.round(folderConfig.scale*100)}%`,cardWidthOut:`${Math.round(folderConfig.cardWidth)} px`,cardHeightOut:`${Math.round(folderConfig.cardHeight)} px`,activeScaleOut:`${Math.round(folderConfig.activeScale*100)}%`,stackScaleOut:`${Math.round(folderConfig.stackScale*100)}%`,orbitOffsetXOut:`${folderConfig.orbitOffsetX.toFixed(1)}%`,orbitOffsetYOut:`${folderConfig.orbitOffsetY.toFixed(1)}%`,selectDurationOut:`${Math.round(folderConfig.selectDuration)} ms`,snapDurationOut:`${Math.round(folderConfig.snapDuration)} ms`,highlightDurationOut:`${Math.round(folderConfig.highlightDuration)} ms`,orbitScaleOut:`${Math.round(folderConfig.orbitScale*100)}%`,orbitRearScaleOut:`${Math.round(folderConfig.orbitRearScale*100)}%`,progressXOut:`${folderConfig.progressX.toFixed(1)}%`,progressYOut:`${folderConfig.progressY.toFixed(1)}%`,progressWidthOut:`${Math.round(folderConfig.progressWidth)} px`,progressHeightOut:`${Math.round(folderConfig.progressHeight)} px`,progressRotateOut:`${folderConfig.progressRotate.toFixed(1)}°`,progressOpacityOut:`${Math.round(folderConfig.progressOpacity*100)}%`,blurOut:folderConfig.blur.toFixed(2),glowOut:`${Math.round(folderConfig.glow*100)}%`,acrylicOut:`${Math.round(folderConfig.acrylic*100)}%`,frostOut:`${Math.round(folderConfig.frost*100)}%`,rimOut:`${Math.round(folderConfig.rim*100)}%`,orbitRadiusXOut:Math.round(folderConfig.orbitRadiusX),orbitRadiusZOut:Math.round(folderConfig.orbitRadiusZ),orbitHeightOut:Math.round(folderConfig.orbitHeight),orbitLeanOut:`${Math.round(folderConfig.orbitLean)}°`,orbitInertiaOut:`${Math.round(folderConfig.orbitInertia*100)}%`,cruiseSpeedOut:`${Math.round(folderConfig.cruiseSpeed*100)}%`};
    Object.entries(texts).forEach(([id,val])=>{const el=document.getElementById(id);if(el)el.textContent=String(val)});
    document.getElementById('orbitEasingSelect').value=folderConfig.orbitEasing;
    document.getElementById('parallaxToggle').checked=folderConfig.parallax;document.getElementById('reflectionToggle').checked=folderConfig.reflection;document.getElementById('progressVisibleToggle').checked=folderConfig.progressVisible;document.getElementById('autoCenterToggle').checked=folderConfig.autoCenter;document.getElementById('autoCruiseToggle').checked=folderConfig.autoCruise;
    document.getElementById('folderStackSettings').classList.toggle('mode-dimmed',folderMode!=='stack');document.getElementById('folderOrbitSettings').classList.toggle('mode-dimmed',folderMode!=='orbit');syncCruiseButtons();
  }
  document.getElementById('folderResetSettings').addEventListener('click',()=>{folderConfig={...FOLDER_DEFAULTS};folderMode='orbit';activeIndex=4;orbitRotation=-activeIndex*stepAngle();cancelOrbitAnimation();orbitVelocity=0;markActive(activeIndex,true);setFolderMode('orbit',false);syncFolderSettingsUI();layoutFolders(true);showToast('3D 文件夹参数已恢复默认')});
  document.getElementById('folderSaveSettings').addEventListener('click',()=>{save();closeFolderSettings();showToast('3D 文件夹位置、尺寸与跳转动画设置已保存')});

    // Typography size control: standard → comfortable → large, persisted locally.
  const TYPE_SCALE_KEY = 'immersive_typography_scale_v2';
  const typeScaleBtn = document.getElementById('typeScaleBtn');
  const typeScaleOrder = ['standard','comfortable','large'];
  const typeScaleLabel = {standard:'标准',comfortable:'舒适',large:'放大'};
  function applyTypeScale(scale, notify=false){
    const safe = typeScaleOrder.includes(scale) ? scale : 'comfortable';
    document.documentElement.dataset.typeScale = safe;
    if(typeScaleBtn){
      typeScaleBtn.textContent = safe === 'large' ? 'A+' : safe === 'standard' ? 'A−' : 'Aa';
      typeScaleBtn.title = `当前字体：${typeScaleLabel[safe]}（点击切换）`;
      typeScaleBtn.setAttribute('aria-label', typeScaleBtn.title);
    }
    localStorage.setItem(TYPE_SCALE_KEY, safe);
    if(notify) showToast(`字体已切换为${typeScaleLabel[safe]}模式`);
  }
  applyTypeScale(localStorage.getItem(TYPE_SCALE_KEY) || 'comfortable');
  typeScaleBtn?.addEventListener('click',()=>{
    const current=document.documentElement.dataset.typeScale || 'comfortable';
    const next=typeScaleOrder[(typeScaleOrder.indexOf(current)+1)%typeScaleOrder.length];
    applyTypeScale(next,true);
  });

  // Existing dashboard controls
  let editing=false;
  const getEditables=()=>[...document.querySelectorAll('[data-editable]')];
  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      const editables=getEditables();
      if(Array.isArray(saved.text) && saved.text.length===editables.length){
        editables.forEach((el,i)=>{if(saved.text[i]!==undefined)el.innerHTML=saved.text[i]});
      }
      if(saved.folderMode==='orbit'||saved.folderMode==='stack')folderMode=saved.folderMode;else if(saved.folderMode==='3d')folderMode='stack';else if(saved.folderMode==='flat')folderMode='orbit';
      if(saved.folderConfig)folderConfig=safeFolderConfig(saved.folderConfig);
      if(Number.isInteger(saved.activeFolder))activeIndex=clamp(saved.activeFolder,0,notes.length-1);
    }catch(_){ }
  }
  function save(){
    localStorage.setItem(STORAGE_KEY,JSON.stringify({text:getEditables().map(el=>el.innerHTML),folderMode,folderConfig,activeFolder:activeIndex}));showToast('页面、3D 模式与卡片参数已保存到本机');
  }
  document.getElementById('editToggle').addEventListener('click',e=>{editing=!editing;getEditables().forEach(el=>el.contentEditable=editing);e.currentTarget.classList.toggle('active',editing);e.currentTarget.textContent=editing?'退出编辑':'编辑模式';showToast(editing?'已开启直接编辑':'已关闭编辑模式')});
  document.getElementById('saveBtn').addEventListener('click',save);
  document.getElementById('completeBtn').addEventListener('click',e=>{e.currentTarget.textContent='✓ Complete';save()});
  document.getElementById('primaryActionBtn').addEventListener('click',e=>{const old=e.currentTarget.textContent;e.currentTarget.textContent='Refreshing…';setTimeout(()=>{e.currentTarget.textContent='✓ Updated';showToast('Demo state refreshed');setTimeout(()=>e.currentTarget.textContent=old,1200)},650)});
  document.getElementById('fullscreenBtn').addEventListener('click',()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()});
  document.getElementById('exportBtn').addEventListener('click',()=>{
    save();
    const clone=document.documentElement.cloneNode(true);
    clone.querySelectorAll('[contenteditable]').forEach(el=>el.removeAttribute('contenteditable'));
    try{
      const dashboardSeed=localStorage.getItem(STORAGE_KEY);
      const fluidSeed=localStorage.getItem('immersive-fluid-glass-v1');
      const themeSeed=localStorage.getItem('immersive-theme-material-v1')||localStorage.getItem('immersive-theme-material-legacy-v22')||localStorage.getItem('immersive-theme-material-legacy-v20');
      const breathSeed=localStorage.getItem('immersive-breathing-v1');
      if(dashboardSeed || fluidSeed || themeSeed || breathSeed){
        const bootstrap=document.createElement('script');
        bootstrap.textContent=`try{${dashboardSeed ? `localStorage.setItem(${JSON.stringify(STORAGE_KEY)},${JSON.stringify(dashboardSeed)});` : ''}${fluidSeed ? `localStorage.setItem('immersive-fluid-glass-v1',${JSON.stringify(fluidSeed)});` : ''}${themeSeed ? `localStorage.setItem('immersive-theme-material-v1',${JSON.stringify(themeSeed)});` : ''}${breathSeed ? `localStorage.setItem('immersive-breathing-v1',${JSON.stringify(breathSeed)});` : ''}}catch(_){}`;
        clone.querySelector('head')?.appendChild(bootstrap);
      }
    }catch(_){ }
    const blob=new Blob(['<!DOCTYPE html>\n'+clone.outerHTML],{type:'text/html;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='粒子 3D 卡片呼吸版_已编辑.html';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);showToast('已导出粒子 3D 卡片呼吸版，包含主题、磨砂、粒子呼吸、流体材质与完整 3D 参数');
  });
  document.querySelectorAll('.nav-item[data-view]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));btn.classList.add('active');const table=btn.dataset.view==='table';document.querySelectorAll('.dashboard-part').forEach(x=>x.classList.toggle('dashboard-hidden',table));document.getElementById('tableView').classList.toggle('active',table)}));
  document.querySelectorAll('.check').forEach(c=>c.addEventListener('click',()=>{c.classList.toggle('checked');c.textContent=c.classList.contains('checked')?'✓':''}));

  load();folderConfig=safeFolderConfig(folderConfig);markActive(activeIndex,true);orbitRotation=-activeIndex*stepAngle();cancelOrbitAnimation();setFolderMode(folderMode,false);if(folderMode==='orbit')layoutFolders(true);else selectFolder(activeIndex,false);syncFolderSettingsUI();
  setTimeout(()=>{const c=document.getElementById('folderCaption');if(c)c.style.opacity='.62'},5200);
})();
