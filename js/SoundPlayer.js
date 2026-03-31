class SoundPlayer extends Base {
	constructor() {
		super();
		this.audio = new Audio('media/Pickup_Coin20.wav');
		this.audio.volume = 0.4;
	}
	playSound() {
		this.audio.play();
	}
}

var player = new SoundPlayer();
