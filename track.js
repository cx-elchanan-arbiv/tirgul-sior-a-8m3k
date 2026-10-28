// מעקב בלי שמות לאתר החברים: כל טלפון מקבל קוד אקראי, וכל כניסה, מעבר יום, תשובה וזמן פעיל
// נשלחים כשורה לטופס גוגל של אלחנן (״מעקב אתר התרגול סיור א׳״), שמחובר לגיליון באותו שם.
// שורה: v1|קוד|אירוע|יום|שאלה|תשובה|נכון|שניות|סוג טלפון|מספר כניסה  (״-״ = ריק)
// mksite.sh מעתיק את הקובץ לאתר/ ומוסיף אותו לסוף הדף. הדף עצמו (המקור) לא משתנה.
(function(){
  var FORM='https://docs.google.com/forms/d/e/1FAIpQLSeWblkmw0vWa7Nki3rvwJjQIcauD6pd6UcP0ZzTyYrYR5BrwQ/formResponse';
  var FIELD='entry.1870392598', L=['א','ב','ג','ד'];

  function get(k){try{return localStorage.getItem(k);}catch(e){return null;}}
  function set(k,v){try{localStorage.setItem(k,v);}catch(e){}}
  var dev=get('sior-a-device');
  if(!dev){
    var abc='ABCDEFGHJKMNPQRSTUVWXYZ23456789'; dev='';
    for(var i=0;i<5;i++) dev+=abc[Math.floor(Math.random()*abc.length)];
    set('sior-a-device',dev);
  }
  var visit=(+get('sior-a-visits')||0)+1; set('sior-a-visits',String(visit));
  var ua=navigator.userAgent, phone=/iPhone|iPad/.test(ua)?'אייפון':/Android/.test(ua)?'אנדרואיד':/Mobi/.test(ua)?'טלפון אחר':'מחשב';

  function day(){var t=document.querySelector('.tab[aria-selected="true"]'); return t?t.getAttribute('data-part'):'-';}
  function send(ev,d,q,ch,ok,sec){
    var rec=['v1',dev,ev,d||'-',q||'-',ch||'-',ok===undefined?'-':ok,sec||'-',phone,visit].join('|');
    var body=new URLSearchParams(); body.append(FIELD,rec);
    try{ if(navigator.sendBeacon&&navigator.sendBeacon(FORM,body)) return; }catch(e){}
    try{ fetch(FORM,{method:'POST',mode:'no-cors',body:body,keepalive:true}); }catch(e){}
  }

  // זמן פעיל: נספר רק כשהדף על המסך, ורק אם הייתה נגיעה, גלילה או לחיצה בשתי הדקות האחרונות.
  var IDLE=120000, last=Date.now(), acc=0, tick=Date.now(), vis=document.visibilityState==='visible';
  function count(){var n=Date.now(); if(vis) acc+=Math.max(0,Math.min(n,last+IDLE)-tick); tick=n;}
  function flush(){count(); var s=Math.round(acc/1000); if(s>=5){send('time',day(),0,0,undefined,s); acc=0;}}
  ['pointerdown','scroll','keydown','touchstart'].forEach(function(e){
    addEventListener(e,function(){count(); last=Date.now();},{passive:true,capture:true});
  });
  document.addEventListener('visibilitychange',function(){
    count(); vis=document.visibilityState==='visible';
    if(vis){tick=last=Date.now();} else flush();
  });
  addEventListener('pagehide',flush);
  setInterval(flush,180000);

  // תשובה: נרשמת רק בלחיצה הראשונה על שאלה (כמו בדף עצמו). לפני הלחיצה בודקים שהשאלה עוד פתוחה,
  // ואחרי שהדף סימן אותה קוראים אם צדק.
  document.addEventListener('click',function(ev){
    var b=ev.target.closest&&ev.target.closest('.opt'), el=b&&b.closest('.qi');
    if(el&&!el.classList.contains('done')){
      var m=/^p(\d)-(\d+)$/.exec(el.getAttribute('data-id')||''), k=+b.getAttribute('data-k');
      setTimeout(function(){ if(m&&el.classList.contains('done')) send('answer',m[1],+m[2]+1,L[k],el.classList.contains('right')?1:0); },0);
      return;
    }
    var t=ev.target.closest&&ev.target.closest('.tab');
    if(t) send('tab',t.getAttribute('data-part'));
    var r=ev.target.closest&&ev.target.closest('#reset');
    if(r&&r.classList.contains('warn')) send('reset',day());
  },true);

  var note=document.createElement('p');
  note.style.cssText='font-size:.82em;opacity:.75;margin:14px 0 0';
  note.textContent='האתר אוסף נתונים בלי שמות: כמה נכנסים, כמה זמן, ואילו תשובות נכונות. קוד הטלפון הזה: '+dev;
  var w=document.querySelector('header.mast .wrap'); if(w) w.appendChild(note);

  send('visit',day());
})();
