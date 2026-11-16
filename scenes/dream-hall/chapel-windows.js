import * as THREE from 'three';
import { archInlay } from './architectural-inlays.js';
import { batchStaticDetails } from './geometry-batches.js';

function pointed(half,stem,cap,bottom=0){const s=new THREE.Shape();s.moveTo(-half,bottom);s.lineTo(half,bottom);s.lineTo(half,stem);s.quadraticCurveTo(half,stem+cap*.64,0,stem+cap);s.quadraticCurveTo(-half,stem+cap*.64,-half,stem);s.closePath();return s;}
function extrude(shape,depth){return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,curveSegments:32});}
function add(root,g,m,x=0,y=0,z=0,name=''){const mesh=new THREE.Mesh(g,m);mesh.position.set(x,y,z);mesh.name=name;root.add(mesh);return mesh;}

// A window is cut into a complete bay: floor, dado, sill, jambs and spandrel
// physically meet. The bay endpoints use the exact neighbouring pier axes.
export function addChapelWindows({structural,glass,gold,atlas,side,r=17,depth=1.24,frameShape}){
  const wall=glass.clone();wall.opacity=.26;wall.transmission=.42;const frame=glass.clone();frame.opacity=.34;frame.transmission=.40;
  const panes=Array.from({length:3},(_,i)=>{const map=atlas.clone();map.repeat.set(1/6,1);map.offset.set(.5+i/6,0);map.needsUpdate=true;return new THREE.MeshPhysicalMaterial({map,transparent:true,opacity:.34,transmission:.45,emissiveMap:map,emissive:0xffffff,emissiveIntensity:2.4,side:THREE.DoubleSide,depthWrite:false,roughness:.28});});
  let count=0;
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2;if(Math.abs(Math.sin(a)+side)<.10)continue;
    const l=new THREE.Vector3(Math.sin(a-Math.PI/16)*r,0,-Math.cos(a-Math.PI/16)*r*depth),rr=new THREE.Vector3(Math.sin(a+Math.PI/16)*r,0,-Math.cos(a+Math.PI/16)*r*depth),tangent=rr.clone().sub(l),half=tangent.length()/2;
    const group=new THREE.Group();group.name='chapel-integrated-window-bay';group.position.copy(l).add(rr).multiplyScalar(.5);group.rotation.y=-Math.atan2(tangent.z,tangent.x);structural.add(group);
    const sillY=6.65,windowHalf=1.55,stem=12.65,cap=2.2,windowShape=pointed(windowHalf,stem,cap,sillY),shape=pointed(half+.10,15,4.25);shape.holes.push(new THREE.Path(windowShape.getPoints(48).map(p=>p.clone())));
    add(group,extrude(shape,.66),wall,0,0,-.36,'chapel-window-bearing-wall');
    const surround=pointed(windowHalf+.30,stem,cap+.30,sillY-.28);surround.holes.push(new THREE.Path(windowShape.getPoints(48).map(p=>p.clone())));add(group,extrude(surround,.42),frame,0,0,.23,'chapel-window-moulded-surround');
    const g=new THREE.ShapeGeometry(windowShape,32),uv=g.getAttribute('uv');for(let j=0;j<uv.count;j++)uv.setXY(j,(uv.getX(j)+windowHalf)/(windowHalf*2),(uv.getY(j)-sillY)/(stem+cap-sillY));add(group,g,panes[i%3],0,0,.51,'chapel-embedded-stained-glass');
    for(const x of[-1.91,1.91]){add(group,new THREE.BoxGeometry(.22,15.15,.48),frame,x,7.575,.28);add(group,new THREE.CylinderGeometry(.026,.026,15.1,6),gold,x,7.55,.56);}
    for(const [y,w,h]of[[.20,half*2,.40],[.58,half*2,.16],[sillY-.22,3.98,.32],[sillY+.015,3.75,.10],[15.18,half*2,.18]]){add(group,new THREE.BoxGeometry(w,h,.92),frame,0,y,.06);add(group,new THREE.BoxGeometry(w,.024,.025),gold,0,y+h/2+.02,.55);}
    add(group,new THREE.ExtrudeGeometry(frameShape(1.30,3.7,1.40,.14,true),{depth:.20,bevelEnabled:false,curveSegments:24}),frame,0,.82,.32);
    add(group,archInlay(1.57,6,2.2,true,.032),gold,0,sillY,.57,'chapel-continuous-window-lead');add(group,archInlay(half,15,4.25,true,.045),gold,0,0,.37);
    for(const y of[8.1,9.8,11.5])add(group,new THREE.BoxGeometry(3.08,.034,.045),gold,0,y,.58);
    group.userData={supported:true,sillY,wallBottom:0,wallTop:19.25,pierJointGap:0};batchStaticDetails(group);count++;
  }
  return count;
}
