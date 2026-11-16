// The standalone scene remains usable on its own. Only an explicitly embedded,
// same-origin portfolio host may suspend it or open existing project content.
export function installPortfolioBridge({embedded,onPause,onResume,onLanguage}){
  const send=(type,extra={})=>{if(embedded)parent.postMessage({type,...extra},location.origin);};
  if(embedded){
    document.body.dataset.embedded='true';
    addEventListener('message',event=>{
      if(event.source!==parent||event.origin!==location.origin||!event.data)return;
      const {type,language}=event.data;
      if(type==='showcase:language'||type==='showcase:resume')onLanguage(language);
      if(type==='showcase:pause')onPause();
      if(type==='showcase:resume')onResume();
    });
    document.querySelector('.wordmark').addEventListener('click',event=>{event.preventDefault();send('showcase:exit');});
  }
  return{embedded,ready:()=>send('showcase:ready'),openWork:work=>send('showcase:work',{work})};
}
