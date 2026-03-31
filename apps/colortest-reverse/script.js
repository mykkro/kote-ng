

class ReverseColorTestGame extends TimedGame {
    constructor(config) {
        super(config);
        this.currentFrame = 0;
        this.N = config.N;
        this.matchProbability = config.matchProbability;
        this.matchType = config.matchType || "color";
        this.totalFrames = this.N;
    }

    createGUI(r) {
        // create grid
        var self = this;

        var labelSvg = new TextWidget(600, 50, "middle", "");
        labelSvg.setPosition(200, 160)
        labelSvg.setStyle({"fill": "black"});
        this.label = labelSvg;
        this.updateCounter();

        this.body = new GroupWidget();
    }

    update(elapsedMillis) {
    }

    updateCounter() {
        this.label.setText((this.currentFrame+1)+"/"+this.totalFrames);
    }

    generateTaskData(options) {
        var availableColors = ["red", "green", "blue", "yellow"];
        var sequenceLength = this.N;
        var matchedCount = Math.floor(this.N * this.matchProbability / 100);

        var correctIndices = makeRange(sequenceLength).shuffle();
        var correct = {};
        for(var i=0; i<matchedCount; i++) {
            correct[correctIndices[i]] = true;
        }

        var out = [];
        for(var i=0; i<sequenceLength; i++) {
            var labelColor = pickRandom(availableColors);
            var color = labelColor;
            if(!(i in correct)) {
                var otherColors = availableColors.slice(0);
                otherColors.remove(labelColor);
                color = pickRandom(otherColors);
            }
            out.push({label: labelColor, color: color});
        }
        return out;
    }

    generateReport(evalResult) {
        console.log("Generate report", evalResult, this.times);
        var minDelay = -1;
        var avgDelay = 0;
        this.times.forEach(function(t) {
            if(minDelay < 0 || t < minDelay) {
                minDelay = t;
            }
            avgDelay += t;
        })
        avgDelay /= this.times.length;
        return [
            this.loc("Correctness") + ": "+ sprintf("%.1f%%", evalResult.correctness * 100),
            this.loc("Total time") + ": " + sprintf("%.2f s", this.stopwatch.millis() / 1000),
            this.loc("Minimum reaction time") + ": " + sprintf("%.2f s", minDelay / 1000),
            this.loc("Average reaction time") + ": " + sprintf("%.2f s", avgDelay / 1000)
        ];
    }

    _colorButton(color, x, y, callback) {
        var r1 = new RectWidget(180, 180);
        r1.setStyle({"fill":color, "stroke":"none"});
        r1.setPosition(x, y);
        var c1 = new Clickable(r1);
        c1.onClick(function() {
            callback(color);
        });
        return c1;
    }

    renderFrame() {
        var self = this;
        this.body.clearContents();

        this.updateCounter();
        var g = this.goals[this.currentFrame];

        var _colorSelected = function(color) {
            // console.log("color selected", color, g);
            var delay = self.stopwatch.millis() - self.lastAppeareanceTime;
            // match based on color equality or color-to-text equality
            var matched = (self.matchType == "color") ? (color == g.color) : (color == g.label);
            self.times[self.currentFrame] = delay;
            self.answer[self.currentFrame] = matched;
            self.body.clearContents();
            setTimeout(function() {
                self.advanceFrame();
            }, 500);
        };

        var c1 = this._colorButton("red", 200, 300, _colorSelected);
        var c2 = this._colorButton("blue", 620, 300, _colorSelected);
        var c3 = this._colorButton("green", 200, 720, _colorSelected);
        var c4 = this._colorButton("yellow", 620, 720, _colorSelected);
        this.body.addChild(c1);
        this.body.addChild(c2);
        this.body.addChild(c3);
        this.body.addChild(c4);

        var labelSvg = new TextWidget(600, 100, "middle", this.loc(g.label));
        labelSvg.setPosition(200, 550)
        labelSvg.setStyle({"fill": g.color});
        this.body.addChild(labelSvg);

        this.lastAppeareanceTime = this.stopwatch.millis();
    }

    advanceFrame() {
        this.currentFrame++;
        if(this.currentFrame == this.goals.length) {
            this.stopwatch.freeze();
            this.finish(this.answer);
        } else {
            this.renderFrame();
        }
    }

    initializeTask() {
        var self = this;
        this.currentFrame = 0;
        this.lastAppeareanceTime = 0;
        self.totalFrames = this.gamedata.length;
        self.answer = [];
        self.times = [];
        self.goals = [];

        // prepare data...
        this.gamedata.forEach(function(gd) {
            self.goals.push(gd);
            self.answer.push(null);
            self.times.push(0);
        });

        self.task = new BinaryMultiTask();
    }
}

window.ReverseColorTestGame = ReverseColorTestGame;
