import * as THREE from 'three';
import { addOculusDaylight } from './toledo-sanctuary.js';

const TAU=Math.PI*2;
function tube(points,r=.1){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(48,points.length*2),r,8,false);}
function ring(parent,r,y,material,t=.06){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,160),material);m.rotation.x=Math.PI/2;m.position.y=y;parent.add(m);return m;}
function belt(parent,r,y,w,h,material){const p=[[r-w/2,y-h/2],[r+w/2,y-h/2],[r+w/2,y+h/2],[r-w/2,y+h/2],[r-w/2,y-h/2]].map(v=>new THREE.Vector2(...v));const m=new THREE.Mesh(new THREE.LatheGeometry(p,160),material);parent.add(m);return m;}

export function addReferenceDome({C,hall,foundation,architecture,gold,registerStructure,length,requires,sculptures,frameShape,animatedUniforms}){
  const roof=new THREE.Group();roof.name='cathedral-ribbed-vault';architecture.add(roof);
  const material=new THREE.MeshPhysicalMaterial({color:0xc3d4df,roughness:.28,metalness:.02,transparent:true,opacity:C.materials.treadOpacity,transmission:C.materials.transmission,thickness:C.corridor.treadThickness,ior:1.13,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,emissive:0xece3c9,emissiveIntensity:.08});
  const radius=C.hall.radius-.65,drum=25.4,spring=35.0,crown=C.hall.height-.6,oculus=6.2,bays=C.hall.clerestoryBays;
  const point=(a,t)=>{const r=THREE.MathUtils.lerp(drum,oculus,t);return new THREE.Vector3(Math.sin(a)*r,spring+(crown-spring)*Math.sin(t*Math.PI/2),-Math.cos(a)*r);};
  // The continuous horizontal gallery is the shared capital of the full-height piers.
  for(const [r,y,w,h]of[[radius,27.85,1.5,.60],[radius-.2,28.25,1.9,.24],[28.0,28.8,6.7,.42],[drum,29.16,1.20,.36],[drum,34.82,1.15,.54]])belt(roof,r,y,w,h,material);
  for(const [r,y]of[[radius-.9,27.65],[radius-.9,28.35],[drum-.5,28.55],[drum-.5,29.4],[drum-.5,34.5],[drum-.5,35.12]])ring(roof,r,y,gold,.04);
  const landing=new THREE.Mesh(new THREE.RingGeometry(drum-.60,radius+.65,160),material);landing.rotation.x=-Math.PI/2;landing.position.y=29.2;landing.name='continuous-capital-gallery';roof.add(landing);
  // Slender balusters, moulded handrail and radial supporting pendentives.
  const balusterProfile=[[.12,0],[.14,.08],[.08,.18],[.06,.40],[.11,.62],[.07,.85],[.13,1.0]].map(v=>new THREE.Vector2(...v));
  const balusters=new THREE.InstancedMesh(new THREE.LatheGeometry(balusterProfile,10),material,96),matrix=new THREE.Matrix4();roof.add(balusters);
  for(let i=0;i<96;i++){const a=i/96*TAU;matrix.makeTranslation(Math.sin(a)*(drum-.40),29.3,-Math.cos(a)*(drum-.40));balusters.setMatrixAt(i,matrix);}
  belt(roof,drum-.40,30.36,.40,.18,material);ring(roof,drum-.40,30.48,gold,.035);
  const pierGeometry=new THREE.CylinderGeometry(.62,.72,5.55,14),piers=new THREE.InstancedMesh(pierGeometry,material,bays);piers.name='recessed-drum-piers';roof.add(piers);
  const windowMaterial=new THREE.MeshPhysicalMaterial({map:sculptures.glassAtlas.clone(),color:0xcbdfff,transparent:true,opacity:.32,transmission:.40,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,roughness:.30,emissive:0x8bafff,emissiveIntensity:.50});windowMaterial.map.repeat.set(1/6,1);windowMaterial.map.offset.set(.5,0);windowMaterial.map.needsUpdate=true;
  const windowShape=new THREE.Shape();windowShape.moveTo(-2.1,0);windowShape.lineTo(2.1,0);windowShape.lineTo(2.1,3.4);windowShape.absellipse(0,3.4,2.1,1.6,0,Math.PI,false);windowShape.closePath();const wg=new THREE.ShapeGeometry(windowShape,28),uv=wg.getAttribute('uv');for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+2.1)/4.2,uv.getY(i)/5);
  for(let i=0;i<bays;i++){
    const a=i/bays*TAU,post=a-Math.PI/bays,q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-post);
    matrix.compose(new THREE.Vector3(Math.sin(post)*drum,32.0,-Math.cos(post)*drum),q,new THREE.Vector3(1,1,1));piers.setMatrixAt(i,matrix);
    const group=new THREE.Group();group.position.set(Math.sin(a)*drum,29.65,-Math.cos(a)*drum);group.rotation.y=-a;roof.add(group);
    const surround=new THREE.Mesh(new THREE.ExtrudeGeometry(frameShape(2.27,3.4,1.76,.18),{depth:.38,steps:1,bevelEnabled:false,curveSegments:24}),material);group.add(surround);
    const pane=new THREE.Mesh(wg,windowMaterial);pane.position.z=.22;pane.name='dome-drum-window';group.add(pane);
    for(const x of[-.7,.7]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,4.3,6),gold);m.position.set(x,2.15,.30);group.add(m);}
    const p0=new THREE.Vector3(Math.sin(post)*radius,27.2,-Math.cos(post)*radius),p1=new THREE.Vector3(Math.sin(post)*(radius-2.4),30.0,-Math.cos(post)*(radius-2.4)),p2=new THREE.Vector3(Math.sin(post)*drum,29.0,-Math.cos(post)*drum),curve=new THREE.QuadraticBezierCurve3(p0,p1,p2);
    roof.add(new THREE.Mesh(tube(curve.getPoints(48),.55),material));roof.add(new THREE.Mesh(tube(curve.getPoints(48).map(p=>p.clone().add(new THREE.Vector3(0,-.52,0))),.042),gold));
  }
  // Six rotated layers of substantial interlaced arches reproduce the reference's
  // deep geometric canopy. Each arch crown touches the next, smaller ring.
  const radii=[25.4,21.0,17.3,14.1,11.1,8.4,6.2],heights=[35.0,36.35,37.7,39.0,40.25,41.35,42.4];
  for(let layer=0;layer<6;layer++){
    const r=radii[layer],next=radii[layer+1],y=heights[layer],rise=heights[layer+1]-y,offset=(layer%2)*Math.PI/8;
    ring(roof,r,y,material,.23);ring(roof,r,y-.18,gold,.034);
    for(let i=0;i<8;i++){
      const a=i/8*TAU+offset,p0=new THREE.Vector3(Math.sin(a-Math.PI/4)*r,y,-Math.cos(a-Math.PI/4)*r),p2=new THREE.Vector3(Math.sin(a+Math.PI/4)*r,y,-Math.cos(a+Math.PI/4)*r),controlR=2*next-r*Math.SQRT1_2,control=new THREE.Vector3(Math.sin(a)*controlR,y+2*rise,-Math.cos(a)*controlR),curve=new THREE.QuadraticBezierCurve3(p0,control,p2),points=curve.getPoints(64);
      const arch=new THREE.Mesh(tube(points,.62-layer*.040),material);arch.name='interlaced-dome-arch';roof.add(arch);roof.add(new THREE.Mesh(tube(points.map(p=>p.clone().add(new THREE.Vector3(0,-.56+layer*.035,0))),.035),gold));
    }
  }
  // Fresco panels sit behind the lattice and leave its open centre unobstructed.
  for(let i=0;i<16;i++){
    const a=i/16*TAU,positions=[],uvs=[],indices=[];
    for(let j=0;j<=16;j++)for(let k=0;k<=8;k++){const p=point(a+k/8*TAU/16,j/16);positions.push(p.x,p.y,p.z);uvs.push(.5+p.x/(drum*2),.5+p.z/(drum*2));}
    for(let j=0;j<16;j++)for(let k=0;k<8;k++){const n=j*9+k;indices.push(n,n+1,n+9,n+1,n+10,n+9);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();const glass=new THREE.Mesh(geometry,material);glass.name='glass-vault-panel';roof.add(glass);
    const muralMaterial=new THREE.MeshPhysicalMaterial({map:sculptures.fresco,transmission:.001,transparent:true,opacity:.45,depthWrite:false,roughness:.94,side:THREE.DoubleSide,color:0xe5e8ed,emissiveMap:sculptures.fresco,emissive:0xffffff,emissiveIntensity:.07});const mural=new THREE.Mesh(geometry,muralMaterial);mural.position.y=.04;mural.renderOrder=-2;mural.name='translucent-ceiling-fresco';roof.add(mural);
  }
  // Statues occupy selected drum piers and cornice nodes, leaving the arch webs clear.
  const statueMaterial=new THREE.MeshPhysicalMaterial({color:0xdde6ee,transparent:true,opacity:.64,transmission:.18,roughness:.30,thickness:.45,ior:1.13,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true});
  for(let i=0;i<8;i++){
    const a=(i*2+.5)/16*TAU,group=new THREE.Group();group.position.set(Math.sin(a)*(drum-.85),30.0,-Math.cos(a)*(drum-.85));group.rotation.y=-a;const statue=new THREE.Mesh(i%2?sculptures.madonna:sculptures.gabriel,statueMaterial);statue.scale.setScalar(3.6);statue.renderOrder=4;group.add(statue);roof.add(group);
    const bracket=new THREE.Mesh(new THREE.CylinderGeometry(.85,.50,.35,12),material);bracket.position.set(group.position.x,29.8,group.position.z);roof.add(bracket);
  }
  ring(roof,oculus,crown,material,.32);ring(roof,oculus-.12,crown-.12,gold,.07);
  roof.userData={vaultReliefGroups:8,windowReliefConnections:16,maxCarvingJointGap:0,columnToOculus:true,oculusRadius:oculus,capitalTransitions:16,columnTopTerraces:1,terraceSize:{width:radius*2,depth:6.7,thickness:1.1},transitionThickness:1.1,transitionRibsPerCapital:3,transitionLeavesPerCapital:0,transitionTangentAlignment:1,reliefSubjects:['Madonna and Child','Archangel Gabriel','winged putti'],interlacedArches:48,drumWindows:16};
  const state=registerStructure(roof,{trigger:length-12,duration:6.2,requires,kind:'cathedral-vault'});addOculusDaylight({C,hall,foundation,animatedUniforms,registerStructure,length,requires:[state]});return state;
}
