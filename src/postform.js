class Postform {
	constructor(form) {
		// Setup default config
		this.config = {
			apiUrl: `http://localhost:4000`
		};

		// Get form element
		this.form = form;
		this.token = this.getFormToken();

		console.log(this.getValidationEndpoint());

		// Prevent the browser doing native validation if we're using this class
		this.form.setAttribute('novalidate', true);

		// Setup submit listener
		this.form.addEventListener('submit', this.validate.bind(this));

		// Cleanup
		this.form.removeAttribute('postform');
		this.form.classList.add('postform');
	}

	validate(event) {
		event.preventDefault();

		// Reset the form
		this.reset();

		// Setup form data
		let data = new FormData(this.form);

		this.send(data).then((response) => {
			// All good, submit the form
			if (response.code === 200) {
				this.form.submit();
			} else {
				this.handleValidationErrors(response);
			}
		});
	}

	/**
	 * Handle Validation Errors
	 * @param {object} response
	 */
	handleValidationErrors(response) {
		// Handle non-input related errors
		if (response.code !== 400) {
			this.setAlert('error', response.message || response.data.message);
		} else {
			this.setInputState(response.data.errors);
		}
	}

	/**
	 * Set Input State
	 */
	setInputState(inputs) {
		for (let field in inputs) {
			// Find the input
			let fieldInput = this.form.querySelector(`[name="${field}"]`);

			// Bail if the input doesn't exist
			if (!fieldInput) return;

			// Set Invalid state
			fieldInput.setAttribute('data-state', 'invalid');

			// Set validation message
			let error = document.createElement('p');
			error.classList.add('postform__error');
			error.innerText = inputs[field];

			// Add the error below it's input
			fieldInput.parentNode.insertBefore(error, fieldInput.nextSibling);
		}
	}

	/**
	 * Set Alert
	 * @param string type
	 * @param string message
	 */
	setAlert(type, message) {
		// Look for the alert container
		let alerts =
			this.form.querySelector('.postform__alerts') ||
			this.createAlertsContainer();

		// Create new alert
		let alert = document.createElement('div');
		alert.setAttribute('role', 'alert');
		alert.classList.add(`alert`, `alert--${type}`);
		alert.innerText = message;

		// Add it to the container
		alerts.appendChild(alert);
	}

	/**
	 * Create Alerts Container
	 */
	createAlertsContainer() {
		let container = document.createElement('div');
		container.classList.add('postform__alerts');
		this.form.insertBefore(container, this.form.firstChild);
		return container;
	}

	/**
	 * Send
	 * Send form data to the validation endpoint
	 * @param FormData data
	 */
	async send(data) {
		let response = await fetch(this.getValidationEndpoint(), {
			method: 'POST',
			body: data,
			cache: 'default'
		});

		return await response.json();
	}

	/**
	 * Handles resetting the form back to it's default state
	 */
	reset() {
		this.resetInputState();
		this.resetAlertState();
	}

	/**
	 * If any of the inputs have had their state changed, we need
	 * to reset them for the current request
	 */
	resetInputState() {
		let inputs = this.form.querySelectorAll('input, select, textarea');
		inputs.forEach((input) => {
			input.removeAttribute('data-state');
		});
	}

	/**
	 * If an alert container was created at some point, we need
	 * to reset the state of that for the current request
	 */
	resetAlertState() {
		let alerts = this.form.querySelector('.postform__alerts');
		if (alerts) alerts.parentNode.removeChild(alerts);
	}

	/**
	 * Get Form Token
	 *
	 * Extracts the form token from the forms action URL
	 */
	getFormToken() {
		let url = this.form.getAttribute('action');
		return url.replace(`${this.config.apiUrl}/`, '');
	}

	/**
	 * Get Validation Endpoint
	 */
	getValidationEndpoint() {
		return `${this.config.apiUrl}/validate/${this.token}`;
	}
}

(() => {
	const forms = document.querySelectorAll('form[postform]');

	forms.forEach((form) => {
		new Postform(form);
	});

	// Add Stylesheet
	let stylesheet = document.createElement('link');
	stylesheet.href = 'dist/postform.css';
	stylesheet.rel = 'stylesheet';
	document.head.appendChild(stylesheet);
})();
