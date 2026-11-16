import * as THREE from 'three';
import { archInlay } from './architectural-inlays.js';
import { monumentalPortal } from './monumental-portals.js';
import { addChapelSupports } from './chapel-supports.js';
import { addChapelWindows } from './chapel-windows.js';
import { batchStaticDetails } from './geometry-batches.js';
import { sculptureMarble,architecturalStone } from './baroque-materials.js';
import { addChapelPierCarvings } from './baroque-carvings.js';
import { addChapelCupola } from './chapel-cupolas.js';
const TAU=Math.PI*2;
function tube(points,r=.04){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r,7,false);}
function add(parent,g,material,x=0,y=0,z=0){const m=new THREE.Mesh(g,material);m.position.set(x,y,z);parent.add(m);return m;}

export function addSacredEnsemble({parent,sculptures,glass,gold,scale=1}){
  const group=new THREE.Group();group.name='focused-sacred-ensemble';group.scale.setScalar(scale);parent.add(group);const ivory=sculptureMarble(),back=architecturalStone({color:0xbebeb7});
  for(const [r,h,y]of[[4.3,.30,.15],[3.9,.30,.45],[3.25,1.3,1.25],[3.65,.25,2.025]])add(group,new THREE.CylinderGeometry(r,r+.03,h,48),ivory,0,y,.6);
  add(group,new THREE.CylinderGeometry(2.5,2.8,.90,32),ivory,0,2.58,.55);
  // Replace the translucent picture with a complete, opaque 3D carved figure.
  const mary=add(group,sculptures.madonna,ivory,0,3.1,.45);mary.name='altar-three-dimensional-madonna';mary.scale.setScalar(8.8);mary.receiveShadow=true;
  for(const side of[-1,1]){
    const angel=add(group,sculptures.gabriel,ivory,side*4.3,3.2,.15);angel.scale.setScalar(4.7);angel.name='altar-embedded-angel';angel.receiveShadow=true;
    for(const [r,h,y]of[[1.4,.22,2.0],[1.1,.90,2.55],[1.35,.20,3.10]])add(group,new THREE.CylinderGeometry(r,r,h,20),ivory,side*4.3,y,.2);
    // A full-height sculpted pier supports both tiers of upper putti.
    add(group,new THREE.BoxGeometry(2.2,17.2,1.4),back,side*6.6,8.6,-.25);
    for(const y of[.3,8.3,12.1,16.2,17.4])add(group,new THREE.BoxGeometry(2.8,.28,2.5),ivory,side*6.6,y,.30);
    for(let tier=0;tier<2;tier++){
      const bottom=12.25+tier*4.1,putto=add(group,sculptures.putto,ivory,side*6.6,bottom,.40);putto.scale.setScalar(tier?2.0:2.55);putto.rotation.z=-side*.15;putto.name='altar-pier-mounted-putto';
    }
    for(let j=0;j<8;j++){
      const y=.8+j*2.1,points=Array.from({length:41},(_,k)=>{const t=k/40,a=t*Math.PI*3,r=.66*(1-t*.86);return new THREE.Vector3(side*(6.6+Math.cos(a)*r),y+Math.sin(a)*r,.65);});add(group,tube(points,.13),ivory);
    }
  }
  const rays=new THREE.InstancedMesh(new THREE.CylinderGeometry(.010,.025,1,6),gold,112),matrix=new THREE.Matrix4(),q=new THREE.Quaternion();rays.name='altar-pale-glory-rays';group.add(rays);
  for(let i=0;i<112;i++){const a=i/112*TAU,len=2.6+(i%3)*.85,dir=new THREE.Vector3(Math.sin(a),Math.cos(a),0),p=new THREE.Vector3(0,11.5,-.70).addScaledVector(dir,3.1+len/2);q.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);matrix.compose(p,q,new THREE.Vector3(1,len,1));rays.setMatrixAt(i,matrix);}
  const canopy=add(group,archInlay(6.6,10.1,8.0,false,.42),ivory,0,0,-.25);canopy.name='continuous-stone-retable-canopy';add(group,archInlay(6.6,10.1,8.0,false,.06),gold,0,0,.20);
  group.userData={trueThreeDimensionalSculptures:true,unifiedMarble:true,figures:7,integratedRetable:true};return group;
}

