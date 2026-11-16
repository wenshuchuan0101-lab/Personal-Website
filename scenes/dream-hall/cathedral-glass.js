import { batchStaticDetails } from './geometry-batches.js';
import { lightVolume } from './light-volumes.js';
// Painted rose windows and tall lancets share one project-owned texture atlas.
export function addStainedGlass({THREE,C,hall,foundation,architecture,glass,gold,registerStructure,length,requires,animatedUniforms,atlas}){
  const TAU=Math.PI*2,radius=C.hall.radius-.95,groups=[];
  const frameMaterial=glass.clone();
  const trace=glass.clone();
  const paintedCache=new Map();
  function paintedGlass(map){
    if(paintedCache.has(map))return paintedCache.get(map);
    const material=new THREE.MeshPhysicalMaterial({map,color:0xffffff,roughness:.28,metalness:.02,transparent:true,opacity:.34,transmission:C.materials.transmission,thickness:.08,ior:1.13,side:THREE.DoubleSide,forceSinglePass:true,depthWrite:false,emissiveMap:map,emissive:0xffffff,emissiveIntensity:3.2});
    material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#ifdef USE_EMISSIVEMAP
      vec3 glassColor=texture2D(emissiveMap,vEmissiveMapUv).rgb;
      float glassLuma=dot(glassColor,vec3(.2126,.7152,.0722));
      glassColor=max(vec3(0.),mix(vec3(glassLuma),glassColor,1.65));
      totalEmissiveRadiance*=glassColor;
      #endif`);};
    material.customProgramCacheKey=()=> 'vivid-transmitted-glass-v1';paintedCache.set(map,material);return material;
  }
  function tracery(points,r=.055){const mesh=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),points.length===2?1:Math.max(24,points.length*2),r,6,false),trace);mesh.name='connected-window-tracery';return mesh;}
  function lancet(w,h){const s=new THREE.Shape(),stem=h-1.55;s.moveTo(-w,0);s.lineTo(w,0);s.lineTo(w,stem);s.quadraticCurveTo(w,stem+1,0,h);s.quadraticCurveTo(-w,stem+1,-w,stem);s.closePath();return s;}
  function frame(w,h){const outer=lancet(w+.13,h+.20),hole=new THREE.Path(lancet(w,h).getPoints(32).map(p=>new THREE.Vector2(p.x,p.y+.08)));outer.holes.push(hole);return new THREE.ExtrudeGeometry(outer,{depth:.22,steps:1,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,curveSegments:20});}
  const roseMap=atlas.clone();roseMap.repeat.set(.5,1);roseMap.offset.set(0,0);roseMap.needsUpdate=true;
  const maps=Array.from({length:3},(_,i)=>{const t=atlas.clone();t.repeat.set(1/6,1);t.offset.set(.5+i/6,0);t.needsUpdate=true;return t;});
  const windowBays=C.hall.clerestoryBays;let windowClock=null;
  for(let i=0;i<windowBays;i++){
    // Monumental door bays contain architecture only, without suspended rose panes.
    if([4,8,12].includes(i))continue;
    const a=i/windowBays*TAU,group=new THREE.Group();group.name=`stained-glass-window-${i}`;group.position.set(Math.sin(a)*radius,10.7,-Math.cos(a)*radius);group.rotation.y=-a;architecture.add(group);
    const rose=new THREE.Mesh(new THREE.CircleGeometry(3.7,96),paintedGlass(roseMap));rose.position.set(0,11.5,.68);rose.name='painted-rose-glass';group.add(rose);
    for(const [r,t]of[[3.76,.13],[3.98,.07]]){const rim=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,96),frameMaterial);rim.position.set(0,11.5,.70);group.add(rim);}
    const goldenRim=new THREE.Mesh(new THREE.TorusGeometry(3.80,.020,5,96),gold);goldenRim.position.set(0,11.5,.86);group.add(goldenRim);
    const heart=new THREE.Mesh(new THREE.TorusGeometry(.48,.065,7,48),trace);heart.position.set(0,11.5,.91);group.add(heart);
    // Each petal is one continuous closed curve between the centre and outer rim.
    for(let k=0;k<16;k++){
      const a=k/16*TAU,points=[];
      for(let j=0;j<=48;j++){const t=j/48,radial=.48+3.28*Math.sin(t*Math.PI),angle=a+.145*Math.sin(t*TAU);points.push(new THREE.Vector3(Math.sin(angle)*radial,11.5+Math.cos(angle)*radial,.91));}
      group.add(tracery(points,.049));
    }

    const perimeter=[new THREE.Vector3(-4.15,-6.45,.76),new THREE.Vector3(-4.15,11.5,.76)];
    const left=new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.15,11.5,.76),new THREE.Vector3(-4.15,14.7,.76),new THREE.Vector3(0,16.3,.76)),right=new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,16.3,.76),new THREE.Vector3(4.15,14.7,.76),new THREE.Vector3(4.15,11.5,.76));perimeter.push(...left.getPoints(32).slice(1),...right.getPoints(32).slice(1),new THREE.Vector3(4.15,-6.45,.76));group.add(tracery(perimeter,.12));
    function paintedLancet(x,bottom,h,mapIndex){
      const geometry=new THREE.ShapeGeometry(lancet(.44,h),24),uv=geometry.getAttribute('uv');for(let k=0;k<uv.count;k++)uv.setXY(k,(uv.getX(k)+.44)/.88,uv.getY(k)/h);
      const pane=new THREE.Mesh(geometry,paintedGlass(maps[mapIndex%3]));pane.position.set(x,bottom,.65);pane.name=bottom<0?'painted-lower-lancet-glass':'painted-lancet-glass';group.add(pane);
      const surround=new THREE.Mesh(frame(.44,h),frameMaterial);surround.position.set(x,bottom-.08,.52);group.add(surround);
      group.add(tracery([new THREE.Vector3(x,bottom,.86),new THREE.Vector3(x,bottom+h-.40,.86)],.026));
      for(let k=1;k<=6;k++){const y=bottom+(h-1.55)*k/7;group.add(tracery([new THREE.Vector3(x-.44,y,.86),new THREE.Vector3(x+.44,y,.86)],.021));}
    }
    for(let j=0;j<8;j++){const x=j-3.5,h=11.5-Math.sqrt(3.76*3.76-x*x);paintedLancet(x,0,h,j);paintedLancet(x,-5.9,4.9,j+1);}
    for(let j=0;j<=8;j++){const x=j-4,top=Math.abs(x)<3.98?11.5-Math.sqrt(3.98*3.98-x*x):11.5,h=top+5.9;const mullion=new THREE.Mesh(new THREE.CylinderGeometry(.065,.085,h+.05,8),frameMaterial);mullion.position.set(x,-5.9+h/2,.69);group.add(mullion);}
    for(const [y,h]of[[-6.12,.20],[-.65,.23],[-.35,.12]]){const sill=new THREE.Mesh(new THREE.BoxGeometry(8.25,h,.56),frameMaterial);sill.position.set(0,y,.55);group.add(sill);const line=new THREE.Mesh(new THREE.BoxGeometry(8.2,.025,.025),gold);line.position.set(0,y+h/2+.02,.85);group.add(line);}
    batchStaticDetails(group);
    const state=registerStructure(group,{trigger:length-14,duration:3.5,requires,syncWith:windowClock,kind:'stained-window'});windowClock??=state;groups.push(state);
  }
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d'),image=atlas.image;ctx.filter='blur(6px)';ctx.drawImage(image,0,0,image.width/2,image.height,0,0,1024,1024);ctx.filter='none';const falloff=ctx.createRadialGradient(512,512,220,512,512,505);falloff.addColorStop(0,'#ffffffff');falloff.addColorStop(.65,'#ffffffb0');falloff.addColorStop(1,'#ffffff00');ctx.globalCompositeOperation='destination-in';ctx.fillStyle=falloff;ctx.fillRect(0,0,1024,1024);const projected=new THREE.CanvasTexture(canvas);projected.colorSpace=THREE.SRGBColorSpace;
  const receiving=new THREE.Mesh(new THREE.CircleGeometry(C.hall.doorRadius-.4,96),new THREE.MeshStandardMaterial({color:0x747881,roughness:.58,metalness:.10,transparent:true,opacity:.16,depthWrite:false}));receiving.rotation.x=-Math.PI/2;receiving.scale.x=C.hall.stretch;receiving.scale.y=C.hall.depthStretch||1;receiving.position.y=.028;receiving.receiveShadow=true;foundation.add(receiving);
  const lighting=new THREE.Group();lighting.name='stained-glass-lighting';lighting.userData.direction='front-to-entry';hall.add(lighting);const lights=[],pools=[];
  for(let i=0;i<3;i++){
    const source=new THREE.Vector3((i-1)*3.3,[21.0,23.0,21.0][i],(-radius+.8)*(C.hall.depthStretch||1)),target=new THREE.Vector3((i-1)*5.2,0,[9,12,9][i]);
    const light=new THREE.SpotLight(0xffffff,0,100,.32,.60,2);light.map=projected;light.position.copy(source);light.target.position.copy(target);light.name='front-window-light';lighting.add(light,light.target);lights.push(light);
    const pool=new THREE.Mesh(new THREE.PlaneGeometry(18,24),new THREE.MeshBasicMaterial({map:projected,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));pool.rotation.set(-Math.PI/2,0,(i-1)*.2);pool.position.copy(target);pool.position.y=.035+i*.002;foundation.add(pool);pools.push(pool);
    lighting.add(lightVolume({start:source,end:target,worldOffset:hall.position,radiusStart:1.4,radiusEnd:7,density:.0055,tint:i===1?0xffefd4:0xd1dcf3,name:'front-volumetric-beam-'+i,animatedUniforms}));
  }
  const sculptureKey=new THREE.SpotLight(0xffe7bd,0,85,.30,.65,2);sculptureKey.position.set(-3,27,(-radius+1)*(C.hall.depthStretch||1));sculptureKey.target.position.set(0,8,0);sculptureKey.name='frontal-sculpture-key';sculptureKey.castShadow=true;sculptureKey.shadow.mapSize.set(1024,1024);sculptureKey.shadow.camera.near=2;sculptureKey.shadow.camera.far=85;sculptureKey.shadow.normalBias=.035;sculptureKey.shadow.bias=-.0001;lighting.add(sculptureKey,sculptureKey.target);
  // Narrow shafts break up the broad transmitted-light fans, as in tall church windows.
  for(let i=0;i<9;i++){
    const source=new THREE.Vector3((i-4)*.62,22.5+(i%3)*.8,(-radius+1.1)*(C.hall.depthStretch||1)),target=new THREE.Vector3((i-4)*2.6,.3,12+(i%3)*2),direction=target.clone().sub(source),distance=direction.length();
    lighting.add(lightVolume({start:source,end:target,worldOffset:hall.position,radiusStart:.12,radiusEnd:.42,density:.06,tint:0xffefd4,name:'fine-frontal-light-shaft',animatedUniforms}));
  }
  registerStructure(lighting,{trigger:length-12,duration:3.8,requires:groups,kind:'stained-light',onProgress:q=>{const fade=THREE.MathUtils.smoothstep(q,.15,1);for(const light of lights)light.intensity=3800*fade;sculptureKey.intensity=2200*fade;for(const pool of pools)pool.material.opacity=.23*fade;}});
  return windowClock;
}
