import './style.css';
import {OFFICE_SETTINGS as settings} from './office-settings.js';
import {createNavigator} from './navigation.js';
import * as T from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SMAAPass} from 'three/addons/postprocessing/SMAAPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
const $=s=>document.querySelector(s), canvas=$('#world');
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.35));renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;renderer.info.autoReset=false;
const scene=new T.Scene();scene.background=new T.Color('#8e9da6');scene.fog=new T.FogExp2('#8d9ba6',.0026);
const camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.06,1500);camera.position.set(5.1,1.68,-33.75);
const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.12;pmrem.dispose();
scene.add(new T.HemisphereLight('#d2e0ed','#424a4d',1.30),new T.AmbientLight('#a7b9cb',.30));
RectAreaLightUniformsLib.init();
function area(col,power,w,h,pos,target){const l=new T.RectAreaLight(col,power,w,h);l.position.set(...pos);l.lookAt(...target);scene.add(l);return l;}
// Broad sky openings produce diffuse window light, without a direct sun source.
for(const x of [-9,-47,-85,-113])area('#c5d9ed',3.8,29,2.1,[x,2.2,-51.7],[x,1,-20]);
for(const x of [-16,-65,-109])area('#b8cddd',1.9,26,2.0,[x,2.2,4.7],[x,1,-20]);
area('#b5cfe8',3.6,12,2.6,[-10,2.2,23.7],[-10,1,12]);area('#d6dedb',1.9,12,5,[-10,3.4,16],[-10,0,16]);
area('#d1d9df',2.0,26,7,[12,3.5,-4],[12,0,-4]);
for(const x of [-10,-45,-80,-112])area('#e4e6e3',.9,24,38,[x,3.22,-24],[x,0,-24]);
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));
const ao=new GTAOPass(scene,camera,innerWidth/2,innerHeight/2);ao.blendIntensity=.50;ao.updateGtaoMaterial({radius:.34,thickness:.55,distanceFallOff:1.2,scale:1});composer.addPass(ao);
const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.19,.5,.96);composer.addPass(bloom);composer.addPass(new OutputPass());
const finish=new ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;float v=1.-.13*pow(length((vUv-.5)*1.35),1.8);float g=fract(sin(dot(vUv*1900.,vec2(12.9898,78.233)))*43758.5453)-.5;gl_FragColor=vec4(c*v+g*.003,1.);}`});composer.addPass(finish);
composer.addPass(new SMAAPass());
function mat(c,roughness=.8,metalness=0){return new T.MeshStandardMaterial({color:c,roughness,metalness});}
function texture(size,draw){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const tx=new T.CanvasTexture(c);tx.colorSpace=T.SRGBColorSpace;tx.anisotropy=4;return tx;}
let rng=24681357;function rnd(){rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;}
const carpet=texture(256,(c,n)=>{c.fillStyle='#647176';c.fillRect(0,0,n,n);for(let i=0;i<18000;i++){const v=90+Math.floor(rnd()*43);c.fillStyle=`rgba(${v},${v+10},${v+15},.23)`;c.fillRect(rnd()*n,rnd()*n,1,2);}c.strokeStyle='#39474d22';c.strokeRect(.5,.5,n-1,n-1);});carpet.wrapS=carpet.wrapT=T.RepeatWrapping;
const materials={Clay:mat('#c1c4c1'),Trim:mat('#68757b',.72,.06),Recess:mat('#283740',.6),Paper:mat('#dbddd5'),Desk:mat('#b9b1a1',.72),ChairBack:mat('#455761',.9),MonitorCase:mat('#263741',.5,.10),Floor:mat('#879498'),Rug:mat('#52666c'),Ceiling:mat('#b5bfc1'),Plant:mat('#526c5a'),Light:new T.MeshStandardMaterial({color:'#c9dadc',emissive:'#dce8e6',emissiveIntensity:1.6}),Glass:new T.MeshPhysicalMaterial({color:'#a8c4d0',transparent:true,opacity:.115,roughness:.28,metalness:0,depthWrite:false,side:T.DoubleSide})};
materials.Wood=mat('#968772',.8);materials.Upholstery=mat('#67746f',.94);['#627c84','#9d977b','#977d74','#c1c4b7'].forEach((c,i)=>materials['Book'+i]=mat(c));
materials.Floor.map=carpet;
for(const [name,m] of Object.entries(materials)){
 if(['Glass','Light'].includes(name))continue;
 m.onBeforeCompile=s=>{s.vertexShader='varying vec3 vLocal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvLocal=position;');s.fragmentShader='varying vec3 vLocal;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat grain=fract(sin(dot(floor(vLocal*450.),vec3(13.8,68.2,94.7)))*43758.5453); diffuseColor.rgb*=.986+grain*.028;');};
}
const screenTextures=[0,1,2].map(type=>texture(1024,(c,n)=>{
 c.fillStyle=['#344c58','#d3d9d7','#293f4c'][type];c.fillRect(0,0,n,n);c.fillStyle='#21313b';c.fillRect(0,0,n,64);c.font='22px Segoe UI';c.fillStyle='#bbd2db';c.fillText(['PROJECT / WORKSPACE','QUARTERLY REPORT / 04','SYSTEM / EDITOR'][type],32,42);
 c.fillStyle='#3c555f';c.fillRect(0,64,160,n-64);for(let i=0;i<11;i++){c.fillStyle=i===2?'#a9c2c6':'#77959e';c.fillRect(24,115+i*61,85+(i%3)*10,9);}
 if(type===1){c.fillStyle='#7e969e';c.fillRect(187,105,790,50);c.strokeStyle='#9cacae';c.lineWidth=1.5;for(let x=190;x<980;x+=98){c.beginPath();c.moveTo(x,175);c.lineTo(x,890);c.stroke();}for(let y=175;y<890;y+=51){c.beginPath();c.moveTo(190,y);c.lineTo(980,y);c.stroke();}c.font='17px monospace';for(let j=0;j<13;j++)for(let i=0;i<7;i++){c.fillStyle='#526870';c.fillText(String(105+(j*71+i*37)%893),208+i*98,208+j*51);}c.fillStyle='#93aead';c.fillRect(600,585,180,155);}
 else if(type===0){c.fillStyle='#506773';c.fillRect(194,100,790,154);c.fillStyle='#d5dfdf';c.font='34px Segoe UI';c.fillText('TODAY’S TASKS',222,160);c.font='19px Segoe UI';c.fillText('Review · Coordinate · Deliver',224,205);for(let j=0;j<5;j++){c.fillStyle='#415b67';c.fillRect(194,285+j*118,790,98);c.fillStyle='#93adb5';c.fillRect(222,312+j*118,360-j*31,11);c.fillStyle='#6e8a96';c.fillRect(222,344+j*118,570-j*40,8);c.fillStyle='#b0bdb8';c.fillRect(918,310+j*118,35,35);}}
 else{for(let j=0;j<33;j++){c.font='18px monospace';c.fillStyle='#607e8a';c.fillText(String(j+1).padStart(2,'0'),187,112+j*24);c.fillStyle=['#99b9bb','#c3bb9b','#799eaa'][j%3];c.fillRect(242+(j%4)*24,100+j*24,180+(j*43)%410,7);c.fillStyle='#5c7a88';c.fillRect(262+(j%4)*24,111+j*24,120+(j*27)%350,5);}}
 c.fillStyle='#213641';c.fillRect(0,974,n,50);c.fillStyle='#a6c0c9';c.font='16px monospace';c.fillText('WORK MODE                         SYNCED     09:41',25,1006);
}));
const screenMats=screenTextures.map(map=>new T.MeshBasicMaterial({map,color:'#9bafba',toneMapped:false}));
const geo={Cube:new T.BoxGeometry(1,1,1),Cylinder:new T.CylinderGeometry(.5,.5,1,12),Sphere:new T.SphereGeometry(.5,10,7),Cone:new T.ConeGeometry(.5,1,12),Screen:new T.PlaneGeometry(1,1)};
const building=new T.Group(),outside=new T.Group();scene.add(building,outside);const tinyBatches=[],roofBatches=[];const dummy=new T.Object3D(),q=new T.Quaternion(),v=new T.Vector3();
const data=await fetch(new URL('data/office.json', document.baseURI)).then(r=>{if(!r.ok)throw Error('场景数据无法读取');return r.json();});
const groups=new Map();let screenIndex=0;
const colliders=[];
const unitBox=new T.Box3(new T.Vector3(-.5,-.5,-.5),new T.Vector3(.5,.5,.5));
const worldBox=new T.Box3();
for(const i of data.instances){let [shape,role,actor,x,y,z,qx,qy,qz,qw,sx,sy,sz,tiny]=i;
 // Build colliders from the original transforms, without changing scene meshes.
 if(!tiny&&!['Floor','Rug','Ceiling','Light','Paper','Screen','LargeScreen'].includes(role)){
  dummy.position.set(x,y,z);dummy.quaternion.set(qx,qy,qz,qw);dummy.scale.set(sx,sy,sz);dummy.updateMatrix();
  worldBox.copy(unitBox).applyMatrix4(dummy.matrix);
  if(worldBox.max.y>settings.bodyBottom&&worldBox.min.y<settings.bodyTop&&worldBox.max.x>=settings.bounds.minX&&worldBox.min.x<=settings.bounds.maxX&&worldBox.max.z>=settings.bounds.minZ&&worldBox.min.z<=settings.bounds.maxZ){
   colliders.push({minX:worldBox.min.x,maxX:worldBox.max.x,minZ:worldBox.min.z,maxZ:worldBox.max.z});
  }
 }
 let roof=actor==='Ceiling_Panels_HideForPlan'||actor==='CeilingFixturesAndServices';
 let screen=role==='Screen'||role==='LargeScreen';let material=role;
 if(screen){shape='Screen';material='Screen'+(screenIndex++%3);q.set(qx,qy,qz,qw);q.multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),role==='Screen'?Math.PI/2:Math.PI));let normal=new T.Vector3(role==='Screen'?.013:0,0,role==='Screen'?0:-.05).applyQuaternion(new T.Quaternion(qx,qy,qz,qw));x+=normal.x;y+=normal.y;z+=normal.z;[qx,qy,qz,qw]=q.toArray();[sx,sy,sz]=[role==='Screen'?sz:sx,sy,1];}
 const cell=Math.floor(x/16)+','+Math.floor(z/16);const key=[shape,material,tiny,roof?1:0,cell].join('|');
 if(!groups.has(key))groups.set(key,{shape,material,tiny,roof,list:[]});groups.get(key).list.push([x,y,z,qx,qy,qz,qw,sx,sy,sz]);
}
for(const g of groups.values()){
 const material=g.material.startsWith('Screen')?screenMats[+g.material.slice(6)]:materials[g.material]||materials.Clay;
 const mesh=new T.InstancedMesh(geo[g.shape],material,g.list.length);mesh.name=g.material;mesh.userData.tiny=g.tiny;mesh.userData.fxRoof=g.roof;
 g.list.forEach((t,j)=>{dummy.position.set(...t.slice(0,3));dummy.quaternion.set(...t.slice(3,7));dummy.scale.set(...t.slice(7,10));dummy.updateMatrix();mesh.setMatrixAt(j,dummy.matrix);});mesh.computeBoundingBox();mesh.computeBoundingSphere();building.add(mesh);
 if(g.tiny)tinyBatches.push(mesh);if(g.roof)roofBatches.push(mesh);
}

// Raised office, with a muted neighboring skyline rather than a blank white backdrop.
const exteriorMat=mat('#73858e'),exteriorGlass=mat('#4f6673',.44,.12);const base=new T.Mesh(new T.BoxGeometry(500,1,500),mat('#69767a'));base.position.set(-55,-27,-15);outside.add(base);
for(let j=0;j<36;j++){
 const x=-160+rnd()*250,z=j%2?-85-rnd()*45:40+rnd()*60,h=12+rnd()*34,w=8+rnd()*14,d=8+rnd()*18;
 const m=new T.Mesh(geo.Cube,exteriorMat);m.position.set(x,-27+h/2,z);m.scale.set(w,h,d);outside.add(m);
 for(let y=-23;y<-27+h-1;y+=3.1){const band=new T.Mesh(geo.Cube,exteriorGlass);band.position.set(x,y,z);band.scale.set(w+.03,1.3,d+.03);outside.add(band);}
}
const sky=new T.Mesh(new T.SphereGeometry(700,24,16),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 vD;void main(){vD=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 vD;float n(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(n(i),n(i+vec2(1,0)),f.x),mix(n(i+vec2(0,1)),n(i+1.),f.x),f.y);}void main(){vec3 d=normalize(vD);float c=noise(d.xz*7.)*.3+noise(d.xz*17.)*.12;vec3 col=mix(vec3(.51,.59,.65),vec3(.29,.36,.43),max(d.y,0.));col+=c*.12;gl_FragColor=vec4(col,1.);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`}));sky.renderOrder=-100;scene.add(sky);

