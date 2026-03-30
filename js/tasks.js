/**
 *  Class of game data validators.
 */
var Task = Base.extend({
    evaluate: function(answer) {
        // to be implemented in subclasses
    }
});


// produces 'correctness ratio' - number between 0/1
var ScalarTask = Task.extend({

});

// produces information 0/1 - finished correctly or not
var BinaryTask = ScalarTask.extend({

});

var NullTask = Task.extend({
    validate: function(answer) {
        return !!answer;
    },
    evaluate: function(answer) {
        return answer;
    }
});


// special type of task connected with reading materials
// the data contain information about:
// - how many pages were in the material
// - how long it took to read them (or, to proceed to next page)
// TODO add more data
var InstructionalTask = Task.extend({
    validate: function(answer) {
        return (answer.length > 0);
    },
    evaluate: function(answer) {
        var pagesTotal = answer.length;
        return {
            pagesTotal: pagesTotal
        }
    }
});



var ReactionTimeTask = Task.extend({
    // tests if the answer contains correct data
    // (it is array of specific length)
    validate: function(answer) {
        return (answer.length > 0);
    },
    evaluate: function(answer) {
        // there is no single "correctness" value
        var cuesTotal = 0;
        var cuesHit = 0;
        var delay = 0;
        var successfulHits = []
        var reactionTime;
        var avgReactionTime = null;
        var bestReactionTime = null;
        for(var i=0; i<answer.length; i++) {
            cuesTotal++;
            if(answer[i].reaction >= 0) {
                cuesHit++;
                successfulHits.push(1);
                reactionTime = answer[i].reaction - answer[i].cue;
                if(bestReactionTime===null || (reactionTime < bestReactionTime)) {
                    bestReactionTime = reactionTime;
                }
                delay += reactionTime;
            } else {
                successfulHits.push(0);
            }
        }
        var avgReactionTime = (cuesHit>0) ? (delay/cuesHit) : null;
        return {
            cuesTotal: cuesTotal,
            cuesHit: cuesHit,
            hitRatio: cuesHit/cuesTotal,
            avgReactionTime: avgReactionTime,
            bestReactionTime: bestReactionTime
        }
    }
});


var BinaryMultiTask = BinaryTask.extend({
    // tests if the answer contains correct data
    // (it is array of specific length)
    validate: function(answer) {
        return (answer.length > 0);
    },
    evaluate: function(answer) {
        // answer should be array with the same length and content as this.sequence
        var correct = false;
        var answeredTotal = 0;
        var answeredCorrectly = 0;
        var correctAnswers = []
        for(var i=0; i<answer.length; i++) {
            answeredTotal++;
            if(answer[i]) {
                answeredCorrectly++;
                correctAnswers.push(1);
            } else {
                correctAnswers.push(0);
            }
        }
        correct = (answeredTotal == answeredCorrectly);
        return {
            correct: correct,
            correctness: answeredCorrectly / answeredTotal,
            // additional information
            answeredTotal: answeredTotal,
            answeredCorrectly: answeredCorrectly,
            // which answers were correct?
            correctAnswers: correctAnswers
        }
    }
});


