import Sheets from './Sheets';
import Mail from './Mail';
import { appendPre, clearPre } from './UI';
import { trimEmailJsonFat, prettifyFromHeaders, prettifyDateHeader } from './EmailTransformer';


var CLIENT_ID = '643118581198-1ahtvd2u2o98l2hur59mrctu60km0gb7.apps.googleusercontent.com';
// Array of API discovery doc URLs for APIs used by the quickstart - I guess this adds namespaces (gmail, sheets) to the gapi.client object
// because we were allowed to access them and make requests with them before we added the necessary scopes, we just received 403 responses
var DISCOVERY_DOCS = ['https://sheets.googleapis.com/$discovery/rest?version=v4', 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest', 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
// Authorization scopes required by the API; multiple scopes can be included, separated by spaces. - tells googles servers that your app/clientID
// can make certain requests
var SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/drive";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

var already_ran = false; // this hidden flag will ensure that the globally-exposed handleClientLoad function cant
// do anything if run from the command line
/**
 * On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() { // yeah, this is called by onload attribute of script tag that loads google's js. this is called after google's js executes
	if(!already_ran) {
		already_ran = true;
		gapi.load('client:auth2', initClient);
	} else {
		console.log('already ran, sorry ;)');
	}
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

		var JOB_APPS_ORGANIZER_SHEET_NAME = 'fake31';
		var _trimmedEmailData;

		Sheets.initWithSheetNamed(JOB_APPS_ORGANIZER_SHEET_NAME)
		.then(id => appendPre('Sheet ID: ' + id))
		.then(Sheets.readLastScanMetaData)
		.then(metaData => { metaData ? appendPre('Date: ' + metaData.date + '\nRow: ' + metaData.row) : appendPre('Brand new sheet, no meta data yet')})
		.then(Sheets.readAllCells)
		.then(cells => appendPre(`Loaded in ${cells.length} job app rows into memory...`))
		.then(Sheets.getMetaData).then(metaData => metaData.date)
		.then(Mail.loadEmailsAfter)
		.then(function _trimEmailJsonFat(messages) {
			let totalNewMessages = messages.apps_sent.length + messages.apps_rejected.length + messages.apps_interested.length;
			appendPre(`Loaded ${totalNewMessages} new emails...`);
			messages.apps_sent = messages.apps_sent.map( trimEmailJsonFat );
			messages.apps_rejected = messages.apps_rejected.map ( trimEmailJsonFat );
			messages.apps_interested = messages.apps_interested.map( trimEmailJsonFat );
			return messages;
		})
		.then(function _prettifyFromAndDateHeaders(messages) {
			messages.apps_sent = messages.apps_sent.map( prettifyFromHeaders ).map( prettifyDateHeader );
			return messages;
		})
		.then(Sheets.recordAppStatusesFromEmails)
		.then(res => console.log(res))
		.then(Sheets.writeLastScanMetaData)
		.then(result => { appendPre('Updated meta data'); console.log(result); })
		.then(appendPre.bind(null, 'Done!'))
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

// Expose handleClientLoad to the window/global scope so that 
// google's script can run this onload
window.handleClientLoad = handleClientLoad;

/* Note:
	This app sort of has a blind spot. If an email scan is conducted on 9/9/2017,
		the sheet will record the last update timestamp as 9/9/2017.
		The next email scan will scan for emails after that date, so if a user
		were to apply to a job on the night of 9/9/2017, guess what?
		It wont be picked up by the query.

		Potential solutions:
			Once we're scanning emails by text analysis:
				we can mark scanned emails with 'processed' label and start our search on a day before the current day.
				That way, we might pick up already-processed emails but we'll know to not do anything with them because
				of their label.
			Now that I think about it, nothings really stopping me from using that strategy right now.
*/
