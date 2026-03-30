var testWidgets = function(r) {
    var rr = new RectWidget(200, 200, 0);
    rr.setSize(100, 100);

    var tt = new TextWidget(200, 20, "start", "II IIIm\nMM NNOP\nREWQ XC@#$\n56675");
    var tt2 = new TextWidget(200, 30, "middle", "fcuk");
    tt2.setPosition(0, 200);


    var ii1 = new ImageWidget("resources/1/image.jpg", 600, 300);
    ii1.setPosition(100, 300);
    ii1.setSize(200, 200);

    var cc = new CircleWidget(100);
    cc.setPosition(100, 100);
    cc.setRadius(50);

    var pp = new PieWidget(100, -90, 60);
    pp.setPosition(50, 100);
    pp.setAngles(80, 90);

    var cli = new Clickable(pp);
    ////cli.setPosition(300, 300);
}
