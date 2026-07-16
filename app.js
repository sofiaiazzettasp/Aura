/* ==========================================================================
   PROYECTO AURA - LÓGICA DE LA APLICACIÓN (VANILLA JS ES6+)
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. ESTRUCTURA DE DATOS INTERNA (AURAS DE ÁNIMO)
   -------------------------------------------------------------------------- */
const MOODS_DATA = [
  {
    id: 'relaxed',
    name: 'Relajado',
    emoji: '🧘',
    quote: 'Suelta el control y permite que el momento fluya. Respira hondo, estás en el lugar correcto.',
    audioName: 'Oleaje Oceánico (Ruido Rosa Modulado)',
    auras: {
      '--color-aura-1': 'rgba(79, 209, 197, 0.65)',  /* Turquesa */
      '--color-aura-2': 'rgba(99, 179, 237, 0.65)',  /* Celeste */
      '--color-aura-3': 'rgba(159, 122, 234, 0.5)',   /* Púrpura */
      '--color-aura-4': 'rgba(246, 173, 85, 0.4)'     /* Melocotón */
    },
    audioGenerator: (audioCtx, destination) => {
      // Síntesis de Olas de Mar (Ruido modulado lentamente por un LFO)
      
      // 1. Crear búfer de ruido blanco/rosa
      const bufferSize = 4 * audioCtx.sampleRate;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // 2. Filtro de paso bajo para suavizar el ruido (hacerlo sonar como mar)
      const lowpass = audioCtx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(250, audioCtx.currentTime);
      lowpass.Q.setValueAtTime(1, audioCtx.currentTime);

      // 3. LFO (Oscilador de baja frecuencia) para simular el vaivén de las olas
      const lfo = audioCtx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.08, audioCtx.currentTime); // Ciclo de 12.5 segundos

      // 4. Ganancia del LFO para modular la frecuencia de corte del filtro
      const lfoGainFilter = audioCtx.createGain();
      lfoGainFilter.gain.setValueAtTime(150, audioCtx.currentTime); // Modulación de +-150Hz

      // 5. Ganancia de sonido modulada por el mismo LFO para simular la marea alta/baja
      const lfoGainVol = audioCtx.createGain();
      lfoGainVol.gain.setValueAtTime(0.4, audioCtx.currentTime); // Profundidad de volumen del oleaje

      const waveGain = audioCtx.createGain();
      waveGain.gain.setValueAtTime(0.2, audioCtx.currentTime); // Volumen base de olas

      // Conexiones
      lfo.connect(lfoGainFilter);
      lfoGainFilter.connect(lowpass.frequency); // Modula frecuencia del filtro

      lfo.connect(lfoGainVol);
      lfoGainVol.connect(waveGain.gain); // Modula volumen del sonido

      noiseSource.connect(lowpass);
      lowpass.connect(waveGain);
      waveGain.connect(destination);

      // Iniciar osciladores y fuentes
      noiseSource.start();
      lfo.start();

      return [noiseSource, lfo, lowpass, lfoGainFilter, lfoGainVol, waveGain];
    }
  },
  {
    id: 'focused',
    name: 'Enfocado',
    emoji: '👁️',
    quote: 'La claridad mental surge de la quietud interior. Centra tu atención aquí y ahora.',
    audioName: 'Ondas Cerebrales Alfa (Binaural Beats a 10Hz)',
    auras: {
      '--color-aura-1': 'rgba(102, 126, 234, 0.65)', /* Azul real */
      '--color-aura-2': 'rgba(118, 75, 162, 0.65)',  /* Púrpura profundo */
      '--color-aura-3': 'rgba(56, 189, 248, 0.5)',   /* Azul cian */
      '--color-aura-4': 'rgba(165, 180, 252, 0.4)'   /* Añil pastel */
    },
    audioGenerator: (audioCtx, destination) => {
      // Síntesis de Ondas Alfa Binaurales (140Hz Oído Izquierdo / 150Hz Oído Derecho)
      
      const oscL = audioCtx.createOscillator();
      const oscR = audioCtx.createOscillator();
      const merger = audioCtx.createChannelMerger(2);
      
      oscL.type = 'sine';
      oscL.frequency.setValueAtTime(140, audioCtx.currentTime); // Frecuencia portadora izquierda
      
      oscR.type = 'sine';
      oscR.frequency.setValueAtTime(150, audioCtx.currentTime); // Portadora derecha (140 + 10Hz)
      
      // Control de ganancia independiente para suavizar el tono
      const toneGain = audioCtx.createGain();
      toneGain.gain.setValueAtTime(0.25, audioCtx.currentTime);

      // Filtro para suavizar y hacerlo aún más profundo
      const lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(180, audioCtx.currentTime);

      // Conexiones de estéreo
      oscL.connect(merger, 0, 0); // Izquierda
      oscR.connect(merger, 0, 1); // Derecha
      
      merger.connect(lp);
      lp.connect(toneGain);
      toneGain.connect(destination);

      oscL.start();
      oscR.start();

      return [oscL, oscR, merger, lp, toneGain];
    }
  },
  {
    id: 'creative',
    name: 'Creativo',
    emoji: '🎨',
    quote: 'La creatividad es la inteligencia divirtiéndose. Deja que tus pensamientos fluyan sin límites.',
    audioName: 'Acorde Celestial (Pad Sintetizado con Oscilaciones LFO)',
    auras: {
      '--color-aura-1': 'rgba(255, 121, 121, 0.65)', /* Coral */
      '--color-aura-2': 'rgba(254, 202, 87, 0.65)',  /* Amarillo cálido */
      '--color-aura-3': 'rgba(72, 219, 251, 0.5)',   /* Celeste brillante */
      '--color-aura-4': 'rgba(255, 159, 243, 0.5)'   /* Rosa chicle */
    },
    audioGenerator: (audioCtx, destination) => {
      // Síntesis de un acorde de fondo celestial que fluctúa (Cmaj9)
      const frequencies = [130.81, 196.00, 261.63, 329.63, 493.88, 587.33]; // C3, G3, C4, E4, B4, D5
      const nodesCreated = [];

      // Filtro general cálido
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, audioCtx.currentTime);

      // Ganancia maestra del pad
      const padGain = audioCtx.createGain();
      padGain.gain.setValueAtTime(0.12, audioCtx.currentTime);

      frequencies.forEach((freq, index) => {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle'; // Forma de onda cálida
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        // Ganancia individual del oscilador para modulación armónica
        const noteGain = audioCtx.createGain();
        noteGain.gain.setValueAtTime(0.04, audioCtx.currentTime);

        // LFO individual para cada nota para que el acorde respire
        const lfo = audioCtx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.04 + index * 0.015, audioCtx.currentTime); // Frecuencias muy lentas y diferentes

        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(0.025, audioCtx.currentTime);

        // Conexión
        lfo.connect(lfoGain);
        lfoGain.connect(noteGain.gain); // Modula volumen de esta nota

        osc.connect(noteGain);
        noteGain.connect(filter);

        osc.start();
        lfo.start();

        nodesCreated.push(osc, lfo, noteGain, lfoGain);
      });

      filter.connect(padGain);
      padGain.connect(destination);

      nodesCreated.push(filter, padGain);
      return nodesCreated;
    }
  },
  {
    id: 'energetic',
    name: 'Enérgico',
    emoji: '⚡',
    quote: 'Toda gran energía comienza con un aliento consciente. Activa tu cuerpo, enfoca tu visión.',
    audioName: 'Ritmo Pulsante Vital (Drone Rítmico a 72 BPM)',
    auras: {
      '--color-aura-1': 'rgba(255, 99, 72, 0.65)',   /* Rojo-Naranja vibrante */
      '--color-aura-2': 'rgba(255, 230, 0, 0.6)',    /* Amarillo eléctrico */
      '--color-aura-3': 'rgba(235, 77, 75, 0.55)',    /* Carmín */
      '--color-aura-4': 'rgba(240, 147, 43, 0.45)'   /* Ámbar */
    },
    audioGenerator: (audioCtx, destination) => {
      // Síntesis de un pulso rítmico bajo constante
      const droneOsc = audioCtx.createOscillator();
      droneOsc.type = 'sine';
      droneOsc.frequency.setValueAtTime(73.42, audioCtx.currentTime); // D2 (Frecuencia baja de resonancia)

      const subOsc = audioCtx.createOscillator();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(110.00, audioCtx.currentTime); // A2

      // Filtro para mantenerlo sutil y sin agudos
      const lp = audioCtx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(120, audioCtx.currentTime);

      // Modulación de volumen (LFO en onda cuadrada/sierra simulada) para simular latido rítmico (1.2 Hz = 72 BPM)
      const rhythmLfo = audioCtx.createOscillator();
      rhythmLfo.type = 'sine';
      rhythmLfo.frequency.setValueAtTime(1.2, audioCtx.currentTime);

      const lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(0.08, audioCtx.currentTime); // Nivel de la oscilación de volumen

      const dynamicGain = audioCtx.createGain();
      dynamicGain.gain.setValueAtTime(0.12, audioCtx.currentTime); // Volumen base

      // Conexiones
      rhythmLfo.connect(lfoGain);
      lfoGain.connect(dynamicGain.gain); // Modula volumen rítmicamente

      droneOsc.connect(lp);
      subOsc.connect(lp);
      lp.connect(dynamicGain);
      dynamicGain.connect(destination);

      droneOsc.start();
      subOsc.start();
      rhythmLfo.start();

      return [droneOsc, subOsc, rhythmLfo, lp, lfoGain, dynamicGain];
    }
  }
];

