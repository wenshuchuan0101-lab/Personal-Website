import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(process.argv[2]||path.join(root,'../showcase-corridor'));
const target=path.join(root,'scenes/dream-hall');
const files=['index.html','style.css','scene.config.js','main.js','portfolio-bridge.js','colosseum.js','architectural-details.js','architectural-inlays.js','sculpture-gallery.js','toledo-sanctuary.js','light-volumes.js','church-upper-storey.js','cathedral-glass.js','cathedral-reference-dome.js','guarini-dome.js','chapel-wings.js','chapel-cupolas.js','chapel-windows.js','chapel-supports.js','baroque-materials.js','baroque-carvings.js','monumental-portals.js','geometry-batches.js','work-gates.js','work-portal-effects.js'];
for(const name of files)if(!fs.existsSync(path.join(source,name)))throw Error('Missing scene file: '+name);
fs.mkdirSync(target,{recursive:true});
for(const name of files){let text=fs.readFileSync(path.join(source,name),'utf8');if(name==='index.html')text=text.replace(/main\.js\?v=[^"']+/,'main.js?v=showcase-integration39');fs.writeFileSync(path.join(target,name),text);}
for(const name of ['assets','vendor'])fs.cpSync(path.join(source,name),path.join(target,name),{recursive:true,filter:file=>!file.endsWith('cathedral-glass-atlas-v2.png')});
console.log('Showcase scene synchronized: scenes/dream-hall');
