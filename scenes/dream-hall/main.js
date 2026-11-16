import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { CONFIG as C } from './scene.config.js?v=gate-confirm40';
import { buildColosseum } from './colosseum.js';
import { loadSculptureAssets } from './sculpture-gallery.js';
import { paleInlay } from './baroque-materials.js';
import { buildWorkGate } from './work-gates.js';
import { loadWorkPosters } from './work-portal-effects.js';
import { installPortfolioBridge } from './portfolio-bridge.js';
import { installGateInteraction } from './gate-interaction.js';

const $=s=>document.querySelector(s),canvas=$('#world'),enter=$('#enter'),welcome=$('#welcome');
const mobile=matchMedia('(pointer:coarse)').matches,reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const embedded=new URLSearchParams(location.search).get('embedded')==='1'&&parent!==window;
let viewLanguage=new URLSearchParams(location.search).get('lang')==='en'?'en':'zh',hostSuspended=embedded,portfolioBridge,gateInteraction;
const ui={
  zh:{pause:'暂停漫游 <span>Ⅱ</span>',resume:'继续漫游 <span>▷</span>',first:'第一章 <i></i> 悬浮回廊',second:'第二章 <i></i> 八扇梦门',locked:'鼠标环视 · WASD / 方向键移动 · Esc 释放鼠标',drag:'拖动鼠标环视 · WASD / 方向键移动',pending:'这一章，尚未开启',open:'进入作品',enterHint:'走近门或按 E / Enter 确认进入',chapter:'翻开第一章'},
  en:{pause:'Pause <span>Ⅱ</span>',resume:'Resume <span>▷</span>',first:'Chapter I <i></i> The Floating Corridor',second:'Chapter II <i></i> Eight Dream Gates',locked:'Mouse to look · WASD / arrows to move · Esc to release',drag:'Drag to look · WASD / arrows to move',pending:'This chapter is yet to open',open:'Enter project',enterHint:'Walk closer · E / Enter to confirm',chapter:'Begin Chapter I'}
};
const words=()=>ui[viewLanguage],workTitle=work=>viewLanguage==='en'?(work.titleEn||work.title):work.title;
const length=C.corridor.steps*C.corridor.stepDepth,rise=C.corridor.steps*C.corridor.stepRise;
const hallDepth=C.hall.depthStretch||1,hallEntryRadius=(C.hall.radius-.65)*Math.cos(Math.PI/C.hall.arcadeBays)*hallDepth;
const hallZ=-length-C.hall.entryVestibule-hallEntryRadius,walkingRadius=C.hall.radius-2;
const clamp=THREE.MathUtils.clamp,TAU=Math.PI*2;
let seed=64173;
function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
const mix=(a,b,t)=>a+(b-a)*t;
let renderer,scene,camera,composer,mirror,bloom,ambientLight,keyLight,fillLight;
let playing=false,paused=false,contextLost=false,elapsed=0,last=performance.now(),activeDoor=null;
const keys=new Set(),velocity=new THREE.Vector2(),stick=new THREE.Vector2(),look={yaw:0,pitch:.14};
const player={x:0,z:2.6,y:C.player.eyeHeight,distance:0},doors=[],glowing=[],animatedUniforms=[];
const world=new THREE.Group(),hall=new THREE.Group(),hallFoundation=new THREE.Group();let hallArrived=false;
const treadBuilds=[],structureBuilds=[];let buildTime=0,furthestDistance=0,treadMesh,treadGlow;
const buildMatrix=new THREE.Matrix4();
function growTread(state,p){
  state.p=p;const q=p*p*(3-2*p),s=p<=0?0:.08+.92*q,offset=-.35*(1-q);
  buildMatrix.makeScale(s,s,s);buildMatrix.setPosition(0,state.y+offset,state.z);treadMesh.setMatrixAt(state.index,buildMatrix);
  state.outline.visible=p>0;state.outline.position.set(0,state.y+offset,state.z);state.outline.scale.setScalar(s);
  buildMatrix.makeScale(s,s,s);buildMatrix.setPosition(0,state.y+C.corridor.treadThickness/2+.003+offset,state.z+(C.corridor.stepDepth-C.corridor.stepGap)*s/2+.004);treadGlow.setMatrixAt(state.index,buildMatrix);
}
function registerStructure(group,{trigger=0,duration=C.construction.frameSeconds,initial=false,requires=[],delay=0,kind='frame',onProgress=null,syncWith=null}={}){
  group.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(group),plane=new THREE.Plane(new THREE.Vector3(0,-1,0),bounds.min.y-.03);
  const custom=[],copies=new Map();
  group.traverse(node=>{if(!node.material)return;if(node.material.isShaderMaterial){custom.push(node.material);return;}
    const copy=material=>{if(copies.has(material))return copies.get(material);const next=material.clone();next.onBeforeCompile=material.onBeforeCompile;next.customProgramCacheKey=material.customProgramCacheKey;next.clippingPlanes=[plane];copies.set(material,next);for(const glow of glowing)if(glow.material===material)glow.material=next;return next;};node.material=Array.isArray(node.material)?node.material.map(copy):copy(node.material);
  });
  const state={group,plane,custom,min:bounds.min.y-.03,max:bounds.max.y+.04,trigger,duration,requires,delay,kind,onProgress,syncWith,p:initial?1:0,start:initial?-duration:null};
  plane.constant=initial?state.max:state.min;group.visible=initial;onProgress?.(initial?1:0);structureBuilds.push(state);return state;
}
function applyMaterialBalance(){
  const boost=C.materials.structureOpacityBoost||0,changed=new Set(),preserved=new Map();
  const whiteVaultSurfaces=new Set(['closed-upper-cupola-shell','guarini-carved-cell-web','guarini-twelve-point-star','enclosed-lantern-roof','closed-pendentive-vault-web','glass-vault-panel']);
  // Snapshot surface materials before changing shared rib materials. Keep the
  // original clipping-plane references so gradual construction still works.
  world.traverse(node=>{
    if(!whiteVaultSurfaces.has(node.name)||!node.material)return;
    const keep=material=>{if(preserved.has(material))return preserved.get(material);const copy=material.clone();copy.clippingPlanes=material.clippingPlanes;copy.onBeforeCompile=material.onBeforeCompile;copy.customProgramCacheKey=material.customProgramCacheKey;preserved.set(material,copy);return copy;};
    node.material=Array.isArray(node.material)?node.material.map(keep):keep(node.material);
  });
  world.traverse(node=>{
    if(whiteVaultSurfaces.has(node.name))return;
    const isFresco=node.name==='translucent-ceiling-fresco'||node.name==='side-chapel-painted-dome';
    for(const material of(Array.isArray(node.material)?node.material:[node.material])){
      if(!material?.isMeshPhysicalMaterial||changed.has(material))continue;
      changed.add(material);
      if(isFresco){material.opacity=1;material.transparent=false;material.transmission=0;material.depthWrite=true;material.roughness=.93;material.color.set(0xf2ece0);material.emissiveIntensity=.14;continue;}
      if(node.name==='terpsichore-muse-scan'){material.opacity=C.materials.museOpacity;material.transmission=.10;node.renderOrder=3;continue;}
      if(material.name==='pale-gold-work-gate'){material.opacity=C.materials.workGateOpacity;continue;}
      if(material.name==='unified-translucent-sculpture'){material.opacity=C.materials.reliefOpacity;continue;}
      if(material.transparent)material.opacity=Math.min(.80,material.opacity+boost);
    }
  });
  hall.getObjectByName('cathedral-ribbed-vault').userData.frescoOpaque=true;
}

