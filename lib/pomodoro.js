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

		// Initialise timer
		this.initTimer(this.pomodoroTime);
};

// Functions for the object
Pomodoro.prototype = {
	// Handle state change
	// Notify the caller
	// todo: fire events or return the states object
	// so others can listen to the object or use the return values
	setState: function(states) {
		for (prop in states) {
			this.state[prop] = states[prop];
		}	

		// Post the resutl back into main thread
		postMessage(this.state);
	},

	// Initialise a timer based on timer passed in
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

	// Toggle timer
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

	// Start the timer
	// also record the start and end system time
	startTimer: function() {
		// Start and end system times
		this.startSystemTime = new moment();
		this.endSystemTime = new moment();
		this.endSystemTime = this.endSystemTime.add(this.momentDuration.valueOf(), 'ms');

		// Run the tick every minutes
		this.interval = setInterval(function() {
			this.tick();
		}.bind(this), 1000);

		// Change the button state text
		this.setState({counting: true});
	},

	// Pause
	// Clear the interval, all states remain unchange
	pauseTimer: function() {
	    clearInterval(this.interval);
	},

	// Clear Timer
	// Reset all states and start a new timer
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

	// Finish timer
	finishTimer: function() {
		// Set the state to finish
		this.setState({finish: true});

		// Clear timer
		this.clearTimer();
	},

	// Tick
	// Count down
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

	// Use system time
	enableSystemTime: function() {
		this.useSystemTime = true;
	},

	// Not use system time
	// Reset the duration moment
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

	// Adjust time
	// Able to change time
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

// Handle caller commands
var p = null;
onmessage = function(event) {
	// Get the incoming data
	var command = event.data[0];
	var arg = event.data.slice(1);

	// Execute commands
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
