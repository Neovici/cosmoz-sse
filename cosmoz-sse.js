// @license Copyright (C) 2019 Neovici AB - Apache 2 License
const SSEHandlers = {
	text: data => data,
	json: data => JSON.parse(data)
};

class CosmozSSE extends Polymer.Element {
	static get is() {
		return 'cosmoz-sse';
	}

	static get properties() {
		return {
			url: {
				type: String,
				observer: '_onUrlChange'
			},
			events: {
				type: Array,
				value: [],
				observer: '_onEventsChange'
			},
			handleAs: {
				type: String,
				value: 'json'
			}
		};
	}

	constructor() {
		super();
		this._boundOnMessage = this._onMessage.bind(this);
		this._boundOnEvent = this._onEvent.bind(this);
		this._boundOnOpen = this._onOpen.bind(this);
		this._boundOnError = this._onError.bind(this);
	}

	connect() {
		if (!this.url || this._source) {
			return;
		}

		this._source = new EventSource(this.url);
		this._source.addEventListener('message', this._boundOnMessage);
		this._source.addEventListener('open', this._boundOnOpen);
		this._source.addEventListener('error', this._boundOnError);

		this._subscribeToEvents(this.events);
	}

	disconnect() {
		if (!this._source) {
			return;
		}

		this._unsubscribeFromEvents(this.events);

		this._source.close();
		this._source.removeEventListener('message', this._boundOnMessage);
		this._source.removeEventListener('open', this._boundOnOpen);
		this._source.removeEventListener('error', this._boundOnError);
		this._source = null;
	}

	connectedCallback() {
		super.connectedCallback();
		this.connect();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.disconnect();
	}

	_onUrlChange() {
		this.disconnect();
		this.connect();
	}

	_onEventsChange(events, oldEvents) {
		this._unsubscribeFromEvents(oldEvents);
		this._subscribeToEvents(events);
	}

	_subscribeToEvents(events) {
		if (!this._source || !Array.isArray(events)) {
			return;
		}

		events.forEach(e => this._source.addEventListener(e, this._boundOnEvent));
	}

	_unsubscribeFromEvents(events) {
		if (!this._source || !Array.isArray(events)) {
			return;
		}

		events.forEach(e =>
			this._source.removeEventListener(e, this._boundOnEvent)
		);
	}

	_onMessage(event) {
		const { data } = event;
		this.dispatchEvent(new CustomEvent('message', { detail: { data } }));
	}

	_onEvent(event) {
		const { data, type } = event;
		const handler = SSEHandlers[this.handleAs];

		this.dispatchEvent(
			new CustomEvent(type, {
				detail: { data: handler(data) }
			})
		);
	}

	_onOpen(event) {
		this.dispatchEvent(new CustomEvent('open'));
	}

	_onError(event) {
		this.dispatchEvent(new CustomEvent('error'));
	}
}

customElements.define(CosmozSSE.is, CosmozSSE);
