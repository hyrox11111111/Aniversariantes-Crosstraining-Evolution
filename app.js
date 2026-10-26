import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getDatabase, ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB6YrbvRLLUzMjw9EDWbcx39i8uGMxyDvI",
  authDomain: "aniversariantes-99f4b.firebaseapp.com",
  databaseURL: "https://aniversariantes-99f4b-default-rtdb.firebaseio.com",
  projectId: "aniversariantes-99f4b",
  storageBucket: "aniversariantes-99f4b.firebasestorage.app",
  messagingSenderId: "568363765334",
  appId: "1:568363765334:web:adb589f1e833a8626535f7",
  measurementId: "G-EW95FX95NJ"
};

// IMPORTANTE: substitua os dois valores pelos e-mails exatos das contas autorizadas.
// A proteção real também precisa estar configurada nas Regras do Realtime Database.
const ALLOWED_EMAILS = ["SEU_EMAIL_AQUI", "EMAIL_DA_OUTRA_PESSOA_AQUI"].map(x => x.toLowerCase());
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const $ = id => document.getElementById(id);
let students = [];
let selectedPreviewId = null;
let stopListening = null;
let currentUser = null;

function setLoginStatus(message) { $("loginStatus").textContent = message; }
function birthdayParts(date) { const d = new Date(date + "T12:00:00"); return {day:d.getDate(),month:d.getMonth()}; }
function nextBirthday(student) { const {day,month}=birthdayParts(student.birthday); const now=new Date(); let next=new Date(now.getFullYear(),month,day,12); const today=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12); if(next<today) next=new Date(now.getFullYear()+1,month,day,12); return next; }
function isToday(student) { const b=birthdayParts(student.birthday), n=new Date(); return b.day===n.getDate() && b.month===n.getMonth(); }
function dateLabel(date) { return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long"}).format(date); }
function messageFor(s) {
  if(s.gender==="feminino") return `Feliz aniversário, ${s.name.split(" ")[0]}! 🎂💛\n\nQue seu dia seja incrível, cheio de alegria, saúde e realizações! Toda a equipe Crosstraining Evolution deseja que você continue brilhando e conquistando seus objetivos.\n\nParabéns! 🖤💛`;
  if(s.gender==="masculino") return `Parabéns, ${s.name.split(" ")[0]}! 🎉💪\n\nHoje é seu dia! Toda a equipe Crosstraining Evolution deseja muita saúde, felicidade e muitas conquistas. Que você continue evoluindo e superando seus limites com a gente!\n\nFeliz aniversário! 🖤💛`;
  return `Feliz aniversário, ${s.name.split(" ")[0]}! 🎉\n\nToda a equipe Crosstraining Evolution deseja muita saúde, alegria e conquistas. Que seu novo ciclo seja incrível!\n\nParabéns! 🖤💛`;
}
function sendWhatsApp(s) { const text=encodeURIComponent(messageFor(s)); const url=s.phone ? `https://wa.me/${s.phone.replace(/\D/g,"")}?text=${text}` : `https://wa.me/?text=${text}`; window.open(url,"_blank","noopener,noreferrer"); $("messagePreview").textContent=messageFor(s); selectedPreviewId=s.id; }
function editStudent(id) { const s=students.find(x=>x.id===id); if(!s)return; $("studentId").value=s.id; $("name").value=s.name; $("birthday").value=s.birthday; $("gender").value=s.gender; $("phone").value=s.phone||""; $("studentForm").classList.remove("hidden"); $("toggleForm").textContent="Fechar cadastro"; window.scrollTo({top:$("studentForm").getBoundingClientRect().top+window.scrollY-80,behavior:"smooth"}); }
async function removeStudent(id) { const s=students.find(x=>x.id===id); if(!s)return; if(confirm(`Excluir o cadastro de ${s.name}?`)){try{await remove(ref(db,`aniversariantes/${id}`));}catch(e){alert("Não foi possível excluir. Confira a conexão e as regras do Firebase.");console.error(e);}} }
function renderStudent(s,showDate=false) { const el=document.createElement("article");el.className="student"; const avatar=document.createElement("div");avatar.className="avatar";avatar.textContent=s.name.trim().split(/\s+/).map(n=>n[0]).slice(0,2).join("").toUpperCase(); const info=document.createElement("div");info.className="student-info"; const name=document.createElement("strong");name.textContent=s.name; const meta=document.createElement("small");meta.textContent=(s.gender==="feminino"?"Feminino":s.gender==="masculino"?"Masculino":"Neutro")+(showDate?" · "+dateLabel(nextBirthday(s)):""); info.append(name,meta); const actions=document.createElement("div");actions.className="student-actions"; const msg=document.createElement("button");msg.className="small-button whatsapp";msg.textContent="WhatsApp";msg.addEventListener("click",()=>sendWhatsApp(s)); const edit=document.createElement("button");edit.className="small-button";edit.textContent="Editar";edit.addEventListener("click",()=>editStudent(s.id)); const del=document.createElement("button");del.className="small-button";del.textContent="Excluir";del.addEventListener("click",()=>removeStudent(s.id)); actions.append(msg,edit,del);el.append(avatar,info,actions);return el; }
function render() { const query=$("search").value.trim().toLocaleLowerCase("pt-BR"); const filtered=students.filter(s=>s.name.toLocaleLowerCase("pt-BR").includes(query)); const today=filtered.filter(isToday).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR")); const upcoming=filtered.filter(s=>!isToday(s)).sort((a,b)=>nextBirthday(a)-nextBirthday(b)).slice(0,10); $("todayCount").textContent=students.filter(isToday).length; $("totalCount").textContent=students.length; $("todayList").replaceChildren(...today.map(s=>renderStudent(s))); $("upcomingList").replaceChildren(...upcoming.map(s=>renderStudent(s,true))); $("todayEmpty").style.display=today.length?"none":"block"; $("upcomingEmpty").style.display=upcoming.length?"none":"block"; if(selectedPreviewId){const s=students.find(x=>x.id===selectedPreviewId);if(s)$("messagePreview").textContent=messageFor(s);} }
function resetForm() { $("studentForm").reset(); $("studentId").value=""; $("studentForm").classList.add("hidden"); $("toggleForm").textContent="+ Cadastrar aluno"; }
function startDataListener() { if(stopListening) stopListening(); const listRef=ref(db,"aniversariantes"); stopListening=onValue(listRef,snapshot=>{const data=snapshot.val()||{};students=Object.entries(data).map(([id,s])=>({...s,id})).filter(s=>s.name&&s.birthday&&s.gender);render();},error=>{console.error(error);alert("Não foi possível ler os aniversários. Confira as Regras do Realtime Database.");}); }

$("loginForm").addEventListener("submit",async e=>{e.preventDefault();setLoginStatus("Entrando...");try{const credential=await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value);if(!ALLOWED_EMAILS.includes((credential.user.email||"").toLowerCase())){await signOut(auth);setLoginStatus("Esta conta não está autorizada para este painel.");return;}setLoginStatus("");}catch(err){console.error(err);setLoginStatus("Não foi possível entrar. Confira o e-mail e a senha.");}});
$("resetPassword").addEventListener("click",async()=>{const email=$("loginEmail").value.trim();if(!email){setLoginStatus("Digite seu e-mail acima e clique novamente em Esqueci minha senha.");return;}try{await sendPasswordResetEmail(auth,email);setLoginStatus("Se esse e-mail estiver cadastrado, você receberá instruções para redefinir a senha.");}catch(e){setLoginStatus("Não foi possível solicitar a redefinição. Confira o e-mail cadastrado.");}});
$("logoutButton").addEventListener("click",()=>signOut(auth));
$("toggleForm").addEventListener("click",()=>{$("studentForm").classList.toggle("hidden");$("toggleForm").textContent=$("studentForm").classList.contains("hidden")?"+ Cadastrar aluno":"Fechar cadastro";});
$("cancelForm").addEventListener("click",resetForm);
$("studentForm").addEventListener("submit",async e=>{e.preventDefault();const id=$("studentId").value;const record={name:$("name").value.trim(),birthday:$("birthday").value,gender:$("gender").value,phone:$("phone").value.trim()};if(!record.name||!record.birthday||!record.gender)return;try{let recordRef;if(id){recordRef=ref(db,`aniversariantes/${id}`);await update(recordRef,record);selectedPreviewId=id;}else{recordRef=push(ref(db,"aniversariantes"));await set(recordRef,record);selectedPreviewId=recordRef.key;}$("messagePreview").textContent=messageFor({...record,id:selectedPreviewId});resetForm();}catch(err){console.error(err);alert("Não foi possível salvar. Confira se seu e-mail está autorizado nas Regras do Firebase.");}});
$("search").addEventListener("input",render);
const now=new Date();$("todayEyebrow").textContent=`AGENDA · ${new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long"}).format(now).toLocaleUpperCase("pt-BR")}`;
onAuthStateChanged(auth,user=>{currentUser=user;if(stopListening){stopListening();stopListening=null;}if(user&&ALLOWED_EMAILS.includes((user.email||"").toLowerCase())){$("loginPanel").classList.add("hidden");$("appContent").classList.remove("hidden");$("signedInAs").textContent=`Conectado: ${user.email}`;startDataListener();}else{$("appContent").classList.add("hidden");$("loginPanel").classList.remove("hidden");students=[];render();if(user){signOut(auth);setLoginStatus("Esta conta não está autorizada para este painel.");}}});