/* --------------------------------------------------------------------------
   2. CONFIGURACIÓN DE PATRONES DE RESPIRACIÓN
   -------------------------------------------------------------------------- */
const BREATHING_PATTERNS = {
  box: [
    { phase: 'Inhala', duration: 4, class: 'state-inhale' },
    { phase: 'Mantén', duration: 4, class: 'state-hold' },
    { phase: 'Exhala', duration: 4, class: 'state-exhale' },
    { phase: 'Retén', duration: 4, class: 'state-idle' }
  ],
  relax: [
    { phase: 'Inhala', duration: 4, class: 'state-inhale' },
    { phase: 'Mantén', duration: 7, class: 'state-hold' },
    { phase: 'Exhala', duration: 8, class: 'state-exhale' }
  ],
  deep: [
    { phase: 'Inhala', duration: 5, class: 'state-inhale' },
    { phase: 'Exhala', duration: 5, class: 'state-exhale' }
  ]
};

/* --------------------------------------------------------------------------
   3. ESTADO GLOBAL DE LA APLICACIÓN
   -------------------------------------------------------------------------- */
/* --------------------------------------------------------------------------
   3. ARCHIVO DE PERSISTENCIA Y ESTADO CENTRALIZADO (USER STATE)
   -------------------------------------------------------------------------- */
