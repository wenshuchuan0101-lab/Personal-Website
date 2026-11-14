// Independent choreography: every visible cursor is drawing, typing, demonstrating,
// or travelling directly to/from an assigned task. There are no idle cursor orbits.
(() => {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=n=>Math.max(0,Math.min(1,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  let busy=false,report=null;
  async function run({prepare,root,origin,background='#123fce',includeVisual=false,budgetMilliseconds=10000}) {
    if(busy)return;busy=true;
    const previousInert=root.inert,saved=new Map(),tasks=[],cleanup=[];
    let canvas,frame,timer,finish,nameButton,phaseStyle,interrupted=false,cancelSetup,visualStarted=false,wheelStarted=false,growthReturned=false;
    const firstVisualId=PORTFOLIO_CONTENT.groups.find(group=>group.id==='visual')?.projects[0]?.id;
    const aborted=new Promise(resolve=>{cancelSetup=resolve;});
    const settle=()=>{interrupted=true;cancelSetup();finish?.();};
    const nextFrame=()=>Promise.race([new Promise(requestAnimationFrame),aborted]);
    const onKey=e=>{if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();settle();}};
    const onHidden=()=>{if(document.hidden)settle();};
    const snapshot=node=>{if(!saved.has(node))saved.set(node,node.getAttribute('style'));};
    const restore=node=>{const value=saved.get(node);if(value==null)node.removeAttribute('style');else node.setAttribute('style',value);};
    const returnToGrowth=()=>{
      if(!includeVisual||growthReturned||root.dataset.view!=='quick')return;
      window.PortfolioQuick.setView('quick');
      root.scrollTop=Math.max(0,root.querySelector('#growth').offsetHeight-root.clientHeight);
      window.GrowthMountain.preview(null);window.GrowthMountain.update();growthReturned=true;
      if(report?.view==='growth')report.phases.push('growth');
    };
    try {
      if(motion.matches){prepare();return;}
      const config=SCENE_SETTINGS.transition||{},width=innerWidth,height=innerHeight;
      canvas=document.createElement('canvas');canvas.className='swarm-transition';canvas.setAttribute('aria-hidden','true');
      const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',zIndex:'100',touchAction:'none',background});
      const ctx=canvas.getContext('2d');if(!ctx){prepare();return;}
      ctx.setTransform(ratio,0,0,ratio,0,0);document.body.append(canvas);document.body.dataset.swarmTransition='running';
      timer=setTimeout(settle,Math.min(10000,Math.max(1000,budgetMilliseconds)));
      window.addEventListener('resize',settle,{once:true});document.addEventListener('keydown',onKey,true);document.addEventListener('visibilitychange',onHidden);
      prepare();root.inert=true;await Promise.race([document.fonts.ready,aborted]);await nextFrame();
      if(interrupted)return;
      const profile=root.dataset.view==='profile',duration=Math.min(9400,Math.max(4500,Number(profile?config.profileMilliseconds:config.growthMilliseconds)||9400));
      const combined=includeVisual&&!profile&&Boolean(firstVisualId),introEnd=.18,buildEnd=.75,visualAt=.40,wheelAt=.59,returnAt=.77;
      const en=document.documentElement.lang==='en',label=(zh,english)=>en?english:zh;
      if(!profile)window.GrowthMountain.preview(1);
      root.querySelectorAll('.console-ticks,.console-orbits').forEach(node=>{snapshot(node);node.style.animationPlayState='paused';});
      phaseStyle=document.createElement('style');phaseStyle.textContent='body[data-swarm-transition] .reveal{opacity:1!important;transform:none!important;transition:none!important}body[data-swarm-transition] .work-wheel,body[data-swarm-transition] .wheel-work{transition:none!important}';document.head.append(phaseStyle);
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
      function mediaJob(node,start,end){
        if(!visible(node))return;
        const r=node.getBoundingClientRect(),state=group(node);
        job({kind:'media',start,end,point:p=>({x:lerp(r.left,r.right,smooth(p)),y:r.top+r.height*.5}),update:p=>{
          node.style.setProperty('visibility','visible','important');node.style.clipPath=`inset(0 ${(1-smooth(p))*100}% 0 0)`;
        }},state);
      }
      function svgTextJob(node,start,end){
        if(!visible(node))return;
        const ns='http://www.w3.org/2000/svg',svg=node.ownerSVGElement,b=node.getBBox(),matrix=node.getScreenCTM(),state=group(node);
        let defs=svg.querySelector('defs');if(!defs){defs=document.createElementNS(ns,'defs');svg.prepend(defs);cleanup.push(()=>defs.remove());}
        const clip=document.createElementNS(ns,'clipPath'),rect=document.createElementNS(ns,'rect');
        clip.id=`swarm-number-${tasks.length}`;clip.setAttribute('clipPathUnits','userSpaceOnUse');
        rect.setAttribute('x',b.x-2);rect.setAttribute('y',b.y-2);rect.setAttribute('height',b.height+4);rect.setAttribute('width',0);clip.append(rect);defs.append(clip);cleanup.push(()=>clip.remove());
        node.style.clipPath=`url(#${clip.id})`;
        job({kind:'numeral',start,end,point:p=>new DOMPoint(b.x+b.width*p,b.y+b.height*.65).matrixTransform(matrix),update:p=>{
          node.style.setProperty('visibility','visible','important');rect.setAttribute('width',(b.width+4)*p);
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
      const fraction=n=>{const value=Math.sin(n*127.1+311.7)*43758.5453;return value-Math.floor(value);};
      const agents=Array.from({length:count},(_,id)=>({id,jobs:[],available:0,depth:.25+fraction(id+1)*.75,lane:id%3,order:Math.floor(id/3),heading:0,motion:null})),tour=agents[0];
      const depthOrder=[...agents].sort((a,b)=>a.depth-b.depth);
      const pixelPace=1350,cadence=.72,pacing=[];
      function taskSeconds(task){
        if(task.kind==='text')return .10+Math.min(45,task.letters.length)*.012;
        if(task.kind==='interaction')return duration/1000*.35;
        const points=Array.from({length:17},(_,i)=>task.point(i/16));
        const distance=points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);
        return Math.max(.13,Math.min(.85,.07+distance/pixelPace));
      }
      function schedule(batch,from,to){
        const sourceEnd=Math.max(...batch.map(task=>task.end));
        batch.forEach(task=>{
          // One drawing/typing pace across every scene, rather than squeezing each
          // scene's original timeline by a different amount. Stagger the starts.
          task.start=from+task.start/sourceEnd*(to-from)*.38;
          task.end=task.start+taskSeconds(task)*cadence/(duration/1000);
          if(task.kind==='interaction'){task.start=.30;task.end=.65;}
        });
        batch.sort((a,b)=>a.start-b.start).forEach(task=>{
          const arrival=agent=>{
            const previous=agent.jobs.at(-1);if(!previous)return task.start;
            const a=previous.point(1),b=task.point(0),travel=Math.hypot(a.x-b.x,a.y-b.y)*cadence/pixelPace/(duration/1000);
            return Math.max(task.start,agent.available+travel);
          };
          const agent=['interaction','overview'].includes(task.kind)?tour:agents.slice(1).reduce((a,b)=>arrival(a)<=arrival(b)?a:b),requested=task.start;
          task.start=arrival(agent);task.end+=task.start-requested;agent.jobs.push(task);agent.available=task.end;task.agent=agent.id;
        });
        const latest=Math.max(...batch.map(task=>task.end));
        pacing.push({from,to,scale:Math.min(1,(to-from)/(latest-from))});
        if(latest>to)batch.forEach(task=>{task.start=from+(task.start-from)*(to-from)/(latest-from);task.end=from+(task.end-from)*(to-from)/(latest-from);});
        agents.forEach(agent=>{agent.available=Math.max(0,...agent.jobs.map(task=>task.end));});
      }
      schedule(tasks,introEnd,combined ? visualAt-.015 : buildEnd);
      const end=1;
      report={view:profile?'profile':'growth',phases:[profile?'profile':'growth'],taskCount:tasks.length,cursorCount:count,duration:Math.round(duration*end),nameFlips:0,completed:0,idleCursors:0,visitedMilestones:[],pacing,types:tasks.reduce((all,task)=>(all[task.kind]=(all[task.kind]||0)+1,all),{})};
      function freezeTasks(){
        // Freeze finished geometry before the real portfolio renderer replaces its DOM.
        for(const task of tasks){complete(task);const tip=task.point(1);task.point=()=>tip;}
      }
      function updateReport(){
        report.taskCount=tasks.length;report.types=tasks.reduce((all,task)=>(all[task.kind]=(all[task.kind]||0)+1,all),{});
      }
      function beginVisual(){
        freezeTasks();
        window.PortfolioQuick.showProject(firstVisualId);visualStarted=true;canvas.dataset.contentPhase='visual';report.phases.push('visual');
        const article=root.querySelector(`#project-${firstVisualId}`),offset=tasks.length;
        mediaJob(article.querySelector('.project-poster'),.10,.55);
        article.querySelectorAll('.project-kicker > span').forEach((node,i)=>textJob(node,.12+i*.04,.37+i*.04,label('作品分区','Project category')));
        textJob(article.querySelector('h2'),.24,.56,label('作品名称','Project title'));
        article.querySelectorAll('.project-meta p').forEach((node,i)=>textJob(node,.40+i*.06,.65+i*.06,label('作品信息','Project information')));
        textJob(article.querySelector('.project-award'),.50,.74,label('奖项','Award'));
        article.querySelectorAll('.project-enter > span').forEach((node,i)=>textJob(node,.72+i*.02,.92+i*.02,label('进入作品','Enter project')));
        borderJobs(article.querySelector('.project-enter'),.60,.72,label('作品入口','Project entry'));
        root.querySelectorAll('.work-wheel-star svg path').forEach(node=>svgJobs(node,3,.64,.90,label('作品轮盘','Work selector')));
        dragBox(article.querySelector('.project-poster'),.005,.15);
        dragBox(article.querySelector('.project-brief'),.08,.27);
        dragBox(article.querySelector('.project-enter'),.55,.70);
        schedule(tasks.slice(offset),visualAt+.01,wheelAt-.015);
        updateReport();
      }
      function beginWheel(){
        freezeTasks();root.querySelector('.work-wheel-star').click();wheelStarted=true;report.phases.push('wheel');
        const wheel=root.querySelector('.work-wheel'),offset=tasks.length;
        const ticks=[...wheel.querySelectorAll('.clock-ticks path')].filter(visible);
        ticks.forEach((node,i)=>svgJobs(node,1,.12+i/ticks.length*.25,.23+i/ticks.length*.25,label('钟面刻度','Clock tick')));
        wheel.querySelectorAll('.clock-inner-ring').forEach((node,i)=>svgJobs(node,6,.04+i*.04,.27+i*.04,label('钟面内环','Clock ring')));
        wheel.querySelectorAll('.clock-segment-outer,.clock-segment-inner').forEach((node,i)=>svgJobs(node,2,.22+i*.018,.41+i*.018,label('半圆钟面','Clock segment')));
        const numerals=[...wheel.querySelectorAll('.clock-number text')].filter(visible);
        numerals.forEach((node,i)=>svgTextJob(node,.35+i*.025,.54+i*.025));
        wheel.querySelectorAll('.clock-hand > *').forEach((node,i)=>svgJobs(node,2,.50+i*.025,.68+i*.025,label('钟面指针','Clock hand')));
        const cards=[...wheel.querySelectorAll('.wheel-work')].filter(node=>getComputedStyle(node).visibility==='visible'&&visible(node));
        cards.forEach((card,i)=>{
          const delay=i*.045;
          borderJobs(card,.46+delay,.57+delay,label('作品卡片','Work card'));
          mediaJob(card.querySelector('.wheel-thumbnail'),.57+delay,.73+delay);
          card.querySelectorAll('.wheel-number,.wheel-title').forEach((node,j)=>textJob(node,.64+delay+j*.03,.79+delay+j*.03,label('卡片文字','Card text')));
          dragBox(card,.29+delay,.45+delay);
        });
        const close=wheel.querySelector('.work-wheel-close');textJob(close,.80,.94,label('关闭轮盘','Close selector'));borderJobs(close,.73,.81,label('关闭按钮','Close button'));
        schedule(tasks.slice(offset),wheelAt+.01,buildEnd);
        report.wheel={ticks:ticks.length,numerals:numerals.length,cards:cards.length,tasks:tasks.length-offset};updateReport();
      }
      function edge(point,id){const distances=[point.x,width-point.x,point.y,height-point.y],side=distances.indexOf(Math.min(...distances)),offset=(id%5-2)*18;return side===0?{x:-40,y:Math.max(24,Math.min(height-24,point.y+offset))}:side===1?{x:width+40,y:Math.max(24,Math.min(height-24,point.y+offset))}:side===2?{x:Math.max(24,Math.min(width-24,point.x+offset)),y:-40}:{x:Math.max(24,Math.min(width-24,point.x+offset)),y:height+40};}
      function swim(a,b,p,id){const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(1,Math.hypot(dx,dy)),bend=Math.min(110,d*.28)*(id%2?1:-1),u=1-p,c1={x:a.x+dx/3-dy/d*bend,y:a.y+dy/3+dx/d*bend},c2={x:a.x+dx*2/3-dy/d*bend*.6,y:a.y+dy*2/3+dx/d*bend*.6};return{x:u*u*u*a.x+3*u*u*p*c1.x+3*u*p*p*c2.x+p*p*p*b.x,y:u*u*u*a.y+3*u*u*p*c1.y+3*u*p*p*c2.y+p*p*p*b.y};}
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
        const depth=agents[id].depth,color=colors[id%colors.length],size=(width < 600 ? .66 : .76)*(.72+depth*.44);
        ctx.save();ctx.translate(point.x,point.y);ctx.scale(size,size);ctx.globalAlpha*=.55+depth*.45;ctx.shadowColor=color;ctx.shadowBlur=3+depth*5;ctx.strokeStyle='#071631';ctx.lineWidth=1.4;ctx.fillStyle=color;
        ctx.rotate(travel?angle+Math.PI*.66:0);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,19);ctx.lineTo(5,14);ctx.lineTo(9,23);ctx.lineTo(13,21);ctx.lineTo(9,12);ctx.lineTo(17,12);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.stroke();
        ctx.restore();
        return true;
      }
      canvas.style.background='transparent';
      const marginX=Math.min(220,width*.34),marginY=Math.min(170,height*.23);
      const start={x:Math.max(marginX,Math.min(width-marginX,origin?.x??width/2)),y:Math.max(marginY,Math.min(height-marginY,origin?.y??height/2))};
      const lastPositions=new Map(),launchOrigins=new Map();let departureSide;
      const schoolPaths=[
        [[-155,-35],[-75,-130],[155,-80],[70,90]],
        [[70,-145],[190,-25],[100,145],[-45,75]],
        [[155,65],[25,175],[-180,90],[-80,-55]],
      ];
      function schoolPoint(agent,p){
        const [a,b,c,d]=schoolPaths[agent.lane],u=1-p,scale=Math.min(1,width/650);
        return{x:start.x+(u*u*u*a[0]+3*u*u*p*b[0]+3*u*p*p*c[0]+p*p*p*d[0])*scale,
          y:start.y+(u*u*u*a[1]+3*u*u*p*b[1]+3*u*p*p*c[1]+p*p*p*d[1])*scale+(agent.depth-.6)*17};
      }
      function openingPoint(agent,seconds){
        const lag=agent.order*.058+(1-agent.depth)*.13+agent.lane*.075;
        const p=clamp((seconds-lag+.12)/(duration/1000*introEnd+.12));
        return schoolPoint(agent,p);
      }
      function record(agent,point,dt){
        const old=agent.motion;
        agent.motion={x:point.x,y:point.y,vx:old?Math.max(-850,Math.min(850,(point.x-old.x)/dt)):0,vy:old?Math.max(-850,Math.min(850,(point.y-old.y)/dt)):0};
        lastPositions.set(agent.id,point);
      }
      function steer(agent,target,dt,ending){
        if(!agent.motion){
          const seed=schoolPoint(agent,0),ahead=schoolPoint(agent,.06),jitter=(fraction(agent.id+19)-.5)*35;
          agent.motion={x:seed.x+jitter-agent.order*5,y:seed.y+jitter*.7,vx:(ahead.x-seed.x)*2.8,vy:(ahead.y-seed.y)*2.8};
          agent.heading=Math.atan2(agent.motion.vy,agent.motion.vx);
        }
        const m=agent.motion,dx=target.x-m.x,dy=target.y-m.y,d=Math.max(1,Math.hypot(dx,dy));
        const speedLimit=Math.min(520,width*.4+150)*(.88+agent.depth*.12),speed=Math.min(speedLimit,d*4);
        let vx=dx/d*speed,vy=dy/d*speed,alignX=0,alignY=0,neighbors=0;
        for(const other of agents){if(other===agent||!other.motion)continue;const ox=m.x-other.motion.x,oy=m.y-other.motion.y,dist=Math.hypot(ox,oy);
          if(dist>0&&dist<22){const push=(1-dist/22)*85;vx+=ox/dist*push;vy+=oy/dist*push;}
          if(dist<95&&other.lane===agent.lane){alignX+=other.motion.vx;alignY+=other.motion.vy;neighbors++;}
        }
        if(neighbors){vx+=(alignX/neighbors-m.vx)*.10;vy+=(alignY/neighbors-m.vy)*.10;}
        const response=1-Math.exp(-4.8*dt);let ax=(vx-m.vx)*response,ay=(vy-m.vy)*response;
        const acceleration=Math.hypot(ax,ay),limit=1100*dt;if(acceleration>limit){ax*=limit/acceleration;ay*=limit/acceleration;}
        m.vx+=ax;m.vy+=ay;const velocity=Math.hypot(m.vx,m.vy);if(velocity>speedLimit){m.vx*=speedLimit/velocity;m.vy*=speedLimit/velocity;}
        m.x+=m.vx*dt;m.y+=m.vy*dt;
        const desired=Math.atan2(m.vy,m.vx),turn=Math.atan2(Math.sin(desired-agent.heading),Math.cos(desired-agent.heading));
        agent.heading+=Math.max(-3.8*dt,Math.min(3.8*dt,turn*(1-Math.exp(-7*dt))));
        const point={x:m.x,y:m.y};lastPositions.set(agent.id,point);return point;
      }
      await new Promise(resolve=>{
        finish=resolve;const began=performance.now();let previousTime=began;
        function paint(now){
          const t=(now-began)/duration,dt=Math.min(.034,Math.max(.001,(now-previousTime)/1000));previousTime=now;
          ctx.clearRect(0,0,width,height);canvas.dataset.stage=t<introEnd?'arriving':t<returnAt?'building':'departing';canvas.dataset.progress=t.toFixed(4);
          if(combined&&!visualStarted&&t>=visualAt)beginVisual();
          if(combined&&!wheelStarted&&t>=wheelAt)beginWheel();
          if(combined&&!growthReturned&&t>=returnAt){freezeTasks();returnToGrowth();}
          canvas.dataset.contentPhase=growthReturned?'growth':wheelStarted?'wheel':visualStarted?'visual':profile?'profile':'growth';
          for(const task of tasks){if(t<task.start)continue;const p=clamp((t-task.start)/(task.end-task.start));if(!task.complete){task.update?.(p);if(p===1)complete(task);}if(task.kind==='trace')strokeTask(task,p);if(task.kind==='box'&&p<1)drawDragBox(task,p);}
          let active=0;
          for(const agent of depthOrder){
            if(!agent.jobs.length)continue;
            if(t<introEnd){
              const point=steer(agent,openingPoint(agent,(now-began)/1000),dt,false);
              active+=Number(cursor(point,agent.jobs[0],agent.id,true,agent.heading,0));continue;
            }
            if(t>=.77){
              if(departureSide==null){const positions=[...lastPositions.values()];departureSide=positions.reduce((sum,p)=>sum+p.x,0)/Math.max(1,positions.length)<width/2?-1:1;}
              const last=agent.jobs.at(-1),seconds=(t-.77)*duration/1000,lag=agent.order*.035+(1-agent.depth)*.12,p=smooth((seconds-lag)/1.95);
              const target=swim({x:width*(departureSide<0?.19:.81),y:height*.77},{x:departureSide<0?-170:width+170,y:height+70},p,agent.lane);
              target.x-=departureSide*agent.order*9;target.y+=(agent.lane-1.5)*13+Math.sin(seconds*2.4-agent.order*.2)*13;
              const point=steer(agent,target,dt,true);ctx.save();ctx.globalAlpha=1-smooth((t-.97)/.03);
              active+=Number(cursor(point,last,agent.id,true,agent.heading,0));ctx.restore();continue;
            }
            if(!launchOrigins.has(agent.id))launchOrigins.set(agent.id,lastPositions.get(agent.id)||openingPoint(agent,introEnd*duration/1000));
            const current=agent.jobs.find(task=>t>=task.start&&t<task.end);if(current){const p=clamp((t-current.start)/(current.end-current.start)),point=current.point(p);record(agent,point,dt);agent.heading=-Math.PI*.66;active+=Number(cursor(point,current,agent.id,false,0,p));continue;}
            const next=agent.jobs.find(task=>task.start>t),previous=[...agent.jobs].reverse().find(task=>task.end<=t);
            const travelSeconds=next&&previous?Math.hypot(next.point(0).x-previous.point(1).x,next.point(0).y-previous.point(1).y)*cadence/pixelPace:0;
            const lead=Math.max(.025,Math.min(.12,travelSeconds/(duration/1000)));let a,b,p,task;
            if(next&&!previous){a=launchOrigins.get(agent.id);b=next.point(0);p=(t-introEnd)/(next.start-introEnd);task=next;}
            else if(next&&previous&&next.start-previous.end<lead*2){a=previous.point(1);b=next.point(0);p=(t-previous.end)/(next.start-previous.end);task=next;}
            else if(next&&t>=next.start-lead){b=next.point(0);a=edge(b,agent.id);p=(t-next.start+lead)/lead;task=next;}
            else if(previous&&t<previous.end+lead){a=previous.point(1);b=edge(a,agent.id);p=(t-previous.end)/lead;task=previous;}
            else{record(agent,edge(agent.jobs.at(-1).point(1),agent.id),dt);continue;}
            p=clamp(p);const point=swim(a,b,p,agent.id),ahead=swim(a,b,Math.min(1,p+.015),agent.id);record(agent,point,dt);agent.heading=Math.atan2(ahead.y-point.y,ahead.x-point.x);active+=Number(cursor(point,task,agent.id,true,agent.heading,p));
          }
          report.completed=tasks.filter(task=>task.complete).length;canvas.dataset.activeCursors=String(active);canvas.dataset.taskCount=String(tasks.length);
          report.cursors=agents.filter(agent=>agent.motion).map(agent=>({id:agent.id,x:agent.motion.x,y:agent.motion.y,heading:agent.heading,depth:agent.depth}));
          if(t<end)frame=requestAnimationFrame(paint);else resolve();
        }
        frame=requestAnimationFrame(paint);
      });
    }finally{
      cancelAnimationFrame(frame);clearTimeout(timer);window.removeEventListener('resize',settle);document.removeEventListener('keydown',onKey,true);document.removeEventListener('visibilitychange',onHidden);
      if(nameButton?.isConnected&&nameButton.dataset.flipped==='true')nameButton.click();saved.forEach((value,node)=>restore(node));cleanup.forEach(fn=>fn());phaseStyle?.remove();
      returnToGrowth();
      window.GrowthMountain.preview(null);canvas?.remove();root.inert=previousInert;delete document.body.dataset.swarmTransition;busy=false;
    }
  }
  window.PortfolioTransition={run,inspect:()=>report?structuredClone(report):null};
})();