function updateConstruction(dt){
  if(!playing||paused)return;buildTime+=dt;furthestDistance=Math.max(furthestDistance,clamp(-player.z,0,length));
  const count=Math.min(C.corridor.steps,Math.ceil(furthestDistance/C.corridor.stepDepth)+C.construction.aheadSteps);let queued=0,changed=false;
  for(const state of treadBuilds){if(state.start==null&&state.index<count)state.start=buildTime+queued++*.09;if(state.start!=null&&state.p<1){growTread(state,clamp((buildTime-state.start)/C.construction.treadSeconds,0,1));changed=true;}}
  if(changed){treadMesh.instanceMatrix.needsUpdate=true;treadGlow.instanceMatrix.needsUpdate=true;}
  for(const state of structureBuilds){
    if(state.syncWith){state.start=state.syncWith.start;state.duration=state.syncWith.duration;}
    else if(state.start==null&&furthestDistance>=state.trigger&&state.requires.every(other=>other.p===1))state.start=buildTime+state.delay;
    if(state.start==null||state.p===1)continue;const p=clamp((buildTime-state.start)/state.duration,0,1),q=p*p*(3-2*p);state.p=p;state.group.visible=p>0;state.plane.constant=mix(state.min,state.max,q);for(const material of state.custom)material.uniforms.uBuild.value=clamp((q-.5)*2,0,1);state.onProgress?.(q);
  }
}
let clearPointerState=()=>{};
function movementInput(){return{
  x:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+(Math.abs(stick.x)>.07?stick.x:0),
  z:(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+(Math.abs(stick.y)>.07?stick.y:0),
};}
function stopIfReleased(){const input=movementInput();if(Math.hypot(input.x,input.z)<.001)velocity.set(0,0);}
function resetMovement(){keys.clear();stick.set(0,0);velocity.set(0,0);clearPointerState();const knob=$('#joystick-knob');if(knob)knob.style.transform='';}

function texture(canvas){const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return map;}
function makeCanvas(w,h){const image=document.createElement('canvas');image.width=w;image.height=h;return[image,image.getContext('2d')];}

function makeOuterSky(){
  const[image,ctx]=makeCanvas(4096,2048),g=ctx.createLinearGradient(0,0,0,2048);g.addColorStop(0,'#010208');g.addColorStop(.65,'#030611');g.addColorStop(1,'#050711');ctx.fillStyle=g;ctx.fillRect(0,0,4096,2048);
  for(let i=0;i<3500;i++){const x=rand()*4096,y=rand()*2048,r=.23+Math.pow(rand(),6)*1.25;ctx.globalAlpha=.17+rand()*.7;ctx.fillStyle=i%9===0?'#f1e0c6':i%5===0?'#b9cce6':'#e7ebed';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();}ctx.globalAlpha=1;
  return texture(image);
}
function box(w,h,d,material,x,y,z,parent=world){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
function stroke(points,material,radius=.025,parent=world){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(16,points.length*3),radius,5,false),material);parent.add(mesh);return mesh;}

function frameShape(half,stem,cap,thickness,pointed=false){
  const shape=new THREE.Shape();shape.moveTo(-half,-.13);shape.lineTo(-half,stem);
  if(pointed){shape.quadraticCurveTo(-half,stem+cap*.64,0,stem+cap);shape.quadraticCurveTo(half,stem+cap*.64,half,stem);}else shape.absellipse(0,stem,half,cap,Math.PI,0,true);
  const inner=half-thickness;
  // One continuous U-shaped boundary keeps the doorway truly open at the floor.
  // A hole extending below an outer polygon would be invalid for triangulation.
  shape.lineTo(half,-.13);shape.lineTo(inner,-.13);shape.lineTo(inner,stem);
  if(pointed){shape.quadraticCurveTo(inner,stem+(cap-thickness)*.64,0,stem+cap-thickness);shape.quadraticCurveTo(-inner,stem+(cap-thickness)*.64,-inner,stem);}else shape.absellipse(0,stem,inner,Math.max(.05,cap-thickness),0,Math.PI,false);
  shape.lineTo(-inner,-.13);shape.closePath();return shape;
}
function archFrame(half,stem,cap,thickness,depth,material,pointed=false){return new THREE.Mesh(new THREE.ExtrudeGeometry(frameShape(half,stem,cap,thickness,pointed),{depth,steps:1,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:2,curveSegments:24}),material);}
function archLine(half,stem,cap,pointed=false){
  const curve=new THREE.CurvePath();curve.add(new THREE.LineCurve3(new THREE.Vector3(-half,0,0),new THREE.Vector3(-half,stem,0)));
  if(pointed){curve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-half,stem,0),new THREE.Vector3(-half,stem+cap*.64,0),new THREE.Vector3(0,stem+cap,0)));curve.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,stem+cap,0),new THREE.Vector3(half,stem+cap*.64,0),new THREE.Vector3(half,stem,0)));}
  else{const points=Array.from({length:36},(_,i)=>{const a=Math.PI-i/35*Math.PI;return new THREE.Vector3(Math.cos(a)*half,stem+Math.sin(a)*cap,0);});curve.add(new THREE.CatmullRomCurve3(points));}
  curve.add(new THREE.LineCurve3(new THREE.Vector3(half,stem,0),new THREE.Vector3(half,0,0)));return curve;
}
function floorHeight(z){if(z>=0)return -Math.floor(z/C.corridor.stepDepth)*C.corridor.stepRise;if(z<=-length)return rise;return Math.min(rise,Math.ceil(-z/C.corridor.stepDepth)*C.corridor.stepRise);}
function slopeHeight(z){return clamp(-z/length,0,1)*rise;}
function cameraPathHeight(z){
  const distance=Math.min(-z,length),ease=clamp(C.player.cameraEaseDistance||2.34,.01,length*.25),rate=rise/length;
  const blend=s=>s*s*(2-s);
  if(distance>length-ease)return rise-rate*ease*blend((length-distance)/ease);
  return distance*rate;
}