let userState = {
  isLoggedIn: false,
  profile: { name: "", personalityType: "balanceado" }, // "analitico", "creativo", "sensorial", "balanceado"
  moodLogs: [],         // Array de registros de emociones/síntomas
  gratitudeEntries: [], // Array de { date: "YYYY-MM-DD", text: "" }
  dailyIntention: null, // Intención actual del día
  preferences: { theme: "dark", volume: 0.3 }
};

const state = {
  activeMood: null,
  isAudioPlaying: false,
  
  // Estado del temporizador de respiración
  breathing: {
    patternId: 'box',
    isRunning: false,
    currentStepIndex: 0,
    secondsRemaining: 0,
    timerInterval: null
  },

  // Estado del Registro de Emociones y Síntomas
  tracker: {
    selectedMood: null,
    intensity: 3,
    symptoms: []
  }
};

/* --------------------------------------------------------------------------
   4. INICIALIZACIÓN DE VARIABLES DE AUDIO
   -------------------------------------------------------------------------- */
let audioCtx = null;
let globalGainNode = null;
let currentSynthNodes = [];

/* --------------------------------------------------------------------------
   5. REFERENCIAS DEL DOM
   -------------------------------------------------------------------------- */
const elements = {
  body: document.body,
  themeToggle: document.getElementById('theme-toggle'),
  volumeSlider: document.getElementById('volume-slider'),
  moodContainer: document.getElementById('mood-selector-container'),
  moodQuote: document.getElementById('mood-quote'),
  audioDescription: document.getElementById('audio-description'),
  audioStatusBox: document.querySelector('.mood-audio-status'),
  
  // Respiración
  patternButtons: document.querySelectorAll('.pattern-btn'),
  breathingCircle: document.getElementById('breathing-circle'),
  breathingPhase: document.getElementById('breathing-phase'),
  breathingTimer: document.getElementById('breathing-timer'),
  btnStart: document.getElementById('btn-breathing-start'),
  btnPause: document.getElementById('btn-breathing-pause'),
  btnReset: document.getElementById('btn-breathing-reset'),

  // Registro de Síntomas y Emociones
  moodTagButtons: document.querySelectorAll('.mood-tag-btn'),
  symptomIntensity: document.getElementById('symptom-intensity'),
  intensityValueDisplay: document.getElementById('intensity-value-display'),
  symptomTags: document.querySelectorAll('.symptom-tag'),
  btnSaveTracker: document.getElementById('btn-save-tracker'),
  weeklyHistoryContainer: document.getElementById('weekly-history-container'),
  trackerForm: document.getElementById('tracker-form'),

  // Diario de Gratitud
  gratitudeForm: document.getElementById('gratitude-form'),
  gratitudeText: document.getElementById('gratitude-text'),
  charCounter: document.getElementById('char-counter'),
  btnSaveGratitude: document.getElementById('btn-save-gratitude'),
  gratitudeHistoryContainer: document.getElementById('gratitude-history-container'),

  // Intención del Día
  intentionText: document.getElementById('intention-text'),
  btnRefreshIntention: document.getElementById('btn-refresh-intention')
};

/* --------------------------------------------------------------------------
   6. GESTOR DE TEMA (LIGHT/DARK)
   -------------------------------------------------------------------------- */
function initTheme() {
  const savedTheme = userState.preferences.theme;
  if (savedTheme === 'light') {
    elements.body.classList.add('light-theme');
  } else {
    elements.body.classList.remove('light-theme');
  }
}

function toggleTheme() {
  if (userState.preferences.theme === 'dark') {
    userState.preferences.theme = 'light';
    elements.body.classList.add('light-theme');
  } else {
    userState.preferences.theme = 'dark';
    elements.body.classList.remove('light-theme');
  }
  saveUserState();
}

/* --------------------------------------------------------------------------
   7. CONTROLADORES DE AUDIO (WEB AUDIO API ENGINE)
   -------------------------------------------------------------------------- */
function initAudio() {
  if (audioCtx) return;

  try {
    // Inicializar el contexto de audio
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
    
    // Crear nodo de ganancia maestro para el volumen
    globalGainNode = audioCtx.createGain();
    globalGainNode.gain.setValueAtTime(userState.preferences.volume, audioCtx.currentTime);
    globalGainNode.connect(audioCtx.destination);
  } catch (error) {
    console.error('Error al inicializar Web Audio API:', error);
  }
}

