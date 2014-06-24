var Alphabet = ['a','b','c','d','e','f','g',
                'h','i','j','k','l','m','n',
                'o','p','r','s','t','u',
                'v','w','y'];

var Vowels = ['a','i','e','o','u'];

var AlphaDist = {
  e: 10,t: 9, a: 8, o: 8, i: 7,
  n: 7, s: 6, h: 6, r: 6, d: 5,
  l: 5, c: 3, u: 3, m: 3, w: 2,
  f: 2, g: 2, p: 2, b: 2, v: 1,
  k: 1
};

var Payout = {
  2: {
    time: 1,
    points: 1
  },
  3: {
    time: 1,
    points: 2
  },
  4: {
    time: 2,
    points: 3
  },
  5: {
    time: 3,
    points: 10
  },
  6: {
    time: 4,
    points: 20
  },
  7: {
    time: 5,
    points: 50
  }
};