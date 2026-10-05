(() => {
  'use strict';
  const STORAGE_KEY='immersive-particle-core-v1';
  const PRESETS={
    glacier:{name:'冰川蓝紫',main:'#839DFF',highlight:'#B8F5FF',shadow:'#302A71'},
    cyan:{name:'深空青',main:'#45CADB',highlight:'#D4FFFF',shadow:'#06394B'},
    nebula:{name:'星云紫',main:'#A47BFF',highlight:'#F4D7FF',shadow:'#351557'},
    aurora:{name:'极光绿',main:'#36E6B4',highlight:'#D6FFF1',shadow:'#064B43'},
    lava:{name:'熔岩红',main:'#E65B66',highlight:'#FFD1B6',shadow:'#541326'},
    amber:{name:'琥珀金',main:'#E6B85C',highlight:'#FFF0C7',shadow:'#553516'},
    silver:{name:'黑曜银',main:'#A7B5C6',highlight:'#F3FAFF',shadow:'#252D3A'}
  };
  const DEFAULT={displayMode:'introBackground',autoEnter:false,autoDelay:5,introSpeed:2.4,bgSpeed:.75,introSize:1,bgSize:.62,bgOpacity:.20,bgX:54,bgY:52,colorMode:'preset',preset:'glacier',main:'#839DFF',highlight:'#B8F5FF',shadow:'#302A71',quality:'balanced',density:1,point:1.22,rim:.96,orbit:true,moon:true,pauseHidden:true};
  const clone=o=>JSON.parse(JSON.stringify(o));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function load(){try{return {...clone(DEFAULT),...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}}catch(_){return clone(DEFAULT)}}
  let cfg=load(),state='intro',transitionStart=0,transitionTimer=0,paused=false,hiddenByUser=false,autoTimer=0,lastFrame=0,randomPreset=null;
  const el=id=>document.getElementById(id),root=document.documentElement,body=document.body;
  const system=el('knowledgeSphereSystem'),canvas=el('knowledgeSphereCanvas'),ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
  let DPR=1,W=0,H=0,CX=0,CY=0,R=260,yaw=-.34,pitch=.06,zoom=1,drag=false,lastX=0,lastY=0,autoYaw=0;
  let shell=[],clusters=[],rimPts=[],volume=[],rings=[],moon=[];
  const rgbCache=new Map();
  function hexToRgb(hex){hex=(hex||'#000').replace('#','');if(hex.length===3)hex=hex.split('').map(x=>x+x).join('');const n=parseInt(hex,16)||0;return{r:(n>>16)&255,g:(n>>8)&255,b:n&255}}
  function rgb(c,a=1){const k=c+'|'+a;if(rgbCache.has(k))return rgbCache.get(k);const v=hexToRgb(c),s=`rgba(${v.r},${v.g},${v.b},${a})`;rgbCache.set(k,s);return s}
  function mix(a,b,t){const x=hexToRgb(a),y=hexToRgb(b),n=v=>Math.round(v).toString(16).padStart(2,'0');return '#'+n(x.r+(y.r-x.r)*t)+n(x.g+(y.g-x.g)*t)+n(x.b+(y.b-x.b)*t)}
  function themePalette(){const cs=getComputedStyle(root);return{main:(cs.getPropertyValue('--theme-accent')||'#00e676').trim(),highlight:(cs.getPropertyValue('--theme-highlight')||'#93ffd0').trim(),shadow:(cs.getPropertyValue('--theme-shadow')||'#006b3a').trim()}}
  function activePalette(){
    if(cfg.colorMode==='theme')return themePalette();
    if(cfg.colorMode==='random'){
      if(!randomPreset){const keys=Object.keys(PRESETS);randomPreset=keys[Math.floor(Math.random()*keys.length)]}
      return PRESETS[randomPreset];
    }
    if(cfg.colorMode==='preset')return PRESETS[cfg.preset]||PRESETS.glacier;
    return{main:cfg.main,highlight:cfg.highlight,shadow:cfg.shadow}
  }
  function qualityFactor(){if(cfg.quality==='high')return 1;if(cfg.quality==='balanced')return .58;if(cfg.quality==='eco')return .35;return (innerWidth>=1680&&devicePixelRatio<=1.25)?.78:.58}
  function densityField(p){const variation=.84;const a=.5+.5*Math.sin(p.x*3.8+p.y*2.1-p.z*3.2+Math.sin(p.y*4.4)*.8),b=.5+.5*Math.sin(p.x*7.1-p.z*5.3+p.y*1.7+1.4),ang=Math.atan2(p.z,p.x),c=.5+.5*Math.sin(ang*3.1+p.y*2.6+a*2.8),g=(dx,dy,dz,k)=>Math.exp(-k*((p.x-dx)**2+(p.y-dy)**2+(p.z-dz)**2)),voids=.86*g(.05,.70,.66,3.8)+.72*g(.64,-.02,.54,4.2)+.76*g(-.14,-.68,.60,4.3);return clamp((1-variation)*.62+variation*(Math.pow(a*.44+b*.22+c*.34,1.28)-voids*.44),0,1)}
  function spherePoint(r=1){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,s=Math.sqrt(1-u*u);return{x:s*Math.cos(a)*r,y:u*r,z:s*Math.sin(a)*r,seed:Math.random()}}
  function generate(){
    shell=[];clusters=[];rimPts=[];volume=[];rings=[];moon=[];const q=qualityFactor(),d=cfg.density;
    const surface=Math.floor(14000*q*d),clusterN=Math.floor(4800*q*d),rimN=Math.floor(4200*q*d),inside=Math.floor(1600*q*d);
    for(let i=0;i<surface;i++){const p=spherePoint(1+(Math.random()-.5)*.022);p.field=densityField(p);shell.push(p)}
    let tries=0;while(clusters.length<clusterN&&tries<clusterN*6){tries++;const p=spherePoint(.995+(Math.random()-.5)*.028),f=densityField(p);if(Math.random()<.12+.88*Math.pow(f,1.6)){p.field=f;clusters.push(p)}}
    for(let i=0;i<rimN;i++){const p=spherePoint(1.01+(Math.random()-.5)*.012);p.field=densityField(p);rimPts.push(p)}
    for(let i=0;i<inside;i++){const p=spherePoint(Math.pow(Math.random(),.42)*.96);p.field=densityField(p);volume.push(p)}
    if(cfg.orbit)for(let k=0;k<3;k++){const pts=[];for(let i=0;i<650*q;i++){if(Math.random()>.34)continue;const a=i/(650*q)*Math.PI*2+k*.7,rr=1.18+k*.13+(Math.random()-.5)*.02;let x=Math.cos(a)*rr,z=Math.sin(a)*rr,y=(k-1)*.075+Math.sin(a*2+k)*.014;const tilt=-.20+k*.14,yy=y*Math.cos(tilt)-z*Math.sin(tilt),zz=y*Math.sin(tilt)+z*Math.cos(tilt);pts.push({x,y:yy,z:zz,seed:Math.random(),field:.65})}rings.push(pts)}
    if(cfg.moon)for(let i=0;i<780*q;i++){const p=spherePoint(.17+(Math.random()-.5)*.008);p.x+=1.62;p.y+=.12;p.field=.75;moon.push(p)}
  }
  function resize(){W=innerWidth;H=innerHeight;DPR=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);updateGeometry()}
  function updateGeometry(){let ratio=1,posX=50,posY=49;if(state==='background'){ratio=cfg.bgSize;posX=cfg.bgX;posY=cfg.bgY}else if(state==='transition'){const p=clamp((performance.now()-transitionStart)/1450,0,1),e=1-Math.pow(1-p,3);ratio=cfg.introSize+(cfg.bgSize-cfg.introSize)*e;posX=50+(cfg.bgX-50)*e;posY=49+(cfg.bgY-49)*e}else ratio=cfg.introSize;CX=W*posX/100;CY=H*posY/100;R=Math.min(W,H)*.37*ratio}
  function rotate(p,ry,rx){let x=p.x*Math.cos(ry)+p.z*Math.sin(ry),z=-p.x*Math.sin(ry)+p.z*Math.cos(ry),y=p.y;let yy=y*Math.cos(rx)-z*Math.sin(rx),zz=y*Math.sin(rx)+z*Math.cos(rx);return{x,y:yy,z:zz,seed:p.seed}}
  function project(p){const depth=3.45-p.z*.48,persp=1/depth;return{x:CX+p.x*R*persp*3.28,y:CY+p.y*R*persp*3.28,z:p.z}}
  function dot(x,y,r,color,alpha){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x-r*.5,y-r*.5,r,r)}
  function drawLayer(points,ry,rx,kind,time,pal){
    const hi=pal.highlight,main=pal.main,shadow=pal.shadow,mid=mix(main,hi,.52),soft=mix(main,shadow,.40),white=mix(hi,'#ffffff',.22);
    for(const p0 of points){const p=rotate(p0,ry,rx),q=project(p),front=(p.z+1)*.5,rimLight=Math.pow(1-Math.abs(p.z),1.52),f=p0.field??densityField(p0),light=clamp(.26+.74*(-p.x*.62-p.y*.20+p.z*.25),0,1),tw=.86+.14*Math.sin(time*1.55+p.seed*21);let alpha,size,color;
      if(kind==='rim'){const local=.34+.66*clamp((-p.x*.68-p.y*.12)+.35,0,1);alpha=(.11+.72*rimLight+.15*front)*cfg.rim*local;size=(.66+1.55*rimLight)*cfg.point;color=local>.64?white:mid}
      else if(kind==='cluster'){alpha=(.15+.64*front+.26*rimLight)*(.38+1.35*Math.pow(f,1.65))*(.55+.60*light)*tw;size=(.75+1.28*front+.52*rimLight)*cfg.point;color=f>.72?white:(light>.58?mix(hi,main,.32):mid)}
      else if(kind==='shell'){alpha=(.052+.40*front+.22*rimLight)*(.12+1.62*Math.pow(f,1.72))*(.56+.62*light)*tw;size=(.52+.98*front+.48*rimLight)*cfg.point;color=f>.68?mix(hi,main,.22):(light>.56?mid:main)}
      else if(kind==='volume'){alpha=(.010+.085*front)*(.08+1.15*Math.pow(f,1.6));size=(.38+.72*front)*cfg.point;color=p.seed>.55?main:soft}
      else if(kind==='ring'){alpha=.10+.19*front;size=(.50+.88*front)*cfg.point;color=mix(main,hi,.20)}
      else{alpha=.08+.36*front+.15*rimLight;size=(.55+1.05*front)*cfg.point;color=rimLight>.5?hi:main}
      if(alpha>.008)dot(q.x,q.y,size,color,clamp(alpha,0,1))
    }
  }
  function currentSpeed(){if(state==='intro')return cfg.introSpeed;if(state==='transition'){const p=clamp((performance.now()-transitionStart)/1450,0,1),boost=1+Math.sin(p*Math.PI)*1.45;return (cfg.introSpeed+(cfg.bgSpeed-cfg.introSpeed)*p)*boost}return cfg.bgSpeed}
  function render(ms){requestAnimationFrame(render);if(document.hidden&&cfg.pauseHidden)return;if(paused||hiddenByUser||state==='hidden')return;const target=state==='background'?40:28;if(ms-lastFrame<target)return;lastFrame=ms;updateGeometry();if(state==='transition'){const tp=clamp((ms-transitionStart)/1450,0,1),te=1-Math.pow(1-tp,3),to=cfg.displayMode==='intro'?0:cfg.bgOpacity;system.style.opacity=String(1+(to-1)*tp);if(tp>=1)finishTransition();}autoYaw+=.0015*currentSpeed();ctx.clearRect(0,0,W,H);const pal=activePalette(),time=ms*.001,ry=yaw+autoYaw,rx=pitch;
    const g=ctx.createRadialGradient(CX,CY,R*.18,CX,CY,R*1.28);g.addColorStop(0,rgb(pal.shadow,.035));g.addColorStop(.72,rgb(pal.main,.11));g.addColorStop(1,rgb(pal.shadow,0));ctx.fillStyle=g;ctx.fillRect(CX-R*1.4,CY-R*1.4,R*2.8,R*2.8);
    ctx.globalCompositeOperation='lighter';drawLayer(volume,ry,rx,'volume',time,pal);drawLayer(shell,ry,rx,'shell',time,pal);drawLayer(clusters,ry,rx,'cluster',time,pal);drawLayer(rimPts,ry,rx,'rim',time,pal);if(cfg.orbit)for(const r of rings)drawLayer(r,ry*.32,rx*.55,'ring',time,pal);if(cfg.moon)drawLayer(moon,ry*.48,rx*.4,'moon',time,pal);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  function setSystemOpacity(){root.style.setProperty('--sphere-bg-opacity',String(cfg.bgOpacity));}
  function showStatus(text){const n=el('sphereQuickStatus');n.querySelector('span').textContent=text;n.classList.add('show');clearTimeout(showStatus.t);showStatus.t=setTimeout(()=>n.classList.remove('show'),1700)}
  function intro(){clearTimeout(autoTimer);clearTimeout(transitionTimer);hiddenByUser=false;state='intro';system.classList.remove('is-hidden','is-transitioning');system.classList.add('is-intro');body.classList.add('sphere-intro-active');system.style.opacity='1';if(cfg.autoEnter)autoTimer=setTimeout(enter,cfg.autoDelay*1000)}
  function enter(){if(state!=='intro')return;clearTimeout(autoTimer);clearTimeout(transitionTimer);state='transition';transitionStart=performance.now();body.classList.remove('sphere-intro-active');system.classList.remove('is-intro');system.classList.add('is-transitioning');system.style.opacity='1';transitionTimer=setTimeout(()=>{if(state==='transition')finishTransition()},1480)}
  function finishTransition(){if(state!=='transition')return;clearTimeout(transitionTimer);system.classList.remove('is-transitioning');if(cfg.displayMode==='intro'){state='hidden';system.classList.add('is-hidden')}else{state='background';system.classList.remove('is-hidden');system.style.opacity=String(cfg.bgOpacity);showStatus('粒子核心已进入后台')}}
  function background(){clearTimeout(autoTimer);clearTimeout(transitionTimer);hiddenByUser=false;state='background';system.classList.remove('is-intro','is-transitioning','is-hidden');body.classList.remove('sphere-intro-active');system.style.opacity=String(cfg.bgOpacity)}
  function off(){clearTimeout(autoTimer);clearTimeout(transitionTimer);state='hidden';system.classList.remove('is-intro','is-transitioning');system.classList.add('is-hidden');body.classList.remove('sphere-intro-active')}
  function applyMode(initial=false){setSystemOpacity();if(cfg.displayMode==='off')off();else if(cfg.displayMode==='background')background();else if(initial||cfg.displayMode==='intro'||cfg.displayMode==='introBackground')intro()}
  function updatePreview(){const p=activePalette(),v=el('spherePalettePreview');v.style.setProperty('--sphere-preview-main',p.main);v.style.setProperty('--sphere-preview-hi',p.highlight);v.style.setProperty('--sphere-preview-shadow',p.shadow);['Main','Highlight','Shadow'].forEach(k=>{const input=el('sphere'+k+'Color'),txt=el('sphere'+k+'ColorText');if(input&&cfg.colorMode!=='custom'){const key=k.toLowerCase();input.value=p[key];txt.textContent=p[key].toUpperCase()}})}
  function updateUI(){
    const map={sphereDisplayMode:'displayMode',sphereAutoEnter:'autoEnter',sphereAutoDelay:'autoDelay',sphereIntroSpeed:'introSpeed',sphereBgSpeed:'bgSpeed',sphereIntroSize:'introSize',sphereBgSize:'bgSize',sphereBgOpacity:'bgOpacity',sphereBgX:'bgX',sphereBgY:'bgY',sphereColorMode:'colorMode',spherePreset:'preset',sphereQuality:'quality',sphereDensity:'density',spherePoint:'point',sphereRim:'rim',sphereOrbit:'orbit',sphereMoon:'moon',spherePauseHidden:'pauseHidden'};
    for(const [id,key] of Object.entries(map)){const n=el(id);if(!n)continue;if(n.type==='checkbox')n.checked=!!cfg[key];else if(['introSize','bgSize','bgOpacity','density','point','rim'].includes(key))n.value=Math.round(cfg[key]*100);else n.value=cfg[key]}
    el('sphereAutoDelayOut').textContent=cfg.autoDelay.toFixed(1)+'s';el('sphereIntroSpeedOut').textContent=cfg.introSpeed.toFixed(2)+'×';el('sphereBgSpeedOut').textContent=cfg.bgSpeed.toFixed(2)+'×';el('sphereIntroSizeOut').textContent=Math.round(cfg.introSize*100)+'%';el('sphereBgSizeOut').textContent=Math.round(cfg.bgSize*100)+'%';el('sphereBgOpacityOut').textContent=Math.round(cfg.bgOpacity*100)+'%';el('sphereBgXOut').textContent=cfg.bgX+'%';el('sphereBgYOut').textContent=cfg.bgY+'%';el('sphereDensityOut').textContent=Math.round(cfg.density*100)+'%';el('spherePointOut').textContent=Math.round(cfg.point*100)+'%';el('sphereRimOut').textContent=Math.round(cfg.rim*100)+'%';
    el('sphereMainColor').value=cfg.main;el('sphereHighlightColor').value=cfg.highlight;el('sphereShadowColor').value=cfg.shadow;el('sphereMainColorText').textContent=cfg.main.toUpperCase();el('sphereHighlightColorText').textContent=cfg.highlight.toUpperCase();el('sphereShadowColorText').textContent=cfg.shadow.toUpperCase();el('spherePauseBtn').textContent=paused?'继续旋转':'暂停旋转';el('sphereHideBtn').textContent=hiddenByUser?'显示球体':'隐藏球体';updatePreview();setSystemOpacity();
  }
  function save(show=true){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(cfg))}catch(_){}if(show)showStatus('粒子球设置已保存')}
  function bind(){
    el('sphereSettingsBtn').onclick=()=>{el('spherePanel').classList.add('is-open');el('spherePanel').setAttribute('aria-hidden','false')};el('spherePanelClose').onclick=()=>{el('spherePanel').classList.remove('is-open');el('spherePanel').setAttribute('aria-hidden','true')};el('sphereEnterBtn').onclick=enter;system.addEventListener('dblclick',()=>state==='intro'&&enter());
    const simple=[['sphereDisplayMode','displayMode'],['sphereColorMode','colorMode'],['spherePreset','preset'],['sphereQuality','quality']];simple.forEach(([id,key])=>el(id).onchange=e=>{cfg[key]=e.target.value;if(key==='colorMode')randomPreset=null;if(key==='quality')generate();updateUI();if(key==='displayMode')applyMode(true);save(false)});
    const checks=[['sphereAutoEnter','autoEnter'],['sphereOrbit','orbit'],['sphereMoon','moon'],['spherePauseHidden','pauseHidden']];checks.forEach(([id,key])=>el(id).onchange=e=>{cfg[key]=e.target.checked;if(key==='orbit'||key==='moon')generate();if(key==='autoEnter'&&state==='intro')intro();save(false)});
    const ranges=[['sphereAutoDelay','autoDelay',1],['sphereIntroSpeed','introSpeed',1],['sphereBgSpeed','bgSpeed',1],['sphereIntroSize','introSize',.01],['sphereBgSize','bgSize',.01],['sphereBgOpacity','bgOpacity',.01],['sphereBgX','bgX',1],['sphereBgY','bgY',1],['sphereDensity','density',.01],['spherePoint','point',.01],['sphereRim','rim',.01]];
    ranges.forEach(([id,key,f])=>el(id).oninput=e=>{cfg[key]=+e.target.value*f;if(key==='density')generate();updateUI();save(false)});
    [['sphereMainColor','main'],['sphereHighlightColor','highlight'],['sphereShadowColor','shadow']].forEach(([id,key])=>el(id).oninput=e=>{cfg[key]=e.target.value;cfg.colorMode='custom';randomPreset=null;updateUI();save(false)});
    el('sphereRandomize').onclick=()=>{const keys=Object.keys(PRESETS);cfg.colorMode='random';randomPreset=keys[Math.floor(Math.random()*keys.length)];updateUI();save(false)};
    el('sphereApplyTheme').onclick=()=>{const p=themePalette();cfg.colorMode='custom';cfg.main=p.main;cfg.highlight=p.highlight;cfg.shadow=p.shadow;updateUI();save(false)};
    el('sphereRestorePalette').onclick=()=>{cfg.colorMode='preset';cfg.preset='glacier';cfg.main=DEFAULT.main;cfg.highlight=DEFAULT.highlight;cfg.shadow=DEFAULT.shadow;randomPreset=null;updateUI();save(false)};
    el('spherePauseBtn').onclick=()=>{paused=!paused;updateUI();showStatus(paused?'粒子核心已暂停':'粒子核心继续旋转')};el('sphereHideBtn').onclick=()=>{hiddenByUser=!hiddenByUser;system.style.visibility=hiddenByUser?'hidden':'visible';updateUI();showStatus(hiddenByUser?'粒子核心已隐藏':'粒子核心已显示')};el('sphereReplayBtn').onclick=()=>{cfg.displayMode=cfg.displayMode==='off'?'introBackground':cfg.displayMode;intro();updateUI()};
    el('sphereResetBtn').onclick=()=>{cfg=clone(DEFAULT);randomPreset=null;paused=false;hiddenByUser=false;generate();updateUI();applyMode(true);save(false)};el('sphereSaveBtn').onclick=()=>save(true);
    canvas.addEventListener('pointerdown',e=>{if(state!=='intro')return;drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-lastX)*.006;pitch=clamp(pitch+(e.clientY-lastY)*.005,-1.2,1.2);lastX=e.clientX;lastY=e.clientY});canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);canvas.addEventListener('click',e=>{if(state==='intro'&&e.target===canvas&&!drag)enter()});canvas.addEventListener('wheel',e=>{if(state!=='intro')return;e.preventDefault();zoom=clamp(zoom*Math.exp(-e.deltaY*.001),.65,1.55)},{passive:false});
    addEventListener('keydown',e=>{if(state!=='intro')return;if(e.key==='Enter'||e.key==='Escape')enter()});addEventListener('resize',resize,{passive:true});
    new MutationObserver(()=>{if(cfg.colorMode==='theme')updatePreview()}).observe(root,{attributes:true,attributeFilter:['style','data-theme']});
  }
  bind();resize();generate();updateUI();applyMode(true);requestAnimationFrame(render);
  window.__particleCore={getConfig:()=>clone(cfg),setConfig:patch=>{cfg={...cfg,...patch};generate();updateUI();save(false)},enter,intro,background,hide:off,state:()=>({state,paused,hiddenByUser,points:{shell:shell.length,clusters:clusters.length,rim:rimPts.length,volume:volume.length},palette:activePalette(),config:clone(cfg)})};
})();