// game: fill in the gaps in a single sequence
// there is a single valid solution
// if mask is not specified, it is assumed to be [0,0,0...0]
// seq = array of anything (that can be compared by ==)
var SequenceBinaryTask = BinaryTask.extend({
    constructor: function(seq, mask) {
        this.sequence = seq;
        var self = this;
        if(mask) {
            this.mask = mask;                        
        } else {
            this.mask = [];
            this.sequence.forEach(function(item) {
                self.mask.push(0);
            });
        }
    },
    slotCount: function() {
        var sc = 0;
        for(var i=0; i<this.mask.length; i++) {
            if(!this.mask[i]) sc++;
        }
        return sc;
    },
    question: function() {
        var q = this.sequence.slice();
        for(var i=0; i<this.mask.length; i++) {
            if(!this.mask[i]) q[i] = undefined;
        }
        return q;
    },
    // tests if the answer contains correct data
    // (it is array of specific length)
    validate: function(answer) {
        return (answer.length == this.sequence.length);
    },
    // if answer passes validation (which is basically a type check), it can be evaluated
    // answer = original sequence with all gaps filled
    evaluate: function(answer) {
        // answer should be array with the same length and content as this.sequence
        var correct = false;
        var answeredTotal = 0;
        var answeredCorrectly = 0;
        var correctAnswers = []
        for(var i=0; i<this.sequence.length; i++) {
            if(!this.mask[i]) { // 0 in mask - to be filled
                answeredTotal++;
                if(this.sequence[i] == answer[i]) {
                    answeredCorrectly++;
                    correctAnswers.push(1);
                } else {
                    correctAnswers.push(0);
                }
            }
        }
        correct = (answeredTotal == answeredCorrectly);
        return {
            correct: correct,
            correctness: answeredCorrectly / answeredTotal,
            // additional information
            answeredTotal: answeredTotal,
            answeredCorrectly: answeredCorrectly,
            // which answers were correct?
            correctAnswers: correctAnswers
        }
    }
});



var MultiSequenceTask = ScalarTask.extend({
    constructor: function(sequences) {
        this.sequences = [];
        var self = this;
        sequences.forEach(function(s) {
            self.sequences.push(new SequenceBinaryTask(s[0], s[1]));
        });
    },
    validate: function(answers) {
        if(answers.length && answers.length==this.sequences.length) {
            for(var i=0; i<answers.length; i++) {
                if(!this.sequence[i].validate(answers[i])) {
                    return false;
                }
            }
        }
        return true;
    },
    // answer = pair [a,b] of binary sequences N elements shorter than orig. sequences
    evaluate: function(answers) {
        var evals = [];
        var correctness = 0;
        for(var i=0; i<answers.length; i++) {
            var result = this.sequences[i].evaluate(answers[i]);
            correctness += result.correctness;
            evals.push(result);
        }
        return {
            tasks: evals,
            correctness: correctness / answers.length
        }
    }
});


// game: items shown in sequence, one at a time. Indicate whether currently shown item is equal to an item shown N frames back. The answer is an array with N less elements than original sequence.
// there is a single valid solution
var NBackScalarTask = ScalarTask.extend({
    constructor: function(seq, N) {
        this.sequence = seq;
        this.N = N;
    },
    expectedAnswer: function() {
        var expectedAnswer = [];
        for(var i=0; i<this.sequence.length-this.N; i++) {
            if(this.sequence[i+this.N] == this.sequence[i]) {
                expectedAnswer.push(1);
            } else {
                expectedAnswer.push(0);
            }
        }
        return expectedAnswer;
    },
    validate: function(answer) {
        return (answer.length == this.expectedAnswer().length);
    },
    // answer = binary sequence N elements shorter than training sequence
    evaluate: function(answer) {                       
        var answeredCorrectly = 0;
        var correctAnswers = [];
        var ea = this.expectedAnswer();
        for(var i=0; i<answer.length; i++) {
            if(answer[i] == ea[i]) {
                answeredCorrectly++;
                correctAnswers.push(1);
            } else {
                correctAnswers.push(0);
            }
        }
        return {
            correctness: answeredCorrectly / answer.length,
            // additional information
            answeredTotal: answer.length,
            answeredCorrectly: answeredCorrectly,
            // which answers were correct?
            correctAnswers: correctAnswers
        }
    }
});

