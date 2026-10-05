/* ========================================================================== 
   Adjustable-opacity transparent WebGL fluid statistic cards
   Four independent fragment-shader surfaces, shared animation scheduler,
   pointer disturbance, adaptive quality, CSS fallback and saved palettes.
   ========================================================================== */
(()=>{
  'use strict';

  const STORAGE_KEY='immersive-fluid-glass-v1';
  const LEGACY_STORAGE_KEYS=['immersive-fluid-glass-legacy-v13','immersive-fluid-glass-legacy-v12'];
  const CARD_NAMES={active:'Active Sessions',pending:'Pending Tasks',completed:'Completed',alerts:'Open Alerts'};
  const PRESETS={
    cyan:{a:'#00e7d2',b:'#3cc8ff',c:'#075f68'},
    original:{a:'#ff3aa7',b:'#ff8050',c:'#a443ff'},
    klein:{a:'#3158ff',b:'#ff6531',c:'#20252e'},
    chrome:{a:'#eef2f3',b:'#6c7780',c:'#11171d'}
  };
  const DEFAULTS={
    quality:'auto',interaction:true,
    cards:{
      active:{preset:'cyan',...PRESETS.cyan,speed:.92,intensity:1.02,pointer:.82,surface:.08,seed:1.7},
      pending:{preset:'cyan',...PRESETS.cyan,speed:.84,intensity:1.08,pointer:.80,surface:.08,seed:4.9},
      completed:{preset:'cyan',...PRESETS.cyan,speed:.76,intensity:.98,pointer:.72,surface:.08,seed:8.4},
      alerts:{preset:'cyan',...PRESETS.cyan,speed:.88,intensity:1.05,pointer:.86,surface:.08,seed:12.1}
    }
  };

  const clone=obj=>JSON.parse(JSON.stringify(obj));
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const hexOk=value=>/^#[0-9a-f]{6}$/i.test(value||'');
  const safeHex=(value,fallback)=>hexOk(value)?value.toLowerCase():fallback;
  function mergeSettings(raw){
    const next=clone(DEFAULTS);
    if(raw&&typeof raw==='object'){
      if(['auto','high','balanced','eco','fallback'].includes(raw.quality))next.quality=raw.quality;
      if(typeof raw.interaction==='boolean')next.interaction=raw.interaction;
      Object.keys(next.cards).forEach(id=>{
        const source=raw.cards&&raw.cards[id]; if(!source)return;
        next.cards[id]={
          ...next.cards[id],
          preset:typeof source.preset==='string'?source.preset:'custom',
          a:safeHex(source.a,next.cards[id].a),b:safeHex(source.b,next.cards[id].b),c:safeHex(source.c,next.cards[id].c),
          speed:clamp(Number(source.speed)||next.cards[id].speed,0,2),
          intensity:clamp(Number(source.intensity)||next.cards[id].intensity,.35,1.6),
          pointer:clamp(Number.isFinite(Number(source.pointer))?Number(source.pointer):next.cards[id].pointer,0,1.5),
          surface:clamp(Number.isFinite(Number(source.surface))?Number(source.surface):next.cards[id].surface,0,1),
          seed:Number.isFinite(Number(source.seed))?Number(source.seed):next.cards[id].seed
        };
      });
    }
    return next;
  }
  function loadSettings(){try{const current=localStorage.getItem(STORAGE_KEY);const legacy=LEGACY_STORAGE_KEYS.map(k=>localStorage.getItem(k)).find(Boolean);return mergeSettings(JSON.parse(current||legacy||'null'))}catch(_){return clone(DEFAULTS)}}
  let settings=loadSettings();

  function showFluidToast(message){
    const el=document.getElementById('toast'); if(!el)return;
    el.textContent=message; el.classList.add('show'); clearTimeout(showFluidToast.timer);
    showFluidToast.timer=setTimeout(()=>el.classList.remove('show'),1850);
  }
  function hexToRgb(hex){
    const value=parseInt(hex.slice(1),16);
    return [((value>>16)&255)/255,((value>>8)&255)/255,(value&255)/255];
  }
  function mixRgb(from,to,t){
    const a=hexToRgb(from),b=hexToRgb(to);
    return `rgb(${a.map((v,i)=>Math.round((v+(b[i]-v)*t)*255)).join(',')})`;
  }
  function surfaceLabel(value){
    const p=Math.round(value*100);
    if(p===0)return '0% · 完全透明';
    if(p<20)return `${p}% · 透明玻璃`;
    if(p<55)return `${p}% · 灰白玻璃`;
    if(p<100)return `${p}% · 亮白材质`;
    return '100% · 纯白';
  }
  function materialTokens(surface){
    const s=clamp(surface,0,1);
    // The text switches toward the dark palette before the glass becomes bright.
    // This preserves contrast throughout the transparent → gray-white → white range.
    const light=smoothstep(.25,.46,s);
    return {
      surface:s.toFixed(3),
      shade:(.48*Math.pow(1-s,1.45)).toFixed(3),
      shadeMid:(.3456*Math.pow(1-s,1.45)).toFixed(3),
      shadeSoft:(.1536*Math.pow(1-s,1.45)).toFixed(3),
      topGlow:(.035*(1-s)).toFixed(3),
      bottomShade:(.10*(1-s)).toFixed(3),
      text:mixRgb('#f3fffb','#16201d',light),
      title:mixRgb('#d8eee8','#2b3632',light),
      muted:mixRgb('#8fa9a2','#59635f',light),
      eyebrow:mixRgb('#82a69d','#66716c',light),
      change:mixRgb('#819b94','#59645f',light),
      edge:(.10+.22*s).toFixed(3),
      light
    };
  }
  function smoothstep(a,b,x){const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
  function qualityProfile(requested){
    const query=new URLSearchParams(location.search).get('fluid');
    if(query==='fallback')return {name:'fallback',fps:0,dpr:1};
    if(query==='eco')requested='eco';
    if(requested==='fallback')return {name:'fallback',fps:0,dpr:1};
    if(requested==='high')return {name:'high',fps:60,dpr:Math.min(devicePixelRatio||1,1.8)};
    if(requested==='balanced')return {name:'balanced',fps:45,dpr:Math.min(devicePixelRatio||1,1.35)};
    if(requested==='eco')return {name:'eco',fps:24,dpr:Math.min(devicePixelRatio||1,1)};
    const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData=navigator.connection&&navigator.connection.saveData;
    const lowCpu=(navigator.hardwareConcurrency||8)<=4;
    const lowMemory=(navigator.deviceMemory||8)<=4;
    if(reduced||saveData||lowCpu||lowMemory)return {name:'eco',fps:reduced?15:24,dpr:Math.min(devicePixelRatio||1,1)};
    return {name:'balanced',fps:45,dpr:Math.min(devicePixelRatio||1,1.35)};
  }

  const VERTEX_SHADER=`
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main(){
      v_uv=a_position*.5+.5;
      gl_Position=vec4(a_position,0.0,1.0);
    }
  `;
  const FRAGMENT_SHADER=`
    precision highp float;
    varying vec2 v_uv;
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform vec2 u_mouseVelocity;
    uniform float u_mouseMix;
    uniform float u_time;
    uniform float u_speed;
    uniform float u_intensity;
    uniform float u_pointer;
    uniform float u_seed;
    uniform float u_surfaceOpacity;
    uniform vec3 u_colorA;
    uniform vec3 u_colorB;
    uniform vec3 u_colorC;

    float hash(vec2 p){
      p=fract(p*vec2(123.34,456.21));
      p+=dot(p,p+45.32);
      return fract(p.x*p.y);
    }
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);
      f=f*f*(3.0-2.0*f);
      return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),f.x),mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),f.x),f.y);
    }
    float fbm(vec2 p){
      float value=0.0;
      float amp=.53;
      mat2 rot=mat2(.80,-.60,.60,.80);
      for(int i=0;i<5;i++){
        value+=amp*noise(p);
        p=rot*p*2.02+vec2(17.13,9.27);
        amp*=.49;
      }
      return value;
    }
    float softBlob(vec2 p,vec2 center,float radius,float softness){
      return 1.0-smoothstep(radius-softness,radius+softness,length(p-center));
    }
    void main(){
      vec2 uv=v_uv;
      float aspect=u_resolution.x/max(1.0,u_resolution.y);
      vec2 p=(uv-.5)*vec2(aspect,1.0);
      vec2 mouse=(u_mouse-.5)*vec2(aspect,1.0);
      vec2 delta=p-mouse;
      float dist=length(delta);
      float mouseField=exp(-dist*dist*7.2)*u_mouseMix*u_pointer;
      vec2 normal=delta/max(dist,.035);
      vec2 tangent=vec2(-normal.y,normal.x);
      p+=normal*mouseField*.115+tangent*mouseField*(u_mouseVelocity.x-u_mouseVelocity.y)*.045;

      float t=u_time*u_speed;
      vec2 seedVec=vec2(u_seed*1.713,u_seed*.937);
      float w1=fbm(p*1.22+seedVec+vec2(t*.075,-t*.052));
      float w2=fbm(p*1.54-seedVec*.37+vec2(-t*.057,t*.064)+w1*.82);
      vec2 q=p+(vec2(w1,w2)-.5)*(.58*u_intensity);
      float broad=fbm(q*1.12+vec2(t*.041,-t*.033));
      float detail=fbm(q*2.18+vec2(-t*.083,t*.057)+broad*.95);
      float ribbon=.5+.5*sin(q.x*3.15+q.y*.76+detail*5.0+t*.25+u_seed);
      float colorMix=smoothstep(.16,.88,broad*.61+ribbon*.39);
      vec3 fluid=mix(u_colorA,u_colorB,colorMix);
      float shadow=smoothstep(.43,.84,detail*.69+(.5+.5*sin(q.y*4.2-q.x*.8-t*.17))*.31);
      fluid=mix(fluid,u_colorC,shadow*.74);

      float plume1=softBlob(p,vec2(aspect*.23+.12*sin(t*.08+u_seed),.16*cos(t*.11+u_seed)),.52,.38);
      float plume2=softBlob(p,vec2(aspect*.39+.10*cos(t*.07-u_seed),-.24+.11*sin(t*.09)),.43,.34);
      float haze=clamp(plume1*.72+plume2*.58,0.0,1.0);
      float reveal=smoothstep(.055,.735,uv.x+(.5-broad)*.27+.070*sin(uv.y*4.0+t*.12));
      reveal*=mix(.70,1.0,haze);
      reveal=clamp(reveal*u_intensity,0.0,1.0);

      float spec=pow(clamp(1.0-abs(detail-.52)*2.0,0.0,1.0),5.0)*reveal;
      float caustic=pow(clamp(.52+.48*sin((q.x-q.y)*5.2+detail*7.0-t*.18),0.0,1.0),7.0)*reveal;
      vec3 cyanGlow=mix(fluid,vec3(.34,1.0,.90),spec*.18+caustic*.09);
      cyanGlow*=.78+.25*haze;
      cyanGlow=mix(cyanGlow,cyanGlow*.70,u_surfaceOpacity*.34);
      float filament=smoothstep(.48,.86,detail)*reveal;
      float density=clamp(reveal*(.36+.48*haze)+filament*.22+mouseField*.28,0.0,1.0);
      float alpha=clamp(.035*haze+density*(.24+.50*u_intensity)+spec*.08+u_surfaceOpacity*density*.14,0.0,.92);
      float edgeFade=smoothstep(1.08,.70,length((uv-.5)*vec2(1.0,.92)));
      alpha*=edgeFade;
      cyanGlow=pow(max(cyanGlow,0.0),vec3(.94));
      gl_FragColor=vec4(cyanGlow,alpha);
    }
  `;

  function compileShader(gl,type,source){
    const shader=gl.createShader(type); gl.shaderSource(shader,source); gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      const message=gl.getShaderInfoLog(shader)||'Shader compile failed'; gl.deleteShader(shader); throw new Error(message);
    }
    return shader;
  }
  function buildProgram(gl){
    const program=gl.createProgram();
    const vertex=compileShader(gl,gl.VERTEX_SHADER,VERTEX_SHADER);
    const fragment=compileShader(gl,gl.FRAGMENT_SHADER,FRAGMENT_SHADER);
    gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'Program link failed');
    gl.deleteShader(vertex);gl.deleteShader(fragment);return program;
  }

  class FluidCardRenderer{
    constructor(element,id,index,manager){
      this.element=element;this.id=id;this.index=index;this.manager=manager;
      this.canvas=element.querySelector('.fluid-canvas');
      this.config=settings.cards[id];
      this.gl=null;this.program=null;this.uniforms={};this.active=true;this.failed=false;this.lastFrame=0;
      this.mouse=[.76,.46];this.mouseTarget=[.76,.46];this.mouseVelocity=[0,0];this.mouseMix=0;this.pointerInside=false;
      this.bindPointer();
      this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(element);
      this.intersectionObserver=new IntersectionObserver(entries=>{this.active=entries[0]?.isIntersecting!==false},{rootMargin:'80px'});this.intersectionObserver.observe(element);
      this.applyCssPalette();
    }
    bindPointer(){
      let last=[0,0],lastT=0;
      const update=e=>{
        if(!settings.interaction)return;
        const rect=this.element.getBoundingClientRect();
        const x=clamp((e.clientX-rect.left)/Math.max(rect.width,1),0,1);
        const y=clamp(1-(e.clientY-rect.top)/Math.max(rect.height,1),0,1);
        const now=performance.now(),dt=Math.max(8,now-lastT||16);
        this.mouseTarget=[x,y];
        this.mouseVelocity=[clamp((x-last[0])/(dt/16.67),-.12,.12),clamp((y-last[1])/(dt/16.67),-.12,.12)];
        last=[x,y];lastT=now;this.mouseMix=1;
      };
      this.element.addEventListener('pointerenter',e=>{this.pointerInside=true;update(e)});
      this.element.addEventListener('pointermove',update);
      this.element.addEventListener('pointerleave',()=>{this.pointerInside=false;this.mouseTarget=[.76,.46]});
      this.element.addEventListener('pointerdown',e=>{this.mouseMix=1.2;update(e)});
    }
    init(){
      const profile=this.manager.profile;
      if(profile.name==='fallback')return this.fallback('CSS 兼容模式');
      try{
        const gl=this.canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,premultipliedAlpha:false,preserveDrawingBuffer:false,powerPreference:profile.name==='eco'?'low-power':'high-performance'});
        if(!gl)throw new Error('WebGL context unavailable');
        this.gl=gl;gl.clearColor(0,0,0,0);this.program=buildProgram(gl);gl.useProgram(this.program);
        const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
        const pos=gl.getAttribLocation(this.program,'a_position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
        ['u_resolution','u_mouse','u_mouseVelocity','u_mouseMix','u_time','u_speed','u_intensity','u_pointer','u_seed','u_surfaceOpacity','u_colorA','u_colorB','u_colorC'].forEach(name=>this.uniforms[name]=gl.getUniformLocation(this.program,name));
        this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.fallback('WebGL 上下文丢失')});
        this.canvas.addEventListener('webglcontextrestored',()=>{this.destroyGl();this.failed=false;this.init()});
        this.failed=false;this.element.classList.remove('is-fallback');this.resize();
        if(!this.element.querySelector('.fluid-render-badge')){const badge=document.createElement('i');badge.className='fluid-render-badge';badge.title='WebGL 实时渲染';this.element.appendChild(badge)}
        return true;
      }catch(error){console.warn(`[FluidCard:${this.id}]`,error);this.fallback(error.message);return false}
    }
    fallback(reason){this.failed=true;this.destroyGl();this.element.classList.add('is-fallback');this.fallbackReason=reason;return false}
    destroyGl(){
      if(this.gl&&this.program){try{this.gl.deleteProgram(this.program)}catch(_){}}
      this.gl=null;this.program=null;
    }
    setProfile(){
      const shouldFallback=this.manager.profile.name==='fallback';
      if(shouldFallback){this.fallback('CSS 兼容模式');return}
      if(!this.gl){this.failed=false;this.element.classList.remove('is-fallback');this.init()}else this.resize();
    }
    setConfig(config){this.config=config;this.applyCssPalette()}
    applyCssPalette(){
      const t=materialTokens(this.config.surface);
      this.element.style.setProperty('--fluid-a',this.config.a);this.element.style.setProperty('--fluid-b',this.config.b);this.element.style.setProperty('--fluid-c',this.config.c);
      this.element.style.setProperty('--surface-opacity',t.surface);this.element.style.setProperty('--content-shade',t.shade);this.element.style.setProperty('--content-shade-mid',t.shadeMid);this.element.style.setProperty('--content-shade-soft',t.shadeSoft);this.element.style.setProperty('--top-glow',t.topGlow);this.element.style.setProperty('--bottom-shade',t.bottomShade);
      this.element.style.setProperty('--stat-text',t.text);this.element.style.setProperty('--stat-title',t.title);this.element.style.setProperty('--stat-muted',t.muted);
      this.element.style.setProperty('--stat-eyebrow',t.eyebrow);this.element.style.setProperty('--stat-change',t.change);this.element.style.setProperty('--edge-highlight',t.edge);
      this.element.dataset.surfaceTone=t.light>.5?'light':'dark';
    }
    resize(){
      if(!this.gl)return;
      const rect=this.element.getBoundingClientRect();const dpr=this.manager.profile.dpr;
      const width=Math.max(2,Math.round(rect.width*dpr)),height=Math.max(2,Math.round(rect.height*dpr));
      if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;this.gl.viewport(0,0,width,height)}
    }
    render(now){
      if(!this.gl||!this.active||document.hidden)return false;
      const interval=1000/this.manager.profile.fps;if(now-this.lastFrame<interval)return false;this.lastFrame=now;
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.mouse[0]+=(this.mouseTarget[0]-this.mouse[0])*.105;this.mouse[1]+=(this.mouseTarget[1]-this.mouse[1])*.105;
      this.mouseVelocity[0]*=.90;this.mouseVelocity[1]*=.90;
      this.mouseMix+=((this.pointerInside&&settings.interaction?1:0)-this.mouseMix)*.075;
      if(!this.pointerInside)this.mouseMix*=.945;
      const gl=this.gl,c=this.config;gl.useProgram(this.program);
      gl.uniform2f(this.uniforms.u_resolution,this.canvas.width,this.canvas.height);
      gl.uniform2f(this.uniforms.u_mouse,this.mouse[0],this.mouse[1]);gl.uniform2f(this.uniforms.u_mouseVelocity,this.mouseVelocity[0],this.mouseVelocity[1]);
      gl.uniform1f(this.uniforms.u_mouseMix,settings.interaction?clamp(this.mouseMix,0,1.2):0);
      gl.uniform1f(this.uniforms.u_time,(now*.001)+(this.index*3.73));gl.uniform1f(this.uniforms.u_speed,reduced?Math.min(c.speed,.08):c.speed);
      gl.uniform1f(this.uniforms.u_intensity,c.intensity);gl.uniform1f(this.uniforms.u_pointer,c.pointer);gl.uniform1f(this.uniforms.u_seed,c.seed);gl.uniform1f(this.uniforms.u_surfaceOpacity,c.surface);
      gl.uniform3fv(this.uniforms.u_colorA,hexToRgb(c.a));gl.uniform3fv(this.uniforms.u_colorB,hexToRgb(c.b));gl.uniform3fv(this.uniforms.u_colorC,hexToRgb(c.c));
      gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);return true;
    }
    status(){return {id:this.id,mode:this.gl?'webgl':'fallback',reason:this.fallbackReason||'',canvas:[this.canvas.width,this.canvas.height],palette:{a:this.config.a,b:this.config.b,c:this.config.c},surface:this.config.surface}}
  }

  class FluidManager{
    constructor(){
      this.profile=qualityProfile(settings.quality);this.renderers=[];this.running=true;
      document.querySelectorAll('[data-fluid-card]').forEach((el,index)=>{const id=el.dataset.fluidCard;const renderer=new FluidCardRenderer(el,id,index,this);this.renderers.push(renderer);renderer.init()});
      this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.renderers.forEach(r=>r.resize())});
    }
    loop(now){if(this.running)this.renderers.forEach(r=>r.render(now));requestAnimationFrame(this.loop)}
    byId(id){return this.renderers.find(r=>r.id===id)}
    refresh(id){const r=this.byId(id);if(r)r.setConfig(settings.cards[id])}
    refreshAll(){this.renderers.forEach(r=>r.setConfig(settings.cards[r.id]));this.setQuality(settings.quality)}
    setQuality(value){settings.quality=value;this.profile=qualityProfile(value);this.renderers.forEach(r=>r.setProfile());updateDiagnostic()}
    status(){return {requestedQuality:settings.quality,resolvedQuality:this.profile.name,interaction:settings.interaction,cards:this.renderers.map(r=>r.status())}}
  }

  const manager=new FluidManager();
  let selectedId='active';
  const panel=document.getElementById('fluidPanel'),backdrop=document.getElementById('fluidPanelBackdrop');
  const cardSelect=document.getElementById('fluidCardSelect');
  const inputs={a:document.getElementById('fluidColorA'),b:document.getElementById('fluidColorB'),c:document.getElementById('fluidColorC'),speed:document.getElementById('fluidSpeed'),intensity:document.getElementById('fluidIntensity'),pointer:document.getElementById('fluidPointer'),surface:document.getElementById('fluidSurface')};
  const outputs={a:document.getElementById('fluidColorAText'),b:document.getElementById('fluidColorBText'),c:document.getElementById('fluidColorCText'),speed:document.getElementById('fluidSpeedValue'),intensity:document.getElementById('fluidIntensityValue'),pointer:document.getElementById('fluidPointerValue'),surface:document.getElementById('fluidSurfaceValue')};
  const preview=document.getElementById('fluidPreview'),previewName=document.getElementById('fluidPreviewName'),qualitySelect=document.getElementById('fluidQuality'),interaction=document.getElementById('fluidInteraction');

  function saveFluidSettings(notify=false){localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));if(notify)showFluidToast('WebGL 流体设置已保存')}
  function updateDiagnostic(){
    const el=document.getElementById('fluidDiagnostic');if(!el)return;
    const count=manager.renderers.filter(r=>!!r.gl).length;
    el.classList.toggle('ok',count===4);el.classList.toggle('warn',count<4);
    const mode=manager.profile.name==='fallback'?'CSS 兼容模式':`${manager.profile.name} · ${count}/4 WebGL`;
    el.querySelector('span').textContent=mode+(count<4&&manager.profile.name!=='fallback'?'（已自动降级）':'');
    document.documentElement.dataset.fluidMode=count===4?'webgl':'fallback';
  }
  function selectCard(id){
    if(!settings.cards[id])id='active';selectedId=id;cardSelect.value=id;
    document.querySelectorAll('[data-fluid-card]').forEach(el=>el.classList.toggle('is-selected',el.dataset.fluidCard===id));
    syncPanel();
  }
  function syncPanel(){
    const c=settings.cards[selectedId];
    inputs.a.value=c.a;inputs.b.value=c.b;inputs.c.value=c.c;inputs.speed.value=c.speed;inputs.intensity.value=c.intensity;inputs.pointer.value=c.pointer;inputs.surface.value=Math.round(c.surface*100);
    outputs.a.textContent=c.a.toUpperCase();outputs.b.textContent=c.b.toUpperCase();outputs.c.textContent=c.c.toUpperCase();
    outputs.speed.textContent=`${c.speed.toFixed(2)}×`;outputs.intensity.textContent=`${Math.round(c.intensity*100)}%`;outputs.pointer.textContent=`${Math.round(c.pointer*100)}%`;outputs.surface.textContent=surfaceLabel(c.surface);
    const mt=materialTokens(c.surface);preview.style.setProperty('--preview-a',c.a);preview.style.setProperty('--preview-b',c.b);preview.style.setProperty('--preview-c',c.c);preview.style.setProperty('--preview-surface',mt.surface);preview.style.setProperty('--preview-shade',mt.shade);preview.style.setProperty('--preview-shade-mid',mt.shadeMid);preview.style.setProperty('--preview-text',mt.text);preview.style.setProperty('--preview-muted',mt.muted);previewName.textContent=CARD_NAMES[selectedId];
    qualitySelect.value=settings.quality;interaction.checked=settings.interaction;
    document.querySelectorAll('[data-fluid-preset]').forEach(btn=>btn.classList.toggle('active',btn.dataset.fluidPreset===c.preset));
    updateDiagnostic();
  }
  function applyCurrentFromInputs(){
    const c=settings.cards[selectedId];c.a=inputs.a.value;c.b=inputs.b.value;c.c=inputs.c.value;c.speed=Number(inputs.speed.value);c.intensity=Number(inputs.intensity.value);c.pointer=Number(inputs.pointer.value);c.surface=clamp(Number(inputs.surface.value)/100,0,1);c.preset='custom';manager.refresh(selectedId);syncPanel();saveFluidSettings(false)
  }
  function openPanel(id=selectedId){
    selectCard(id);
    backdrop.hidden=true;
    backdrop.classList.remove('is-open');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden','false');
  }
  function closePanel(){panel.classList.remove('is-open');panel.setAttribute('aria-hidden','true');document.querySelectorAll('.fluid-stat').forEach(el=>el.classList.remove('is-selected'))}

  document.getElementById('fluidSettingsBtn')?.addEventListener('click',()=>openPanel(selectedId));
  document.getElementById('fluidPanelClose')?.addEventListener('click',closePanel);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.classList.contains('is-open'))closePanel()});
  cardSelect?.addEventListener('change',()=>selectCard(cardSelect.value));
  Object.values(inputs).forEach(input=>input?.addEventListener('input',applyCurrentFromInputs));
  document.querySelectorAll('[data-fluid-preset]').forEach(btn=>btn.addEventListener('click',()=>{
    const name=btn.dataset.fluidPreset,preset=PRESETS[name];Object.assign(settings.cards[selectedId],preset,{preset:name});manager.refresh(selectedId);syncPanel();saveFluidSettings(false)
  }));
  qualitySelect?.addEventListener('change',()=>{manager.setQuality(qualitySelect.value);saveFluidSettings(false)});
  interaction?.addEventListener('change',()=>{settings.interaction=interaction.checked;saveFluidSettings(false);showFluidToast(settings.interaction?'鼠标流体扰动已开启':'鼠标流体扰动已关闭')});
  document.getElementById('fluidResetCard')?.addEventListener('click',()=>{settings.cards[selectedId]=clone(DEFAULTS.cards[selectedId]);manager.refresh(selectedId);syncPanel();saveFluidSettings(false);showFluidToast(`${CARD_NAMES[selectedId]}已恢复默认材质`)});
  document.getElementById('fluidApplyAll')?.addEventListener('click',()=>{
    const source=settings.cards[selectedId];Object.keys(settings.cards).forEach(id=>Object.assign(settings.cards[id],{a:source.a,b:source.b,c:source.c,surface:source.surface,preset:'custom'}));manager.refreshAll();syncPanel();saveFluidSettings(false);showFluidToast('当前颜色与底色透明度已应用到四张卡片')
  });
  document.getElementById('fluidSaveSettings')?.addEventListener('click',()=>{saveFluidSettings(true);closePanel()});
  document.getElementById('saveBtn')?.addEventListener('click',()=>saveFluidSettings(false));

  syncPanel();updateDiagnostic();setTimeout(updateDiagnostic,300);
  document.documentElement.dataset.fluidReady='true';
  window.__fluidCards={
    version:'1.4.0',getStatus:()=>manager.status(),open:openPanel,close:closePanel,save:()=>saveFluidSettings(true),pause:()=>{manager.running=false},resume:()=>{manager.running=true},
    setQuality:value=>{if(['auto','high','balanced','eco','fallback'].includes(value)){manager.setQuality(value);qualitySelect.value=value;saveFluidSettings(false)}},
    setPalette:(id,preset)=>{if(settings.cards[id]&&PRESETS[preset]){Object.assign(settings.cards[id],PRESETS[preset],{preset});manager.refresh(id);if(id===selectedId)syncPanel()}},
    setColors:(id,a,b,c)=>{if(settings.cards[id]){settings.cards[id].a=safeHex(a,settings.cards[id].a);settings.cards[id].b=safeHex(b,settings.cards[id].b);settings.cards[id].c=safeHex(c,settings.cards[id].c);settings.cards[id].preset='custom';manager.refresh(id);if(id===selectedId)syncPanel()}},
    setSurface:(id,value)=>{if(settings.cards[id]){settings.cards[id].surface=clamp(Number(value),0,1);manager.refresh(id);if(id===selectedId)syncPanel()}},
    reset:()=>{settings=clone(DEFAULTS);manager.refreshAll();selectCard('active');saveFluidSettings(false)},
    settings:()=>clone(settings)
  };
})();
