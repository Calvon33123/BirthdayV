/* Birthday Quest — storybook navigation + QR upload */
const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyedWxLF1LGYrR8U7jc02S-cvlocMoobIoigN5bQSkvQ8Ya1skAc-A4ChaiLaGqG17A/exec";
const scenes = [...document.querySelectorAll('.scene')];
const progressText = document.getElementById('progressText');
const progressFill = document.getElementById('progressFill');
const questMap = document.getElementById('questMap');
const mapButton = document.getElementById('mapButton');
const mapClose = document.getElementById('mapClose');
const homeButton = document.getElementById('homeButton');

let currentScene = 0;
let selectedCharacter = 'heart';
let qrData = null;

/* The opening game has four beats. The scrapbook chapters are destinations,
   so the progress bar shows the current chapter without forcing linear navigation. */
function updateProgress() {
  const chapter = currentScene <= 3 ? currentScene + 1 : currentScene - 3;
  const total = currentScene <= 3 ? 4 : 4;
  progressText.textContent = `${String(chapter).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;
  progressFill.style.width = `${Math.max(8, (chapter / total) * 100)}%`;
}

function showScene(index, direction = 'forward') {
  const next = Math.max(0, Math.min(scenes.length - 1, Number(index)));
  if (next === currentScene) return;

  scenes.forEach((scene, i) => {
    scene.classList.remove('active', 'leaving', 'enter-left', 'enter-right');
    if (i === currentScene) scene.classList.add('leaving');
    if (i === next) scene.classList.add(direction === 'back' ? 'enter-left' : 'enter-right');
  });

  currentScene = next;
  scenes.forEach((scene, i) => scene.classList.toggle('active', i === currentScene));
  updateProgress();
  closeQuestMap();
  document.body.classList.toggle('paper-mode', currentScene >= 3);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  /* Restart letter reveal animations every time the letter opens. */
  if (currentScene === 5) {
    document.querySelectorAll('.reveal').forEach((p, i) => {
      p.style.animation = 'none';
      void p.offsetWidth;
      p.style.animation = `letterReveal .75s ease ${0.35 + i * 0.5}s both`;
    });
  }
}

function goTo(index) {
  const target = Number(index);
  showScene(target, target < currentScene ? 'back' : 'forward');
}

document.querySelectorAll('[data-next]').forEach(button => {
  button.addEventListener('click', () => goTo(currentScene + 1));
});

document.querySelectorAll('[data-go]').forEach(button => {
  button.addEventListener('click', () => goTo(button.dataset.go));
});

homeButton.addEventListener('click', () => goTo(0));

/* Quest map is optional convenience navigation, not required for the experience. */
function openQuestMap() {
  questMap.classList.add('open');
  questMap.setAttribute('aria-hidden', 'false');
}
function closeQuestMap() {
  questMap.classList.remove('open');
  questMap.setAttribute('aria-hidden', 'true');
}
mapButton.addEventListener('click', openQuestMap);
mapClose.addEventListener('click', closeQuestMap);
questMap.addEventListener('click', e => {
  if (e.target === questMap) closeQuestMap();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeQuestMap();
});

/* Character choice */
document.querySelectorAll('.character').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.character').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedCharacter = card.dataset.character;
  });
});

/* ==========================================
   GLOBAL BIRTHDAY MUSIC
   The first START click is used as the
   browser-safe user gesture that starts audio.
========================================== */
const birthdayMusic=document.getElementById('birthdayMusic');
const MUSIC_FILE='assets/music/quest-audio.dat';
let musicObjectUrl=null;
let musicLoaded=false;
let musicLoading=null;

const musicPlayer=document.getElementById('musicPlayer');
const musicPlay=document.getElementById('musicPlay');
const musicProgress=document.getElementById('musicProgress');
const musicCurrent=document.getElementById('musicCurrent');
const musicDuration=document.getElementById('musicDuration');
const musicTabPlay=document.getElementById('musicTabPlay');
const musicTabProgress=document.getElementById('musicTabProgress');
const musicTabCurrent=document.getElementById('musicTabCurrent');
const musicTabDuration=document.getElementById('musicTabDuration');
const musicNote=document.getElementById('musicNote');

function formatMusicTime(seconds){
  if(!Number.isFinite(seconds))return '0:00';
  const m=Math.floor(seconds/60),s=Math.floor(seconds%60).toString().padStart(2,'0');
  return `${m}:${s}`;
}

function updateMusicUI(){
  const playing=birthdayMusic&&!birthdayMusic.paused;
  if(musicPlay)musicPlay.textContent=playing?'❚❚':'▶';
  if(musicTabPlay)musicTabPlay.textContent=playing?'❚❚':'▶';
  if(musicNote){
    musicNote.textContent=playing?'♫ music is playing — keep exploring ♡':'♫ music is paused — press play whenever you are ready...';
    musicNote.classList.toggle('playing',playing);
  }
  if(musicPlayer)musicPlayer.classList.toggle('playing',playing);
}

function updateMusicProgress(){
  if(!birthdayMusic||!Number.isFinite(birthdayMusic.duration)||birthdayMusic.duration<=0)return;
  const p=birthdayMusic.currentTime/birthdayMusic.duration*100;
  if(musicProgress)musicProgress.value=p;
  if(musicTabProgress)musicTabProgress.value=p;
  const c=formatMusicTime(birthdayMusic.currentTime),d=formatMusicTime(birthdayMusic.duration);
  if(musicCurrent)musicCurrent.textContent=c;
  if(musicDuration)musicDuration.textContent=d;
  if(musicTabCurrent)musicTabCurrent.textContent=c;
  if(musicTabDuration)musicTabDuration.textContent=d;
}

async function loadBirthdayMusic(){
  if(musicLoaded)return true;
  if(musicLoading)return musicLoading;

  musicLoading=(async()=>{
    const response=await fetch(MUSIC_FILE,{cache:'force-cache',credentials:'same-origin'});
    if(!response.ok)throw new Error(`Music file returned HTTP ${response.status}`);

    const bytes=await response.arrayBuffer();
    const audioBlob=new Blob([bytes],{type:'audio/mpeg'});
    musicObjectUrl=URL.createObjectURL(audioBlob);
    birthdayMusic.src=musicObjectUrl;
    birthdayMusic.load();
    musicLoaded=true;
    return true;
  })();

  try{
    return await musicLoading;
  }finally{
    musicLoading=null;
  }
}

async function playBirthdayMusic(){
  if(!birthdayMusic)return false;
  try{
    await loadBirthdayMusic();
    await birthdayMusic.play();
    updateMusicUI();
    updateMusicProgress();
    return true;
  }catch(e){
    console.error('Unable to play birthday music:',e);
    if(musicNote)musicNote.textContent='♫ Music could not start. Make sure the website files are uploaded together.';
    updateMusicUI();
    return false;
  }
}

function toggleBirthdayMusic(){
  if(!birthdayMusic)return;
  if(birthdayMusic.paused)playBirthdayMusic();
  else{birthdayMusic.pause();updateMusicUI();}
}

function seekBirthdayMusic(value){
  if(!birthdayMusic||!Number.isFinite(birthdayMusic.duration))return;
  birthdayMusic.currentTime=Number(value)/100*birthdayMusic.duration;
}

if(musicPlay)musicPlay.addEventListener('click',toggleBirthdayMusic);
if(musicTabPlay)musicTabPlay.addEventListener('click',toggleBirthdayMusic);
if(musicProgress)musicProgress.addEventListener('input',e=>seekBirthdayMusic(e.target.value));
if(musicTabProgress)musicTabProgress.addEventListener('input',e=>seekBirthdayMusic(e.target.value));

if(birthdayMusic){
  birthdayMusic.addEventListener('loadedmetadata',updateMusicProgress);
  birthdayMusic.addEventListener('timeupdate',updateMusicProgress);
  birthdayMusic.addEventListener('play',updateMusicUI);
  birthdayMusic.addEventListener('pause',updateMusicUI);
  birthdayMusic.addEventListener('ended',updateMusicUI);
  birthdayMusic.addEventListener('error',()=>{
    console.error('Birthday music playback error:',birthdayMusic.error);
    if(musicNote)musicNote.textContent='♫ Music could not be loaded. Check that quest-audio.dat is present.';
  });
}

/* Try to start automatically as soon as the page opens.
   Modern browsers may block audible autoplay. If they do, the
   first normal interaction starts the same music automatically. */
let musicAutoplayStarted=false;

async function startMusicOnPageOpen(){
  if(musicAutoplayStarted)return;
  const started=await playBirthdayMusic();
  if(started){
    musicAutoplayStarted=true;
    document.removeEventListener('pointerdown',fallbackMusicStart);
    document.removeEventListener('keydown',fallbackMusicStart);
    document.removeEventListener('touchstart',fallbackMusicStart);
  }
}

async function fallbackMusicStart(){
  if(musicAutoplayStarted)return;
  const started=await playBirthdayMusic();
  if(started){
    musicAutoplayStarted=true;
    document.removeEventListener('pointerdown',fallbackMusicStart);
    document.removeEventListener('keydown',fallbackMusicStart);
    document.removeEventListener('touchstart',fallbackMusicStart);
  }
}

/* Browser policy fallback: if autoplay with sound is blocked, start
   immediately after the visitor's first interaction. */
document.addEventListener('pointerdown',fallbackMusicStart,{passive:true});
document.addEventListener('keydown',fallbackMusicStart);
document.addEventListener('touchstart',fallbackMusicStart,{passive:true});

/* Attempt audible autoplay immediately when the page opens. */
if(document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded',startMusicOnPageOpen,{once:true});
else
  startMusicOnPageOpen();

const startButton=document.querySelector('[data-scene="0"] [data-next]');
if(startButton){
  startButton.addEventListener('click',()=>{playBirthdayMusic();},{once:true});
}

window.addEventListener('beforeunload',()=>{
  if(musicObjectUrl)URL.revokeObjectURL(musicObjectUrl);
});

updateMusicUI();
updateMusicProgress();
/* QR upload */
const qrInput = document.getElementById('qrInput');
const qrPreview = document.getElementById('qrPreview');
const sendQrButton = document.getElementById('sendQrButton');
const qrStatus = document.getElementById('qrStatus');

qrInput.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file || !file.type.startsWith('image/')) {
    qrStatus.textContent = 'Please choose a PNG, JPG, or WEBP image.';
    return;
  }

  if (file.size > 8 * 1024 * 1024) {
    qrStatus.textContent = 'That image is a little too large. Please keep it under 8 MB.';
    qrInput.value = '';
    return;
  }

  qrData = await fileToDataURL(file);
  qrPreview.innerHTML = `<img src="${qrData}" alt="Uploaded payment QR code">`;
  sendQrButton.classList.remove('hidden');
  qrStatus.textContent = 'QR preview ready ♡ Press send when you are happy with it.';
});

sendQrButton.addEventListener('click', async () => {
  if (!qrData) return;

  if (!isGoogleConnected()) {
    qrStatus.textContent = 'Preview ready. Add your Google Apps Script Web App URL in script.js to enable sending.';
    return;
  }

  sendQrButton.disabled = true;
  qrStatus.textContent = 'Sending your QR code…';

  try {
    const body = new URLSearchParams({
      action: 'uploadQR',
      name: 'birthday-payment-qr',
      character: selectedCharacter,
      image: qrData
    });

    await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body });
    qrStatus.textContent = 'QR code sent! ♡ You can now go back to the scrapbook.';
  } catch (error) {
    console.error(error);
    qrStatus.textContent = 'The preview is safe, but the Google upload could not be completed.';
  } finally {
    sendQrButton.disabled = false;
  }
});

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function isGoogleConnected() {
  return GOOGLE_SCRIPT_URL && !GOOGLE_SCRIPT_URL.includes('PASTE_YOUR');
}

/* Tiny ambient pixel stars */
const sparkleLayer = document.getElementById('pixelSparkles');
for (let i = 0; i < 42; i++) {
  const star = document.createElement('i');
  star.textContent = Math.random() > 0.5 ? '✦' : '·';
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.animationDelay = `${Math.random() * 3}s`;
  sparkleLayer.appendChild(star);
}

updateProgress();


