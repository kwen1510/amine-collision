/*
Molecule Collision Simulator – v3.5 (Legend Added)
==================================================
Adds a **colour legend** so users immediately see which hue corresponds to each
species.

UI Adjustments
--------------
• New `<Legend>` component inside the control panel: a column of coloured dots
  with labels (NH₃, CH₃Cl, HCl, Quaternary salt).
• Counts remain in their own column for clarity.
*/

import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'

const CANVAS_W = 640
const CANVAS_H = 640
const FPS = 60
const DT = 1 / FPS

const COLORS = {
  amine: '#7c3aed',     // NH₃ & amines – purple
  ch3cl: '#b45309',     // CH₃Cl – brown
  hcl: '#64748b',       // HCl – slate gray
  quaternary: '#ef4444',// (CH₃)₄N⁺ – red
  flash: '#ffffff',
}

const rand = (min, max) => Math.random() * (max - min) + min
const randVel = () => rand(-70, 70)

const makeAmine = m => ({ kind: 'amine', methyls: m, x: rand(20, CANVAS_W - 20), y: rand(20, CANVAS_H - 20), vx: randVel(), vy: randVel(), r: 8 + m, flash: 0 })
const makeCh3Cl = () => ({ kind: 'ch3cl', x: rand(20, CANVAS_W - 20), y: rand(20, CANVAS_H - 20), vx: randVel(), vy: randVel(), r: 6 })
const makeHCl = (x, y) => ({ kind: 'hcl', x, y, vx: randVel(), vy: randVel(), r: 3, ttl: FPS * 5 })
const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2
const bounce = (a, b) => { const dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy||1e-6,nx=dx/Math.sqrt(d2),ny=dy/Math.sqrt(d2),p=((a.vx-b.vx)*nx+(a.vy-b.vy)*ny);a.vx-=p*nx;a.vy-=p*ny;b.vx+=p*nx;b.vy+=p*ny }

function simulate(ps){
  for(const p of ps){p.x+=p.vx*DT;p.y+=p.vy*DT;if(p.x<p.r||p.x>CANVAS_W-p.r)p.vx*=-1;if(p.y<p.r||p.y>CANVAS_H-p.r)p.vy*=-1;if(p.kind==='hcl')p.ttl-=1;if(p.flash)p.flash-=1}
  for(let i=0;i<ps.length;i++){for(let j=i+1;j<ps.length;j++){const a=ps[i],b=ps[j],d=a.r+b.r; if(dist2(a,b)<d*d){ if(a.kind==='amine'&&a.methyls<4&&b.kind==='ch3cl'){a.methyls++;a.r++;a.flash=6;ps.push(makeHCl(a.x,a.y));ps.splice(j,1);j--;continue} if(b.kind==='amine'&&b.methyls<4&&a.kind==='ch3cl'){b.methyls++;b.r++;b.flash=6;ps.push(makeHCl(b.x,b.y));ps.splice(i,1);i--;continue} bounce(a,b) } } }
  for(let k=ps.length-1;k>=0;k--) if(ps[k].kind==='hcl'&&ps[k].ttl<=0) ps.splice(k,1)
}

function drawParticle(ctx,p){ if(p.kind==='amine'){ ctx.fillStyle=p.flash?COLORS.flash:COLORS.amine; ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,2*Math.PI);ctx.fill(); const sR=4; for(let i=0;i<p.methyls;i++){ const ang=i/p.methyls*2*Math.PI; ctx.fillStyle=COLORS.ch3cl; ctx.beginPath();ctx.arc(p.x+(p.r+sR+2)*Math.cos(ang),p.y+(p.r+sR+2)*Math.sin(ang),sR,0,2*Math.PI);ctx.fill()} if(p.methyls===4){ const rR=4,ang=-Math.PI/3; ctx.fillStyle=COLORS.quaternary; ctx.beginPath();ctx.arc(p.x+(p.r+rR+4)*Math.cos(ang),p.y+(p.r+rR+4)*Math.sin(ang),rR,0,2*Math.PI);ctx.fill() } } else { ctx.fillStyle=p.kind==='ch3cl'?COLORS.ch3cl:COLORS.hcl; ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,2*Math.PI);ctx.fill() } }

const Slider=({label,value,setValue,disabled})=>(<div className='flex flex-col items-center gap-1 w-44'><label className='text-xs font-medium text-gray-600'>{label}</label><input type='range' min='0' max='200' value={value} disabled={disabled} onChange={e=>setValue(+e.target.value)} className='w-full accent-purple-600 disabled:opacity-40 h-2 rounded-lg'/><span className='text-[11px] font-mono'>{value}</span></div>)

