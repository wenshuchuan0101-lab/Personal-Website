import * as THREE from 'three';

const TAU=Math.PI*2;
export const CAPITAL_TRANSITION_END=.26;
function merge(parts){
  const positions=[],normals=[];
  for(const source of parts){const g=source.index?source.toNonIndexed():source,p=g.getAttribute('position'),n=g.getAttribute('normal');for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return g;
}
function tube(points,r=.032){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),Math.max(40,points.length*2),r,7,false);}

export function archInlay(half,stem,cap,pointed=false,radius=.032){
  const path=new THREE.CurvePath();path.add(new THREE.LineCurve3(new THREE.Vector3(-half,0,0),new THREE.Vector3(-half,stem,0)));
  if(pointed){path.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-half,stem,0),new THREE.Vector3(-half,stem+cap*.64,0),new THREE.Vector3(0,stem+cap,0)));path.add(new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,stem+cap,0),new THREE.Vector3(half,stem+cap*.64,0),new THREE.Vector3(half,stem,0)));}
  else{const points=Array.from({length:65},(_,i)=>{const a=Math.PI-i/64*Math.PI;return new THREE.Vector3(Math.cos(a)*half,stem+Math.sin(a)*cap,0);});path.add(new THREE.CatmullRomCurve3(points));}
  path.add(new THREE.LineCurve3(new THREE.Vector3(half,stem,0),new THREE.Vector3(half,0,0)));return new THREE.TubeGeometry(path,180,radius<=.13?radius*.45:radius,7,false);
}

