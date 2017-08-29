// console.log('hey :)');
function onSignIn(googleUser) {
	var id_token = googleUser.getAuthResponse().id_token; // use if we need to send to server
	var xhr = new XMLHttpRequest();
	xhr.open('POST', 'http://localhost:3000/tokens');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		console.log('Signed in as: ' + xhr.responseText);
	};
	xhr.send('idtoken=' + id_token);

	var profile = googleUser.getBasicProfile();
	console.log('ID: ' + profile.getId()); // dont send to backend! use an ID token instead
	console.log('Name: ' + profile.getName());
	console.log('Image URL: ' + profile.getImageUrl());
	console.log('Email: ' + profile.getEmail()); // null if email scope is not present
}

function signOut() {
	/* gapi is added to window object as a result of loading the platform.js script */
	var auth2 = gapi.auth2.getAuthInstance();
	auth2.signOut().then(function() {
		console.log('User signed out.');
	});
}