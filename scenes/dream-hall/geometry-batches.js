import * as THREE from 'three';

// Combine static, same-material details locally before construction clipping is
// assigned. Original sculpture geometry is not changed by this batching helper.
export function batchStaticDetails(group){
  const buckets=new Map();
  for(const node of [...group.children]){
    if(!node.isMesh||node.isInstancedMesh||Array.isArray(node.material))continue;
    const key=node.material.uuid+'|'+node.name;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(node);
  }
  for(const nodes of buckets.values()){
    if(nodes.length<2)continue;const positions=[],normals=[],uvs=[];
    for(const node of nodes){node.updateMatrix();const source=node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone();source.applyMatrix4(node.matrix);const p=source.getAttribute('position'),n=source.getAttribute('normal'),uv=source.getAttribute('uv');for(let i=0;i<p.count;i++){positions.push(p.getX(i),p.getY(i),p.getZ(i));normals.push(n.getX(i),n.getY(i),n.getZ(i));uvs.push(uv?uv.getX(i):0,uv?uv.getY(i):0);}group.remove(node);source.dispose();}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,nodes[0].material);mesh.name=nodes[0].name;mesh.userData.sourceCount=nodes.length;group.add(mesh);
  }
}
