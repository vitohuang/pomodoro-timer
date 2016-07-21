// Global for popups
var allowPopup = false;

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
			window.focus();
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

		// Dom delements for timer states
		var displayEl = document.getElementById('display-time');
		var toggleEl = document.getElementById('toggle-timer');
		var clearEl = document.getElementById('clear-timer');

		// Web worker to count time, because when the tab is inactive, setInterval run slower
		var myWorker = new Worker("lib/pomodoro.js");
		myWorker.onmessage = function(event) {
			changeStateEffects(event.data);
		}
		myWorker.onerror = function(event) {
		}
		
		// Set timmer using the hash
		window.onhashchange = function(event) {
			if (window.location.hash.length > 1) {
				var requestTime = parseInt(window.location.hash.slice(1));
				myWorker.postMessage(['init', requestTime]);
				myWorker.postMessage(['toggle']);
			}
		}

		// Initialise an pomodor
		var requestTime = 25;
		if (window.location.hash.length > 1) {
				requestTime = parseInt(window.location.hash.slice(1));
		}
		myWorker.postMessage(['init', requestTime]);

		// Add events to toggle and clear buttons
		toggleEl.addEventListener('click', function(event) {
			myWorker.postMessage(['toggle']);
		});
		clearEl.addEventListener('click', function(event) {
			myWorker.postMessage(['clear']);
		});

		// Handle keyboard shortcuts
		var handleKeyDown = function(event) {
			// key - s
			if (event.keyCode == 83) {
				myWorker.postMessage(['toggle']);
			}

			// key - p
			if (event.keyCode == 80) {
				myWorker.postMessage(['toggle']);
			}

			// key - c
			if (event.keyCode == 67) {
				myWorker.postMessage(['clear']);
			}

			// key - up arrow
			if (event.keyCode == 38) {
				myWorker.postMessage(['plusTime']);
			}

			// key - down arrow
			if (event.keyCode == 40) {
				myWorker.postMessage(['minusTime']);
			}

			// key - 1: 5 minutes 
			if (event.keyCode == 49) {
				myWorker.postMessage(['clear']);
				myWorker.postMessage(['init', 5]);
				myWorker.postMessage(['toggle']);
			}

			// key - 1: 2 minutes 
			if (event.keyCode == 50) {
				myWorker.postMessage(['clear']);
				myWorker.postMessage(['init', 2]);
				myWorker.postMessage(['toggle']);
			}

			// key - 1: 25 minutes 
			if (event.keyCode == 51) {
				myWorker.postMessage(['clear']);
				myWorker.postMessage(['init', 25]);
				myWorker.postMessage(['toggle']);
			}
		}
		window.onkeydown = handleKeyDown;

		// See if the current window is active or not
		window.onblur = function(event) {
			myWorker.postMessage(['windowNotFocus']);
		}
		window.onfocus = function(event) {
			myWorker.postMessage(['windowFocus']);
		}

		// Update dom or notificaton when the state changed
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
				document.getElementById('sound').play();
			}
		}
}