export function addChapelWings({C,hall,foundation,architecture,glass,gold,sculptures,frameShape,registerStructure,length,clerestoryState,vaultState,windowState,floorMaterial}){
  const cx=C.hall.radius*C.hall.stretch+15,r=17,depth=1.24;
  const obstacles=[];hall.userData.supportObstacles=obstacles;
  // The apse is a dense focal group; long nave walls and most arch webs stay open.
  const apse=new THREE.Group();apse.name='main-apse';apse.position.set(0,0,-C.hall.radius+2.2);architecture.add(apse);apse.scale.set(1/C.hall.stretch,1,1/C.hall.depthStretch);addSacredEnsemble({parent:apse,sculptures,glass,gold,scale:1.2});registerStructure(apse,{trigger:length-10,duration:4.6,kind:'main-apse'});
  for(const side of[-1,1]){
    const root=new THREE.Group();root.name=side<0?'west-side-chapel':'east-side-chapel';root.position.set(side*cx,0,0);hall.add(root);
    const structural=new THREE.Group();structural.name='side-chapel-wall-structure';root.add(structural);
    addChapelSupports({root:structural,glass,gold,side,cx,depth,obstacles});
    addChapelPierCarvings({structural,sculptures,inlay:gold,side,r,depth,obstacles,cx});
    const floor=add(foundation,new THREE.CircleGeometry(r,96),floorMaterial,side*cx,.023,0);floor.rotation.x=-Math.PI/2;floor.scale.y=depth;floor.name='side-chapel-mirrored-floor-tint';
    const chapelBase=add(foundation,new THREE.CylinderGeometry(r,r-.25,.90,96),glass,side*cx,-.48,0);chapelBase.scale.z=depth;chapelBase.name='side-chapel-thick-foundation';
    const floorEdge=add(foundation,new THREE.TorusGeometry(r-.08,.035,6,96),gold,side*cx,.05,0);floorEdge.rotation.x=-Math.PI/2;floorEdge.scale.y=depth;
    // Side passage remains below the tall nave windows and opens into each chapel.
    const tunnel=new THREE.Group();tunnel.name='side-chapel-connecting-aisle';hall.add(tunnel);
    const inner=C.hall.radius*C.hall.stretch-3,outer=cx-r+4,span=outer-inner;
    const deck=add(foundation,new THREE.BoxGeometry(span+2.0, .12,18),glass,side*(inner+outer)/2,.03,0);
    const portal=monumentalPortal({glass,gold,frameShape,sculptures,half:7.2,stem:13.0,cap:7.0});portal.name='great-side-chapel-doorway';portal.rotation.y=-side*Math.PI/2;portal.position.x=side*(inner+outer)/2;tunnel.add(portal);
    for(const end of[inner,outer]){const rib=add(tunnel,archInlay(7.2,13,7,true,.10),gold,side*end);rib.rotation.y=side*Math.PI/2;}
    for(const sign of[-1,1]){const seam=add(tunnel,new THREE.BoxGeometry(span+2,.08,.12),gold,side*(inner+outer)/2,13,sign*7.2);}
    for(const sign of[-1,1])obstacles.push({x:side*(inner+outer)/2,z:sign*8.6,r:2.1});
    registerStructure(tunnel,{syncWith:clerestoryState,kind:'side-chapel-passage'});
    root.userData.supportedWindows=addChapelWindows({structural,glass,gold,atlas:sculptures.glassAtlas,side,r,depth,frameShape});
    for(const y of[18.7,19.2]){const rim=add(structural,new THREE.TorusGeometry(r,.20,8,96),glass,0,y,0);rim.rotation.x=Math.PI/2;rim.scale.y=depth;}
    const altar=new THREE.Group();altar.position.set(side*10.8,0,0);altar.rotation.y=-side*Math.PI/2;structural.add(altar);addSacredEnsemble({parent:altar,sculptures,glass,gold,scale:.90});
    const cupola=addChapelCupola({root,glass,gold,sculptures,r,depth});
    registerStructure(cupola,{syncWith:vaultState,kind:'side-chapel-vault'});
    const coloredWindows=new THREE.Group();coloredWindows.name='side-chapel-stained-windows';root.add(coloredWindows);root.updateWorldMatrix(true,true);
    for(const pane of structural.getObjectsByProperty('name','chapel-embedded-stained-glass'))coloredWindows.attach(pane);
    batchStaticDetails(coloredWindows);registerStructure(coloredWindows,{syncWith:windowState,kind:'side-chapel-stained-window'});
    batchStaticDetails(structural);
    const bounce=new THREE.PointLight(0xffe7c5,180,43,1.8);bounce.position.set(0,14,0);root.add(bounce);registerStructure(structural,{syncWith:clerestoryState,kind:'side-chapel',onProgress:q=>bounce.intensity=180*q});
  }
  hall.userData.chapelCentres=[-cx,cx];hall.userData.chapelRadius=r;hall.userData.chapelDepth=depth;
}
