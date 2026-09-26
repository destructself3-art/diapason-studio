/*
 * Diapason · 03 · Retro ’90s — behaviour.
 * Pixel icons (ASCII maps → crisp SVG), WordArt, the Win95 window manager (drag / z-order / min / max / close,
 * desktop icons, recycle bin), taskbar + Start menu + scroll spy, the "28.8k modem" intro, hit counter,
 * 16-colour pixel-art case canvases, setup wizard, Explorer FAQ, guestbook states, a WebAudio chiptune
 * "MIDI" player and the sparkle cursor trail.
 */
(function () {
  'use strict';
  var D = window.DIAPASON;
  if (!D) return;

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var X = 'x.retro-90s.';
  var tx = function (k, vars) { var v = D.t(X + k); return vars ? D.fmt(v, vars) : v; };
  var isPreview = D.isPreview;
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduced = function () { return mqReduce.matches; };
  var previewActive = false;
  function store(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; }
    return null;
  }
  function pad(n, l) { n = String(n); while (n.length < (l || 2)) n = '0' + n; return n; }

  /* =====================================================================
   * 1. PIXEL ICONS — 16-colour ASCII maps rendered to crisp SVG
   * ===================================================================== */
  var PAL = {
    k: '#000000', w: '#FFFFFF', s: '#C0C0C0', g: '#808080', d: '#DFDFDF', n: '#000080', b: '#0000FF',
    t: '#008080', c: '#00FFFF', y: '#FFFF00', o: '#808000', r: '#FF0000', m: '#800000', p: '#800080',
    M: '#FF00FF', G: '#008000', l: '#00FF00', h: '#FFCC99', e: '#996633', f: '#663300', a: '#FF8000', q: '#FFFFCC'
  };
  function gen(w, h, fn) {
    var rows = [];
    for (var y = 0; y < h; y++) { var r = ''; for (var x = 0; x < w; x++) r += fn(x, y) || '.'; rows.push(r); }
    return rows;
  }
  function inDisc(x, y, cx, cy, r) { var dx = x + 0.5 - cx, dy = y + 0.5 - cy; return dx * dx + dy * dy <= r * r; }
  function overlay(base, glyph, ox, oy) {
    var rows = base.slice();
    glyph.forEach(function (g, j) {
      var r = rows[oy + j].split('');
      for (var i = 0; i < g.length; i++) if (g[i] !== '.') r[ox + i] = g[i];
      rows[oy + j] = r.join('');
    });
    return rows;
  }

  var ICON = {
    logo: [
      '................',
      '....kkk..kkk....',
      '..r.kwk..kwk.b..',
      '.r..kwk..kwk..b.',
      'r.y.kwk..kwk.l.b',
      'r.y.kwk..kwk.l.b',
      '.r..kwk..kwk..b.',
      '..r.kwk..kwk.b..',
      '....kwkkkkwk....',
      '....kwwwwwwk....',
      '.....kwwwwk.....',
      '......kwsk......',
      '......kwsk......',
      '......kwsk......',
      '......kwsk......',
      '......kkkk......'
    ],
    computer: [
      '................',
      '.kkkkkkkkkkkkkk.',
      '.kwwwwwwwwwwwsk.',
      '.kwkkkkkkkkkksk.',
      '.kwkttttttttksk.',
      '.kwktwttttttksk.',
      '.kwkttttttttksk.',
      '.kwkttttttttksk.',
      '.kwkkkkkkkkkksk.',
      '.kwssssssssGsgk.',
      '.kggggggggggggk.',
      '.kkkkkkkkkkkkkk.',
      '......kssk......',
      '..kkkkkkkkkkkkk.',
      '..kwssssssssssk.',
      '..kkkkkkkkkkkkk.'
    ],
    bin: [
      '................',
      '................',
      '..kkkkkkkkkkkk..',
      '..kwwwwwwwwwwk..',
      '..kssssssssssk..',
      '..kkkkkkkkkkkk..',
      '...kwsgswsgsk...',
      '...kwsgswsgsk...',
      '...kwsgswsgsk...',
      '...kwsgswsgsk...',
      '....kwsgswsk....',
      '....kwsgswsk....',
      '....kwsgswsk....',
      '....kwsgswsk....',
      '....kkkkkkkk....',
      '................'
    ],
    binfull: [
      '.....ww..yy.....',
      '...wwwwkyyyyw...',
      '..kkkkkkkkkkkk..',
      '..kwwwwwwwwwwk..',
      '..kssssssssssk..',
      '..kkkkkkkkkkkk..',
      '...kwsgswsgsk...',
      '...kwsgswsgsk...',
      '...kwsgswsgsk...',
      '...kwsgswsgsk...',
      '....kwsgswsk....',
      '....kwsgswsk....',
      '....kwsgswsk....',
      '....kwsgswsk....',
      '....kkkkkkkk....',
      '................'
    ],
    folder: [
      '................',
      '................',
      '..kkkkk.........',
      '.kyyyyyk........',
      '.kyyyyyykkkkkkk.',
      '.kywwwwwwwwwwyk.',
      '.kyyyyyyyyyyyyk.',
      '.kyyyyyyyyyyyyk.',
      '.kyyyyyyyyyyyyk.',
      '.kyyyyyyyyyyyyk.',
      '.kyyyyyyyyyyyyk.',
      '.kyyyyyyyyyyyok.',
      '.kooooooooooook.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................'
    ],
    folderopen: [
      '................',
      '..kkkkk.........',
      '.kyyyyyk........',
      '.kyyyyyykkkkkk..',
      '.kyyyyyyyyyyyk..',
      '.kyyykkkkkkkkkkk',
      '.kyykyyyyyyyyyk.',
      '.kyykyyyyyyyyyk.',
      '.kykyyyyyyyyyk..',
      '.kykyyyyyyyyyk..',
      '.kkyyyyyyyyyk...',
      '.kkyyyyyyyyyk...',
      '.kkkkkkkkkkk....',
      '................',
      '................',
      '................'
    ],
    doc: [
      '................',
      '...kkkkkkkk.....',
      '...kwwwwwwkk....',
      '...kwwwwwwkwk...',
      '...kwwwwwwkkkk..',
      '...kwggggwwwwk..',
      '...kwwwwwwwwwk..',
      '...kwggggggwwk..',
      '...kwwwwwwwwwk..',
      '...kwggggggwwk..',
      '...kwwwwwwwwwk..',
      '...kwgggggwwwk..',
      '...kwwwwwwwwwk..',
      '...kwggggggwwk..',
      '...kwwwwwwwwwk..',
      '...kkkkkkkkkkk..'
    ],
    notepad: [
      '................',
      '.kkkkkkkkkkkkk..',
      '.knnnnnnnnnnnk..',
      '.knwnwnwnwnwnk..',
      '.kwwwwwwwwwwwk..',
      '.kwggggggggwwk..',
      '.kwwwwwwwwwwwk..',
      '.kwggggggggwwk..',
      '.kwwwwwwwwwwwk..',
      '.kwgggggggwwwk..',
      '.kwwwwwwwwwwwk..',
      '.kwggggggggwwk..',
      '.kwwwwwwwwwwwk..',
      '.kkkkkkkkkkkkkg.',
      '..ggggggggggggg.',
      '................'
    ],
    bulb: [
      '......kkkk......',
      '....kkyyyykk....',
      '...kyywyyyyyk...',
      '..kyywyyyyyyyk..',
      '..kywyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '..kyyyyyyyyyyk..',
      '...kyyyyyyyyk...',
      '....kyyyyyyk....',
      '.....kyyyyk.....',
      '.....ksssgk.....',
      '.....kgggsk.....',
      '.....ksssgk.....',
      '......kggk......',
      '.......kk.......',
      '................'
    ],
    book: [
      '................',
      '..kkkkkkkkkkkk..',
      '.kmrrrrrrrrrrrk.',
      '.kmrrrrrrrrrrrk.',
      '.kmrryyyyyyrrrk.',
      '.kmrrykkkkyrrrk.',
      '.kmrryyyyyyrrrk.',
      '.kmrrrrrrrrrrrk.',
      '.kmrrrrrrrrrrrk.',
      '.kmrrrrrrrrrrrk.',
      '.kmrrrrrrrrrrrk.',
      '.kmkkkkkkkkkkkkk',
      '.kmwwwwwwwwwwwk.',
      '.kmgwgwgwgwgwgk.',
      '.kkkkkkkkkkkkkk.',
      '................'
    ],
    speaker: [
      '................',
      '......kk........',
      '.....ksk...k....',
      '....kssk....k...',
      'kkkkwssk.k...k..',
      'kwwwwssk..k..k..',
      'kwsssssk..k..k..',
      'kwsssssk..k..k..',
      'kwsssssk..k..k..',
      'kggggssk..k..k..',
      'kkkkgssk.k...k..',
      '....kgsk....k...',
      '.....kgk...k....',
      '......kk........',
      '................',
      '................'
    ],
    mail: [
      '................',
      '................',
      'kkkkkkkkkkkkkkkk',
      'kwkwwwwwwwwwwkwk',
      'kwwkwwwwwwwwkwwk',
      'kwwwkwwwwwwkwwwk',
      'kwwwwkwwwwkwwwwk',
      'kwwwwwkwwkwwwwwk',
      'kwwwwkwkkwkwwwwk',
      'kwwwkwwwwwwkwwwk',
      'kwwkwwwwwwwwkwwk',
      'kwkwwwwwwwwwwkwk',
      'kkwwwwwwwwwwwwkk',
      'kkkkkkkkkkkkkkkk',
      '................',
      '................'
    ],
    cpl: [
      '................',
      '.kkkkkkkkkkkkkk.',
      '.knnnnnnnnnnnnk.',
      '.kssssssssssssk.',
      '.kswwwwwwwwwwsk.',
      '.kswggnnggggwsk.',
      '.kswwwwwwwwwwsk.',
      '.kswgggggnngwsk.',
      '.kswwwwwwwwwwsk.',
      '.kswnnggggggwsk.',
      '.kswwwwwwwwwwsk.',
      '.kssssssssssssk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................',
      '................'
    ],
    paint: [
      '................',
      '.kkkkkkkkkkkkkk.',
      '.kccccccccyyyck.',
      '.kcccccccyyyyyk.',
      '.kccwwccccyyyck.',
      '.kcwwwwccccccck.',
      '.kccccccGccccck.',
      '.kcccccGGGcccck.',
      '.kccGcGGGGGccck.',
      '.kcGGGGGGGGGcGk.',
      '.kGGGGGGGGGGGGk.',
      '.kGGoGGGGGGoGGk.',
      '.kGGGGGGGGGGGGk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................'
    ],
    floppy: [
      '.kkkkkkkkkkkkk..',
      '.knnsssssssnnnk.',
      '.knnsskkssnnnnk.',
      '.knnsskkssnnnnk.',
      '.knnsssssssnnnk.',
      '.knnnnnnnnnnnnk.',
      '.knnnnnnnnnnnnk.',
      '.knnwwwwwwwwnnk.',
      '.knnwggggggwnnk.',
      '.knnwwwwwwwwnnk.',
      '.knnwggggwwwnnk.',
      '.knnwwwwwwwwnnk.',
      '.knnwwwwwwwwnnk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................'
    ],
    tag: [
      '................',
      '.........kkkkkk.',
      '........kyyyyyyk',
      '.......kyyyykkyk',
      '......kyyyyykkyk',
      '.....kyyyyyyyyyk',
      '....kyyyyyyyyyk.',
      '...kyyyyyyyyyk..',
      '..kyyyyyyyyyk...',
      '.kyyyyyyyyyk....',
      'kyyyyyyyyyk.....',
      'kyyyyyyyyk......',
      '.kyyyyyyk.......',
      '..kyyyyk........',
      '...kyyk.........',
      '....kk..........'
    ],
    landing: [
      '..kkkkkkkkkk....',
      '..kwwwwwwwwkk...',
      '..kwwwwwwwwkwk..',
      '..kwwwwwwwwkkkk.',
      '..kwwwwrwwwwwwk.',
      '..kwwwwrwwwwwwk.',
      '..kwwrrrrrwwwwk.',
      '..kwwwrrrwwwwwk.',
      '..kwwwrwrwwwwwk.',
      '..kwwwwwwwwwwwk.',
      '..kwggggggggwwk.',
      '..kwwwwwwwwwwwk.',
      '..kwnnnnnnwwwwk.',
      '..kwwwwwwwwwwwk.',
      '..kkkkkkkkkkkkk.',
      '................'
    ],
    company: [
      '....kkkkkkkk....',
      '....kwsssssk....',
      '....kwnswnsk....',
      '....kwsssssk....',
      '....kwnswnsk....',
      'kkkkkwsssssk....',
      'kwsskwnswnsk....',
      'kwnskwsssssk....',
      'kwsskwnswnskkkkk',
      'kwnskwsssssksssk',
      'kwsskwnswnsksnsk',
      'kwnskwsssssksssk',
      'kwsskwsnnssksnsk',
      'kwsskwsnnssksssk',
      'kkkkkkkkkkkkkkkk',
      '................'
    ],
    store: [
      '................',
      'kk.....rr.......',
      '.k....rrr..bb...',
      '.k..yyrrr..bb...',
      '.kkkkkkkkkkkkkkk',
      '..kwkwkwkwkwkwk.',
      '..kwkwkwkwkwkwk.',
      '...kwkwkwkwkwk..',
      '...kkkkkkkkkkk..',
      '....k.......k...',
      '....kkkkkkkkkk..',
      '................',
      '....kk.....kk...',
      '...kssk...kssk..',
      '....kk.....kk...',
      '................'
    ],
    app: [
      '.kkkkkkkkkkkkkk.',
      '.knnnnnnnnnwswk.',
      '.kwwwwwwwwwwwwk.',
      '.kwwwwwwwwwrrwk.',
      '.kwwwwwwwwwrrwk.',
      '.kwwwwwwbbwrrwk.',
      '.kwwwwwwbbwrrwk.',
      '.kwwGGwwbbwrrwk.',
      '.kwwGGwwbbwrrwk.',
      '.kwwGGwwbbwrrwk.',
      '.kwkkkkkkkkkkwk.',
      '.kwwwwwwwwwwwwk.',
      '.kkkkkkkkkkkkkk.',
      '................',
      '................',
      '................'
    ],
    cube: [
      '.......kk.......',
      '.....kkyykk.....',
      '...kkyyyyyykk...',
      '.kkyyyyyyyyyykk.',
      'krkkyyyyyyyykkbk',
      'krrrkkyyyykkbbbk',
      'krrrrrkkkkbbbbbk',
      'krrrrrrkkbbbbbbk',
      'krrrrrrkkbbbbbbk',
      'krrrrrrkkbbbbbbk',
      'krrrrrrkkbbbbbbk',
      '.kkrrrrkkbbbbkk.',
      '...kkrrkkbbkk...',
      '.....kkkkkk.....',
      '................',
      '................'
    ],
    palette: [
      '................',
      '....kkkkkkk.....',
      '..kkhhhhhhhkk...',
      '.khhrrhhhhbbhk..',
      'khhhrrhhhhbbhhk.',
      'khhhhhhhhhhhhhk.',
      'khGGhhhhkkhhhk..',
      'khGGhhhkwwkhk...',
      'khhhhhhkwwkk....',
      'khyyhhhhkk......',
      'khyyhhhhhhk.....',
      '.khhhhMMhhhk....',
      '..kkhhMMhhhk....',
      '....kkkkkkk.....',
      '................',
      '................'
    ],
    key: [
      '................',
      '................',
      '................',
      '................',
      '..kkkk..........',
      '.kyyyyk.........',
      'kyykkyykkkkkkkk.',
      'kyk..kyyyyyyyyyk',
      'kyykkyykkkyykyk.',
      '.kyyyyk...kk.k..',
      '..kkkk..........',
      '................',
      '................',
      '................',
      '................',
      '................'
    ],
    quill: [
      '...............k',
      '.............kwk',
      '............kwwk',
      '..........kkwwk.',
      '.........kwwwk..',
      '........kwwwk...',
      '.......kwwwk....',
      '......kwwgk.....',
      '.....kwwgk......',
      '....kwggk.......',
      '...kkgk.........',
      '...kgk..........',
      '..kkk...........',
      '..k.............',
      '.n..............',
      'nn..............'
    ],
    back: [
      '............',
      '....k.......',
      '...kk.......',
      '..kck.......',
      '.kcckkkkkkk.',
      'kcccccccccck',
      'kbbbbbbbbbbk',
      '.kbbkkkkkkk.',
      '..kbk.......',
      '...kk.......',
      '....k.......',
      '............'
    ],
    home: [
      '.....kk.....',
      '....krrk....',
      '...krrrrk...',
      '..krrrrrrk..',
      '.krrrrrrrrk.',
      'kkkkkkkkkkkk',
      '.kwwwwwwwwk.',
      '.kwkkwwwwwk.',
      '.kwkkwwkkwk.',
      '.kwwwwwkkwk.',
      '.kwwwwwkkwk.',
      '.kkkkkkkkkk.'
    ],
    printer: [
      '...kkkkkk...',
      '...kwwwwk...',
      '...kwggwk...',
      '.kkkkkkkkkk.',
      'kssssssssssk',
      'ksssssssslsk',
      'kggggggggggk',
      'kkkwwwwwwkkk',
      '..kwggggwk..',
      '..kwwwwwwk..',
      '..kkkkkkkk..',
      '............'
    ],
    pic: [
      'kkkkkkkkkkkk',
      'kccccccyyyck',
      'kcccccyyyyck',
      'kccccccyyyck',
      'kccGccccccck',
      'kcGGGccccGck',
      'kGGGGGccGGGk',
      'kGGGGGGGGGGk',
      'kGGGGGGGGGGk',
      'kkkkkkkkkkkk',
      '............',
      '............'
    ],
    digger: [
      '....................',
      '.......yyyy.........',
      '......yyyyyy........',
      '.....kkkkkkkk.......',
      '......hhhhh.........',
      '......hkhhk.........',
      '......hhhhh.........',
      '.......hhh..........',
      '.....aaaaaaa........',
      '....haaaaaaaah......',
      '....h.aaaaaa..h.....',
      '......nnnnnn...k....',
      '......nnnnnn....k...',
      '......nnn.nnn....k..',
      '.....nnn...nnn..sss.',
      '.....kk.....kk..sss.',
      '....kkk.....kkk.ss..',
      'eeeeeeeeeeeeeeeeeeee',
      'efeefeeefeeefeefeeef',
      'ffffffffffffffffffff'
    ],
    digger2: [
      '....................',
      '.......yyyy.......e.',
      '......yyyyyy.....ee.',
      '.....kkkkkkkk...sss.',
      '......hhhhh.....sss.',
      '......hkhhk....k....',
      '......hhhhh...k.....',
      '.......hhh...k......',
      '.....aaaaaaahh......',
      '....aaaaaaaa........',
      '....h.aaaaaa........',
      '......nnnnnn........',
      '......nnnnnn........',
      '......nnn.nnn.......',
      '.....nnn...nnn......',
      '.....kk.....kk......',
      '....kkk.....kkk.....',
      'eeeeeeeeeeeeeeee..ee',
      'efeefeeefeeefeef.fef',
      'ffffffffffffffffffff'
    ]
  };
  ICON.network = [
    'kkkkkkk.........',
    'kwwwwwk.........',
    'kwtttwk.........',
    'kwtttwk.........',
    'kkkkkkk.........',
    '..kssk..........',
    '.kkkkkk.........',
    '...k............',
    '...k.....kkkkkkk',
    '...k.....kwwwwwk',
    '...kkkkkkkwtttwk',
    '.........kwtttwk',
    '.........kkkkkkk',
    '...........kssk.',
    '..........kkkkkk',
    '................'
  ];
  ICON.docs = [
    '................',
    '......kkkkkk....',
    '......kwwwwkk...',
    '..kkkkkwggwkwk..',
    '.kyyyykwwwwkkkk.',
    '.kyyyykwggggwwk.',
    '.kywwwkwwwwwwwkk',
    '.kyyyyyyyyyyyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kyyyyyyyyyyyyk.',
    '.kyyyyyyyyyyyok.',
    '.kooooooooooook.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................'
  ];
  ICON.briefcase = [
    '................',
    '................',
    '......kkkk......',
    '.....kk..kk.....',
    '.kkkkkkkkkkkkkk.',
    '.keeeeeeeeeeeek.',
    '.keqeeeeeeeeqek.',
    '.keeeeeeeeeeeek.',
    '.kffffkyykffffk.',
    '.keeeekkkkeeeek.',
    '.keeeeeeeeeeeek.',
    '.keeeeeeeeeeeek.',
    '.kffffffffffffk.',
    '.kkkkkkkkkkkkkk.',
    '................',
    '................'
  ];
  ICON.fwd = ICON.back.map(function (r) { return r.split('').reverse().join(''); });
  ICON.shutdown = ICON.computer.slice();
  ICON.shutdown[4] = '.kwknnnnnnnnksk.';
  ICON.shutdown[5] = '.kwknnnnyynnksk.';
  ICON.shutdown[6] = '.kwknnnyynnnksk.';
  ICON.shutdown[7] = '.kwknnnnyynnksk.';
  ICON.cd = gen(16, 16, function (x, y) {
    if (!inDisc(x, y, 8, 8, 7.7)) return;
    if (!inDisc(x, y, 8, 8, 6.8)) return 'k';
    if (inDisc(x, y, 8, 8, 1.3)) return '.';
    if (inDisc(x, y, 8, 8, 2.1)) return 'k';
    if (inDisc(x, y, 8, 8, 3.2)) return 'd';
    var a = Math.atan2(y + 0.5 - 8, x + 0.5 - 8);
    if (a > -2.55 && a < -2.2) return 'c';
    if (a > -2.2 && a < -1.9) return 'M';
    if (a > -1.9 && a < -1.62) return 'y';
    if (a > 0.55 && a < 0.85) return 'M';
    if (a > 0.85 && a < 1.15) return 'c';
    return (x + y < 12) ? 'w' : 's';
  });
  ICON.globe = gen(16, 16, function (x, y) {
    if (!inDisc(x, y, 8, 8, 7.7)) return;
    if (!inDisc(x, y, 8, 8, 6.8)) return 'k';
    var land = inDisc(x, y, 5.5, 6, 3) || inDisc(x, y, 7, 4, 2) || inDisc(x, y, 11, 10.5, 2.6) || inDisc(x, y, 10, 13, 1.6) || inDisc(x, y, 12.5, 5, 1.2);
    if (land) return (x + y) % 5 === 0 ? 'l' : 'G';
    return (x < 6 && y < 7 && (x + y) % 3 === 0) ? 'c' : 'b';
  });
  ICON.help = overlay(gen(16, 16, function (x, y) {
    if (!inDisc(x, y, 8, 8, 7.7)) return;
    if (!inDisc(x, y, 8, 8, 6.8)) return 'k';
    return 'b';
  }), ['.wwww.', 'ww..ww', '....ww', '...ww.', '..ww..', '..ww..', '......', '..ww..', '..ww..'], 5, 3);
  ICON.info = overlay(gen(16, 16, function (x, y) {
    if (!inDisc(x, y, 8, 8, 7.7)) return;
    if (!inDisc(x, y, 8, 8, 6.8)) return 'k';
    return 'w';
  }), ['..bb.', '..bb.', '.....', '.bbb.', '..bb.', '..bb.', '..bb.', '..bb.', '.bbbb'], 5, 3);
  ICON.stop = gen(12, 12, function (x, y) {
    var dx = Math.abs(x + 0.5 - 6), dy = Math.abs(y + 0.5 - 6);
    if (dx > 5.6 || dy > 5.6 || dx + dy > 8.2) return;
    if (dx > 4.6 || dy > 4.6 || dx + dy > 7.2) return 'k';
    if (dy < 1.2 && dx < 3.6) return 'w';
    return 'r';
  });
  ICON.reload = gen(12, 12, function (x, y) {
    var head = { '8,0': 'k', '9,0': 'k', '10,0': 'k', '11,0': 'k', '11,1': 'k', '11,2': 'k', '11,3': 'k', '10,1': 'G', '10,2': 'G', '9,1': 'G', '9,3': 'k', '10,3': 'k' };
    if (head[x + ',' + y]) return head[x + ',' + y];
    var dx = x + 0.5 - 6, dy = y + 0.5 - 6.3, d = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx) * 180 / Math.PI;
    if (a > -70 && a < -10) return;
    if (d >= 2.4 && d <= 5.4) return (d > 4.5 || d < 3.2) ? 'k' : 'G';
  });

  var GLYPH = {
    min: ['........', '........', '........', '........', '........', '........', '.kkkkkk.', '.kkkkkk.'],
    max: ['kkkkkkkkk', 'kkkkkkkkk', 'k.......k', 'k.......k', 'k.......k', 'k.......k', 'k.......k', 'k.......k', 'kkkkkkkkk'],
    restore: ['..kkkkkk.', '..kkkkkk.', '..k....k.', 'kkkkkk.k.', 'kkkkkk.k.', 'k....kkk.', 'k....k...', 'k....k...', 'kkkkkk...'],
    close: ['kk....kk', '.kk..kk.', '..kkkk..', '...kk...', '..kkkk..', '.kk..kk.', 'kk....kk'],
    help: ['.kkkk.', 'kk..kk', '....kk', '...kk.', '..kk..', '..kk..', '......', '..kk..', '..kk..']
  };

  function pixSVG(map, withSel) {
    var h = map.length, w = map[0].length, by = {}, sel = '';
    for (var y = 0; y < h; y++) {
      var row = map[y], x = 0;
      while (x < w) {
        var ch = row[x];
        if (ch === '.' || ch === ' ') { x++; continue; }
        var x0 = x;
        while (x < w && row[x] === ch) x++;
        by[ch] = (by[ch] || '') + 'M' + x0 + ' ' + y + 'h' + (x - x0) + 'v1h-' + (x - x0) + 'z';
      }
      if (withSel) for (x = 0; x < w; x++) if (row[x] !== '.' && (x + y) % 2 === 0) sel += 'M' + x + ' ' + y + 'h1v1h-1z';
    }
    var s = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true" focusable="false">';
    Object.keys(by).forEach(function (c) { s += '<path fill="' + (PAL[c] || '#000') + '" d="' + by[c] + '"/>'; });
    if (withSel && sel) s += '<path class="sel" fill="#000080" d="' + sel + '"/>';
    return s + '</svg>';
  }
  var svgCache = {};
  function iconSVG(name) {
    if (!ICON[name]) return '';
    return svgCache[name] || (svgCache[name] = pixSVG(ICON[name], true));
  }
  var NAV_ICON = { '#services': 'cpl', '#work': 'paint', '#process': 'floppy', '#pricing': 'tag', '#faq': 'help', '#contact': 'book' };
  var SVC_ICON = ['landing', 'company', 'store', 'app', 'cube', 'palette'];
  var TOOL_ICON = { paint: 'pic' };
  function paintIcons(scope) {
    $$('[data-icon]', scope).forEach(function (el) {
      var n = el.getAttribute('data-icon');
      if (el.closest('.nsc__tool') && TOOL_ICON[n]) n = TOOL_ICON[n];
      el.innerHTML = iconSVG(n);
    });
    $$('[data-icon-nav]', scope).forEach(function (el) { el.innerHTML = iconSVG(NAV_ICON[el.getAttribute('data-icon-nav')] || 'doc'); });
    $$('[data-icon-svc]', scope).forEach(function (el) { el.innerHTML = iconSVG(SVC_ICON[+el.getAttribute('data-icon-svc')] || 'doc'); });
    $$('[data-glyph]', scope).forEach(function (el) { setGlyph(el, el.getAttribute('data-glyph')); });
  }
  function setGlyph(el, name) {
    var g = GLYPH[name];
    if (!g) return;
    el.innerHTML = pixSVG(g, false).replace('<svg ', '<svg width="' + g[0].length + '" height="' + g.length + '" style="width:' + g[0].length + 'px;height:' + g.length + 'px" ');
  }
  paintIcons(document);
  D.retro = { icons: ICON, svg: pixSVG };

  /* =====================================================================
   * 2. WORDART
   * ===================================================================== */
  var RAINBOW = ['#FF0000', '#FF8000', '#FFFF00', '#00FF00', '#00FFFF', '#FF00FF'];
  function buildWordArt() {
    var h1 = $('.hero__title');
    if (!h1) return;
    var one = $('.wa--one', h1), src = $('.hero__this', h1), two = $('.wa--two', h1);
    if (one) one.setAttribute('data-text', one.textContent);
    if (!src || !two) return;
    two.textContent = '';
    var li = 0;
    src.textContent.split(/(\s+)/).forEach(function (word) {
      if (!word) return;
      if (/^\s+$/.test(word)) { two.appendChild(document.createTextNode(' ')); return; }
      var ws = document.createElement('span');
      ws.className = 'w';
      Array.from(word).forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'l';
        s.textContent = ch;
        s.style.setProperty('--c', RAINBOW[li % RAINBOW.length]);
        s.style.setProperty('--i', li);
        li++;
        ws.appendChild(s);
      });
      two.appendChild(ws);
    });
    h1.classList.add('is-wa');
  }
  buildWordArt();

  /* =====================================================================
   * 3. TASKBAR: clock, Start menu, scroll spy
   * ===================================================================== */
  var clock = $('[data-clock]');
  function tick() {
    if (!clock) return;
    var d = new Date();
    clock.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
    clock.setAttribute('datetime', d.toISOString());
  }
  tick();
  setInterval(tick, 15000);

  var startBtn = $('#start-btn'), menu = $('#startmenu');
  function menuItems() { return $$('.sm-item', menu); }
  function setMenu(open, focusFirst) {
    if (!menu || !startBtn) return;
    menu.hidden = !open;
    startBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && focusFirst) { var it = menuItems()[0]; if (it) it.focus(); }
  }
  if (startBtn && menu) {
    startBtn.addEventListener('click', function (e) { setMenu(menu.hidden, e.detail === 0); });
    document.addEventListener('pointerdown', function (e) {
      if (!menu.hidden && !menu.contains(e.target) && !startBtn.contains(e.target)) setMenu(false);
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('.sm-item')) setMenu(false); });
    menu.addEventListener('keydown', function (e) {
      var items = menuItems(), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); setMenu(false); startBtn.focus(); }
    });
    startBtn.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' && menu.hidden) { e.preventDefault(); setMenu(true, true); }
      if (e.key === 'Escape' && !menu.hidden) { setMenu(false); }
    });
    menu.addEventListener('focusout', function (e) {
      if (e.relatedTarget && !menu.contains(e.relatedTarget) && e.relatedTarget !== startBtn) setMenu(false);
    });
  }

  var spyLinks = $$('.taskbar [data-spy]');
  var secWins = {};
  $$('[data-sec-win]').forEach(function (w) { secWins[w.getAttribute('data-sec-win')] = w; });
  var activeWin = null, lastSpy = null;
  function setActiveWin(w) {
    if (activeWin === w) return;
    if (activeWin) activeWin.classList.remove('is-active');
    activeWin = w || null;
    if (activeWin) activeWin.classList.add('is-active');
  }
  var aboutWin = $('.win--about');
  function spy(force) {
    var cur = D.currentSection();
    var atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 40;
    if (atEnd && aboutWin) cur = 'about';
    if (cur === lastSpy && !force) return;
    lastSpy = cur;
    spyLinks.forEach(function (a) {
      var on = a.getAttribute('data-spy').replace('#', '') === cur;
      a.classList.toggle('is-current', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    setActiveWin(cur === 'about' ? aboutWin : secWins[cur]);
  }
  var vsThumb = $('[data-vs-thumb]');
  function vscroll() {
    if (!vsThumb) return;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    vsThumb.style.setProperty('--sp', max > 0 ? Math.min(1, window.scrollY / max).toFixed(3) : 0);
  }
  var spyTick = false;
  window.addEventListener('scroll', function () {
    if (spyTick) return;
    spyTick = true;
    requestAnimationFrame(function () { spyTick = false; spy(); vscroll(); });
  }, { passive: true });
  // first measurements wait for the first frame: measuring here, mid-init, forced a ~140 ms synchronous
  // layout that the rest of the init then invalidated again
  requestAnimationFrame(function () { spy(true); vscroll(); stackFloats(); });

  /* =====================================================================
   * 4. TOAST (Win95 tooltip) + zoom rectangle
   * ===================================================================== */
  var toastEl = $('[data-toast]'), toastTimer = 0;
  function toast(text, x, y) {
    if (!toastEl || !text) return;
    toastEl.textContent = text;
    toastEl.hidden = false;
    var w = toastEl.offsetWidth, h = toastEl.offsetHeight;
    var left = Math.max(8, Math.min(window.innerWidth - w - 8, x - 12));
    var top = y + 22;
    if (top + h > window.innerHeight - 90) top = y - h - 14;
    toastEl.style.left = left + 'px';
    toastEl.style.top = Math.max(8, top) + 'px';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2600);
  }
  function zoom(fromEl, toEl, cb) {
    if (!fromEl || !toEl || reduced() || isPreview || !fromEl.getBoundingClientRect) { if (cb) cb(); return; }
    var a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    if (!a.width || !b.width) { if (cb) cb(); return; }
    var r = document.createElement('div');
    r.className = 'zoomrect';
    document.body.appendChild(r);
    var kf = [
      { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: Math.max(6, Math.min(a.height, 30)) + 'px' },
      { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: Math.max(6, Math.min(b.height, 30)) + 'px' }
    ];
    var done = function () { r.remove(); if (cb) cb(); };
    if (r.animate) { var an = r.animate(kf, { duration: 240, easing: 'steps(6, end)', fill: 'forwards' }); an.onfinish = done; }
    else done();
  }

  /* =====================================================================
   * 5. WINDOW MANAGER — draggable decorative windows
   * ===================================================================== */
  var desk = $('#top');
  var wins = {};
  $$('[data-win]').forEach(function (w) { wins[w.getAttribute('data-win')] = w; });
  var floats = $$('[data-float]');
  var zTop = 10;
  function raise(w) {
    if (!w) return;
    zTop++;
    if (zTop > 300) {
      zTop = 10;
      floats.concat(wins.browser ? [wins.browser] : []).forEach(function (o) { if (o.style.zIndex) o.style.zIndex = ++zTop; });
      zTop++;
    }
    w.style.zIndex = zTop;
  }
  function iconFor(name) { return $('.desk__icons [data-open="' + name + '"]'); }
  function getPos(w) { return { x: w._dx || 0, y: w._dy || 0 }; }
  function setPos(w, x, y) {
    w._dx = Math.round(x); w._dy = Math.round(y);
    w.style.setProperty('--dx', w._dx + 'px');
    w.style.setProperty('--dy', w._dy + 'px');
  }
  function limits(w) {
    var dr = desk.getBoundingClientRect(), r = w.getBoundingClientRect(), p = getPos(w);
    return {
      minX: p.x + (dr.left + 4 - r.left), maxX: p.x + (dr.right - 4 - r.right),
      minY: p.y + (dr.top + 4 - r.top), maxY: p.y + (dr.bottom - 4 - r.bottom)
    };
  }
  function clampPos(w, x, y) {
    var L = limits(w);
    setPos(w, Math.min(Math.max(x, L.minX), Math.max(L.minX, L.maxX)), Math.min(Math.max(y, L.minY), Math.max(L.minY, L.maxY)));
  }
  function updateMoveLabel(w) {
    var bar = $('[data-drag]', w), title = $('.win__title', w);
    if (bar && title) bar.setAttribute('aria-label', tx('wm.move', { name: title.textContent }));
  }
  function updateBin() {
    var full = floats.some(function (w) { return w.getAttribute('data-closed') === '1'; });
    var ic = $('.dicon--bin .dicon__img');
    if (ic) ic.innerHTML = iconSVG(full ? 'binfull' : 'bin');
  }
  function hideWin(w, how) {
    var name = w.getAttribute('data-win'), icon = iconFor(name);
    var hadFocus = w.contains(document.activeElement);
    zoom($('.win__bar', w), icon);
    w.classList.remove('is-max');
    w.classList.add('is-hidden');
    if (how === 'close') { w.setAttribute('data-closed', '1'); if (name === 'midi') Midi.stop(); }
    if (activeWin === w) setActiveWin(null);
    updateBin();
    if (hadFocus && icon) icon.focus({ preventScroll: true });
  }
  function showWin(name, fromEl) {
    var w = wins[name];
    if (!w) return;
    var wasHidden = w.classList.contains('is-hidden');
    w.classList.remove('is-hidden');
    w.removeAttribute('data-closed');
    updateBin();
    raise(w);
    setActiveWin(w);
    var rect = w.getBoundingClientRect();
    if (rect.top < 60 || rect.bottom > window.innerHeight) w.scrollIntoView({ block: 'nearest' });
    if (wasHidden) zoom(fromEl || iconFor(name), $('.win__bar', w));
    else { w.classList.remove('is-shake'); void w.offsetWidth; w.classList.add('is-shake'); }
    var bar = $('[data-drag]', w);
    if (bar) bar.focus({ preventScroll: true });
  }
  function toggleMax(w) {
    var on = !w.classList.contains('is-max');
    w.classList.toggle('is-max', on);
    var b = $('[data-act="max"]', w);
    if (b) {
      setGlyph(b, on ? 'restore' : 'max');
      b.setAttribute('data-i18n-attr', 'aria-label:' + X + 'wm.' + (on ? 'restore' : 'max') + ';title:' + X + 'wm.' + (on ? 'restore' : 'max'));
      D.apply(b.parentNode);
    }
    raise(w);
    setActiveWin(w);
    if (on) desk.scrollIntoView({ block: 'start' });
  }

  floats.forEach(function (w) {
    var bar = $('[data-drag]', w);
    updateMoveLabel(w);
    w.addEventListener('pointerdown', function () { raise(w); setActiveWin(w); });
    w.addEventListener('focusin', function () { raise(w); setActiveWin(w); });
    w.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b || !w.contains(b)) return;
      var act = b.getAttribute('data-act');
      if (act === 'min') hideWin(w, 'min');
      else if (act === 'close') hideWin(w, 'close');
      else if (act === 'max') toggleMax(w);
    });
    if (!bar) return;
    bar.addEventListener('dblclick', function (e) { if (!e.target.closest('button')) toggleMax(w); });
    bar.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || e.target.closest('button') || isPreview) return;
      if (e.pointerType !== 'mouse' && !mqFine.matches) return;
      if (w.classList.contains('is-max')) return;
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY, p0 = getPos(w), L = limits(w);
      try { bar.setPointerCapture(e.pointerId); } catch (err) {}
      w.classList.add('is-dragging');
      var move = function (ev) {
        var x = p0.x + ev.clientX - sx, y = p0.y + ev.clientY - sy;
        setPos(w, Math.min(Math.max(x, L.minX), Math.max(L.minX, L.maxX)), Math.min(Math.max(y, L.minY), Math.max(L.minY, L.maxY)));
      };
      var up = function () {
        w.classList.remove('is-dragging');
        bar.removeEventListener('pointermove', move);
        bar.removeEventListener('pointerup', up);
        bar.removeEventListener('pointercancel', up);
      };
      bar.addEventListener('pointermove', move);
      bar.addEventListener('pointerup', up);
      bar.addEventListener('pointercancel', up);
    });
    bar.addEventListener('keydown', function (e) {
      // only the bar itself moves the window: keys pressed on the _ □ × buttons inside it must keep their
      // native Enter/Space activation (the event bubbles up here from the child buttons)
      if (e.target !== bar) return;
      var step = e.shiftKey ? 40 : 10, p = getPos(w);
      var map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (map[e.key]) {
        e.preventDefault();
        if (w.classList.contains('is-max')) return;
        clampPos(w, p.x + map[e.key][0], p.y + map[e.key][1]);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        raise(w); setActiveWin(w);
      }
    });
  });
  if (wins.browser) wins.browser.addEventListener('pointerdown', function () { raise(wins.browser); });

  // ≥1200 px the floats hang in a column on the right: the first keeps its CSS top, each next one starts
  // 18 px under the previous one's real height (tips vary with the language and the random tip). Base
  // positions only — a window the visitor dragged keeps its --dx/--dy offset on top. A hidden window keeps
  // its slot (last known height), so closing one never makes the others jump.
  var mqWide = window.matchMedia('(min-width: 1200px)');
  var stackOrder = ['midi', 'tips', 'readme'].map(function (n) { return wins[n]; }).filter(Boolean);
  function stackFloats() {
    if (!mqWide.matches) { stackOrder.forEach(function (w) { w.style.top = ''; }); return; }
    if (!stackOrder.length || stackOrder.some(function (w) { return w.classList.contains('is-max'); })) return;
    stackOrder.forEach(function (w) { if (!w.classList.contains('is-hidden')) w._h = w.offsetHeight; });
    stackOrder[0].style.top = '';
    var top = parseFloat(getComputedStyle(stackOrder[0]).top) || 0;
    var hs = stackOrder.map(function (w) { return w._h || 0; });
    var sum = hs.reduce(function (a, b) { return a + b; }, 0);
    var slots = hs.filter(Boolean).length - 1, gap = 18;
    // keep the column inside the desktop on short screens: shrink the gaps first, then lift the column
    var avail = desk.clientHeight - 6;
    if (slots > 0 && top + sum + gap * slots > avail) gap = Math.max(8, (avail - top - sum) / slots);
    if (top + sum + gap * Math.max(0, slots) > avail) top = Math.max(8, avail - sum - gap * Math.max(0, slots));
    var y = top;
    stackOrder.forEach(function (w, i) {
      if (i) w.style.top = Math.round(y) + 'px';
      if (hs[i]) y += hs[i] + gap;
    });
    if (top !== (parseFloat(getComputedStyle(stackOrder[0]).top) || 0)) stackOrder[0].style.top = Math.round(top) + 'px';
  }
  var stackTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(stackTimer);
    stackTimer = setTimeout(function () {
      stackFloats();
      floats.forEach(function (w) { if (w._dx || w._dy) clampPos(w, w._dx, w._dy); });
    }, 80);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(stackFloats); });

  // desktop icons: single click selects, double click opens (touch / keyboard: one activation opens)
  var lastPointer = 'mouse';
  function selectIcon(ic) {
    $$('.dicon.is-sel').forEach(function (o) { if (o !== ic) o.classList.remove('is-sel'); });
    if (ic) ic.classList.add('is-sel');
  }
  function openThing(name, from) {
    if (name === 'bin') {
      var closed = floats.filter(function (w) { return w.getAttribute('data-closed') === '1'; });
      if (!closed.length) {
        var r = from.getBoundingClientRect();
        toast(tx('desk.binEmpty'), r.left + r.width / 2, r.top + r.height / 2);
        return;
      }
      closed.forEach(function (w) { showWin(w.getAttribute('data-win'), from); });
      return;
    }
    if (name === 'midi' || name === 'tips' || name === 'readme') showWin(name, from);
  }
  $$('.dicon').forEach(function (ic) {
    ic.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType || 'mouse'; });
    ic.addEventListener('click', function (e) {
      selectIcon(ic);
      if (ic.tagName === 'A') return;
      if (e.detail === 0 || lastPointer !== 'mouse') { openThing(ic.getAttribute('data-open'), ic); return; }
      var w = wins[ic.getAttribute('data-open')];
      if (w && w.classList.contains('is-hidden')) toast(tx('desk.hint'), e.clientX, e.clientY);
    });
    ic.addEventListener('dblclick', function () { if (ic.tagName !== 'A') openThing(ic.getAttribute('data-open'), ic); });
  });
  document.addEventListener('pointerdown', function (e) { if (!e.target.closest('.dicon')) selectIcon(null); });
  // Start-menu entries that open windows
  $$('.startmenu [data-open]').forEach(function (b) {
    b.addEventListener('click', function () { showWin(b.getAttribute('data-open'), startBtn); });
  });

  // content windows: the title-bar buttons are decorative — they answer with a joke
  $$('[data-joke]').forEach(function (b) {
    b.addEventListener('click', function (e) {
      var w = b.closest('.win');
      var key = { close: 'jokeClose', min: 'jokeMin', max: 'jokeMax', help: 'jokeHelp' }[b.getAttribute('data-joke')];
      toast(tx('wm.' + key), e.clientX, e.clientY);
      if (w && !reduced()) { w.classList.remove('is-shake'); void w.offsetWidth; w.classList.add('is-shake'); }
    });
  });
  document.addEventListener('animationend', function (e) { if (e.animationName === 'shake') e.target.classList.remove('is-shake'); });

  /* =====================================================================
   * 6. TIP OF THE DAY
   * ===================================================================== */
  var tipIdx = Math.floor(Math.random() * 6);
  var tipEl = $('[data-tip]');
  function renderTip() {
    // touch-only devices can't drag windows, double-click or press 1–5 → they get the touch-safe set
    var items = D.t(X + (mqFine.matches ? 'tips.items' : 'tips.touchItems')) || [];
    if (tipEl && items.length) tipEl.textContent = items[tipIdx % items.length];
  }
  renderTip();
  if (mqFine.addEventListener) mqFine.addEventListener('change', function () { renderTip(); stackFloats(); });
  var tipNext = $('[data-tip-next]');
  if (tipNext) tipNext.addEventListener('click', function () { tipIdx++; renderTip(); stackFloats(); });
  var tipStartup = $('[data-tip-startup]');
  if (tipStartup) {
    tipStartup.checked = store('diapason.retro.tips') !== '0';
    tipStartup.addEventListener('change', function () { store('diapason.retro.tips', tipStartup.checked ? '1' : '0'); });
    if (!tipStartup.checked && wins.tips && !isPreview) wins.tips.classList.add('is-hidden');
  }

  /* =====================================================================
   * 7. HIT COUNTER (odometer, localStorage)
   * ===================================================================== */
  var odo = $('[data-odo]'), odoText = $('[data-odo-text]');
  var hits = parseInt(store('diapason.retro.hits') || '0', 10) || 0;
  if (!isPreview) { hits++; store('diapason.retro.hits', String(hits)); }
  var visitor = 1996 + Math.max(1, hits);
  function buildOdo(value) {
    if (!odo) return;
    var s = pad(value, 6);
    odo.innerHTML = '';
    for (var i = 0; i < s.length; i++) {
      var d = document.createElement('span');
      d.className = 'odo__d';
      var strip = document.createElement('span');
      strip.className = 'odo__strip';
      for (var n = 0; n <= 9; n++) { var sp = document.createElement('span'); sp.textContent = n; strip.appendChild(sp); }
      d.appendChild(strip);
      odo.appendChild(d);
    }
    setOdo(value, true);
  }
  function setOdo(value, instant) {
    if (!odo) return;
    var s = pad(value, 6);
    // "instant" is only used on freshly built strips: they have never been rendered, so setting the
    // transform can't transition — no need for the old transition-off + forced-reflow dance at startup
    $$('.odo__strip', odo).forEach(function (strip, i) {
      strip.style.transform = 'translateY(' + (-30 * +s[i]) + 'px)';
    });
    if (odoText) odoText.textContent = s;
  }

  /* =====================================================================
   * 8. INTRO — the page "downloads" over a 28.8k modem
   * ===================================================================== */
  var statusEl = $('[data-nsc-status]'), progEl = $('[data-nsc-prog]');
  var booting = false;
  var skipIntro = isPreview || reduced() || (location.hash && location.hash !== '#top' && location.hash !== '#main');
  function finishBoot() {
    booting = false;
    root.classList.remove('is-booting');
    if (statusEl) { statusEl.setAttribute('data-i18n', X + 'browser.done'); statusEl.textContent = tx('browser.done'); }
    if (progEl) progEl.style.width = '0';
  }
  if (!skipIntro) {
    booting = true;
    root.classList.add('is-booting');
    buildOdo(Math.max(0, visitor - 1));
    floats.forEach(function (w) { w.classList.add('is-pending'); });
    if (statusEl) statusEl.textContent = tx('browser.connecting');
    var t0 = performance.now();
    var pct = -1;
    var skip = function () { if (booting) t0 = performance.now() - 5000; };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, skip, { once: true, passive: true }); });
    var loadTimer = setInterval(function () {
      var t = performance.now() - t0;
      if (t < 260) return;
      var p = Math.min(100, Math.round((t - 260) / 1500 * 100));
      if (p !== pct) {
        pct = p;
        if (statusEl && booting) statusEl.textContent = tx('browser.loading', { p: p });
        if (progEl) progEl.style.width = p + '%';
      }
      if (p >= 100) {
        clearInterval(loadTimer);
        finishBoot();
        var order = ['midi', 'readme', 'tips'];
        order.forEach(function (name, i) {
          var w = wins[name];
          if (!w) return;
          setTimeout(function () {
            if (w.classList.contains('is-hidden')) { w.classList.remove('is-pending'); return; }
            zoom(iconFor(name), $('.win__bar', w), function () { w.classList.remove('is-pending'); });
          }, 90 + i * 170);
        });
        setTimeout(function () { setOdo(visitor); }, 500);
      }
    }, 50);
  } else {
    buildOdo(visitor);
  }

  /* =====================================================================
   * 9. PIXEL-ART CASE CANVASES (16-colour / web-safe palette, dithering)
   * ===================================================================== */
  var AW = 128, AH = 80;
  var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function bayer(x, y) { return (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16; }

  /* A tiny software surface. Every bitmap is painted pixel by pixel; doing that with fillStyle + fillRect
     costs a colour-string parse per pixel (≈100 ms of main thread at startup). Here pixels are written
     straight into a Uint32Array and each visible canvas gets a single putImageData per frame. It speaks the
     few context calls the art uses: drawImage(surface, 0, 0), get/put/createImageData. */
  var LE = new Uint8Array(new Uint32Array([0x0A0B0C0D]).buffer)[0] === 0x0D;
  var colCache = {};
  function col32(c) {
    var v = colCache[c];
    if (v !== undefined) return v;
    var h = c.charAt(0) === '#' ? c.slice(1) : c;
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    v = LE ? ((0xFF000000 | (b << 16) | (g << 8) | r) >>> 0) : (((r << 24) | (g << 16) | (b << 8) | 0xFF) >>> 0);
    return (colCache[c] = v);
  }
  function Surf(w, h) {
    this.width = w; this.height = h;
    this.img = new ImageData(w, h);
    this.u32 = new Uint32Array(this.img.data.buffer);
  }
  Surf.prototype.drawImage = function (src) { // full-size blit at 0,0 with 1-bit alpha — all the art needs
    var s = src.u32, d = this.u32, n = Math.min(s.length, d.length), v;
    for (var i = 0; i < n; i++) { v = s[i]; if (LE ? v >>> 24 : v & 255) d[i] = v; }
  };
  Surf.prototype.getImageData = function () { return this.img; };
  Surf.prototype.createImageData = function (w, h) { return new ImageData(w, h); };
  Surf.prototype.putImageData = function (img) { this.img.data.set(img.data); };
  function off(w, h) { var s = new Surf(w || AW, h || AH); return { c: s, x: s }; }
  function R(ctx, x, y, w, h, col) {
    if (!ctx.u32) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h); return; }
    var W = ctx.width, x0 = Math.max(0, Math.round(x)), y0 = Math.max(0, Math.round(y));
    var x1 = Math.min(W, Math.round(x + w)), y1 = Math.min(ctx.height, Math.round(y + h));
    if (x1 <= x0 || y1 <= y0) return;
    var v = col32(col), u = ctx.u32;
    for (var yy = y0; yy < y1; yy++) u.fill(v, yy * W + x0, yy * W + x1);
  }
  function Px(ctx, x, y, col) {
    x = x | 0; y = y | 0;
    if (!ctx.u32) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); return; }
    if (x >= 0 && y >= 0 && x < ctx.width && y < ctx.height) ctx.u32[y * ctx.width + x] = col32(col);
  }
  function disc(ctx, cx, cy, r, col, test) {
    for (var y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
      for (var x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r && (!test || test(x, y, dx, dy))) Px(ctx, x, y, typeof col === 'function' ? col(x, y, dx, dy) : col);
      }
    }
  }
  function drawMap(ctx, map, ox, oy, s) {
    for (var y = 0; y < map.length; y++) for (var x = 0; x < map[y].length; x++) {
      var ch = map[y][x];
      if (ch !== '.' && PAL[ch]) R(ctx, ox + x * s, oy + y * s, s, s, PAL[ch]);
    }
  }
  function polyFill(ctx, pts, col, mask) {
    var minY = Infinity, maxY = -Infinity;
    pts.forEach(function (p) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); });
    for (var y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      var yc = y + 0.5, xs = [];
      for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        var a = pts[i], b = pts[j];
        if ((a[1] > yc) !== (b[1] > yc)) xs.push(a[0] + (yc - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort(function (p, q) { return p - q; });
      for (var k = 0; k + 1 < xs.length; k += 2) {
        for (var x = Math.ceil(xs[k] - 0.5); x < Math.ceil(xs[k + 1] - 0.5); x++) {
          Px(ctx, x, y, col);
          if (mask) mask[y * AW + x] = 1;
        }
      }
    }
  }
  var DIGITS = {
    0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
    3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
    6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
    9: ['111', '101', '111', '001', '111']
  };
  function digits(ctx, str, x, y, s, col) {
    String(str).split('').forEach(function (ch, i) {
      var g = DIGITS[ch];
      if (!g) return;
      for (var r = 0; r < 5; r++) for (var c = 0; c < 3; c++) if (g[r][c] === '1') R(ctx, x + (i * 4 + c) * s, y + r * s, s, s, col);
    });
  }

  var MOTIFS = {
    /* latte — a cup from above, the café's day turns into candle-lit night */
    latte: {
      init: function () {
        var P = {
          day: { table: '#CC9966', grain: '#996633', shadow: '#996633', white: '#FFFFFF', light: '#DFDFDF', mid: '#C0C0C0', dark: '#808080', coffee: '#663300', crema: '#996633', foam: '#FFFFCC', foamEdge: '#CC9966' },
          night: { table: '#333366', grain: '#222255', shadow: '#000033', white: '#CCCCFF', light: '#9999CC', mid: '#8080B0', dark: '#666699', coffee: '#331900', crema: '#663300', foam: '#FFFF99', foamEdge: '#996633' }
        };
        function scene(night) {
          var o = off(), c = o.x, p = night ? P.night : P.day;
          R(c, 0, 0, AW, AH, p.table);
          for (var y = 0; y < AH; y++) for (var x = 0; x < AW; x++) {
            var g = Math.sin((x + y * 0.3) * 0.09 + y * 0.6);
            if ((y % 6 === 2 && g > -0.2) || (y % 6 === 3 && g > 0.7)) Px(c, x, y, p.grain);
            if (night && (x + y) % 2 === 0 && y % 2 === 0) Px(c, x, y, '#000033');
          }
          if (night) disc(c, 110, 14, 18, '#FF9900', function (x, y, dx, dy) { var d = Math.sqrt(dx * dx + dy * dy); return bayer(x, y) > d / 18 + 0.35; });
          disc(c, 68, 44, 33, p.shadow, function (x, y) { return (x + y) % 2 === 0; });
          disc(c, 64, 40, 33, p.white);
          disc(c, 64, 40, 33, p.mid, function (x, y, dx, dy) { return dx * dx + dy * dy > 31 * 31 && dy + dx > 8; });
          disc(c, 64, 40, 29, p.light, function (x, y, dx, dy) { return dx * dx + dy * dy > 27 * 27; });
          R(c, 90, 35, 11, 10, p.dark); R(c, 91, 36, 9, 8, p.white); R(c, 94, 38, 4, 4, p.light);
          disc(c, 64, 40, 24.5, p.dark);
          disc(c, 64, 40, 23.5, p.white);
          disc(c, 64, 40, 21.5, p.coffee);
          disc(c, 64, 40, 21.5, p.crema, function (x, y, dx, dy) { var d = Math.sqrt(dx * dx + dy * dy); return d > 15 && bayer(x, y) < (d - 15) / 7; });
          // milk ripple: a faint ring of foam where the pour spread out
          disc(c, 64, 40, 19.5, p.foam, function (x, y, dx, dy) { var d = Math.sqrt(dx * dx + dy * dy); return d > 17.6 && bayer(x, y) < 0.28; });
          // latte-art heart: two round lobes with a V notch, tapering to a point, with the pour's tail
          var hm = new Uint8Array(AW * AH), xx, yy;
          for (yy = 26; yy < 58; yy++) for (xx = 46; xx < 82; xx++) {
            var px = xx + 0.5, py = yy + 0.5;
            var lobe = inDisc(xx, yy, 58.6, 36.4, 6.6) || inDisc(xx, yy, 69.4, 36.4, 6.6);
            var body = py >= 36.4 && py <= 52 && Math.abs(px - 64) <= 11.9 * (52 - py) / 15.6;
            var notch = py < 36.4 && Math.abs(px - 64) < (36.4 - py) * 0.55;
            if ((lobe || body) && !notch) hm[yy * AW + xx] = 1;
          }
          hm[52 * AW + 63] = hm[52 * AW + 64] = 1; // pointed tip
          for (yy = 26; yy < 58; yy++) for (xx = 46; xx < 82; xx++) {
            if (!hm[yy * AW + xx]) continue;
            var edge = !hm[yy * AW + xx - 1] || !hm[yy * AW + xx + 1] || !hm[(yy - 1) * AW + xx] || !hm[(yy + 1) * AW + xx];
            Px(c, xx, yy, edge ? p.foamEdge : p.foam);
          }
          Px(c, 58, 33, p.white); Px(c, 57, 34, p.white); Px(c, 69, 33, p.white); // foam highlights
          Px(c, 64, 54, p.foamEdge); Px(c, 64, 55, p.foam); Px(c, 64, 56, p.foamEdge); // the pour's tail
          if (!night) {
            disc(c, 14, 13, 5.5, '#FFFF00');
            disc(c, 14, 13, 5.5, '#FF9900', function (x, y, dx, dy) { return dx * dx + dy * dy > 20; });
            [[14, 4], [14, 22], [5, 13], [23, 13], [8, 7], [20, 7], [8, 19], [20, 19]].forEach(function (q) { R(c, q[0], q[1], 1, 2, '#FFFF00'); });
          } else {
            disc(c, 14, 13, 6, '#FFFFCC', function (x, y) { return !inDisc(x, y, 17, 11, 5.5); });
            [[26, 6], [30, 16], [6, 26], [22, 24]].forEach(function (q) { Px(c, q[0], q[1], '#FFFFFF'); });
            disc(c, 110, 14, 4.5, '#FFFFCC');
            disc(c, 110, 14, 4.5, '#CCCC99', function (x, y, dx, dy) { return dx + dy > 2; });
          }
          return c.getImageData(0, 0, AW, AH);
        }
        var day = scene(false), night = scene(true), frames = [];
        [0, 0.34, 0.67, 1].forEach(function (lv) {
          var o = off(), img = o.x.createImageData(AW, AH);
          for (var i = 0; i < AW * AH; i++) {
            var x = i % AW, y = (i / AW) | 0, src = bayer(x, y) < lv ? night : day;
            for (var k = 0; k < 4; k++) img.data[i * 4 + k] = src.data[i * 4 + k];
          }
          o.x.putImageData(img, 0, 0);
          frames.push(o.c);
        });
        return { frames: frames };
      },
      frame: function (ctx, st, f) {
        var cyc = 40, ph = f % (cyc * 2), t = ph % cyc, night = ph >= cyc, lv;
        if (t < 3) lv = night ? t + 1 : 2 - t; else lv = night ? 3 : 0;
        ctx.drawImage(st.frames[Math.max(0, Math.min(3, lv))], 0, 0);
        var ang = f * 0.32;
        for (var i = 0; i < 6; i++) {
          var a = ang + i * Math.PI / 3, rr = 18.5 + (i % 2);
          Px(ctx, 64 + Math.cos(a) * rr, 40 + Math.sin(a) * rr, night ? '#CC9966' : '#FFFFCC');
        }
        if (night) { Px(ctx, 110, 13, f % 2 ? '#FFFF00' : '#FF6600'); Px(ctx, 110, 14, '#FF6600'); Px(ctx, 111, 13, f % 3 ? '#FF6600' : '#FFFF00'); }
      }
    },

    /* pulse — a heart monitor with personal heart-rate zones */
    pulse: {
      init: function () {
        var o = off(), c = o.x;
        R(c, 0, 0, AW, AH, '#000000');
        for (var y = 0; y < AH; y++) for (var x = 0; x < 98; x++) if ((x % 8 === 0 && y % 2 === 0) || (y % 8 === 0 && x % 2 === 0)) Px(c, x, y, '#003300');
        R(c, 99, 0, 1, AH, '#006600');
        var zc = ['#0000FF', '#00CC00', '#FFFF00', '#FF9900', '#FF0000'];
        zc.forEach(function (col, i) { R(c, 103 + i * 5, 62, 4, 10, col); });
        var W = [];
        for (var i = 0; i < 40; i++) W[i] = 0;
        [[5, -2], [6, -3], [7, -3], [8, -2], [9, -1], [13, 2], [14, -16], [15, -27], [16, 9], [17, 4], [24, -2], [25, -4], [26, -5], [27, -5], [28, -4], [29, -2], [30, -1]].forEach(function (q) { W[q[0]] = q[1]; });
        return { bg: o.c, W: W, bpm: 72, zone: 2, beat: 0 };
      },
      frame: function (ctx, st, f) {
        ctx.drawImage(st.bg, 0, 0);
        var head = (f * 3) % 96, base = 44;
        var y = function (x) { return base + st.W[(x + 7) % 40]; };
        for (var x = 1; x < 97; x++) {
          if (x > head && x <= head + 6) continue;
          var y0 = y(x - 1), y1 = y(x);
          R(ctx, x, Math.min(y0, y1), 1, Math.abs(y1 - y0) + 1, x <= head ? '#00FF00' : '#007700');
        }
        R(ctx, head, y(head) - 1, 2, 2, '#CCFFCC');
        var ph = (head + 7) % 40;
        if (ph >= 14 && ph <= 17) { st.beat = 4; if (ph === 14) { st.bpm = 70 + ((f / 13) | 0) % 6; st.zone = [2, 3, 3, 4, 3, 2][((f / 20) | 0) % 6]; } }
        var on = st.beat > 0;
        st.beat--;
        var heart = ['.kk.kk.', 'krrkrrk', 'krrrrrk', '.krrrk.', '..krk..', '...k...'];
        heart.forEach(function (row, j) { for (var i = 0; i < 7; i++) if (row[i] !== '.') R(ctx, 105 + i * 2, 8 + j * 2, 2, 2, row[i] === 'k' ? (on ? '#FF6666' : '#330000') : (on ? '#FF0000' : '#660000')); });
        digits(ctx, st.bpm, 104, 28, 3, '#00FF00');
        var zx = 103 + st.zone * 5;
        R(ctx, zx + 1, 56, 2, 1, '#FFFFFF'); R(ctx, zx, 57, 4, 1, '#FFFFFF'); R(ctx, zx + 1, 58, 2, 1, '#FFFFFF');
        R(ctx, zx - 1, 61, 6, 1, '#FFFFFF'); R(ctx, zx - 1, 72, 6, 1, '#FFFFFF');
      }
    },

    /* route — a city map, a courier and a live route */
    route: {
      init: function () {
        var o = off(), c = o.x, i;
        R(c, 0, 0, AW, AH, '#CCCC99');
        for (var y = 0; y < AH; y++) for (var x = 0; x < AW; x++) {
          if ((x * 7 + y * 13) % 29 === 0) Px(c, x, y, '#999966');
          var rv = y - (58 - x * 0.2);
          if (rv > 0 && rv < 9) Px(c, x, y, (rv < 1.5 || rv > 7.5) && bayer(x, y) > 0.5 ? '#0066CC' : '#3399FF');
        }
        disc(c, 42, 20, 7, function (x, y) { return bayer(x, y) < 0.5 ? '#339933' : '#66CC66'; });
        [[40, 17], [45, 22], [38, 22]].forEach(function (q) { R(c, q[0], q[1], 2, 2, '#006600'); });
        R(c, 88, 38, 18, 10, '#999966'); R(c, 60, 58, 12, 8, '#999966');
        var xs = [9, 31, 53, 75, 97, 119], ys = [11, 31, 51, 71];
        xs.forEach(function (x) { R(c, x - 1, 0, 3, AH, '#FFFFFF'); });
        ys.forEach(function (y) { R(c, 0, y - 1, AW, 3, '#FFFFFF'); });
        for (i = 0; i < AW; i++) { var ry = Math.round(58 - i * 0.2); if (xs.indexOf(i) > -1) R(c, i - 1, ry, 3, 9, '#C0C0C0'); }
        var W = [[9, 71], [9, 51], [31, 51], [31, 31], [75, 31], [75, 11], [119, 11]];
        var path = [];
        for (i = 0; i + 1 < W.length; i++) {
          var a = W[i], b = W[i + 1], dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]), px = a[0], py = a[1];
          while (px !== b[0] || py !== b[1]) { path.push([px, py]); px += dx; py += dy; }
        }
        path.push(W[W.length - 1]);
        return { bg: o.c, path: path };
      },
      frame: function (ctx, st, f) {
        ctx.drawImage(st.bg, 0, 0);
        var P = st.path, n = P.length, pos = Math.min(n - 1, (f * 2) % (n + 24));
        for (var i = 0; i < n; i++) {
          if (i < pos) R(ctx, P[i][0] - 1, P[i][1] - 1, 2, 2, '#000080');
          else if (((i >> 2) + (f >> 1)) % 2 === 0) R(ctx, P[i][0] - 1, P[i][1] - 1, 2, 2, '#FF00FF');
        }
        var s = P[0], e = P[n - 1];
        R(ctx, s[0] - 3, s[1] - 3, 6, 6, '#000000'); R(ctx, s[0] - 2, s[1] - 2, 4, 4, '#00CC00');
        var pin = f % 6 < 3 ? '#FF0000' : '#990000';
        R(ctx, e[0] - 3, e[1] - 9, 7, 6, '#000000'); R(ctx, e[0] - 2, e[1] - 8, 5, 4, pin); R(ctx, e[0] - 1, e[1] - 3, 3, 2, '#000000'); Px(ctx, e[0], e[1] - 1, '#000000');
        [[53, 71], [97, 51], [119, 31], [31, 11]].forEach(function (q, k) {
          if ((f + k * 3) % 12 < 8) { R(ctx, q[0] - 2, q[1] - 2, 4, 4, '#000000'); R(ctx, q[0] - 1, q[1] - 1, 2, 2, '#FFFFFF'); }
        });
        if (f % 10 < 5) { R(ctx, 94, 48, 7, 7, '#FF0000'); R(ctx, 97, 49, 1, 3, '#FFFFFF'); Px(ctx, 97, 53, '#FFFFFF'); }
        var c = P[pos];
        R(ctx, c[0] - 3, c[1] - 3, 7, 7, '#000000'); R(ctx, c[0] - 2, c[1] - 2, 5, 5, '#FFFF00'); Px(ctx, c[0], c[1], '#FF8000');
      }
    },

    /* sneaker — a side profile that cycles through configurator colourways */
    sneaker: {
      init: function () {
        var WAYS = [
          { main: '#FF0000', sec: '#FFFFFF', acc: '#000080', lace: '#000080' },
          { main: '#000080', sec: '#C0C0C0', acc: '#FFFF00', lace: '#FFFF00' },
          { main: '#FFFFFF', sec: '#C0C0C0', acc: '#FF00FF', lace: '#FF00FF' },
          { main: '#008000', sec: '#FFFFCC', acc: '#000000', lace: '#008000' },
          { main: '#008080', sec: '#FFFFCC', acc: '#FF8000', lace: '#FF8000' }
        ];
        var frames = WAYS.map(function (cw) {
          var o = off(), c = o.x, mask = new Uint8Array(AW * AH), x, y;
          for (y = 0; y < AH; y++) for (x = 0; x < AW; x++) Px(c, x, y, y < 56 ? (bayer(x, y) < y / 90 ? '#669999' : '#99CCCC') : (bayer(x, y) < 0.5 ? '#669999' : '#336666'));
          for (y = 62; y < 74; y++) for (x = 10; x < 124; x++) {
            var ex = (x - 66) / 56, ey = (y - 67) / 5;
            if (ex * ex + ey * ey < 1 && (x + y) % 2 === 0) Px(c, x, y, '#003333');
          }
          // sole: dark outsole + white midsole with toe spring (the front curls up) and a visible air window
          polyFill(c, [[10, 60], [110, 60], [118, 59], [123, 56], [125, 59], [122, 63], [113, 66], [18, 67], [10, 65]], '#333333', mask);
          polyFill(c, [[10, 51], [104, 51], [114, 50], [121, 51], [124, 55], [118, 59], [110, 60], [10, 60]], '#FFFFFF', mask);
          R(c, 12, 56, 100, 1, '#C0C0C0');
          R(c, 18, 53, 16, 5, '#3399FF'); R(c, 18, 53, 16, 1, '#99CCFF');
          // upper: low padded collar, a rounded tongue, the lace line running down to a toe box that curves
          // down to the sole instead of a flat slab
          polyFill(c, [[11, 51], [10, 43], [11, 35], [13, 30], [17, 27], [22, 28], [28, 30], [34, 30], [39, 28], [43, 24], [47, 21], [52, 19.5], [56, 21], [58, 24.5], [70, 30.5], [84, 37], [95, 40], [105, 42], [112, 44.5], [117, 47.5], [120, 51], [104, 52], [11, 52]], cw.main, mask);
          polyFill(c, [[11, 52], [10, 43], [11, 35], [13, 30], [17, 27], [21, 28], [24, 36], [27, 52]], cw.sec, mask); // heel counter
          polyFill(c, [[97, 40.5], [105, 42], [112, 44.5], [117, 47.5], [120, 51], [104, 52], [95, 52], [93, 46]], cw.sec, mask); // toe cap
          polyFill(c, [[31, 49], [50, 41], [48, 45.5], [72, 37], [66, 43.5], [90, 40], [60, 51], [61, 47.5], [36, 52]], cw.acc, mask); // bolt
          polyFill(c, [[12, 34], [7, 30], [9, 25], [15, 29]], cw.acc, mask); // pull tab
          polyFill(c, [[17, 28], [22, 29], [28, 31], [34, 31], [39, 29], [42, 26], [41, 30], [34, 33], [27, 33], [21, 31]], '#333333', mask); // collar lining
          polyFill(c, [[53, 23], [57.5, 21.5], [87, 35.5], [85, 41.5], [54, 29]], cw.sec, mask); // eyestay
          for (x = 0; x < AW; x++) for (y = 0; y < AH; y++) {
            if (!mask[y * AW + x]) continue;
            var edge = !mask[y * AW + x - 1] || !mask[y * AW + x + 1] || !mask[(y - 1) * AW + x] || !mask[(y + 1) * AW + x];
            if (edge) Px(c, x, y, '#000000');
          }
          R(c, 48, 21, 5, 1, cw.sec === '#FFFFFF' ? '#DFDFDF' : '#FFFFFF'); // tongue highlight
          // laces: criss-cross strokes over the eyestay, with the eyelets punched below them
          for (var i = 0; i < 6; i++) {
            var lx = 56 + i * 5, ly = Math.round(24 + i * 2.4);
            R(c, lx, ly, 3, 2, cw.lace); R(c, lx + 2, ly + 1, 3, 2, cw.lace);
            Px(c, lx, ly + 4, '#000000'); Px(c, lx + 1, ly + 4, '#000000'); // eyelet
          }
          for (x = 30; x < 112; x += 3) Px(c, x, Math.round(49.5 - Math.max(0, (x - 70) * 0.05)), cw.sec === '#FFFFFF' ? '#C0C0C0' : cw.sec); // stitching
          for (x = 18; x < 112; x += 4) R(c, x, 65, 2, 1, '#000000');
          WAYS.forEach(function (w2, k) { R(c, 5 + k * 10, 72, 8, 6, '#000000'); R(c, 6 + k * 10, 73, 6, 4, w2.main); });
          return o.c;
        });
        return { frames: frames };
      },
      frame: function (ctx, st, f) {
        var idx = Math.floor(f / 14) % 5, sx = 5 + idx * 10;
        ctx.drawImage(st.frames[idx], 0, 0);
        var col = f % 4 < 2 ? '#FFFFFF' : '#FFFF00';
        R(ctx, sx - 1, 71, 10, 1, col); R(ctx, sx - 1, 78, 10, 1, col); R(ctx, sx - 1, 71, 1, 8, col); R(ctx, sx + 8, 71, 1, 8, col);
        var cur = ['k....', 'kk...', 'kwk..', 'kwwk.', 'kwwwk', 'kwkk.', 'k.kk.'], cx = sx + 5, cy = 70 - (f % 14 < 3 ? 3 - (f % 14) : 0);
        cur.forEach(function (row, j) { for (var i = 0; i < row.length; i++) if (row[i] !== '.') Px(ctx, cx + i, cy - 7 + j, row[i] === 'k' ? '#000000' : '#FFFFFF'); });
      }
    },

    /* orbit — a planet, an orbit and a small ship */
    orbit: {
      init: function () {
        var o = off(), c = o.x, seed = 7, x, y;
        var rnd = function () { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
        R(c, 0, 0, AW, AH, '#000000');
        for (y = 0; y < AH; y++) for (x = 0; x < AW; x++) {
          var neb = Math.sin(x * 0.07 + y * 0.03) + Math.cos(y * 0.11 - x * 0.02);
          if (neb > 1.25 && bayer(x, y) < (neb - 1.25) * 1.2) Px(c, x, y, '#330033');
        }
        var stars = [];
        for (var i = 0; i < 70; i++) { var s = [(rnd() * AW) | 0, (rnd() * AH) | 0, rnd()]; stars.push(s); Px(c, s[0], s[1], s[2] > 0.8 ? '#FFFFFF' : s[2] > 0.4 ? '#C0C0C0' : '#808080'); }
        disc(c, 112, 14, 7, function (px, py, dx, dy) { return dx + dy > 3 && bayer(px, py) < 0.6 ? '#808080' : '#C0C0C0'; });
        Px(c, 110, 12, '#808080'); Px(c, 114, 16, '#808080');
        var pl = off(), pc = pl.x;
        disc(pc, 56, 44, 19.5, function (px, py, dx, dy) {
          var nx = dx / 19.5, ny = dy / 19.5, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          var l = -0.55 * nx - 0.5 * ny + 0.67 * nz, b = bayer(px, py) * 0.28;
          if (l + b > 0.95) return '#FFCC99';
          if (l + b > 0.62) return '#FF9966';
          if (l + b > 0.28) return '#CC6633';
          if (l + b > 0.05) return '#993300';
          return '#330000';
        });
        [[50, 38, 3], [62, 50, 2.5], [60, 34, 1.6], [47, 51, 1.8]].forEach(function (q) { disc(pc, q[0], q[1], q[2], '#993300', function (px, py, dx, dy) { return dx + dy < 1.5; }); });
        var orb = [];
        for (i = 0; i < 180; i++) {
          var th = i / 180 * Math.PI * 2, ox = Math.cos(th) * 50, oy = Math.sin(th) * 12, tl = -0.2;
          orb.push([56 + ox * Math.cos(tl) - oy * Math.sin(tl), 44 + ox * Math.sin(tl) + oy * Math.cos(tl), Math.sin(th) > 0]);
        }
        return { bg: o.c, planet: pl.c, orb: orb, stars: stars };
      },
      frame: function (ctx, st, f) {
        ctx.drawImage(st.bg, 0, 0);
        for (var k = 0; k < 5; k++) { var s = st.stars[(f * 3 + k * 13) % st.stars.length]; Px(ctx, s[0], s[1], '#FFFF00'); }
        var i, p;
        for (i = 0; i < st.orb.length; i += 3) { p = st.orb[i]; if (!p[2]) Px(ctx, p[0], p[1], '#606060'); }
        var si = Math.floor(f * 2.2) % st.orb.length, sp = st.orb[si];
        var hidden = !sp[2] && inDisc(sp[0] | 0, sp[1] | 0, 56, 44, 20.5);
        var ship = function () {
          var nx = st.orb[(si + 2) % st.orb.length], dir = nx[0] >= sp[0] ? 1 : -1, x = sp[0] | 0, y = sp[1] | 0;
          R(ctx, x - 2, y - 1, 5, 3, '#000000');
          R(ctx, x - 1, y, 3, 1, '#FFFFFF'); Px(ctx, x + 2 * dir, y, '#FF0000'); Px(ctx, x, y - 1, '#C0C0C0');
          Px(ctx, x - 2 * dir, y, f % 2 ? '#FFFF00' : '#FF8000'); if (f % 2) Px(ctx, x - 3 * dir, y, '#FF8000');
        };
        if (!sp[2] && !hidden) ship();
        ctx.drawImage(st.planet, 0, 0);
        for (i = 0; i < st.orb.length; i += 3) { p = st.orb[i]; if (p[2]) Px(ctx, p[0], p[1], '#C0C0C0'); }
        if (sp[2]) ship();
      }
    },

    /* ring — how much is left for today (and a spinning coin) */
    ring: {
      init: function () {
        var o = off(), c = o.x, pts = [], x, y;
        for (y = 0; y < AH; y++) for (x = 0; x < AW; x++) Px(c, x, y, (x + y) % 2 ? '#000066' : '#000080');
        for (var i = 0; i < 24; i++) { var a = i / 24 * Math.PI * 2; R(c, Math.round(64 + Math.sin(a) * 34), Math.round(40 - Math.cos(a) * 34), i % 6 ? 1 : 2, i % 6 ? 1 : 2, i % 6 ? '#808080' : '#FFFFFF'); }
        for (y = 8; y < 73; y++) for (x = 32; x < 97; x++) {
          var dx = x + 0.5 - 64, dy = y + 0.5 - 40, d = Math.sqrt(dx * dx + dy * dy);
          if (d >= 20.5 && d <= 30.5) pts.push([x, y, ((Math.atan2(dx, -dy) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2), d > 29.4 || d < 21.6]);
        }
        return { bg: o.c, pts: pts };
      },
      frame: function (ctx, st, f) {
        ctx.drawImage(st.bg, 0, 0);
        var T = 96, t = f % T, p = t < 80 ? 1 - 0.78 * (t / 80) : 0.22 + 0.78 * ((t - 80) / 16);
        var col = p > 0.5 ? ['#00FF00', '#009900'] : p > 0.28 ? ['#FFFF00', '#999900'] : ['#FF3300', '#990000'];
        st.pts.forEach(function (q) { Px(ctx, q[0], q[1], q[2] <= p ? (q[3] ? col[1] : col[0]) : (q[3] ? '#1a1a4d' : '#333366')); });
        var W = [15, 13, 9, 4, 1, 4, 9, 13][f % 8];
        for (var y = -9; y <= 8; y++) {
          var hw = W / 2 * Math.sqrt(Math.max(0, 1 - Math.pow((y + 0.5) / 9, 2)));
          if (hw < 0.5) { Px(ctx, 64, 40 + y, '#CC9900'); continue; }
          for (var x = Math.round(64 - hw); x < Math.round(64 + hw); x++) {
            var edge = x === Math.round(64 - hw) || x === Math.round(64 + hw) - 1;
            Px(ctx, x, 40 + y, edge ? '#996600' : (x < 64 - hw / 3 ? '#FFFF99' : '#FFCC00'));
          }
        }
        if (W >= 9) { R(ctx, 63, 37, 2, 1, '#CC9900'); R(ctx, 62, 38, 1, 4, '#CC9900'); R(ctx, 65, 38, 1, 4, '#CC9900'); R(ctx, 63, 42, 2, 1, '#CC9900'); }
        if (W === 15) { Px(ctx, 70, 32, '#FFFFFF'); Px(ctx, 69, 31, '#FFFFFF'); Px(ctx, 71, 31, '#FFFFFF'); Px(ctx, 70, 30, '#FFFFFF'); }
      }
    }
  };

  // Canvases are created now, but each bitmap set is built lazily the first time its case comes within
  // ~400 px of the viewport (then a first frame is painted at once, so nothing ever scrolls in blank).
  var arts = [];
  $$('.case').forEach(function (li) {
    var m = MOTIFS[li.getAttribute('data-motif')], box = $('.case__art', li);
    if (!m || !box) return;
    var cv = document.createElement('canvas');
    cv.width = AW; cv.height = AH;
    box.appendChild(cv);
    arts.push({ el: cv, ctx: cv.getContext('2d'), m: m, st: null, s: null, f: 16, vis: false, li: li });
  });

  /* setup-wizard bitmap */
  (function () {
    var cv = $('.wiz__canvas');
    if (!cv) return;
    var W = cv.width, H = cv.height;
    var stars = [[8, 10], [50, 6], [30, 22], [56, 30], [12, 40], [44, 46]];
    arts.push({
      el: cv, ctx: cv.getContext('2d'), f: 0, vis: false, st: null, s: null,
      m: {
        init: function () {
          var s = new Surf(W, H), x, y;
          for (y = 0; y < H; y++) for (x = 0; x < W; x++) Px(s, x, y, bayer(x, y) < y / H ? '#008080' : '#000080');
          stars.forEach(function (q) { Px(s, q[0], q[1], '#FFFFFF'); });
          drawMap(s, ICON.logo, 16, 8, 2);
          drawMap(s, ICON.computer, 8, 62, 3);
          drawMap(s, ICON.floppy, 32, 108, 2);
          drawMap(s, ICON.cd, 2, 116, 2);
          return { base: new Uint32Array(s.u32) };
        },
        frame: function (c, st, f) {
          c.u32.set(st.base);
          stars.forEach(function (q, i) {
            if ((f + i * 2) % 6 < 2) { Px(c, q[0] - 1, q[1], '#FFFF00'); Px(c, q[0] + 1, q[1], '#FFFF00'); Px(c, q[0], q[1] - 1, '#FFFF00'); Px(c, q[0], q[1] + 1, '#FFFF00'); }
          });
          var scr = f % 8;
          R(c, 8 + 4 * 3, 62 + 4 * 3 + scr * 3, 8 * 3, 3, '#00FFFF');
        }
      }
    });
  })();

  function artDraw(a) {
    if (!a.st) { a.st = a.m.init ? a.m.init() : {}; a.s = new Surf(a.el.width, a.el.height); }
    a.m.frame(a.s, a.st, a.f);
    a.ctx.putImageData(a.s.img, 0, 0);
  }
  var artTimer = 0, artLast = 0;
  function artsShouldRun() { return !reduced() && !document.hidden && (!isPreview || previewActive); }
  function artLoop(now) {
    artTimer = 0;
    if (!artsShouldRun()) return;
    if (now - artLast >= 120) {
      artLast = now;
      arts.forEach(function (a) { if (a.vis) { a.f++; artDraw(a); } });
    }
    artTimer = requestAnimationFrame(artLoop);
  }
  function artKick() { if (!artTimer && artsShouldRun() && arts.some(function (a) { return a.vis; })) artTimer = requestAnimationFrame(artLoop); }
  if ('IntersectionObserver' in window) {
    var aio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        arts.forEach(function (a) {
          if (a.el !== en.target) return;
          a.vis = en.isIntersecting;
          if (a.vis && !a.st) artDraw(a); // first approach: build + paint the still frame
        });
      });
      artKick();
    }, { rootMargin: '400px 0px' });
    arts.forEach(function (a) { aio.observe(a.el); });
  } else arts.forEach(function (a) { a.vis = true; artDraw(a); });
  document.addEventListener('visibilitychange', artKick);

  /* =====================================================================
   * 10. SETUP WIZARD (process)
   * ===================================================================== */
  var steps = $$('.step');
  var wizPos = 0, wizAuto = 0, wizUser = false;
  var wizFill = $('[data-wiz-fill]'), wizBar = $('[data-wiz-bar]'), wizLabel = $('[data-wiz-label]');
  var wizNext = $('[data-wiz="next"]'), wizBack = $('[data-wiz="back"]'), wizNextLabel = $('[data-wiz-next]');
  function renderWiz() {
    var n = steps.length || 4, pct = Math.round(wizPos / n * 100);
    steps.forEach(function (s, i) {
      s.classList.toggle('is-done', i < wizPos);
      s.classList.toggle('is-current', i === wizPos);
      if (i === wizPos) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
    });
    if (wizFill) wizFill.style.width = pct + '%';
    if (wizBar) wizBar.setAttribute('aria-valuenow', pct);
    if (wizLabel) wizLabel.textContent = wizPos >= n ? tx('wizard.done') : tx('wizard.installing', { p: pct });
    if (wizNextLabel) {
      var key = X + 'wizard.' + (wizPos >= n ? 'finish' : 'next');
      wizNextLabel.setAttribute('data-i18n', key);
      wizNextLabel.textContent = D.t(key);
    }
    if (wizBack) wizBack.disabled = wizPos === 0;
  }
  function wizStop() { clearInterval(wizAuto); wizAuto = 0; }
  if (isPreview || reduced()) wizPos = steps.length;
  renderWiz();
  if (wizNext) wizNext.addEventListener('click', function () {
    wizUser = true; wizStop();
    if (wizPos >= steps.length) {
      var c = document.getElementById('contact');
      if (c) { c.scrollIntoView({ block: 'start' }); var inp = $('#f-name'); if (inp) inp.focus({ preventScroll: true }); }
      return;
    }
    wizPos++; renderWiz();
  });
  if (wizBack) wizBack.addEventListener('click', function () { wizUser = true; wizStop(); wizPos = Math.max(0, wizPos - 1); renderWiz(); });
  var wizSec = document.getElementById('process');
  if (wizSec && 'IntersectionObserver' in window && !isPreview && !reduced()) {
    var wio = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting || wizUser) return;
      wio.disconnect();
      wizAuto = setInterval(function () {
        if (wizUser || wizPos >= steps.length) { wizStop(); return; }
        wizPos++; renderWiz();
      }, 850);
    }, { threshold: 0.35 });
    wio.observe(wizSec);
  }

  /* =====================================================================
   * 11. FAQ — Explorer tree
   * ===================================================================== */
  var faqItems = $$('.faq__item'), faqStatus = $('[data-faq-status]');
  function renderFaq(noSize) {
    var idx = -1;
    faqItems.forEach(function (d, i) {
      var ic = $('.tree-ico', d);
      if (ic) ic.innerHTML = iconSVG(d.open ? 'folderopen' : 'folder');
      if (d.open) idx = i;
    });
    if (faqStatus) faqStatus.textContent = idx > -1 ? tx('explorer.selected', { n: idx + 1 }) : '';
    if (noSize !== true) sizeFaq();
  }
  // two-pane layout: the answer pane is absolutely positioned beside the tree, so it can't stretch the box
  // itself — grow the box to the open answer's natural height when it is taller than the tree
  var faqBox = $('.faq');
  function sizeFaq() {
    if (!faqBox) return;
    var open = faqItems.filter(function (d) { return d.open; })[0];
    var pane = open && $('.faq__pane', open);
    faqBox.style.minHeight = '';
    if (!pane || getComputedStyle(pane).position !== 'absolute') return;
    pane.style.minHeight = '0';
    var need = pane.offsetHeight;
    pane.style.minHeight = '';
    if (need > faqBox.offsetHeight) faqBox.style.minHeight = need + 'px';
  }
  faqItems.forEach(function (d) { d.addEventListener('toggle', renderFaq); });
  if (faqItems[0]) faqItems[0].open = true;
  renderFaq(true); // measured on the first toggle event / fonts.ready — not mid-init
  var faqTimer = 0;
  window.addEventListener('resize', function () { clearTimeout(faqTimer); faqTimer = setTimeout(sizeFaq, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(sizeFaq);

  /* =====================================================================
   * 12. GUESTBOOK FORM states (core owns validation & timing)
   * ===================================================================== */
  var form = $('form[data-dz-form]');
  if (form) {
    form.addEventListener('diapason:formsent', function () {
      var s = $('[data-form-success]', form);
      if (s) { var r = s.getBoundingClientRect(); if (r.bottom > window.innerHeight || r.top < 0) $('.success__win', s).scrollIntoView({ block: 'center' }); }
    });
    form.addEventListener('diapason:forminvalid', function () {
      if (reduced()) return;
      form.classList.remove('is-shake'); void form.offsetWidth; form.classList.add('is-shake');
    });
  }

  /* =====================================================================
   * 13. WEBRING — "random site"
   * ===================================================================== */
  var rnd = $('[data-ring-random]');
  if (rnd) rnd.addEventListener('click', function () {
    var ids = D.styles.map(function (s) { return s.id; }).filter(function (id) { return id !== D.styleId; });
    var pick = ids[Math.floor(Math.random() * ids.length)];
    rnd.setAttribute('data-dz-go', pick);
    var u = D.urlFor(pick);
    if (u) rnd.setAttribute('href', u);
  });

  /* =====================================================================
   * 14. "MIDI" PLAYER — an original chiptune on WebAudio square / triangle / noise
   * ===================================================================== */
  var Midi = (function () {
    var ac = null, bus = null, comp = null, analyser = null, noise = null, pulse25 = null, pulse12 = null, echo = null;
    var timer = 0, playing = false, step = 0, nextT = 0, startT = 0, vol = 0.7;
    var SPB = 60 / 136 / 4, LOOP = 128;
    var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
    var BASS = [45, 41, 48, 43, 45, 41, 43, 40];
    var BP = [0, 12, 0, 12, 7, 12, 0, 12];
    var ARP = [[69, 72, 76], [65, 69, 72], [67, 72, 76], [67, 71, 74], [69, 72, 76], [65, 69, 72], [67, 71, 74], [64, 68, 71]];
    var MEL = [
      [[0, 76, 2], [2, 81, 2], [4, 83, 2], [6, 84, 4], [10, 83, 2], [12, 81, 2], [14, 76, 2]],
      [[0, 77, 2], [2, 81, 2], [4, 84, 2], [6, 81, 4], [10, 79, 2], [12, 77, 2], [14, 76, 2]],
      [[0, 76, 2], [2, 79, 2], [4, 84, 4], [8, 86, 2], [10, 88, 4], [14, 86, 2]],
      [[0, 86, 4], [4, 83, 2], [6, 79, 2], [8, 83, 2], [10, 86, 2], [12, 91, 4]],
      [[0, 88, 4], [4, 84, 2], [6, 81, 2], [8, 84, 2], [10, 88, 2], [12, 93, 4]],
      [[0, 93, 2], [2, 91, 2], [4, 89, 2], [6, 88, 2], [8, 89, 4], [12, 84, 4]],
      [[0, 86, 2], [2, 88, 2], [4, 89, 2], [6, 91, 2], [8, 89, 2], [10, 88, 2], [12, 86, 4]],
      [[0, 88, 2], [2, 80, 2], [4, 83, 2], [6, 88, 2], [8, 86, 2], [10, 83, 2], [12, 80, 4]]
    ];
    var LEAD = {};
    MEL.forEach(function (bar, b) { bar.forEach(function (n) { LEAD[b * 16 + n[0]] = [n[1], n[2]]; }); });

    function pulseWave(duty) {
      var N = 48, re = new Float32Array(N), im = new Float32Array(N);
      for (var k = 1; k < N; k++) re[k] = 2 * Math.sin(Math.PI * k * duty) / (Math.PI * k);
      return ac.createPeriodicWave(re, im);
    }
    function ensure() {
      if (ac) return true;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      comp = ac.createDynamicsCompressor();
      analyser = ac.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.55;
      comp.connect(analyser);
      analyser.connect(ac.destination);
      noise = ac.createBuffer(1, ac.sampleRate * 0.4, ac.sampleRate);
      var d = noise.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      pulse25 = pulseWave(0.25);
      pulse12 = pulseWave(0.125);
      return true;
    }
    function newBus() {
      bus = ac.createGain();
      bus.gain.value = vol * 0.9;
      bus.connect(comp);
      echo = ac.createDelay(1);
      echo.delayTime.value = SPB * 3;
      var fb = ac.createGain(); fb.gain.value = 0.28;
      var wet = ac.createGain(); wet.gain.value = 0.22;
      echo.connect(fb); fb.connect(echo); echo.connect(wet); wet.connect(bus);
    }
    function tone(wave, freq, t, dur, v, useEcho) {
      var o = ac.createOscillator(), g = ac.createGain();
      if (typeof wave === 'string') o.type = wave; else o.setPeriodicWave(wave);
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(v, t + 0.006);
      g.gain.setValueAtTime(v, t + dur * 0.65);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(bus);
      if (useEcho) g.connect(echo);
      o.start(t); o.stop(t + dur + 0.03);
    }
    function hit(t, hp, v, len) {
      var s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
      s.buffer = noise; f.type = 'highpass'; f.frequency.value = hp;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      s.connect(f); f.connect(g); g.connect(bus);
      s.start(t); s.stop(t + len + 0.02);
    }
    function kick(t) {
      var o = ac.createOscillator(), g = ac.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.75, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.2);
    }
    function playStep(s, t) {
      var bar = s >> 4, st = s & 15;
      if (st % 2 === 0) tone('triangle', mtof(BASS[bar] + BP[st / 2]), t, SPB * 1.7, 0.26);
      tone(pulse12, mtof(ARP[bar][s % 3]), t, SPB * 0.85, 0.028);
      var ld = LEAD[s];
      if (ld) tone(pulse25, mtof(ld[0]), t, SPB * ld[1] * 0.92, 0.075, true);
      if (st === 0 || st === 8 || (st === 11 && (bar === 3 || bar === 7))) kick(t);
      if (st === 4 || st === 12) { hit(t, 1200, 0.32, 0.13); tone('triangle', 190, t, 0.07, 0.12); }
      if (st % 2 === 0) hit(t, 7000, st === 14 ? 0.09 : 0.05, st === 14 ? 0.12 : 0.035);
    }
    function schedule() {
      while (nextT < ac.currentTime + 0.12) {
        playStep(step, nextT);
        nextT += SPB;
        step = (step + 1) % LOOP;
      }
    }
    function start() {
      if (playing) return;
      if (!ensure()) { setState('noAudio'); return; }
      if (ac.state === 'suspended') ac.resume();
      newBus();
      playing = true;
      step = 0;
      nextT = ac.currentTime + 0.06;
      startT = nextT;
      schedule();
      timer = setInterval(schedule, 25);
      setState('playing');
      viz();
    }
    function stop() {
      if (!playing) return;
      playing = false;
      clearInterval(timer);
      try { bus.gain.setTargetAtTime(0, ac.currentTime, 0.01); var old = bus; setTimeout(function () { try { old.disconnect(); } catch (e) {} }, 200); } catch (e) {}
      setState('stopped');
    }
    function setVol(v) { vol = v; if (bus && playing) bus.gain.setTargetAtTime(v * 0.9, ac.currentTime, 0.02); }

    var playBtn = $('[data-midi-play]'), stopBtn = $('[data-midi-stop]'), stateEl = $('[data-midi-state]');
    var timeEl = $('[data-midi-time]'), thumb = $('[data-midi-thumb]'), volEl = $('[data-midi-vol]');
    var vcv = $('.midi__viz'), vctx = vcv ? vcv.getContext('2d') : null, peaks = [];
    function setState(key) {
      if (stateEl) { stateEl.setAttribute('data-i18n', X + 'midi.' + key); stateEl.textContent = tx('midi.' + key); }
      $$('[data-midi-toggle]').concat(playBtn ? [playBtn] : []).forEach(function (b) { b.setAttribute('aria-pressed', playing ? 'true' : 'false'); });
      if (!playing) { drawIdle(); if (timeEl) timeEl.textContent = '00:00 / ' + fmtT(LOOP * SPB); if (thumb) thumb.style.setProperty('--p', 0); }
    }
    function fmtT(s) { s = Math.floor(s); return pad(Math.floor(s / 60)) + ':' + pad(s % 60); }
    function drawIdle() {
      if (!vctx) return;
      vctx.fillStyle = '#000'; vctx.fillRect(0, 0, 96, 16);
      for (var i = 0; i < 24; i++) { var h = 1 + (i * 7) % 3; vctx.fillStyle = '#005500'; vctx.fillRect(i * 4, 15 - h, 3, h); }
      vctx.fillStyle = '#00FF00';
      for (var r = 0; r < 9; r++) vctx.fillRect(45, 3 + r, 1 + Math.min(r, 8 - r), 1);
    }
    var vLast = 0;
    function viz(now) {
      if (!playing) return;
      requestAnimationFrame(viz);
      if (!now || now - vLast < 66) return;
      vLast = now;
      var el = (ac.currentTime - startT) % (LOOP * SPB);
      if (timeEl) timeEl.textContent = fmtT(Math.max(0, el)) + ' / ' + fmtT(LOOP * SPB);
      if (thumb) thumb.style.setProperty('--p', (Math.max(0, el) / (LOOP * SPB)).toFixed(3));
      if (!vctx) return;
      var bins = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(bins);
      vctx.fillStyle = '#000'; vctx.fillRect(0, 0, 96, 16);
      for (var i = 0; i < 24; i++) {
        var v = bins[Math.min(bins.length - 1, 1 + i)] / 255, hgt = Math.round(v * 15);
        peaks[i] = Math.max((peaks[i] || 0) - 0.5, hgt);
        for (var y = 0; y < hgt; y++) { vctx.fillStyle = y > 11 ? '#FF0000' : y > 8 ? '#FFFF00' : '#00FF00'; vctx.fillRect(i * 4, 15 - y, 3, 1); }
        vctx.fillStyle = '#FFFFFF'; vctx.fillRect(i * 4, 15 - Math.round(peaks[i]), 3, 1);
      }
    }
    // the first 2D-context use costs a few dozen ms (canvas setup): keep it off the startup path
    (window.requestIdleCallback || function (fn) { return setTimeout(fn, 200); })(function () { if (!playing) drawIdle(); }, { timeout: 1500 });
    if (timeEl) timeEl.textContent = '00:00 / ' + fmtT(LOOP * SPB);
    if (playBtn) playBtn.addEventListener('click', function () { if (playing) stop(); else start(); });
    if (stopBtn) stopBtn.addEventListener('click', stop);
    $$('[data-midi-toggle]').forEach(function (b) { b.addEventListener('click', function () { if (playing) stop(); else start(); }); });
    if (volEl) volEl.addEventListener('input', function () { setVol(volEl.value / 100); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    window.addEventListener('pagehide', stop);
    return { start: start, stop: stop, relabel: function () { setState(playing ? 'playing' : 'stopped'); } };
  })();

  /* =====================================================================
   * 15. SPARKLE CURSOR TRAIL (desktop, fine pointer only)
   * ===================================================================== */
  (function () {
    var cv = $('.sparkles');
    if (!cv || isPreview) return;
    var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), parts = [], raf = 0, lx = -99, ly = -99;
    var COLORS = ['#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF', '#00FF00'];
    var BIG = [[0, -2], [0, -1], [-2, 0], [-1, 0], [0, 0], [1, 0], [2, 0], [0, 1], [0, 2]];
    var MID = [[0, -1], [-1, 0], [0, 0], [1, 0], [0, 1]];
    var DOT = [[0, 0]];
    function size() { cv.width = Math.round(window.innerWidth * dpr); cv.height = Math.round(window.innerHeight * dpr); }
    size();
    window.addEventListener('resize', size);
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse' || !mqFine.matches || reduced()) return;
      var dx = e.clientX - lx, dy = e.clientY - ly;
      if (dx * dx + dy * dy < 36) return;
      lx = e.clientX; ly = e.clientY;
      if (parts.length > 90) return;
      parts.push({ x: lx + 6 + Math.random() * 6, y: ly + 10 + Math.random() * 6, vx: (Math.random() - 0.5) * 0.9, vy: Math.random() * 0.5, life: 1, c: COLORS[(Math.random() * COLORS.length) | 0] });
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    function loop() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      var S = 3 * dpr;
      parts = parts.filter(function (p) { return p.life > 0; });
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.035; p.life -= 0.018;
        if (Math.random() < 0.12) return;
        var shape = p.life > 0.62 ? BIG : p.life > 0.3 ? MID : DOT;
        var bx = Math.round(p.x / 3) * 3 * dpr, by = Math.round(p.y / 3) * 3 * dpr;
        ctx.fillStyle = '#000';
        shape.forEach(function (q) { ctx.fillRect(bx + q[0] * S + dpr, by + q[1] * S + dpr, S, S); });
        ctx.fillStyle = p.c;
        shape.forEach(function (q) { ctx.fillRect(bx + q[0] * S, by + q[1] * S, S, S); });
        if (shape === BIG) { ctx.fillStyle = '#FFF'; ctx.fillRect(bx, by, S, S); }
      });
      raf = parts.length ? requestAnimationFrame(loop) : 0;
      if (!raf) ctx.clearRect(0, 0, cv.width, cv.height);
    }
  })();

  /* =====================================================================
   * 16. TYPOGRAPHY — prices never break inside the number
   * content.js separates thousands and the currency sign with plain spaces ("от 240 000 ₽"), so a line
   * can end on "от 240". Page-level workaround (core request filed): tie digit groups, the ₽ sign and the
   * short preposition in front of a number with no-break spaces. Runs again after every language switch,
   * because core re-sets textContent from the copy.
   * ===================================================================== */
  var NB = ' ';
  function tieNumbers() {
    var scope = document.getElementById('main');
    if (!scope || !document.createTreeWalker) return;
    var tw = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null), n, v, nv;
    while ((n = tw.nextNode())) {
      v = n.nodeValue;
      if (!v || !/\d/.test(v)) continue;
      nv = v.replace(/(\d) (?=\d{3}(?!\d))/g, '$1' + NB)
        .replace(/(\d|тыс\.|млн) (?=[₽$€])/g, '$1' + NB)
        .replace(/(^|[\s(«—–-])(от|до|from|under|up to) (?=[\d$€₽])/gi, '$1$2' + NB);
      if (nv !== v) n.nodeValue = nv;
    }
  }
  tieNumbers();

  /* =====================================================================
   * 17. OFF-SCREEN PAUSE for the CSS loops (see .is-offscreen in style.css)
   * ===================================================================== */
  // the below-the-fold windows start with content-visibility:auto (fast first paint); after load they are
  // laid out one per idle callback, nearest first, so no later scroll frame has to lay out a whole window
  (function () {
    var secs = $$('main > .sec');
    var ric = window.requestIdleCallback || function (fn) { return setTimeout(fn, 60); };
    function next() { var s = secs.shift(); if (!s) return; s.classList.add('is-laid'); ric(next, { timeout: 700 }); }
    if (document.readyState === 'complete') ric(next, { timeout: 1200 });
    else window.addEventListener('load', function () { ric(next, { timeout: 1200 }); }, { once: true });
  })();

  if ('IntersectionObserver' in window) {
    var loopHosts =['#top', '#work', '#process', '#pricing', '.site-footer'].map(function (s) { return $(s); }).filter(Boolean);
    var lio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-offscreen', !en.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    loopHosts.forEach(function (el) { lio.observe(el); });
  }

  /* =====================================================================
   * 18. LANGUAGE, PREVIEW, MOTION
   * ===================================================================== */
  D.on('langchange', function () {
    tieNumbers();
    if (toastEl) { toastEl.hidden = true; toastEl.textContent = ''; }
    buildWordArt();
    renderTip();
    renderWiz();
    renderFaq();
    Midi.relabel();
    floats.forEach(updateMoveLabel);
    stackFloats();
    if (booting && statusEl) statusEl.textContent = tx('browser.connecting');
  });
  D.on('previewactive', function (d) {
    previewActive = !!(d && d.active);
    artKick(); // the IntersectionObserver still decides which canvases are on screen while core auto-scrolls
  });
  D.on('motionchange', function () { artKick(); });
})();
