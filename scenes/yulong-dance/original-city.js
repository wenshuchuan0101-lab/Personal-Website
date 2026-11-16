import * as THREE from 'three';

function windowPaper(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=256;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff2d0';ctx.fillRect(0,0,128,256);ctx.fillStyle='#553620';
  for(let x=0;x<=128;x+=16)ctx.fillRect(x,0,2,256);for(let y=0;y<=256;y+=32)ctx.fillRect(0,y,128,2);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export async function loadOriginalCity({scene,renderer,mobile}){
  const rootURL=new URL('./assets/',import.meta.url),response=await fetch(new URL('city.json',rootURL));if(!response.ok)throw Error('City manifest unavailable');const data=await response.json();
  const geometryRequest=fetch(new URL(data.geometry,rootURL)).then(async response=>{
    if(!response.ok)throw Error('City geometry unavailable');const packed=await response.arrayBuffer(),header=new Uint8Array(packed,0,Math.min(2,packed.byteLength));
    // A host may already decode a gzip Content-Encoding before exposing fetch.
    return header[0]===31&&header[1]===139?new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer():packed;
  });
  const loader=new THREE.TextureLoader(),materials={};
  await Promise.all(Object.entries(data.materials).map(async([name,entry])=>{
    const texture=entry.texture?await loader.loadAsync(new URL(entry.texture,rootURL).href):null;
    if(texture){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}
    if(entry.kind==='window')materials[name]=new THREE.MeshBasicMaterial({color:new THREE.Color(1.9,1.5,.95),map:windowPaper(),side:THREE.DoubleSide});
    else{
      const terrain=entry.kind==='terrain',stone=entry.kind==='stone';
      if(texture&&(terrain||stone)){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;if(terrain)texture.repeat.set(.35,.35);}
      const material=new THREE.MeshStandardMaterial({color:terrain?0xffffff:stone?0xb8b7a6:0xffffff,map:texture,roughness:terrain?.98:stone?.93:.82,metalness:.01,side:THREE.DoubleSide});
      if(entry.kind==='lotus'){material.emissive=new THREE.Color(0xffb45d);material.emissiveIntensity=.65;material.emissiveMap=texture;}
      // The original painted windows retain their own texture and latticework.
      // A restrained warm emission lights the pale panes without whitening roofs.
      if(entry.kind==='textured'&&texture){material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        #ifdef USE_MAP
        vec3 paint=texture2D(map,vMapUv).rgb;
        float pane=smoothstep(.54,.84,min(paint.r,paint.g))*smoothstep(.08,.30,paint.r-paint.b);
        totalEmissiveRadiance+=vec3(1.0,.48,.13)*pane*.035;
        #endif`);};material.customProgramCacheKey=()=> 'yulong-original-warm-panes';}
      materials[name]=material;
    }
  }));
  const bytes=await geometryRequest;if(bytes.byteLength!==data.stats.uncompressedBytes)throw Error('Incomplete city geometry');
  const root=new THREE.Group();root.name='original-yulong-city-terrain-bridges';
  const attr=(spec,size)=>new THREE.BufferAttribute(new Float32Array(bytes,spec.offset,spec.length),size);
  let drawn=0;for(const record of data.meshes){
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',attr(record.positions,3));geometry.setAttribute('normal',attr(record.normals,3));geometry.setAttribute('uv',attr(record.uv,2));geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(bytes,record.indices.offset,record.indices.length),1));geometry.computeBoundingSphere();
    const instances=record.instances;
    const mesh=new THREE.InstancedMesh(geometry,materials[record.material],instances.length);mesh.name='source-'+record.material+'-'+record.id;
    for(let i=0;i<instances.length;i++)mesh.setMatrixAt(i,new THREE.Matrix4().fromArray(instances[i].matrix));mesh.computeBoundingSphere();root.add(mesh);drawn+=record.triangles*instances.length;
  }
  root.userData={...data.stats,renderedTriangles:drawn,foregroundPeople:0,removedForegroundPerson:true,originalTextureMaps:true,originalSteppedTerrain:true,originalStoneQuays:true,originalStairs:true,originalStoneBridges:true};scene.add(root);
  // Pools of lantern light follow the original bank, stairs and palace approach.
  const lighting=await fetch(new URL('lights.json',rootURL)).then(r=>{if(!r.ok)throw Error('Original lighting unavailable');return r.json();});
  const candidates=lighting.lights.filter(light=>light.type==='PointLightComponent'&&light.position[1]>10&&light.position[2]>-100&&light.position[2]<85).sort((a,b)=>b.intensity-a.intensity);
  const placed=[];for(const source of candidates){if(placed.length>=(mobile?6:12))break;if(placed.some(p=>new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...source.position))<12))continue;placed.push(source.position);const light=new THREE.PointLight(new THREE.Color(...source.color),Math.min(160,Math.max(35,source.intensity*35)),Math.min(90,source.radius),1.8);light.position.fromArray(source.position);scene.add(light);}
  root.userData.originalLightPositions=true;root.userData.sourceLightCount=lighting.lights.length;root.userData.liveLightCount=placed.length;
  return root;
}
