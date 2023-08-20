const sharpNotes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const flatNotes = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
const sharpToFlat = {
  'C#': 'Db',
  'D#': 'Eb',
  'F#': 'Gb',
  'G#': 'Ab',
  'A#': 'Bb'
};
const flatToSharp = {
  'Db': 'C#',
  'Eb': 'D#',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#'
};
let notes = sharpNotes;

let keyboard;
let selectedWl, selectedSong;
let vocalRangeX1, vocalRangeX2, songRangeX1, songRangeX2;

const VOCAL_FILL = '#00ea9c';
const SONG_FILL = '#73ceff';
const COMBINED_FILL = '#00bd9c';
const KEYS_WIDTH = 698;
const TEXT_WIDTH = 160; // This was observed and hardcoded

function noteFromMidiNumber(midiNumber){
  return notes[midiNumber % 12] + (Math.floor(midiNumber / 12) - 1);
}

function initWlSelect() {
  const $wlSelect = $('#worship-leader').select2({
    theme: 'bootstrap',
    placeholder: {
      id: '-1',
      text: 'Select a worship leader'
    },
    data: wls.map(w => ({id: w.name, text: w.name, low: w.low, high: w.high}))
  }).on('select2:select', e => {
    if (e.params && e.params.data.id) {
      selectedWl = e.params.data;
      if (selectedWl.id) {
        selectedWl.lowNote  = noteFromMidiNumber(selectedWl.low);
        selectedWl.highNote = noteFromMidiNumber(selectedWl.high);

        renderVocalRange();
        renderPossibleKeys();
      }
    }
  });
  $wlSelect.show();
}
function initSongSelect() {
  const $songSelect = $('#song').select2({
    theme: 'bootstrap',
    placeholder: {
      id: '-1',
      text: 'Select a song'
    },
    data: songs.map(s => ({id: s.name, text: s.name, key: s.key, low: s.low, high: s.high}))
  }).on('select2:select', e => {
    if (e.params && e.params.data.id) {
      selectedSong = e.params.data;
      if (selectedSong.id) {
        // Determine which sharp or flat transpose scale based on original key
        const flatKey = selectedSong.key.includes('b') || selectedSong.key.includes('F');
        notes = flatKey ? flatNotes : sharpNotes;

        selectedSong.selectedLowNumber  = selectedSong.low;
        selectedSong.selectedHighNumber = selectedSong.high;
        selectedSong.selectedLowNote    = noteFromMidiNumber(selectedSong.selectedLowNumber);
        selectedSong.selectedHighNote   = noteFromMidiNumber(selectedSong.selectedHighNumber);

        // If sharp/flat scale has change, re-render vocal range
        if (selectedWl) {
          selectedWl.lowNote  = noteFromMidiNumber(selectedWl.low);
          selectedWl.highNote = noteFromMidiNumber(selectedWl.high);
          renderVocalRange();
        }
        renderSongRange();
        renderPossibleKeys();
      }
    }
  });
  $songSelect.show();
}

function initKeySelect() {
  for (let i = 1; i < 13; i++) {
    $(`#key-${i}`).parent().on('click', function() {
      deselectAllKeys();
      $(`#key-${i}`).parent().addClass('selected');

      // Determine which sharp or flat keyboard scale based on selected key
      const selectedKey = $(`#key-${i}`).text();
      const flatKey = selectedKey.includes('b') || selectedKey === 'F';
      notes = flatKey ? flatNotes : sharpNotes;

      selectedSong.selectedLowNumber  = selectedSong.low + i - 6;
      selectedSong.selectedHighNumber = selectedSong.high + i - 6;
      selectedSong.selectedLowNote    = noteFromMidiNumber(selectedSong.selectedLowNumber);
      selectedSong.selectedHighNote   = noteFromMidiNumber(selectedSong.selectedHighNumber);

      // Change notes on keyboard
      $('svg text').each(function() {
        const note = $(this).text().slice(0, -1);
        const replacementNote = flatKey ? sharpToFlat[note] : flatToSharp[note]
        // Regular notes will be undefined and aren't replaced
        if (replacementNote) {
          $(this).text($(this).text().replace(note, replacementNote));
        }
      });

      renderSongRange();
    });
  }
}

