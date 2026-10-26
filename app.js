// Protótipo inicial: os dados ficam apenas neste navegador.
// Para uso real pela equipe, conecte Firebase Authentication e Firestore antes de cadastrar dados reais.
const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "ce-birthday-demo-v1";
let students = loadStudents();
let selectedPreviewId = null;

function loadStudents(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function saveStudents(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); }
function birthdayParts(date){ const d = new Date(date + "T12:00:00"); return {day:d.getDate(),month:d.getMonth()}; }
function nextBirthday(student){
  const {day,month}=birthdayParts(student.birthday);
  const now=new Date(); let next=new Date(now.getFullYear(),month,day,12);
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  if(next<today) next=new Date(now.getFullYear()+1,month,day,12);
  return next;
}
function isToday(student){ const b=birthdayParts(student.birthday), n=new Date(); return b.day===n.getDate() && b.month===n.getMonth(); }
function dateLabel(date){return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long"}).format(date);}
function messageFor(s){
  if(s.gender==="feminino") return `Feliz aniversário, ${s.name.split(" ")[0]}! 🎂💛\n\nQue seu dia seja incrível, cheio de alegria, saúde e realizações! Toda a equipe Crosstraining Evolution deseja que você continue brilhando e conquistando seus objetivos.\n\nParabéns! 🖤💛`;
  if(s.gender==="masculino") return `Parabéns, ${s.name.split(" ")[0]}! 🎉💪\n\nHoje é seu dia! Toda a equipe Crosstraining Evolution deseja muita saúde, felicidade e muitas conquistas. Que você continue evoluindo e superando seus limites com a gente!\n\nFeliz aniversário! 🖤💛`;
  return `Feliz aniversário, ${s.name.split(" ")[0]}! 🎉\n\nToda a equipe Crosstraining Evolution deseja muita saúde, alegria e conquistas. Que seu novo ciclo seja incrível!\n\nParabéns! 🖤💛`;
}
function sendWhatsApp(s){
  const text=encodeURIComponent(messageFor(s));
  const url=s.phone ? `https://wa.me/${s.phone.replace(/\D/g,"")}?text=${text}` : `https://wa.me/?text=${text}`;
  window.open(url,"_blank","noopener,noreferrer");
  $("messagePreview").textContent=messageFor(s);
  selectedPreviewId=s.id;
}
function editStudent(id){
  const s=students.find(x=>x.id===id); if(!s)return;
  $("studentId").value=s.id; $("name").value=s.name; $("birthday").value=s.birthday; $("gender").value=s.gender; $("phone").value=s.phone||"";
  $("studentForm").classList.remove("hidden"); $("toggleForm").textContent="Fechar cadastro";
  window.scrollTo({top:$("studentForm").getBoundingClientRect().top+window.scrollY-80,behavior:"smooth"});
}
function removeStudent(id){
  const s=students.find(x=>x.id===id); if(!s)return;
  if(confirm(`Excluir o cadastro de ${s.name}?`)){students=students.filter(x=>x.id!==id);saveStudents();render();}
}
function renderStudent(s,showDate=false){
  const el=document.createElement("article");el.className="student";
  const avatar=document.createElement("div");avatar.className="avatar";avatar.textContent=s.name.trim().split(/\s+/).map(n=>n[0]).slice(0,2).join("").toUpperCase();
  const info=document.createElement("div");info.className="student-info";
  const name=document.createElement("strong");name.textContent=s.name;
  const meta=document.createElement("small");meta.textContent=(s.gender==="feminino"?"Feminino":s.gender==="masculino"?"Masculino":"Neutro")+(showDate?" · "+dateLabel(nextBirthday(s)):"");
  info.append(name,meta);
  const actions=document.createElement("div");actions.className="student-actions";
  const msg=document.createElement("button");msg.className="small-button whatsapp";msg.textContent="WhatsApp";msg.addEventListener("click",()=>sendWhatsApp(s));
  const edit=document.createElement("button");edit.className="small-button";edit.textContent="Editar";edit.addEventListener("click",()=>editStudent(s.id));
  const del=document.createElement("button");del.className="small-button";del.textContent="Excluir";del.addEventListener("click",()=>removeStudent(s.id));
  actions.append(msg,edit,del);el.append(avatar,info,actions);return el;
}
function render(){
  const query=$("search").value.trim().toLocaleLowerCase("pt-BR");
  const filtered=students.filter(s=>s.name.toLocaleLowerCase("pt-BR").includes(query));
  const today=filtered.filter(isToday).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
  const upcoming=filtered.filter(s=>!isToday(s)).sort((a,b)=>nextBirthday(a)-nextBirthday(b)).slice(0,10);
  $("todayCount").textContent=students.filter(isToday).length;
  $("totalCount").textContent=students.length;
  $("todayList").replaceChildren(...today.map(s=>renderStudent(s)));
  $("upcomingList").replaceChildren(...upcoming.map(s=>renderStudent(s,true)));
  $("todayEmpty").style.display=today.length?"none":"block";
  $("upcomingEmpty").style.display=upcoming.length?"none":"block";
  if(selectedPreviewId){const s=students.find(x=>x.id===selectedPreviewId);if(s)$("messagePreview").textContent=messageFor(s);}
}
$("toggleForm").addEventListener("click",()=>{$("studentForm").classList.toggle("hidden");$("toggleForm").textContent=$("studentForm").classList.contains("hidden")?"+ Cadastrar aluno":"Fechar cadastro";});
$("cancelForm").addEventListener("click",()=>{resetForm();});
function resetForm(){$("studentForm").reset();$("studentId").value="";$("studentForm").classList.add("hidden");$("toggleForm").textContent="+ Cadastrar aluno";}
$("studentForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("studentId").value||crypto.randomUUID();
  const record={id,name:$("name").value.trim(),birthday:$("birthday").value,gender:$("gender").value,phone:$("phone").value.trim()};
  if(!record.name||!record.birthday||!record.gender)return;
  const idx=students.findIndex(s=>s.id===id);
  if(idx>=0)students[idx]=record;else students.push(record);
  saveStudents();selectedPreviewId=id;$("messagePreview").textContent=messageFor(record);resetForm();render();
});
$("search").addEventListener("input",render);
const now=new Date();document.querySelector(".panel .eyebrow").textContent=`AGENDA · ${new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long"}).format(now).toLocaleUpperCase("pt-BR")}`;
render();