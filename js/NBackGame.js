
var NBackGame = TimedGame.extend({
    constructor: function(config) {
        console.log("Starting N-Back game with config", config);
        this.base(config);
        this.x0 = 200;
        this.y0 = 200;
        this.cellSize = 200;
        this.currentFrame = 0;

        this.dualType = config.dualType;
        this.N = config.N;
        this.L = config.L;
        this.matchProbability = config.matchProbability || 0.4;
        this.displayDuration = config.displayDuration || 1000;
        this.repeatAfter = config.repeatAfter || 3000;
        this.maxColors = Math.min(config.nColors, NBackGame.colors.length);
        this.maxSigns = Math.min(config.nSigns, NBackGame.signImages.length);
    },
    createBackground: function(r) {
        // create grid
        var self = this;
        this.r = r;
        var M = 3;
        var N = 3;
        var x0 = this.x0;
        var y0 = this.y0;
        var cellSize = this.cellSize;
        this.background = r.rect(x0, y0, M*cellSize, N*cellSize).attr({"fill":"white"});
        var lineStyle = { "stroke-width": 5, "stroke": "blue" };
        for(var x=1; x<M; x++) {
            r.line(x0+x*cellSize, y0, x0+x*cellSize, y0+N*cellSize).attr(lineStyle);
        }
        for(var y=1; y<N; y++) {
            r.line(x0, y0+y*cellSize, x0+M*cellSize, y0+y*cellSize).attr(lineStyle);
        }
        var labelSvg = new TextWidget(600, 50, "middle", "");
        labelSvg.setPosition(200, 140)
        labelSvg.setStyle({"fill": "black"});        
        this.label = labelSvg;
        this.updateCounter();
    },
    updateCounter: function() {
        this.label.setText((this.currentFrame+1)+"/"+this.L);
    },
    drawBox: function(r, col, row, color) {
        var cs = this.cellSize - 40;
        return r.rect(this.x0+col*this.cellSize+20, this.y0+row*this.cellSize+20, cs, cs).attr({"fill":color});
    },
    drawImage: function(r, col, row, image) {
        var cs = this.cellSize - 40;
        return r.image(image, this.x0+col*this.cellSize+20, this.y0+row*this.cellSize+20, cs, cs);
    },
    update: function(elapsedMillis) {
        if(this.finished) {
            this.timer.stop();
            return;
        }
        // console.log(this.boxMode, this.lastBox, elapsedMillis, this.timeToHide, this.timeToNext);
        if(this.boxMode == "show" && (elapsedMillis >= this.timeToHide)) {
            if(this.lastBox) {
                this.lastBox.remove();
            }
            this.lastBox = null;
            this.boxMode = "hide";
            this.timeToNext = elapsedMillis +  this.repeatAfter - this.displayDuration;
            return;
        }
        // console.log(this.currentFrame, this.L, this.N);
        if(this.boxMode == "hide" && (elapsedMillis >= this.timeToNext)) {
            this.currentFrame++;
            if(this.currentFrame == this.L) {
                this.finish(this.answer);
            } else {
                this.timeToHide = elapsedMillis +  this.displayDuration;
                this.updateCounter();
                this.showObject();
                this.boxMode = "show";
            }
        }
    },
    showObject: function() {
        // to be overridden in subclasses
    },
    startTimer: function() {
        this.currentFrame = 0;
        this.lastBox = null;
        this.boxMode = "show";
        this.timeToHide = this.displayDuration;
        this.showObject();
        this.base();
    },
    indexAsPosition: function(index) {
        var px = index % 3;
        var py = Math.floor(index / 3);
        return { x: px, y: py };
    },
    generateTaskData: function(options) {
    },
    /**
     *  Generate random sequence of numbers for N-Back task.
     *  L - length of the sequence
     *  N - look-behind distance
     *  pMatch - percentage of values that matches their predecessor (seq[i] == seq[i-N])
     *  levels - output range (numbers in range 0..levels-1)
     */
    generateNBackSequence: function(L, N, pMatch, levels) {
        var seq = randomIntVector(L, levels);
        var M = L - N;
        var indices = [];
        for(var i=0; i<M; i++) {
            indices.push(i+N);
        }
        indices.shuffle();
        // take first pMatch*M numbers...
        var MM = Math.floor(M*pMatch);
        indices = indices.slice(0, MM);
        indices.sort();
        indices.forEach(function(j) {
            seq[j+N] = seq[j];
        });
        return seq;
    }
}, {
    colors: [
        "red", "green", "blue", "yellow", "cyan", "magenta", "black", "orange", "brown", "teal"
    ],
    signImages: [
        "assets/signs/sign1.png",
        "assets/signs/sign2.jpg",
        "assets/signs/sign3.jpg",
        "assets/signs/sign4.jpg",
        "assets/signs/sign5.png",
        "assets/signs/sign6.png",
        "assets/signs/sign7.png",
        "assets/signs/sign8.png",
        "assets/signs/sign9.png",
        "assets/signs/sign10.jpg"
    ]
});