function initKeyboard() {
  keyboard = new Keyboard(document.getElementById('keyboard'), {
    lowest: 'C2',
    highest: 'C6'
  });
}

function renderVocalRange() {
  fillKeyboard();
  const rangeText = `Vocal range: ${selectedWl.lowNote} to ${selectedWl.highNote}`;
  
  // SVG keyboard notes are one octave lower than MIDI so we subtract 12
  const lowNote = 24; // C2
  const lowRangeKeyboard = selectedWl.low - 12;
  const lowNoteWidth = isWhiteKey(lowRangeKeyboard) ? WHITE_KEY_WIDTH : BLACK_KEY_WIDTH;
  const highRangeKeyboard = selectedWl.high - 12;
  const highNoteWidth = isWhiteKey(highRangeKeyboard) ? WHITE_KEY_WIDTH : BLACK_KEY_WIDTH;

  // Code from pianokeys.js to calculate x position
  const offset = 168 * getOctave(lowNote) + KEY_POSITIONS[getPitchClass(lowNote)] - 1;
  vocalRangeX1 = 168 * getOctave(lowRangeKeyboard) + KEY_POSITIONS[getPitchClass(lowRangeKeyboard)] - offset + lowNoteWidth / 2;
  vocalRangeX2 = 168 * getOctave(highRangeKeyboard) + KEY_POSITIONS[getPitchClass(highRangeKeyboard)] - offset + highNoteWidth /2;

  $('#wl-range').empty();
  $('#wl-range').append(
    $(
      `<svg viewBox="0 0 ${KEYS_WIDTH} 32">
        <line x1="${vocalRangeX1}" y1="20" x2="${vocalRangeX1}" y2="30" stroke="${VOCAL_FILL}" stroke-width="2" />
        <line x1="${vocalRangeX1}" y1="25" x2="${vocalRangeX2}" y2="25" stroke="${VOCAL_FILL}" stroke-width="2" />
        <line x1="${vocalRangeX2}" y1="20" x2="${vocalRangeX2}" y2="30" stroke="${VOCAL_FILL}" stroke-width="2" />
       </svg>`
    )
  );

  // Add text using HTML/CSS so text doesn't scale
  $('#wl-range').prepend(`<div style="font-weight:bold;color:${VOCAL_FILL};position:absolute;">${rangeText}</div>`);
  positionWlRangeText();
}

function positionWlRangeText() {
  const width = $('.container').width();
  const ratio = width / KEYS_WIDTH;
  const textX = ((vocalRangeX2 - vocalRangeX1) / 2 + vocalRangeX1) * ratio - TEXT_WIDTH / 2;
  $('#wl-range div').css('left', textX);
}

function renderSongRange() {
  fillKeyboard();
  const rangeText = `Song range: ${selectedSong.selectedLowNote} to ${selectedSong.selectedHighNote}`;
  
  // SVG keyboard notes are one octave lower than MIDI so we subtract 12
  const lowNote = 24; // C2
  const lowRangeKeyboard = selectedSong.selectedLowNumber - 12;
  const lowNoteWidth = isWhiteKey(lowRangeKeyboard) ? WHITE_KEY_WIDTH : BLACK_KEY_WIDTH;
  const highRangeKeyboard = selectedSong.selectedHighNumber - 12;
  const highNoteWidth = isWhiteKey(highRangeKeyboard) ? WHITE_KEY_WIDTH : BLACK_KEY_WIDTH;

  // Code from pianokeys.js to calculate x position
  const offset = 168 * getOctave(lowNote) + KEY_POSITIONS[getPitchClass(lowNote)] - 1;
  songRangeX1 = 168 * getOctave(lowRangeKeyboard) + KEY_POSITIONS[getPitchClass(lowRangeKeyboard)] - offset + lowNoteWidth / 2;
  songRangeX2 = 168 * getOctave(highRangeKeyboard) + KEY_POSITIONS[getPitchClass(highRangeKeyboard)] - offset + highNoteWidth /2;

  $('#song-range').empty();
  $('#song-range').append(
    $(
      `<svg viewBox="0 0 ${KEYS_WIDTH} 22">
        <line x1="${songRangeX1}" y1="0" x2="${songRangeX1}" y2="10" stroke="${SONG_FILL}" stroke-width="2" />
        <line x1="${songRangeX1}" y1="5" x2="${songRangeX2}" y2="5" stroke="${SONG_FILL}" stroke-width="2" />
        <line x1="${songRangeX2}" y1="0" x2="${songRangeX2}" y2="10" stroke="${SONG_FILL}" stroke-width="2" />
       </svg>`
    )
  );

  // Add  text using HTML/CSS so text doesn't scale
  $('#song-range').append(`<div style="font-weight:bold;color:${SONG_FILL};position:absolute;top:10px;">${rangeText}</div>`);
  positionSongRangeText();
}

