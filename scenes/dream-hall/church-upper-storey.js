import { archInlay } from './architectural-inlays.js';
import * as THREE from 'three';

function merge(parts){const positions=[],normals=[];for(const source of parts){const g=source.index?source.toNonIndexed():source,p=g.getAttribute('position'),n=g.getAttribute('normal');for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));}}const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return result;}
export function gothicPier(height){
  const parts=[],trim=[];
  function put(g,x,y,z){g.translate(x,y,z);parts.push(g);}
  put(new THREE.CylinderGeometry(1.04,1.14,.26,8),0,.10,0);put(new THREE.CylinderGeometry(.93,1.04,.24,8),0,.29,0);
  put(new THREE.CylinderGeometry(.52,.60,height-1.25,12),0,height/2-.05,0);
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,x=Math.sin(a)*.62,z=Math.cos(a)*.62;put(new THREE.CylinderGeometry(.14,.19,height-1.25,8),x,height/2-.05,z);for(const y of[.43,height-.57])put(new THREE.CylinderGeometry(.22,.25,.20,8),x,y,z);}
  for(const [r,y,h]of[[1.0,height-.72,.28],[1.3,height-.45,.28],[1.65,height-.16,.32]])put(new THREE.CylinderGeometry(r,r+.035,h,12),0,y,0);
  for(const [r,y]of[[1.05,.35],[1.0,height-.72],[1.3,height-.32],[1.65,height-.025]]){const g=new THREE.TorusGeometry(r,.025,6,64);g.rotateX(Math.PI/2);g.translate(0,y,0);trim.push(g);}
  for(const a of[-Math.PI/3,0,Math.PI/3]){const x=Math.sin(a)*.62,z=Math.cos(a)*.62+.155;trim.push(tube([new THREE.Vector3(x,.56,z),new THREE.Vector3(x,height-1.20,z)],.022,48));}
  // Broad moulded plinth and torus profiles soften the shaft-to-floor junction.
  const profile=[[1.65,0],[1.65,.12],[1.48,.23],[1.42,.36],[1.20,.48],[1.10,.65],[.94,.77]].map(p=>new THREE.Vector2(...p));parts.push(new THREE.LatheGeometry(profile,32));
  const body=merge(parts),gilding=merge(trim);body.scale(1.18,1,1.18);gilding.scale(1.18,1,1.18);return{body,trim:gilding};
}
function tube(points,radius=.06,segments=40){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments,radius,6,false);}

