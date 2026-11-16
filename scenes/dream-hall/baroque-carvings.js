import * as THREE from 'three';
import { sculptureMarble,architecturalStone } from './baroque-materials.js';
import { batchStaticDetails } from './geometry-batches.js';
const TAU=Math.PI*2;
function add(root,g,m,x=0,y=0,z=0,name=''){const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.name=name;root.add(mesh);return mesh;}
function tube(points,r=.08){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,r,7,false);}
function leaf(){const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(-.38,.10,-.54,.35,-.30,.48);s.bezierCurveTo(-.61,.65,-.34,.92,-.18,.85);s.quadraticCurveTo(-.27,1.12,0,1.45);s.quadraticCurveTo(.27,1.12,.18,.85);s.bezierCurveTo(.34,.92,.61,.65,.30,.48);s.bezierCurveTo(.54,.35,.38,.10,0,0);return new THREE.ExtrudeGeometry(s,{depth:.20,bevelEnabled:true,bevelSize:.06,bevelThickness:.08,bevelSegments:2,curveSegments:10});}

// Continuous reredos fixed INTO the pier face, from its plinth to its capital.
// Consoles, backing and climbing scrolls join the figures into the architecture.
export function carvedPier({parent,sculptures,inlay,height=19.25,grand=false}){
  const group=new THREE.Group();group.name='pier-integrated-sculpture-reredos';group.position.z=1.55;parent.add(group);const marble=sculptureMarble(),back=architecturalStone({color:0xbdbbb3}),leaves=leaf();
  const width=grand?3.6:3.0;add(group,new THREE.BoxGeometry(width*.65,height,.80),back,0,height/2,-.18,'sculpture-embedded-backing');
  for(const side of[-1,1]){
    const points=Array.from({length:81},(_,i)=>{const t=i/80;return new THREE.Vector3(side*(width*.40+.24*Math.sin(t*TAU*2)),.25+t*(height-.4),.40+.16*Math.sin(t*TAU*2));});add(group,tube(points,.15),marble);
    for(let j=0;j<8;j++){const y=.9+j*(height-2)/8,leafMesh=add(group,leaves,marble,side*width*.37,y,.45);leafMesh.rotation.z=-side*.46;leafMesh.scale.setScalar(.85);}
  }
  const levels=grand?[[1.2,6.6,'gabriel'],[10.0,6.0,'madonna'],[21.0,4.7,'gabriel']]:[[.95,4.6,'gabriel'],[6.7,4.9,'madonna'],[13.3,4.4,'gabriel'],[18.3,2.35,'putto']];
  let count=0;
  for(const [bottom,size,subject]of levels){
    const corbel=add(group,new THREE.CylinderGeometry(width*.54,width*.26,.56,16),marble,0,bottom-.28,.52,'pier-carved-corbel');corbel.scale.z=.78;
    const statue=add(group,sculptures[subject],marble,0,bottom,.53,'pier-embedded-'+subject);statue.scale.setScalar(size);statue.castShadow=false;statue.receiveShadow=true;count++;
    // Stone scrolls come out of the console and tuck back into the pier.
    for(const side of[-1,1]){const points=Array.from({length:41},(_,j)=>{const t=j/40,a=t*Math.PI*3,r=.63*(1-t*.88);return new THREE.Vector3(side*(width*.35+Math.cos(a)*r),bottom+.30+Math.sin(a)*r,.55);});add(group,tube(points,.11),marble);}
  }
  // Dense acanthus leaves flow across the capital into the arch springing.
  for(let i=0;i<12;i++){const a=i/12*TAU,mesh=add(group,leaves,marble,Math.sin(a)*width*.49,height-1.2,.28+Math.cos(a)*.72);mesh.rotation.y=a;mesh.scale.setScalar(1.05);}
  for(const y of[.16,.50,height-.15])add(group,new THREE.BoxGeometry(width+.7,.16,1.8),marble,0,y,.28);
  add(group,new THREE.BoxGeometry(width+.45,.035,1.85),inlay,0,height+.01,.28);
  group.userData={embedded:true,sculptures:count,continuousFromFloor:true,height};batchStaticDetails(group);return group;
}

export function addMainPierCarvings({C,hall,sculptures,inlay,registerStructure,length,requires}){
  const root=new THREE.Group();root.name='main-pier-baroque-sculptures';hall.add(root);
  for(let i=0;i<16;i++){
    const a=-Math.PI+(i-.5)/16*TAU,anchor=new THREE.Group();anchor.position.set(Math.sin(a)*(C.hall.radius-.65)*C.hall.stretch,0,-Math.cos(a)*(C.hall.radius-.65)*C.hall.depthStretch);anchor.rotation.y=Math.atan2(-Math.sin(a)/C.hall.stretch,Math.cos(a)/C.hall.depthStretch);root.add(anchor);carvedPier({parent:anchor,sculptures,inlay,height:28.2,grand:true});
  }
  registerStructure(root,{trigger:length-18,duration:5.8,requires,kind:'main-pier-carvings'});return root;
}

export function addChapelPierCarvings({structural,sculptures,inlay,side,r=17,depth=1.24,obstacles,cx}){
  const root=new THREE.Group();root.name='chapel-baroque-sculpture-columns';structural.add(root);let count=0;
  for(let i=0;i<16;i++){
    const a=(i+.5)/16*TAU;if(i%2!==0||Math.abs(Math.sin(a)+side)<.10)continue;
    const anchor=new THREE.Group();anchor.position.set(Math.sin(a)*r,0,-Math.cos(a)*r*depth);anchor.rotation.y=Math.atan2(-Math.sin(a),Math.cos(a)/depth);root.add(anchor);if(obstacles){const normal=new THREE.Vector2(-Math.sin(a),Math.cos(a)/depth).normalize();obstacles.push({x:side*cx+anchor.position.x+normal.x*1.8,z:anchor.position.z+normal.y*1.8,r:1.95});}carvedPier({parent:anchor,sculptures,inlay,height:19.25});count++;
  }
  root.userData.sculptedPiers=count;return root;
}
