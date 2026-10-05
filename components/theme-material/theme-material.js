/* Global dark theme and real frosted-material system */
(() => {
  const THEME_KEY='immersive-theme-material-v1';
  const LEGACY_KEYS=['immersive-theme-material-legacy-v22','immersive-theme-material-legacy-v20'];
  const PRESETS={
    green:{name:'深空绿',bg:'#000000',panel:'#101713',panel2:'#080d0b',accent:'#00e676',highlight:'#93ffd0',shadow:'#006b3a',fluid:['#00e676','#46ffb1','#075f38']},
    cyan:{name:'冰川青',bg:'#02090b',panel:'#0b1718',panel2:'#061012',accent:'#16e0d0',highlight:'#8ffff1',shadow:'#046b78',fluid:['#16e0d0','#58d9ff','#046b78']},
    blue:{name:'深海蓝',bg:'#020713',panel:'#0a1220',panel2:'#050a14',accent:'#3b82ff',highlight:'#8fc5ff',shadow:'#102a64',fluid:['#3b82ff','#75b5ff','#102a64']},
    purple:{name:'紫晶夜',bg:'#07040d',panel:'#15101d',panel2:'#0a0710',accent:'#9b6dff',highlight:'#d2bcff',shadow:'#44217b',fluid:['#9b6dff','#d2bcff','#44217b']},
    silver:{name:'黑曜银',bg:'#000000',panel:'#111315',panel2:'#08090a',accent:'#d8e0e4',highlight:'#ffffff',shadow:'#343a3d',fluid:['#d8e0e4','#ffffff','#343a3d']}
  };
  const DEFAULT={
    preset:'green',basePreset:'green',accent:PRESETS.green.accent,highlight:PRESETS.green.highlight,shadow:PRESETS.green.shadow,
    brightness:0,materialBrightness:0,panelOpacity:.68,surfaceHaze:12,backgroundBlur:10,edgeHighlight:14,hierarchyContrast:22,
    materialMode:'natural',materialEnabled:true,glow:1,fluidFollow:false,fluidBackup:null,fluidSurfaceBackup:null,
    scopes:{sidebar:true,main:true,right:true,inner:true,timeline:true,drawers:true,toolbar:false,fluid:false},
    offsets:{inner:-18,timeline:-8,drawers:8,toolbar:0}
  };
  const clone=o=>JSON.parse(JSON.stringify(o));
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const safeHex=(v,f)=>/^#[0-9a-f]{6}$/i.test(String(v||''))?String(v).toLowerCase():f;
  const hexRgb=h=>{const s=safeHex(h,'#000000').slice(1);return [parseInt(s.slice(0,2),16),parseInt(s.slice(2,4),16),parseInt(s.slice(4,6),16)]};
  const rgbString=h=>hexRgb(h).join(',');
  const adjustHex=(hex,amount)=>{const c=hexRgb(hex);return '#'+c.map(v=>clamp(Math.round(v+amount*2.55),0,255).toString(16).padStart(2,'0')).join('')};
  const pctText=n=>`${n>0?'+':''}${Math.round(n)}%`;

  function readStored(){
    const keys=[THEME_KEY,...LEGACY_KEYS];
    for(const key of keys){try{const v=localStorage.getItem(key);if(v)return {key,data:JSON.parse(v)}}catch(_){}}
    return {key:null,data:null};
  }
  function safeConfig(raw,sourceKey=null){
    const r=raw&&typeof raw==='object'?raw:{};
    const base=PRESETS[r.basePreset]?r.basePreset:(PRESETS[r.preset]?r.preset:'green');
    const oldBlur=Number.isFinite(Number(r.materialBlur))?Number(r.materialBlur):10;
    const migratedBlur=sourceKey===THEME_KEY?Number(r.backgroundBlur):Math.min(oldBlur,14);
    const scopesRaw=r.scopes&&typeof r.scopes==='object'?r.scopes:{};
    const offsetsRaw=r.offsets&&typeof r.offsets==='object'?r.offsets:{};
    return {
      preset:PRESETS[r.preset]?r.preset:(r.preset==='custom'?'custom':base),basePreset:base,
      accent:safeHex(r.accent,PRESETS[base].accent),highlight:safeHex(r.highlight,PRESETS[base].highlight),shadow:safeHex(r.shadow,PRESETS[base].shadow),
      brightness:clamp(Number.isFinite(Number(r.brightness))?Number(r.brightness):0,-12,18),
      materialBrightness:clamp(Number.isFinite(Number(r.materialBrightness))?Number(r.materialBrightness):0,-20,20),
      panelOpacity:clamp(Number.isFinite(Number(r.panelOpacity))?Number(r.panelOpacity):.68,.38,.96),
      surfaceHaze:clamp(Number.isFinite(Number(r.surfaceHaze))?Number(r.surfaceHaze):12,0,60),
      backgroundBlur:clamp(Number.isFinite(migratedBlur)?migratedBlur:10,0,24),
      edgeHighlight:clamp(Number.isFinite(Number(r.edgeHighlight))?Number(r.edgeHighlight):14,0,50),
      hierarchyContrast:clamp(Number.isFinite(Number(r.hierarchyContrast))?Number(r.hierarchyContrast):22,0,100),
      materialMode:r.materialMode==='uniform'?'uniform':'natural',materialEnabled:r.materialEnabled!==false,
      glow:clamp(Number(r.glow)||1,.25,1.35),fluidFollow:!!r.fluidFollow,
      fluidBackup:r.fluidBackup&&typeof r.fluidBackup==='object'?r.fluidBackup:null,
      fluidSurfaceBackup:r.fluidSurfaceBackup&&typeof r.fluidSurfaceBackup==='object'?r.fluidSurfaceBackup:null,
      scopes:{
        sidebar:scopesRaw.sidebar!==false,main:scopesRaw.main!==false,right:scopesRaw.right!==false,inner:scopesRaw.inner!==false,
        timeline:scopesRaw.timeline!==false,drawers:scopesRaw.drawers!==false,toolbar:!!scopesRaw.toolbar,
        fluid:typeof scopesRaw.fluid==='boolean'?scopesRaw.fluid:!!r.fluidSurfaceSync
      },
      offsets:{
        inner:clamp(Number.isFinite(Number(offsetsRaw.inner))?Number(offsetsRaw.inner):-18,-40,40),
        timeline:clamp(Number.isFinite(Number(offsetsRaw.timeline))?Number(offsetsRaw.timeline):-8,-40,40),
        drawers:clamp(Number.isFinite(Number(offsetsRaw.drawers))?Number(offsetsRaw.drawers):8,-40,40),
        toolbar:clamp(Number.isFinite(Number(offsetsRaw.toolbar))?Number(offsetsRaw.toolbar):0,-40,40)
      }
    };
  }

  const stored=readStored();
  let config=safeConfig(stored.data,stored.key);
  const root=document.documentElement;
  const panel=document.getElementById('themePanel');
  const trigger=document.getElementById('themeSettingsBtn');
  const ids=id=>document.getElementById(id);
  const els={
    accent:ids('themeAccent'),highlight:ids('themeHighlight'),shadow:ids('themeShadow'),
    accentText:ids('themeAccentText'),highlightText:ids('themeHighlightText'),shadowText:ids('themeShadowText'),
    brightness:ids('themeBrightness'),brightnessOut:ids('themeBrightnessOut'),glow:ids('themeGlow'),glowOut:ids('themeGlowOut'),
    enabled:ids('themeMaterialEnabled'),mode:ids('themeMaterialMode'),opacity:ids('themePanelOpacity'),opacityOut:ids('themePanelOpacityOut'),
    haze:ids('themeSurfaceHaze'),hazeOut:ids('themeSurfaceHazeOut'),blur:ids('themeBackgroundBlur'),blurOut:ids('themeBackgroundBlurOut'),
    materialBrightness:ids('themeMaterialBrightness'),materialBrightnessOut:ids('themeMaterialBrightnessOut'),
    edge:ids('themeEdgeHighlight'),edgeOut:ids('themeEdgeHighlightOut'),contrast:ids('themeHierarchyContrast'),contrastOut:ids('themeHierarchyContrastOut'),
    contrastRow:ids('themeHierarchyContrastRow'),materialHelp:ids('themeMaterialHelp'),follow:ids('themeFluidFollow'),previewName:ids('themePreviewName'),
    scopeSidebar:ids('scopeSidebar'),scopeMain:ids('scopeMain'),scopeRight:ids('scopeRight'),scopeInner:ids('scopeInner'),
    scopeTimeline:ids('scopeTimeline'),scopeDrawers:ids('scopeDrawers'),scopeToolbar:ids('scopeToolbar'),scopeFluid:ids('scopeFluid'),
    offsetInner:ids('offsetInner'),offsetInnerOut:ids('offsetInnerOut'),offsetTimeline:ids('offsetTimeline'),offsetTimelineOut:ids('offsetTimelineOut'),
    offsetDrawers:ids('offsetDrawers'),offsetDrawersOut:ids('offsetDrawersOut'),offsetToolbar:ids('offsetToolbar'),offsetToolbarOut:ids('offsetToolbarOut')
  };
  function basePreset(){return PRESETS[config.basePreset]||PRESETS.green}
  function save(notify=false){
    localStorage.setItem(THEME_KEY,JSON.stringify(config));
    if(notify){const toast=ids('toast');if(toast){toast.textContent='粒子 3D 卡片呼吸设置已保存';toast.classList.add('show');clearTimeout(save.t);save.t=setTimeout(()=>toast.classList.remove('show'),1700)}}
  }
  function currentFluidSettings(){try{return window.__fluidCards?.settings?.()||null}catch(_){return null}}
  function applyFluidTheme(){
    if(!config.fluidFollow||!window.__fluidCards)return;
    const [a,b,c]=basePreset().fluid;['active','pending','completed','alerts'].forEach(id=>window.__fluidCards.setColors(id,a,b,c));
  }
  function restoreFluidBackup(){
    const backup=config.fluidBackup;if(!backup?.cards||!window.__fluidCards)return;
    Object.entries(backup.cards).forEach(([id,c])=>window.__fluidCards.setColors(id,c.a,c.b,c.c));
  }
  function captureFluidSurface(){
    const s=currentFluidSettings();if(!s?.cards)return null;const b={};Object.entries(s.cards).forEach(([id,c])=>b[id]=Number(c.surface));return b;
  }
  function applyFluidSurface(){
    if(!config.scopes.fluid||!window.__fluidCards)return;
    const value=clamp(.015+config.panelOpacity*.13+(config.surfaceHaze/60)*.06,.02,.22);
    ['active','pending','completed','alerts'].forEach(id=>window.__fluidCards.setSurface(id,value));
  }
  function restoreFluidSurface(){
    if(!config.fluidSurfaceBackup||!window.__fluidCards)return;
    Object.entries(config.fluidSurfaceBackup).forEach(([id,v])=>{if(Number.isFinite(Number(v)))window.__fluidCards.setSurface(id,Number(v))});
  }

  function materialValues(){
    const opacity=config.panelOpacity;
    const contrast=config.hierarchyContrast/100;
    const fog=clamp((config.surfaceHaze/100)*.45,0,.27);
    const edge=clamp((config.edgeHighlight/100)*.70,0,.35);
    const factor=o=>clamp(1+o/100,.35,1.55);
    if(config.materialMode==='uniform'){
      return {
        mainA:opacity,mainA2:opacity,mainFog:fog,mainBlur:config.backgroundBlur,mainEdge:edge,
        innerA:.018,innerFog:fog*.15,innerBlur:config.backgroundBlur*.40,
        timelineA:.018,timelineFog:fog*.12,timelineBlur:config.backgroundBlur*.35,
        drawerA:clamp(opacity+.12,.68,.98),drawerFog:fog*.82*factor(config.offsets.drawers),drawerBlur:Math.max(12,config.backgroundBlur),
        toolbarA:clamp(.62+opacity*.18,.62,.84),toolbarFog:fog*.52*factor(config.offsets.toolbar),toolbarBlur:Math.max(6,config.backgroundBlur*.68)
      };
    }
    const innerFactor=factor(config.offsets.inner),timelineFactor=factor(config.offsets.timeline),drawerFactor=factor(config.offsets.drawers),toolbarFactor=factor(config.offsets.toolbar);
    return {
      mainA:opacity,mainA2:clamp(opacity+.035+contrast*.045,.40,.99),mainFog:fog,mainBlur:config.backgroundBlur,mainEdge:edge,
      innerA:clamp((.025+opacity*(.052+contrast*.09))*innerFactor,.018,.28),
      innerFog:clamp(fog*(.48+contrast*.32)*innerFactor,0,.22),innerBlur:clamp(config.backgroundBlur*(.50+contrast*.22)*innerFactor,0,24),
      timelineA:clamp(opacity*(.62+contrast*.10)*timelineFactor,.18,.88),
      timelineFog:clamp(fog*(.66+contrast*.18)*timelineFactor,0,.24),timelineBlur:clamp(config.backgroundBlur*.68*timelineFactor,0,24),
      drawerA:clamp((opacity+.13+contrast*.04)*drawerFactor,.64,.995),
      drawerFog:clamp(fog*(.92+contrast*.18)*drawerFactor,0,.26),drawerBlur:clamp(Math.max(12,config.backgroundBlur)*drawerFactor,8,28),
      toolbarA:clamp((.66+opacity*.15)*toolbarFactor,.50,.92),
      toolbarFog:clamp(fog*(.55+contrast*.12)*toolbarFactor,0,.22),toolbarBlur:clamp(Math.max(6,config.backgroundBlur*.70)*toolbarFactor,4,20)
    };
  }
  function setVar(name,value){root.style.setProperty(name,value)}
  function apply(){
    const p=basePreset(),mv=materialValues();
    const bg=adjustHex(p.bg,config.brightness),panelLift=config.brightness+config.materialBrightness;
    const panelColor=adjustHex(p.panel,panelLift),panel2=adjustHex(p.panel2,panelLift);
    root.dataset.theme=config.preset;root.dataset.materialMode=config.materialMode;root.dataset.materialEnabled=String(config.materialEnabled);
    Object.entries(config.scopes).forEach(([k,v])=>root.dataset['scope'+k[0].toUpperCase()+k.slice(1)]=String(v));
    setVar('--theme-bg',bg);setVar('--theme-bg-rgb',rgbString(bg));setVar('--theme-panel-rgb',rgbString(panelColor));setVar('--theme-panel2-rgb',rgbString(panel2));
    setVar('--theme-accent',config.accent);setVar('--theme-accent-rgb',rgbString(config.accent));setVar('--theme-highlight',config.highlight);setVar('--theme-highlight-rgb',rgbString(config.highlight));
    setVar('--theme-shadow',config.shadow);setVar('--theme-shadow-rgb',rgbString(config.shadow));
    /* fallback values stay stable outside selected scopes. */
    setVar('--theme-panel-opacity','.82');setVar('--theme-panel-opacity-2','.90');
    setVar('--theme-glow',config.glow.toFixed(2));setVar('--green',config.accent);setVar('--green-2',config.shadow);
    setVar('--mat-main-alpha',mv.mainA.toFixed(3));setVar('--mat-main-alpha-2',mv.mainA2.toFixed(3));setVar('--mat-main-fog',mv.mainFog.toFixed(4));setVar('--mat-main-blur',`${mv.mainBlur.toFixed(1)}px`);setVar('--mat-main-edge',mv.mainEdge.toFixed(4));
    setVar('--mat-inner-alpha',mv.innerA.toFixed(3));setVar('--mat-inner-fog',mv.innerFog.toFixed(4));setVar('--mat-inner-blur',`${mv.innerBlur.toFixed(1)}px`);
    setVar('--mat-timeline-alpha',mv.timelineA.toFixed(3));setVar('--mat-timeline-fog',mv.timelineFog.toFixed(4));setVar('--mat-timeline-blur',`${mv.timelineBlur.toFixed(1)}px`);
    setVar('--mat-drawer-alpha',mv.drawerA.toFixed(3));setVar('--mat-drawer-fog',mv.drawerFog.toFixed(4));setVar('--mat-drawer-blur',`${mv.drawerBlur.toFixed(1)}px`);
    setVar('--mat-toolbar-alpha',mv.toolbarA.toFixed(3));setVar('--mat-toolbar-fog',mv.toolbarFog.toFixed(4));setVar('--mat-toolbar-blur',`${mv.toolbarBlur.toFixed(1)}px`);
    applyFluidTheme();applyFluidSurface();sync();
  }
  function sync(){
    document.querySelectorAll('[data-theme-preset]').forEach(btn=>btn.classList.toggle('active',config.preset===btn.dataset.themePreset));
    els.accent.value=config.accent;els.highlight.value=config.highlight;els.shadow.value=config.shadow;
    els.accentText.textContent=config.accent.toUpperCase();els.highlightText.textContent=config.highlight.toUpperCase();els.shadowText.textContent=config.shadow.toUpperCase();
    els.brightness.value=config.brightness;els.brightnessOut.textContent=config.brightness>0?`+${config.brightness}`:String(config.brightness);
    els.glow.value=Math.round(config.glow*100);els.glowOut.textContent=`${Math.round(config.glow*100)}%`;
    els.enabled.checked=config.materialEnabled;els.mode.value=config.materialMode;
    els.opacity.value=Math.round(config.panelOpacity*100);els.opacityOut.textContent=`${Math.round(config.panelOpacity*100)}%`;
    els.haze.value=config.surfaceHaze;els.hazeOut.textContent=`${config.surfaceHaze}%`;
    els.blur.value=config.backgroundBlur;els.blurOut.textContent=`${config.backgroundBlur}px`;
    els.materialBrightness.value=config.materialBrightness;els.materialBrightnessOut.textContent=config.materialBrightness>0?`+${config.materialBrightness}`:String(config.materialBrightness);
    els.edge.value=config.edgeHighlight;els.edgeOut.textContent=`${config.edgeHighlight}%`;
    els.contrast.value=config.hierarchyContrast;els.contrastOut.textContent=`${config.hierarchyContrast}%`;
    els.contrast.disabled=config.materialMode==='uniform';els.contrastRow.classList.toggle('is-disabled',config.materialMode==='uniform');
    els.materialHelp.textContent=config.materialMode==='uniform'?'严格统一使用同一主材质平面，并自动压低内部背景和时间轴，避免多层磨砂重复叠加。':'表面雾化改变玻璃自身的灰白质感；背景模糊只模糊面板背后的内容，两者互不混用。';
    els.follow.checked=config.fluidFollow;els.previewName.textContent=config.preset==='custom'?'自定义深色':basePreset().name;
    Object.entries(config.scopes).forEach(([k,v])=>{const el=els['scope'+k[0].toUpperCase()+k.slice(1)];if(el)el.checked=v});
    Object.entries(config.offsets).forEach(([k,v])=>{const cap=k[0].toUpperCase()+k.slice(1),input=els['offset'+cap],out=els['offset'+cap+'Out'];if(input)input.value=v;if(out)out.textContent=pctText(v)});
  }
  function selectPreset(id){const p=PRESETS[id];if(!p)return;config.preset=id;config.basePreset=id;config.accent=p.accent;config.highlight=p.highlight;config.shadow=p.shadow;apply();save(false)}
  function open(){ids('folderSettingsPanel')?.classList.remove('is-open');ids('fluidPanel')?.classList.remove('is-open');panel?.classList.add('is-open');panel?.setAttribute('aria-hidden','false');sync()}
  function close(){panel?.classList.remove('is-open');panel?.setAttribute('aria-hidden','true')}
  trigger?.addEventListener('click',open);ids('themePanelClose')?.addEventListener('click',close);
  document.querySelectorAll('[data-theme-preset]').forEach(btn=>btn.addEventListener('click',()=>selectPreset(btn.dataset.themePreset)));
  ['accent','highlight','shadow'].forEach(key=>els[key]?.addEventListener('input',()=>{config[key]=els[key].value.toLowerCase();config.preset='custom';apply();save(false)}));
  els.brightness?.addEventListener('input',()=>{config.brightness=Number(els.brightness.value);apply();save(false)});
  els.glow?.addEventListener('input',()=>{config.glow=Number(els.glow.value)/100;apply();save(false)});
  els.enabled?.addEventListener('change',()=>{config.materialEnabled=els.enabled.checked;apply();save(false)});
  els.mode?.addEventListener('change',()=>{config.materialMode=els.mode.value==='uniform'?'uniform':'natural';apply();save(false)});
  els.opacity?.addEventListener('input',()=>{config.panelOpacity=Number(els.opacity.value)/100;apply();save(false)});
  els.haze?.addEventListener('input',()=>{config.surfaceHaze=Number(els.haze.value);apply();save(false)});
  els.blur?.addEventListener('input',()=>{config.backgroundBlur=Number(els.blur.value);apply();save(false)});
  els.materialBrightness?.addEventListener('input',()=>{config.materialBrightness=Number(els.materialBrightness.value);apply();save(false)});
  els.edge?.addEventListener('input',()=>{config.edgeHighlight=Number(els.edge.value);apply();save(false)});
  els.contrast?.addEventListener('input',()=>{config.hierarchyContrast=Number(els.contrast.value);apply();save(false)});
  const scopeMap={scopeSidebar:'sidebar',scopeMain:'main',scopeRight:'right',scopeInner:'inner',scopeTimeline:'timeline',scopeDrawers:'drawers',scopeToolbar:'toolbar',scopeFluid:'fluid'};
  Object.entries(scopeMap).forEach(([elKey,key])=>els[elKey]?.addEventListener('change',()=>{
    const next=els[elKey].checked;
    if(key==='fluid'&&next&&!config.scopes.fluid)config.fluidSurfaceBackup=captureFluidSurface()||config.fluidSurfaceBackup;
    if(key==='fluid'&&!next&&config.scopes.fluid)restoreFluidSurface();
    config.scopes[key]=next;apply();save(false);
  }));
  ['inner','timeline','drawers','toolbar'].forEach(key=>{
    const cap=key[0].toUpperCase()+key.slice(1);els['offset'+cap]?.addEventListener('input',()=>{config.offsets[key]=Number(els['offset'+cap].value);apply();save(false)});
  });
  els.follow?.addEventListener('change',()=>{
    if(els.follow.checked&&!config.fluidFollow){config.fluidBackup=currentFluidSettings()||config.fluidBackup;config.fluidFollow=true;applyFluidTheme()}
    else if(!els.follow.checked&&config.fluidFollow){config.fluidFollow=false;restoreFluidBackup();if(config.scopes.fluid)applyFluidSurface()}
    save(false);sync();
  });
  ids('themeReset')?.addEventListener('click',()=>{if(config.fluidFollow)restoreFluidBackup();if(config.scopes.fluid)restoreFluidSurface();config=clone(DEFAULT);apply();save(false)});
  ids('themeSave')?.addEventListener('click',()=>{save(true);close()});ids('saveBtn')?.addEventListener('click',()=>save(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel?.classList.contains('is-open'))close()});
  apply();setTimeout(()=>{applyFluidTheme();applyFluidSurface()},350);
  window.__dashboardTheme={
    version:'3.1.0',open,close,get:()=>clone(config),setPreset:selectPreset,
    setMaterial:(patch={})=>{config=safeConfig({...config,...patch},THEME_KEY);apply();save(false)},
    setScope:(name,value)=>{if(name in config.scopes){config.scopes[name]=!!value;apply();save(false)}},
    reset:()=>{config=clone(DEFAULT);apply();save(false)}
  };
})();