function buildCorridor(stone,stoneDark,gold,light){
  const width=C.corridor.width,treadWidth=width-1.2;
  const treadMaterial=stone.clone();treadMaterial.opacity=C.materials.treadOpacity;treadMaterial.transmission=C.materials.transmission;treadMaterial.thickness=C.corridor.treadThickness;treadMaterial.roughness=.46;treadMaterial.emissive.set(0xece3c9);treadMaterial.emissiveIntensity=.08;
  const stairGeometry=new THREE.BoxGeometry(treadWidth,C.corridor.treadThickness,C.corridor.stepDepth-C.corridor.stepGap),steps=new THREE.InstancedMesh(stairGeometry,treadMaterial,C.corridor.steps),matrix=new THREE.Matrix4();
  steps.name='independent-floating-treads';
  for(let i=0;i<C.corridor.steps;i++){matrix.makeTranslation(0,(i+1)*C.corridor.stepRise-C.corridor.treadThickness/2,-(i+.5)*C.corridor.stepDepth);steps.setMatrixAt(i,matrix);}steps.instanceMatrix.needsUpdate=true;world.add(steps);
  const treadEdges=new THREE.EdgesGeometry(stairGeometry),edgeMaterial=new THREE.LineBasicMaterial({color:C.colors.trim,transparent:true,opacity:.46});
  for(let i=0;i<C.corridor.steps;i++){const outline=new THREE.LineSegments(treadEdges,edgeMaterial);outline.position.set(0,(i+1)*C.corridor.stepRise-C.corridor.treadThickness/2,-(i+.5)*C.corridor.stepDepth);world.add(outline);}
  const edgeGlow=new THREE.MeshBasicMaterial({color:new THREE.Color(C.colors.glow).multiplyScalar(2.5),toneMapped:false,transparent:true,opacity:.58});
  const litTreads=new THREE.InstancedMesh(new THREE.BoxGeometry(treadWidth-.08,.009,.009),edgeGlow,C.corridor.steps);
  for(let i=0;i<C.corridor.steps;i++){matrix.makeTranslation(0,(i+1)*C.corridor.stepRise+.003,-i*C.corridor.stepDepth-C.corridor.stepGap/2+.004);litTreads.setMatrixAt(i,matrix);}litTreads.instanceMatrix.needsUpdate=true;world.add(litTreads);
  treadMesh=steps;treadGlow=litTreads;steps.frustumCulled=false;litTreads.frustumCulled=false;
  const outlines=world.children.filter(node=>node.isLineSegments&&node.geometry===treadEdges);
  for(let i=0;i<C.corridor.steps;i++){const state={index:i,y:(i+1)*C.corridor.stepRise-C.corridor.treadThickness/2,z:-(i+.5)*C.corridor.stepDepth,outline:outlines[i],p:0,start:i<C.construction.initialSteps?-C.construction.treadSeconds:null};treadBuilds.push(state);growTread(state,i<C.construction.initialSteps?1:0);}steps.instanceMatrix.needsUpdate=true;litTreads.instanceMatrix.needsUpdate=true;
  const stations=[];for(let z=-.5;z>-length;z-=C.corridor.bayLength)stations.push(z);stations.push(-length);
  const supports=[],links=[];
  for(let bay=0;bay<stations.length;bay++){
    const z=stations[bay],base=slopeHeight(z),dz=bay<stations.length-1?z-stations[bay+1]:0,group=new THREE.Group();group.position.set(0,base,z);world.add(group);
    const span=new THREE.Group();span.position.copy(group.position);if(dz>0)world.add(span);
    const frame=archFrame(width/2+.14,4.5,3.1,.40,.46,stone,true);group.add(frame);
    const rib=new THREE.Mesh(new THREE.TubeGeometry(archLine(width/2-.30,4.5,2.71,true),96,.028,5,false),bay===0||bay===6?light:gold);rib.position.z=.49;group.add(rib);
    const fine=new THREE.LineSegments(new THREE.EdgesGeometry(frame.geometry,36),new THREE.LineBasicMaterial({color:C.colors.trim,transparent:true,opacity:.40}));group.add(fine);
    for(const side of[-1,1]){
      box(.95,.22,1.0,stone,side*(width/2),.11,.1,group);box(.74,.22,.85,stone,side*(width/2),4.35,.1,group);box(.51,4.05,.56,stone,side*(width/2),2.22,.1,group);
      if(dz>0){
        const center=z-dz/2,centerBase=slopeHeight(center),half=dz/2;
        const windowGroup=new THREE.Group();windowGroup.position.set(side*(width/2-.08),centerBase-base,-dz/2);windowGroup.rotation.y=side*Math.PI/2;span.add(windowGroup);
        const windowFrame=archFrame(half,2.25,2.25,.20,.19,stone);
        const line=new THREE.Mesh(new THREE.TubeGeometry(archLine(half-.20,2.25,2.05),90,.014,4,false),gold);line.position.z=.22;
        for(const mesh of[windowFrame,line]){const position=mesh.geometry.getAttribute('position');for(let i=0;i<position.count;i++)position.setY(i,position.getY(i)+slopeHeight(center-side*position.getX(i))-centerBase);position.needsUpdate=true;mesh.geometry.computeVertexNormals();mesh.geometry.computeBoundingBox();mesh.geometry.computeBoundingSphere();windowGroup.add(mesh);}
        const seam=new THREE.LineSegments(new THREE.EdgesGeometry(windowFrame.geometry,36),new THREE.LineBasicMaterial({color:0xaec3d5,transparent:true,opacity:.35}));windowGroup.add(seam);
      }
    }
    if(bay%2===0){const lamp=new THREE.PointLight(0xffe1aa,11,15,2);lamp.position.set(0,3.0,.7);group.add(lamp);}
    supports.push(registerStructure(group,{trigger:Math.max(0,-z-C.construction.frameAhead),initial:bay<2}));
    if(dz>0){
      const vertices=[],uvs=[],indices=[],segments=24;
      for(let j=0;j<2;j++)for(let i=0;i<=segments;i++){const a=i/segments*Math.PI;vertices.push(Math.cos(a)*(width/2+.08),4.5+Math.sin(a)*3.1+(j?dz/length*rise:0),-j*dz);uvs.push(i/segments,j);}
      for(let i=0;i<segments;i++){const k=segments+1;indices.push(i,i+1,i+k,i+1,i+k+1,i+k);}
      const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();const vault=new THREE.Mesh(geometry,stone);span.add(vault);links.push({span,bay});
    }
  }
  for(const{span,bay}of links)registerStructure(span,{initial:bay===0,syncWith:supports[bay+1],kind:'link'});
  // A handful of suspended fragments give the arcade an exterior star-lit depth.
  for(let i=0;i<56;i++){
    const z=-rand()*length,side=i%2?1:-1,size=.4+rand()*1.6;
    const fragment=box(size,size*(1+rand()*2),size,stoneDark,side*(10+rand()*22),slopeHeight(z)-1+rand()*19,z-8+rand()*16);fragment.rotation.set(rand()*.5,rand()*Math.PI,rand()*.3);
  }
}

function buildInfiniteDescent(stone,gold){
  const scenery=new THREE.Group();scenery.name='unwalkable-infinite-descent';world.add(scenery);
  const width=C.corridor.width-1.2,count=C.descent.steps,start=C.descent.startZ,depth=C.corridor.stepDepth-C.corridor.stepGap;
  const material=stone.clone();material.opacity=C.materials.treadOpacity;material.thickness=C.corridor.treadThickness;material.roughness=.28;material.emissive.set(0xece3c9);material.emissiveIntensity=.08;
  const geometry=new THREE.BoxGeometry(width,C.corridor.treadThickness,depth),steps=new THREE.InstancedMesh(geometry,material,count),matrix=new THREE.Matrix4();
  const edgeMaterial=new THREE.LineBasicMaterial({color:0xa9becf,transparent:true,opacity:.40}),edges=new THREE.EdgesGeometry(geometry).getAttribute('position'),lines=[];
  const glowMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(C.colors.glow).multiplyScalar(2.2),toneMapped:false,transparent:true,opacity:.48});
  const glows=new THREE.InstancedMesh(new THREE.BoxGeometry(width-.08,.009,.009),glowMaterial,count);
  for(let i=0;i<count;i++){
    const y=-i*C.corridor.stepRise-C.corridor.treadThickness/2,z=start+(i+.5)*C.corridor.stepDepth;
    matrix.makeTranslation(0,y,z);steps.setMatrixAt(i,matrix);
    matrix.makeTranslation(0,y+C.corridor.treadThickness/2+.003,z-depth/2-.004);glows.setMatrixAt(i,matrix);
    for(let v=0;v<edges.count;v++)lines.push(edges.getX(v),edges.getY(v)+y,edges.getZ(v)+z);
  }
  const lineGeometry=new THREE.BufferGeometry();lineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));scenery.add(steps,glows,new THREE.LineSegments(lineGeometry,edgeMaterial));
  const frameGeometry=new THREE.ExtrudeGeometry(frameShape(C.corridor.width/2+.14,4.5,3.1,.40,true),{depth:.46,steps:1,bevelEnabled:false,curveSegments:8});
  const frames=new THREE.InstancedMesh(frameGeometry,stone,C.descent.frames),ribGeometry=new THREE.TubeGeometry(archLine(C.corridor.width/2-.30,4.5,2.71,true),64,.022,4,false),ribs=new THREE.InstancedMesh(ribGeometry,gold,C.descent.frames);
  const frameEdges=new THREE.EdgesGeometry(frameGeometry,36).getAttribute('position'),frameLines=[];
  for(let i=0;i<C.descent.frames;i++){
    const z=-.5+(i+1)*C.corridor.bayLength,y=-Math.max(0,z-start)*C.corridor.stepRise/C.corridor.stepDepth;
    matrix.makeTranslation(0,y,z);frames.setMatrixAt(i,matrix);matrix.makeTranslation(0,y,z-.05);ribs.setMatrixAt(i,matrix);
    for(let v=0;v<frameEdges.count;v++)frameLines.push(frameEdges.getX(v),frameEdges.getY(v)+y,frameEdges.getZ(v)+z);
  }
  const outlineGeometry=new THREE.BufferGeometry();outlineGeometry.setAttribute('position',new THREE.Float32BufferAttribute(frameLines,3));scenery.add(frames,ribs,new THREE.LineSegments(outlineGeometry,edgeMaterial));
  // Both layers continue far past visibility and converge below pixel size.
  // The sky must not write depth, otherwise its sphere slices off this staircase.
}

