import * as THREE from 'three';
import { archInlay } from './architectural-inlays.js';
import { gothicPier } from './church-upper-storey.js';
import { batchStaticDetails } from './geometry-batches.js';
import { sculptureMarble } from './baroque-materials.js';
function add(root,g,m,x=0,y=0,z=0,name=''){const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.name=name;root.add(mesh);return mesh;}
function upperArch(half,stem,cap){const p=new THREE.CurvePath();p.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-half,stem,0),new THREE.Vector3(-half,stem+cap*.64,0),new THREE.Vector3(0,stem+cap,0)));p.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,stem+cap,0),new THREE.Vector3(half,stem+cap*.64,0),new THREE.Vector3(half,stem,0)));return p;}
function leafGeometry(){const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(-.16,.08,-.29,.20,-.17,.30);s.bezierCurveTo(-.32,.36,-.26,.53,-.11,.52);s.quadraticCurveTo(-.18,.73,0,.92);s.quadraticCurveTo(.18,.73,.11,.52);s.bezierCurveTo(.26,.53,.32,.36,.17,.30);s.bezierCurveTo(.29,.20,.16,.08,0,0);return new THREE.ExtrudeGeometry(s,{depth:.14,bevelEnabled:true,bevelSize:.045,bevelThickness:.06,bevelSegments:2,curveSegments:8});}
export function monumentalPortal({glass,gold,frameShape,sculptures,half=8.2,stem=13.2,cap=7}){
  const root=new THREE.Group();root.name='monumental-open-portal';const dressed=glass.clone();dressed.opacity=.32;dressed.transmission=.42;const carved=glass.clone();carved.opacity=.30;carved.transmission=.42;
  // Continuous 3.4 m deep masonry and seven recessed, moulded archivolts.
  add(root,new THREE.ExtrudeGeometry(frameShape(half+2.45,stem,cap+1.65,1.10,true),{depth:3.4,bevelEnabled:true,bevelSize:.10,bevelThickness:.10,bevelSegments:3,curveSegments:48}),dressed,0,0,-1.7,'portal-deep-load-bearing-arch');
  for(let i=0;i<7;i++){const h=half+.35+i*.29,c=cap+i*.22;add(root,new THREE.ExtrudeGeometry(frameShape(h,stem,c,.35,true),{depth:.60,bevelEnabled:true,bevelSize:.055,bevelThickness:.055,bevelSegments:2,curveSegments:40}),carved,0,0,.9-i*.35,'portal-seven-layer-archivolt');add(root,archInlay(h-.05,stem,c-.05,true,.033),gold,0,0,1.53-i*.35);}
  const pier=gothicPier(stem+.2),matrix=new THREE.Matrix4(),body=new THREE.InstancedMesh(pier.body,dressed,4),trim=new THREE.InstancedMesh(pier.trim,gold,4);root.add(body,trim);let j=0;
  for(const side of[-1,1])for(const z of[-1.05,1.05]){matrix.makeTranslation(side*(half+1.4),0,z);body.setMatrixAt(j,matrix);trim.setMatrixAt(j++,matrix);}
  const leaves=leafGeometry(),relief=sculptureMarble();
  for(const side of[-1,1]){
    const x=side*(half+1.4);
    for(const [w,d,h,y]of[[4.8,5.5,.30,.15],[4.5,5.1,.24,.42],[4.1,4.8,.22,.65],[4.7,5.2,.35,stem-.08],[4.25,4.8,.26,stem+.23]])add(root,new THREE.BoxGeometry(w,h,d),dressed,x,y,0);
    for(const y of[.32,.56,.78,stem+.40])add(root,new THREE.BoxGeometry(4.65,.045,5.22),gold,x,y,0);
    for(let row=0;row<2;row++)for(let k=0;k<12;k++){const a=k/12*Math.PI*2,leaf=add(root,leaves,relief,x+Math.sin(a)*(1.30+row*.28),stem-1.35+row*.53,Math.cos(a)*(1.65+row*.22));leaf.rotation.y=a;leaf.scale.setScalar(row?1.08:.90);}
    for(const dz of[-2.65,2.65])for(const sign of[-1,1]){const points=Array.from({length:41},(_,k)=>{const t=k/40,a=t*Math.PI*3,r=.53*(1-t*.86);return new THREE.Vector3(x+sign*(1.25+Math.cos(a)*r),stem-.35+Math.sin(a)*r,dz);});add(root,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),40,.075,7,false),gold);}
    // Carved figures stand on corbels, inside supported canopies.
    add(root,new THREE.CylinderGeometry(1.15,1.65,.66,16),dressed,x,stem+.74,.70);
    if(sculptures){const angel=add(root,sculptures.gabriel,sculptureMarble(),x,stem+1.07,.70,'portal-guardian-angel');angel.scale.setScalar(3.4);angel.rotation.y=-side*.20;}
    add(root,new THREE.ConeGeometry(1.50,1.7,8),dressed,x,stem+5.20,.7);add(root,new THREE.CylinderGeometry(1.6,1.6,.25,16),dressed,x,stem+4.38,.7);
    for(const offset of[-.90,.90])add(root,new THREE.CylinderGeometry(.12,.15,3.7,8),carved,x+offset,stem+2.5,1.15);
    for(let k=0;k<3;k++)add(root,new THREE.ExtrudeGeometry(frameShape(.36,4.3,1,.11,true),{depth:.18,bevelEnabled:false,curveSegments:20}),carved,x+(k-1)*.90,1.15,2.55,'portal-jamb-blind-tracery');
  }
  // Forty-two wedge-shaped voussoirs follow the outer arch, not floating blocks.
  const course=upperArch(half+1.84,stem,cap+1.20),count=42;
  for(let i=0;i<count;i++){const shape=new THREE.Shape(),points=[];for(const [t,sign]of[[i/count,1],[(i+.94)/count,1],[(i+.94)/count,-1],[i/count,-1]]){const p=course.getPointAt(t),v=course.getTangentAt(t),n=new THREE.Vector3(-v.y,v.x,0);p.addScaledVector(n,sign*.35);points.push(new THREE.Vector2(p.x,p.y));}shape.setFromPoints(points);add(root,new THREE.ExtrudeGeometry(shape,{depth:.35,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1}),i%3===0?dressed:carved,0,0,1.70,'portal-carved-voussoirs');}
  const vine=upperArch(half+.80,stem,cap+.35);add(root,new THREE.TubeGeometry(vine,112,.043,7,false),gold,0,0,1.76);
  const petalShape=new THREE.Shape();petalShape.moveTo(0,0);petalShape.quadraticCurveTo(-.19,.20,0,.43);petalShape.quadraticCurveTo(.19,.20,0,0);const pg=new THREE.ExtrudeGeometry(petalShape,{depth:.10,bevelEnabled:true,bevelSize:.02,bevelThickness:.025,bevelSegments:1,curveSegments:8}),petals=new THREE.InstancedMesh(pg,relief,168),cores=new THREE.InstancedMesh(new THREE.SphereGeometry(.10,10,6),gold,28);root.add(petals,cores);const q=new THREE.Quaternion(),one=new THREE.Vector3(1,1,1);
  for(let i=0;i<28;i++){const p=vine.getPointAt((i+.5)/28);p.z=1.86;matrix.makeTranslation(p.x,p.y,p.z+.10);cores.setMatrixAt(i,matrix);for(let k=0;k<6;k++){q.setFromAxisAngle(new THREE.Vector3(0,0,1),k/6*Math.PI*2);matrix.compose(p,q,one);petals.setMatrixAt(i*6+k,matrix);}}
  const apex=stem+cap+1.65,keystone=add(root,new THREE.BoxGeometry(.9,1.6,1),dressed,0,apex-.28,1.63,'portal-sculpted-keystone');keystone.rotation.z=Math.PI/4;add(root,leaves,gold,0,apex-.62,2.18).scale.setScalar(1.15);
  const outer=upperArch(half+2.45,stem,cap+1.65);for(let i=0;i<=20;i++){const p=outer.getPointAt((i+.3)/21),v=outer.getTangentAt((i+.3)/21),n=new THREE.Vector3(v.y,-v.x,0),leaf=add(root,leaves,relief,p.x,p.y,1.75);leaf.rotation.z=Math.atan2(-n.x,n.y);leaf.scale.setScalar(1.25);}
  root.userData={clearWidth:half*2,clearHeight:stem+cap,archDepth:3.4,archivolts:7,voussoirs:42,rosettes:28};batchStaticDetails(root);return root;
}
export function addGrandEntrance({C,architecture,glass,gold,frameShape,sculptures,registerStructure,length}){
  const root=new THREE.Group();root.name='grand-exterior-entrance';root.scale.set(1/C.hall.stretch,1,1/(C.hall.depthStretch||1));architecture.add(root);const facade=(C.hall.radius-.65)*Math.cos(Math.PI/C.hall.arcadeBays)*(C.hall.depthStretch||1);root.position.z=(facade+6)/(C.hall.depthStretch||1);root.add(monumentalPortal({glass,gold,frameShape,sculptures,half:8.5,stem:14.5,cap:7.4}));root.userData.outsideHall=true;root.userData.vestibuleLength=C.hall.entryVestibule;registerStructure(root,{trigger:length-20,duration:4.8,kind:'grand-entrance'});return root;
}