// One eye-level camera only. The source geometry and furniture are unchanged.
const sourceCamera=data.cameras.find(c=>c.name===settings.cameraName);
const transform=sourceCamera.transform;
camera.position.set(-transform[1]/100,settings.eyeHeight,transform[0]/100);
q.set(transform[4],-transform[5],-transform[3],transform[6]);
v.set(0,0,1).applyQuaternion(q);
camera.lookAt(camera.position.clone().add(v));
camera.rotation.reorder('YXZ');
camera.fov=2*Math.atan(Math.tan(sourceCamera.fov*Math.PI/360)/1.6)*180/Math.PI;
const navigator=createNavigator(colliders,settings,camera.position);
const keys=new Set(), direction=new T.Vector3();
let looking=false, pointer=null, lastX=0, lastY=0;
let paused=parent!==window, failed=false, disposed=false, needsRender=true;
function clearInput(){keys.clear();looking=false;pointer=null;}
function setPaused(value){paused=value;document.body.dataset.paused=String(value);if(value)clearInput();}
canvas.addEventListener('contextmenu',event=>event.preventDefault());
canvas.addEventListener('pointerdown',event=>{
 if(paused)return;
 canvas.focus({preventScroll:true});
 if(event.button===2||event.pointerType==='touch'){
  looking=true;pointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(pointer);
 }
});
canvas.addEventListener('pointermove',event=>{
 if(!looking||paused||event.pointerId!==pointer)return;
 camera.rotation.y-=(event.clientX-lastX)*settings.lookSensitivity;
 camera.rotation.x=T.MathUtils.clamp(camera.rotation.x-(event.clientY-lastY)*settings.lookSensitivity,-settings.maxPitch,settings.maxPitch);
 needsRender=true;
 lastX=event.clientX;lastY=event.clientY;
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>{looking=false;pointer=null;});
window.addEventListener('keydown',event=>{
 if(paused)return;
 if(event.code==='Escape'){
  clearInput();canvas.blur();
  if(parent!==window)parent.postMessage({type:'office:escape'},location.origin);
 }
 if(['KeyW','KeyA','KeyS','KeyD'].includes(event.code)){event.preventDefault();keys.add(event.code);}
});
window.addEventListener('keyup',event=>keys.delete(event.code));
window.addEventListener('blur',clearInput);
document.addEventListener('visibilitychange',clearInput);
window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='office:state')return;
 setPaused(Boolean(event.data.paused));
});
function move(dt){
 const forward=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));
 const side=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
 if(!forward&&!side)return;
 camera.getWorldDirection(direction);direction.y=0;direction.normalize();
 const position=navigator.step(direction.x*forward-direction.z*side,direction.z*forward+direction.x*side,dt);
 needsRender ||= position.x!==camera.position.x||position.z!==camera.position.z;
 camera.position.set(position.x,settings.eyeHeight,position.z);
}
function updateTiny(){for(const mesh of tinyBatches)mesh.visible=mesh.boundingSphere.center.distanceTo(camera.position)<24+mesh.boundingSphere.radius;}
function resize(){
 renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 composer.setSize(innerWidth,innerHeight);ao.setSize(Math.ceil(innerWidth/2),Math.ceil(innerHeight/2));
 needsRender=true;
}
window.addEventListener('resize',resize);resize();updateTiny();
function render(){renderer.info.reset();composer.render();}
let last=performance.now(),lastCull=0,lastRender=0,frame;
function animate(now){
 if(disposed)return;
 frame=requestAnimationFrame(animate);
 const dt=Math.min((now-last)/1000,.08);last=now;
 if(paused||document.hidden||failed)return;
 move(dt);
 if(now-lastCull>300){updateTiny();lastCull=now;}
 if(needsRender&&now-lastRender>=1000/30){render();needsRender=false;lastRender=now;}
}
canvas.addEventListener('webglcontextlost',event=>{
 event.preventDefault();failed=true;clearInput();parent.postMessage({type:'office:error'},location.origin);
});
window.addEventListener('pagehide',()=>{
 disposed=true;cancelAnimationFrame(frame);clearInput();composer.dispose();renderer.dispose();renderer.forceContextLoss();
},{once:true});
render();
window.office={ready:true,
 get position(){return camera.position.toArray();},
 get rotation(){return [camera.rotation.x,camera.rotation.y,camera.rotation.z];},
 get stats(){return {colliders:colliders.length,instances:data.instances.length,paused,valid:navigator.canStand(camera.position.x,camera.position.z),fov:camera.fov,drawCalls:renderer.info.render.calls};},
 capture(){render();return canvas.toDataURL('image/png');},
};
$('#loading').remove();setPaused(paused);parent.postMessage({type:'office:ready'},location.origin);frame=requestAnimationFrame(animate);
