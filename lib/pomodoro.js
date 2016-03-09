// Use moment js
importScripts("moment.js");

function Pomodoro(requestTime) {
		// Set the initial state
		this.state = {
			counting: false,
			toggleTimerText: 'Start',
			displayTime: '',
			finish: false,
		};

    // Get the audio
		this.pomodoroTime = requestTime;

		this.initTimer(this.pomodoroTime);
};

Pomodoro.prototype = {
	setState: function(states) {
		for (prop in states) {
			this.state[prop] = states[prop];
		}	

		// Post the resutl back into main thread
		postMessage(this.state);
	},


	initTimer: function(minutes) {
		this.momentDuration = moment.duration(this.pomodoroTime, 'minutes');

		// Set the display time
		this.setState({displayTime: this.getDisplayTime()});
	},


	// Get display time
	getDisplayTime: function() {
		var seconds = this.momentDuration.seconds();
		var minutes = this.momentDuration.minutes();

		// Pad 0
		if (seconds < 10) {
			seconds = '0' + seconds;
		}

		if (minutes < 10) {
			minutes = '0' + minutes;
		}

		return minutes + ':' + seconds;
	},

	toggleTimer: function() {
		// See if this counting or not
		if (this.state.counting) {
			this.setState({counting: false});
			this.setState({toggleTimerText: 'Start'});

			// Pause timer
			this.pauseTimer();
		} else {
			this.setState({counting: true});
			this.setState({toggleTimerText: 'Pause'});

			// Start the timer
			this.startTimer();
		}
	},

	startTimer: function() {
		this.interval = setInterval(function() {
			this.tick();
		}.bind(this), 1000);

		// Change the button state text
		this.setState({counting: true});
	},

	pauseTimer: function() {
    clearInterval(this.interval);
	},

	clearTimer: function() {
		// Pause the timer
		if (this.state.counting) {
			this.pauseTimer();
		}

		// Clear the timer and state
		this.setState({
			counting: false,
			toggleTimerText: 'Start',
			finish: false,
		});

		// Initialise a new timer
		this.initTimer(this.pomodoroTime);
	},

	tick: function() {
		if (this.momentDuration.valueOf() == 0) {
			// Set the state to finish
			this.setState({finish: true});

			// Clear timer
			this.clearTimer();
		} else {
			// Subtract a second from it
			this.momentDuration.subtract(1, 's');

			// Set the state
			this.setState({displayTime: this.getDisplayTime() });
		}
  },
};

var p = null;
onmessage = function(event) {
	console.log("this is web worker - received message");
	console.log(event.data);

	var command = event.data[0];
	var arg = event.data.slice(1);
	if (command == 'init') {
		// Clear the timer if its already there
		if (p) {
			p.clearTimer();
		}
		p = new Pomodoro(arg[0]);
	} else if (command == 'toggle') {
		p.toggleTimer();
	} else if  (command == 'clear') {
		p.clearTimer();
	}
}
