/**
 * Email JSON comes with alot of stuff we wont use. Only take what we need
 * @param {Email} email The emailData we'll be trimming
 * @return {LighterEmail} A new object with just the fields we'll be using
 */
export function trimEmailJsonFat(email) {
	var headers = email.result.payload.headers;
	var snippet = email.result.snippet;
	var lighterEmail = { date: null, from: null, snippet: snippet }; // Subject to expand as app grows in complexity
	for(var i = 0; i < headers.length; i++) {
		if(lighterEmail.data && lighterEmail.from)
			break;
		if(headers[i].name === 'Date')
			lighterEmail.date = headers[i].value;
		if(headers[i].name === 'From')
			lighterEmail.from = headers[i].value
	}
	return lighterEmail;
}

function prettifyFromLinkedIn(email) {
	var split = email.snippet.split('Good luck!');
	var split2 = split[1].split('Applied');
	var newFrom = split2[0].trim();
	email.from = newFrom;
}

export function prettifyFromHeaders(email) {
	var from = email.from;
	// handle linkedin 
	if(from === 'LinkedIn <jobs-listings@linkedin.com>')
		prettifyFromLinkedIn(email);

	return email;
}