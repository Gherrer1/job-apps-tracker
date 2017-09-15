/**
 * Append a pre element to the body containing the given message as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in the pre element.
 */
export function appendPre(message) {
	var pre = document.getElementById('content');
	var textContent = document.createTextNode(message + '\n');
	pre.appendChild(textContent);
}

/* removes all the text from the pre element */
export function clearPre() {
	var pre = document.getElementById('content');
	pre.innerHTML = '';
}