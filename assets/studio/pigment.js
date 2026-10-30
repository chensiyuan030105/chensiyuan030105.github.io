// A JS stable-fluids solver: semi-Lagrangian advection, pressure projection,
// and vorticity confinement, inspired by Taichi's stable_fluid.py.
export function createPigmentScene(host, {paused = false} = {}) {
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', {alpha:false});
  if (!ctx) throw Error('Canvas unavailable');
  host.append(canvas);
  let nx, ny, n, u, v, un, vn, dye, dn, p, pn, div, curl, image;
  let radius=18, swirl=20, rgb=[.15,.85,.82], previous=null, activeId=null, frame, last=0, visible=true, disposed=false;
  const key={x:.5,y:.5};
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function sample(a,x,y,c=0,s=1) {
    x=clamp(x,0,nx-1.001); y=clamp(y,0,ny-1.001);
    const ix=Math.floor(x), iy=Math.floor(y), fx=x-ix, fy=y-iy, i=(iy*nx+ix)*s+c, row=nx*s;
    return (a[i]*(1-fx)+a[i+s]*fx)*(1-fy)+(a[i+row]*(1-fx)+a[i+row+s]*fx)*fy;
  }
  function splat(x,y,dx,dy,color=rgb,brush=radius) {
    const cx=x*nx, cy=y*ny, r=Math.max(1.5,brush*nx/host.clientWidth);
    for(let j=Math.max(1,Math.floor(cy-r*3));j<Math.min(ny-1,cy+r*3);j++) for(let i=Math.max(1,Math.floor(cx-r*3));i<Math.min(nx-1,cx+r*3);i++) {
      const k=j*nx+i, f=Math.exp(-((i-cx)**2+(j-cy)**2)/(r*r));
      u[k]+=clamp(dx*nx*14,-90,90)*f; v[k]+=clamp(dy*ny*14,-90,90)*f;
      for(let c=0;c<3;c++) dye[k*3+c]=Math.min(3,dye[k*3+c]+color[c]*f*.85);
    }
  }
  function reset() {
    for(const a of [u,v,un,vn,dye,dn,p,pn,div,curl]) a.fill(0);
    const colors=[[.12,.82,.95],[.8,.18,.65],[1,.58,.12],[.30,.36,1]];
    for(let j=0;j<4;j++) { const a=j*Math.PI/2; splat(.5+Math.cos(a)*.17,.5+Math.sin(a)*.19,-Math.sin(a)*.06,Math.cos(a)*.09,colors[j],60); }
    draw();
  }
  function resize() {
    const w=host.clientWidth,h=host.clientHeight;
    if(!w||!h) return;
    const x=w<600?144:224,y=Math.max(64,Math.round(x*h/w));
    if(nx===x&&ny===y) return;
    nx=x;ny=y;n=x*y;canvas.width=x;canvas.height=y;
    [u,v,un,vn,p,pn,div,curl]=Array.from({length:8},()=>new Float32Array(n));
    dye=new Float32Array(n*3);dn=new Float32Array(n*3);image=ctx.createImageData(nx,ny);reset();
  }
  function step(dt) {
    for(let y=1;y<ny-1;y++) for(let x=1;x<nx-1;x++) {
      const i=y*nx+x,px=x-dt*u[i],py=y-dt*v[i];
      un[i]=sample(u,px,py)*.999;vn[i]=sample(v,px,py)*.999;
    }
    [u,un]=[un,u];[v,vn]=[vn,v];
    for(let y=1;y<ny-1;y++) for(let x=1;x<nx-1;x++) {const i=y*nx+x;curl[i]=.5*(v[i+1]-v[i-1]-u[i+nx]+u[i-nx]);}
    for(let y=1;y<ny-1;y++) for(let x=1;x<nx-1;x++) {
      const i=y*nx+x,gx=Math.abs(curl[i+1])-Math.abs(curl[i-1]),gy=Math.abs(curl[i+nx])-Math.abs(curl[i-nx]),len=Math.hypot(gx,gy)+.00001;
      u[i]=clamp(u[i]+dt*swirl*gy/len*curl[i],-150,150);v[i]=clamp(v[i]-dt*swirl*gx/len*curl[i],-150,150);
    }
    for(let y=1;y<ny-1;y++) for(let x=1;x<nx-1;x++) {const i=y*nx+x;div[i]=.5*(u[i+1]-u[i-1]+v[i+nx]-v[i-nx]);}
    p.fill(0);pn.fill(0);
    for(let pass=0;pass<18;pass++) {
      for(let y=1;y<ny-1;y++) for(let x=1;x<nx-1;x++) {const i=y*nx+x;pn[i]=.25*(p[i-1]+p[i+1]+p[i-nx]+p[i+nx]-div[i]);}
      [p,pn]=[pn,p];
    }
    for(let y=1;y<ny-1;y++) for(let x=1;x<nx-1;x++) {const i=y*nx+x;u[i]-=.5*(p[i+1]-p[i-1]);v[i]-=.5*(p[i+nx]-p[i-nx]);}
    for(let y=0;y<ny;y++) {u[y*nx]=0;u[y*nx+nx-1]=0;}
    for(let x=0;x<nx;x++) {v[x]=0;v[(ny-1)*nx+x]=0;}
    const decay=Math.exp(-dt*.025);
    for(let y=0;y<ny;y++) for(let x=0;x<nx;x++) {const i=y*nx+x;for(let c=0;c<3;c++) dn[i*3+c]=sample(dye,x-dt*u[i],y-dt*v[i],c,3)*decay;}
    [dye,dn]=[dn,dye];
  }
  function draw() {
    const light=document.documentElement.dataset.theme==='light';
    for(let i=0;i<n;i++) {
      const density=Math.max(dye[i*3],dye[i*3+1],dye[i*3+2]),alpha=1-Math.exp(-density*2.8);
      for(let c=0;c<3;c++) {const pigment=Math.pow(Math.min(1,dye[i*3+c]/Math.max(.35,density)),.75);image.data[i*4+c]=light?239*(1-alpha)+(22+pigment*175)*alpha:10+230*pigment*alpha;}
      image.data[i*4+3]=255;
    }
    ctx.putImageData(image,0,0);
  }
  function position(e) {const r=host.getBoundingClientRect();return{x:clamp((e.clientX-r.left)/r.width,0,1),y:clamp((e.clientY-r.top)/r.height,0,1)};}
  function onDown(e) {if(e.button!==0)return;e.preventDefault();activeId=e.pointerId;previous=position(e);host.setPointerCapture(e.pointerId);splat(previous.x,previous.y,0,0);draw();}
  function onMove(e) {
    if(e.pointerId!==activeId||!previous)return;
    const q=position(e),dx=q.x-previous.x,dy=q.y-previous.y;
    const segments=Math.min(20,Math.max(1,Math.ceil(Math.hypot(dx*host.clientWidth,dy*host.clientHeight)/Math.max(3,radius*.5))));
    for(let j=1;j<=segments;j++)splat(previous.x+dx*j/segments,previous.y+dy*j/segments,dx/segments,dy/segments);
    previous=q;if(paused)draw();
  }
  function onUp(e) {if(e.pointerId===activeId){activeId=null;previous=null;}}
  function onKey(e) {
    const offsets={ArrowLeft:[-.04,0],ArrowRight:[.04,0],ArrowUp:[0,-.04],ArrowDown:[0,.04],' ':[0,0],Enter:[0,0]};
    if(!offsets[e.key])return;e.preventDefault();const [dx,dy]=offsets[e.key];key.x=clamp(key.x+dx,.05,.95);key.y=clamp(key.y+dy,.05,.95);splat(key.x,key.y,dx,dy);draw();
  }
  function animate(now) {if(disposed)return;const dt=Math.min((now-last)/1000,1/30);last=now;if(!paused&&visible&&!document.hidden&&n){step(dt);draw();}frame=requestAnimationFrame(animate);}
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  const visibility=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});visibility.observe(host);
  const listeners={pointerdown:onDown,pointermove:onMove,pointerup:onUp,pointercancel:onUp,lostpointercapture:onUp,keydown:onKey};
  for(const [name,fn]of Object.entries(listeners))host.addEventListener(name,fn);
  window.addEventListener('themechange',draw);frame=requestAnimationFrame(animate);
  return {
    setRadius(value){radius=value;},setSwirl(value){swirl=value;},setColor(hex){rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);},setPaused(value){paused=value;},reset,
    dispose(){disposed=true;cancelAnimationFrame(frame);observer.disconnect();visibility.disconnect();for(const [name,fn]of Object.entries(listeners))host.removeEventListener(name,fn);window.removeEventListener('themechange',draw);canvas.remove();}
  };
}
