// Independent choreography: every visible cursor is drawing, typing, demonstrating,
// or travelling directly to/from an assigned task. There are no idle cursor orbits.
(() => {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=n=>Math.max(0,Math.min(1,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  let busy=false,report=null;
  async function run({prepare,root,origin,background='#123fce'}) {
    if(busy)return;busy=true;
    const previousInert=root.inert,saved=new Map(),tasks=[],cleanup=[];
    let canvas,frame,timer,finish,nameButton,phaseStyle,interrupted=false,cancelSetup;
    const aborted=new Promise(resolve=>{cancelSetup=resolve;});
    const settle=()=>{interrupted=true;cancelSetup();finish?.();};
    const nextFrame=()=>Promise.race([new Promise(requestAnimationFrame),aborted]);
    const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();settle();}};
    const onHidden=()=>{if(document.hidden)settle();};
    const snapshot=node=>{if(!saved.has(node))saved.set(node,node.getAttribute('style'));};
    const restore=node=>{const value=saved.get(node);if(value==null)node.removeAttribute('style');else node.setAttribute('style',value);};
    try {
      if(motion.matches){prepare();return;}
      const config=SCENE_SETTINGS.transition||{},width=innerWidth,height=innerHeight;
      canvas=document.createElement('canvas');canvas.className='swarm-transition';canvas.setAttribute('aria-hidden','true');
      const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',zIndex:'100',touchAction:'none',background});
      const ctx=canvas.getContext('2d');if(!ctx){prepare();return;}
      ctx.setTransform(ratio,0,0,ratio,0,0);document.body.append(canvas);document.body.dataset.swarmTransition='running';
      timer=setTimeout(settle,10000);
      window.addEventListener('resize',settle,{once:true});document.addEventListener('keydown',onKey,true);document.addEventListener('visibilitychange',onHidden);
      prepare();root.inert=true;await Promise.race([document.fonts.ready,aborted]);await nextFrame();
      if(interrupted)return;
      const profile=root.dataset.view==='profile',duration=Math.min(9000,Math.max(4500,Number(profile?config.profileMilliseconds:config.growthMilliseconds)||7600));
      const en=document.documentElement.lang==='en',label=(zh,english)=>en?english:zh;
      if(!profile)window.GrowthMountain.preview(1);
      root.querySelectorAll('.console-ticks,.console-orbits').forEach(node=>{snapshot(node);node.style.animationPlayState='paused';});
      phaseStyle=document.createElement('style');phaseStyle.textContent='body[data-swarm-transition] .reveal{opacity:1!important;transform:none!important;transition:none!important}';document.head.append(phaseStyle);
      await nextFrame();
      if(interrupted)return;
      const visible=node=>{
        if(!node||node.closest('[hidden]'))return false;const r=node.getBoundingClientRect();
        if((r.width<.5&&r.height<.5)||r.right<0||r.left>width||r.bottom<0||r.top>height)return false;
        for(let n=node;n&&n!==root.parentElement;n=n.parentElement){const s=getComputedStyle(n);if(s.display==='none'||Number(s.opacity)===0)return false;}
        return true;
      };
      const group=node=>{snapshot(node);node.style.setProperty('visibility','hidden','important');return{node,remaining:0,restored:false};};
      const job=(options,state)=>{const task={...options,state,complete:false};if(state)state.remaining++;tasks.push(task);return task;};
      const complete=task=>{if(task.complete)return;task.complete=true;task.update?.(1);if(task.state&&--task.state.remaining===0){restore(task.state.node);task.state.restored=true;}task.endAction?.();};
      function pointOn(points,p){const i=clamp(p)*(points.length-1),lo=Math.floor(i),hi=Math.min(points.length-1,lo+1);return{x:lerp(points[lo].x,points[hi].x,i-lo),y:lerp(points[lo].y,points[hi].y,i-lo)};}
      function textJob(node,start,end,title){
        if(!visible(node))return;const bounds=node.getBoundingClientRect(),letters=[],sx=node.offsetWidth/bounds.width||1,sy=node.offsetHeight/bounds.height||1;
        const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);let text;
        while(text=walker.nextNode())for(let offset=0;offset<text.length;){
          const size=text.data.codePointAt(offset)>0xffff?2:1,range=document.createRange();range.setStart(text,offset);range.setEnd(text,offset+size);const b=range.getBoundingClientRect();
          if(b.width&&b.height)letters.push({x:b.left,y:b.top,w:b.width,h:b.height,path:`M${(b.left-bounds.left)*sx-2} ${(b.top-bounds.top)*sy-3}h${b.width*sx+4}v${b.height*sy+6}h${-b.width*sx-4}Z`});offset+=size;
        }
        if(!letters.length)return;const state=group(node);let last=-1;
        job({kind:'text',title,start,end,letters,point:p=>{const l=letters[Math.min(letters.length-1,Math.floor(p*letters.length))];return{x:l.x+l.w,y:l.y+l.h*.65};},update:p=>{
          const amount=Math.floor(p*letters.length);if(last===amount)return;last=amount;node.style.setProperty('visibility','visible','important');node.style.clipPath=amount?`path("${letters.slice(0,amount).map(l=>l.path).join('')}")`:'inset(0 100% 0 0)';
        }},state);
      }
      function svgJobs(node,parts,start,end,title){
        if(!visible(node)||typeof node.getTotalLength!=='function')return;const length=node.getTotalLength(),matrix=node.getScreenCTM();if(!length||!matrix)return;
        const style=getComputedStyle(node),color=style.stroke==='none'?style.fill:style.stroke,state=group(node),clip=node.closest('.growth-svg')?.getBoundingClientRect(),total=Math.max(1,parts);
        for(let part=0;part<total;part++){
          const samples=Math.max(8,Math.min(150,Math.ceil(length/total/3)));
          const points=Array.from({length:samples},(_,i)=>{const local=node.getPointAtLength(length*(part+i/(samples-1))/total);return new DOMPoint(local.x,local.y).matrixTransform(matrix);});
          job({kind:'trace',title,start:lerp(start,end,part/total),end:lerp(start,end,(part+1)/total)+.012,points,clip,color,lineWidth:Math.max(.8,Math.min(2.4,parseFloat(style.strokeWidth)||1)),point:p=>pointOn(points,p)},state);
        }
      }
      function borderJobs(node,start,end,title){
        if(!visible(node))return;const r=node.getBoundingClientRect(),points=[{x:r.left,y:r.top},{x:r.right,y:r.top},{x:r.right,y:r.bottom},{x:r.left,y:r.bottom},{x:r.left,y:r.top}],state=group(node);
        for(let i=0;i<4;i++)job({kind:'trace',title,start:start+i*.004,end:end+i*.004,points:[points[i],points[i+1]],color:'#ffb576',lineWidth:1,point:p=>pointOn([points[i],points[i+1]],p)},state);
      }
      function dragBox(node,start,end){
        if(!visible(node))return;
        const r=node.getBoundingClientRect(),left=Math.max(8,r.left-5),top=Math.max(8,r.top-5),right=Math.min(width-8,r.right+5),bottom=Math.min(height-8,r.bottom+5);
        if(right-left<16||bottom-top<16)return;
        // Complete the layout drag before this region's actual content is placed.
        for(const task of tasks){
          const target=task.state?.node||task.node;
          if(target&&node.contains(target)&&task.start<end){const delay=end-task.start;task.start+=delay;task.end+=delay;}
        }
        const bounds={left,top,width:right-left,height:bottom-top};
        job({kind:'box',start,end,bounds,point:p=>{const growth=smooth(p/.78);return{x:left+bounds.width*growth,y:top+bounds.height*growth};}});
      }
      function rule(node,start,end,title,side='bottom'){
        if(!visible(node))return;const r=node.getBoundingClientRect(),y=side==='top'?r.top:r.bottom;
        snapshot(node);node.style.setProperty(side==='top'?'border-top-color':'border-bottom-color','transparent');
        job({kind:'trace',title,node,start,end,points:[{x:r.left,y},{x:r.right,y}],color:'#ffb576',lineWidth:.8,point:p=>({x:lerp(r.left,r.right,p),y}),endAction:()=>restore(node)});
      }
      function fillMountain(node,start,end){
        if(!visible(node))return;const ns='http://www.w3.org/2000/svg',svg=node.ownerSVGElement,b=node.getBBox(),state=group(node),count=14;
        const clip=document.createElementNS(ns,'clipPath');clip.id=`swarm-slope-${Date.now()}`;clip.setAttribute('clipPathUnits','userSpaceOnUse');svg.querySelector('defs').append(clip);cleanup.push(()=>clip.remove());
        node.style.clipPath=`url(#${clip.id})`;node.style.setProperty('visibility','visible','important');const matrix=node.getScreenCTM();
        const samples=selector=>{const path=svg.querySelector(selector),length=path.getTotalLength();return Array.from({length:400},(_,i)=>path.getPointAtLength(length*i/399));};
        const ridge=[...samples('.growth-ridge'),...samples('.growth-future')],base=samples('.mountain-base');
        const nearest=(points,x)=>points.reduce((best,p)=>Math.abs(p.x-x)<Math.abs(best.x-x)?p:best);
        for(let i=0;i<count;i++){
          const r=document.createElementNS(ns,'rect'),x=b.x+b.width*i/count,w=b.width/count+.5,center=x+w/2;
          const top=nearest(ridge,center).y,bottom=nearest(base,center).y;
          const stripTop=Math.min(top,...ridge.filter(p=>p.x>=x&&p.x<=x+w).map(p=>p.y))-5;
          const stripBottom=Math.max(bottom,...base.filter(p=>p.x>=x&&p.x<=x+w).map(p=>p.y))+5;
          r.setAttribute('x',x);r.setAttribute('width',w);r.setAttribute('height',0);clip.append(r);
          job({kind:'fill',title:label('山体明暗','Mountain shading'),start:lerp(start,end,i/count),end:lerp(start,end,(i+1)/count)+.045,clip:svg.getBoundingClientRect(),point:p=>new DOMPoint(center,lerp(bottom,top,p)).matrixTransform(matrix),update:p=>{r.setAttribute('y',lerp(stripBottom,stripTop,p));r.setAttribute('height',(stripBottom-stripTop)*p);}},state);
        }
      }
      if(profile){
        rule(root.querySelector('.profile-topline'),.025,.09,label('页眉分隔线','Header rule'));
        root.querySelectorAll('.profile-topline > span').forEach((node,i)=>textJob(node,.05+i*.015,.15+i*.015,label('页眉文字','Header text')));
        textJob(root.querySelector('.name-primary .name-main'),.10,.22,label('姓名','Name'));
        textJob(root.querySelector('.name-primary .profile-roman'),.15,.25,label('姓名副标题','Name subtitle'));
        textJob(root.querySelector('.profile-education'),.22,.34,label('教育经历','Education'));
        root.querySelectorAll('.profile-facts > div').forEach((row,i)=>{textJob(row.querySelector('dt'),.28+i*.065,.35+i*.065,label('介绍条目','About label'));textJob(row.querySelector('dd'),.31+i*.065,.44+i*.065,label('介绍内容','About text'));});
        nameButton=root.querySelector('.profile-name-flip');
        if(visible(nameButton)){
          let flipped=false,returned=false;const r=nameButton.getBoundingClientRect();
          job({kind:'interaction',title:label('姓名左右翻页','Name page turn'),start:.28,end:.48,point:p=>({x:lerp(r.right-14,r.left+14,p<.48?smooth(p/.48):smooth((1-p)/.52)),y:r.top+r.height*.4}),update:p=>{
            if(p>=.22&&!flipped){nameButton.click();flipped=true;report.nameFlips++;canvas.dataset.nameDemo='alias';}
            if(p>=.78&&!returned){nameButton.click();returned=true;report.nameFlips++;canvas.dataset.nameDemo='primary';}
          }});
        }
        root.querySelectorAll('.console-line').forEach((node,i)=>svgJobs(node,5,.24+i*.04,.43+i*.04,label('外圈','Outer ring')));
        svgJobs(root.querySelector('.console-inner'),4,.34,.48,label('内圈','Inner ring'));
        root.querySelectorAll('.console-ticks line').forEach((node,i)=>svgJobs(node,1,.40+i/72*.16,.415+i/72*.16,label('刻度','Dial tick')));
        root.querySelectorAll('.console-orbits > *').forEach((node,i)=>svgJobs(node,node.tagName==='ellipse'?4:1,.46+i*.025,.58+i*.025,label('轨道','Orbit')));
        svgJobs(root.querySelector('.console-star'),6,.57,.68,label('星形','Star'));
        svgJobs(root.querySelector('.console-points'),4,.62,.71,label('定位点','Accent points'));
        root.querySelectorAll('.mode-option').forEach((button,i)=>{[...button.children].forEach((node,j)=>textJob(node,.72+i*.07+j*.006,.79+i*.07+j*.006,label('模式按钮文字','Mode button text')));borderJobs(button,.67+i*.07,.72+i*.07,label('按钮边框','Button frame'));});
        rule(root.querySelector('.profile-bottom'),.73,.79,label('页脚分隔线','Footer rule'),'top');
        root.querySelectorAll('.profile-roles > span').forEach((node,i)=>textJob(node,.77+i*.012,.84+i*.012,label('创作方向','Creative roles')));
        dragBox(root.querySelector('.profile-topline'),.005,.06);
        dragBox(root.querySelector('.profile-name'),.04,.13);
        dragBox(root.querySelector('.profile-education'),.16,.23);
        root.querySelectorAll('.profile-facts > div').forEach((node,i)=>dragBox(node,.22+i*.065,.29+i*.065));
        dragBox(root.querySelector('.mode-console'),.16,.25);
        root.querySelectorAll('.mode-option').forEach((node,i)=>dragBox(node,.60+i*.07,.68+i*.07));
        dragBox(root.querySelector('.profile-bottom'),.68,.76);
      }else{
        root.querySelectorAll('.nav-home,.section-link').forEach((node,i)=>textJob(node,.025+i*.014,.10+i*.014,label('顶部导航','Navigation')));
        rule(root.querySelector('.quick-header'),.02,.10,label('导航栏','Navigation bar'));
        const heading=root.querySelector('.growth-stage > .portfolio-heading');
        heading.querySelectorAll('.section-index > span,h2,.heading-english').forEach((node,i)=>textJob(node,.06+i*.025,.16+i*.025,label('成长标题','Growth heading')));
        rule(heading.querySelector('.section-index'),.08,.16,label('标题分隔线','Heading rule'));
        root.querySelectorAll('.growth-grid path').forEach((node,i)=>svgJobs(node,3,.14+i*.018,.22+i*.018,label('参照线','Guide line')));
        svgJobs(root.querySelector('.growth-time-axis'),7,.16,.27,label('时间轴','Time axis'));
        fillMountain(root.querySelector('.mountain-main'),.20,.36);
        svgJobs(root.querySelector('.growth-ridge'),16,.22,.41,label('成长曲线','Growth curve'));
        svgJobs(root.querySelector('.growth-future'),18,.30,.48,label('未来山脊','Future ridge'));
        svgJobs(root.querySelector('.growth-now-line'),2,.40,.46,label('现在的轨迹','Present segment'));
        root.querySelectorAll('.growth-date-guides line,.growth-date-ticks line').forEach((node,i)=>svgJobs(node,1,.30+i*.003,.37+i*.003,label('节点日期连线','Date connector')));
        root.querySelectorAll('.growth-vertex').forEach((vertex,i)=>vertex.querySelectorAll('circle').forEach((node,j)=>svgJobs(node,1,.31+i*.009+j*.002,.355+i*.009+j*.002,label(vertex.dataset.kind==='work'?'作品节点':'学习节点',vertex.dataset.kind==='work'?'Work node':'Learning node'))));
        root.querySelectorAll('.growth-head circle').forEach((node,i)=>svgJobs(node,1,.44+i*.008,.49+i*.008,label('现在标记','Present marker')));
        [...root.querySelectorAll('.growth-label > span,.growth-axis-date > span,.growth-now-label')].filter(visible).forEach((node,i)=>textJob(node,.38+i*.004,.47+i*.004,label('节点标注','Milestone label')));
        root.querySelectorAll('.growth-legend > span,.growth-scroll,.growth-readout-date,.growth-readout-label').forEach((node,i)=>textJob(node,.43+i*.012,.52+i*.012,label('阶段说明','Milestone readout')));
        root.querySelectorAll('.growth-controls button').forEach((node,i)=>borderJobs(node,.46+i*.025,.52+i*.025,label('阶段切换','Milestone control')));
        const vertices=[...root.querySelectorAll('.growth-vertex')];
        vertices.forEach((vertex,i)=>{
          job({kind:'milestone',title:label(`阶段 ${String(i+1).padStart(2,'0')}`,`Milestone ${String(i+1).padStart(2,'0')}`),start:.51+i*.013,end:.56+i*.013,update:p=>{if(p>=.22&&!report.visitedMilestones.includes(i))report.visitedMilestones.push(i);},point:p=>{
            const r=vertex.querySelector('.vertex-core').getBoundingClientRect(),chart=root.querySelector('.growth-chart').getBoundingClientRect(),date=root.querySelector(`[data-date-index="${i}"]`).getBoundingClientRect();
            const node={x:r.left+r.width/2,y:r.top+r.height/2},axis={x:Math.max(chart.left+8,Math.min(chart.right-8,node.x)),y:date.top};
            return {x:lerp(node.x,axis.x,smooth(p)),y:lerp(node.y,axis.y,smooth(p))};
          }});
        });
        job({kind:'overview',title:label('完整成长轨迹','Complete growth journey'),start:.77,end:.90,point:p=>{const path=root.querySelector('.growth-future'),point=path.getPointAtLength(path.getTotalLength()*p);return new DOMPoint(point.x,point.y).matrixTransform(path.getScreenCTM());},endAction:()=>{root.scrollTop=root.querySelector('#growth').offsetHeight-root.clientHeight;window.GrowthMountain.preview(null);}});
        dragBox(root.querySelector('.quick-header'),.005,.065);
        dragBox(heading,.025,.11);
        dragBox(root.querySelector('.growth-chart'),.075,.21);
        dragBox(root.querySelector('.growth-meta'),.34,.44);
        dragBox(root.querySelector('.growth-controls'),.37,.47);
      }
      document.querySelector('.language-star svg')?.querySelectorAll('path').forEach((node,i)=>svgJobs(node,2,(profile ? .79 : .51)+i*.012,(profile ? .85 : .56)+i*.012,label('语言切换','Language switch')));
      const colors=config.colors||['#ffab4d','#f4eee3','#b7c9ff'],count=Math.max(4,Math.min(40,Number(width<600?config.mobileCursorCount:config.cursorCount)||(width<600?18:28)));
      const agents=Array.from({length:count},(_,id)=>({id,jobs:[],available:0})),tour=agents[0];
      const sourceEnd=Math.max(...tasks.map(task=>task.end));
      tasks.forEach(task=>{
        task.start=.13+task.start/sourceEnd*.68;task.end=.13+task.end/sourceEnd*.68;
        if(task.kind==='interaction'){task.start=.29;task.end=.65;}
      });
      tasks.sort((a,b)=>a.start-b.start).forEach(task=>{const agent=['interaction','overview'].includes(task.kind)?tour:agents.slice(1).reduce((a,b)=>a.available<=b.available?a:b);const requested=task.start;task.start=Math.max(task.start,agent.available+.001);task.end+=task.start-requested;agent.jobs.push(task);agent.available=task.end;task.agent=agent.id;});
      // Keep the detailed jobs inside the build phase, reserving real time for both bookends.
      const latest=Math.max(...tasks.map(task=>task.end));
      if(latest>.81)tasks.forEach(task=>{task.start=.13+(task.start-.13)*.68/(latest-.13);task.end=.13+(task.end-.13)*.68/(latest-.13);});
      const end=1;
      report={view:profile?'profile':'growth',taskCount:tasks.length,cursorCount:count,duration:Math.round(duration*end),nameFlips:0,completed:0,idleCursors:0,visitedMilestones:[],types:tasks.reduce((all,task)=>(all[task.kind]=(all[task.kind]||0)+1,all),{})};
      function edge(point,id){const distances=[point.x,width-point.x,point.y,height-point.y],side=distances.indexOf(Math.min(...distances)),offset=(id%5-2)*18;return side===0?{x:-40,y:Math.max(24,Math.min(height-24,point.y+offset))}:side===1?{x:width+40,y:Math.max(24,Math.min(height-24,point.y+offset))}:side===2?{x:Math.max(24,Math.min(width-24,point.x+offset)),y:-40}:{x:Math.max(24,Math.min(width-24,point.x+offset)),y:height+40};}
      function swim(a,b,p,id){const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),bend=Math.min(110,d*.28)*(id%2?1:-1),u=1-p,c1={x:a.x+dx*.32-dy/d*bend,y:a.y+dy*.32+dx/d*bend},c2={x:a.x+dx*.72-dy/d*bend*.6,y:a.y+dy*.72+dx/d*bend*.6};return{x:u*u*u*a.x+3*u*u*p*c1.x+3*u*p*p*c2.x+p*p*p*b.x,y:u*u*u*a.y+3*u*u*p*c1.y+3*u*p*p*c2.y+p*p*p*b.y};}
      function strokeTask(task,p){
        if(!task.points||task.state?.restored||(!task.state&&task.complete))return;ctx.save();if(task.clip){ctx.beginPath();ctx.rect(task.clip.left,task.clip.top,task.clip.width,task.clip.height);ctx.clip();}
        ctx.strokeStyle=task.color;ctx.lineWidth=task.lineWidth;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();const last=Math.floor(p*(task.points.length-1));task.points.slice(0,last+1).forEach((point,i)=>i?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));const tip=pointOn(task.points,p);ctx.lineTo(tip.x,tip.y);ctx.stroke();ctx.restore();
      }
      function drawDragBox(task,p){
        const growth=smooth(p/.78),bounds=task.bounds;
        ctx.save();ctx.globalAlpha=.9*(1-smooth((p-.85)/.15));ctx.strokeStyle=colors[task.agent%colors.length];ctx.lineWidth=1.1;
        ctx.strokeRect(bounds.left,bounds.top,Math.max(1,bounds.width*growth),Math.max(1,bounds.height*growth));ctx.restore();
      }
      function cursor(point,task,id,travel,angle,p){
        if(point.x<0||point.x>width||point.y<0||point.y>height)return false;
        if(!travel&&task.clip&&(point.x<task.clip.left||point.x>task.clip.right||point.y<task.clip.top||point.y>task.clip.bottom))return false;
        const color=colors[id%colors.length];ctx.save();ctx.translate(point.x,point.y);ctx.scale(width < 600 ? .66 : .76,width < 600 ? .66 : .76);ctx.shadowColor=color;ctx.shadowBlur=7;ctx.strokeStyle='#071631';ctx.lineWidth=1.4;ctx.fillStyle=color;
        ctx.rotate(travel?angle+Math.PI*.66:0);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,19);ctx.lineTo(5,14);ctx.lineTo(9,23);ctx.lineTo(13,21);ctx.lineTo(9,12);ctx.lineTo(17,12);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.stroke();
        ctx.restore();
        return true;
      }
      canvas.style.background='transparent';
      const start={x:Math.max(55,Math.min(width-55,origin?.x??width/2)),y:Math.max(65,Math.min(height-65,origin?.y??height/2))};
      const openingPoint=(agent,t)=>{
        const angle=agent.id*2.39996+t*14,radius=Math.min(76,width*.16)*(.55+(agent.id%5)*.11);
        return{x:start.x+Math.cos(angle)*radius,y:start.y+Math.sin(angle)*radius*.65};
      };
      const lastPositions=new Map(),finaleOrigins=new Map();
      await new Promise(resolve=>{
        finish=resolve;const began=performance.now();
        function paint(now){
          const t=(now-began)/duration;ctx.clearRect(0,0,width,height);canvas.dataset.stage=t<.13?'arriving':t<.82?'building':'departing';canvas.dataset.progress=t.toFixed(4);
          for(const task of tasks){if(t<task.start)continue;const p=clamp((t-task.start)/(task.end-task.start));if(!task.complete){task.update?.(p);if(p===1)complete(task);}if(task.kind==='trace')strokeTask(task,p);if(task.kind==='box'&&p<1)drawDragBox(task,p);}
          let active=0;
          for(const agent of agents){
            if(!agent.jobs.length)continue;
            if(t<.13){
              const target=openingPoint(agent,t),a={x:agent.id%2?-45:width+45,y:Math.max(25,Math.min(height-25,start.y+(agent.id%7-3)*29))},p=smooth(t/.085),point=swim(a,target,p,agent.id);
              const previous=lastPositions.get(agent.id)||a;lastPositions.set(agent.id,point);active+=Number(cursor(point,agent.jobs[0],agent.id,true,Math.atan2(point.y-previous.y,point.x-previous.x),p));continue;
            }
            if(t>=.82){
              const last=agent.jobs.at(-1);if(!finaleOrigins.has(agent.id))finaleOrigins.set(agent.id,lastPositions.get(agent.id)||edge(last.point(1),agent.id));
              const a=finaleOrigins.get(agent.id),angle=agent.id*2.39996+(t-.82)*28,radius=Math.min(68,width*.15)*(.5+(agent.id%5)*.10);
              const target={x:width-Math.min(90,width*.21)+Math.cos(angle)*radius,y:height-85+Math.sin(angle)*radius*.60};
              const gathered=swim(a,target,smooth((t-.82)/.115),agent.id),exit=smooth((t-.94)/.06),point=swim(gathered,{x:width+50+agent.id*2,y:height+45},exit,agent.id);
              const previous=lastPositions.get(agent.id)||a;lastPositions.set(agent.id,point);active+=Number(cursor(point,last,agent.id,true,Math.atan2(point.y-previous.y,point.x-previous.x),exit));continue;
            }
            const current=agent.jobs.find(task=>t>=task.start&&t<task.end);if(current){const p=clamp((t-current.start)/(current.end-current.start)),point=current.point(p);lastPositions.set(agent.id,point);active+=Number(cursor(point,current,agent.id,false,0,p));continue;}
            const next=agent.jobs.find(task=>task.start>t),previous=[...agent.jobs].reverse().find(task=>task.end<=t),lead=.018;let a,b,p,task;
            if(next&&!previous){a=openingPoint(agent,.13);b=next.point(0);p=(t-.13)/(next.start-.13);task=next;}
            else if(next&&previous&&next.start-previous.end<lead*2){a=previous.point(1);b=next.point(0);p=(t-previous.end)/(next.start-previous.end);task=next;}
            else if(next&&t>=next.start-lead){b=next.point(0);a=edge(b,agent.id);p=(t-next.start+lead)/lead;task=next;}
            else if(previous&&t<previous.end+lead){a=previous.point(1);b=edge(a,agent.id);p=(t-previous.end)/lead;task=previous;}
            else{lastPositions.set(agent.id,edge(agent.jobs.at(-1).point(1),agent.id));continue;}
            p=smooth(p);const point=swim(a,b,p,agent.id),ahead=swim(a,b,Math.min(1,p+.015),agent.id);lastPositions.set(agent.id,point);active+=Number(cursor(point,task,agent.id,true,Math.atan2(ahead.y-point.y,ahead.x-point.x),p));
          }
          report.completed=tasks.filter(task=>task.complete).length;canvas.dataset.activeCursors=String(active);canvas.dataset.taskCount=String(tasks.length);
          if(t<end)frame=requestAnimationFrame(paint);else resolve();
        }
        frame=requestAnimationFrame(paint);
      });
    }finally{
      cancelAnimationFrame(frame);clearTimeout(timer);window.removeEventListener('resize',settle);document.removeEventListener('keydown',onKey,true);document.removeEventListener('visibilitychange',onHidden);
      if(nameButton?.isConnected&&nameButton.dataset.flipped==='true')nameButton.click();saved.forEach((value,node)=>restore(node));cleanup.forEach(fn=>fn());phaseStyle?.remove();window.GrowthMountain.preview(null);canvas?.remove();root.inert=previousInert;delete document.body.dataset.swarmTransition;busy=false;
    }
  }
  window.PortfolioTransition={run,inspect:()=>report?structuredClone(report):null};
})();
