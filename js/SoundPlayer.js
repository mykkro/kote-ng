var SoundPlayer = Base.extend({
	constructor: function() {
		this.audio = new Audio('media/Pickup_Coin20.wav');
		this.audio.volume = 0.4;
	},
	playSound: function() {
		this.audio.play();
	}
});

var player = new SoundPlayer();
