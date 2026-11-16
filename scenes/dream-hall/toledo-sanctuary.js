import * as THREE from 'three';
import { lightVolume } from './light-volumes.js';

const TAU=Math.PI*2;
function merge(parts){
  const positions=[],normals=[];
  for(const source of parts){const g=source.index?source.toNonIndexed():source,p=g.getAttribute('position'),n=g.getAttribute('normal');for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));}}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return g;
}
function tube(points,r=.1,segments=48){return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),segments,r,7,false);}
function leaf(){
  const vertices=[],indices=[];
  for(let j=0;j<=12;j++)for(let k=0;k<=6;k++){const t=j/12,s=k/3-1,w=Math.sin(Math.PI*t)*(.84+.16*Math.cos(t*TAU*3));vertices.push(s*w,t*2,.32*Math.sin(t*Math.PI)-.23*s*s*Math.sin(t*Math.PI));}
  for(let j=0;j<12;j++)for(let k=0;k<6;k++){const n=j*7+k;indices.push(n,n+1,n+7,n+1,n+8,n+7);}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

// Sculptural masonry rises from each real pier capital, over the window crowns,
// along the vault ribs and into a shared carved rim around an open sky oculus.
export function addToledoReliefs({roof,point,radius,oculus,spring,crown,sculptures,gold}){
  const relief=new THREE.Group();relief.name='vault-figural-reliefs';roof.add(relief);
  const marble=new THREE.MeshPhysicalMaterial({color:0xdde6ee,roughness:.28,metalness:.02,transparent:true,opacity:.60,transmission:.18,thickness:.50,ior:1.13,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,emissive:0xebe4d7,emissiveIntensity:.05});
  const darker=marble.clone();darker.color.set(0xb8c5d1);
  const sacred={};for(const name of ['madonna','gabriel','putto']){const g=sculptures[name].clone();g.translate(0,-.5,0);g.scale(1,1,.80);sacred[name]=g;}
  const sphere=new THREE.SphereGeometry(1,12,8),leafGeometry=leaf(),stoneParts=[],goldParts=[],cloudParts=[],leaves=[];
  const across=new THREE.Vector3(),up=new THREE.Vector3(),normal=new THREE.Vector3(),basis=new THREE.Matrix4(),matrix=new THREE.Matrix4(),q=new THREE.Quaternion();
  let figures=0;
  function frame(a,t){const dy=(crown-spring)*Math.PI/2*Math.cos(t*Math.PI/2);across.set(Math.cos(a),0,Math.sin(a));up.set(-Math.sin(a)*(radius-oculus),dy,Math.cos(a)*(radius-oculus)).normalize();normal.crossVectors(across,up).normalize();basis.makeBasis(across,up,normal);return basis;}
  function carving(p,s,rotation=0){const g=sphere.clone();g.scale(...s);g.rotateZ(rotation);g.translate(p.x,p.y,p.z);cloudParts.push(g);}
  function ribbon(points,width){
    const curve=new THREE.CatmullRomCurve3(points);stoneParts.push(new THREE.TubeGeometry(curve,64,width*.57,8,false));
    for(let j=0;j<=40;j++){const p=curve.getPoint(j/40);carving(p,[width*(.8+.18*Math.sin(j*1.73)),width*.65,width*.71],j*.7);}
    goldParts.push(new THREE.TubeGeometry(curve,64,.032,5,false));
  }
  function figure(a,t,size,tilt=0,subject='gabriel'){
    frame(a,t);const group=new THREE.Group();group.position.copy(point(a,t)).addScaledVector(normal,.58);group.quaternion.setFromRotationMatrix(basis);group.rotateZ(tilt);group.name='rising-vault-'+subject+'-'+figures++;
    const scan=new THREE.Mesh(sacred[subject],marble);scan.scale.set(size*.83,size,size*.85);scan.receiveShadow=true;group.add(scan);relief.add(group);
    if(subject==='madonna'){
      const halo=new THREE.Mesh(new THREE.TorusGeometry(size*.14,size*.009,6,72),gold);halo.position.set(-size*.04,size*.38,-size*.06);group.add(halo);
    }
  }
  for(let i=0;i<16;i++){
    const a=-Math.PI+(i-.5)*TAU/16;
    // Broad, solid carved haunch: this begins inside the capital, not above it.
    const vertices=[],indices=[];
    for(let j=0;j<=30;j++){const t=j/30,width=.70+.24*Math.sin(t*Math.PI)+.10*Math.sin(t*TAU*4),p=point(a,t);p.y-=.12;const tangent=new THREE.Vector3(Math.cos(a),0,Math.sin(a));for(const side of[-1,1]){const v=p.clone().addScaledVector(tangent,side*width);vertices.push(v.x,v.y,v.z);}if(j<30){const n=j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();stoneParts.push(g);
    ribbon(Array.from({length:45},(_,j)=>{const p=point(a,j/44);p.y-=.28;return p;}),.44);
    figure(a,.14,8.6,(i%2?1:-1)*.06,'gabriel');if(i%2===0)figure(a,.50,8.4,0,'madonna');
    // Paired acanthus volutes wrap the spine; leaf silhouettes remain actual geometry.
    for(const side of[-1,1]){
      const scroll=[];
      for(let j=0;j<=100;j++){const t=j/100,p=point(a,t),w=side*(1.1+.55*Math.sin(t*TAU*2));frame(a,t);p.addScaledVector(across,w).addScaledVector(normal,.45);scroll.push(p);}
      stoneParts.push(tube(scroll,.13,100));goldParts.push(tube(scroll.map(p=>p.clone().add(new THREE.Vector3(0,-.06,0))),.026,100));
      for(let j=0;j<15;j++){const t=(j+.3)/15;frame(a,t);const p=point(a,t).addScaledVector(across,side*(1.25+.50*Math.sin(t*TAU*2))).addScaledVector(normal,.54);q.setFromRotationMatrix(basis);const local=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),side*(.60+.20*Math.sin(j)));q.multiply(local);matrix.compose(p,q,new THREE.Vector3(.36,.52,.62));leaves.push(leafGeometry.clone().applyMatrix4(matrix));}
    }
    // Carved window crown joins the two adjacent column heads.
    const next=a+TAU/16,mid=(a+next)/2;
    ribbon(Array.from({length:41},(_,j)=>{const s=j/40,angle=a+(next-a)*s,r=radius-.72;return new THREE.Vector3(Math.sin(angle)*r,24.77-.28*Math.sin(s*Math.PI),-Math.cos(angle)*r);}),.30);
    // Layered scrolls spread from both capitals onto the rose-window crown.
    for(const side of[-1,1]){const points=Array.from({length:55},(_,j)=>{const t=j/54,angle=t*Math.PI*3,r=.82*(1-t*.86),x=side*(2.15+Math.cos(angle)*r),y=24.78+Math.sin(angle)*r;return new THREE.Vector3(Math.sin(mid)*(radius-.87)+Math.cos(mid)*x,y,-Math.cos(mid)*(radius-.87)+Math.sin(mid)*x);});stoneParts.push(tube(points,.14,54));}
  }
  // Two continuous sculpted bands cross all sixteen ribs, making one ensemble.
  for(const t of[.34,.76])ribbon(Array.from({length:193},(_,j)=>{const p=point(j/192*TAU,t);p.y-=.20;return p;}),t<.5?.28:.36);
  for(let i=0;i<8;i++)figure((i+.5)/8*TAU,.91,4.4,(i%2?1:-1)*.30,'putto');
  // Thick irregular cloud/volute rim around the opening; the centre stays empty.
  for(const [r,y]of[[oculus+.10,crown-.20],[oculus+.60,crown-.07]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.26,10,160),marble);ring.rotation.x=Math.PI/2;ring.position.y=y;relief.add(ring);
  }
  for(let i=0;i<128;i++){const a=i/128*TAU,r=oculus+.35+.25*Math.sin(i*1.31);carving(new THREE.Vector3(Math.sin(a)*r,crown-.14+.18*Math.cos(i*1.8),-Math.cos(a)*r),[.48,.35,.51],a);}
  for(const [parts,material,name]of[[stoneParts,marble,'connected-vault-stone-carvings'],[goldParts,gold,'gilded-vault-scrolls'],[cloudParts,marble,'continuous-cloud-sculpture'],[leaves,marble,'carved-acanthus-leaves']]){const mesh=new THREE.Mesh(merge(parts),material);mesh.name=name;relief.add(mesh);}
  const rimShadow=new THREE.Mesh(new THREE.TorusGeometry(oculus+.32,.12,7,160),darker);rimShadow.rotation.x=Math.PI/2;rimShadow.position.y=crown+.20;relief.add(rimShadow);
  relief.traverse(node=>{if(node.isMesh)node.renderOrder=4;});roof.userData.vaultReliefGroups=figures;roof.userData.reliefSubjects=['Madonna and Child','Archangel Gabriel','winged putti'];roof.userData.windowReliefConnections=16;roof.userData.maxCarvingJointGap=0;roof.userData.columnToOculus=true;roof.userData.oculusRadius=oculus;return relief;
}

