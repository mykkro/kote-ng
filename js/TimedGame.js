// TimedGame.js


class StopWatch extends Base {
    constructor() {
        super();
        this.frozen = null;
        this.reset();
    }
    reset() {
        this.lastTime = window.performance.now();
    }
    now() {
        if(this.frozen !== null) {
            return this.frozen;
        }
        return window.performance.now() - this.lastTime;
    }
    millis() {
        return Math.floor(this.now());
    }
    seconds() {
        return this.now() / 1000;
    }
    freeze() {
        this.frozen = this.now();
    }
    unfreeze() {
        this.frozen = null;
    }
}


class TimedGame extends Game {
    constructor(config) {
        super(config);
        this.currentTime = 0;
        this.stopwatch = new StopWatch();
    }
    // override in subclasses
    // return a promise returning a gamepack
    loadGamepackData() {
        // override in subclasses — must return a Promise
        return Promise.resolve({});
    }
    start() {
        var self = this;
        console.log("TimedGame.start");

        self.loadGamepackData().then(function(gamepack) {
        	self.gamepackLoaded(gamepack);
            self.onStart(self.gamedata);
        });
    }
    gamepackLoaded(gamepack) {
    	var self = this;
        console.log("TimedGame.gamepackLoaded", gamepack);
        self.gamepack = gamepack;
        self.gamedata = self.generateTaskData();
        self.initializeTask();
        self.renderFrame();
        self.startTimer();
    }
    // override in subclasses
    renderFrame() {
    	var self = this;
        console.log("TimedGame.renderFrame");
    }
    // override in subclasses...
    initializeTask() {
    	var self = this;
        self.answer = null;
        self.task = new NullTask();
    }
    // override in subclasses...
    generateReport(evalResult) {
        return [
            this.loc("Total time") + ": " + (evalResult.totalTime / 1000) + " s"
        ];
    }
    startTimer() {
        var self = this;
        self.currentTime = 0;
        self.stopwatch.reset();
        var timer = new Timer();
        this.timer = timer;
        timer.start({precision: 'secondTenths', callback: function (values) {
            var elapsedMillis = values.secondTenths * 100 + values.seconds * 1000 + values.minutes * 60000 + values.hours * 3600000;
            self.currentTime = elapsedMillis;
            self.update(elapsedMillis);
        }});
    }
    // override in subclasses
    update(elapsedMillis) {
    	console.log("TimedGame.update", elapsedMillis, this.stopwatch.millis());
    }
    abort() {
        super.abort();
        this.timer.stop();
    }
    finish(result) {
        this.timer.stop();
        super.finish(result);
    }
}
