/* SPDX-License-Identifier: GPL-3.0-only */
(function(root){
 'use strict';
 const KEY='slide-practice-bookmarks-v1';let saved={};try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
 const clips=()=>root.INSTRUCTOR_CLIPS?.exercises||{};
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
 function save(){try{localStorage.setItem(KEY,JSON.stringify(saved))}catch{}}
 function matches(e,mode,states){const s=states[e.id];if(mode==='saved')return !!saved[e.id];if(mode==='retry')return s?.attempts?.some(a=>a.status==='incorrect'||a.results?.some(r=>r.status==='incorrect'));if(mode==='video')return !!clips()[e.id]?.length;return true}
 function mount(e,s){
  const host=document.getElementById('exercise'),head=host.children[0],actions=node('div',null,'study-actions');
  const star=node('button',saved[e.id]?'★ Saved for review':'☆ Save for review');star.setAttribute('aria-pressed',String(!!saved[e.id]));star.onclick=()=>{saved[e.id]=!saved[e.id];save();star.textContent=saved[e.id]?'★ Saved for review':'☆ Save for review';star.setAttribute('aria-pressed',String(!!saved[e.id]))};actions.append(star);
  const reference=node('span',e.id,'exercise-reference');actions.append(reference);if(!head._studyMounted){head.append(actions);head._studyMounted=true}
  const entries=clips()[e.id]||[],panel=document.getElementById('answers-panel');
  // No media URL, player, or external request enters the DOM while answers are locked.
  if(!root.PracticeCore.unlocked(s))return;
  const section=node('section',null,'instructor-panel');section.id='instructor-explanation';section.append(node('div','FROM YOUR CLASSROOM','eyebrow'),node('h3','Your instructor explains this problem'));
  if(!entries.length){section.append(node('p','No exact recording segment has been verified for this exercise yet.','scope'));panel.append(section);return}
  entries.forEach(clip=>{
   const card=node('div',null,'lecture-clip');card.append(node('h4',clip.title),node('p',`${clip.recording} · ${clip.startLabel}–${clip.endLabel} in the original recording`,'scope'));
   const play=node('button','Load explanation','primary'),slot=node('div',null,'lecture-player');
   play.onclick=()=>{if(slot.children.length)return;const video=node('video');video.controls=true;video.preload='metadata';video.playsInline=true;video.setAttribute('aria-label',clip.title+' — instructor explanation');video.src=clip.src;slot.append(video);play.hidden=true;
    const tools=node('div',null,'playback-tools'),replay=node('button','↺ Replay clip'),label=node('label','Playback speed'),speed=node('select');speed.setAttribute('aria-label','Explanation playback speed');[.75,1,1.25,1.5,2].forEach(rate=>{const o=node('option',rate+'×');o.value=rate;if(rate===1)o.selected=true;speed.append(o)});speed.onchange=()=>{video.playbackRate=Number(speed.value)};replay.onclick=()=>{video.currentTime=0;video.play().catch(()=>{})};label.append(speed);tools.append(replay,label);slot.append(tools);
    video.onerror=()=>{slot.append(node('p','The clip could not load. Open the original Canvas recording below.','feedback incorrect'))};
   };
   const original=node('a','Open original in Canvas ↗');original.href=clip.canvasUrl;original.target='_blank';original.rel='noopener noreferrer';const fallback=node('p',null,'scope');fallback.append(original);fallback.append(document.createTextNode(' · Canvas sign-in may be required. Seek to '+clip.startLabel+'.'));
   card.append(play,slot,fallback);section.append(card);
  });panel.append(section);
 }
 root.StudyTools={matches,mount};
})(typeof window==='undefined'?globalThis:window);