function stopCurrentSynthesizers(fadeTime = 0.5) {
  if (currentSynthNodes.length === 0) return;

  const now = audioCtx.currentTime;

  // Realizar un fade out progresivo para evitar 'clicks' o ruidos molestos
  currentSynthNodes.forEach(node => {
    // Si es un nodo de ganancia (GainNode), bajamos su volumen gradualmente
    if (node instanceof GainNode) {
      node.gain.setValueAtTime(node.gain.value, now);
      node.gain.exponentialRampToValueAtTime(0.001, now + fadeTime);
    }
  });

  const nodesToStop = [...currentSynthNodes];
  currentSynthNodes = [];

  // Apagar y desconectar físicamente los nodos tras la transición
  setTimeout(() => {
    nodesToStop.forEach(node => {
      try {
        if (typeof node.stop === 'function') {
          node.stop();
        }
        node.disconnect();
      } catch (e) {
        // Ignorar errores menores al desconectar nodos de audio
      }
    });
  }, fadeTime * 1000);
}

function startMoodAudio(mood) {
  initAudio();

  // Si el contexto está suspendido (política del navegador), lo reanudamos
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Detener el audio previo suavemente antes de iniciar el nuevo
  stopCurrentSynthesizers(0.6);

  // Iniciar la síntesis en tiempo real del nuevo estado de ánimo
  setTimeout(() => {
    if (!state.isAudioPlaying || state.activeMood !== mood.id) return;
    
    try {
      currentSynthNodes = mood.audioGenerator(audioCtx, globalGainNode);
      elements.audioDescription.textContent = `Sonido: ${mood.audioName}`;
      elements.audioStatusBox.classList.add('playing');
    } catch (err) {
      console.error('Error al iniciar el sintetizador del ánimo:', err);
      elements.audioDescription.textContent = 'Error al sintetizar el sonido ambiental';
      elements.audioStatusBox.classList.remove('playing');
    }
  }, 100);
}

function handleVolumeChange(e) {
  userState.preferences.volume = parseFloat(e.target.value);
  saveUserState();
  
  if (globalGainNode && audioCtx) {
    // Suavizamos el cambio de volumen
    globalGainNode.gain.setTargetAtTime(userState.preferences.volume, audioCtx.currentTime, 0.05);
  }
}

/* --------------------------------------------------------------------------
   8. GENERACIÓN DINÁMICA DE ELEMENTOS (MOOD SELECTOR)
   -------------------------------------------------------------------------- */
function renderMoodSelector() {
  elements.moodContainer.innerHTML = '';

  MOODS_DATA.forEach(mood => {
    // Crear el botón dinámico del ánimo
    const button = document.createElement('button');
    button.className = 'mood-btn';
    button.setAttribute('data-mood', mood.id);
    button.setAttribute('aria-pressed', 'false');
    
    // Contenido estructurado del botón
    button.innerHTML = `
      <span class="mood-emoji" aria-hidden="true">${mood.emoji}</span>
      <span>${mood.name}</span>
    `;

    button.addEventListener('click', () => selectMood(mood.id));
    elements.moodContainer.appendChild(button);
  });
}

function selectMood(moodId) {
  const selectedMood = MOODS_DATA.find(m => m.id === moodId);
  if (!selectedMood) return;

  // Si hace clic en el ánimo activo, pausa/reanuda el audio
  if (state.activeMood === moodId) {
    state.isAudioPlaying = !state.isAudioPlaying;
    
    if (state.isAudioPlaying) {
      startMoodAudio(selectedMood);
      elements.audioStatusBox.classList.add('playing');
    } else {
      stopCurrentSynthesizers(0.4);
      elements.audioDescription.textContent = 'Sonido ambiental pausado';
      elements.audioStatusBox.classList.remove('playing');
    }
    
    // Actualizar accesibilidad (aria-pressed) en los botones
    const activeBtn = elements.moodContainer.querySelector(`[data-mood="${moodId}"]`);
    if (activeBtn) {
      activeBtn.setAttribute('aria-pressed', state.isAudioPlaying ? 'true' : 'false');
    }
    return;
  }

  // Si es un cambio de ánimo
  state.activeMood = moodId;
  state.isAudioPlaying = true;

  // Actualizar los colores de la aurora (variables CSS en root)
  const root = document.documentElement;
  Object.keys(selectedMood.auras).forEach(key => {
    root.style.setProperty(key, selectedMood.auras[key]);
  });

  // Animación suave de cambio de frase en la tarjeta
  elements.moodQuote.style.opacity = 0;
  setTimeout(() => {
    elements.moodQuote.textContent = selectedMood.quote;
    elements.moodQuote.style.opacity = 1;
  }, 250);
  
  // Agregar transición CSS a la cita para que se difumine suavemente
  elements.moodQuote.style.transition = 'opacity 0.25s ease';

  // Cambiar clases activas en los botones de la interfaz
  const buttons = elements.moodContainer.querySelectorAll('.mood-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-mood') === moodId) {
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
    } else {
      btn.classList.remove('active');
      btn.setAttribute('aria-pressed', 'false');
    }
  });

  // Reproducir el sonido correspondiente
  startMoodAudio(selectedMood);
}

