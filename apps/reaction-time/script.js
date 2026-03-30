
var ReactionTimeGame = TimedGame.extend({
    constructor: function(config) {
        this.base(config);
        this.totalFrames = 0;
        this.currentFrame = 0;
        this.targetClicked = false;
    },
    createGUI: function(r) {
        var labelSvg = new TextWidget(600, 50, "middle", "");
        labelSvg.setPosition(200, 140)
        labelSvg.setStyle({"fill": "black"});
        this.label = labelSvg;
        this.body = new GroupWidget();
    },
    showTarget: function() {
        var self = this;
        var img0 = new ImageWidget(self.baseUrl + "/assets/1.png", 200, 200);
        img0.setPosition(100+Math.random()*600, 300+Math.random()*400);
        var clk = new Clickable(img0);
        clk.onClick(function() {
            player.playSound("click");
            self.targetClicked = true;
            // TODO record the reaction time...
            self.targetReactionTime = self.stopwatch.millis();
            self.hideTarget();
        });
        this.body.addChild(clk);
    },
    hideTarget: function() {
        this.body.clearContents();
    },
    printTime: function(msecs) {
        if(msecs === null) {
            return this.loc("N/A");
        } else {
            return sprintf("%.2f s", msecs / 1000);
        }
    },
    generateReport: function(evalResult) {
        return [
            this.loc("Hit ratio") + ": "+ sprintf("%.1f %%", evalResult.hitRatio * 100),
            this.loc("Best reaction time") + ": "+ this.printTime(evalResult.bestReactionTime),
            this.loc("Average reaction time") + ": "+ this.printTime(evalResult.avgReactionTime),
        ];
    },
    initializeTask: function() {
        this.totalFrames = this.gamedata.length/2;
        this.task = new ReactionTimeTask();
        this.events = this.gamedata.slice(0);
        this.targetShowTime = -1;
        this.targetReactionTime = -1;
        this.answer = [];
    },
    renderFrame: function() {
        this.updateCounter();
    },
    update: function(elapsedMillis) {
        console.log("ReactionTimeGame.update", elapsedMillis, this.stopwatch.millis());
        this.currentTime = this.stopwatch.millis();
        if(this.events.length == 0) {
            this.timer.stop();
            this.finish(this.answer);
            return;
        }
        var topEvent = this.events[0];
        if(this.currentTime >= topEvent.time) {
            this.events.shift();
            if(topEvent.type == "showtarget") {
                this.showTarget();
                this.targetShowTime = this.currentTime;
                this.targetReactionTime = -1;
            } else if(topEvent.type == "cleartarget") {
                this.hideTarget();
                this.answer.push({cue: this.targetShowTime, reaction: this.targetReactionTime});
                this.currentFrame++;
                if(this.currentFrame < this.gamedata.length/2) {
                    this.updateCounter();
                }
            }
        }
    },
    updateCounter: function() {
        this.label.setText((this.currentFrame+1)+"/"+this.totalFrames);
    },
    generateTaskData: function(options) {
        // generate event sequence
        // events:
        //   showtarget [time, type, x, y]
        //   cleartarget [time]
        var N = this.config.N || 12; // number of frames
        var allowedShift = this.config.allowedShift || 1000;
        var targetTimeout = this.config.targetTimeout || 3000;
        var avgFrameLen = this.config.avgFrameLen || 5000;
        var events = [];
        var startTimes = [];
        for(var i=0; i<N; i++) {
            var eventStartTime = (i+1)*avgFrameLen;
            eventStartTime += (Math.random()*2-1)*allowedShift;
            startTimes.push(eventStartTime);
            events.push({"type": "showtarget", "time": eventStartTime});
            events.push({"type": "cleartarget", "time": eventStartTime + targetTimeout});
        }
        return events;
    }

});


