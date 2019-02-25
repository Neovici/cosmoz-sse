// @license Copyright (C) 2019 Neovici AB - Apache 2 License
const SSEHandlers = {
	text: data => data,
	json: data => JSON.parse(data)
};
const { enqueueDebouncer, Debouncer } = Polymer;

class CosmozSSE extends Polymer.Element {
	static get is() {
		return 'cosmoz-sse';
	}

	static get properties() {
		return {
			url: {
				type: String
			},
			events: {
				type: Array,
				value: []
			},
			handleAs: {
				type: String,
				value: 'json'
			}
		};
	}

	static get observers() {
		return ['_onChange(url, events)'];
	}

	constructor() {
		super();
		this._boundOnMessage = this._onMessage.bind(this);
		this._boundOnEvent = this._onEvent.bind(this);
		this._boundOnOpen = this._onOpen.bind(this);
		this._boundOnError = this._onError.bind(this);
	}

	connectedCallback() {
		super.connectedCallback();
		this._debounceConnect();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.disconnect();
		this._debouncer.cancel();
	}

	disconnect() {
		if (!this._source) {
			return;
		}

		if (Array.isArray(this.events)) {
			this.events.forEach(e =>
				this._source.removeEventListener(e, this._boundOnEvent)
			);
		}

		this._source.close();
		this._source.removeEventListener('message', this._boundOnMessage);
		this._source.removeEventListener('open', this._boundOnOpen);
		this._source.removeEventListener('error', this._boundOnError);
		this._source = null;
	}

	_onChange(url) {
		if (!url) {
			return;
		}
		this._debounceConnect();
	}

	_debounceConnect() {
		enqueueDebouncer(
			this._debouncer = Debouncer.debounce(
				this._debouncer,
				Polymer.Async.microTask,
				this.connect.bind(this)
			)
		);
	}

	connect() {
		this.disconnect();

		this._source = new EventSource(this.url);
		this._source.addEventListener('message', this._boundOnMessage);
		this._source.addEventListener('open', this._boundOnOpen);
		this._source.addEventListener('error', this._boundOnError);

		if (!Array.isArray(this.events)) {
			return;
		}
		this.events.forEach(e =>
			this._source.addEventListener(e, this._boundOnEvent)
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
