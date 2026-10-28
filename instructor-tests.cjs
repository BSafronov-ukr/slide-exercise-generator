const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),C=require('./practice-core.js');
class E{constructor(tag){this.tag=tag;this.children=[];this.attributes={}}append(...c){this.children.push(...c)}setAttribute(k,v){this.attributes[k]=v}}
const head=new E('header'),host=new E('article'),panel=new E('section');host.append(head);
const saved={},ids={exercise:host,'answers-panel':panel},document={createElement:t=>new E(t),createTextNode:t=>({textContent:t}),getElementById:k=>ids[k]};
const clip={title:'Fixture explanation',recording:'fixture.mp4',startLabel:'2:00',endLabel:'3:00',src:'lecture-clips/fixture.mp4',canvasUrl:'https://example.com/course'};
const ctx={window:{PracticeCore:C,INSTRUCTOR_CLIPS:{exercises:{fixture:[clip]}}},document,localStorage:{getItem:k=>saved[k]||null,setItem:(k,v)=>saved[k]=v}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('study-tools.js','utf8'),ctx);const S=ctx.window.StudyTools,e={id:'fixture'};
const find=(n,fn)=>fn(n)?n:n.children?.map(c=>find(c,fn)).find(Boolean);
S.mount(e,C.fresh());assert.equal(panel.children.length,0);assert(!find(host,n=>n.tag==='video'));
let s=C.submit(C.fresh(),'first',null).state;S.mount(e,s);assert.equal(panel.children.length,0);
s=C.submit(s,'second',null).state;S.mount(e,s);assert.equal(head.children.length,1);assert.equal(panel.children.length,1);assert(!find(panel,n=>n.tag==='video'));
const load=find(panel,n=>n.textContent==='Load explanation');load.onclick();const video=find(panel,n=>n.tag==='video');assert.equal(video.src,clip.src);assert(video.controls);load.onclick();assert.equal(find(panel,n=>n.tag==='video'),video);
const speed=find(panel,n=>n.tag==='select');speed.value='1.5';speed.onchange();assert.equal(video.playbackRate,1.5);
const star=find(head,n=>n.tag==='button');star.onclick();assert(S.matches(e,'saved',{}));assert(S.matches(e,'video',{}));assert(!S.matches({id:'other'},'video',{}));assert(S.matches(e,'retry',{fixture:{attempts:[{results:[{status:'incorrect'}]}]}}));
star.onclick();assert(!S.matches(e,'saved',{}));
console.log('PASS: video absent before two attempts; lazy loading; one player; speed; bookmarks persist; video and missed-answer filters.');