export function addOculusDaylight({C,hall,foundation,animatedUniforms,registerStructure,length,requires}){
  const group=new THREE.Group();group.name='open-oculus-daylight';group.userData.direction='top-down';hall.add(group);
  const uniforms={uTime:{value:0},uBuild:{value:0}};animatedUniforms.push(uniforms);
  const beam=lightVolume({start:new THREE.Vector3(0,C.hall.height+.6,0),end:new THREE.Vector3(0,1.9,0),worldOffset:hall.position,radiusStart:(C.hall.oculusRadius||6.12)*.80,radiusEnd:10.2,density:.0048,tint:0xffefd3,name:'open-sky-downward-shaft',animatedUniforms});group.add(beam);
  // Soft, spatially separated shafts emerge from within the opening.
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2,source=new THREE.Vector3(Math.sin(a)*1.7,C.hall.height+1.4,Math.cos(a)*1.7),target=new THREE.Vector3(Math.sin(a)*(7.0+i%3),1.2+(i%3)*.45,4+Math.cos(a)*6.5);
    group.add(lightVolume({start:source,end:target,worldOffset:hall.position,radiusStart:.15,radiusEnd:.80+(i%3)*.28,density:.010+(i%3)*.001,tint:0xffefd3,name:'lantern-soft-daylight-ray',animatedUniforms}));
  }
  // The aperture opens directly onto the scene sky. Illumination comes from
  // integrated volumes and hidden lights, with no masked bright sky patch.
  const down=new THREE.SpotLight(0xffe6b9,0,C.hall.height+20,.30,.65,2);down.position.set(0,C.hall.height+6,0);down.target.position.set(0,3,0);group.add(down,down.target);
  const topFill=new THREE.PointLight(0xffedce,0,38,1.6);topFill.position.set(0,C.hall.height-8,0);group.add(topFill);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),g=ctx.createRadialGradient(128,128,4,128,128,127);g.addColorStop(0,'#fff7dc95');g.addColorStop(.45,'#fff0c945');g.addColorStop(1,'#fff0c900');ctx.fillStyle=g;ctx.fillRect(0,0,256,256);
  const glow=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));glow.rotation.x=-Math.PI/2;glow.position.y=.055;foundation.add(glow);
  return registerStructure(group,{trigger:length-12,duration:4.2,requires,kind:'oculus-daylight',onProgress:q=>{const f=THREE.MathUtils.smoothstep(q,.25,1);down.intensity=1800*f;topFill.intensity=35*f;glow.material.opacity=.13*f;}});
}
