const audioContext = new AudioContext();
const value = {"c":0,"d":2,"e":4,"f":5,"g":7,"a":9,"b":11,"#":1,"&":-1};
const voices = Array(2);
let on = false;
let paused; let LH_track; let RH_track;
let normalGain;

function makeOscillator() {
    const oscillator = new OscillatorNode(audioContext, {frequency: 0});
    gainNode = new GainNode(audioContext);
    gainNode.gain.value = 0; //0.15 * 1/voices.length;
    normalGain = 0.15 * 1/voices.length;
    oscillator.connect(gainNode).connect(audioContext.destination)
    return {osc: oscillator, gainNode: gainNode};
}

function voice(keys) {
    const oscillator = makeOscillator();
    let frequencies = [];
    let pressedKey = null;
    let index = 0;

    function resetFrequencies(seq) {
        frequencies = seq;
        index = 0;
    } 

    function getOscillator() {
        return oscillator.osc;
    }
    function down(e) {
        if (on && keys.includes(e.key) && !e.repeat && (e.key != pressedKey) 
        && (index < frequencies.length) && !paused) {
            const freq = frequencies[index];

            //let gain = 0;
            //if (freq > 0) {
            //    gain = normalGain * (49 / freq);
            //}
            gain = normalGain;

            if (pressedKey === null) {
                oscillator.osc.frequency.setTargetAtTime(freq, 
                    audioContext.currentTime, 0);   
            } else {
                oscillator.osc.frequency.setTargetAtTime(freq, 
                    audioContext.currentTime, 0.003);   
            }
            //oscillator.frequency.value = frequencies[index];

            oscillator.gainNode.gain.setTargetAtTime(gain, 
                audioContext.currentTime, 0.015);
            
            index++;
            pressedKey = e.key;
       }
    }

    function up(e) {
        if (on && (e.key === pressedKey) && !paused) {
            oscillator.gainNode.gain.setTargetAtTime(0, 
                audioContext.currentTime, 0.015);
            //oscillator.frequency.value = 0;
            pressedKey = null;
        }
    }

    return {resetFrequencies, getOscillator, down, up};
}

voices[0] = voice(["f","d"]);
voices[1] = voice(["j","k"]);

function down(e) {
    for (const voice of voices) {
        voice.down(e);
    }
}

function up(e) {
    for (const voice of voices) {
        voice.up(e);
    }
}

document.addEventListener("keydown", down);
document.addEventListener("keyup", up);

function toFreq(notes) {
    frequencies = [];
    for (let i = 0; i < notes.length; i++) {
        const pitch = notes[i].midi - 60;
        const frequency = 2 ** (pitch/12 + 8);
        frequencies.push(frequency);    
    }
    return frequencies;
}

const reader = new FileReader();
reader.onload = function(e) {
    const midi = new Midi(e.target.result);
    voices[0].resetFrequencies(toFreq(midi.tracks[LH_track].notes));
    voices[1].resetFrequencies(toFreq(midi.tracks[RH_track].notes));
}

function resetVariables() {
    LH_track = +document.getElementById("LH_track").value;
    RH_track = +document.getElementById("RH_track").value;
    midi_file = document.getElementById("midi_file").files[0];
    if (midi_file) {
        reader.readAsArrayBuffer(midi_file);
    }
    paused = false;
}

resetVariables();

function startOscillatorsIfNeccessary() {
    if (!on) { 
        voices[0].getOscillator().start();
        voices[1].getOscillator().start();
        on = true;
    }
}

function start() {
    resetVariables();
    startOscillatorsIfNeccessary();
}

function pause() {
    paused = true;
    voices[0].getOscillator().frequency.value = 0;
    voices[1].getOscillator().frequency.value = 0;
}

function resume() {
    paused = false;
}

function backwards() {
    voices[0].index--;
    voices[1].index--;
}

document.getElementById("start").addEventListener("click", start);
document.getElementById("pause").addEventListener("click", pause);
document.getElementById("resume").addEventListener("click", resume);
document.getElementById("backwards").addEventListener("click", backwards);