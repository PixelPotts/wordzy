
/*
 * Wordzy: Impossible.
 *
 * @author Bryan Potts <pottspotts@gmail.com>
 *
 */

var CLOCK_START = 5; // master game clock starting time
var NEW_LETTERS_CLOCK = 5; // new word clock starting time; also when
var TIME_PER_TURN = 1000; //ms

var MIN_VOWELS = 2;
var NUM_LETTERS = 7;
var BONUS_WORD_LEN = 4;
var BONUS_TIME_ADD = 2;
var PTS_FOR_WORD = 1;
var TIME_FOR_WORD = 2;

var mainIntervalId, timerIntervalId;

function WordzyViewModel(){
  var self = this;
  self.init();
}

$.extend(WordzyViewModel.prototype,{
  
  init: function(){
    // observables
    this.letters = ko.observableArray(this.pickLetters(7));
    this.correctWords = ko.observableArray();
    this.correctWordsFull = ko.observableArray();
    this.points = ko.observable(0);

    // observable timers
    this.gameClock = ko.observable(CLOCK_START);
    this.newWordClock = ko.observable(NEW_LETTERS_CLOCK);
  },
  pickLetters: function(num){
    return this.pickLettersDistributed(num);
    var letters = _(Alphabet).sample(num);
    var numVowels = _.intersection( Vowels, letters ).length;
    if(numVowels < MIN_VOWELS) return this.pickLetters(num);
    return letters;
  },
  pickLettersDistributed: function(num){
    var letters = [];
    while(letters.length < num){
      var sum = 0;
      _.each(AlphaDist, function(weight, letter){
        console.log('weight: '+weight+', letter: '+letter);
        sum += weight;
        console.log('random: '+_.random(1,sum));
        if(_.random(1,sum) < weight){
          console.log('chosen: '+letter);
          if( ! _.contains(letters, letter) && letters.length < num){
            letters.push(letter);
          }
        }
      });
    }
    return _.shuffle(letters);
  },
  checkChangeLetters: function(spaceBar){
    if(this.newWordClock() < 1){
      $('#guess-input').val(null); // clear input state so user doesn't have to backspace
      this.letters(this.pickLetters(NUM_LETTERS));
      this.newWordClock(NEW_LETTERS_CLOCK);
      return true;
    }

    // user can press the spacebar to add time, at any point
    if(spaceBar){
      this.letters(this.pickLetters(NUM_LETTERS));
      this.newWordClock(NEW_LETTERS_CLOCK);
      this.addTime(0-1);
    }
    return false;
  },
  attemptWord: function(word){

    // The obvious failure conditions
    if(_.contains(this.correctWordsFull(),word)) return false; // skip words already found
    if(_.size(word)===0) return false; // skip empty
    if( ! wordTrie.lookup(word)) return false; // skip non-real words

    // Make sure the word is composed of this.letters()
    var wordLettersOverlap = _.intersection( _(word).chars(), this.letters() ).length;
    if(wordLettersOverlap == word.length){
      this.correctWords.unshift(word);
      this.correctWordsFull.unshift(word);

      // only store up to n words
      if(_.size(this.correctWords()) >= NUM_LETTERS) this.correctWords.pop();

      // update the timers and points
      this.addTime(TIME_FOR_WORD);
      this.addPoints(PTS_FOR_WORD);

      // show +1
      $('#success-stamp').show();
      $('#guess-input').css('margin-left',39);
      setTimeout(function() {
        $('#success-stamp').hide();
        $('#guess-input').css('margin-left',0);
      }, 200);

      return true;
    }
    return false;
  },
  addTime: function(num){
    this.gameClock(this.gameClock()+num);
    this.newWordClock(this.newWordClock()+num);
  },
  subtractTime: function(num){
    this.gameClock(this.gameClock()-num);
    this.newWordClock(this.newWordClock()-num);
  },
  checkGameOver: function(){
    //console.log(this.gameClock());
    if(this.gameClock()<1){
      return true;
    }
    return false;
  },
  addPoints: function(pts){
    this.points(this.points()+pts);
  }


});

// Global objects exposed for debugging
window.player = {};
window.wvm = new WordzyViewModel();


$(document).ready(function() {
  _.mixin(_.str.exports());
  ko.applyBindings(wvm);

  $('#game-start, #btn-scared').show();

  var gameOver = 0;

  var framerate = TIME_PER_TURN;
  var mainloop = function() {
    //console.log(wvm.newWordClock());
    wvm.checkChangeLetters(false);
  };

  // another loop for the game timer functions
  var timerRate = 1000; // one second
  var timerLoop = function() {
    wvm.subtractTime(1);
    gameOver = wvm.checkGameOver();
    if(gameOver){
      endGame();
    }
  };

  $("#game-start").click(function(){
    mainIntervalId = setInterval( mainloop, framerate );
    timerIntervalId = setInterval( timerLoop, timerRate );
    
    $('#start-screen, #reset-screen').hide();
    $('#in-game-screen').show();
    $('#guess-input').focus().select();
  });

  $("#reset-btn").click(function(){
    mainIntervalId = setInterval( mainloop, framerate );
    timerIntervalId = setInterval( timerLoop, timerRate );

    wvm.letters(wvm.pickLetters(7));
    wvm.correctWords([]);
    wvm.correctWordsFull([]);
    wvm.points(0);

    // observable timers
    wvm.gameClock(CLOCK_START);
    wvm.newWordClock(NEW_LETTERS_CLOCK);

    $('#reset-screen').hide();
    $('#in-game-screen').show();
    $GuessBox.focus().select();
    $GuessBox.val(null);
  });

  function endGame(){
    clearInterval(mainIntervalId);
    clearInterval(timerIntervalId);
    resetGame();
  }

  function resetGame(){
    wvm.letters([]);
    wvm.pickLetters(NUM_LETTERS);
    $('#in-game-screen').hide();
    $('#reset-screen').show();
    $('#reset-btn').focus().select();
  }

  /* Miscellany */

  var $GuessBox = $('#guess-box input');

  $GuessBox.keyup(function(){
    wvm.attemptWord($(this).val());
  });

  $GuessBox.keypress(function(e) {
    if(e.which == 13) {
      wvm.attemptWord($(this).val());
      $GuessBox.val(null);
    }
  });
  $(window).keypress(function(e) {
    if(e.which == 32) {
      e.preventDefault();
      wvm.checkChangeLetters(true);
      $GuessBox.val(null);
    }
  });

  // Advanced tips toggle
  $('#advanced-tips-toggle').click(function(){
    $('#advanced-tips').show();
    $(this).hide();
  });

  // I'm scared! button
  $('#btn-scared').click(function(){
    alert('Therapy only works when we have a genuine desire to know ourselves as we are. Not as we would like to be.');
    $(this).hide();
  });

});