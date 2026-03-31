// a specific type of game uses
// a specific game data model (task)
// and a GUI/presentation layer
class Game extends Base {
    constructor(config) {
        super();
        this.config = config;
        // baseUrl and loc will be overwritten by the app engine...
        this.baseUrl = "";
        this.gui = null;
        this.loc = function(s) { return s; };
        console.log("Game config loaded: ", config);
        this.embeddingOptions = this.getEmbeddingOptions();
    }
    // set default embedding options for this Game
    getEmbeddingOptions() {
        return {
            renderTitle: true,
            renderAbortButton: true
        };
    }
    createGUI(r) {
        // override in subclasses...
    }
    generateTaskData(options) {
        // generate data for game session
        return null;
    }
    start() {
        this.gamedata = this.generateTaskData();
        this.onStart(this.gamedata);
    }
    abort() {
        console.log("Game aborted!");
        this.finished = true;
        this.onAbort();
    }
    finish(result) {
        console.log("Game finished!", result);
        this.finished = true;
        console.log("Validating the answer...");
        var evaluated = this.task.evaluate(result);
        var messages = this.generateReport(evaluated);
        this.onFinish(result, evaluated, messages);
    }
    generateReport(evalResult) {
        return [this.loc("Correctness") + ": "+ sprintf("%.1f%%", evalResult.correctness * 100)];
    }
    onStart(val) {
        if(typeof(val)=="function") {
            this._onStart = val;
        } else {
            this.gui.logGameEvent("gameStarted", this.gamedata);
            if(this._onStart) {
                this._onStart(val);
            }
        }
    }
    onAbort(val) {
        if(typeof(val)=="function") {
            this._onAbort = val;
        } else {
            this.gui.logGameEvent("gameAborted", null);
            if(this._onAbort) {
                this._onAbort(val);
            }
        }
    }
    onFinish(val, evaluated, messages) {
        if(typeof(val)=="function") {
            this._onFinish = val;
        } else {
            this.gui.logGameEvent("gameFinished", val, evaluated, messages);
            if(this._onFinish) {
                this._onFinish(val, messages);
            }
        }
    }
}