// take multiple tasks at once and evaluate them together
// compute correctness as average of correctnesses
// compute 'correct' as an AND of 'correct' values
// how to generalize to binary tasks? (AND/OR/M from N...)
// scalar task can be implicitly converted to binary task
// (threshold = 1)
var ParallelScalarTask = ScalarTask.extend({
    constructor: function(tasks, weights) {
        this.tasks = tasks;
        this.weights = weights;
        if(!this.weights) {
            this.weights = [];
            for(var i=0; i<tasks.length; i++) {
                this.weights.push(1);
            }
        }
    },
    validate: function(answers) {
        if(answers.length && answers.length==this.tasks.length) {
            for(var i=0; i<answers.length; i++) {
                if(!this.tasks[i].validate(answers[i])) {
                    return false;
                }
            }
        }
        return true;
    },
    // answer = pair [a,b] of binary sequences N elements shorter than orig. sequences
    evaluate: function(answers) {
        var evals = [];
        var correctness = 0;
        var totalWeight = 0;
        for(var i=0; i<answers.length; i++) {
            var result = this.tasks[i].evaluate(answers[i]);
            correctness += this.weights[i] * result.correctness;
            totalWeight += this.weights[i];
            evals.push(result);
        }
        return {
            tasks: evals,
            correctness: correctness / totalWeight
        }
    }
});


// "abstract" - does nothing....
var ParallelBinaryTask = BinaryTask.extend({
    constructor: function(tasks) {
        this.tasks = tasks;
        this.pst = new ParallelScalarTask(tasks);
    },
    validate: function(answers) {
        return this.pst.validate(answers);
    },
    evaluate: function(answers) {
        var result = this.pst.evaluate(answers);
        return result;
    }
});

var ParallelBinaryAndTask = ParallelBinaryTask.extend({
    constructor: function(tasks) {
        this.base(tasks);
    },
    evaluate: function(answers) {
        var result = this.base(answers);
        result.correct = true;
        result.tasks.forEach(function(te) {
            result.correct = result.correct && te.correct;
        });
        return result;
    }
});

var ParallelBinaryOrTask = ParallelBinaryTask.extend({
    constructor: function(tasks) {
        this.base(tasks);
    },
    evaluate: function(answers) {
        var result = this.base(answers);
        result.correct = false;
        result.tasks.forEach(function(te) {
            result.correct = result.correct || te.correct;
        });
        return result;
    }
});


// specific example of "parallel task"
var NBackDualScalarTask = ScalarTask.extend({
    constructor: function(seqs, N) {
        this.N = N;
        this.task1 = new NBackScalarTask(seqs[0], N);
        this.task2 = new NBackScalarTask(seqs[1], N);
    },
    expectedAnswer: function() {
        return [
            this.task1.expectedAnswer(),
            this.task2.expectedAnswer()
        ];
    },
    validate: function(answers) {
        return answer.length && answer.length==2 && this.task1.validate(answers[0]) && this.task2.validate(answers[1]);
    },
    // answer = pair [a,b] of binary sequences N elements shorter than orig. sequences
    evaluate: function(answers) {
        var val1 = this.task1.evaluate(answers[0]);
        var val2 = this.task2.evaluate(answers[1]);
        return {
            test1: val1,
            test2: val2,
            correctness: (val1.correctness + val2.correctness)/2
        }
    }
});

// task evaluator - evaluates a scalar task, and if
// it reaches correctness >= threshold, it passes
// makes binary task from scalar task
var ThresholdTask = BinaryTask.extend({
    constructor: function(scalarTask, threshold) {
        this.scalarTask = scalarTask;
        this.threshold = threshold;
    },
    // answer - of the same type as in original scalar task
    validate: function(answer) {
        return this.scalarTask.validate(answer);
    },
    // answer - of the same type as in original scalar task
    evaluate: function(answer) {
        var val = this.scalarTask.evaluate(answer);
        if(val) {
            val.correct = val.correctness >= this.threshold;
        }
        return val;
    }
});

