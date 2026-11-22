import * as THREE from 'three';
const $=id=>document.getElementById(id),mount=$('game'),cover=$('cover');
let scene,camera,renderer,player,clock,obstacles=[],marks=[],running=false,over=false,score=0,lives=3,speed=.46,spawn=0,invuln=0;
let targetLane=0,keys={},mode='keyboard',stream=null,tracker=null,hand=null,gestureReady=false;
const laneX=[-2.35,0,2.35];
function mat(c,r=.5,m=.1){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m})}
function cube(g,w,h,d,m,x,y,z){let o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);g.add(o);return o}
function car(color){
 let g=new THREE.Group(),body=mat(color,.28,.35),glass=new THREE.MeshPhysicalMaterial({color:0x8edfff,roughness:.12,metalness:.2,transparent:true,opacity:.75}),dark=mat(0x111827,.3,.2);
 cube(g,1.45,.48,2.55,body,0,.58,0);cube(g,1.25,.42,1.1,body,0,.94,-.25);cube(g,1.1,.34,.9,glass,0,1.03,-.27);
 for(let x of [-.5,.5]){cube(g,.22,.13,.12,mat(0xfff0c0),x,.62,1.3);cube(g,.22,.13,.12,mat(0xff244e),x,.62,-1.3);
 for(let z of [-.82,.82]){let w=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,.18,16),dark);w.rotation.z=Math.PI/2;w.position.set(x*1.55,.34,z);g.add(w)}}
 return g;
}
function init(){
 scene=new THREE.Scene();scene.background=new THREE.Color(0x8bb8d8);scene.fog=new THREE.Fog(0x8bb8d8,38,110);
 camera=new THREE.PerspectiveCamera(62,1,.1,180);camera.position.set(0,7,13);camera.lookAt(0,0,-4);
 renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;mount.appendChild(renderer.domElement);
 scene.add(new THREE.HemisphereLight(0xdff4ff,0x43516a,2));let sun=new THREE.DirectionalLight(0xffffff,2.3);sun.position.set(-7,15,9);sun.castShadow=true;scene.add(sun);
 let ground=new THREE.Mesh(new THREE.PlaneGeometry(180,180),mat(0x3d7852));ground.rotation.x=-Math.PI/2;ground.position.y=-.13;scene.add(ground);
 let road=new THREE.Mesh(new THREE.PlaneGeometry(10,140),mat(0x252e3b));road.rotation.x=-Math.PI/2;road.position.set(0,-.05,-45);scene.add(road);
 for(let x of [-5.1,5.1]){let rail=new THREE.Mesh(new THREE.BoxGeometry(.16,.25,140),mat(0xe3edf3));rail.position.set(x,.1,-45);scene.add(rail)}
 for(let x of [-1.18,1.18])for(let i=0;i<20;i++){let m=new THREE.Mesh(new THREE.BoxGeometry(.07,.025,3),mat(0xf5f1db));m.position.set(x,0,-i*7);scene.add(m);marks.push(m)}
 for(let i=0;i<30;i++)for(let side of [-1,1]){let x=side*(7+(i%3)*.5),z=-i*5-5;let trunk=new THREE.Mesh(new THREE.CylinderGeometry(.12,.17,1.2,8),mat(0x765038));trunk.position.set(x,.5,z);scene.add(trunk);let crown=new THREE.Mesh(new THREE.ConeGeometry(.85,2.2,9),mat(i%2?0x1e754c:0x287e57));crown.position.set(x,2,z);scene.add(crown)}
 player=car(0xff315f);player.position.set(0,0,5);scene.add(player);clock=new THREE.Clock();resize();addEventListener('resize',resize);animate();
}
function resize(){if(!renderer)return;let w=Math.max(1,mount.clientWidth),h=Math.max(1,mount.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function hud(){$('score').textContent=String(Math.floor(score)).padStart(5,'0');$('speed').textContent=Math.round(speed*180);$('lives').textContent='♥ '.repeat(Math.max(0,lives))||'—'}
function spawnCar(){let n=Math.floor(Math.random()*3),o=car([0xffb02e,0x4e9bff,0xa77bff,0xe7e9ef][Math.floor(Math.random()*4)]);o.position.set(laneX[n],0,-70);scene.add(o);obstacles.push({mesh:o,hit:false})}
function clear(){obstacles.forEach(o=>scene.remove(o.mesh));obstacles=[]}
function reset(){score=0;lives=3;speed=.46;spawn=0;invuln=0;targetLane=0;player.position.x=0;clear();over=false;running=false;hud();cover.style.display='grid';$('coverTitle').textContent='Ready to race?';$('coverText').textContent='Choose a control mode, then start your engine.';$('start').textContent='▶ START GAME'}
function end(){running=false;over=true;cover.style.display='grid';$('coverTitle').textContent='Race Over!';$('coverText').textContent=`Your score: ${Math.floor(score)}. Try again!`;$('start').textContent='↻ RACE AGAIN'}
function start(){if(over)reset();mode=document.querySelector('input[name="mode"]:checked').value;cover.style.display='none';running=true;clock.getDelta()}
function laneMove(n){targetLane=Math.max(-1,Math.min(1,targetLane+n))}
function update(dt){
 if(!running)return;
 let kb=mode==='keyboard'||mode==='both',gest=mode==='gesture'||mode==='both';
 if(kb){if(keys.ArrowLeft||keys.KeyA){laneMove(-1);keys.ArrowLeft=keys.KeyA=false}if(keys.ArrowRight||keys.KeyD){laneMove(1);keys.ArrowRight=keys.KeyD=false}
 if(keys.ArrowUp||keys.KeyW)speed=Math.min(1.08,speed+dt*1.1);else if(keys.ArrowDown||keys.KeyS)speed=Math.max(.2,speed-dt*1.4);else speed=THREE.MathUtils.lerp(speed,.5,dt*.7)}
 if(gest&&hand){
   // Divide the mirrored camera view into three clear steering zones.
   if(hand.x < .34) targetLane = -1;
   else if(hand.x > .66) targetLane = 1;
   else targetLane = 0;
   if(hand.fist) speed=Math.max(.2,speed-dt);
   else if(hand.open) speed=Math.min(1.08,speed+dt*.7);
 }
 player.position.x=THREE.MathUtils.lerp(player.position.x,laneX[1]+targetLane*2.35,dt*7);
 player.rotation.z=THREE.MathUtils.lerp(player.rotation.z,-(targetLane*2.35-player.position.x)*.09,dt*5);
 let ws=22*speed;marks.forEach(m=>{m.position.z+=ws*dt;if(m.position.z>8)m.position.z-=140});
 spawn+=dt;if(spawn>Math.max(.62,1.35-score/25000)){spawn=0;spawnCar()}
 invuln=Math.max(0,invuln-dt);
 for(let i=obstacles.length-1;i>=0;i--){let o=obstacles[i];o.mesh.position.z+=ws*dt;if(o.mesh.position.z>10){scene.remove(o.mesh);obstacles.splice(i,1);score+=80;continue}
 if(Math.abs(o.mesh.position.z-player.position.z)<1.8&&Math.abs(o.mesh.position.x-player.position.x)<1.25&&invuln<=0){scene.remove(o.mesh);obstacles.splice(i,1);lives--;invuln=1.4;if(lives<=0){hud();end();return}}}
 score+=dt*(18+speed*14);speed=Math.min(1.08,speed+dt*.003);player.visible=invuln<=0||Math.floor(invuln*12)%2===0;hud()
}
function animate(){requestAnimationFrame(animate);let dt=Math.min(clock.getDelta(),.05);update(dt);renderer.render(scene,camera)}
function keydown(e){if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();keys[e.code]=true;if(e.code==='Space'&&!running)start()}
addEventListener('keydown',keydown);addEventListener('keyup',e=>keys[e.code]=false);
$('start').onclick=start;$('reset').onclick=reset;
$('full').onclick=async()=>{try{if(!document.fullscreenElement)await $('stage').requestFullscreen();else await document.exitFullscreen();resize()}catch(e){console.warn(e)}};
document.addEventListener('fullscreenchange',()=>setTimeout(resize,100));
document.querySelectorAll('.mobile button').forEach(b=>{let k=b.dataset.key;b.onpointerdown=e=>{e.preventDefault();keys[k]=true};b.onpointerup=b.onpointerleave=b.onpointercancel=()=>keys[k]=false});
async function enableCamera(){
 try{
   if(!navigator.mediaDevices?.getUserMedia) throw Error('Camera needs HTTPS or localhost. Open your GitHub Pages HTTPS link or RUN_LOCAL.bat.');
   if(typeof window.Hands === 'undefined') throw Error('Hand tracking library did not load. Check internet, then refresh.');
   $('camStatus').textContent='Camera: requesting permission…';
   stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
   const video=$('preview');
   video.srcObject=stream;
   video.style.display='block';
   await new Promise((resolve,reject)=>{video.onloadedmetadata=resolve;video.onerror=()=>reject(Error('Could not start camera video.'))});
   await video.play();

   tracker=new window.Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`});
   tracker.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:.55,minTrackingConfidence:.55});
   tracker.onResults(results=>{
     const p=results.multiHandLandmarks?.[0];
     if(!p){hand=null;$('camStatus').textContent='Camera connected — show your full hand in the preview';return;}
     let extended=0;
     for(const [tip,pip] of [[8,6],[12,10],[16,14],[20,18]]) if(p[tip].y < p[pip].y-.015) extended++;
     const thumbIndex=Math.hypot(p[4].x-p[8].x,p[4].y-p[8].y);
     hand={x:1-p[9].x, fist:extended<=1 && thumbIndex>.045, open:extended>=3};
     $('camStatus').textContent=`Hand detected ✓ · ${hand.x<.34?'LEFT':hand.x>.66?'RIGHT':'CENTER'} · ${hand.open?'OPEN PALM':hand.fist?'FIST':'STEER'}`;
   });

   let busy=false, stopped=false;
   const processFrame=async()=>{
     if(stopped || !stream) return;
     if(!busy && video.readyState>=2){
       busy=true;
       try{await tracker.send({image:video});}
       catch(err){console.error('Hand tracking frame error:',err);$('camStatus').textContent='Tracking error — refresh and try again';}
       busy=false;
     }
     if(!stopped) requestAnimationFrame(processFrame);
   };
   processFrame();
   gestureReady=true;
   $('camStatus').textContent='Camera connected — show one hand in the preview';
 }catch(e){
   $('camStatus').textContent='Camera error: '+e.message;
   console.error(e);
 }
}
$('camera').onclick=enableCamera;
init();reset();