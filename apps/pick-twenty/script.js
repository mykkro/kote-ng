

class PickTwentyGame extends TimedGame {
    constructor(config) {
        super(config);
        this.locations = [];
        this.N = config.N;
        this.rotateGoals = config.rotateGoals;
    }

    isPlaceFree(x, y, rad) {
        console.log("Testing location:", x, y, rad);
        for(var i=0; i<this.locations.length; i++) {
            var xx = this.locations[i].x;
            var yy = this.locations[i].y;
            var rr = this.locations[i].radius;
            if((xx-x)*(xx-x) + (yy-y)*(yy-y) < (rr+rad)*(rr+rad)) {
                return false;
            }
        }
        return true;
    }

    renderFrame() {
    }

    update(elapsedMillis) {
    }

    placeGoal(x1, x2, y1, y2, rad, goal) {
        var p = randomPoint(x1, x2, y1, y2);
        while(!this.isPlaceFree(p.x, p.y, rad)) {
            p = randomPoint(x1, x2, y1, y2);
        }
        console.log(p);
        console.log("Placing goal: ", p.x, p.y, rad, goal);
        this.locations.push({x:p.x, y:p.y, radius:rad});
    }

    createGUI(r) {
        var self = this;
    }

    generateTaskData(options) {
        return null;
    }

    generateReport(evalResult) {
        return [
        this.loc("Total time") + ": " + sprintf("%.1f sec", evalResult.totalTime /1000),
        this.loc("Mistakes total")+ ": " + evalResult.mistakes
        ];
    }

    initializeTask() {
        var gamedata = this.gamedata;
        this.locations = [];
        this.mistakes = 0;
        var self = this;

        var minX = 100;
        var maxX = 900;
        var minY = 150;
        var maxY = 900;
        var rad = 70;
        for(var i=0; i<this.N; i++) {
            this.placeGoal(minX, maxX, minY, maxY, rad, ""+i);
        }
        self.numberButtons = [];
        for(var i=0; i<self.locations.length; i++) {
            var kinds = ["kind0", "kind1", "kind2"];
            var caption = (i+1)+"";
            if(i==5 || i==8) caption += ".";
            var klazz = "round-btn btn1 "+pickRandom(kinds);
            var aa = new RoundButtonWidget(caption, {
                "class":klazz,
                "border":10,
                "radius": 50,
                "fontSize": 60,
                "fontWeight": "bold",
                "rotation": this.rotateGoals ? Math.random()*360.0 : 0,
                backgroundStyle: {"fill": "#aac", "stroke":"#333", "stroke-width": 8},
                highlightedBackgroundStyle: {"fill": "#aac", "stroke":"#333", "stroke-width": 8}
            });

            aa.setPosition(self.locations[i].x, self.locations[i].y);

            self.numberButtons.push(aa);
            self.counter = 0;

            self.correct = false;

            aa._beforeClick = function(btn) {
                var ndx = -1;
                for(var i=0; i<self.numberButtons.length; i++) {
                    if(btn == self.numberButtons[i]) {
                        ndx = i;
                        break;
                    }
                }
                self.correct = (self.counter == ndx);
                if(self.correct) {
                    // log success (time) + relevant data
                    btn.o.clickedBackgroundStyle = Object.assign(btn.o.clickedBackgroundStyle, {"stroke": "green", "fill":"darkgreen"});
                } else {
                    btn.o.clickedBackgroundStyle = Object.assign(btn.o.clickedBackgroundStyle, {"stroke": "red", "fill":"crimson"});
                }
            }

            aa.onClick(function(btn) {
                player.playSound("click");
                // which index?
                var elapsedTime = self.currentTime;
                if(self.correct) {
                    console.log("Correct!", self.counter, elapsedTime);
                    // log success (time) + relevant data
                    self.counter++;
                    if(self.counter==self.N) {
                        console.log("Well done!", elapsedTime);
                        // log completion (total duration, etc.)
                        self.finish({totalTime: elapsedTime, mistakes: self.mistakes});
                    }
                } else {
                    console.log("Incorrect!", self.counter, elapsedTime);
                    // log error (time) + relevant data
                    self.mistakes++;
                }

            });
        }

        self.task = new NullTask();

    }
}

window.PickTwentyGame = PickTwentyGame;