/* --------------------------------------------------------------------------
   9. TEMPORIZADOR DE RESPIRACIÓN GUIADA (STATE MACHINE)
   -------------------------------------------------------------------------- */
function updateBreathingCircleUI(step) {
  // Ajustar la duración de la transición en CSS para sincronizarse con la fase
  elements.breathingCircle.style.setProperty('--breathing-duration', `${step.duration}s`);
  
  // Limpiar estados previos
  elements.breathingCircle.classList.remove('state-idle', 'state-inhale', 'state-hold', 'state-exhale');
  
  // Agregar el nuevo estado visual
  elements.breathingCircle.classList.add(step.class);
  
  // Actualizar textos
  elements.breathingPhase.textContent = step.phase;
  elements.breathingTimer.textContent = step.duration;
}

function startBreathingCycle() {
  const steps = BREATHING_PATTERNS[state.breathing.patternId];
  
  // Reiniciamos al paso 0 si es la primera ejecución o se salió de rango
  if (state.breathing.currentStepIndex >= steps.length) {
    state.breathing.currentStepIndex = 0;
  }
  
  let currentStep = steps[state.breathing.currentStepIndex];
  
  // Si no hay un conteo en curso (es decir, empezamos de cero o de un reinicio), asignamos la duración total
  if (state.breathing.secondsRemaining <= 0) {
    state.breathing.secondsRemaining = currentStep.duration;
  }
  
  // Actualizamos el círculo visual inmediatamente
  updateBreathingCircleUI(currentStep);
  
  // Si estamos reanudando, mostramos los segundos restantes correctos
  elements.breathingTimer.textContent = state.breathing.secondsRemaining;

  state.breathing.timerInterval = setInterval(() => {
    state.breathing.secondsRemaining--;
    
    // Si todavía queda tiempo en la fase actual
    if (state.breathing.secondsRemaining >= 0) {
      elements.breathingTimer.textContent = state.breathing.secondsRemaining;
    } 
    
    // Si la fase ha concluido, pasamos a la siguiente
    if (state.breathing.secondsRemaining < 0) {
      state.breathing.currentStepIndex = (state.breathing.currentStepIndex + 1) % steps.length;
      currentStep = steps[state.breathing.currentStepIndex];
      state.breathing.secondsRemaining = currentStep.duration;
      
      updateBreathingCircleUI(currentStep);
    }
  }, 1000);
}

function handleBreathingStart() {
  if (state.breathing.isRunning) return;

  // Requerimos inicializar audio por si el usuario desea sincronizar respiración con sonido
  initAudio();

  state.breathing.isRunning = true;
  elements.btnStart.disabled = true;
  elements.btnPause.disabled = false;
  
  startBreathingCycle();
}

function handleBreathingPause() {
  if (!state.breathing.isRunning) return;

  state.breathing.isRunning = false;
  elements.btnStart.disabled = false;
  elements.btnPause.disabled = true;

  clearInterval(state.breathing.timerInterval);
}

function handleBreathingReset() {
  state.breathing.isRunning = false;
  state.breathing.currentStepIndex = 0;
  state.breathing.secondsRemaining = 0;
  
  clearInterval(state.breathing.timerInterval);
  
  // Restaurar estado visual inicial
  elements.breathingCircle.style.setProperty('--breathing-duration', '1s');
  elements.breathingCircle.className = 'breathing-circle state-idle';
  elements.breathingPhase.textContent = 'Iniciar';
  elements.breathingTimer.textContent = '--';
  
  elements.btnStart.disabled = false;
  elements.btnPause.disabled = true;
}

function changeBreathingPattern(e) {
  const btn = e.currentTarget;
  const patternId = btn.getAttribute('data-pattern');
  
  if (state.breathing.patternId === patternId) return;

  // Actualizar el estado del patrón
  state.breathing.patternId = patternId;

  // Actualizar la interfaz de los botones del patrón
  elements.patternButtons.forEach(button => {
    if (button === btn) {
      button.classList.add('active');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.classList.remove('active');
      button.setAttribute('aria-pressed', 'false');
    }
  });

  // Reiniciar el ciclo de respiración para aplicar el nuevo patrón de inmediato
  handleBreathingReset();
}

/* --------------------------------------------------------------------------
   10. GESTOR Y PERSISTENCIA DE REGISTRO DIARIO (USER STATE & MIGRACIONES)
   -------------------------------------------------------------------------- */
function saveUserState() {
  try {
    localStorage.setItem('aura_app_data', JSON.stringify(userState));
  } catch (err) {
    console.error('Error al guardar userState:', err);
  }
}

