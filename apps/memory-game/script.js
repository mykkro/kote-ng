
var MemoryGame = TimedGame.extend({
    constructor: function(config) {
        this.base(config);
    },
    createGUI: function(r) {
        var self = this;
        console.log("MemoryGame:createGUI");
    },
    generateTaskData: function(options) {
        return null;
    },            
    renderFrame: function() {
        var self = this;

        // render the board...
        self.renderBoard();
    },
    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle [v1.0]
    shuffle: function(o){ //v1.0
      for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    },     
    renderBoard: function() {
        var self = this;
        console.log("Rendering MemoryGame board");
        console.log("Using gamepack:", self.gamepack);

        self.tileset = self.gamepack.tileset;      
        self.tileBackUrl = self.tilesetBaseUrl+"/"+self.tileset.tiles.backgrounds[0].url

        self.cards = []
        self.tileset.tiles.game.forEach(function(ttt) {
            self.cards.push({name: ttt.name, tile:null, url:ttt.url});
        });

        self.totalCards = self.tileset.count;
        var tilesCnt = 2 * self.totalCards

        self.cardSize = Math.floor(Math.sqrt(800*800/tilesCnt))
        self.columns = Math.floor(800/self.cardSize)
        self.rows = Math.ceil(tilesCnt/self.columns)
        if(self.columns<self.rows) {
            var tmp = self.columns;
            self.columns = self.rows;
            self.rows = tmp;
        }
        self.playground = []
        self.turnedCards = {}
        self.foundTiles = {}
        self.cardFlipping = true

        // deal up cards
        for(var i=0; i<self.totalCards; i++) {
            self.playground.push(self.cards[i])
            self.playground.push(Object.assign({},self.cards[i]))
        }

        // shuffle...
        self.playground = self.shuffle(self.playground);

        console.log(self.cards, self.totalCards, tilesCnt, self.columns, self.rows, self.cardSize);
        console.log(self.playground);

        self.found = [];
        self.turned = [];

      for(var i=0; i<this.playground.length; i++) {
          var card = this.drawTile(this.playground[i], i)
          this.playground[i].tile = card
      }

    },
    drawTile: function(tileObj, j) {
      var self = this
      var cardSize = this.cardSize-8
      var row = Math.floor(j/this.columns)
      var col = j%this.columns

      console.log("Drawing tile:", cardSize, row, col);

      var boardWidth = this.columns*this.cardSize - 8;
      var boardHeight = this.rows*this.cardSize - 8;
      var xx = (1000-boardWidth)/2;
      var yy = (1000-boardHeight)/2;

    var img = new ImageWidget(self.tilesetBaseUrl + "/" + tileObj.url, cardSize, cardSize);
    img.setPosition(xx + col*this.cardSize, yy + row*this.cardSize);

    var bkImg = new ImageWidget(self.tileBackUrl, cardSize, cardSize);
    bkImg.setPosition(xx + col*this.cardSize, yy + row*this.cardSize);

    var clk = new Clickable(bkImg);
    clk.onClick(function() {
        self.uncoverTile(j);
    });
    card = { "face": img, "back": bkImg, "free": true, "index": j };
    return card;
  },
  uncoverTile: function(index) {
    var self = this;
    var card = this.playground[index].tile;
    if(self.playground[index].tile.free && this.canUncoverMore()) {
        self.playground[index].tile.free = false;
        this.turned.push(self.playground[index]);
        card.back.image.animate({"opacity":"0"}, 500, function() {
            self._uncovered(index);
        });
    }
  },
  hideTile: function(index) {
    var self = this;
    var card = this.playground[index].tile;
    card.back.image.animate({"opacity":"1"}, 500, function() {
        self._hidden(index);
    });
  },
  canUncoverMore: function() {
    return this.turned.length < 2;
  },
  _uncovered: function(index) {
    var self = this;
    var tt = this.playground[index];
    console.log("Tile uncovered:", index, tt, tt.name, this.turned);
    if(this.turned.length == 2) {
        tt1 = this.turned[0];
        tt2 = this.turned[1];
        if(tt1.name == tt2.name) {
            // match!
            this.found.push(tt1.name);
            this.turned = [];
            if(this.found.length == this.totalCards) {
                // all cards uncovered!
                this.winGame();
            }
        } else {
            // wait 1 second, then:
            setTimeout(function() {
                self.turnTilesBack();
            }, 1000);
        }
    }
  },
  winGame: function() {
    //alert("Well done!");
    this.finish();
  },
  generateReport: function(evalResult) {
      return [
        this.loc("All cards found!"),
        this.loc("Total time") + ": " + (this.currentTime / 1000) + " s"
      ];
  },
  turnTilesBack: function() {
    var self = this;
    this.turned.forEach(function(t) {
        self.hideTile(t.tile.index);
    });
    this.turned = [];
  },
  _hidden: function(index) {
    console.log("Tile hidden:", index);
    this.playground[index].tile.free = true;
  },
  update: function(elapsedMillis) {
  },
  loadGamepackData: function() {
        var self = this;
        var name = self.meta.gamepackName;
        var gamepackUrl = self.meta.appBaseUrl + "/gamepacks/" + name;
        var tilesetUrl = self.meta.appBaseUrl + "/"+ self.meta.res("tileset");
        return fetch(tilesetUrl).then(function(r) { return r.json(); }).then(function(tileset) {
            console.log("Data loaded:", tileset, tilesetUrl);
            return {name:name, url:gamepackUrl, tilesetUrl: tilesetUrl, tileset:tileset};
        });
    },
    initializeTask: function() {
        var gamedata = this.gamedata;
        var self = this;
        self.tilesetBaseUrl = dirname(self.gamepack.tilesetUrl);
        self.task = new NullTask();
    }
},{
});
