import * as THREE from 'three';
import { classicalColumn } from './architectural-details.js';
import { architecturalStone, sculptureMarble, paleInlay } from './baroque-materials.js';
import { batchStaticDetails } from './geometry-batches.js';
import { workPortal } from './work-portal-effects.js';
import { CONFIG as C } from './scene.config.js';

const PI=Math.PI,TAU=PI*2;
let column;
const v=(x,y,z=0)=>new THREE.Vector3(x,y,z);
function mesh(parent,geometry,material,x=0,y=0,z=0,name='work-gate-carving'){
  const object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);object.name=name;parent.add(object);return object;
}
function ball(parent,material,x,y,z,sx,sy=sx,sz=sx){const m=mesh(parent,new THREE.SphereGeometry(1,18,12),material,x,y,z);m.scale.set(sx,sy,sz);return m;}
function box(parent,material,w,h,d,x,y,z=0){return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
function tube(parent,material,points,r=.04,segments=48){return mesh(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>p.isVector3?p:v(...p))),segments,r,6,false),material);}
function ring(parent,material,r,t,x,y,z=0){return mesh(parent,new THREE.TorusGeometry(r,t,6,80),material,x,y,z);}
function arch(parent,material,inner,outer,stem,depth,z=0){
  const shape=new THREE.Shape();shape.absarc(0,stem,outer,0,PI,false);shape.lineTo(-inner,stem);shape.absarc(0,stem,inner,PI,0,true);shape.closePath();
  return mesh(parent,new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:48}),material,0,0,z,'layered-classical-archivolt');
}
function leaf(parent,material,x,y,z,length=.4,angle=0,width=.13){
  const m=ball(parent,material,x,y,z,width,length,.055);m.rotation.z=angle;m.rotation.x=.25;return m;
}
function volute(parent,material,x,y,z,size=.4,flip=1){
  return tube(parent,material,Array.from({length:42},(_,i)=>{const t=i/41,a=t*TAU*1.4,r=size*(1-t*.9);return[x+flip*Math.cos(a)*r,y+Math.sin(a)*r,z];}),.035);
}
function flower(parent,petal,stone,x,y,z,size=.4){
  for(let i=0;i<7;i++){const a=i/7*TAU,m=ball(parent,petal,x+Math.sin(a)*size*.60,y+Math.cos(a)*size*.60,z,size*.32,size*.58,size*.19);m.rotation.z=-a;}
  ball(parent,stone,x,y,z+size*.2,size*.24);
}
function accent(color){const m=sculptureMarble();m.color.set(color);return m;}
function plinth(parent,stone,gold,x,y,z,w=1.3){
  box(parent,stone,w,.15,w,x,y+.075,z);box(parent,stone,w*.82,.65,w*.80,x,y+.48,z);box(parent,stone,w*1.08,.14,w*1.04,x,y+.88,z);
  const r=ring(parent,gold,w*.45,.012,x,y+.98,z);r.rotation.x=PI/2;
}