function loadUserState() {
  try {
    const saved = localStorage.getItem('aura_app_data');
    if (saved) {
      userState = JSON.parse(saved);
      return;
    }

    // --- MIGRACIÓN DE DATOS DE CLAVES ANTIGUAS ---
    let migrated = false;

    // 1. Tema antiguo (probar keys: 'aura-theme', 'theme')
    const oldTheme = localStorage.getItem('aura-theme') || localStorage.getItem('theme');
    if (oldTheme) {
      userState.preferences.theme = oldTheme;
      localStorage.removeItem('aura-theme');
      localStorage.removeItem('theme');
      migrated = true;
    }

    // 2. Volumen antiguo (probar keys: 'volume', 'aura-volume')
    const oldVolume = localStorage.getItem('volume') || localStorage.getItem('aura-volume');
    if (oldVolume) {
      const vol = parseFloat(oldVolume);
      if (!isNaN(vol)) {
        userState.preferences.volume = vol;
      }
      localStorage.removeItem('volume');
      localStorage.removeItem('aura-volume');
      migrated = true;
    }

    // 3. Historial de síntomas antiguo
    const oldTracker = localStorage.getItem('aura-symptom-tracker');
    if (oldTracker) {
      try {
        userState.moodLogs = JSON.parse(oldTracker);
      } catch (e) {
        console.error('Error parsing old symptom tracker data:', e);
      }
      localStorage.removeItem('aura-symptom-tracker');
      migrated = true;
    }

    // Si se migró algún dato, guardar el nuevo estado unificado de inmediato
    if (migrated) {
      saveUserState();
    }
  } catch (err) {
    console.error('Error al cargar userState:', err);
  }
}

function initTracker() {
  // Manejador de botones de emoción del día
  elements.moodTagButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const moodTag = btn.getAttribute('data-mood-tag');
      
      // Marcar activo en UI
      elements.moodTagButtons.forEach(b => {
        if (b === btn) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      
      state.tracker.selectedMood = moodTag;
      elements.btnSaveTracker.disabled = false; // Habilitar guardado al tener emoción
    });
  });

  // Manejador del rango de intensidad
  elements.symptomIntensity.addEventListener('input', (e) => {
    const val = e.target.value;
    state.tracker.intensity = parseInt(val);
    elements.intensityValueDisplay.textContent = val;
  });

  // Manejador de tags de síntomas (multiselección)
  elements.symptomTags.forEach(btn => {
    btn.addEventListener('click', () => {
      const symptom = btn.getAttribute('data-symptom-tag');
      const index = state.tracker.symptoms.indexOf(symptom);
      
      if (index > -1) {
        state.tracker.symptoms.splice(index, 1);
        btn.classList.remove('active');
      } else {
        state.tracker.symptoms.push(symptom);
        btn.classList.add('active');
      }
    });
  });

  // Manejador de envío del formulario
  elements.trackerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveTrackerRecord();
  });
}

function saveTrackerRecord() {
  if (!state.tracker.selectedMood) return;

  // Obtener fecha YYYY-MM-DD en hora local
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const localDate = new Date(now.getTime() - (offset * 60 * 1000));
  const dateStr = localDate.toISOString().split('T')[0];

  // Estructura del nuevo registro
  const record = {
    id: "rec_" + Date.now(),
    date: dateStr,
    mood: state.tracker.selectedMood,
    intensity: state.tracker.intensity,
    symptoms: [...state.tracker.symptoms]
  };

  // Filtrar registros duplicados para el mismo día (YYYY-MM-DD)
  userState.moodLogs = userState.moodLogs.filter(rec => rec.date !== dateStr);
  
  // Agregar nuevo registro
  userState.moodLogs.push(record);
  
  // Guardar en almacenamiento local unificado
  saveUserState();
  
  // Actualizar historial semanal
  renderWeeklyHistory();
  
  // Efecto visual de guardado en el botón
  const originalHtml = elements.btnSaveTracker.innerHTML;
  elements.btnSaveTracker.innerHTML = `
    <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    ¡Guardado!
  `;
  elements.btnSaveTracker.classList.add('btn-success');
  elements.btnSaveTracker.disabled = true;

  setTimeout(() => {
    elements.btnSaveTracker.innerHTML = originalHtml;
    elements.btnSaveTracker.classList.remove('btn-success');
    
    // Limpiar selección de formulario
    resetTrackerForm();
  }, 1500);
}

function resetTrackerForm() {
  state.tracker.selectedMood = null;
  state.tracker.intensity = 3;
  state.tracker.symptoms = [];

  elements.moodTagButtons.forEach(b => b.classList.remove('active'));
  elements.symptomTags.forEach(b => b.classList.remove('active'));
  elements.symptomIntensity.value = 3;
  elements.intensityValueDisplay.textContent = 3;
  elements.btnSaveTracker.disabled = true;
}

