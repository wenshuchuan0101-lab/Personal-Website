import * as THREE from 'three';
import { addOculusDaylight } from './toledo-sanctuary.js';
import { batchStaticDetails } from './geometry-batches.js';
import { architecturalStone,sculptureMarble } from './baroque-materials.js';
const TAU=Math.PI*2;
function tube(points,r=.05){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r,7,false);}
function ring(parent,r,y,material,t=.08){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,8,128),material);m.rotation.x=Math.PI/2;m.position.y=y;parent.add(m);return m;}
function add(root,g,m,name=''){const mesh=new THREE.Mesh(g,m);mesh.name=name;root.add(mesh);return mesh;}
function archBand(points,planeNormal,width,depth){
  const curve=new THREE.CatmullRomCurve3(points),positions=[],indices=[],corners=[[-1,-.75],[-.75,-1],[.75,-1],[1,-.75],[1,.75],[.75,1],[-.75,1],[-1,.75]];
  for(let i=0;i<=64;i++){const t=i/64,p=curve.getPoint(t),tangent=curve.getTangent(t).normalize(),n=new THREE.Vector3().crossVectors(planeNormal,tangent).normalize();for(const [x,z]of corners){const v=p.clone().addScaledVector(n,x*(typeof width==='function'?width(t):width)/2).addScaledVector(planeNormal,z*(typeof depth==='function'?depth(t):depth)/2);positions.push(v.x,v.y,v.z);}if(i<64)for(let j=0;j<8;j++){const a=i*8+j,b=i*8+(j+1)%8;indices.push(a,b,a+8,b,b+8,a+8);}}
  // Closed ends make joined arch imposts solid rather than open slivers.
  for(let j=1;j<7;j++){indices.push(0,j+1,j);const k=64*8;indices.push(k,k+j,k+j+1);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
function oblong(cx,bottom,width,height){const s=new THREE.Path(),r=width/2;s.moveTo(cx-r,bottom+r);s.absarc(cx,bottom+r,r,Math.PI,TAU,false);s.lineTo(cx+r,bottom+height-r);s.absarc(cx,bottom+height-r,r,0,Math.PI,false);s.closePath();return s;}

export function addGuariniDome({C,hall,foundation,architecture,gold,registerStructure,length,requires,sculptures,frameShape,animatedUniforms}){
  const roof=new THREE.Group();roof.name='cathedral-ribbed-vault';roof.scale.set(1/C.hall.stretch,1,1/C.hall.depthStretch);architecture.add(roof);
  const stone=architecturalStone({color:0x919c91}),carving=architecturalStone({color:0xbcc5b7}),marble=sculptureMarble(),backStone=architecturalStone({color:0x66736a});
  const insetPaint=Array.from({length:4},(_,i)=>{const map=sculptures.fresco.clone();map.repeat.set(.5,.5);map.offset.set((i%2)*.5,Math.floor(i/2)*.5);map.needsUpdate=true;return new THREE.MeshStandardMaterial({map,color:0xf2ece0,roughness:.93,metalness:0,emissiveMap:map,emissive:0xffffff,emissiveIntensity:.14,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});});
  const r=26.4,drumBase=37.0,spring=45.0,crown=C.hall.height-.6,shrink=Math.cos(Math.PI/6),startAngle=Math.PI/6,oculus=3.2,apothem=r*shrink;
  const outer=a=>new THREE.Vector3(Math.sin(a)*(C.hall.radius-.65)*C.hall.stretch,28.16,-Math.cos(a)*(C.hall.radius-.65)*C.hall.depthStretch);
  const inner=a=>{const sector=Math.PI/3,normal=startAngle+Math.PI/6,delta=THREE.MathUtils.euclideanModulo(a-normal+sector/2,sector)-sector/2,rr=apothem/Math.cos(delta);return new THREE.Vector3(Math.sin(a)*rr,drumBase,-Math.cos(a)*rr);};
  function transition(a,branch=0){const p0=outer(a),p3=inner(a+branch);return new THREE.CubicBezierCurve3(p0,p0.clone().add(new THREE.Vector3(0,5.4,0)),new THREE.Vector3(Math.sin(a+branch)*(r+3.6),drumBase,-Math.cos(a+branch)*(r+3.6)),p3);}
  // Sixteen complete painted rib vaults connect the actual capital axes to the
  // drum. No large detached triangular girdle remains under the drum.
  let flyingRibs=0;
  for(let i=0;i<16;i++){
    const sector=TAU/16,positions=[],uvs=[],indices=[];
    for(let j=0;j<=18;j++)for(let k=0;k<=12;k++){const a=(i-.5+k/12)*sector,t=j/18,p=transition(a).getPoint(t);positions.push(p.x,p.y,p.z);uvs.push((i%4+k/12)/4,.08+t*.84);}
    for(let j=0;j<18;j++)for(let k=0;k<12;k++){const n=j*13+k;indices.push(n,n+1,n+13,n+1,n+14,n+13);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();const web=add(roof,g,backStone,'closed-pendentive-vault-web');web.position.y=.30;
    const paint=new THREE.MeshPhysicalMaterial({map:sculptures.fresco,color:0xe0e5e5,roughness:.72,metalness:0,transparent:true,opacity:.58,transmission:.12,thickness:.06,depthWrite:false,forceSinglePass:true,emissiveMap:sculptures.fresco,emissive:0xffffff,emissiveIntensity:.08,side:THREE.DoubleSide});const fresco=add(roof,g,paint,'translucent-ceiling-fresco');fresco.position.y=-.03;
    if(i===0)add(roof,g.clone(),stone,'glass-vault-panel').position.y=.34;
    const a=(i-.5)*sector;
    for(const branch of[0,-.075,.075]){const curve=transition(a,branch),normal=new THREE.Vector3(Math.cos(a),0,Math.sin(a)),points=curve.getPoints(64);add(roof,archBand(points,normal,t=>(branch===0?1.08:.43)*Math.pow(1-t,.72)+.035,t=>(branch===0?.88:.39)*(1-t)+.045),stone,'gothic-capital-flying-rib');add(roof,tube(points.map(p=>p.clone().add(new THREE.Vector3(0,-(branch===0?.37:.16),0))),branch===0?.023:.013),gold,'pale-capital-rib-inlay');flyingRibs++;}
    // Two pointed diagonal branches spring from both columns into this bay's crown.
    const mid=i*sector,key=inner(mid),left=outer((i-.5)*sector),right=outer((i+.5)*sector);
    for(const p0 of[left,right]){const curve=new THREE.CubicBezierCurve3(p0,p0.clone().add(new THREE.Vector3(0,4.4,0)),key.clone().lerp(p0,.22).add(new THREE.Vector3(0,.6,0)),key);const normal=new THREE.Vector3().crossVectors(key.clone().sub(p0),new THREE.Vector3(0,1,0)).normalize();add(roof,archBand(curve.getPoints(64),normal,t=>.52*Math.pow(1-t,.72)+.025,t=>.54*(1-t)+.035),carving,'pointed-diagonal-vault-rib');}
    // Deep capital-to-drum corbels meet the drum cornice, not a suspended rim.
    const joint=add(roof,new THREE.BoxGeometry(.40,.18,.65),stone,'vault-drum-bearing-key');joint.position.copy(inner(a));joint.rotation.y=-a;
  }
  // Complete six-sided drum: massive niche-bearing piers alternate with windows.
  const half=r*.5;
  const glazing=new THREE.MeshPhysicalMaterial({color:0xd7e4df,roughness:.46,metalness:0,transmission:.42,transparent:true,opacity:.30,depthWrite:false,side:THREE.DoubleSide,emissive:0xc0d4ca,emissiveIntensity:.10});
  for(let i=0;i<6;i++){
    const a=startAngle+Math.PI/6+i/6*TAU,post=a-Math.PI/6,group=new THREE.Group();group.position.set(Math.sin(a)*apothem,drumBase-.30,-Math.cos(a)*apothem);group.rotation.y=-a;roof.add(group);
    const s=new THREE.Shape();s.moveTo(-half-.15,0);s.lineTo(half+.15,0);s.lineTo(half+.15,spring-drumBase+.65);s.lineTo(-half-.15,spring-drumBase+.65);s.closePath();
    const hole=new THREE.Path();hole.moveTo(-7.35,.42);hole.lineTo(7.35,.42);hole.lineTo(7.35,4.55);hole.absellipse(0,4.55,7.35,2.45,0,Math.PI,false);hole.closePath();s.holes.push(hole);add(group,new THREE.ExtrudeGeometry(s,{depth:1.7,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:2,curveSegments:40}),stone,'solid-drum-window-wall');
    const paneShape=new THREE.Shape(hole.getPoints(48));const pane=add(group,new THREE.ShapeGeometry(paneShape,32),glazing,'dome-drum-window');pane.position.z=-.07;
    const frame=add(group,new THREE.ExtrudeGeometry(frameShape(7.78,4.55,2.85,.40),{depth:.75,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:2,curveSegments:32}),carving);frame.position.set(0,.10,-.30);
    for(const x of[-4.9,-2.45,0,2.45,4.9]){const mullion=add(group,new THREE.BoxGeometry(.14,5.5,.40),carving);mullion.position.set(x,3.15,-.14);}
    for(const sign of[-1,1]){const pilaster=add(group,new THREE.BoxGeometry(2.1,8.2,2.2),stone);pilaster.position.set(sign*11.6,4.10,.20);for(const y of[.24,7.95]){const cap=add(group,new THREE.BoxGeometry(3.1,.42,2.6),carving);cap.position.set(sign*11.6,y,.18);}}
    // Real carved angels sit inside the drum pier niches.
    const niche=new THREE.Group();niche.position.set(Math.sin(post)*r,drumBase+.45,-Math.cos(post)*r);niche.rotation.y=-post;roof.add(niche);const back=add(niche,new THREE.BoxGeometry(3.3,6.7,1.8),stone);back.position.set(0,3.1,0);const console=add(niche,new THREE.BoxGeometry(3.6,.5,2.7),carving);console.position.set(0,.2,.6);const statue=add(niche,sculptures.gabriel,marble,'drum-pier-embedded-angel');statue.scale.setScalar(5.1);statue.position.set(0,.45,1.1);
    batchStaticDetails(group);
  }
  // A full backing cupola encloses all six orders. Thirty-six carved cells and
  // seventy-two glazed oblong lights sit in front of this closed outer envelope.
  let y=spring,maxSupportGap=0,archCount=0,windowCount=0;const profile=[new THREE.Vector2(r+1.15,spring-.5)];
  const firstRise=(crown-spring)*(1-shrink)/(1-Math.pow(shrink,6));
  for(let level=0;level<6;level++){
    const radius=r*Math.pow(shrink,level),rise=firstRise*Math.pow(shrink,level),offset=startAngle+level*Math.PI/6;
    for(let i=0;i<6;i++){
      const a=offset+i/6*TAU,p0=new THREE.Vector3(Math.sin(a)*radius,y,-Math.cos(a)*radius),p1=new THREE.Vector3(Math.sin(a+Math.PI/3)*radius,y,-Math.cos(a+Math.PI/3)*radius),normal=new THREE.Vector3(Math.sin(a+Math.PI/6),0,-Math.cos(a+Math.PI/6)),points=[];
      for(let j=0;j<=64;j++){const t=j/64,p=p0.clone().lerp(p1,t);p.y+=Math.sin(t*Math.PI)*rise;points.push(p);}
      const width=.88*Math.pow(.81,level);add(roof,archBand(points,normal,width,.66*Math.pow(.81,level)),stone,'guarini-hexagon-arch');archCount++;
      for(const d of[-.26,.26])add(roof,archBand(points.map(p=>p.clone().addScaledVector(normal,-.52).add(new THREE.Vector3(0,d,0))),normal,.075,.085),carving,'guarini-recessed-arch-moulding');
      add(roof,tube(points.map(p=>p.clone().addScaledVector(normal,-.66)),.014),gold,'guarini-pale-arch-edge');
      const key=points[32],nextVertex=new THREE.Vector3(Math.sin(a+Math.PI/6)*radius*shrink,y+rise,-Math.cos(a+Math.PI/6)*radius*shrink);maxSupportGap=Math.max(maxSupportGap,key.distanceTo(nextVertex));
      const impost=add(roof,new THREE.BoxGeometry(2.05*Math.pow(.92,level),.62,1.8*Math.pow(.92,level)),carving,'joined-arch-impost');impost.position.copy(p0);impost.rotation.y=-a;
      const tie=add(roof,new THREE.BoxGeometry(radius+.30,.24,.65),stone,'hexagonal-bearing-course');tie.position.copy(p0).lerp(p1,.5);tie.rotation.y=-a-Math.PI/6;
      // Under each arch a real masonry tympanum contains two oblong lights.
      const cell=new THREE.Group();cell.position.copy(p0).lerp(p1,.5);cell.rotation.y=-a-Math.PI/6;roof.add(cell);const w=radius*.5,shape=new THREE.Shape();shape.moveTo(-w,-.10);for(let j=0;j<=64;j++){const t=j/64;shape.lineTo(-w+t*w*2,Math.sin(t*Math.PI)*rise);}shape.lineTo(w,-.10);shape.closePath();
      for(const sign of[-1,1]){const opening=oblong(sign*w*.34,.15*rise,Math.min(w*.17,rise*.26),rise*.56);shape.holes.push(opening);const pane=add(cell,new THREE.ShapeGeometry(new THREE.Shape(opening.getPoints(32)),32),glazing,'guarini-oblong-glazed-light');pane.position.z=-.88;windowCount++;}
      const web=add(cell,new THREE.ExtrudeGeometry(shape,{depth:.70,bevelEnabled:true,bevelSize:.035,bevelThickness:.035,bevelSegments:2,curveSegments:32}),backStone,'guarini-carved-cell-web');web.position.z=-.82;
      // Fresco fits the arch's blank masonry and retains both real window holes.
      const paintedGeometry=new THREE.ShapeGeometry(shape,48),uv=paintedGeometry.getAttribute('uv');for(let k=0;k<uv.count;k++)uv.setXY(k,(uv.getX(k)+w)/(2*w),uv.getY(k)/rise);
      const paint=add(cell,paintedGeometry,insetPaint[(level+i)%4],'guarini-inset-fresco');paint.position.z=.015;paint.userData.windowHoles=2;

      // Modillions and dentils accent every joint and each arch's crown.
      for(const t of[.18,.38,.50,.62,.82]){const p=points[Math.round(t*64)],dentil=add(roof,new THREE.BoxGeometry(.52,.36,.75),carving,'guarini-stone-modillion');dentil.position.copy(p).addScaledVector(normal,-.52);dentil.position.y-=.22;dentil.rotation.y=-a-Math.PI/6;}
    }
    // Fill the large curved fields BETWEEN arch orders as well as their inset
    // tympana. These lie just inside the existing shell, behind all raised ribs.
    for(let face=0;face<6;face++){
      const positions=[],uvs=[],indices=[];
      for(let v=0;v<=10;v++)for(let u=0;u<=16;u++){
        const t=v/10,a=offset+(face+u/16)/6*TAU,rr=THREE.MathUtils.lerp(radius+1.115,radius*shrink+1.115,t);positions.push(Math.sin(a)*rr,y+rise*t,-Math.cos(a)*rr);uvs.push(u/16,t);
      }
      for(let v=0;v<10;v++)for(let u=0;u<16;u++){const k=v*17+u;indices.push(k,k+1,k+17,k+1,k+18,k+17);}
      const paintedGeometry=new THREE.BufferGeometry();paintedGeometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));paintedGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));paintedGeometry.setIndex(indices);paintedGeometry.computeVertexNormals();add(roof,paintedGeometry,insetPaint[(level+face)%4],'guarini-shell-fresco-field');
    }
    y+=rise;profile.push(new THREE.Vector2(radius*shrink+1.15,y+.25));
  }
  const shell=add(roof,new THREE.LatheGeometry(profile,192),architecturalStone({color:0x737f75}),'closed-upper-cupola-shell');
  const topRadius=r*Math.pow(shrink,6),starShape=new THREE.Shape();for(let i=0;i<24;i++){const a=i/24*TAU,rr=i%2?topRadius*.70:topRadius;i?starShape.lineTo(Math.sin(a)*rr,Math.cos(a)*rr):starShape.moveTo(Math.sin(a)*rr,Math.cos(a)*rr);}starShape.closePath();const hole=new THREE.Path();hole.absarc(0,0,oculus,0,TAU,true);starShape.holes.push(hole);
  for(let i=0;i<12;i++){const a=(i+.5)/12*TAU,petal=new THREE.Path(),pts=[];for(let j=0;j<=48;j++){const t=j/48,rr=oculus+.55+(topRadius*.62-oculus-.55)*Math.sin(t*Math.PI),angle=a+.11*Math.sin(t*TAU);pts.push(new THREE.Vector2(Math.sin(angle)*rr,Math.cos(angle)*rr));}petal.setFromPoints(pts.reverse());starShape.holes.push(petal);}
  const star=add(roof,new THREE.ExtrudeGeometry(starShape,{depth:.60,bevelEnabled:true,bevelSize:.08,bevelThickness:.08,bevelSegments:2}),carving,'guarini-twelve-point-star');star.rotation.x=-Math.PI/2;star.position.y=crown;
  const crownGeometry=new THREE.ShapeGeometry(starShape,64),crownUV=crownGeometry.getAttribute('uv');for(let j=0;j<crownUV.count;j++)crownUV.setXY(j,.5+crownUV.getX(j)/(topRadius*2),.5+crownUV.getY(j)/(topRadius*2));
  const crownPaint=new THREE.MeshStandardMaterial({map:sculptures.fresco,color:0xf2ece0,roughness:.93,metalness:0,emissiveMap:sculptures.fresco,emissive:0xffffff,emissiveIntensity:.14,side:THREE.DoubleSide});const paintedCrown=add(roof,crownGeometry,crownPaint,'guarini-crown-fresco');paintedCrown.rotation.x=-Math.PI/2;paintedCrown.position.y=crown-.015;
  ring(roof,oculus,crown+.05,gold,.085);
  // A small, enclosed glazed lantern caps the crown, not an empty sky opening.
  const capProfile=[new THREE.Vector2(topRadius+1.2,crown+.2),new THREE.Vector2(oculus+.6,crown+3.2),new THREE.Vector2(oculus+.6,crown+4.5),new THREE.Vector2(0,crown+7.2)];add(roof,new THREE.LatheGeometry(capProfile,96),architecturalStone({color:0xd6dcd2}),'enclosed-lantern-roof');
  for(let i=0;i<12;i++){const a=i/12*TAU,post=add(roof,new THREE.CylinderGeometry(.13,.17,4.3,10),carving,'lantern-column');post.position.set(Math.sin(a)*(oculus+.25),crown+2.15,-Math.cos(a)*(oculus+.25));}
  for(const h of[crown+.3,crown+4.4])ring(roof,oculus+.25,h,carving,.16);
  // Soft architectural fill makes carvings and frescoes readable under the canopy.
  for(let i=0;i<4;i++){const a=i/4*TAU,l=new THREE.PointLight(0xe7eee5,58,42,1.8);l.position.set(Math.sin(a)*16,38,-Math.cos(a)*16);roof.add(l);}const topFill=new THREE.PointLight(0xeef2dc,38,28,1.8);topFill.position.set(0,57,0);roof.add(topFill);
  roof.userData={guarini:true,interlacedArches:archCount,hexagonLevels:6,hexagonRotation:30,drumWindows:6,greatInclinedArches:0,removedDetachedGirdle:true,starPoints:12,maxSupportGap,oculusRadius:oculus,circularDome:true,capitalTransitions:16,flyingTransitionRibs:flyingRibs,pointedVaults:16,transitionThickness:1.08,reliefSubjects:['Madonna and Child','Archangel Gabriel','winged putti'],vaultReliefGroups:6,windowReliefConnections:16,maxCarvingJointGap:0,columnToOculus:true,closedUpperShell:true,oblongLights:windowCount,enclosedLantern:true,frescoOpaque:false,taperedRibTips:true,insetFrescoes:36,shellFrescoFields:36,crownFresco:true};
  batchStaticDetails(roof);const state=registerStructure(roof,{trigger:length-12,duration:6.8,requires,kind:'cathedral-vault'});const lightConfig={...C,hall:{...C.hall,stretch:1,depthStretch:1,oculusRadius:oculus}};addOculusDaylight({C:lightConfig,hall,foundation,animatedUniforms,registerStructure,length,requires:[state]});return state;
}