const Legend=()=> (
  <div className='flex flex-col gap-2 text-sm font-medium text-gray-700'>
    {[
      {label:'NH₃ / Amines',color:COLORS.amine},
      {label:'CH₃Cl',color:COLORS.ch3cl},
      {label:'HCl',color:COLORS.hcl},
      {label:'(CH₃)₄N⁺',color:COLORS.quaternary},
    ].map(({label,color})=> (
      <div key={label} className='flex items-center gap-2'>
        <span className='inline-block w-4 h-4 rounded-full' style={{background:color}}></span>
        <span>{label}</span>
      </div>
    ))}
  </div>
)

export default function App(){
  const[nh3,setNh3]=useState(50),[ch3cl,setCh3Cl]=useState(50),[running,setRunning]=useState(false),[seed,setSeed]=useState(0),[,tick]=useState(0)
  const canvasRef=useRef(null),psRef=useRef([])
  useEffect(()=>{const arr=[];for(let i=0;i<nh3;i++)arr.push(makeAmine(0));for(let i=0;i<ch3cl;i++)arr.push(makeCh3Cl());psRef.current=arr; canvasRef.current?.getContext('2d')?.clearRect(0,0,CANVAS_W,CANVAS_H)},[seed])
  useEffect(()=>{const ctx=canvasRef.current?.getContext('2d');let id;const step=()=>{if(running&&ctx){simulate(psRef.current);ctx.clearRect(0,0,CANVAS_W,CANVAS_H);psRef.current.forEach(p=>drawParticle(ctx,p));tick(t=>t+1)}id=requestAnimationFrame(step)};id=requestAnimationFrame(step);return()=>cancelAnimationFrame(id)},[running])
  const counts={am0:0,am1:0,am2:0,am3:0,am4:0,ch3cl:0};psRef.current.forEach(p=>{if(p.kind==='amine')counts['am'+p.methyls]++;else if(p.kind==='ch3cl')counts.ch3cl++})
  const preset=p=>{setRunning(false);if(p==='NH3'){setNh3(160);setCh3Cl(20)}else{setNh3(20);setCh3Cl(160)}setSeed(s=>s+1)}
  return(<div className='min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-indigo-50 via-sky-100 to-violet-50 py-10 px-4'>
   <h1 className='text-4xl font-extrabold text-indigo-600 drop-shadow-sm mb-8 text-center'>Molecule Collision Simulator</h1>
   <div className='flex flex-col md:flex-row items-start gap-8'>
     {/* Control panel */}
     <div className='w-full md:w-80 backdrop-blur-md bg-white/70 ring-1 ring-gray-200 shadow-xl rounded-2xl px-6 py-6 flex flex-col gap-6'>
       <Slider label='NH₃ (purple)' value={nh3} setValue={v=>{setNh3(v);setSeed(s=>s+1)}} disabled={running}/>
       <Slider label='CH₃Cl (brown)' value={ch3cl} setValue={v=>{setCh3Cl(v);setSeed(s=>s+1)}} disabled={running}/>
       <div className='flex flex-col gap-3'>
         <Button variant='outline' className='rounded-full shadow-sm' onClick={()=>preset('NH3')}>Excess NH₃</Button>
         <Button variant='outline' className='rounded-full shadow-sm' onClick={()=>preset('CH3Cl')}>Excess CH₃Cl</Button>
       </div>
       <div className='flex gap-3'>
         <Button variant={running?'secondary':'default'} className='rounded-full px-6 shadow-md' onClick={()=>setRunning(r=>!r)}>{running?'Pause':'Start'}</Button>
         <Button variant='outline' className='rounded-full px-6 shadow-md' onClick={()=>{setRunning(false);setSeed(s=>s+1)}}>Reset</Button>
       </div>
       {/* Counts */}
       <div className='flex flex-col gap-1 text-lg font-bold font-mono text-gray-800'>
         <span>NH₃: {counts.am0}</span>
         <span>CH₃NH₂: {counts.am1}</span>
         <span>(CH₃)₂NH: {counts.am2}</span>
         <span>(CH₃)₃N: {counts.am3}</span>
         <span>(CH₃)₄N⁺: {counts.am4}</span>
         <span>CH₃Cl: {counts.ch3cl}</span>
       </div>
       {/* Legend */}
       <Legend />
     </div>
     {/* Canvas */}
     <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} key={seed} className='rounded-[2.5rem] shadow-2xl ring-2 ring-indigo-200 bg-white w-full max-w-[640px] h-auto'/>
   </div>
  </div>)
}
