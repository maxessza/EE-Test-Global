(() => {
const TOTAL=80,$=id=>document.getElementById(id),screens=[$('home-screen'),$('quiz-screen'),$('result-screen')];
let round=[],selected=[],cursor=0,lastMissed=[];
const shuffle=items=>{const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function show(which){screens.forEach((el,i)=>el.classList.toggle('hidden',i!==which));window.scrollTo({top:0,behavior:'smooth'});}
function answeredCount(){return selected.filter(v=>v!==null).length;}
function startRound(){round=shuffle(window.QUESTION_BANK).slice(0,TOTAL);selected=Array(TOTAL).fill(null);cursor=0;renderQuestion();show(1);}
function renderQuestion(){
 const q=round[cursor];$('progress-label').textContent='ข้อ '+(cursor+1)+' จาก '+TOTAL;$('answered-label').textContent='ตอบแล้ว '+answeredCount()+' / '+TOTAL;
 $('progress-bar').style.width=(((cursor+1)/TOTAL)*100)+'%';$('question-source').textContent=q.source;$('question-number').textContent='QUESTION '+String(cursor+1).padStart(2,'0');$('question-text').textContent=q.question;
 const list=$('options-list');list.replaceChildren();
 q.options.forEach((choice,i)=>{const label=document.createElement('label');label.className='option'+(selected[cursor]===i?' selected':'');const input=document.createElement('input');input.type='radio';input.name='answer';input.value=String(i);input.checked=selected[cursor]===i;input.addEventListener('change',()=>{selected[cursor]=i;renderQuestion();});const letter=document.createElement('span');letter.className='option-letter';letter.textContent=String.fromCharCode(65+i)+'.';const text=document.createElement('span');text.className='option-text';text.textContent=choice;label.append(input,letter,text);list.append(label);});
 $('prev-button').disabled=cursor===0;$('prev-button').style.opacity=cursor===0?'.45':'1';$('next-button').textContent=cursor===TOTAL-1?'ข้อสุดท้าย':'ข้อถัดไป →';renderGrid();
}
function renderGrid(){const grid=$('question-grid');grid.replaceChildren();round.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.className='grid-button'+(selected[i]!==null?' answered':'')+(i===cursor?' current':'');b.textContent=String(i+1);b.setAttribute('aria-label','ไปข้อ '+(i+1));b.addEventListener('click',()=>{cursor=i;renderQuestion();});grid.append(b);});}
function finishRound(){const missing=TOTAL-answeredCount();if(missing&&!window.confirm('ยังไม่ได้ตอบ '+missing+' ข้อ ต้องการส่งคำตอบตอนนี้หรือไม่?'))return;
 const correct=round.reduce((sum,q,i)=>sum+(selected[i]===q.answer?1:0),0);lastMissed=round.map((q,i)=>({q,chosen:selected[i],number:i+1})).filter(x=>x.chosen!==x.q.answer);const pct=Math.round(correct/TOTAL*100);
 $('score-value').textContent=correct;$('correct-count').textContent=correct;$('wrong-count').textContent=TOTAL-correct;$('percent-count').textContent=pct+'%';$('score-ring').style.setProperty('--score',pct+'%');
 $('result-message').textContent=pct>=85?'ยอดเยี่ยมมาก':pct>=65?'ไปได้ดี ฝึกต่ออีกนิด':'เริ่มเห็นจุดที่ควรทบทวนแล้ว';$('result-detail').textContent='คุณตอบถูก '+correct+' จาก '+TOTAL+' ข้อ รอบนี้สุ่มจากคลังทั้งหมด '+window.QUESTION_BANK.length+' ข้อ';
 try{const h=JSON.parse(localStorage.getItem('ga-practice-history')||'[]');h.push({score:correct,at:new Date().toISOString()});localStorage.setItem('ga-practice-history',JSON.stringify(h.slice(-20)));}catch(_){}
 $('review-list').classList.add('hidden');$('review-toggle').textContent=lastMissed.length?'ดูข้อที่ผิด ('+lastMissed.length+')':'ดูข้อที่ผิด';$('review-toggle').disabled=!lastMissed.length;show(2);updateHistory();
}
function renderReview(){const root=$('review-list');root.replaceChildren();if(!lastMissed.length){const p=document.createElement('p');p.textContent='ตอบถูกทุกข้อ';root.append(p);return;}
 lastMissed.forEach(({q,chosen,number})=>{const card=document.createElement('article');card.className='review-item';const h=document.createElement('h3');h.textContent=number+'. '+q.question;card.append(h);const wrong=document.createElement('p');wrong.className='wrong';wrong.textContent=chosen===null?'คำตอบของคุณ: เว้นคำตอบ':'คำตอบของคุณ: '+String.fromCharCode(65+chosen)+'. '+q.options[chosen];card.append(wrong);const right=document.createElement('p');right.className='right';right.textContent='คำตอบที่ถูก: '+String.fromCharCode(65+q.answer)+'. '+q.options[q.answer];card.append(right);if(q.explanation){const why=document.createElement('p');why.className='explanation';why.textContent=q.explanation;card.append(why);}root.append(card);});
}
function updateHistory(){try{const h=JSON.parse(localStorage.getItem('ga-practice-history')||'[]');if(!h.length)return;const best=Math.max(...h.map(x=>x.score));$('history-line').textContent='ทำแล้ว '+h.length+' รอบ · คะแนนสูงสุด '+best+' / 80';}catch(_){}}
$('start-button').addEventListener('click',startRound);$('new-round-button').addEventListener('click',startRound);
$('prev-button').addEventListener('click',()=>{if(cursor>0){cursor--;renderQuestion();}});$('next-button').addEventListener('click',()=>{if(cursor<TOTAL-1){cursor++;renderQuestion();}});
$('submit-button').addEventListener('click',finishRound);$('quit-button').addEventListener('click',()=>{if(window.confirm('ออกจากรอบนี้และเริ่มใหม่ภายหลังหรือไม่? คำตอบรอบนี้จะไม่ถูกบันทึก'))show(0);});
$('review-toggle').addEventListener('click',()=>{renderReview();const open=$('review-list').classList.toggle('hidden')===false;$('review-toggle').textContent=open?'ซ่อนข้อที่ผิด':'ดูข้อที่ผิด ('+lastMissed.length+')';});updateHistory();
})();
