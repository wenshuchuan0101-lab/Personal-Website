// Door-aligned trigger volumes cover both sides of each opening. Dismissal
// stays latched until the player leaves the larger outer volume.
export function installGateInteraction({doors,config,getPosition,getEnabled,getLanguage,getTitle,onFreeze,onConfirm,onDismiss}){
  const dialog=document.querySelector('#gate-confirm'),question=document.querySelector('#gate-confirm-question'),yes=document.querySelector('#gate-confirm-yes'),no=document.querySelector('#gate-confirm-no');
  const latched=new Set();let pending=null;
  function zone(door,padding=0){
    const p=getPosition(),dx=p.x-door.position.x,dz=p.z-door.position.z,a=door.group.rotation.y;
    const x=Math.cos(a)*dx-Math.sin(a)*dz,z=Math.sin(a)*dx+Math.cos(a)*dz,depth=z>=0?config.frontDepth:config.backDepth;
    if(Math.abs(x)>config.halfWidth+padding||Math.abs(z)>depth+padding)return null;
    return{door,side:z>=0?'front':'back',distance:Math.hypot(x,z)};
  }
  function language(){
    if(!pending)return;
    const en=getLanguage()==='en',title=getTitle(pending.door.work);
    question.textContent=en?`Enter (${title})?`:`是否进入（${title}）？`;
    yes.setAttribute('aria-label',en?`Confirm entry to ${title}`:`确认进入${title}`);
    no.setAttribute('aria-label',en?'Cancel entry':'取消进入');
    yes.querySelector('small').textContent=en?'Enter':'进入';
    no.querySelector('small').textContent=en?'Cancel':'取消';
  }
  function request(door,side){
    if(!door||pending||!getEnabled())return;
    pending={door,side:side||zone(door)?.side||'front'};latched.add(door);
    onFreeze();language();dialog.showModal();yes.focus({preventScroll:true});
  }
  function close(confirmed=false){
    if(!pending)return;
    const {door}=pending;pending=null;
    dialog.close();onFreeze();
    if(confirmed)onConfirm(door);else onDismiss();
  }
  yes.addEventListener('click',()=>close(true));
  no.addEventListener('click',()=>close());
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  return{
    request,close,language,
    isOpen:()=>!!pending,
    update(){
      for(const door of latched)if(!zone(door,config.rearmPadding))latched.delete(door);
      if(pending||!getEnabled())return;
      const candidate=doors.filter(door=>door.group.visible&&door.uniforms.uBuild.value>=.99&&!latched.has(door)).map(door=>zone(door)).filter(Boolean).sort((a,b)=>a.distance-b.distance)[0];
      if(candidate)request(candidate.door,candidate.side);
    },
    inspect:()=>({pending:pending?{id:pending.door.work.id,side:pending.side}:null,latched:[...latched].map(door=>door.work.id),...config})
  };
}