function addFrame(parent,{stone,gold,simple}){
  column??=classicalColumn(THREE,4.9,.65);
  const positions=simple?[[-2.96,.30],[2.96,.30]]:[[-2.96,.56],[2.96,.56],[-3.72,-.30],[3.72,-.30]];
  for(const [x,z] of positions){mesh(parent,column.body,stone,x,0,z,'fluted-work-gate-columns');mesh(parent,column.trim,gold,x,0,z,'fine-work-gate-inlays');}
  for(let i=0;i<(simple?2:5);i++){
    const radius=2.41+i*.155,z=.88-i*.21;arch(parent,stone,radius,radius+.13,4.7,.28,z);
    const points=Array.from({length:80},(_,j)=>{const a=j/79*PI;return[Math.cos(a)*(radius+.065),4.7+Math.sin(a)*(radius+.065),z+.30];});tube(parent,gold,points,.013,80);
  }
  for(const side of[-1,1]){
    for(const [w,h,d,y]of[[2.0,.18,1.7,4.93],[2.25,.16,1.85,5.09],[2.05,.13,1.7,5.24]])box(parent,stone,w,h,d,side*3.32,y,0);
    for(let j=0;j<8;j++)box(parent,stone,.12,.16,.16,side*3.32-.83+j*.237,5.04,1.0);
    box(parent,stone,2.05,.12,1.65,side*3.3,.08,.04);
    if(!simple)for(let j=0;j<5;j++){
      const y=1+j*.68;volute(parent,stone,side*3.58,y,.70,.23,side);leaf(parent,stone,side*3.6,y+.18,.76,.27,side*.6);
    }
  }
  if(!simple){
    for(let i=0;i<31;i++){
      const a=i/30*PI,r=2.87,g=new THREE.BoxGeometry(.14,.36,.44),o=mesh(parent,g,stone,Math.cos(a)*r,4.7+Math.sin(a)*r,.55);o.rotation.z=a-PI/2;
    }
    // Broken pediment with curled ends leaves room for the work's own crown.
    for(const side of[-1,1]){
      tube(parent,stone,[[side*3.90,5.35,-.05],[side*3.5,6.65,.0],[side*2.20,7.95,.05],[side*.95,8.22,.10]],.16);
      tube(parent,gold,[[side*3.9,5.45,.12],[side*3.48,6.70,.17],[side*2.16,8.03,.22],[side*.95,8.30,.27]],.012);
      volute(parent,stone,side*1.10,8.25,.25,.38,side);
    }
  }
  // Low, continuous feet connect the paired columns with the mirror floor.
  for(const side of[-1,1])for(let i=0;i<3;i++)box(parent,stone,2.30-i*.13,.13,2.65-i*.15,side*3.3,.065+i*.13,.1);
  for(const x of[-2.12,2.12]){const r=ring(parent,gold,.16,.014,x,.045,1.23);r.rotation.x=-PI/2;}
  parent.userData.frame={clearWidth:4.7,clearHeight:7.05,flutedColumns:positions.length,archivolts:simple?2:5};
}

