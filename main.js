console.log("Notification");

function showNotification(title, body, icon) {
	// Default title
	var t = title || "Hi";

	// Notification options
	var options = {
		body: body || "body",
		icon: icon || ""
	};
	console.log(options);

	// Show it
	var n = new Notification(title, options);

	// Close it when its clicked
	n.onclick = function() {
		n.close();
	}
}

// Request for notification permission
Notification.requestPermission(function(result) {
	console.log(result);
	// Check permission
	if (result === "denied") {
		console.log("No permission");
		return;
	} else if (result === 'default' || result === "granted") {
		showNotification();
		console.log("Notify");
	}
});
