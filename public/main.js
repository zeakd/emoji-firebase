/** 
 * util
 */
function randomInt (num) {
  return Math.floor(Math.random() * num);
}

/**
 * current history state
 */
window.histories = [];
window.current = {};
window.pending = false;
let db;

function resetHistories(histories) {
  window.histories = histories;
  const latest = histories[histories.length - 1];

  setText(latest.text);
  current.index = latest.index || 0;
  current.normMap = JSON.parse(JSON.stringify(latest.normMap)) || {};

  const norms = Object.keys(current.normMap);
  const rand = randomInt(norms.length);
  
  const wordInput = document.getElementById('word-input');
  wordInput.value = norms[rand];

  const historiesElem = document.getElementById('histories');
  historiesElem.innerHTML = '';

  histories.forEach(history => {
    historiesElem.appendChild(createHitoryButton(history))  
  })
}



function setText (text) {
  current.text = text;

  const textElem = document.getElementById('text');
  textElem.innerText = text;
}

function resetCurrent (newCurrent) {
  setText(newCurrent.text);
  current.emoji = newCurrent.emoji;
  current.word = newCurrent.word;
  current.index = newCurrent.index;
  current.normMap = JSON.parse(JSON.stringify(newCurrent.normMap));
}

function addNewHistory () {
  if (window.pending) return;

  window.pending = true;
  const wordInput = document.getElementById('word-input');
  const emojiInput = document.getElementById('emoji-input');
  
  const emoji = emojiInput.value;
  const word = wordInput.value && wordInput.value.toLowerCase();
  const mappedWords = current.normMap[word];
  
  if (!mappedWords) {
    window.pending = false;
    return;
  }

  console.log(emoji, word, mappedWords);
  mappedWords.forEach(w => {
    
    if (w[0] === "'") {
      const re = new RegExp(`(${w})([^a-zA-z]|$)`, "g");
      setText(current.text.replace(re, (match, a, b) => emoji + b));
    } else {
      const re = new RegExp(`(^|[^a-zA-z])(${w})([^a-zA-z]|$)`, "g");
      setText(current.text.replace(re, (match, a, b, c) => a + emoji + c));
    }
    
  })

  delete current.normMap[word];
  current.emoji = emoji;
  current.word = word;
  current.index = current.index + 1;

  console.log(current);
  const updates = {};
  updates['/histories/'] = window.histories.splice(0, current.index).concat([current]);

  firebase.database().ref().update(updates).then(() => {
    
    db.ref('/histories/').once('value').then(h => {
      window.pending = false;
      const histories = h.val();
      resetHistories(histories);
    });
  }).catch(() => { window.pending = false });
}


function init () {
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
  // // The Firebase SDK is initialized and available here!
  //
  // firebase.auth().onAuthStateChanged(user => { });
  // firebase.database().ref('/path/to/ref').on('value', snapshot => { });
  // firebase.messaging().requestPermission().then(() => { });
  // firebase.storage().ref('/path/to/ref').getDownloadURL().then(() => { });
  //
  // // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
  
  try {
    let app = firebase.app();
    db = app.database();
  } catch (e) {
    console.error(e);
  }
  
  window.pending = true;
  db.ref('/histories/').once('value').then(h => {
    window.pending = false;
    const histories = h.val();
    resetHistories(histories);
  }).catch(() => {   window.pending = false; });

  const convertButton = document.getElementById('convert');
  convertButton.addEventListener('click', addNewHistory);
}

function createHitoryButton({ emoji, word, index }) {
  const historyButton = document.createElement('button');
  
  const detail = emoji && word ? `${word} => ${emoji}` : undefined;
  historyButton.innerText = `history ${index + 1}, ${detail}`;
  historyButton.dataset.index = index;

  historyButton.addEventListener('click', (e) => {
    console.log(e);
    const target = e.target;
    const index = e.target.dataset.index;
    console.log(index, window.histories[index]);
    resetCurrent(window.histories[index])
  })
  
  const historyElem = document.createElement('li');
  historyElem.appendChild(historyButton)
  return historyElem;
}

document.addEventListener('DOMContentLoaded', function() {
  init();
});