// game: fill in the gaps in empty spots in 3x3 grid
// there may be multiple correct solutions
// sum of numbers on rows and cols must be N
// numbers can repeat!
// grid, mask are arrays of 9 elements
var MagicSquareBinaryTask = BinaryTask.extend({
    constructor: function(grid, mask, N, checkDiagonals) {
        this.grid = grid;
        this.mask = mask;
        this.N = N;                        
        this.checkDiagonals = checkDiagonals;
    },
    slotCount: function() {
        var sc = 0;
        for(var i=0; i<this.mask.length; i++) {
            if(this.mask[i]) sc++;
        }
        return sc;
    },
    question: function() {
        var q = this.grid.slice();
        for(var i=0; i<this.mask.length; i++) {
            if(!this.mask[i]) q[i] = undefined;
        }
        return q;
    },
    // answer = array of 9 ints, gaps filled
    validate: function(answer) {
        return (answer.length == this.grid.length);
    },
    // answer = array of 9 ints, gaps filled
    evaluate: function(answer) {
        // answer should be array with the same length and content as this.sequence
        var correct = false;
        var a = answer;
        var sums = [
            // rows
            a[0] + a[1] + a[2],
            a[3] + a[4] + a[5],
            a[6] + a[7] + a[8],
            // columns
            a[0] + a[3] + a[6],
            a[1] + a[4] + a[7],
            a[2] + a[5] + a[8]
        ];
        if(this.checkDiagonals) {
            // diagonals
            sums.push(a[0] + a[4] + a[8]);
            sums.push(a[2] + a[4] + a[6]);
        }

        var correctMask = []
        var nCorrect = 0;
        for(var i=0; i<sums.length; i++) {
            if(sums[i] == this.N) {
                correctMask.push(1);
                nCorrect++;
            } else {
                correctMask.push(0);
            }
        }
        correct = (nCorrect == correctMask.length);
        return {
            correct: correct,
            correctness: nCorrect / correctMask.length,
            // additional information
            // which rows/columns/diagonals were correct?
            correctRowsCols: correctMask
        }
    }
});

// game: given a set of areas (circles, ellipses, rotated ellipses...), answer with an array of hits (circles)
// hits <- intersections between the two
var HitMissScalarTask = BinaryTask.extend({
    // regions = array of arrays
    // either: [ x y r ] - circle
    //         [ x y rx ry ] - ellipse
    //         [ x y rx ry angle ] - rotated ellipse
    constructor: function(regions) {
        this.regions = regions;
    },               
    // calculate matrix of distances between points (centers of answers) and regions   
    // if a circle is touching a region -> distance -> 0
    // if for each region, there exists an answer that dist(region,answer)=0 -> correct solution
    // invalid answers: the answers that do not hit any of the regions
    calculateDistance: function(reg, ans) {
        var cx = reg[0];
        var cy = reg[1];
        var rx = ry = reg[2];
        var angle = 0;
        if(reg.length>3) {
            ry = reg[3];
        }
        if(reg.length>4) {
            angle = reg[4];
        }
        var x = ans[0];
        var y = ans[1];
        var dist = safe_estimate_distance(x, y, rx, ry, cx, cy, angle);
        return Math.max(dist - ans[2], 0);

    },
    // answer = array of circles - [[cx,cy,r], ...] of the same length as array of regions
    validate: function(answer) {
        return (answer.length == this.regions.length);
    },
    evaluate: function(answer) {
        var self = this;
        var correct = false;
        var regionsTotal = this.regions.length;
        var regionsHit = 0;
        var distances = [];
        this.regions.forEach(function(reg) {
            var dd = [];
            distances.push(dd);
            answer.forEach(function(ans) {
                dd.push(self.calculateDistance(reg, ans));
            });                                

        });
        // regions -> rows
        // answers -> columns
        console.log(distances);
        var hitRegions = [];
        // is there a region that cannot be hit by ano of the answers?
        for(var j=0; j<this.regions.length; j++) {
            var missed = true;
            for(var i=0; i<answer.length; i++) {
                    if(distances[j][i]==0) {
                        missed = false;
                        regionsHit++;
                        break;
                    }
            }
            hitRegions.push(missed ? 0 : 1);
        }
        
        // .....

        correct = (regionsTotal == regionsHit);
        return {
            correct: correct,
            correctness: regionsHit/regionsTotal,
            // additional information
            regionsTotal: regionsTotal,
            regionsHit: regionsHit,
            regionsBeenHit: hitRegions
        }
    }
});
