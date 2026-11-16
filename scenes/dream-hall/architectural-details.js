import { addGuariniDome } from './guarini-dome.js';
// Classical mouldings, fluted columns and a glazed cathedral vault.
// Geometry and glass patterns are authored here; no external image assets are used.
export function classicalColumn(THREE,height=7.0,footRadius=.52){
  const parts=[],trim=[],outlines=[],shaftBottom=.62,shaftTop=height-.78;
  const add=(geometry,x=0,y=0,z=0,target=parts)=>{geometry.translate(x,y,z);target.push(geometry);return geometry;};
  function merge(list){const positions=[],normals=[];for(const source of list){const g=source.index?source.toNonIndexed():source,p=g.getAttribute('position'),n=g.getAttribute('normal');for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));}}const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return result;}
  const plinth=new THREE.BoxGeometry(footRadius*2.45,.20,footRadius*2.15);add(plinth,0,.10);outlines.push(plinth.clone());
  const profile=[[footRadius*.96,.20],[footRadius*1.06,.26],[footRadius*1.06,.34],[footRadius*.87,.40],[footRadius*.79,.47],[footRadius*.84,.54],[footRadius*.77,.62]].map(p=>new THREE.Vector2(...p));
  parts.push(new THREE.LatheGeometry(profile,32));
  const vertices=[],indices=[],radials=80,bands=8,flutes=20;
  for(let j=0;j<=bands;j++)for(let i=0;i<=radials;i++){const t=j/bands,a=i/radials*Math.PI*2,r=footRadius*(.76-.14*t+.025*Math.sin(t*Math.PI))*(1-.10*(.5+.5*Math.cos(a*flutes)));vertices.push(Math.sin(a)*r,shaftBottom+t*(shaftTop-shaftBottom),Math.cos(a)*r);}
  for(let j=0;j<bands;j++)for(let i=0;i<radials;i++){const k=j*(radials+1)+i;indices.push(k,k+1,k+radials+1,k+1,k+radials+2,k+radials+1);}
  const shaft=new THREE.BufferGeometry();shaft.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));shaft.setIndex(indices);shaft.computeVertexNormals();parts.push(shaft);
  const neck=[[footRadius*.63,shaftTop-.03],[footRadius*.78,shaftTop+.03],[footRadius*.83,shaftTop+.12],[footRadius*1.07,shaftTop+.25],[footRadius*1.11,shaftTop+.36],[footRadius*1.03,shaftTop+.42]].map(p=>new THREE.Vector2(...p));parts.push(new THREE.LatheGeometry(neck,40));
  const abacus=new THREE.BoxGeometry(footRadius*2.75,.18,footRadius*2.15);add(abacus,0,height-.11);outlines.push(abacus.clone());
  for(const y of[.29,.51,shaftTop+.08,shaftTop+.38]){const rr=y<1?footRadius*(y<.4?1.07:.85):footRadius*(y<shaftTop+.2?.79:1.10);const g=new THREE.TorusGeometry(rr,.012,4,32);g.rotateX(Math.PI/2);add(g,0,y,0,trim);}
  // Paired volutes are real curled tubes, on both faces of the capital.
  for(const face of[-1,1])for(const side of[-1,1]){
    const points=Array.from({length:48},(_,i)=>{const t=i/47,a=Math.PI*.5-t*Math.PI*3.5,rr=footRadius*.43*(1-t*.87);return new THREE.Vector3(side*(footRadius*.77+Math.cos(a)*rr),height-.40+Math.sin(a)*rr,face*footRadius*.78);});
    const tube=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.027,4,false);trim.push(tube);
  }
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2,g=new THREE.SphereGeometry(1,6,6);g.scale(.065,.18,.035);g.rotateX(.32);g.rotateY(a);add(g,Math.sin(a)*footRadius*.83,shaftTop+.24,Math.cos(a)*footRadius*.83);}
  return{body:merge(parts),trim:merge(trim),outline:merge(outlines)};
}

export function addTemplePortico({THREE,C,architecture,glass,gold,registerStructure,length}){
  const group=new THREE.Group();group.name='greek-temple-portico';architecture.add(group);const column=classicalColumn(THREE,10.8,.80),matrix=new THREE.Matrix4();
  const body=new THREE.InstancedMesh(column.body,glass,4),trims=new THREE.InstancedMesh(column.trim,gold,4);group.add(body,trims);let index=0;
  for(const x of[-5.4,5.4])for(const z of[C.hall.radius-.55,C.hall.radius-5.0]){matrix.makeTranslation(x,0,z);body.setMatrixAt(index,matrix);trims.setMatrixAt(index++,matrix);}
  for(const [w,h,d,y] of[[12.8,.30,5.6,10.92],[13.35,.20,5.95,11.17],[13.8,.18,6.1,11.36]]){const beam=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),glass);beam.position.set(0,y,C.hall.radius-2.75);group.add(beam);}
  const triangle=new THREE.Shape();triangle.moveTo(-6.9,0);triangle.lineTo(0,3.35);triangle.lineTo(6.9,0);triangle.closePath();
  const inner=new THREE.Path();inner.moveTo(-5.8,.24);inner.lineTo(5.8,.24);inner.lineTo(0,2.96);inner.closePath();triangle.holes.push(inner);
  const pediment=new THREE.Mesh(new THREE.ExtrudeGeometry(triangle,{depth:.34,steps:1,bevelEnabled:false}),glass);pediment.position.set(0,11.40,C.hall.radius-.15);group.add(pediment);
  const outline=new THREE.LineSegments(new THREE.EdgesGeometry(pediment.geometry),new THREE.LineBasicMaterial({color:0xd2c29e,transparent:true,opacity:.65}));outline.position.copy(pediment.position);group.add(outline);
  const dentils=new THREE.InstancedMesh(new THREE.BoxGeometry(.20,.17,.32),glass,24);for(let i=0;i<24;i++){matrix.makeTranslation(-6.25+i*12.5/23,11.02,C.hall.radius+.36);dentils.setMatrixAt(i,matrix);}group.add(dentils);
  group.updateWorldMatrix(true,true);const bounds=new THREE.Box3().setFromObject(group),depth=C.hall.depthStretch||1,front=architecture.parent.position.z+(C.hall.radius-.65)*Math.cos(Math.PI/C.hall.arcadeBays)*depth;group.position.z+=(front+.70-bounds.min.z)/depth;group.userData.outsideHall=true;group.userData.facadeWorldZ=front;
  registerStructure(group,{trigger:length-20,duration:4.2,kind:'temple-portico'});
}

export function addCathedralVault(args){return addGuariniDome(args);}

export { addStainedGlass } from './cathedral-glass.js';
