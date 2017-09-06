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
		var LAST_WRITE_ROW_CELL = 'Sheet1!K1:L1';
		/**
		 * Checks Cell H1 to determine when the last email scan was, if ever
		 *
		 * @param {string} id Id of spreadsheet to read
		 * @return {Object} returns date, row if they exist, null if not
		 */
		function readLastEmailScanAndNextWriteRowCells(id) {
			return new Promise(function(resolve, reject) {
				gapi.client.sheets.spreadsheets.values.get({ spreadsheetId: id, range: LAST_SCAN_DATE_CELL })
					.then(function(result) {

						if(result.result.values && result.result.values[0].length >= 2)
							return resolve({ date: result.result.values[0][0], row: result.result.values[0][1] });
						return resolve(null);
				});
			});
		}

		function updateLastEmailScanAndNextRowWrite(row, timestamp, id) {
			return new Promise(function(resolve, reject) {
				var values = [
					[timestamp, row]
				];
				var body = { values: values };
				gapi.client.sheets.spreadsheets.values.update({
					spreadsheetId: id,
					range: LAST_SCAN_DATE_CELL,
					resource: body,
					valueInputOption: 'RAW'
				})
				.then(function(result) {
					return resolve(result);
				});
			});
		}

		/**
		 * Processes an array of email data and for each type, takes some action.
		 * apps-sent: writes a row in the sheet
		 * apps-rejected: finds row with company and marks it red
		 * apps-interested: finds row with company and marks it yellow/green
		 * @return {row} The row from which to start writing on the next email scan
		 */
		function writeJobAppsEmails(emailData, row, id) {
			return new Promise(function(resolve, reject) {
				var values = [];
				// for now, just apps-sent
				var appsSentEmails = emailData.filter(data => data.labelName === 'apps-sent');
				appsSentEmails.forEach(email => values.push( [email.date, email.from] ));
				var range = `Sheet1!A${row}:B${row + values.length - 1}`;
				var params = { spreadsheetId: id, range: range, valueInputOption: 'RAW' };
				var body = { values: values };

				gapi.client.sheets.spreadsheets.values.update(params, body)
				.then(function(result) {
					appendPre('apps-sent emails saved to spreadsheet!');
					return resolve(row + values.length - 1);
				});
				// return resolve(row);
			});
		}

		var publicAPI = {
			retrieveAllFiles: retrieveAllFiles,
			createSheetNamed: createSheetNamed,
			findSheetNamed: findSheetNamed,
			readLastEmailScanAndNextWriteRowCells: readLastEmailScanAndNextWriteRowCells,
			updateLastEmailScanAndNextRowWrite: updateLastEmailScanAndNextRowWrite,
			writeJobAppsEmails: writeJobAppsEmails
		};
		return publicAPI;
	})();

	var Mail = (function() {
		/* Really the magic of this module: the search query that will find all applications-sent emails */
		var apply_q = '(received application) OR "you applied to"'; //'("submitting" "application")'
		// var rejected_q = '(not move forward)';

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

		function scanAll() {
			return new Promise(function(resolve, reject) {
				var label_based_query = 'label:apps-rejected OR label:apps-sent OR label:apps-interested'; // TODO - look 2 lines down
				var apiParams = { userId: 'me', q: apply_q, maxResults: 5000 };
				apiParams.q = label_based_query; // TODO - implement machine learning and use text classification for scanning emails, not manually given labels
				gapi.client.gmail.users.messages.list(apiParams)
					.then(function(response) {
						appendPre('Scanned all messages...\n\n');
						return resolve(response.result.messages || []);
					});
			});
		}

		// Study this
		function getMessagesByIds(ids) {
			return new Promise(function(resolve, reject) {
				if(ids.length === 0)
					return resolve([]);
				var ajaxCallsRemaining = ids.length;
				var max = ajaxCallsRemaining;
				var returnedData = [];

				for(var i = 0; i < ids.length; i++) {
					gapi.client.gmail.users.messages.get({ userId: 'me', id: ids[i] })
						.then(function(response) {
							returnedData.push(response);
							// console.log(response);
							--ajaxCallsRemaining;
							if(ajaxCallsRemaining <= 0) {
								return resolve(returnedData);
							}
						});
				}
			});
		}

		function getLabel(id) {
			return gapi.client.gmail.users.labels.get({ id: id, userId: 'me' });
		}

		/**
		 * Gets the real names of the labels for all the labels of a set of emails and returns them in a Promise
		 * @param {Array} emails Array of email objects from Google Gmail API
		 * @return {EmailArray} {LabelMapping} EmailArray - the array of emails passed in. LabelMapping - the mapping of cryptic label_id to label_name
		 */
		function fetchLabelNamesOfEmails(emails) {
			return new Promise(function(resolve, reject) {
				var set = new Set();
				// add all the cryptic label_ids to the set
				emails.map(eml => eml.result.labelIds).forEach(idsArr => idsArr.forEach(id => set.add(id)));
				var ajaxCallsRemaining = set.size;
				var mapping = {};
				set.forEach(labelId => {
					getLabel(labelId)
					.then(res => {
						ajaxCallsRemaining--;
						var targetLabels = ['apps-sent', 'apps-rejected', 'apps-interested'];
						if(targetLabels.includes(res.result.name)) {
							mapping[res.result.id] = res.result.name;
						}
						if(ajaxCallsRemaining <= 0) {
							return resolve({ emails: emails, labelMapping: mapping });
						}
					});
				});
			});
		}

		var publicAPI = {
			scanAll: scanAll,
			scanAfter: scanAll,
			getMessagesByIds: getMessagesByIds,
			fetchLabelNamesOfEmails: fetchLabelNamesOfEmails
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

			var JOB_APPS_ORGANIZER_SHEET_NAME = 'fake2';
			var _sheetId;
			var _trimmedEmailData;
			var _row;
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
				.then(function readLastEmailScanAndNextWriteRowCells(sheetID) {
					return new Promise(function(resolve, reject) {
						Sheets.readLastEmailScanAndNextWriteRowCells(sheetID)
						.then(function(result) {
							_row = 2;
							if(result) {
								var __row = parseInt(result.row);
								if(__row === __row && __row > 2) {
									_row = __row;
								}
							}

							return resolve(result ? result.date : null);
						})
					});
				})
				.then(function handleLastEmailScanReadResult(date) {
					appendPre(date ? 'last email scan was on ' + date : 'No email scans yet');
					return Promise.resolve(date ? new Date(date) : null);
				})
				.then(function scanMailAfter(date) {
					return date == null ? Mail.scanAll() : Mail.scanAfter(date);
				})
				.then(function getMessagesByIds(emailMinimalData) {
					//
					return Mail.getMessagesByIds(emailMinimalData.map(function(email) { return email.id }));
				})
				.then(function fetchLabelNamesOfEmails(allResponses) {

					return Mail.fetchLabelNamesOfEmails(allResponses);
				})
				.then(function replaceEmailLabelIDsWithLabelNames(emailsAndLabelMapping) {
					var mapping = emailsAndLabelMapping.labelMapping;
					emailsAndLabelMapping.emails.forEach(function addLabelNameField(eml) {
						var labelIds = eml.result.labelIds;
						for(var i = 0; i < labelIds.length; i++) {
							if(mapping[labelIds[i]]) {
								eml.result.labelName = mapping[labelIds[i]];
								return;
							}
						}
					});
					delete emailsAndLabelMapping.emails[0].result.labelIds;
					return emailsAndLabelMapping.emails;
				})
				.then(function trimEmailJSONFat(allResponses) {
					appendPre('Done fetching all ' + allResponses.length + ' messages!\nNow trimming email json');
					var trimmedEmailData = allResponses.map(trimEmailJsonFat);
					_trimmedEmailData = trimmedEmailData; // save it here but next promise in flow doesnt handle this data so we want to persist it
					return Promise.resolve(_trimmedEmailData);
				})
				.then(function writeResults(trimmedEmailData) {
					var startRow = _row;
					return Sheets.writeJobAppsEmails(trimmedEmailData, startRow, _sheetId)
				})
				.then(function updateLastEmailScanAndNextRowWrite(row) {
					return Sheets.updateLastEmailScanAndNextRowWrite(row + 1, new Date(), _sheetId);
				})
				.then(function printEmailScanAndRowWriteUpdateResult(result) {
					console.log(result);
					appendPre( result.status === 200 ? 'Saved most recent email scan and next write row!' : 'Failed to save most recent email scan' );
				})
				.catch(function(errorMsg) {
					//
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

	/**
	 * Email JSON comes with alot of stuff we wont use. Only take what we need
	 * @param {Email} email The emailData we'll be trimming
	 * @return {LighterEmail} A new object with just the fields we'll be using
	 */
	function trimEmailJsonFat(email) {
		var headers = email.result.payload.headers;
		var lighterEmail = { date: null, from: null }; // Subject to expand as app grows in complexity
		for(var i = 0; i < headers.length; i++) {
			if(lighterEmail.data && lighterEmail.from)
				break;
			if(headers[i].name === 'Date')
				lighterEmail.date = headers[i].value;
			if(headers[i].name === 'From')
				lighterEmail.from = headers[i].value
		}
		lighterEmail.labelName = email.result.labelName;
		return lighterEmail;
	}


	return handleClientLoad;
})();