function doorLabel(work){
  const[image,ctx]=makeCanvas(1044,180);ctx.textAlign='center';ctx.fillStyle='#f3d79c';ctx.font='24px NightSerif, Georgia, serif';ctx.fillText(work.roman,522,42);ctx.fillStyle='#f3d79c';ctx.font='300 56px "Microsoft YaHei Light", "Microsoft YaHei", sans-serif';ctx.fillText(workTitle(work),522,125);return texture(image);
}
function mirrorFloorGeometry(){
  // A single coplanar reflector covers all three halls with one reflection pass.
  const r=C.hall.radius,cx=r*C.hall.stretch+15,regions=[[0,r-.15,C.hall.stretch,hallDepth],[-cx,16.85,1,1.24],[cx,16.85,1,1.24]],positions=[],normals=[],uvs=[];
  for(const [x,radius,sx,sy]of regions){const g=new THREE.CircleGeometry(radius,96).scale(sx,sy,1).translate(x,0,0).toNonIndexed(),p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=g.getAttribute('uv');for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));uvs.push(uv.getX(i),uv.getY(i));}g.dispose();}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeBoundingSphere();return geometry;
}

function buildHall(stone,gold,light,sculptures,posters){
  hall.position.set(0,rise,hallZ);world.add(hall);const r=C.hall.radius;
  hallFoundation.name='hall-foundation';hallFoundation.visible=false;hall.add(hallFoundation);
  // The palace surrounds the existing platform; navigation and portals are retained.
  const rim=new THREE.Mesh(new THREE.TorusGeometry(r-.22,.012,5,128),new THREE.MeshBasicMaterial({color:C.colors.trim,transparent:true,opacity:.16}));rim.rotation.x=Math.PI/2;rim.scale.x=C.hall.stretch;rim.scale.y=hallDepth;rim.position.y=.045;hallFoundation.add(rim);
  if(!mobile){mirror=new Reflector(mirrorFloorGeometry(),{clipBias:.004,textureWidth:512,textureHeight:512,color:0x182235});mirror.name='hall-reflector';mirror.userData.floorRegions=3;mirror.rotation.x=-Math.PI/2;mirror.position.set(0,.012,0);hallFoundation.add(mirror);}
  const floorMat=new THREE.MeshBasicMaterial({color:0x020611,transparent:true,opacity:.22});
  const floor=new THREE.Mesh(new THREE.CircleGeometry(r,96),floorMat);floor.rotation.x=-Math.PI/2;floor.scale.x=C.hall.stretch;floor.scale.y=hallDepth;floor.position.y=.023;floor.name='main-mirrored-floor-tint';hallFoundation.add(floor);
  buildColosseum({THREE,C,hall,foundation:hallFoundation,stone,gold,length,registerStructure,frameShape,animatedUniforms,sculptures,floorMaterial:floorMat});
  C.works.forEach((work,index)=>{
    const angle=THREE.MathUtils.degToRad(work.angle),gate=buildWorkGate({work,index,map:posters[work.id],animatedUniforms,mobile,sculptures,labelTexture:doorLabel(work)}),{group,label,curtain,uniforms}=gate;
    group.position.set(Math.sin(angle)*C.hall.doorRadius*C.hall.stretch,0,-Math.cos(angle)*C.hall.doorRadius*hallDepth);group.rotation.y=-Math.atan2(Math.sin(angle)/C.hall.stretch,Math.cos(angle)/hallDepth);group.scale.setScalar(C.hall.gateScale);hall.add(group);group.name=`door-${work.id}`;
    doors.push({work,group,label,curtain,uniforms,position:new THREE.Vector3(group.position.x,rise,group.position.z+hallZ)});
    registerStructure(group,{trigger:length-10,duration:2,delay:index*.16,kind:'portal'});
  });
}

