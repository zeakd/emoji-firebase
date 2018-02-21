'use strict';

/** 
 * util
 */
function randomInt(num) {
  return Math.floor(Math.random() * num);
}

/**
 * current history state
 */
window.histories = [];
window.current = {};
window.pending = false;
var db = void 0;

function resetHistories(histories) {
  window.histories = histories;
  var latest = histories[histories.length - 1];

  setText(latest.text);
  current.index = latest.index || 0;
  current.normMap = JSON.parse(JSON.stringify(latest.normMap)) || {};

  var norms = Object.keys(current.normMap);
  var rand = randomInt(norms.length);

  var wordInput = document.getElementById('word-input');
  wordInput.value = norms[rand];

  var historiesElem = document.getElementById('histories');
  historiesElem.innerHTML = '';

  histories.forEach(function (history) {
    historiesElem.appendChild(createHitoryButton(history));
  });
}

function setText(text) {
  current.text = text;

  var textElem = document.getElementById('text');
  textElem.innerText = text;
}

function resetCurrent(newCurrent) {
  setText(newCurrent.text);
  current.emoji = newCurrent.emoji;
  current.word = newCurrent.word;
  current.index = newCurrent.index;
  current.normMap = JSON.parse(JSON.stringify(newCurrent.normMap));
}

function addNewHistory() {
  if (window.pending) return;

  window.pending = true;
  var wordInput = document.getElementById('word-input');
  var emojiInput = document.getElementById('emoji-input');

  var emoji = emojiInput.value;
  var word = wordInput.value && wordInput.value.toLowerCase();
  var mappedWords = current.normMap[word];

  if (!mappedWords) {
    window.pending = false;
    return;
  }

  console.log(emoji, word, mappedWords);
  mappedWords.forEach(function (w) {

    if (w[0] === "'") {
      var re = new RegExp('(' + w + ')([^a-zA-z]|$)', "g");
      setText(current.text.replace(re, function (match, a, b) {
        return emoji + b;
      }));
    } else {
      var _re = new RegExp('(^|[^a-zA-z])(' + w + ')([^a-zA-z]|$)', "g");
      setText(current.text.replace(_re, function (match, a, b, c) {
        return a + emoji + c;
      }));
    }
  });

  delete current.normMap[word];
  current.emoji = emoji;
  current.word = word;
  current.index = current.index + 1;

  console.log(current);
  var updates = {};
  updates['/histories/'] = window.histories.splice(0, current.index).concat([current]);

  firebase.database().ref().update(updates).then(function () {

    db.ref('/histories/').once('value').then(function (h) {
      window.pending = false;
      var histories = h.val();
      resetHistories(histories);
    });
  }).catch(function () {
    window.pending = false;
  });
}

function init() {
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
    var app = firebase.app();
    db = app.database();
  } catch (e) {
    console.error(e);
  }

  window.pending = true;
  db.ref('/histories/').once('value').then(function (h) {
    window.pending = false;
    var histories = h.val();
    resetHistories(histories);
  }).catch(function () {
    window.pending = false;
  });

  var convertButton = document.getElementById('convert');
  convertButton.addEventListener('click', addNewHistory);
}

function createHitoryButton(_ref) {
  var emoji = _ref.emoji,
      word = _ref.word,
      index = _ref.index;

  var historyButton = document.createElement('button');

  var detail = emoji && word ? word + ' => ' + emoji : undefined;
  historyButton.innerText = 'history ' + (index + 1) + ', ' + detail;
  historyButton.dataset.index = index;

  historyButton.addEventListener('click', function (e) {
    console.log(e);
    var target = e.target;
    var index = e.target.dataset.index;
    console.log(index, window.histories[index]);
    resetCurrent(window.histories[index]);
  });

  var historyElem = document.createElement('li');
  historyElem.appendChild(historyButton);
  return historyElem;
}

document.addEventListener('DOMContentLoaded', function () {
  init();
});