function positionSongRangeText() {
  const width = $('.container').width();
  const ratio = width / KEYS_WIDTH;
  const textX = ((songRangeX2 - songRangeX1) / 2 + songRangeX1) * ratio - TEXT_WIDTH / 2;
  $('#song-range div').css('left', textX);
}

// We render all each time in case there is overlap between WL and song range
function fillKeyboard() {
  keyboard.clearAllKeys();
  // Variable may not be populated on first time
  if (selectedWl && selectedWl.lowNote)              keyboard.fillKey(selectedWl.lowNote, VOCAL_FILL);
  if (selectedWl && selectedWl.highNote)             keyboard.fillKey(selectedWl.highNote, VOCAL_FILL);
  if (selectedSong && selectedSong.selectedLowNote)  keyboard.fillKey(selectedSong.selectedLowNote, SONG_FILL);
  if (selectedSong && selectedSong.selectedHighNote) keyboard.fillKey(selectedSong.selectedHighNote, SONG_FILL);

  // Check if there are any overlaps
  if (selectedWl && selectedSong && selectedWl.lowNote === selectedSong.selectedLowNote) keyboard.fillKey(selectedWl.lowNote, COMBINED_FILL);
  if (selectedWl && selectedSong && selectedWl.lowNote === selectedSong.selectedHighNote) keyboard.fillKey(selectedWl.lowNote, COMBINED_FILL);
  if (selectedWl && selectedSong && selectedWl.highNote === selectedSong.selectedLowNote) keyboard.fillKey(selectedWl.highNote, COMBINED_FILL);
  if (selectedWl && selectedSong && selectedWl.highNote === selectedSong.selectedHighNote) keyboard.fillKey(selectedWl.highNote, COMBINED_FILL);
}

function renderPossibleKeys() {
  // Clear active from all keys
  for (let i = 1; i < 13; i++) {
    $(`#key-${i}`).parent().removeClass('active');
  }
  
  if (selectedSong) {
    $('#possible-keys').show();
    keys = [];
    let currentKey = selectedSong.key;
    // Transpose up 6
    for(let i = 0; i < 7; i++) {
      const currentIndex = notes.indexOf(currentKey);
      // Use double modulo to escape negative indexes
      const transposedIndex = ((currentIndex + i) % notes.length + notes.length) % notes.length;
      const transposedKey = notes[transposedIndex];
      $(`#key-${6+i}`).text(transposedKey);

      if (selectedWl && selectedWl.low <= selectedSong.low + i && selectedWl.high >= selectedSong.high + i) {
        if (!keys.includes(transposedKey)) {
          keys.push(transposedKey);
          $(`#key-${6+i}`).parent().addClass('active');
        }
      }
    }
    currentKey = selectedSong.key;
    // Tranpose down 5
    for(let i = 1; i < 6; i++) {
      const currentIndex = notes.indexOf(currentKey);
      // Use double modulo to escape negative indexes
      const transposedIndex = ((currentIndex - i) % notes.length + notes.length) % notes.length;
      const transposedKey = notes[transposedIndex];
      $(`#key-${6-i}`).text(transposedKey);

      if (selectedWl && selectedWl.low <= selectedSong.low - i && selectedWl.high >= selectedSong.high - i) {
        if (!keys.includes(transposedKey)) {
          keys.push(transposedKey);
          $(`#key-${6-i}`).parent().addClass('active')
        }
      }
    }
  }
}

function deselectAllKeys() {
  for (let i = 1; i < 13; i++) {
    $(`#key-${i}`).parent().removeClass('selected');
  }
}

// init() is called from data.js after data is fetched
function init() {
  initWlSelect();
  initSongSelect();
  initKeySelect();
  initKeyboard();
  $(window).on('resize', function() {
    positionWlRangeText();
    positionSongRangeText();
  });
}
