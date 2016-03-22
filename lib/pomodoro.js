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

		// Use system time when the window is not focus
		// i.e switch to another tab
		this.useSystemTime = false;

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
		this.momentDuration = moment.duration(minutes, 'minutes');

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
		this.startSystemTime = new moment();
		this.endSystemTime = new moment();
		this.endSystemTime = this.endSystemTime.add(this.momentDuration.valueOf(), 'ms');

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

	finishTimer: function() {
		// Set the state to finish
		this.setState({finish: true});

		// Clear timer
		this.clearTimer();
	},

	tick: function() {
		// Use system time when tab is not focus 
		if (this.useSystemTime) {
			var currentTime = new moment();
			if (currentTime.unix() > this.endSystemTime.unix()) {
				this.finishTimer();
			}
		} else {
			if (this.momentDuration.valueOf() == 0) {
				this.finishTimer();
			} else {
				// Subtract a second from it
				this.momentDuration.subtract(1, 's');

				// Set the state
				this.setState({displayTime: this.getDisplayTime() });
			}
		}
	},

	enableSystemTime: function() {
		this.useSystemTime = true;
	},

	disableSystemTime: function() {
		this.useSystemTime = false;

		if (this.state.counting) {
			// Check if its finish or not
			// Calculate the time remaining and reset the timer
			var currentTime = new moment();
			var remainingSeconds = this.endSystemTime.unix() - currentTime.unix();
			if (remainingSeconds > 1) {
				this.momentDuration = moment.duration(remainingSeconds, 's');
			} else {
				this.finishTimer();
			}
		}
	},

	adjustTime: function(delta) {
		// Plus or minus
		// The duration and system end time
		if (this.state.counting) {
			if (delta > 0) {
				this.momentDuration.add(delta, 'minutes');
				this.endSystemTime.add(delta, 'minutes');
			} else {
				this.momentDuration.subtract(-delta, 'minutes');
				this.endSystemTime.subtract(-delta, 'minutes');
			}
		} else {
			// Init a new timer
			this.pomodoroTime += delta;
			this.initTimer(this.pomodoroTime);
		}
	}
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
	} else if (command == 'windowFocus') {
		if (p) {
			p.disableSystemTime();
		}
	} else if (command == 'windowNotFocus') {
		if (p) {
			p.enableSystemTime();
		}
	} else if (command == 'plusTime') {
		if (p) {
			p.adjustTime(1);
		}
	} else if (command == 'minusTime') {
		if (p) {
			p.adjustTime(-1);
		}
	}
}