function addDust(){
  const count=mobile?65:100,positions=[],phases=[],sizes=[];
  for(let i=0;i<count;i++){
    if(i<count*.57){const z=rand()*-length;positions.push((rand()-.5)*C.corridor.width*.8,slopeHeight(z)+.6+rand()*5.5,z);}
    else{const a=rand()*TAU,r=Math.sqrt(rand())*(C.hall.doorRadius-1);positions.push(Math.sin(a)*r*C.hall.stretch,rise+.7+rand()*(C.hall.height*.75),hallZ+Math.cos(a)*r);}
    phases.push(rand()*TAU);sizes.push(.6+rand()*.85);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));geometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  const uniforms={uTime:{value:0},uPixel:{value:renderer.getPixelRatio()}};animatedUniforms.push(uniforms);
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`attribute float aPhase;attribute float aSize;uniform float uTime;uniform float uPixel;varying float vAlpha;void main(){vec3 p=position;p.x+=sin(uTime*.18+aPhase)*.19;p.y+=sin(uTime*.22+aPhase*2.)*.13;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uPixel*100./max(1.,-mv.z),1.,15.);vAlpha=.3+.4*pow(sin(uTime*.7+aPhase)*.5+.5,2.);}`,fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;float glow=pow(max(0.,1.-d),3.);gl_FragColor=vec4(vec3(1.,.83,.51)*1.8,glow*vAlpha);}`});scene.add(new THREE.Points(geometry,material));
}

function isWalkable(x,z){
  const localX=x/C.hall.stretch,localZ=(z-hallZ)/hallDepth;
  const corridor=Math.abs(x)<=(C.corridor.width-1.2)/2-C.player.radius-.05&&z>=hallZ+walkingRadius*hallDepth-1.2&&z<=3.9;
  const room=localX*localX+localZ*localZ<=walkingRadius*walkingRadius;
  const chapelX=C.hall.radius*C.hall.stretch+15,chapel=(Math.abs(x)-chapelX)**2+((z-hallZ)/1.24)**2<=16.2**2;
  const crossing=Math.abs(x)>=C.hall.radius*C.hall.stretch-10&&Math.abs(x)<=chapelX&&Math.abs(z-hallZ)<=8.2;
  if(!(corridor||room||chapel||crossing))return false;
  // Grounded paired jambs and sculpture plinths have matching collision feet.
  for(const door of doors){const dx=x-door.position.x,dz=z-door.position.z,a=door.group.rotation.y,scale=C.hall.gateScale,lx=(Math.cos(a)*dx-Math.sin(a)*dz)/scale,lz=(Math.sin(a)*dx+Math.cos(a)*dz)/scale;if(Math.abs(lx)>2.28&&Math.abs(lx)<4.7&&lz> -1.15&&lz<1.85)return false;}
  if((hall.userData.supportObstacles||[]).some(p=>Math.hypot(x-p.x,z-hallZ-p.z)<p.r+C.player.radius))return false;
  if(Math.hypot(x,z-hallZ)<C.hall.museClearance)return false;
  if(room){const sector=TAU/C.hall.clerestoryBays,index=THREE.MathUtils.euclideanModulo(Math.round((Math.atan2(localX,-localZ)+Math.PI)/sector),C.hall.clerestoryBays),a=-Math.PI+index*sector;if(![0,4,12].includes(index)&&localX*Math.sin(a)-localZ*Math.cos(a)>(C.hall.radius-.65)*Math.cos(sector/2)-1.38)return false;for(let i=0;i<C.hall.clerestoryBays;i++){const a=-Math.PI+(i-.5)*Math.PI*2/C.hall.clerestoryBays;if(Math.hypot(localX-Math.sin(a)*(C.hall.radius-.65),localZ+Math.cos(a)*(C.hall.radius-.65))<3.10)return false;}if(Math.hypot(localX,localZ+C.hall.radius-2.2)<5.9)return false;}
  if(chapel&&Math.hypot(Math.abs(x)-chapelX-10.8,z-hallZ)<4.2)return false;
  return true;
}

function stepPhysics(xInput,zInput,dt){
  const input=new THREE.Vector2(xInput,zInput);if(input.lengthSq()>1)input.normalize();
  const forwardX=-Math.sin(look.yaw),forwardZ=-Math.cos(look.yaw),rightX=Math.cos(look.yaw),rightZ=-Math.sin(look.yaw);
  const tx=(forwardX*input.y+rightX*input.x)*C.player.walkSpeed,tz=(forwardZ*input.y+rightZ*input.x)*C.player.walkSpeed;
  const targetSpeed=Math.hypot(tx,tz);
  if(targetSpeed<.001)velocity.set(0,0);
  else{
    // Accelerate into the held direction; never coast into a released direction.
    const dx=tx/targetSpeed,dz=tz/targetSpeed,currentSpeed=clamp(velocity.x*dx+velocity.y*dz,0,targetSpeed);
    const speed=mix(currentSpeed,targetSpeed,1-Math.exp(-16*dt));velocity.set(dx*speed,dz*speed);
  }
  const steps=Math.max(1,Math.ceil(velocity.length()*dt/.12)),sx=velocity.x*dt/steps,sz=velocity.y*dt/steps;
  for(let i=0;i<steps;i++){
    const x=player.x+sx,z=player.z+sz;
    if(isWalkable(x,z)){player.x=x;player.z=z;player.distance+=Math.hypot(sx,sz);}
    else{if(isWalkable(x,player.z))player.x=x;if(isWalkable(player.x,z))player.z=z;}
  }
  // A continuous eye-height path bridges the visible floating treads without bobbing.
  player.y=cameraPathHeight(player.z)+C.player.eyeHeight;
}
function updateUI(){
  const inHall=player.z<-length-C.hall.entryVestibule-.3;
  $('#place-name').innerHTML=inHall?words().second:words().first;
  $('#altitude').textContent=String(Math.round(clamp(-player.z/length,0,1)*C.corridor.steps)).padStart(2,'0');
  let nearest=null,best=5.0;const forward=new THREE.Vector3(-Math.sin(look.yaw),0,-Math.cos(look.yaw));
  for(const door of doors){const delta=door.position.clone().sub(new THREE.Vector3(player.x,rise,player.z)),distance=delta.length();if(distance<best&&delta.normalize().dot(forward)>.05){best=distance;nearest=door;}door.label.material.opacity=mix(door.label.material.opacity,door===nearest?1:.88,.08);door.uniforms.uNear.value=mix(door.uniforms.uNear.value,clamp(1-distance/15,0,1),.12);}
  const hint=$('#door-hint');activeDoor=nearest;hint.hidden=!nearest;
  if(nearest){hint.querySelector('h2').textContent=workTitle(nearest.work);hint.querySelector('.door-hint-index').textContent=nearest.work.roman;hint.querySelector('p').textContent=embedded&&nearest.work.projectId?words().enterHint:words().pending;$('#open-work').hidden=!(embedded&&nearest.work.projectId);$('#open-work').textContent=words().open;}
}
function enterWork(door=activeDoor){
  if(!door)return;
  if(!portfolioBridge?.embedded||!door.work.projectId){notice(words().pending);return;}
  hostSuspended=true;resetMovement();document.exitPointerLock?.();portfolioBridge.openWork(door.work.projectId);
}
function setViewLanguage(language){
  const next=language==='en'?'en':'zh',changed=next!==viewLanguage;viewLanguage=next;document.documentElement.lang=next==='en'?'en':'zh-CN';
  $('#pause').innerHTML=paused?words().resume:words().pause;$('#control-hint').textContent=document.pointerLockElement===canvas?words().locked:words().drag;$('#enter-label').textContent=words().chapter;
  if(changed)for(const door of doors){const old=door.label.material.map;door.label.material.map=doorLabel(door.work);old?.dispose();}
  gateInteraction?.language();
}
let noticeTimer;
function notice(text){clearTimeout(noticeTimer);$('#notice').textContent=text;$('#notice').classList.add('show');noticeTimer=setTimeout(()=>$('#notice').classList.remove('show'),2600);}
function start(options={}){
  playing=true;paused=false;resetMovement();document.body.dataset.playing='true';$('#pause').hidden=false;$('#pause').innerHTML=words().pause;welcome.classList.add('leaving');setTimeout(()=>welcome.hidden=true,850);
  if(!mobile&&options.lock!==false){try{const request=canvas.requestPointerLock?.();request?.catch(()=>{notice(words().drag);});}catch{notice(words().drag);}}
}
function setPaused(value){paused=value;resetMovement();$('#pause').innerHTML=value?words().resume:words().pause;if(value)document.exitPointerLock?.();else if(!mobile)canvas.requestPointerLock?.()?.catch(()=>{});}
function setupInput(){
  enter.addEventListener('click',start);
  $('#open-work').addEventListener('click',()=>gateInteraction?.request(activeDoor));
  $('#pause').addEventListener('click',()=>setPaused(!paused));
  const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
  addEventListener('keydown',event=>{
    if(gateInteraction?.isOpen()){
      if(movementKeys.has(event.code)||event.code==='KeyE')event.preventDefault();
      return;
    }
    if(movementKeys.has(event.code)){
      if(!playing||paused||hostSuspended||document.hidden)return;
      event.preventDefault();
      // Repeats after focus/lock loss must not resurrect a cleared held key.
      if(event.repeat&&!keys.has(event.code))return;keys.add(event.code);
    }
    if(event.code==='Escape'&&playing)setPaused(true);
    if((event.code==='KeyE'||event.code==='Enter')&&activeDoor&&playing&&!event.repeat){event.preventDefault();gateInteraction?.request(activeDoor);}
  },{capture:true});
  addEventListener('keyup',event=>{keys.delete(event.code);stopIfReleased();},{capture:true});
  addEventListener('blur',resetMovement);addEventListener('focus',resetMovement);addEventListener('pagehide',resetMovement);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)setPaused(true);else resetMovement();});
  document.addEventListener('pointerlockchange',()=>{resetMovement();$('#control-hint').textContent=document.pointerLockElement===canvas?words().locked:words().drag;});
  let dragging=null,stickPointer=null;clearPointerState=()=>{dragging=null;stickPointer=null;};
  canvas.addEventListener('pointerdown',event=>{if(!playing||paused||gateInteraction?.isOpen()||document.pointerLockElement===canvas)return;dragging={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);});
  addEventListener('pointermove',event=>{
    if(!playing||paused||gateInteraction?.isOpen())return;let dx=0,dy=0;
    if(document.pointerLockElement===canvas){dx=event.movementX;dy=event.movementY;}
    else if(dragging?.id===event.pointerId){dx=event.clientX-dragging.x;dy=event.clientY-dragging.y;dragging.x=event.clientX;dragging.y=event.clientY;}
    else return;
    const sensitivity=event.pointerType==='touch'?C.player.touchSensitivity:C.player.mouseSensitivity;
    look.yaw-=dx*sensitivity;look.pitch=clamp(look.pitch-dy*sensitivity,-1.38,1.53);
  });
  const clearDrag=event=>{if(dragging?.id===event.pointerId)dragging=null;};addEventListener('pointerup',clearDrag);addEventListener('pointercancel',clearDrag);
  const joystick=$('#joystick'),knob=$('#joystick-knob');
  function dragStick(event){if(stickPointer!==event.pointerId||gateInteraction?.isOpen())return;const bounds=joystick.getBoundingClientRect(),radius=bounds.width*.34;const dx=(event.clientX-bounds.left-bounds.width/2)/radius,dy=(event.clientY-bounds.top-bounds.height/2)/radius;stick.set(dx,-dy);if(stick.length()>1)stick.normalize();knob.style.transform=`translate(${stick.x*radius}px,${-stick.y*radius}px)`;}
  joystick.addEventListener('pointerdown',event=>{if(!playing||paused||gateInteraction?.isOpen())return;event.preventDefault();stickPointer=event.pointerId;joystick.setPointerCapture(event.pointerId);dragStick(event);});joystick.addEventListener('pointermove',dragStick);
  const resetStick=event=>{if(stickPointer!==event.pointerId)return;stickPointer=null;stick.set(0,0);knob.style.transform='';stopIfReleased();};joystick.addEventListener('pointerup',resetStick);joystick.addEventListener('pointercancel',resetStick);joystick.addEventListener('lostpointercapture',resetStick);addEventListener('pointerup',resetStick);addEventListener('pointercancel',resetStick);
}

function resize(){
  const w=innerWidth,h=innerHeight,ratio=Math.min(devicePixelRatio||1,mobile?1.25:1.6);renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();composer.setPixelRatio(ratio);composer.setSize(w,h);for(const u of animatedUniforms)if(u.uPixel)u.uPixel.value=ratio;
}
function animate(now){
  if(contextLost)return;requestAnimationFrame(animate);const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;if(hostSuspended||document.hidden)return;elapsed+=dt;
  if(playing&&!paused&&!gateInteraction?.isOpen()){const input=movementInput();stepPhysics(input.x,input.z,dt);}
  gateInteraction?.update();
  updateConstruction(dt);
  camera.position.set(player.x,player.y,player.z);camera.rotation.set(look.pitch,look.yaw,0,'YXZ');
  for(const uniforms of animatedUniforms)uniforms.uTime.value=reduce?0:elapsed;
  glowing.forEach(({material,base,index})=>material.color.copy(base).multiplyScalar(1.62+(reduce?0:Math.sin(elapsed*.7+index)*.025)));
  if(playing&&player.z<=-length-C.hall.entryVestibule-.3)hallArrived=true;
  hallFoundation.visible=hallArrived;
  const hallLight=clamp((-player.z-length+5)/10,0,1);ambientLight.intensity=mix(2.4,.85,hallLight);keyLight.intensity=mix(2.9,.65,hallLight);fillLight.intensity=mix(1.1,.22,hallLight);
  if(Math.floor(elapsed*8)!==Math.floor((elapsed-dt)*8))updateUI();
  renderer.info.reset();composer.render();
}

async function init(){
  try{
    document.title=C.title+' · 梦境章节';$('#dream-name').textContent=C.title;
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.localClippingEnabled=true;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.info.autoReset=false;renderer.setClearColor(C.colors.night);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
    scene=new THREE.Scene();scene.fog=new THREE.FogExp2(C.colors.night,.0012);scene.add(world);camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.08,5000);
    ambientLight=new THREE.HemisphereLight(0xe8edff,0x27375e,2.4);scene.add(ambientLight);keyLight=new THREE.DirectionalLight(0xffedce,2.9);keyLight.position.set(-8,28,12);scene.add(keyLight);fillLight=new THREE.DirectionalLight(0x8eadff,1.1);fillLight.position.set(18,12,-35);scene.add(fillLight);
    await document.fonts.ready;await document.fonts.load('28px NightSerif');
    const outer=C.artwork.skyTexture?await new THREE.TextureLoader().loadAsync(C.artwork.skyTexture):makeOuterSky();outer.colorSpace=THREE.SRGBColorSpace;
    const sky=new THREE.Mesh(new THREE.SphereGeometry(230,40,24),new THREE.MeshBasicMaterial({map:outer,side:THREE.BackSide,fog:false,depthWrite:false,depthTest:false}));sky.position.set(0,30,-40);sky.renderOrder=-1000;scene.add(sky);
    const stone=new THREE.MeshPhysicalMaterial({color:0xaebfcb,roughness:.46,metalness:.02,transparent:true,opacity:C.materials.structureOpacity,transmission:C.materials.transmission,thickness:.16,ior:1.13,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true});
    const stoneDark=new THREE.MeshPhysicalMaterial({color:C.colors.stoneShadow,roughness:.78,transparent:true,opacity:.12,transmission:.30,thickness:.2,ior:1.10,depthWrite:false,forceSinglePass:true});
    const gold=paleInlay(),light=new THREE.MeshBasicMaterial({color:new THREE.Color(C.colors.glow).multiplyScalar(2.2),toneMapped:false});
    const [sculptures,posters]=await Promise.all([loadSculptureAssets(),loadWorkPosters(C.works)]);
    buildCorridor(stone,stoneDark,gold,light);buildInfiniteDescent(stone,gold);buildHall(stone,gold,light,sculptures,posters);applyMaterialBalance();addDust();player.y=cameraPathHeight(player.z)+C.player.eyeHeight;
    composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),C.bloom.strength,C.bloom.radius,C.bloom.threshold);composer.addPass(bloom);composer.addPass(new OutputPass());
    resize();addEventListener('resize',resize);setupInput();setViewLanguage(viewLanguage);enter.disabled=false;document.body.dataset.ready='true';
    gateInteraction=installGateInteraction({doors,config:C.gateInteraction,getPosition:()=>player,getEnabled:()=>playing&&!paused&&!hostSuspended&&!document.hidden,getLanguage:()=>viewLanguage,getTitle:workTitle,onFreeze:()=>{resetMovement();document.exitPointerLock?.();},onConfirm:door=>enterWork(door),onDismiss:()=>canvas.focus({preventScroll:true})});
    portfolioBridge=installPortfolioBridge({embedded,onPause:()=>{hostSuspended=true;gateInteraction.close();resetMovement();document.exitPointerLock?.();},onResume:()=>{hostSuspended=false;resetMovement();if(!playing)start({lock:false});},onLanguage:setViewLanguage});
    canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;notice('画面暂时休息了，刷新页面即可继续');});
    window.corridorDemo={inspect:()=>({ready:true,playing,paused,hostSuspended,gateInteraction:gateInteraction?.inspect(),position:{x:player.x,y:player.y,z:player.z},camera:{x:camera.position.x,y:camera.position.y,z:camera.position.z},input:{keys:[...keys],stick:{x:stick.x,y:stick.y},speed:velocity.length()},look:{...look},inHall:player.z<-length-C.hall.entryVestibule-.3,foundation:{arrived:hallArrived,visible:hallFoundation.visible,parts:hallFoundation.children.length},construction:{furthestDistance,stepsBuilt:treadBuilds.filter(item=>item.p===1).length,stepsVisible:treadBuilds.filter(item=>item.p>0).length,framesBuilt:structureBuilds.filter(item=>item.kind==='frame'&&item.p===1).length,portalsBuilt:structureBuilds.filter(item=>item.kind==='portal'&&item.p===1).length},doorCount:doors.length,doorTitles:doors.map(d=>d.work.title),activeDoor:activeDoor?.work.id||null,inside:isWalkable(player.x,player.z),floorHeight:floorHeight(player.z),renderer:{calls:renderer.info.render.calls,triangles:renderer.info.render.triangles},corridorLength:length,hallZ,rise}),config:C};
    if(new URLSearchParams(location.search).has('test'))window.corridorDemo.test={workGates:()=>doors.map(d=>{d.group.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(d.group),frame=d.group.getObjectByName('sculpted-work-gate-frame'),materials=new Set();frame.traverse(n=>{if(n.material?.isMeshPhysicalMaterial)materials.add(n.material);});return {id:d.work.id,...d.group.userData,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},glassSurfaces:[...materials].map(m=>({opacity:m.opacity,transmission:m.transmission,color:m.color.getHex(),roughness:m.roughness,metalness:m.metalness})),scale:d.group.scale.x,height:bounds.max.y-rise,worldPosition:d.position.toArray(),yaw:d.group.rotation.y,posterLoaded:d.work.poster?!!d.curtain.material.uniforms.uMap.value.image:true,build:d.uniforms.uBuild.value,time:d.uniforms.uTime.value};}),detailRevision:()=>{
      const bays=hall.getObjectsByProperty('name','chapel-integrated-window-bay'),portals=hall.getObjectsByProperty('isGroup',true).filter(g=>g.userData.archDepth),muse=hall.getObjectByName('terpsichore-muse-scan');muse.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(muse);
      return{supportedWindows:bays.length,allWindowsSupported:bays.every(g=>g.userData.supported&&g.userData.wallBottom===0&&g.userData.pierJointGap===0),mainRoseWindows:hall.getObjectsByProperty('name','painted-rose-glass').length,windowConstructionCount:structureBuilds.filter(s=>s.kind==='stained-window').length,portalDetails:portals.map(g=>g.userData),solidSunDiscs:hall.getObjectsByProperty('name','lantern-gold-sun').length,maskedSkyDiscs:hall.getObjectsByProperty('name','aperture-masked-sky-dome').length,softSkyRays:hall.getObjectsByProperty('name','lantern-soft-daylight-ray').length,museHeight:bounds.max.y-bounds.min.y,museClearance:C.hall.museClearance};
    },baroqueRevision:()=>{
      const meshes=hall.getObjectsByProperty('isMesh',true),sculptures=meshes.filter(m=>m.material?.name==='unified-translucent-sculpture'),piers=hall.getObjectsByProperty('name','pier-integrated-sculpture-reredos'),inlays=meshes.filter(m=>m.material?.name==='fine-pale-gold-inlay');
      return{roof:hall.getObjectByName('cathedral-ribbed-vault').userData,sculptedPiers:piers.length,sculptureCount:piers.reduce((n,p)=>n+p.userData.sculptures,0),sculpturesAllTranslucent:sculptures.every(m=>m.material.transparent&&m.material.opacity<.85&&m.material.transmission>.25),sculpturesSameFinish:sculptures.every(m=>m.material.roughness===.50&&m.material.metalness===0),sculptureMaterialCount:sculptures.length,inlayMaterialCount:inlays.length,allInlaysPale:inlays.every(m=>m.material.color.getHex()===0xd7c8a5&&m.material.metalness<.1&&m.material.emissiveIntensity>0&&m.material.emissiveIntensity<.2),oldPlaneReliefs:hall.getObjectsByProperty('name','saint-charles-ascending-relief').length,altarTrue3D:hall.getObjectsByProperty('name','altar-three-dimensional-madonna').length,retables:hall.getObjectsByProperty('name','focused-sacred-ensemble').map(g=>g.userData),density:{boost:C.materials.structureOpacityBoost,vault:hall.getObjectByName('glass-vault-panel').material.opacity,shell:hall.getObjectByName('closed-upper-cupola-shell').material.opacity,whiteCells:hall.getObjectsByProperty('name','guarini-carved-cell-web').map(m=>m.material.opacity),pointedRibs:hall.getObjectsByProperty('name','pointed-diagonal-vault-rib').map(m=>m.material.opacity),flyingRibs:hall.getObjectsByProperty('name','gothic-capital-flying-rib').map(m=>m.material.opacity),fresco:hall.getObjectsByProperty('name','translucent-ceiling-fresco').map(m=>({opacity:m.material.opacity,transmission:m.material.transmission,transparent:m.material.transparent})),sideFresco:hall.getObjectsByProperty('name','side-chapel-painted-dome').map(m=>({opacity:m.material.opacity,transmission:m.material.transmission})),mainColumn:hall.getObjectByName('full-height-clustered-piers').material.opacity,muse:hall.getObjectByName('terpsichore-muse-scan').material.opacity},closedShells:hall.getObjectsByProperty('name','closed-upper-cupola-shell').length,enclosedLanterns:hall.getObjectsByProperty('name','enclosed-lantern-roof').length};
    },additions31:()=>{
      const towers=hall.getObjectsByProperty('name','chapel-cologne-openwork-spire').map(g=>{g.updateWorldMatrix(true,true);const box=new THREE.Box3().setFromObject(g);return{...g.userData,minY:box.min.y-rise,maxY:box.max.y-rise};}),frescoes=hall.getObjectsByProperty('name','guarini-inset-fresco'),sculptures=hall.getObjectsByProperty('isMesh',true).filter(m=>m.material?.name==='unified-translucent-sculpture');
      return{towers,mirrorRegions:hall.getObjectByName('hall-reflector')?.userData.floorRegions||0,sameFloorMaterial:hall.getObjectsByProperty('name','side-chapel-mirrored-floor-tint').every(m=>m.material===hall.getObjectByName('main-mirrored-floor-tint').material),sideMirrorTintCount:hall.getObjectsByProperty('name','side-chapel-mirrored-floor-tint').length,cupolas:hall.getObjectsByProperty('name','chapel-saint-peter-cupola').map(g=>g.userData),insetFrescoes:frescoes.reduce((n,m)=>n+(m.userData.sourceCount||1),0),preservedPaintWindowHoles:frescoes.reduce((n,m)=>n+(m.userData.windowHoles||0),0),shellFrescoFields:hall.getObjectsByProperty('name','guarini-shell-fresco-field').reduce((n,m)=>n+(m.userData.sourceCount||1),0),crownFrescoes:hall.getObjectsByProperty('name','guarini-crown-fresco').length,reliefOpacityRange:[Math.min(...sculptures.map(m=>m.material.opacity)),Math.max(...sculptures.map(m=>m.material.opacity))],plinthBays:hall.getObjectByName('continuous-profiled-wall-plinth').count,groundedDadoBays:hall.getObjectByName('grounded-blind-arcade-backing').count,foundationThickness:hall.getObjectByName('deep-hall-foundation').geometry.parameters.height,sideFoundations:hall.getObjectsByProperty('name','side-chapel-thick-foundation').length};
    },structureStates:()=>structureBuilds.map((s,i)=>({index:i,kind:s.kind,p:s.p,start:s.start,sync:s.syncWith?structureBuilds.indexOf(s.syncWith):null})),architecture:()=>({museTriangles:hall.getObjectByName('terpsichore-muse-scan')?.geometry.index.count/3,reliefGroups:hall.getObjectByName('gothic-clerestory')?.userData.columnReliefGroups,vaultReliefGroups:hall.getObjectByName('cathedral-ribbed-vault')?.userData.vaultReliefGroups,vaultWindowConnections:hall.getObjectByName('cathedral-ribbed-vault')?.userData.windowReliefConnections,maxCarvingJointGap:hall.getObjectByName('cathedral-ribbed-vault')?.userData.maxCarvingJointGap,windows:hall.getObjectsByProperty('name','painted-lancet-glass').reduce((n,m)=>n+(m.userData.sourceCount||1),0),upperBays:hall.getObjectByName('gothic-clerestory')?.userData.upperBays,continuousFrieze:hall.getObjectByName('gothic-clerestory')?.userData.continuousFrieze,lightDirection:hall.getObjectByName('stained-glass-lighting')?.userData.direction,reliefSubjects:hall.getObjectByName('cathedral-ribbed-vault')?.userData.reliefSubjects,columnToOculus:hall.getObjectByName('cathedral-ribbed-vault')?.userData.columnToOculus,capitalWidth:hall.getObjectByName('gothic-clerestory')?.userData.capitalWidth,capitalTransitions:hall.getObjectByName('cathedral-ribbed-vault')?.userData.capitalTransitions,transitionTangentAlignment:hall.getObjectByName('cathedral-ribbed-vault')?.userData.transitionTangentAlignment,transitionThickness:hall.getObjectByName('cathedral-ribbed-vault')?.userData.transitionThickness,columnTopTerraces:hall.getObjectsByProperty('name','column-top-terrace').length,terraceSize:hall.getObjectByName('cathedral-ribbed-vault')?.userData.terraceSize,transitionRibsPerCapital:hall.getObjectByName('cathedral-ribbed-vault')?.userData.transitionRibsPerCapital,transitionLeavesPerCapital:hall.getObjectByName('cathedral-ribbed-vault')?.userData.transitionLeavesPerCapital,entranceJoinGap:Math.abs(hallZ+hallEntryRadius+length),goldArchBays:(hall.getObjectByName('gothic-arch-gold-inlays')?.count||0)+(hall.getObjectByName('lower-arcade-gold-inlays')?.count||0),continuousGoldSeams:!!hall.getObjectByName('continuous-column-vault-gold-seams'),thickHaunches:hall.getObjectsByProperty('name','thick-column-vault-haunch').length,windowTracery:hall.getObjectsByProperty('name','connected-window-tracery').length,oculusRadius:hall.getObjectByName('cathedral-ribbed-vault')?.userData.oculusRadius,vaultMaterial:(()=>{const m=hall.getObjectByName('glass-vault-panel')?.material;return {opacity:m?.opacity,transmission:m?.transmission,roughness:m?.roughness,color:m?.color.getHex()};})(),treadMaterial:{opacity:treadMesh.material.opacity,transmission:treadMesh.material.transmission,roughness:treadMesh.material.roughness,color:treadMesh.material.color.getHex()}}),isWalkable,floorHeight,step:(x,z,dt)=>stepPhysics(x,z,dt),setPose:(x,z,yaw=0,pitch=.14)=>{if(!isWalkable(x,z))return false;player.x=x;player.z=z;player.y=cameraPathHeight(z)+C.player.eyeHeight;look.yaw=yaw;look.pitch=clamp(pitch,-1.38,1.53);velocity.set(0,0);return true;},doors:()=>doors.map(d=>({id:d.work.id,x:d.position.x,z:d.position.z,angle:d.work.angle})),advanceBuild:seconds=>{for(let t=0;t<seconds;t+=.025)updateConstruction(Math.min(.025,seconds-t));},buildProgress:()=>({steps:treadBuilds.map(item=>item.p),frames:structureBuilds.map(item=>item.p)}),surfaceDetails:()=>({windowOpacity:hall.getObjectByName('painted-rose-glass')?.material.opacity,windowTransmission:hall.getObjectByName('painted-rose-glass')?.material.transmission,frescoPanels:hall.getObjectsByProperty('name','translucent-ceiling-fresco').length,frescoOpacity:hall.getObjectByName('translucent-ceiling-fresco')?.material.opacity,exposedLightingPlanes:[...hall.getObjectByName('stained-glass-lighting').children,...hall.getObjectByName('open-oculus-daylight').children].filter(m=>m.geometry?.type==='PlaneGeometry').length,volumeCount:hall.getObjectsByProperty('isMesh',true).filter(m=>m.material?.uniforms?.uDensity).length}),cathedralPlan:()=>{const portico=hall.getObjectByName('grand-exterior-entrance');portico.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(portico),clerestory=hall.getObjectByName('gothic-clerestory'),roof=hall.getObjectByName('cathedral-ribbed-vault');return{mainWidth:C.hall.radius*2*C.hall.stretch,mainLength:C.hall.radius*2*hallDepth,height:C.hall.height,sideChapels:hall.getObjectsByProperty('name','side-chapel-painted-dome').length,chapelCentres:hall.userData.chapelCentres,fullHeightPiers:clerestory.userData.fullHeightPiers,columnAxisOffset:clerestory.userData.columnAxisOffset,hasSeating:!!hall.getObjectByName('colosseum-terraces'),porticoOutsideClearance:bounds.min.z-(hallZ+hallEntryRadius),facadeWorldZ:hallZ+hallEntryRadius,porticoMinZ:bounds.min.z,...roof.userData,drumWindows:roof.userData.drumWindows,interlacedArches:roof.userData.interlacedArches,flyingButtresses:hall.getObjectsByProperty('name','chapel-flying-buttress-system').reduce((n,g)=>n+g.userData.flyingButtresses,0),sidePortalCount:hall.getObjectsByProperty('name','great-side-chapel-doorway').length,focusedReliefGroups:hall.getObjectsByProperty('name','focused-sacred-ensemble').length,lowerLancets:hall.getObjectsByProperty('name','painted-lower-lancet-glass').reduce((n,m)=>n+(m.userData.sourceCount||1),0)};},setBloom:value=>bloom.strength=value};
    portfolioBridge.ready();last=performance.now();requestAnimationFrame(animate);
  }catch(error){console.error(error);$('#unsupported').hidden=false;$('#error-message').textContent=error.message;$('#enter-label').textContent='暂时无法进入';document.body.dataset.ready='error';if(embedded)parent.postMessage({type:'showcase:failed'},location.origin);}
}
init();
