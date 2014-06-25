
/*
 * Wordzy: Impossible.
 *
 * @author Bryan Potts <pottspotts@gmail.com>
 *
 */

var CLOCK_START = 5; // master game clock starting time
var NEW_LETTERS_CLOCK = 100; // new word clock starting time; also when
var TIME_PER_TURN = 1000; //ms

var MIN_VOWELS = 2;
var NUM_LETTERS = 7;
var PTS_FOR_WORD = 1;
var TIME_FOR_WORD = 2;

var BONUS_1_WORD_LEN = 4;
var BONUS_1_TIME_ADD = 1;
var BONUS_1_PTS_ADD = 3;

var BONUS_2_WORD_LEN = 6;
var BONUS_2_TIME_ADD = 1;
var BONUS_2_PTS_ADD = 22;

var BONUS_3_WORD_LEN = 7;
var BONUS_3_TIME_ADD = 2;
var BONUS_3_PTS_ADD = 75;


var BAR_MULTIPLIER = 3;
var BAR_START_COLOR = '#00DD00';

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
    this.progressBarWidth = ko.observable(CLOCK_START * BAR_MULTIPLIER);
    this.progressBarColor = ko.observable('red');

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
    var word = _(SevenLetterWords).sample(1);
    console.log('==== New base word: '+word+' =====');
    var letters = word[0].split("");
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

    console.log('checking word: '+word);

    // The obvious failure conditions
    if(_.contains(this.correctWordsFull(),word)) return false; // skip words already found
    if(_.size(word)===0) return false; // skip empty
    if( ! wordTrie.lookup(word)) return false; // skip non-real words

    console.log('validated word: '+word);

    // Make sure the word is composed of this.letters()
    var wordLettersOverlap = _.difference( _(word).chars(), this.letters() ).length;
    var wordLength = _.size(word);

    console.log('size of word: '+wordLength);
    console.log('overlap: '+wordLettersOverlap);

    if(wordLettersOverlap === 0){
      this.correctWords.unshift(word);
      this.correctWordsFull.unshift(word);

      // only store up to n words
      if(_.size(this.correctWords()) >= NUM_LETTERS) this.correctWords.pop();


      // TODO: Clean this points and bonus points up.. use the payout object, duh!
      // update the timers and points
      this.addTime(TIME_FOR_WORD);
      this.addPoints(PTS_FOR_WORD);

      // check for bonus points
      if(wordLength >= BONUS_1_WORD_LEN) {
        this.addTime(BONUS_1_TIME_ADD);
        this.addPoints(BONUS_1_PTS_ADD);
      }

      if(wordLength >= BONUS_2_WORD_LEN) {
        this.addTime(BONUS_2_TIME_ADD);
        this.addPoints(BONUS_2_PTS_ADD);
      }

      if(wordLength >= BONUS_3_WORD_LEN) {
        this.addTime(BONUS_3_TIME_ADD);
        this.addPoints(BONUS_3_PTS_ADD);
      }


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
    this.progressBarWidth(this.progressBarWidth()+num*BAR_MULTIPLIER);
    this.setProgressBarColor(this.gameClock());
  },
  checkGameOver: function(){
    if(this.gameClock() < 1) return true;
    return false;
  },
  addPoints: function(pts){
    this.points(this.points()+pts);
  },
  setProgressBarColor: function(time){
    //console.log('setProgressBarColor time: '+time);
    if(time <= 5) {
      return this.progressBarColor('red');
    } else if(time <= 10) {
      return this.progressBarColor('orange');
    } else if(time < 25) {
      return this.progressBarColor(BAR_START_COLOR);
    } else if(time < 100) {
      return this.progressBarColor('blue');
    } else {
      return this.progressBarColor('purple');
    }
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
    wvm.addTime(0-1);
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
    wvm.progressBarWidth(CLOCK_START * BAR_MULTIPLIER);

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

  // initial load of game
  mainIntervalId = setInterval( mainloop, framerate );
  timerIntervalId = setInterval( timerLoop, timerRate );

  $('#start-screen, #reset-screen').hide();
  $('#in-game-screen').show();
  $('#guess-input').focus().select();

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