function renderWeeklyHistory() {
  elements.weeklyHistoryContainer.innerHTML = '';

  // Emojis y nombres descriptivos por emoción
  const moodMeta = {
    ansioso: { emoji: '😰', label: 'Ansioso' },
    'en-paz': { emoji: '🧘‍♀️', label: 'En Paz' },
    cansado: { emoji: '😴', label: 'Cansado' },
    alegre: { emoji: '😊', label: 'Alegre' },
    triste: { emoji: '😢', label: 'Triste' }
  };

  const symptomLabels = {
    'dolor-cabeza': 'Dolor de cabeza',
    'tension-muscular': 'Tensión muscular',
    'rumiacion': 'Rumiación',
    'falta-energia': 'Falta de energía',
    'insomnio': 'Insomnio'
  };

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Obtener las fechas de los últimos 7 días (terminando hoy)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - (offset * 60 * 1000));
    const dateStr = localDate.toISOString().split('T')[0];
    last7Days.push(dateStr);
  }

  // Generar marcado para cada día
  last7Days.forEach(dateStr => {
    // Buscar registro de este día
    const record = userState.moodLogs.find(rec => rec.date === dateStr);
    
    // Parsear nombre de día y número
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dayLabel = `${dayNames[dateObj.getDay()]} ${dateObj.getDate()}`;

    const dayItem = document.createElement('div');
    dayItem.className = 'history-day-item';

    let circleHtml = '';
    
    if (record) {
      const meta = moodMeta[record.mood] || { emoji: '❓', label: record.mood };
      const symptomsText = record.symptoms.length > 0 
        ? record.symptoms.map(s => symptomLabels[s] || s).join(', ')
        : 'Ninguno';
      
      // Ajustar escala y opacidad según intensidad (1 a 5)
      const scaleVal = 0.8 + (record.intensity * 0.08); // de 0.88 a 1.2
      const opacityVal = 0.5 + (record.intensity * 0.1); // de 0.6 a 1.0

      circleHtml = `
        <div class="day-circle mood-${record.mood}" 
             style="transform: scale(${scaleVal}); opacity: ${opacityVal};"
             aria-haspopup="true">
          ${meta.emoji}
          <div class="tooltip-box">
            <div class="tooltip-date">${dayLabel}</div>
            <div class="tooltip-mood">${meta.emoji} ${meta.label}</div>
            <div class="tooltip-intensity">Intensidad: ${record.intensity}/5</div>
            <div class="tooltip-symptoms">Síntomas: ${symptomsText}</div>
          </div>
        </div>
      `;
    } else {
      circleHtml = `
        <div class="day-circle empty-day" title="Haz clic para registrar hoy" onclick="document.getElementById('tracker-section').scrollIntoView({behavior: 'smooth'})">
          +
          <div class="tooltip-box" style="min-width: 110px; text-align: center;">
            <div class="tooltip-date">${dayLabel}</div>
            <div>Sin registro</div>
          </div>
        </div>
      `;
    }

    dayItem.innerHTML = `
      <span class="day-label">${dayLabel}</span>
      ${circleHtml}
    `;

    elements.weeklyHistoryContainer.appendChild(dayItem);
  });
}

/* --------------------------------------------------------------------------
   10B. GESTOR Y PERSISTENCIA DEL MICRO-DIARIO DE GRATITUD
   -------------------------------------------------------------------------- */
function initGratitudeJournal() {
  if (!elements.gratitudeText) return;

  // Escuchar entrada de texto en el textarea
  elements.gratitudeText.addEventListener('input', (e) => {
    const text = e.target.value;
    const len = text.length;

    // Actualizar contador
    elements.charCounter.textContent = `${len}/180`;

    // Cambiar color según proximidad al límite
    elements.charCounter.className = 'char-counter'; // reset
    if (len >= 165) {
      elements.charCounter.classList.add('danger');
    } else if (len >= 140) {
      elements.charCounter.classList.add('warning');
    }

    // Habilitar/deshabilitar botón guardar
    elements.btnSaveGratitude.disabled = len === 0;
  });

  // Guardar entrada al enviar formulario
  elements.gratitudeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveGratitudeEntry();
  });
}

function saveGratitudeEntry() {
  const text = elements.gratitudeText.value.trim();
  if (!text) return;

  // Generar fecha formateada de manera amigable
  const now = new Date();
  const dateStr = now.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const entry = {
    id: Date.now(),
    date: dateStr,
    text: text
  };

  // Inicializar array si por alguna razón no existe
  if (!userState.gratitudeEntries) {
    userState.gratitudeEntries = [];
  }

  // Agregar al principio para mostrar las más recientes primero
  userState.gratitudeEntries.unshift(entry);

  // Guardar estado de usuario
  saveUserState();

  // Actualizar feed
  renderGratitudeHistory();

  // Animación del botón al guardar
  const originalHtml = elements.btnSaveGratitude.innerHTML;
  elements.btnSaveGratitude.innerHTML = `
    <svg class="btn-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    ¡Guardado!
  `;
  elements.btnSaveGratitude.classList.add('btn-success');
  elements.btnSaveGratitude.disabled = true;

  // Limpiar el textarea y resetear contador
  elements.gratitudeText.value = '';
  elements.charCounter.textContent = '0/180';
  elements.charCounter.className = 'char-counter';

  setTimeout(() => {
    elements.btnSaveGratitude.innerHTML = originalHtml;
    elements.btnSaveGratitude.classList.remove('btn-success');
  }, 1500);
}

