const routes = {};
let currentRoot = null;
export function register(name, renderFn){ routes[name]=renderFn; }
export function navigate(name, params){
  const root = document.getElementById('app');
  root.innerHTML='';
  currentRoot = root;
  const fn = routes[name];
  if(!fn) { root.textContent = 'Route not found: '+name; return }
  fn(root, params);
}
