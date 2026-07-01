// Registers the service worker for offline support + installability.
if("serviceWorker" in navigator){
  addEventListener("load",()=>{ navigator.serviceWorker.register("sw.js").catch(()=>{}); });
}
