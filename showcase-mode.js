/* The cathedral and project pages stay on the same origin, with no separate
   server or absolute asset URLs required by the published website. */
(() => {
  const view = document.querySelector('.showcase-view');
  const stage = view.querySelector('.showcase-stage');
  const loading = view.querySelector('.showcase-loading');
  const loadingText = loading.querySelector('p');
  const retry = view.querySelector('.showcase-retry');
  const projectPanel = view.querySelector('.showcase-project');
  const projects = new Map(PORTFOLIO_CONTENT.groups.flatMap(group => group.projects).map(project => [project.id, project]));
  let frame = null, projectFrame = null, active = false, ready = false;
  let language = 'zh', currentWork = null, loadTimer;
  const words = {
    zh: { loading:'梦境正在展开…', error:'梦境暂时未能加载，请重试。', retry:'重新加载', world:'梅子雨的梦 · 可交互观赏模式', detail:'作品详情' },
    en: { loading:'Your dream is unfolding…', error:'The dream could not load. Please try again.', retry:'Try again', world:'Plum Rain’s Dream · Interactive Showcase', detail:'Project details' },
  };
  function send(type) {
    frame?.contentWindow?.postMessage({ type, language }, location.origin);
  }
  function updateLanguage(next) {
    language = next === 'en' ? 'en' : 'zh';
    const text = words[language];
    loadingText.textContent = view.dataset.failed === 'true' ? text.error : text.loading;
    retry.textContent = text.retry;
    frame?.setAttribute('title', text.world);
    projectPanel.setAttribute('aria-label', text.detail);
    send('showcase:language');
  }
  function fail() {
    if (ready) return;
    view.dataset.failed = 'true';
    loading.hidden = false;
    retry.hidden = false;
    loadingText.textContent = words[language].error;
  }
  function mount() {
    clearTimeout(loadTimer);
    frame?.remove();
    ready = false;
    view.dataset.ready = 'false';
    view.dataset.failed = 'false';
    loading.hidden = false;
    retry.hidden = true;
    loadingText.textContent = words[language].loading;
    frame = document.createElement('iframe');
    frame.className = 'showcase-frame';
    frame.title = words[language].world;
    frame.allow = 'autoplay; fullscreen';
    frame.allowFullscreen = true;
    const url = new URL('./scenes/dream-hall/index.html', location.href);
    url.searchParams.set('embedded', '1');
    url.searchParams.set('lang', language);
    url.searchParams.set('v', 'showcase-integration39');
    if (new URLSearchParams(location.search).has('test')) url.searchParams.set('test', '1');
    frame.src = url.href;
    stage.replaceChildren(frame);
    loadTimer = setTimeout(fail, 90000);
  }
  function closeProject(resume = true) {
    projectFrame?.remove();
    projectFrame = null;
    currentWork = null;
    projectPanel.hidden = true;
    delete view.dataset.projectOpen;
    if (resume && active && ready) {
      send('showcase:resume');
      frame.focus({ preventScroll:true });
    }
  }
  function openProject(id) {
    if (!active || !ready || projectFrame || !projects.has(id)) return;
    send('showcase:pause');
    currentWork = id;
    const project = projects.get(id);
    projectPanel.hidden = false;
    view.dataset.projectOpen = 'true';
    projectFrame = document.createElement('iframe');
    projectFrame.className = 'showcase-project-frame';
    projectFrame.title = project.title?.[language] || project.title?.zh || id;
    projectFrame.allow = 'autoplay; fullscreen';
    projectFrame.allowFullscreen = true;
    const url = new URL('./project.html', location.href);
    url.searchParams.set('work', id);
    url.searchParams.set('lang', language);
    url.searchParams.set('from', 'showcase');
    projectFrame.src = url.href;
    projectPanel.replaceChildren(projectFrame);
    projectFrame.addEventListener('load', () => projectFrame?.focus({ preventScroll:true }), { once:true });
  }
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || !event.data || typeof event.data.type !== 'string') return;
    const message = event.data;
    if (event.source === frame?.contentWindow) {
      if (message.type === 'showcase:ready') {
        clearTimeout(loadTimer);
        ready = true;
        view.dataset.ready = 'true';
        view.dataset.failed = 'false';
        loading.hidden = true;
        send(active && !projectFrame ? 'showcase:resume' : 'showcase:pause');
        if (active && !projectFrame) frame.focus({ preventScroll:true });
      }
      if (message.type === 'showcase:failed') fail();
      if (message.type === 'showcase:work') openProject(message.work);
      if (message.type === 'showcase:exit') window.dispatchEvent(new Event('showcase:exit'));
    }
    if (event.source === projectFrame?.contentWindow) {
      if (message.type === 'showcase:work-close') closeProject();
      if (message.type === 'showcase:language') {
        updateLanguage(message.language);
        window.dispatchEvent(new CustomEvent('showcase:language', { detail:{ language } }));
      }
    }
  });
  retry.addEventListener('click', mount);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && projectFrame) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeProject();
    }
  }, true);
  window.ShowcaseMode = {
    show(nextLanguage) {
      active = true;
      updateLanguage(nextLanguage);
      if (!frame) mount();
      else if (ready) { send('showcase:resume'); frame.focus({ preventScroll:true }); }
    },
    hide() { active = false; closeProject(false); send('showcase:pause'); },
    setLanguage:updateLanguage,
    inspect:() => ({ active, ready, currentWork, mounted:!!frame, language }),
  };
})();
