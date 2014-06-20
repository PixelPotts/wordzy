
function WordzyViewModel(){
  var self = this;

  self.letters = ko.observableArray(this.pickLetters(7));
  self.correctWords = ko.observableArray();
  self.timer = ko.observable(5);
  self.points = ko.observable(0);

}

$.extend(WordzyViewModel.prototype,{

  pickLetters: function(num){
    letters = _(Alphabet).sample(num);
    var numVowels = _.intersection( Vowels, letters ).length;
    if(numVowels < 2) this.pickLetters(num);
    return letters;
  },
  changeLetters: function(){
    return this.letters(this.pickLetters(7));
  },
  attemptWord: function(word){
    if(_.contains(this.correctWords(),word)) return false; // skip words already found
    if(_.size(word)===0) return false; // skip empty
    if( ! wordTrie.lookup(word)) return false; // skip non-real words
    var wordLettersOverlap = _.intersection( _(word).chars(), this.letters() ).length;
    if(wordLettersOverlap == word.length){
      this.correctWords.unshift(word);
      // only store up to 7 words
      if(_.size(this.correctWords()) >= 7) this.correctWords.pop();
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
    if(this.timer()<1){
      return 1;
    }
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

  var framerate = 6000; //ms
  var mainloop = function() {
    wvm.changeLetters();
  };

  // another loop for the game timer functions
  var timerRate = 1300; //ms
  var timerLoop = function() {
    wvm.subtractTime(1);
    gameOver = wvm.checkGameOver();
    if(gameOver){
      console.log("Game Over!");
    }
  };

  $("#game-start").click(function(){
    setInterval( mainloop, framerate );
    setInterval( timerLoop, timerRate );
    $('#start-screen').hide();
    $('#in-play-container').show();
    $('#guess-input').focus().select();
  });


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

});