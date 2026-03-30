var Minefield = TimedGame.extend({

    constructor: function(config) {
        this.base(config);
        this.gridRows = config.gridRows || 10;
        this.gridCols = config.gridCols || 10;
        this.gridMines = config.gridMines || 25;
    },

    /**
     *  Creates a matrix filled by a value.
     */
    createMatrix: function(rows, cols, value) {
        var mat = [];
        var filler = value || 0;
        if(typeof(value) != "function") {
            filler = function(row, col) {
                return value;
            }
        }
        for(var i=0; i<rows; i++) {
            var row = [];
            for(var j=0; j<cols; j++) {
                row.push(filler(i, j));
            }
            mat.push(row);
        }
        return mat;
    },
    forEachInMatrix: function(matrix, fun) {
        for(var i=0; i<matrix.length; i++) {
            for(var j=0; j<matrix[0].length; j++) {
                fun(matrix[i][j], i, j);
            }
        }
    },
    swapMatrixValues: function(matrix, row1, col1, row2, col2) {
        var val1 = matrix[row1][col1];
        var val2 = matrix[row2][col2];
        matrix[row1][col1] = val2;
        matrix[row2][col2] = val1;
    },

    renderBoard: function() {
        console.log("Minefield.renderBoard");
        var self = this;

        var gridWidth = this.gridCols;
        var gridHeight = this.gridRows;
        var mineCount = this.gridMines;
        var modeUncover = true;
        var background, minefield, numbers, cover, flagged;

        var gridRows = gridWidth;
        var gridCols = gridHeight;
        var x = 100;
        var y = 100;
        var width = 800;
        var height = 800;
        var tileWidth = Math.floor(width / gridCols);
        var tileHeight = Math.floor(height / gridRows);


        var ts = self.gamepack.tileset.tiles;
        var tsmap = {};
        ts.forEach(function(t) { tsmap[t.name] = self.tilesetBaseUrl + "/" + t.url;});
        console.log(tsmap);

        var finished = false;
/*
        var updateControls = function() {
            $("#controls button").removeClass("selected");
            $(modeUncover ? "#uncover" : "#flag").addClass("selected");
        }

        $("#flag").click(function() {
            modeUncover = false;
            updateControls();
        });

        $("#uncover").click(function() {
            modeUncover = true;
            updateControls();
        });

        updateControls();
*/


        var uncoverTile = function(mat, i,j) {
          if(i<0 || i>gridHeight-1 || j<0 || j>gridWidth-1) {
            return false;
          } 
          if(!cover.getValue(i,j)) {
            return false;
          }
          cover.setValue(i, j, false);
          flagged.setValue(i, j, false);
          mat[i][j].cover.setBlank();
          mat[i][j].flag.setBlank();
          if(minefield.getValue(i,j)) {
            return true;
          }
          if(numbers.getValue(i,j) == 0) {
            uncoverTile(mat, i-1, j-1);
            uncoverTile(mat, i-1, j);
            uncoverTile(mat, i-1, j+1);
            uncoverTile(mat, i, j-1);
            uncoverTile(mat, i, j+1);
            uncoverTile(mat, i+1, j-1);
            uncoverTile(mat, i+1, j);
            uncoverTile(mat, i+1, j+1);
          }
          return false;
        }

        var allUncovered = function() {
            // all non-mine tiles are uncovered
            var coveredEmpty = false;
            minefield.forEach(function(i, j, value) {
                if(!value) {
                    // something is hidden...
                    if(cover.getValue(i,j)) {
                        coveredEmpty = true;
                        return;
                    }
                }
            });
            return !coveredEmpty;
        }

        modeUncover = true;
        background = new Grid(gridHeight, gridWidth, true);
        minefield = new Grid(gridHeight, gridWidth, false).filledRandomlyBy("mine", mineCount);
        numbers = new Grid(gridHeight, gridWidth, function(i,j) {
            var num = 
                ((j>0           && i>0            && minefield.grid[i-1][j-1]) ? 1 : 0) +
                ((                 i>0            && minefield.grid[i-1][j  ]) ? 1 : 0) +
                ((j<gridWidth-1 && i>0            && minefield.grid[i-1][j+1]) ? 1 : 0) +
                ((j>0           && i<gridHeight-1 && minefield.grid[i+1][j-1]) ? 1 : 0) +
                ((                 i<gridHeight-1 && minefield.grid[i+1][j  ]) ? 1 : 0) +
                ((j<gridWidth-1 && i<gridHeight-1 && minefield.grid[i+1][j+1]) ? 1 : 0) +
                ((j>0                             && minefield.grid[i  ][j-1]) ? 1 : 0) +
                ((j<gridWidth-1                   && minefield.grid[i  ][j+1]) ? 1 : 0)
            ;
            return num;
        });
        cover = new Grid(gridHeight, gridWidth, true);
        flagged = new Grid(gridHeight, gridWidth, false);


        var hitTile = function(mat, i, j, modeUncover) {
            if(modeUncover) {
                turnTile(mat, i, j);
            } else {
                flagTile(mat, i, j);
            }                            
        }

        var turnTile = function(mat, i, j) {
            if(!flagged.getValue(i,j) && cover.getValue(i,j)) {
                var exploded = uncoverTile(mat, i,j);
                if(exploded) {
                    minefield.setValue(i, j, "mine-exploded");
                    mat[i][j].mineOrNumber.setSrc(tsmap["mine-exploded"]);
                    gameLost(mat);
                } else if(allUncovered()) {
                    gameWon(mat);
                }
            }
        }

        var gameLost = function(mat) {
            explodeAllMines(mat);
            finished = true;
            console.log("Kaboom!");

            notifyFinished(function() {
                // TODO add clickable overlay...
                setTimeout(function() {
                    self.finish(self.answer);
                }, 5000);
            });
        }

        var gameWon = function(mat) {
            finished = true;
            console.log("You win");
            notifyFinished(function() {
                self.finish(self.answer);
            });
        }

        var notifyFinished = function(callback) {
            // TODO show modal splash dialog
            setTimeout(callback, 500);
        }

        var flagTile = function(mat, i, j) {
            if(cover.getValue(i,j)) {
                flagged.setValue(i,j,!flagged.getValue(i,j));
                // update flag view
                if(flagged.getValue(i,j)) {
                    mat[i][j].flag.setSrc(tsmap["flag"]);
                } else {
                    mat[i][j].flag.setBlank();
                }
            }
        }                            

        /* Create view */
        var createView = function() {
            var mat = [];
            for(var i=0; i<gridHeight; i++) {
                var row = [];
                for(var j=0; j<gridWidth; j++) {
                    var tile = {
                        background: new ImageWidget(tsmap["empty"], tileWidth, tileHeight),
                        mineOrNumber: new ImageWidget(minefield.getValue(i,j) ? tsmap["mine"] : (numbers.getValue(i,j)>0 ? tsmap["number"+numbers.getValue(i,j)] : "assets/blank.png"), tileWidth, tileHeight),
                        cover: new ImageWidget(tsmap["cover"], tileWidth, tileHeight),
                        flag: new ImageWidget("assets/blank.png", tileWidth, tileHeight)
                    };
                    tile.background.setPosition(x+tileWidth*j, y+tileHeight*i);
                    tile.mineOrNumber.setPosition(x+tileWidth*j, y+tileHeight*i);
                    tile.cover.setPosition(x+tileWidth*j, y+tileHeight*i);
                    tile.flag.setPosition(x+tileWidth*j, y+tileHeight*i);
                    tile.clickable = new Clickable(tile.flag);
                    (function(i,j){
                        tile.clickable.onClick(function() {
                            if(!finished) {
                                hitTile(mat, i, j, modeUncover);
                            } 
                        })
                    })(i,j);
                    row.push(tile);
                }
                mat.push(row);
            }
            return mat;
        }

        var explodeAllMines = function(mat) {
            for(var i=0; i<gridHeight; i++) {
                for(var j=0; j<gridWidth; j++) {
                    if(minefield.getValue(i,j)) {
                        mat[i][j].flag.setBlank();
                        mat[i][j].cover.setBlank();
                        mat[i][j].mineOrNumber.setSrc(tsmap["mine-exploded"]);
                    };
                }
            }
        }

        var mat = createView();
        modeUncover = true;


        var buttonStyle = {fontSize: 30, border: 15, anchor: "middle", radius: 20};

        this.button1 = new ButtonWidget(this.loc("Uncover"), buttonStyle);
        this.button1.setPosition(400-this.button1.w/2, 910);
        this.button1.onClickAnimationComplete(function() {
            modeUncover = true;
            self.button1.setHighlighted(true);
            self.button2.setHighlighted(false);
        });
        this.button2 = new ButtonWidget(this.loc("Flag"), buttonStyle);
        this.button2.setPosition(600-this.button2.w/2, 910);
        this.button2.onClickAnimationComplete(function() {
            modeUncover = false;
            self.button1.setHighlighted(false);
            self.button2.setHighlighted(true);
        });

        self.button1.setHighlighted(true);
        self.button2.setHighlighted(false);

    },

    // set default embedding options for this Game
    getEmbeddingOptions: function() {
        return {
            renderTitle: false,
            renderAbortButton: true
        };
    },
    createGUI: function(r) {
        var self = this;
        this.body = new GroupWidget();
    },
    generateTaskData: function(options) {
        return null;
    },            
    renderFrame: function() {
        this.renderBoard();
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
        this.task = new NullTask();
        this.answer = null;
        this.tilesetBaseUrl = dirname(this.gamepack.tilesetUrl);
        console.log("Fifteen.initializeTask", this.tilesetBaseUrl);
    },
    generateReport: function(evalResult) {
        return [
            //this.loc("Number of moves") + ": " + this.numberOfMoves,
            this.loc("Total time") + ": " + (this.currentTime / 1000) + " s"
        ];
    },
    update: function(elapsedMillis) {
       //console.log(elapsedMillis);
    }
},{
});
