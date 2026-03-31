class Fifteen extends TimedGame {

    constructor(config) {
        super(config);
    }

    /**
     *  Creates a matrix filled by a value.
     */
    createMatrix(rows, cols, value) {
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
    }

    forEachInMatrix(matrix, fun) {
        for(var i=0; i<matrix.length; i++) {
            for(var j=0; j<matrix[0].length; j++) {
                fun(matrix[i][j], i, j);
            }
        }
    }

    swapMatrixValues(matrix, row1, col1, row2, col2) {
        var val1 = matrix[row1][col1];
        var val2 = matrix[row2][col2];
        matrix[row1][col1] = val2;
        matrix[row2][col2] = val1;
    }

    renderBoard() {
        console.log("Fifteen.renderBoard");
        var self = this;

        var gridRows = 4;
        var gridCols = 4;
        var x = 100;
        var y = 100;
        var width = 800;
        var height = 800;
        var tileWidth = Math.floor(width / gridCols);
        var tileHeight = Math.floor(height / gridRows);

        this.completed = false;
        this.numberOfMoves = 0;

        // return position where to draw grid cell with coordinates (gridX,gridY)
        this.gridPos = function(gridX,gridY) {
            return { x: x + gridX * tileWidth, y: y + gridY * tileHeight };
        }

        this.tileMatrix = this.createMatrix(gridRows, gridCols, function(r, c) {
            var index = c + r*gridCols;
            var tile = self.gamepack.tileset.tiles[index].url;
            var img = new ImageWidget(self.tilesetBaseUrl + "/" + tile, tileWidth, tileHeight);
            return img;
        });

        this.clickedOn = function(r, c) {
            console.log("Click!", r, c);
        }

        this.clickableMatrix = this.createMatrix(gridRows, gridCols, function(r, c) {
            /* Create overlay clickable matrix */
            var overlay = new RectWidget(tileWidth, tileHeight);
            var pos = self.gridPos(c, r);
            overlay.setPosition(pos.x, pos.y);
            overlay.setStyle({"fill": "white", "fill-opacity": 0.001, "stroke": "none"});
            var clk = new Clickable(overlay);
            clk.onClick(function(clickable, e) {
                self.clickedOn(r, c);
            });
            return clk;
        });

        this.emptyTile = this.tileMatrix[gridRows-1][gridCols-1];
        this.emptyTile.clear();

        this.permutationMatrix = this.createMatrix(gridRows, gridCols, function(r, c) {
            return { row: r, column: c, x: c, y: r };
        });

        this.reversePermutation = function(row, column) {
            var rr, cc;
            self.forEachInMatrix(self.permutationMatrix, function(pos, r, c) {
                    if(pos.row == row && pos.column == column) {
                        rr = r;
                        cc = c;
                    }
            });
            return { row: rr, column: cc, x: cc, y: rr };
        }

        this.tileAtGridPosition = function(row, column) {
            var pos = self.reversePermutation(row, column);
            return self.tileMatrix[pos.row][pos.column];
        }

        this.canMoveTo = function(row, column) {
            return self.tileAtGridPosition(row, column) == self.emptyTile;
        }

        this.availableDirections = function(row, column) {
            var dirs = [];
            // down?
            if(row < gridRows-1) {
                dirs.push("down");
            }
            if(row > 0) {
                dirs.push("up");
            }
            if(column < gridCols-1) {
                dirs.push("right");
            }
            if(column > 0) {
                dirs.push("left");
            }
            return dirs;
        }

        this.dirMap = { "left": [0,-1], "right": [0,1], "down": [1,0], "up": [-1,0] };

        this.availableMoves = function(row, column) {
            var dirs = self.availableDirections(row, column);
            var moves = [];
            for(var i=0; i<dirs.length; i++) {
                var dir = dirs[i];
                var rr = row + self.dirMap[dir][0];
                var cc = column + self.dirMap[dir][1];
                if(self.canMoveTo(rr, cc)) {
                    moves.push(dir);
                }
            }
            return moves;
        }

        this.tilesThatCanBeMoved = function() {
            // return list of tiles (positions) that have available moves...
            var movables = [];
            for(var i=0; i<gridRows; i++) {
                for(var j=0; j<gridCols; j++) {
                    if(self.availableMoves(i, j).length > 0) {
                        movables.push({row: i, column: j, x: j, y: i});
                    }
                }
            }
            return movables;
        }

        this.randomizeTiles = function(steps) {
            var steps = steps || 10;
            for(var i=0; i<steps; i++) {
                var movables = self.tilesThatCanBeMoved();
                var movable = movables[Math.floor(Math.random()*movables.length)];
                self.moveTile(movable.row, movable.column);
            }
        }

        this.moveTile = function(r, c) {
            var moves = self.availableMoves(r, c);
            if(moves.length > 0) {
                // we expect a single possible move...
                var move = moves[0];
                var rr = r + self.dirMap[move][0];
                var cc = c + self.dirMap[move][1];
                // swap tiles at positions (r,c) and (rr,cc)
                var p1 = self.reversePermutation(r, c);
                var p2 = self.reversePermutation(rr, cc);
                self.swapMatrixValues(self.permutationMatrix, p1.row, p1.column, p2.row, p2.column);
                return move;
            } else {
                return null;
            }
        }

        this.clickedOn = function(r, c) {
            if(this.completed) {
                return;
            }
            var move = self.moveTile(r, c);
            if(move) {
                self.numberOfMoves++;
                self.updateTileDisplay();
                if(self.inGoalPosition()) {
                    self.puzzleFinished();
                }
            } else {
                // console.error("Tile cannot be moved", r, c, move);
            }
        }

        this.inGoalPosition = function() {
            for(var i=0; i<gridRows; i++) {
                for(var j=0; j<gridCols; j++) {
                    var cc = self.permutationMatrix[i][j];
                    if(cc.row != i || cc.column != j) {
                        return false;
                    }
                }
            }
            return true;
        }

        this.puzzleFinished = function() {
            self.completed = true;
            console.log("Finished!");
            setTimeout(function() {
                self.finish();
            }, 1000);
        }

        this.updateTileDisplay = function() {
            self.forEachInMatrix(self.tileMatrix, function(elem, row, column) {
                    var perm = self.permutationMatrix[row][column];
                    var pos = self.gridPos(perm.x, perm.y);
                    elem.setPosition(pos.x, pos.y);
            });
        }

        this.randomizeTiles(this.config.randomMovesNo || 10);
        this.updateTileDisplay();

    }

    // set default embedding options for this Game
    getEmbeddingOptions() {
        return {
            renderTitle: false,
            renderAbortButton: true
        };
    }

    createGUI(r) {
        var self = this;
        this.body = new GroupWidget();
    }

    generateTaskData(options) {
        return null;
    }

    renderFrame() {
        this.renderBoard();
    }

    loadGamepackData() {
        var self = this;
        var name = self.meta.gamepackName;
        var gamepackUrl = self.meta.appBaseUrl + "/gamepacks/" + name;
        var tilesetUrl = self.meta.appBaseUrl + "/"+ self.meta.res("tileset");
        return fetch(tilesetUrl).then(function(r) { return r.json(); }).then(function(tileset) {
            console.log("Data loaded:", tileset, tilesetUrl);
            return {name:name, url:gamepackUrl, tilesetUrl: tilesetUrl, tileset:tileset};
        });
    }

    initializeTask() {
        this.task = new NullTask();
        this.answer = null;
        this.tilesetBaseUrl = dirname(this.gamepack.tilesetUrl);
        console.log("Fifteen.initializeTask", this.tilesetBaseUrl);
    }

    generateReport(evalResult) {
        return [
            this.loc("Number of moves") + ": " + this.numberOfMoves,
            this.loc("Total time") + ": " + (this.currentTime / 1000) + " s"
        ];
    }

    update(elapsedMillis) {
       //console.log(elapsedMillis);
    }
}

window.Fifteen = Fifteen;
