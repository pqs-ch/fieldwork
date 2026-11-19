// Explicit, optional lifecycle ownership. Applications supply their own adapters.
// This module imports no Turbo, Stimulus, or element implementations.
let installed;
export function installTurboElements(registrations) {
  if (!Array.isArray(registrations) || registrations.some(rule =>
    typeof rule?.selector !== 'string' || !rule.selector.trim() || typeof rule.mount !== 'function'))
    throw new TypeError('Supply selector/mount registrations.');
  for (const {selector} of registrations) document.querySelector(selector);
  if (installed) return installed;
  const rules=registrations.map(rule=>({...rule,roots:new Map()}));
  const events=new AbortController();
  let observing=false, rendering=0;
  function dispose(rule,element) {
    const entry=rule.roots.get(element);
    if (!entry) return;
    rule.roots.delete(element);
    entry.events.abort();
    entry.cleanup?.();
  }
  function disconnect(predicate=()=>true) {
    for (const rule of [...rules].reverse())
      for (const element of [...rule.roots.keys()].reverse())
        if (predicate(element)) dispose(rule,element);
  }
  function sync() {
    if (!observing || rendering || document.documentElement.hasAttribute('data-turbo-preview')) return;
    for (const rule of rules) {
      for (const element of rule.roots.keys())
        if (!element.isConnected || !element.matches(rule.selector)) dispose(rule,element);
      for (const element of document.querySelectorAll(rule.selector)) {
        if (rule.roots.has(element)) continue;
        const entry={events:new AbortController(),cleanup:null};
        rule.roots.set(element,entry);
        try {
          const controller=rule.mount(element,{signal:entry.events.signal});
          if (controller != null && typeof controller !== 'function' && typeof controller.destroy !== 'function')
            throw new TypeError('A mount must synchronously return a cleanup function, destroyable controller, or nothing.');
          entry.cleanup=typeof controller === 'function' ? controller : controller ? ()=>controller.destroy() : null;
        } catch(error) {
          dispose(rule,element);
          throw error;
        }
      }
    }
  }
  const observer=new MutationObserver(sync);
  function connect() {
    if (events.signal.aborted) return;
    observing=true;
    observer.observe(document.documentElement,{childList:true,subtree:true});
    sync();
  }
  function suspend() {
    observing=false;observer.disconnect();disconnect();
  }
  const on=(target,type,callback)=>target.addEventListener(type,callback,{signal:events.signal});
  function wrap(event,predicate) {
    const render=event.detail.render;
    event.detail.render=async(...args)=>{
      if (events.signal.aborted) return render(...args);
      rendering++;
      try { disconnect(predicate); return await render(...args); }
      finally { rendering--;sync(); }
    };
  }
  on(document,'turbo:before-cache',suspend);
  on(document,'turbo:before-render',event=>wrap(event,()=>true));
  on(document,'turbo:before-frame-render',event=>{
    const frame=event.target;
    wrap(event,element=>frame.contains(element));
  });
  on(document,'turbo:before-stream-render',event=>{
    const stream=event.target;
    const action=stream.getAttribute('action');
    if (!['append','prepend','replace','update','remove','before','after'].includes(action)) return;
    // Turbo resolves target/targets; do not invent a second selector protocol.
    const targets=Array.from(stream.targetElements);
    const replaces=['replace','update','remove'].includes(action);
    wrap(event,element=>targets.some(target=>
      (replaces && target.contains(element)) ||
      (element.contains(target) && (element!==target || !['before','after'].includes(action)))));
  });
  for (const type of ['turbo:load','turbo:render','turbo:frame-load']) on(document,type,connect);
  on(window,'pagehide',suspend);
  on(window,'pageshow',connect);
  installed=()=>{if (events.signal.aborted) return;suspend();events.abort();installed=undefined;};
  try { connect(); }
  catch(error) { installed();throw error; }
  return installed;
}