function renderGratitudeHistory() {
  if (!elements.gratitudeHistoryContainer) return;
  elements.gratitudeHistoryContainer.innerHTML = '';

  const entries = userState.gratitudeEntries || [];
  
  // Tomar las últimas 3 entradas registradas (están al principio del array)
  const last3Entries = entries.slice(0, 3);

  if (last3Entries.length === 0) {
    elements.gratitudeHistoryContainer.innerHTML = `
      <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.9rem; font-style: italic;">
        No hay pensamientos registrados aún. Escribe lo que te hace sonreír hoy.
      </div>
    `;
    return;
  }

  const heartEmojis = ['💖', '✨', '🌸', '☀️', '🌱'];

  last3Entries.forEach((entry, idx) => {
    // Escoger emoji decorativo según ID para variedad visual constante
    const emoji = heartEmojis[entry.id % heartEmojis.length];
    
    const entryItem = document.createElement('div');
    entryItem.className = 'gratitude-entry-item';
    
    entryItem.innerHTML = `
      <div class="gratitude-entry-header">
        <span class="gratitude-entry-date">${entry.date}</span>
        <span class="gratitude-entry-icon">${emoji}</span>
      </div>
      <p class="gratitude-entry-text">"${escapeHtml(entry.text)}"</p>
    `;
    elements.gratitudeHistoryContainer.appendChild(entryItem);
  });
}

// Función auxiliar para sanitizar HTML de las entradas del usuario
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* --------------------------------------------------------------------------
   10C. GESTOR Y PERSISTENCIA DE LA INTENCIÓN DEL DÍA (DAILY FOCUS)
   -------------------------------------------------------------------------- */
const INTENTIONS_POOL = [
  "Hoy elijo la calma y el equilibrio en cada decisión.",
  "Acepto las cosas que no puedo cambiar y me enfoco en mi paz.",
  "Trataré a mi mente y cuerpo con suavidad y paciencia.",
  "Hoy priorizo mi energía y establezco límites saludables.",
  "Cada respiración me llena de paz y libera mi tensión.",
  "Agradezco el momento presente y encuentro alegría en lo simple.",
  "Mi paz interior es mi mayor superpoder hoy.",
  "Confío en mi proceso y avanzo a mi propio ritmo.",
  "Hoy hablo conmigo mismo con amabilidad y compasión.",
  "Soy suficiente tal y como soy aquí y ahora."
];

function initDailyIntention() {
  if (!elements.intentionText) return;

  const todayStr = new Date().toLocaleDateString();

  // Si no hay intención configurada hoy, o es de otro día, seleccionar una al azar
  if (!userState.dailyIntention || userState.dailyIntention.date !== todayStr) {
    selectRandomIntention(todayStr);
  } else {
    // Si ya existe hoy, inyectar
    elements.intentionText.textContent = userState.dailyIntention.text;
  }

  // Manejador del botón refrescar
  if (elements.btnRefreshIntention) {
    elements.btnRefreshIntention.addEventListener('click', () => {
      // Girar icono visualmente (rotación 360)
      const svg = elements.btnRefreshIntention.querySelector('svg');
      if (svg) {
        svg.style.transition = 'transform 0.6s ease';
        svg.style.transform = 'rotate(360deg)';
        setTimeout(() => {
          svg.style.transform = 'none';
          svg.style.transition = 'none';
        }, 600);
      }
      
      // Animación suave de desvanecimiento para el texto al cambiar
      elements.intentionText.style.opacity = '0';
      setTimeout(() => {
        selectRandomIntention(todayStr);
        elements.intentionText.style.opacity = '1';
      }, 200);
    });
  }
}

function selectRandomIntention(dateStr) {
  // Evitar repetir la misma frase que ya está mostrándose si es posible
  let availablePool = INTENTIONS_POOL;
  if (userState.dailyIntention && userState.dailyIntention.text) {
    availablePool = INTENTIONS_POOL.filter(phrase => phrase !== userState.dailyIntention.text);
  }
  
  const randomIndex = Math.floor(Math.random() * availablePool.length);
  const selectedText = availablePool[randomIndex];

  userState.dailyIntention = {
    text: selectedText,
    date: dateStr
  };

  saveUserState();
  elements.intentionText.textContent = selectedText;
}

/* --------------------------------------------------------------------------
   11. ASOCIACIÓN DE EVENTOS (EVENT LISTENERS) Y BOOTSTRAP
   -------------------------------------------------------------------------- */
function bindEvents() {
  // Conmutador del tema
  elements.themeToggle.addEventListener('click', toggleTheme);
  
  // Deslizador de volumen
  elements.volumeSlider.addEventListener('input', handleVolumeChange);

  // Controles de respiración guiada
  elements.btnStart.addEventListener('click', handleBreathingStart);
  elements.btnPause.addEventListener('click', handleBreathingPause);
  elements.btnReset.addEventListener('click', handleBreathingReset);

  // Selectores de patrones de respiración
  elements.patternButtons.forEach(btn => {
    btn.addEventListener('click', changeBreathingPattern);
  });
}

function init() {
  loadUserState(); // Cargar estado de usuario y migrar si es necesario
  elements.volumeSlider.value = userState.preferences.volume; // Sincronizar UI del slider
  initTheme();
  renderMoodSelector();
  initTracker();
  renderWeeklyHistory();
  initGratitudeJournal();
  renderGratitudeHistory();
  initDailyIntention();
  bindEvents();
}

// Cargar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
