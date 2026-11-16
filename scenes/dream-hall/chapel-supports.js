import * as THREE from 'three';
import { gothicPier } from './church-upper-storey.js';
import { batchStaticDetails } from './geometry-batches.js';
const TAU=Math.PI*2;
function line(points,r,material,parent){const g=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),48,r,7,false),m=new THREE.Mesh(g,material);parent.add(m);return m;}
function flyingArch(){
  // Outer abutment at x=25, chapel springing at x=17. A curved underside
  // leaves the aisle open; the deep upper rib actually meets the inner capital.
  const s=new THREE.Shape();s.moveTo(25,11.4);s.quadraticCurveTo(22.7,17.4,17,19.1);s.lineTo(17,20.3);s.quadraticCurveTo(23.2,19.1,25,13.3);s.closePath();
  return new THREE.ExtrudeGeometry(s,{depth:.95,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:2,curveSegments:36});
}
export function addChapelSupports({root,glass,gold,side,cx,depth=1.24,obstacles}){
  const group=new THREE.Group();group.name='chapel-flying-buttress-system';root.add(group);
  const count=16,pier=gothicPier(19.25),body=new THREE.InstancedMesh(pier.body,glass,count),trim=new THREE.InstancedMesh(pier.trim,gold,count),matrix=new THREE.Matrix4();group.add(body,trim);let n=0;
  const angles=Array.from({length:count},(_,i)=>(i+.5)/count*TAU).filter(a=>Math.abs(Math.sin(a)+side)>.10);
  body.count=trim.count=angles.length;
  const buttress=flyingArch();
  for(const a of angles){
    const x=Math.sin(a)*17,z=-Math.cos(a)*17*depth;
    matrix.makeTranslation(x,0,z);body.setMatrixAt(n,matrix);trim.setMatrixAt(n++,matrix);obstacles.push({x:side*cx+x,z,r:1.9});
    const warp=new THREE.Group();warp.scale.z=depth;group.add(warp);const radial=new THREE.Group();radial.rotation.y=Math.PI/2-a;warp.add(radial);
    const arch=new THREE.Mesh(buttress,glass);arch.position.z=-.475;arch.name='chapel-flying-arch';radial.add(arch);
    for(const [w,h,y]of[[3.2,.28,.14],[2.7,.40,.48],[1.65,12.0,6.65],[2.35,.35,12.8],[1.2,5.0,15.48],[1.8,.25,18.1]]){const block=new THREE.Mesh(new THREE.BoxGeometry(w,h,1.9),glass);block.position.set(25,y,0);radial.add(block);}
    for(const y of[.30,.70,12.95,18.25]){const seam=new THREE.Mesh(new THREE.BoxGeometry(y<1?3.15:2.35,.028,1.93),gold);seam.position.set(25,y,0);radial.add(seam);}
    const pinnacle=new THREE.Mesh(new THREE.ConeGeometry(.85,4.0,8),glass);pinnacle.position.set(25,20.2,0);radial.add(pinnacle);
    for(const dz of[-.51,.51])line([new THREE.Vector3(25,12.5,dz),new THREE.Vector3(22.6,17.6,dz),new THREE.Vector3(17,19.75,dz)],.035,gold,radial);
    batchStaticDetails(radial);
  }
  // Continuous diagonal ribs join each capital to the next crown bay, giving
  // a legible network of vault supports instead of disconnected vertical rods.
  for(let i=0;i<count;i++){
    const a=(i+.5)/count*TAU,b=(i+1.5)/count*TAU,p0=new THREE.Vector3(Math.sin(a)*17,19.25,-Math.cos(a)*17*depth),p1=new THREE.Vector3(Math.sin(b)*17,19.25,-Math.cos(b)*17*depth),control=new THREE.Vector3(Math.sin((a+b)/2)*13.0,25.8,-Math.cos((a+b)/2)*13.0*depth),curve=new THREE.QuadraticBezierCurve3(p0,control,p1);
    line(curve.getPoints(40),.29,glass,group);line(curve.getPoints(40).map(p=>p.clone().add(new THREE.Vector3(0,-.28,0))),.033,gold,group);
  }
  batchStaticDetails(group);group.userData.flyingButtresses=angles.length;group.userData.continuousPiers=angles.length;return group;
}
