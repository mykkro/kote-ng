Raphael.fn.multitext = function(o) {

    var getWords = function(paper, style, line) {
        //console.log("Get words:", style, line);
        var words = line.trim().split(/\s+/);
        //console.log("Words:", words);
        var out = [];
        words.forEach(function(w) {
            var rendered = paper.text(0, 0, w).attr(style);
            var bbox = rendered.getBBox();
            //console.log(w, bbox);
            out.push({"word": w, "x": 0, "y": 0, "width": bbox.width, "height": bbox.height});
            rendered.remove();
        });
        return out;
    }

    var renderParagraph = function(paper, o) {
        //console.log("Rendering paragraph", o);
        var par = paper.set();
        var inputLines = o.text.trim().split("\n");
        var outputRows = [];
        var lineStyle = Object.assign({}, o.textStyle, {"text-anchor":"start"});
        //console.log("Lines:", inputLines, lineStyle);
        inputLines.forEach(function(l) {
            outputRows.push(getWords(paper, lineStyle, l));

        });
        console.log("outputRows:", outputRows);
        // each output row contains a list of words
        var fontSize = lineStyle["font-size"];
        var fontHeight = 1.2 * fontSize; // should be equal to bbox.height
        var spaceWidth = 0.4*fontHeight;
        var wrappedOutputRows = [];
        outputRows.forEach(function(or) {
            var row = [];
            var totalWidth = 0;
            // split list of words to rows that have maximum width o.maxWidth
            if(or.length > 0) {
                var i = 0;
                row.push(or[i]);
                totalWidth += or[i].width;
                i++;
                while(i < or.length) {
                    // are there any words left?
                    var word = or[i];
                    if(totalWidth + spaceWidth + word.width <= o.maxWidth) {
                        // the word will fit in...
                        row.push({"space":" ", x: 0, y: 0, width: spaceWidth});
                        row.push(word);
                        totalWidth += spaceWidth + word.width;
                    } else {
                        wrappedOutputRows.push({"row":row, "totalWidth": totalWidth});
                        row = [word];
                        totalWidth = word.width;
                    }
                    i++;
                }
            }
            wrappedOutputRows.push({"row":row, "totalWidth": totalWidth});
        });
        //console.log("Font height:", fontHeight);
        //console.log("Wrapped output rows:", wrappedOutputRows);
        // render wrapped output rows
        var x0 = o.x;
        var y0 = o.y;
        wrappedOutputRows.forEach(function(wor) {
            var x = x0;
            if(o.textStyle["text-anchor"] == "middle") {
                x = x0 + (o.maxWidth - wor.totalWidth)/2;
            } else if(o.textStyle["text-anchor"] == "end") {
                x = x0 + (o.maxWidth - wor.totalWidth);
            }
            wor.row.forEach(function(w) {
                //console.log("Rendering word:", w);
                if("word" in w) {
                    par.push(paper.text(x, y0, w.word).attr(lineStyle));
                }
                x += w.width;
            });
            y0 += o.lineHeight;
        });
        return par;
    }

    return renderParagraph(this, o);

}
