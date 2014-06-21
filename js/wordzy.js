
/*
 * Wordzy: Impossible.
 *
 * @author Bryan Potts <pottspotts@gmail.com>
 *
 */

var CLOCK_START = 5;
var NUM_VOWELS = 2;
var NUM_LETTERS = 7;
var TIME_PER_TURN = 6000;
var SECOND_HAND = 1300;

var mainIntervalId, timerIntervalId;

function WordzyViewModel(){
  var self = this;

  self.letters = ko.observableArray(this.pickLetters(7));
  self.correctWords = ko.observableArray();
  self.timer = ko.observable(CLOCK_START);
  self.points = ko.observable(0);

}

$.extend(WordzyViewModel.prototype,{

  pickLetters: function(num){
    letters = _(Alphabet).sample(num);
    var numVowels = _.intersection( Vowels, letters ).length;
    if(numVowels < NUM_VOWELS) this.pickLetters(num);
    return letters;
  },
  changeLetters: function(){
    $('#guess-input').val(null); // clear input state so user doesn't have to backspace
    return this.letters(this.pickLetters(7));
  },
  attemptWord: function(word){
    if(_.contains(this.correctWords(),word)) return false; // skip words already found
    if(_.size(word)===0) return false; // skip empty
    if( ! wordTrie.lookup(word)) return false; // skip non-real words
    var wordLettersOverlap = _.intersection( _(word).chars(), this.letters() ).length;
    if(wordLettersOverlap == word.length){
      this.correctWords.unshift(word);
      // only store up to n words
      if(_.size(this.correctWords()) >= NUM_LETTERS) this.correctWords.pop();
      this.addTime(1);
      this.addPoints(1);
      return true;
    } else {
      return false;
    }
  },
  addTime: function(num){
    this.timer(this.timer()+num);
  },
  subtractTime: function(num){
    this.timer(this.timer()-num);
  },
  checkGameOver: function(){
    console.log(this.timer());
    if(this.timer()<1){
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

  var gameOver = 0;

  var framerate = TIME_PER_TURN; //ms
  var mainloop = function() {
    wvm.changeLetters();
  };

  // another loop for the game timer functions
  var timerRate = SECOND_HAND; //ms
  var timerLoop = function() {
    wvm.subtractTime(1);
    gameOver = wvm.checkGameOver();
    if(gameOver){
      endGame();
    }
  };

  $("#game-start, #reset-btn").click(function(){
    mainIntervalId = setInterval( mainloop, framerate );
    timerIntervalId = setInterval( timerLoop, timerRate );
    wvm.timer(CLOCK_START);
    wvm.points(0);
    wvm.correctWords([]);
    $('#start-screen, #reset-screen').hide();
    $('#in-game-screen').show();
    $('#guess-input').focus().select();
  });

  function endGame(){
    clearInterval(mainIntervalId);
    clearInterval(timerIntervalId);
    resetGame();
  }

  function resetGame(){
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
      wvm.changeLetters();
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