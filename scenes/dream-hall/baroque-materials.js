import * as THREE from 'three';
let grain;
function limestoneGrain(){
  if(grain)return grain;const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d'),image=ctx.createImageData(256,256);let seed=7843;
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=(seed/4294967296-.5)*25,v=128+noise+5*Math.sin(x*.046+Math.sin(y*.037)*1.3),i=(y*256+x)*4;image.data[i]=image.data[i+1]=image.data[i+2]=v;image.data[i+3]=255;}ctx.putImageData(image,0,0);grain=new THREE.CanvasTexture(canvas);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(2,2);return grain;
}
export function sculptureMarble(){const m=new THREE.MeshPhysicalMaterial({color:0xc6d1d7,transparent:true,opacity:.54,transmission:.28,roughness:.50,metalness:0,thickness:.18,ior:1.12,depthWrite:false,side:THREE.FrontSide,forceSinglePass:true});m.name='unified-translucent-sculpture';return m;}
export function architecturalStone({opacity=.25,color=0xbac9d3}={}){const tint=new THREE.Color(color).lerp(new THREE.Color(0xbac9d3),.65),m=new THREE.MeshPhysicalMaterial({color:tint,roughness:.46,metalness:0,transmission:.44,thickness:.14,ior:1.12,transparent:true,opacity:Math.min(opacity,.30),depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true});m.name='unified-translucent-architecture';return m;}
export function paleInlay(){const m=new THREE.MeshStandardMaterial({color:0xd7c8a5,roughness:.56,metalness:.08,emissive:0x8a7751,emissiveIntensity:.16});m.name='fine-pale-gold-inlay';return m;}
