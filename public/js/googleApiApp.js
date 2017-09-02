var handleClientLoad = (function() {

	var Sheets = (function() {
		/**
		 * Finds a file by the name passed in
		 *
		 * @param {string} name The name of the file to find
		 */
		function findSheetNamed(name) {
			return new Promise(function(resolve, reject) {
				var request = gapi.client.drive.files.list({ q: `mimeType="application/vnd.google-apps.spreadsheet" and name="${name}" and trashed=false` });
				request.execute(function(response) {
					if(response.error) {
						return reject(response.error.message);
					}

					return (response.files && response.files.length > 0) ? resolve(response.files[0]) : resolve(null);
				});
			});
		}

		/**
		 * Creates the job-apps-organizer sheet that we will populate with sent job applications data
		 *
		 * @param {string} name The name of the to-be-created sheet.
		 */
		function createSheetNamed(name) {
			return new Promise(function(resolve, reject) {
				var spreadsheetProperties = { title: name };
				var spreadsheetBody = { properties: spreadsheetProperties };
				var request = gapi.client.sheets.spreadsheets.create({}, spreadsheetBody);
				request.then(function(response) {
					return resolve(response);
				});
			});
		}

		/**
		 * Retreive a list of File resources.
		 *
		 * @param {Function} callback Function to call when the request is complete.
		 */
		function retrieveAllFiles(callback) {
			// @param {Object} request Request object on which to call execute()
			// @param {Array} result Array on which to append a page's worth of results until we've received all files.
			var retrievePageOfFiles = function(request, result) {
				request.execute(function(response) {
					result = result.concat(response.files);
					var nextPageToken = response.nextPageToken;
					if(nextPageToken) {
						request = gapi.client.drive.files.list({ q: 'mimeType="application/vnd.google-apps.spreadsheet"', pageToken: nextPageToken });
						retrievePageOfFiles(request, result);
					} else {
						callback(result);
					}
				});
			};
			var initialRequest = gapi.client.drive.files.list({ q: 'mimeType="application/vnd.google-apps.spreadsheet"' });
			retrievePageOfFiles(initialRequest, []);
		}

		var LAST_SCAN_DATE_CELL = 'Sheet1!J1:K1';
		/**
		 * Checks Cell H1 to determine when the last email scan was, if ever
		 *
		 * @param {string} id Id of spreadsheet to read
		 */
		function readLastEmailScan(id) {
			return new Promise(function(resolve, reject) {
				gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: id, range: LAST_SCAN_DATE_CELL })
					.then(function(result) {
						if(result.result.values && result.result.values.length > 0) {
							// console.log(typeof result.result.values[0][0]);
							return resolve(result.result.values[0][0]);
						}
						return resolve('');
				});
			});
		}

		function writeLastEmailScan(id) {
			return new Promise(function(resolve, reject) {
				var values = [
					[new Date()]
				];
				var body = {
					values: values
				};
				gapi.client.sheets.spreadsheets.values.update({
					spreadsheetId: id,
					range: LAST_SCAN_DATE_CELL,
					resource: body,
					valueInputOption: 'RAW'
				})
					.then(function(result) {
						return resolve(result);
					})
			});
		}

		var publicAPI = {
			retrieveAllFiles: retrieveAllFiles,
			createSheetNamed: createSheetNamed,
			findSheetNamed: findSheetNamed,
			readLastEmailScan: readLastEmailScan,
			writeLastEmailScan: writeLastEmailScan
		};
		return publicAPI;
	})();

	var Mail = (function() {
		// Print all labels in the authorized user's inbox. If no labels are found an appropriate message is printed.
		function listLabels() {
			return new Promise(function(resolve, reject) {
				gapi.client.gmail.users.labels.list({
					'userId': 'me'
				}).then(function(response) {
					var labels = response.result.labels;
					// appendPre('Labels:');

					return resolve(labels);
				});
			});
		}

		var publicAPI = {
			scanAll: listLabels,
			scanAfter: listLabels
		};
		return publicAPI;
	})();

	var CLIENT_ID = '643118581198-1ahtvd2u2o98l2hur59mrctu60km0gb7.apps.googleusercontent.com';

	// Array of API discovery doc URLs for APIs used by the quickstart - I guess this adds namespaces (gmail, sheets) to the gapi.client object
	// because we were allowed to access them and make requests with them before we added the necessary scopes, we just received 403 responses
	var DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4', 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest', 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];

	// Authorization scopes required by the API; multiple scopes can be included, separated by spaces. - tells googles servers that your app/clientID
	// can make certain requests
	var SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive";

	var authorizeButton = document.getElementById('authorize-button');
	var signoutButton = document.getElementById('signout-button');

	/**
	 * On load, called to load the auth2 library and API client library.
	 */
	function handleClientLoad() { // yeah, this is called by onload attribute of script tag that loads google's js. this is called after google's js executes
		gapi.load('client:auth2', initClient);
	}

	/**
	 * Initializes the API client library and sets up sign-in state listeners.
	 */
	function initClient() {
		gapi.client.init({
			discoveryDocs: DISCOVERY_DOCS,
			clientId: CLIENT_ID,
			scope: SCOPES
		}).then(function() { // after we've initialized the client library
			// listen for sign-in state changes
			gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

			// handle the initial sign-in state.
			updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
			authorizeButton.onclick = handleAuthClick;
			signoutButton.onclick = handleSignoutClick;
		});
	}

	/* *
	 * Called when the signed in status changes, tto update the UI appropriately. After a sign=in, the API is called
	 */
	function updateSigninStatus(isSignedIn) {
		if(isSignedIn) {
			authorizeButton.style.display = 'none';
			signoutButton.style.display = 'block';
			/* Essentially where all the magic happens. Once app acknowledges that user is signed in, the app can start running. */

			appendPre('Logged in, looking for your organizer sheet...');

			var JOB_APPS_ORGANIZER_SHEET_NAME = 'fake1';
			var _sheetId;
			Sheets.findSheetNamed(JOB_APPS_ORGANIZER_SHEET_NAME)
				.then(function createSheetIfDoesntExist(result) {
					appendPre('Done searching for spreadsheet');
					if(!result)
						appendPre('Didnt find spreadsheet named ' + JOB_APPS_ORGANIZER_SHEET_NAME + ', creating one...');
					return result ? result.id : Sheets.createSheetNamed(JOB_APPS_ORGANIZER_SHEET_NAME);
				})
				.then(function parseSheetID(sheetID) {
					if(typeof sheetID === 'object') {
						let newlyCreatedSheet = sheetID;
						sheetID = newlyCreatedSheet.result.spreadsheetId;
					}
					_sheetId = sheetID;
					return sheetID; // string
				})
				.then(function checkLastEmailScan(sheetID) {
					appendPre('Your spreadsheets ID is ' + sheetID);
					return Sheets.readLastEmailScan(sheetID);
				})
				.then(function handleLastScanReadResult(result) {
					appendPre(result ? 'last email scan was on ' + result : 'No email scans yet');
					return Promise.resolve(result ? new Date(result) : null);
				})
				.then(function scanAfter(date) {
					console.log('Date: ', date, typeof date);
					return date == null ? Mail.scanAll() : Mail.scanAfter(date);
				})
				.then(function handleEmails(emails) {
					console.log(emails);
				})
				.then(function writeScanTimestamp() {
					return Sheets.writeLastEmailScan(_sheetId);
					// return Promise.resolve();
				})
				.then(function(result) {
					console.log(result);
				})
				.catch(function(errorMsg) {
					console.log(errorMsg);
				});
		} else {
			authorizeButton.style.display = 'block';
			signoutButton.style.display = 'none';
		}
	}

	/**
	 * Sign in the user upon button click
	 */
	function handleAuthClick(event) {
		gapi.auth2.getAuthInstance().signIn();
	}

	/**
	 * Sign out the user upon button click.
	 */
	function handleSignoutClick(event) {
		gapi.auth2.getAuthInstance().signOut();
		clearPre();
	}

	/**
	 * Append a pre element to the body containing the given message as its text node. Used to display the results of the API call.
	 *
	 * @param {string} message Text to be placed in the pre element.
	 */
	function appendPre(message) {
		var pre = document.getElementById('content');
		var textContent = document.createTextNode(message + '\n');
		pre.appendChild(textContent);
	}

	/* removes all the text from the pre element */
	function clearPre() {
		var pre = document.getElementById('content');
		pre.innerHTML = '';
	}

	return handleClientLoad;
})();