export function addCathedralClerestory({C,architecture,glass,gold,frameShape,registerStructure,length,requires}){
  const group=new THREE.Group();group.name='gothic-clerestory';architecture.add(group);
  const bays=C.hall.clerestoryBays,radius=C.hall.radius-.65,sector=Math.PI*2/bays,half=radius*Math.sin(sector/2),arcRadius=radius*Math.cos(sector/2),base=.20,height=28.2;
  // One complete mesh per pier runs from floor to capital: no separate lower
  // Roman column row and no change of axis between architectural storeys.
  const pier=gothicPier(height),body=new THREE.InstancedMesh(pier.body,glass,bays),trim=new THREE.InstancedMesh(pier.trim,gold,bays);body.name='full-height-clustered-piers';group.add(body,trim);
  const matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0),one=new THREE.Vector3(1,1,1),mouldings=[];
  const archGold=new THREE.InstancedMesh(archInlay(half-.14,19.5,8.0,true,.040),gold,bays);archGold.name='gothic-arch-gold-inlays';group.add(archGold);
  for(let j=0;j<4;j++){const g=new THREE.ExtrudeGeometry(frameShape(half-j*.22,19.5,8.2-j*.18,.25,true),{depth:.42,steps:1,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:1,curveSegments:32}),m=glass.clone();m.opacity=.36+j*.045;const arches=new THREE.InstancedMesh(g,m,bays);group.add(arches);mouldings.push(arches);}
  const blindGeometry=new THREE.ExtrudeGeometry(frameShape(.48,2.1,1.25,.08,true),{depth:.16,steps:1,bevelEnabled:false,curveSegments:16}),blind=new THREE.InstancedMesh(blindGeometry,glass,bays*8);blind.name='lower-gothic-blind-arcade';group.add(blind);
  // The blind arcade is recessed into a full-height dado, resting on a thick,
  // profiled plinth. Door bays stay open all the way down to the walking floor.
  const footProfile=new THREE.Shape();for(const [i,p]of[[-1.10,0],[-1.10,.18],[-.90,.31],[-.90,.49],[-.68,.60],[-.68,.96],[.72,.96],[.93,.68],[1.02,.30],[1.02,0]].entries())i?footProfile.lineTo(...p):footProfile.moveTo(...p);footProfile.closePath();
  const footWidth=half*2+1.05,footGeometry=new THREE.ExtrudeGeometry(footProfile,{depth:footWidth,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2});footGeometry.rotateY(Math.PI/2);footGeometry.translate(-footWidth/2,0,0);
  const footMaterial=glass.clone();footMaterial.opacity=.38;
  const dadoMaterial=glass.clone();dadoMaterial.opacity=.28;
  const footings=new THREE.InstancedMesh(footGeometry,footMaterial,bays-3),dado=new THREE.InstancedMesh(new THREE.BoxGeometry(footWidth,4.72,.72),dadoMaterial,bays-3),footLines=new THREE.InstancedMesh(new THREE.BoxGeometry(footWidth,.018,.022),gold,(bays-3)*2);footings.name='continuous-profiled-wall-plinth';dado.name='grounded-blind-arcade-backing';footLines.name='fine-ground-plinth-inlays';group.add(footings,dado,footLines);let footIndex=0;
  for(let i=0;i<bays;i++){
    const a=-Math.PI+i*sector,post=a-sector/2;q.setFromAxisAngle(axis,-a);
    if(![0,4,12].includes(i)){
      matrix.compose(new THREE.Vector3(Math.sin(a)*arcRadius,0,-Math.cos(a)*arcRadius),q,one);footings.setMatrixAt(footIndex,matrix);
      matrix.compose(new THREE.Vector3(Math.sin(a)*(arcRadius+.18),2.36,-Math.cos(a)*(arcRadius+.18)),q,one);dado.setMatrixAt(footIndex,matrix);
      for(const [k,y,inset]of[[0,.20,1.12],[1,.98,.70]]){matrix.compose(new THREE.Vector3(Math.sin(a)*(arcRadius-inset),y,-Math.cos(a)*(arcRadius-inset)),q,one);footLines.setMatrixAt(footIndex*2+k,matrix);}footIndex++;
    }
    for(let j=0;j<mouldings.length;j++){const r=arcRadius-j*.16;matrix.compose(new THREE.Vector3(Math.sin(a)*r,base,-Math.cos(a)*r),q,one);mouldings[j].setMatrixAt(i,matrix);}
    matrix.compose(new THREE.Vector3(Math.sin(a)*(arcRadius-.53),base,-Math.cos(a)*(arcRadius-.53)),q,one);archGold.setMatrixAt(i,matrix);
    for(let j=0;j<8;j++){const p=new THREE.Vector3(Math.sin(a)*(arcRadius-.20),.65,-Math.cos(a)*(arcRadius-.20)).add(new THREE.Vector3(Math.cos(a),0,Math.sin(a)).multiplyScalar((j-3.5)*1.04));matrix.compose(p,q,one);if([0,4,12].includes(i))matrix.makeScale(0,0,0);blind.setMatrixAt(i*8+j,matrix);}
    q.setFromAxisAngle(axis,-post);matrix.compose(new THREE.Vector3(Math.sin(post)*radius,0,-Math.cos(post)*radius),q,one);body.setMatrixAt(i,matrix);trim.setMatrixAt(i,matrix);
  }
  // Cornices stop at each monumental doorway; no horizontal bands cross an opening.
  for(const [y,r,t]of[[4.35,radius-.60,.10],[10.05,radius-.60,.15],[10.35,radius-.60,.08],[27.85,radius,.18]]){
    const intervals=y>25?[[0,Math.PI*2]]:[[0,Math.PI/2-.34],[Math.PI/2+.34,Math.PI-.34],[Math.PI+.34,Math.PI*1.5-.34],[Math.PI*1.5+.34,Math.PI*2]];
    for(const [a,b]of intervals){const points=Array.from({length:49},(_,j)=>{const angle=a+(b-a)*j/48;return new THREE.Vector3(Math.sin(angle)*r,y,-Math.cos(angle)*r);});group.add(new THREE.Mesh(tube(points,t,64),glass));group.add(new THREE.Mesh(tube(points.map(p=>p.clone().add(new THREE.Vector3(0,.12,0))),.030,64),gold));}
  }
  group.userData.upperBays=bays;group.userData.capitalWidth=3.894;group.userData.columnReliefGroups=0;group.userData.continuousFrieze=true;group.userData.fullHeightPiers=bays;group.userData.columnAxisOffset=0;
  return registerStructure(group,{trigger:length-22,duration:5.2,requires,kind:'cathedral-clerestory'});
}
