import { addCathedralVault, addStainedGlass, addTemplePortico } from './architectural-details.js';
import { addCentralMuse } from './sculpture-gallery.js';
import { addCathedralClerestory } from './church-upper-storey.js';
import { addChapelWings } from './chapel-wings.js';
import { addGrandEntrance } from './monumental-portals.js';
import { paleInlay } from './baroque-materials.js';
import { addMainPierCarvings } from './baroque-carvings.js';

export function buildColosseum({THREE,C,hall,foundation,stone,gold,length,registerStructure,frameShape,animatedUniforms,sculptures,floorMaterial}){
  gold=paleInlay();
  const r=C.hall.radius,stretch=C.hall.stretch,depth=C.hall.depthStretch||1,bayRadius=(r-.65)*Math.cos(Math.PI/C.hall.arcadeBays);
  const architecture=new THREE.Group();architecture.name='dream-colosseum';architecture.scale.set(stretch,1,depth);hall.add(architecture);
  const floorAssembly=new THREE.Group();floorAssembly.name='colosseum-platform-assembly';floorAssembly.scale.set(stretch,1,depth);foundation.add(floorAssembly);
  const glass=stone.clone();glass.color.set(0xd8d6d0);glass.opacity=.28;glass.transmission=.44;glass.emissive.set(0x283547);glass.emissiveIntensity=.12;
  const columnGlass=glass.clone();columnGlass.opacity=.34;columnGlass.transmission=.40;
  const glow=new THREE.MeshBasicMaterial({color:new THREE.Color(C.colors.glow).multiplyScalar(1.75),transparent:true,opacity:.48,toneMapped:false});
  const clerestory=addCathedralClerestory({C,architecture,glass:columnGlass,gold,frameShape,registerStructure,length,requires:[],sculptures});
  addMainPierCarvings({C,hall,sculptures,inlay:gold,registerStructure,length,requires:[clerestory]});
  addGrandEntrance({C,architecture,glass,gold,frameShape,sculptures,registerStructure,length});
  const vault=addCathedralVault({THREE,C,hall,foundation,animatedUniforms,architecture,glass,gold,glow,frameShape,registerStructure,length,requires:[clerestory],sculptures});
  const windows=addStainedGlass({THREE,C,hall,foundation,architecture,glass:columnGlass,gold,registerStructure,length,requires:[clerestory],animatedUniforms,atlas:sculptures.glassAtlas});
  addCentralMuse({C,hall,foundation,geometry:sculptures.muse,gold,registerStructure,length});
  addChapelWings({C,hall,foundation,architecture,glass,gold,sculptures,frameShape,registerStructure,length,clerestoryState:clerestory,vaultState:vault,windowState:windows,floorMaterial});
  // Flat open church floor: the former tiered seating is intentionally absent.
  const base=new THREE.Mesh(new THREE.CylinderGeometry(r,r-.35,1.20,128),glass);base.position.y=-.63;base.name='deep-hall-foundation';floorAssembly.add(base);
  for(const radius of[4.8,5.1,15,C.hall.doorRadius-.8,r-.05]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.018,6,160),gold);ring.rotation.x=Math.PI/2;ring.position.y=.042;floorAssembly.add(ring);}
  const walkRadius=C.hall.radius-2,bridgeFront=bayRadius*depth+C.hall.entryVestibule+.18,bridgeLength=bridgeFront-walkRadius*depth+1.8;
  const bridge=new THREE.Group();bridge.name='colosseum-entrance-bridge';hall.add(bridge);
  const deck=new THREE.Mesh(new THREE.BoxGeometry(C.corridor.width-1.2,.10,bridgeLength),glass);deck.position.set(0,.055,bridgeFront-bridgeLength/2);bridge.add(deck);
  for(const side of[-1,1]){const strip=new THREE.Mesh(new THREE.BoxGeometry(.018,.012,bridgeLength),glow);strip.position.set(side*(C.corridor.width-1.3)/2,.112,deck.position.z);bridge.add(strip);}
  registerStructure(bridge,{trigger:length-16,duration:2.4,kind:'colosseum-entry'});
  const light=new THREE.PointLight(0xffe6c7,290,105,1.8);light.position.set(0,21,0);hall.add(light);
}