function roof(parent,stone,gold,width,y,depth){
  const p=[],uv=[],idx=[],n=40,m=8;
  for(let j=0;j<=m;j++)for(let i=0;i<=n;i++){
    const x=(i/n-.5)*width,z=(j/m-.5)*depth,h=y+.40*Math.pow(Math.abs(x/(width/2)),4)-.35*Math.abs(z/(depth/2));p.push(x,h,z);uv.push(i/n,j/m);
  }
  for(let j=0;j<m;j++)for(let i=0;i<n;i++){const a=j*(n+1)+i;idx.push(a,a+1,a+n+1,a+1,a+n+2,a+n+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();mesh(parent,g,stone,0,0,0,'chinese-upturned-tiled-roof');
  for(const z of[-depth/2,depth/2])tube(parent,gold,Array.from({length:41},(_,i)=>{const x=(i/40-.5)*width;return[x,y+.4*Math.pow(Math.abs(x/(width/2)),4)-.35,z];}),.025);
  for(let i=0;i<=28;i++){const x=(i/28-.5)*width;tube(parent,stone,[[x,y+.4*Math.pow(Math.abs(x/(width/2)),4)-.35,-depth/2],[x,y+.4*Math.pow(Math.abs(x/(width/2)),4),0],[x,y+.4*Math.pow(Math.abs(x/(width/2)),4)-.35,depth/2]],.032,16);}
}
function chineseCrown(parent,stone,gold){
  box(parent,stone,6.5,.28,1.25,0,8.16,0);
  roof(parent,stone,gold,8.7,8.65,2.5);roof(parent,stone,gold,6.2,9.72,2.0);
  for(const side of[-1,1]){
    box(parent,stone,.24,1.0,.24,side*1.8,9.10,0);box(parent,stone,4.4,.19,1.1,0,9.49,0);
    for(let j=0;j<4;j++){box(parent,stone,.65-j*.07,.13,.5,side*2.4,8.20+j*.16,.0);}
    tube(parent,stone,[[side*2.7,9.85,0],[side*3.15,10.04,0],[side*3.30,10.33,.1],[side*3.15,10.50,.14]],.075);
    for(const y of[5.85,6.45]){const lantern=ball(parent,stone,side*3.75,y,.9,.26,.37,.26);ring(parent,gold,.23,.018,side*3.75,y,.96);tube(parent,gold,[[side*3.75,y-.38,.9],[side*3.75,y-.70,.9]],.018);}
  }
  parent.userData.motif='中式重檐、琉璃瓦脊、斗拱、灯笼';
}

function sword(parent,stone,gold,x,y,z,angle=0,scale=1){
  const root=new THREE.Group();root.position.set(x,y,z);root.rotation.z=angle;root.scale.setScalar(scale);parent.add(root);
  const shape=new THREE.Shape();shape.moveTo(0,4.7);shape.lineTo(.18,4.10);shape.lineTo(.17,.9);shape.lineTo(0,.72);shape.lineTo(-.17,.9);shape.lineTo(-.18,4.10);shape.closePath();
  mesh(root,new THREE.ExtrudeGeometry(shape,{depth:.12,bevelEnabled:true,bevelSize:.045,bevelThickness:.035,bevelSegments:2}),stone);
  tube(root,gold,[[0,.9,.15],[0,4.45,.15]],.014);
  tube(root,stone,[[-.70,.72,0],[-.47,.91,0],[0,.83,0],[.47,.91,0],[.70,.72,0]],.095);
  mesh(root,new THREE.CylinderGeometry(.10,.10,.68,12),gold,0,.37,.03);ball(root,stone,0,-.02,.03,.16,.20,.13);
  for(let i=0;i<6;i++){const r=ring(root,gold,.103,.014,0,.1+i*.09,.03);r.rotation.x=PI/2;}
}
function swordCrown(parent,stone,gold){
  sword(parent,stone,gold,-1.60,7.55,.45,-.52,.92);sword(parent,stone,gold,1.60,7.55,.44,.52,.92);
  for(const side of[-1,1]){sword(parent,stone,gold,side*3.63,1.18,1.0,-side*.11,.90);for(let j=0;j<8;j++)leaf(parent,stone,side*(3.70+.15*Math.sin(j)),1.8+j*.6,.7,.32,side*.65);}
  parent.userData.motif='交叉长剑、剑脊、剑格、缠柄与竹叶';
}

function planetCrown(parent,stone,gold){
  box(parent,stone,1.18,.48,.9,0,7.98,.2);
  ball(parent,stone,0,9.15,.2,1.08);
  for(const [r,t]of[[1.55,.045],[1.85,.018]]){const o=ring(parent,gold,r,t,0,9.15,.2);o.rotation.set(.65,.18,.25);}
  for(const side of[-1,1]){
    plinth(parent,stone,gold,side*3.80,.25,.60,1.25);ball(parent,stone,side*3.8,2.0,.6,.56);
    const o=ring(parent,gold,.86,.023,side*3.8,2.0,.6);o.rotation.set(.7,side*.4,side*.3);
    for(let i=0;i<7;i++){const a=i/7*TAU;ball(parent,stone,side*3.9+Math.sin(a)*.45,3.3+i*.43,.60,.08+i%2*.04);}
  }
  for(let i=0;i<7;i++){
    const a=i/7*TAU,x=Math.sin(a)*2.35,y=9.1+Math.cos(a)*1.15;ball(parent,stone,x,y,.05,.13+(i%3)*.09);
    if(i%2===0){tube(parent,gold,[[x-.16,y,.1],[x+.16,y,.1]],.014);tube(parent,gold,[[x,y-.16,.1],[x,y+.16,.1]],.014);}
  }
  parent.userData.motif='土星雕塑、倾斜星环、行星列阵与星芒';
}

function butterfly(parent,petal,stone,x,y,z,size=.65,tilt=0){
  const root=new THREE.Group();root.position.set(x,y,z);root.rotation.z=tilt;parent.add(root);
  for(const side of[-1,1]){
    const wing=new THREE.Shape();wing.moveTo(0,0);wing.bezierCurveTo(side*1.25,1.55,side*1.80,.25,side*.45,-.10);wing.bezierCurveTo(side*1.45,-.15,side*.8,-1.0,0,-.3);wing.closePath();
    const m=mesh(root,new THREE.ExtrudeGeometry(wing,{depth:.045,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,curveSegments:16}),petal);m.scale.setScalar(size);m.rotation.y=side*.33;
    tube(root,stone,[[0,0,.08],[side*.20*size,.67*size,.10],[side*.45*size,.85*size,.08]],.018,20);
  }
  ball(root,stone,0,0,.10,.08*size,.45*size,.09*size);
}
function gardenCrown(parent,stone,gold){
  const lilac=accent(0xc5b7dd),pink=accent(0xddb5c6),green=accent(0xb8d4c4);
  for(const side of[-1,1]){
    const points=Array.from({length:120},(_,i)=>{const t=i/119,a=t*TAU*2.3;return[side*3.10+Math.sin(a)*.47,.45+t*6.30,.6+Math.cos(a)*.43];});tube(parent,green,points,.065,120);
    for(let i=0;i<16;i++){const t=i/15,a=t*TAU*2.3;leaf(parent,green,side*3.10+Math.sin(a)*.55,.55+t*6.3,.70+Math.cos(a)*.43,.32,side*.8);}
    // Curved, bead-like stalks and oversized two-lobed buds follow the supplied
    // D:/怪诞花园 models rather than generic realistic ivy.
    for(let i=0;i<3;i++){
      const x=side*(3.55+i*.24),h=2.3+i*1.25;const path=[[x,.4,.4],[x+side*.5,h*.45,.4],[x-side*.25,h*.75,.6],[x+side*.18,h,.6]];tube(parent,green,path,.07);
      ball(parent,i%2?pink:lilac,x+side*.18,h,.6,.33,.58,.25);leaf(parent,green,x+side*.25,h+.10,.80,.45,side*.4,.18);
      for(let j=0;j<4;j++)ball(parent,pink,x+side*.4,h*.3+j*.25,.45,.10);
    }
  }
  for(let i=0;i<12;i++){const a=.10+(PI-.2)*i/11,r=3.02;flower(parent,i%2?pink:lilac,stone,Math.cos(a)*r,4.70+Math.sin(a)*r,.95,.25+(i%3)*.07);}
  butterfly(parent,lilac,stone,-1.15,9.05,.45,.75,-.25);butterfly(parent,pink,stone,1.15,8.90,.4,.48,.4);butterfly(parent,lilac,stone,3.8,6.1,1.0,.38,-.25);
  tube(parent,green,[[-2.0,8.30,.2],[-1,8.8,.3],[0,8.30,.3],[1.0,9.2,.3],[2.5,8.1,.3]],.065);
  tube(parent,green,[[-1.9,7.05,.40],[-2.15,7.7,.30],[-2,8.30,.2]],.08);
  tube(parent,green,[[0,7.78,.40],[.15,8.1,.3],[0,8.30,.3]],.08);
  flower(parent,pink,stone,.1,8.95,.4,.6);
  parent.userData.motif='弯曲花茎、双色花苞、串珠枝条、蝴蝶与攀援藤';
  parent.userData.referenceFolder='D:/怪诞花园';
}

function windGod(parent,stone,gold,sculptures){
  // Reinterpret the existing CC0 winged classical figure with wind scrolls and
  // laurel. The intact museum geometry is shared, never reduced or re-exported.
  plinth(parent,stone,gold,3.55,.25,.65,1.65);
  const figure=mesh(parent,sculptures.gabriel,stone,3.55,1.24,.62,'zephyrus-classical-winged-figure');figure.scale.setScalar(6.0);
  for(let i=0;i<4;i++)tube(parent,stone,[[3.2,5.4,.95],[2.45-i*.18,5.85+i*.28,1.15],[1.4-i*.25,6.8+i*.30,1.05],[.8-i*.3,8.25+i*.23,.45],[-.5-i*.2,8.6+i*.16,.4]],.045+i*.009,64);
  for(const side of[-1,1]){
    volute(parent,stone,side*1.70,8.45,.30,.60,side);volute(parent,gold,side*1.7,8.45,.40,.47,side);
    for(let j=0;j<10;j++){const a=j/9*PI*.67;leaf(parent,stone,side*(.34+Math.sin(a)*1.50),8.15+Math.cos(a)*.7,.23,.38,-side*a,.13);}
  }
  parent.userData.motif='古典羽翼风神主题雕塑、月桂叶、风卷衣褶与气流卷饰';
  parent.userData.sculptureSubject='Zephyrus-themed reinterpretation of the existing CC0 winged figure';
}

function clockTexture(){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;const ctx=canvas.getContext('2d');ctx.translate(512,512);ctx.fillStyle='#b3a88f';ctx.beginPath();ctx.arc(0,0,508,0,TAU);ctx.fill();
  ctx.strokeStyle='#d9c99f';ctx.lineWidth=3;for(const r of[493,467,345]){ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();}
  const romans=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#f6efdb';ctx.font='48px Georgia';
  for(let i=0;i<60;i++){const a=i/60*TAU;ctx.save();ctx.rotate(a);ctx.fillRect(-1.5,-460,3,i%5===0?30:11);ctx.restore();}
  for(let i=0;i<12;i++){const a=i/12*TAU;ctx.fillText(romans[i],Math.sin(a)*402,-Math.cos(a)*402);}
  ctx.fillStyle='#d9c99f';ctx.font='22px Georgia';ctx.fillText('VIII',0,-180);ctx.font='italic 28px Georgia';ctx.fillText('The Eighth Day',0,180);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}
function clockCrown(parent,stone,gold){
  const y=9.14,r=1.62;
  mesh(parent,new THREE.CylinderGeometry(r,r,.24,96).rotateX(PI/2),stone,0,y,.25);
  mesh(parent,new THREE.CircleGeometry(r*.94,96),new THREE.MeshBasicMaterial({map:clockTexture(),side:THREE.DoubleSide}),0,y,.39,'giant-eighth-day-clock');
  for(const radius of[r,r+.13,r+.23])ring(parent,stone,radius,.055,0,y,.37);
  for(let i=0;i<48;i++){const a=i/48*TAU,m=box(parent,stone,.10,.18,.20,Math.sin(a)*(r+.28),y+Math.cos(a)*(r+.28),.25);m.rotation.z=-a;}
  for(const [length,angle,width]of[[.82,PI*4/3,.07],[1.20,PI*.28,.04]]){const root=new THREE.Group();root.position.set(0,y,.45);root.rotation.z=-angle;parent.add(root);box(root,gold,width,length,.055,0,length/2,0);ball(root,stone,0,length,.01,.08,.15,.04);}
  ball(parent,gold,0,y,.50,.13,.13,.06);
  for(const side of[-1,1]){tube(parent,stone,[[side*1.45,8.1,.10],[side*2.4,8.3,.20],[side*3.1,7.1,.20]],.12);volute(parent,stone,side*2.8,7.7,.20,.5,side);}
  for(let i=0;i<3;i++){const root=new THREE.Group();root.position.set(-3.8+i*.18,4.3-i*.85,.72);const cr=.25+i*.06;ring(root,gold,cr,.045,0,0,0);for(let j=0;j<10;j++){const a=j/10*TAU,m=box(root,stone,.09,.12,.08,Math.sin(a)*cr,Math.cos(a)*cr,0);m.rotation.z=-a;}parent.add(root);}
  parent.userData.motif='巨型罗马数字钟盘、双指针、齿轮与涡卷托架';
}

function octopus(parent,pink,stone,gold,x,y,z,scale=1){
  const root=new THREE.Group();root.position.set(x,y,z);root.scale.setScalar(scale);parent.add(root);
  ball(root,pink,0,.65,0,.74,.85,.61);
  for(let i=0;i<8;i++){
    const a=i/8*TAU,sa=Math.sin(a),ca=Math.cos(a),points=[[sa*.38,.3,ca*.38],[sa*.86,.08,ca*.86],[sa*1.35,.06,ca*1.35],[sa*1.53,.42,ca*1.53],[sa*1.3,.59,ca*1.3]];
    tube(root,pink,points,.13,32);
    for(let j=0;j<4;j++)ball(root,stone,sa*(.65+j*.17),.035,ca*(.65+j*.17),.065,.028,.065);
  }
  ball(root,stone,0,.69,.59,.34,.38,.12);ball(root,gold,0,.69,.70,.24,.27,.045);ball(root,accent(0x7f547a),0,.69,.75,.14,.18,.025);ball(root,stone,-.055,.80,.78,.055);
}
function pig(parent,pink,stone,gold,x,y,z,scale=1){
  const root=new THREE.Group();root.position.set(x,y,z);root.scale.setScalar(scale);parent.add(root);
  ball(root,pink,0,.57,0,.90,.59,.50);ball(root,pink,-.48,.66,.14,.43,.47,.42);
  ball(root,pink,-.54,.58,.50,.23,.15,.10);
  for(const a of[-.09,.09])ball(root,gold,-.54+a,.58,.60,.035,.045,.018);
  for(const a of[-.20,.17])ball(root,gold,-.5+a,.80,.50,.035,.055,.025);
  for(const a of[-.20,.20]){const ear=ball(root,pink,-.45+a,1.03,.12,.12,.25,.07);ear.rotation.z=a*2;}
  for(const a of[-.55,.5])for(const b of[-.27,.27]){const leg=mesh(root,new THREE.ConeGeometry(.11,.40,8),pink,a,.10,b);leg.rotation.z=PI;}
  tube(root,pink,[[.75,.55,0],[1.03,.58,0],[1.07,.72,0],[.97,.78,.03],[.94,.68,.04]],.04,26);
  for(const side of[-1,1]){tube(root,stone,[[side*.20,1.03,.04],[side*.30,1.31,.05],[side*.43,1.47,.04]],.025,16);tube(root,stone,[[side*.30,1.31,.05],[side*.47,1.29,.05]],.025,12);}
}
function classroomCrown(parent,stone,gold){
  const pink=accent(0xdca8ba),cyan=accent(0x80c0cf);
  box(parent,stone,1.45,.48,1.0,0,8.02,.30);
  octopus(parent,pink,stone,gold,0,8.20,.32,1.10);
  // Armillary sphere recalls the supplied pink octopus scene.
  for(let i=0;i<3;i++){const o=ring(parent,gold,1.72,.025,0,8.95,.25);o.rotation.set(.20+i*.70,i*PI/3,.20);}
  for(const side of[-1,1])plinth(parent,stone,gold,side*3.8,.25,.60,1.65);
  octopus(parent,cyan,stone,gold,-3.8,1.35,.65,.65);pig(parent,pink,stone,gold,3.8,1.55,.65,.95);
  parent.userData.motif='独眼八爪章鱼、粉色小猪、金属天球仪与触手吸盘';
}

export function buildWorkGate({work,index,map,animatedUniforms,mobile,labelTexture,sculptures}){
  const group=new THREE.Group(),architecture=new THREE.Group(),stone=architecturalStone({opacity:.28}),gold=paleInlay(),simple=work.id==='dreams';
  stone.name='pale-gold-work-gate';stone.color.set(C.materials.workGateGold);stone.opacity=C.materials.workGateOpacity;stone.transmission=.22;stone.metalness=0;stone.roughness=.50;stone.emissive.set(0xe9dfc5);stone.emissiveIntensity=.14;
  gold.name='pale-gold-work-gate-inlay';gold.color.set(0xefe3c2);gold.emissive.set(0xf0e4c5);gold.emissiveIntensity=.45;gold.metalness=0;gold.roughness=.50;
  architecture.name='sculpted-work-gate-frame';group.add(architecture);addFrame(architecture,{stone,gold,simple});
  const decorations=new THREE.Group();decorations.name='work-specific-sculptures';architecture.add(decorations);
  const motifs={'yulong-dance':chineseCrown,'hidden-edge':swordCrown,greenhouse:planetCrown,classroom:classroomCrown,'fantastical-garden':gardenCrown,zephyrus:windGod,'eighth-day':clockCrown};
  motifs[work.id]?.(decorations,stone,gold,sculptures);
  // Frames and motifs share softly glowing pale-gold glass with no metallic
  // reflection. Artwork behind the opening keeps its original color.
  architecture.traverse(node=>{
    if(node.material?.isMeshPhysicalMaterial)node.material=stone;
    if(node.name==='giant-eighth-day-clock'){
      const face=stone.clone();face.map=node.material.map;node.material=face;
    }
  });
  // Batch all procedural details by material. Keep themed groups and source
  // metadata for inspection while avoiding hundreds of extra draw calls.
  const recursiveBatch=node=>{for(const child of [...node.children])if(child.isGroup)recursiveBatch(child);batchStaticDetails(node);};recursiveBatch(architecture);
  // Draw the foreground gate after the distant translucent cathedral. The same
  // construction clipping is retained; rear walls no longer wash it grey.
  architecture.traverse(node=>{if(node.isMesh)node.renderOrder=3;});
  const portal=workPortal({work,index,map,animatedUniforms,mobile});group.add(portal.group);
  const plaque=mesh(group,new THREE.BoxGeometry(6.35,.66,.24),stone,0,.42,1.45,'work-title-plinth');
  const label=mesh(group,new THREE.PlaneGeometry(5.8,1.0),new THREE.MeshBasicMaterial({map:labelTexture,transparent:true,depthWrite:false,opacity:.88}),0,.44,1.58,'work-title');label.renderOrder=3;
  group.userData={...architecture.userData,...decorations.userData,work:work.id,portal:portal.group.userData,simple,unifiedGlass:true,finish:'pale-gold-glass',bodyOpacity:C.materials.workGateOpacity};
  return {group,label,curtain:portal.curtain,uniforms:portal.uniforms};
}
