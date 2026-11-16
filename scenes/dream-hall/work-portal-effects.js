import * as THREE from 'three';

export async function loadWorkPosters(works){
  const entries=await Promise.all(works.filter(w=>w.poster).map(async work=>{
    const map=await new THREE.TextureLoader().loadAsync(work.poster);
    map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=8;
    return [work.id,map];
  }));
  return Object.fromEntries(entries);
}

const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const noise=`float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}`;

// The artwork covers the complete arched opening. Cropping, rather than a
// second inset image, makes the opening read as a view into another world.
export function workPortal({work,index,map,animatedUniforms,mobile,half=2.35,stem=4.7}){
  const height=stem+half,aspect=map?map.image.width/map.image.height:1,doorAspect=half*2/height,cover=new THREE.Vector2(Math.min(1,doorAspect/aspect),Math.min(1,aspect/doorAspect)),focus=new THREE.Vector2(THREE.MathUtils.clamp(work.posterFocus||.5,cover.x/2,1-cover.x/2),.5),uniforms={uTime:{value:0},uBuild:{value:0},uNear:{value:0},uIndex:{value:index},uColor:{value:new THREE.Color(work.tint)},uMap:{value:map||new THREE.Texture()},uCover:{value:cover},uFocus:{value:focus},uDream:{value:map?0:1}};
  animatedUniforms.push(uniforms);
  const shape=new THREE.Shape();shape.moveTo(-half,.12);shape.lineTo(half,.12);shape.lineTo(half,stem);shape.absarc(0,stem,half,0,Math.PI,false);shape.lineTo(-half,.12);shape.closePath();
  const geometry=new THREE.ShapeGeometry(shape,48),uv=geometry.getAttribute('uv');
  for(let i=0;i<uv.count;i++)uv.setXY(i,(uv.getX(i)+half)/(half*2),uv.getY(i)/height);
  const material=new THREE.ShaderMaterial({uniforms,side:THREE.DoubleSide,depthWrite:true,transparent:true,vertexShader:vertex,fragmentShader:`
    varying vec2 vUv;uniform float uTime,uBuild,uNear,uIndex,uDream;uniform vec2 uCover,uFocus;uniform vec3 uColor;uniform sampler2D uMap;${noise}
    vec3 frostedPhoto(vec2 p,vec2 r,float bias){
      vec3 c=texture2D(uMap,clamp(p,.001,.999),bias).rgb*.20;
      c+=texture2D(uMap,clamp(p+vec2(r.x,0.),.001,.999),bias).rgb*.12;
      c+=texture2D(uMap,clamp(p-vec2(r.x,0.),.001,.999),bias).rgb*.12;
      c+=texture2D(uMap,clamp(p+vec2(0.,r.y),.001,.999),bias).rgb*.12;
      c+=texture2D(uMap,clamp(p-vec2(0.,r.y),.001,.999),bias).rgb*.12;
      c+=texture2D(uMap,clamp(p+r*.7071,.001,.999),bias).rgb*.08;
      c+=texture2D(uMap,clamp(p-r*.7071,.001,.999),bias).rgb*.08;
      c+=texture2D(uMap,clamp(p+vec2(r.x,-r.y)*.7071,.001,.999),bias).rgb*.08;
      c+=texture2D(uMap,clamp(p+vec2(-r.x,r.y)*.7071,.001,.999),bias).rgb*.08;
      return c;
    }
    void main(){
      vec2 uv=vUv;float t=uTime*.21+uIndex*2.7;
      float air=noise(uv*vec2(6.,8.)+vec2(sin(t)*.2,-t));
      vec3 color=vec3(.001,.002,.004);
      float x=(uv.x-.5)*4.700000,y=uv.y*7.050000;
      float edge=min(y-.12,y<4.7?2.35-abs(x):2.35-length(vec2(x,y-4.7)));
      float mist=exp(-max(0.,edge)*6.)*(.05+.09*air);
      if(uDream<.5){
        vec2 photo=(uv-.5)*uCover+uFocus;
        // Distortion is restricted to a very narrow band at the actual arch.
        photo.x+=sin(y*6.-uTime*.5)*.0015*exp(-max(0.,edge)*10.);
        float soft=smoothstep(.20,.85,length((uv-vec2(.5,.48))*vec2(2.15,1.80)));
        vec3 sharp=texture2D(uMap,clamp(photo,.001,.999)).rgb;
        vec3 blurred=frostedPhoto(photo,uCover*(.067*soft),soft*3.5);
        color=mix(sharp,blurred,soft)*(.98+uNear*.07);
        color+=uColor*mist;
      }else color+=uColor*mist*.08;
      gl_FragColor=vec4(color,uBuild);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const curtain=new THREE.Mesh(geometry,material);curtain.name='work-poster-portal';curtain.position.z=.16;curtain.renderOrder=2;
  const group=new THREE.Group();group.name='living-work-portal';group.add(curtain);

  // A continuous arched contour with travelling filaments, not a flat light card.
  const points=[];
  for(let i=0;i<=24;i++)points.push(new THREE.Vector3(-half,.12+(stem-.12)*i/24,.28));
  for(let i=1;i<=80;i++){const a=Math.PI-i/80*Math.PI;points.push(new THREE.Vector3(Math.cos(a)*half,stem+Math.sin(a)*half,.28));}
  for(let i=1;i<=24;i++)points.push(new THREE.Vector3(half,stem-(stem-.12)*i/24,.28));
  for(let i=1;i<=30;i++)points.push(new THREE.Vector3(half-i/30*half*2,.12,.28));
  const path=new THREE.CatmullRomCurve3(points,true),rimMaterial=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform float uTime,uBuild,uNear,uIndex;uniform vec3 uColor;void main(){float phase=fract(vUv.x-uTime*.025+uIndex*.13);float head=pow(.5+.5*cos(phase*6.283185*3.),14.);float pulse=.12+.75*head;gl_FragColor=vec4(uColor*(1.3+head),pulse*uBuild*(.7+.3*uNear));}`});
  const rim=new THREE.Mesh(new THREE.TubeGeometry(path,240,.025,5,true),rimMaterial);rim.name='flowing-arched-portal-filaments';group.add(rim);

  const count=mobile?140:280,position=[],phases=[],sizes=[];
  for(let i=0;i<count;i++){
    const p=path.getPointAt(i/count);position.push(p.x,p.y,p.z);phases.push(i/count);sizes.push(.025+(i%7)*.007);
  }
  const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));dustGeometry.setAttribute('aPhase',new THREE.Float32BufferAttribute(phases,1));dustGeometry.setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1));
  const dustUniforms={...uniforms,uPixel:{value:Math.min(devicePixelRatio,1.6)}};animatedUniforms.push(dustUniforms);
  const dustMaterial=new THREE.ShaderMaterial({uniforms:dustUniforms,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:`attribute float aPhase,aSize;uniform float uTime,uBuild,uPixel,uIndex;varying float vAlpha;void main(){float life=fract(uTime*.12+aPhase*7.);float orbit=uTime*.6+aPhase*51.+uIndex;vec3 p=position;p.x+=sin(orbit)*life*.32;p.z+=cos(orbit)*life*.32+life*.5;p.y+=life*.8;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uPixel*800./max(1.,-mv.z),1.,12.);vAlpha=sin(life*3.14159)*uBuild;}`,fragmentShader:`uniform vec3 uColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5)*2.;float a=pow(max(0.,1.-d),2.);gl_FragColor=vec4(uColor*1.7,a*vAlpha*.8);}`});
  const dust=new THREE.Points(dustGeometry,dustMaterial);dust.name='dissolving-portal-edge-particles';dust.frustumCulled=false;group.add(dust);

  // Low armillary receiver at the threshold; three nested luminous arcs move
  // around an open centre, so the device never masks the poster with a disc.
  for(let i=0;i<3;i++){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.78+i*.18,.016,5,72,Math.PI*1.65),rimMaterial);ring.rotation.x=-Math.PI/2;ring.rotation.z=i*2.1;ring.position.set(0,.09+i*.035,.80);ring.name='portal-threshold-receiver';group.add(ring);
  }
  group.userData={poster:work.poster||null,blackInterior:!map,particles:count,posterEdgeParticles:map?count:0,posterFit:'cover',cropScale:[cover.x,cover.y],focus:[focus.x,focus.y],edgeAnimation:'orbit-dissolve',edgeBlur:{clearRadius:.20,outerRadius:.85,maxRadius:.067,taps:9},openReceiver:true};
  return {group,curtain,uniforms};
}
