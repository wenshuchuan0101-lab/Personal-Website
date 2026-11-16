import * as THREE from 'three';
import { classicalColumn } from './architectural-details.js';
import { architecturalStone } from './baroque-materials.js';
import { batchStaticDetails } from './geometry-batches.js';
const TAU=Math.PI*2;
function add(root,g,m,name=''){const mesh=new THREE.Mesh(g,m);mesh.name=name;root.add(mesh);return mesh;}
function tube(points,r=.08){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r,7,false);}
function arch(half,stem,cap,bottom=0){const s=new THREE.Shape();s.moveTo(-half,bottom);s.lineTo(half,bottom);s.lineTo(half,stem);s.absellipse(0,stem,half,cap,0,Math.PI,false);s.closePath();return s;}

// St Peter's-inspired ribbed cupola: a tall clerestory drum, paired columns,
// sixteen painted compartments, a raised double shell and a columned lantern.
export function addChapelCupola({root,glass,gold,sculptures,r=17,depth=1.24}){
  const roof=new THREE.Group();roof.name='chapel-saint-peter-cupola';root.add(roof);
  const stone=architecturalStone({color:0xbac7cd}),drumBase=19.25,spring=27.15,rise=20.4,holeRadius=1.95,end=Math.acos(Math.pow(holeRadius/r,1/.88)),top=spring+rise*Math.sin(end);
  const point=(a,t,offset=0)=>{const rr=r*Math.pow(Math.cos(t),.88)+offset;return new THREE.Vector3(Math.sin(a)*rr,spring+rise*Math.sin(t),-Math.cos(a)*rr*depth);};
  const column=classicalColumn(THREE,7.62,.42),posts=new THREE.InstancedMesh(column.body,stone,32),inlays=new THREE.InstancedMesh(column.trim,gold,32),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),axis=new THREE.Vector3(0,1,0),one=new THREE.Vector3(1,1,1);posts.name='cupola-paired-drum-columns';roof.add(posts,inlays);
  let maxColumnGap=0;
  for(let i=0;i<16;i++){
    const a=(i+.5)/16*TAU,p=new THREE.Vector3(Math.sin(a)*r,drumBase,-Math.cos(a)*r*depth),tangent=new THREE.Vector3(Math.cos(a),0,Math.sin(a)*depth).normalize();q.setFromAxisAngle(axis,-a);
    for(const side of[-1,1]){const center=p.clone().addScaledVector(tangent,side*.43);matrix.compose(center,q,one);posts.setMatrixAt(i*2+(side>0?1:0),matrix);inlays.setMatrixAt(i*2+(side>0?1:0),matrix);}
    maxColumnGap=Math.max(maxColumnGap,Math.abs((drumBase+7.62)-spring));
    const b=i/16*TAU,l=new THREE.Vector3(Math.sin(b-Math.PI/16)*r,0,-Math.cos(b-Math.PI/16)*r*depth),rr=new THREE.Vector3(Math.sin(b+Math.PI/16)*r,0,-Math.cos(b+Math.PI/16)*r*depth),tan=rr.clone().sub(l),half=tan.length()/2;
    const bay=new THREE.Group();bay.position.copy(l).add(rr).multiplyScalar(.5);bay.position.y=drumBase;bay.rotation.y=-Math.atan2(tan.z,tan.x);roof.add(bay);
    const shape=new THREE.Shape();shape.moveTo(-half,0);shape.lineTo(half,0);shape.lineTo(half,7.9);shape.lineTo(-half,7.9);shape.closePath();const window=arch(half*.63,5.0,1.65,.55);shape.holes.push(new THREE.Path(window.getPoints(40)));
    const wall=add(bay,new THREE.ExtrudeGeometry(shape,{depth:.64,bevelEnabled:true,bevelSize:.045,bevelThickness:.045,bevelSegments:2,curveSegments:32}),stone,'cupola-drum-window-wall');wall.position.z=-.33;
    const glazing=new THREE.MeshPhysicalMaterial({color:0xbfcfd5,transparent:true,opacity:.28,transmission:.44,roughness:.46,thickness:.08,ior:1.12,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,emissive:0x9daeb8,emissiveIntensity:.12});const pane=add(bay,new THREE.ShapeGeometry(window,32),glazing,'cupola-clerestory-window');pane.position.z=-.35;
    const outer=arch(half*.63+.18,5.0,1.83,.36);outer.holes.push(new THREE.Path(window.getPoints(40)));const frame=add(bay,new THREE.ExtrudeGeometry(outer,{depth:.30,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:1,curveSegments:32}),stone,'cupola-moulded-window-surround');frame.position.z=.32;
    const sill=add(bay,new THREE.BoxGeometry(half*1.44,.22,.85),stone);sill.position.set(0,.42,.15);batchStaticDetails(bay);
  }
  for(const [y,t]of[[drumBase,.24],[drumBase+.38,.13],[spring-.35,.30],[spring+.03,.20]]){const rim=add(roof,new THREE.TorusGeometry(r,t,8,128),stone,'cupola-continuous-cornice');rim.rotation.x=Math.PI/2;rim.scale.y=depth;rim.position.y=y;const seam=add(roof,new THREE.TorusGeometry(r+.025,.012,5,128),gold,'cupola-fine-gold-inlay');seam.rotation.copy(rim.rotation);seam.scale.copy(rim.scale);seam.position.y=y+.16;}
  const profile=Array.from({length:49},(_,j)=>{const t=j/48*end;return new THREE.Vector2(r*Math.pow(Math.cos(t),.88)+.34,spring+rise*Math.sin(t)+.13);});const shell=add(roof,new THREE.LatheGeometry(profile,128),stone,'side-cupola-double-shell');shell.scale.z=depth;
  // UVs are divided into sixteen proper painted bays rather than a flat lid.
  const positions=[],uvs=[],indices=[];
  for(let i=0;i<16;i++){
    const offset=positions.length/3;
    for(let v=0;v<=24;v++)for(let u=0;u<=12;u++){const a=(i-.5+u/12)/16*TAU,t=v/24*end,p=point(a,t,-.035);positions.push(p.x,p.y,p.z);uvs.push((i%4+u/12)/4,.04+v/24*.92);}
    for(let v=0;v<24;v++)for(let u=0;u<12;u++){const k=offset+v*13+u;indices.push(k,k+1,k+13,k+1,k+14,k+13);}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();const paint=new THREE.MeshPhysicalMaterial({map:sculptures.fresco,color:0xf2ece0,roughness:.93,metalness:0,transparent:false,opacity:1,transmission:0,depthWrite:true,side:THREE.FrontSide,emissiveMap:sculptures.fresco,emissive:0xffffff,emissiveIntensity:.14});add(roof,geometry,paint,'side-chapel-painted-dome');
  for(let i=0;i<16;i++){
    const a=(i+.5)/16*TAU,tangent=new THREE.Vector3(Math.cos(a),0,Math.sin(a)*depth).normalize(),curve=Array.from({length:65},(_,j)=>point(a,j/64*end,-.22));
    for(const sign of[-1,1])add(roof,tube(curve.map(p=>p.clone().addScaledVector(tangent,sign*.18)),.145),stone,'cupola-paired-meridional-rib');add(roof,tube(curve.map(p=>p.clone().addScaledVector(new THREE.Vector3(Math.sin(a),0,-Math.cos(a)),-.17)),.012),gold,'cupola-fine-gold-inlay');
  }
  // Lantern columns continue the rib rhythm above the real oculus.
  for(const y of[top-.05,top+.30,top+4.7]){const rim=add(roof,new THREE.TorusGeometry(holeRadius+.32,.14,8,64),stone,'cupola-lantern-cornice');rim.rotation.x=Math.PI/2;rim.scale.y=depth;rim.position.y=y;}
  for(let i=0;i<8;i++){
    const a=i/8*TAU,p=new THREE.Vector3(Math.sin(a)*(holeRadius+.30),top+.10,-Math.cos(a)*(holeRadius+.30)*depth),tangent=new THREE.Vector3(Math.cos(a),0,Math.sin(a)).normalize();
    for(const sign of[-1,1]){const column=add(roof,new THREE.CylinderGeometry(.11,.15,4.45,12),stone,'cupola-lantern-paired-column');column.position.copy(p).addScaledVector(tangent,sign*.20);column.position.y+=2.225;}
  }
  const cap=new THREE.SphereGeometry(holeRadius+.36,48,24,0,TAU,0,Math.PI/2);cap.scale(1,1.20,depth);const lanternCap=add(roof,cap,stone,'cupola-lantern-round-cap');lanternCap.position.y=top+4.7;const finial=add(roof,new THREE.ConeGeometry(.27,1.65,12),stone,'cupola-small-finial');finial.position.y=top+8.22;
  const light=new THREE.PointLight(0xffead6,95,42,1.8);light.position.set(0,39,0);roof.add(light);
  roof.userData={reference:'St Peter\'s Basilica',ribBays:16,pairedRibs:32,drumWindows:16,drumBase,springHeight:spring,oculusHeight:top,topHeight:top+9.045,pairedColumns:32,lantern:true,doubleShell:true,columnToSpringGap:maxColumnGap};batchStaticDetails(roof);return roof;
}
