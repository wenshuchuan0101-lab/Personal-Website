import * as THREE from 'three';

// Integrate density through a closed volume instead of showing its mesh surface.
// Density reaches zero at every edge and cap, including views from inside it.
export function lightVolume({start,end,worldOffset=new THREE.Vector3(),radiusStart,radiusEnd,density=.003,tint=0xffefd0,name,animatedUniforms}){
  const direction=end.clone().sub(start),length=direction.length();
  const uniforms={uTime:{value:0},uBuild:{value:0},uStart:{value:start.clone().add(worldOffset)},uEnd:{value:end.clone().add(worldOffset)},uRadii:{value:new THREE.Vector2(radiusStart,radiusEnd)},uDensity:{value:density},uTint:{value:new THREE.Color(tint)}};
  animatedUniforms.push(uniforms);
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,uniforms,
    vertexShader:'varying vec3 vWorld;void main(){vec4 p=modelMatrix*vec4(position,1.);vWorld=p.xyz;gl_Position=projectionMatrix*viewMatrix*p;}',
    fragmentShader:`varying vec3 vWorld;uniform vec3 uStart;uniform vec3 uEnd;uniform vec2 uRadii;uniform float uBuild;uniform float uDensity;uniform vec3 uTint;
    void main(){vec3 ray=normalize(vWorld-cameraPosition),axis=uEnd-uStart,centre=(uStart+uEnd)*.5;float length2=dot(axis,axis),radius=sqrt(length2*.25+max(uRadii.x*uRadii.x,uRadii.y*uRadii.y));vec3 offset=cameraPosition-centre;float b=dot(offset,ray),disc=b*b-dot(offset,offset)+radius*radius;if(disc<=0.)discard;float root=sqrt(disc),nearT=max(0.,-b-root),farT=min(length(vWorld-cameraPosition),-b+root);if(farT<=nearT)discard;float stepSize=(farT-nearT)/32.,sum=0.;for(int i=0;i<32;i++){vec3 p=cameraPosition+ray*(nearT+(float(i)+.5)*stepSize);float t=dot(p-uStart,axis)/length2;if(t>0.&&t<1.){float r=mix(uRadii.x,uRadii.y,t);vec3 delta=p-(uStart+axis*t);float radial=max(0.,1.-dot(delta,delta)/(r*r));float ends=smoothstep(0.,.14,t)*(1.-smoothstep(.82,1.,t));sum+=radial*radial*ends*stepSize;}}float alpha=(1.-exp(-sum*uDensity))*uBuild;if(alpha<.00015)discard;gl_FragColor=vec4(uTint,alpha);}`
  });
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radiusStart,radiusEnd,length,40,1,false),material);mesh.name=name;mesh.position.copy(start).add(end).multiplyScalar(.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,-1,0),direction.normalize());return mesh;
}