// A swept, closed fan rises vertically inside the pier capital, then bends
// smoothly onto the vault. Its final tangent matches the actual roof rib.
export function addCapitalTransitions({roof,point,radius,oculus,spring,crown,material,gold,bays=16}){
  const endT=CAPITAL_TRANSITION_END,end=new THREE.Vector3(0,point(0,endT).y,radius-Math.abs(point(0,endT).z));
  const roofTangent=new THREE.Vector3(0,(crown-spring)*Math.PI/2*Math.cos(endT*Math.PI/2),radius-oculus).normalize();
  const curve=new THREE.CubicBezierCurve3(new THREE.Vector3(0,23.15,0),new THREE.Vector3(0,25.7,0),end.clone().addScaledVector(roofTangent,-2.55),end);
  const width=t=>.90+1.20*Math.sin(Math.PI*t)+(.70-.90)*t;
  const vertices=[],indices=[],normal=new THREE.Vector3();
  const normalAt=t=>{const tangent=curve.getTangent(t).normalize();return new THREE.Vector3(0,-tangent.z,tangent.y);};
  for(let j=0;j<=48;j++){
    const t=j/48,p=curve.getPoint(t),w=width(t);normal.copy(normalAt(t));
    for(const depth of[-.58,.58])for(const side of[-1,1]){const v=p.clone().addScaledVector(normal,depth);v.x=side*w;vertices.push(v.x,v.y,v.z);}
    if(j<48)for(const [u,v]of[[0,1],[1,3],[3,2],[2,0]]){const n=j*4;indices.push(n+u,n+v,n+u+4,n+v,n+v+4,n+u+4);}
  }
  indices.push(0,2,1,1,2,3);const last=48*4;indices.push(last,last+1,last+2,last+1,last+3,last+2);
  const body=new THREE.BufferGeometry();body.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));body.setIndex(indices);body.computeVertexNormals();
  const fanParts=[],trimParts=[];
  for(const side of[-1,1]){
    // Three curved ribs spread from a shared neck and gather into the main rib.
    for(const spread of[.18,.38,.60,.80,1]){
      const points=Array.from({length:61},(_,j)=>{const t=j/60,p=curve.getPoint(t).addScaledVector(normalAt(t),.64);p.x=side*(.20+Math.sin(t*Math.PI)*spread*1.60);return p;});
      fanParts.push(tube(points,.14));trimParts.push(tube(points,.038));
    }
    // A volute under the springing turns the capital's hard edge into a scroll.
    const points=Array.from({length:65},(_,j)=>{const t=j/64,a=t*Math.PI*3,r=.82*(1-.85*t);return new THREE.Vector3(side*(1.12+Math.cos(a)*r),24.65+Math.sin(a)*r,.35+.22*t);});fanParts.push(tube(points,.17));trimParts.push(tube(points,.036));
  }
  const ornamentParts=[],acrossAxis=new THREE.Vector3(1,0,0),frame=new THREE.Matrix4();
  function placedGeometry(geometry,t,x=0,lift=.72){
    const p=curve.getPoint(t).addScaledVector(normalAt(t),lift);p.x=x;frame.makeBasis(acrossAxis,curve.getTangent(t).normalize(),normalAt(t));frame.setPosition(p);return geometry.applyMatrix4(frame);
  }
  // Four double moulding courses wrap the complete depth, making the bracket
  // read as layered construction rather than a thin sheet against the vault.
  for(const t of[.12,.32,.55,.76]){
    const p=curve.getPoint(t),n=normalAt(t),w=width(t)+.06;
    const points=Array.from({length:65},(_,j)=>{const a=j/64*TAU;return p.clone().addScaledVector(acrossAxis,Math.cos(a)*w).addScaledVector(n,Math.sin(a)*.64);});
    ornamentParts.push(tube(points,.075));trimParts.push(tube(points,.027));
  }
  // Acanthus leaves and their central gold veins occupy the spaces between ribs.
  for(const side of[-1,1])for(let row=0;row<5;row++){
    const t=.17+row*.14,x=side*width(t)*.69,vertices=[],indices=[];
    for(let j=0;j<=12;j++)for(let k=0;k<=6;k++){const u=j/12,v=k/3-1,w=.23*Math.sin(Math.PI*u)*(1+.20*Math.cos(u*TAU*4));vertices.push(v*w+side*.23*u,u*.82,.10+.13*Math.sin(u*Math.PI)-.10*v*v);}
    for(let j=0;j<12;j++)for(let k=0;k<6;k++){const m=j*7+k;indices.push(m,m+1,m+7,m+1,m+8,m+7);}
    const leaf=new THREE.BufferGeometry();leaf.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));leaf.setIndex(indices);leaf.computeVertexNormals();ornamentParts.push(placedGeometry(leaf,t,x));
    trimParts.push(placedGeometry(tube(Array.from({length:17},(_,j)=>{const u=j/16;return new THREE.Vector3(side*.23*u,u*.82,.11+.13*Math.sin(u*Math.PI));}),.015),t,x));
  }
  for(const [t,r]of[[.24,.29],[.49,.39],[.72,.28]]){
    const petals=[];
    for(let j=0;j<8;j++){const a=j/8*TAU,g=new THREE.SphereGeometry(1,10,7);g.scale(r*.40,r*.80,.12);g.rotateZ(-a);g.translate(Math.sin(a)*r*.70,Math.cos(a)*r*.70,0);petals.push(g);}
    ornamentParts.push(placedGeometry(merge(petals),t));trimParts.push(placedGeometry(new THREE.TorusGeometry(r*.48,.025,6,48),t,0,.85));
  }
  const fans=merge(fanParts),trim=merge(trimParts),gilding=[];
  const ornaments=merge(ornamentParts);
  // A genuine horizontal landing at every capital gives the transition a
  // readable flat plane, with four stacked cornice courses and curved corbels.
  const terraceParts=[],terraceGold=[];
  function terraceOutline(w,d){
    const x=w/2,z=d/2,r=.12,s=new THREE.Shape();s.moveTo(-x+r,-z);s.lineTo(x-r,-z);s.quadraticCurveTo(x,-z,x,-z+r);s.lineTo(x,z-r);s.quadraticCurveTo(x,z,x-r,z);s.lineTo(-x+r,z);s.quadraticCurveTo(-x,z,-x,z-r);s.lineTo(-x,-z+r);s.quadraticCurveTo(-x,-z,-x+r,-z);return s;
  }
  for(const [w,d,h,bottom]of[[4.2,2.8,.24,24.25],[4.7,3.25,.22,24.49],[5.1,3.6,.54,24.71],[5.5,3.95,.18,25.25]]){
    const outline=terraceOutline(w,d),slab=new THREE.ExtrudeGeometry(outline,{depth:h,steps:1,bevelEnabled:true,bevelSize:.035,bevelThickness:.03,bevelSegments:2,curveSegments:6});slab.rotateX(-Math.PI/2);slab.translate(0,bottom,1.0);terraceParts.push(slab);
    const edge=outline.getSpacedPoints(96).map(p=>new THREE.Vector3(p.x,bottom+h+.035,1.0-p.y));terraceGold.push(tube(edge,.038));
  }
  for(const side of[-1,0,1]){
    const support=new THREE.CubicBezierCurve3(new THREE.Vector3(side*.65,23.35,.15),new THREE.Vector3(side*.8,24.1,.25),new THREE.Vector3(side*1.7,24.45,1.6),new THREE.Vector3(side*1.8,24.55,2.35));
    const points=support.getPoints(48);terraceParts.push(tube(points,.20));terraceGold.push(tube(points.map(p=>p.clone().add(new THREE.Vector3(0,-.10,.12))),.035));
  }
  for(let i=0;i<13;i++){const dentil=new THREE.BoxGeometry(.16,.15,.20);dentil.translate(-2.4+i*.4,25.15,2.78);terraceParts.push(dentil);}
  const terraceGeometry=merge(terraceParts),terraceGoldGeometry=merge(terraceGold);
  for(let i=0;i<bays;i++){
    const a=-Math.PI+(i-.5)*TAU/bays,group=new THREE.Group();group.name='curved-capital-vault-transition';group.position.set(Math.sin(a)*radius,0,-Math.cos(a)*radius);group.rotation.y=-a;roof.add(group);
    const haunch=new THREE.Mesh(body,material);haunch.name='thick-column-vault-haunch';group.add(haunch,new THREE.Mesh(fans,material));const ornamentsMesh=new THREE.Mesh(ornaments,material);ornamentsMesh.name='layered-capital-acanthus-rosettes';group.add(ornamentsMesh);
    const inlay=new THREE.Mesh(trim,gold);inlay.name='capital-fan-gold-inlay';group.add(inlay);
    const terrace=new THREE.Mesh(terraceGeometry,material);terrace.name='column-top-terrace';group.add(terrace);const terraceInlay=new THREE.Mesh(terraceGoldGeometry,gold);terraceInlay.name='column-top-terrace-gold-border';group.add(terraceInlay);
    // Two uninterrupted gold seams run from the column neck to the oculus.
    const across=new THREE.Vector3(Math.cos(a),0,Math.sin(a));
    for(const side of[-1,1]){
      const points=[];
      for(let j=0;j<=48;j++){const t=j/48,p=curve.getPoint(t).addScaledVector(normalAt(t),.64-.20*t);p.x=side*.20;p.applyMatrix4(new THREE.Matrix4().makeRotationY(-a));p.add(group.position);points.push(p);}
      for(let j=1;j<=80;j++){const t=endT+(1-endT)*j/80,dy=(crown-spring)*Math.PI/2*Math.cos(t*Math.PI/2),n=new THREE.Vector3(-Math.sin(a)*dy,-(radius-oculus),Math.cos(a)*dy).normalize();points.push(point(a,t).addScaledVector(n,.44).addScaledVector(across,side*.20));}
      gilding.push(tube(points,.036));
    }
  }
  const seams=new THREE.Mesh(merge(gilding),gold);seams.name='continuous-column-vault-gold-seams';roof.add(seams);
  roof.userData.capitalTransitions=bays;roof.userData.columnTopTerraces=bays;roof.userData.terraceSize={width:5.5,depth:3.95,thickness:1.18};roof.userData.transitionEndT=endT;roof.userData.transitionThickness=1.16;roof.userData.transitionRibsPerCapital=10;roof.userData.transitionLeavesPerCapital=10;roof.userData.transitionTangentAlignment=curve.getTangent(1).normalize().dot(roofTangent);roof.userData.transitionStartY=23.15;
}
