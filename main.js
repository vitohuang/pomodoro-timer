function Pomodoro(requestTime) {

    // Get the audio
    this.audio = new Audio('http://www.createjs.com/demos/_assets/audio/Game-Shot.ogg');
		this.pomodoroTime = requestTime;
		this.allowPopup = false;

		this.initTimer(this.pomodoroTime);

		// Set the initial state
		this.state = {
			toggleTimerText: 'Start',
			counting: false,
			displayTime: this.getDisplayTime(),
		};

		// Request popup permission
		this.requestPopupPermission();

		this.displayEl = document.getElementById('display-time');
		this.toggleEl = document.getElementById('toggle-timer');
		this.clearEl = document.getElementById('clear-timer');

		// Add events
		this.addEvents();

		// Set up the initial result for the current state 
		this.changeStateEffects();
};

Pomodoro.prototype = {
	setState: function(states) {
		for (prop in states) {
			this.state[prop] = states[prop];
		}	

		this.changeStateEffects();
	},

	changeStateEffects: function() {
		if (this.state.counting) {
			this.toggleEl.className = 'toggle-timer start';
			this.toggleEl.textContent = 'Pause';
		} else {
			this.toggleEl.className = 'toggle-timer pause';
			this.toggleEl.textContent = 'Start';
		}

		if (this.state.toggleTimerText) {
			this.toggleEl.textContent = this.state.toggleTimerText;
		}

		if (this.displayEl) {
			this.displayEl.textContent = this.getDisplayTime();
		}
	},

	initTimer: function(minutes) {
		this.momentDuration = moment.duration(this.pomodoroTime, 'minutes');
	},

	addEvents: function() {

		this.toggleEl.addEventListener('click', this.toggleTimer.bind(this));
		this.clearEl.addEventListener('click', this.clearTimer.bind(this));

		document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this), false);
	},

	handleVisibilityChange: function(event) {
		if (document.hidden) {
			// the tab is not not in focus
			console.log("tab is not focus");
		} else {
			console.log("tab is focus");
		}	
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

	// Show notification
	showNotification: function(title, body, icon) {
		// Default title
		var t = title || "Hi";

		// Notification options
		var options = {
			body: body || "body",
			icon: icon || ""
		};

		// Show it
		var n = new Notification(title, options);

		// Close it when its clicked
		n.onclick = function() {
			n.close();
		}
	},

	// Request for notification permission
	requestPopupPermission: function() {
		Notification.requestPermission(function(result) {
			// Check permission
			if (result === "denied") {
				return;
			} else if (result === 'default' || result === "granted") {
				this.allowPopup = true;
			}
		}.bind(this));
	},

	toggleTimer: function(event) {
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
    this.interval = setInterval(() => {
				this.tick();
		}, 1000);

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
		this.initTimer(this.pomodoroTime);
		this.setState({
			counting: false,
			toggleTimerText: 'Start',
			displayTime: this.getDisplayTime(),
		});
	},

	tick: function() {
		//console.log("ticking");
		//console.log(this.momentDuration.seconds());
		if (this.momentDuration.valueOf() == 0) {
			// Check if can show popup
			if (this.allowPopup) {
				this.showNotification('Pomodoro', 'Its time to take a rest');
			}

      // Play a sound
      this.audio.play();

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

window.onload = function() {
	var p = new Pomodoro(1);
};
