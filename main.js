var allowPopup = false;
var audio = new Audio('http://www.createjs.com/demos/_assets/audio/Game-Shot.ogg');

	// Show notification
function showNotification(title, body, icon) {
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
}

	// Request for notification permission
function requestPopupPermission() {
		Notification.requestPermission(function(result) {
			// Check permission
			if (result === "denied") {
				return;
			} else if (result === 'default' || result === "granted") {
				allowPopup = true;
			}
		});
}

window.onload = function() {

		// Request popup permission
		requestPopupPermission();

		var displayEl = document.getElementById('display-time');
		var toggleEl = document.getElementById('toggle-timer');
		var clearEl = document.getElementById('clear-timer');

		// Web worker to count time, because when the tab is inactive, setInterval run slower
		var myWorker = new Worker("pomodoro.js");
		myWorker.onmessage = function(event) {
			console.log("received message from worker");
			console.log(event.data);
			changeStateEffects(event.data);
		}

		myWorker.onerror = function(event) {
			console.log("there is an error");
			console.log(event);
		}
		
		// Initialise an pomodor
		var requestTime = 1;
		window.onhashchange = function(event) {
			if (window.location.hash.length > 1) {
				requestTime = parseInt(window.location.hash.slice(1));
				myWorker.postMessage(['init', requestTime]);
				myWorker.postMessage(['toggle']);
			}
		}
		myWorker.postMessage(['init', requestTime]);

		// Add events to toggle and clear buttons
		toggleEl.addEventListener('click', function(event) {
			myWorker.postMessage(['toggle']);
		});
		clearEl.addEventListener('click', function(event) {
			myWorker.postMessage(['clear']);
		});

		var changeStateEffects = function(state) {
			if (state.counting) {
				toggleEl.className = 'toggle-timer pause';
				toggleEl.textContent = 'Pause';
			} else {
				toggleEl.className = 'toggle-timer start';
				toggleEl.textContent = 'Start';
			}

			if (state.toggleTimerText) {
				toggleEl.textContent = state.toggleTimerText;
			}

			if (displayEl) {
				displayEl.textContent = state.displayTime;
			}

			// This is finish
			if (state.finish) {
				showNotification('Pomodoro', 'Its time to take a rest');
				audio.play();
			}
		}
}
