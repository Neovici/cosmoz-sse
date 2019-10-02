// @license Copyright (C) 2019 Neovici AB - Apache 2 License
import { PolymerElement } from '@polymer/polymer/polymer-element';

const SSEHandlers = {
	text: data => data,
	json: data => JSON.parse(data)
};

/**
	`<cosmoz-sse>` is an element that allows subscribing to server-sent events.

	@customElement
	@polymer
	@demo demo/index.html
*/
class CosmozSSE extends PolymerElement {
	static get is() {
		return 'cosmoz-sse';
	}

	static get properties() {
		return {
			_configuration: {
				type: Object,
				computed: '_computeConfiguration(withCredentials)'
			},
			/**
			 * The SSE endpoint.
			 */
			url: {
				type: String
			},

			/**
			 * The named events you wish to subscribe to.
			 */
			events: {
				type: Array,
				value: [],
				observer: '_onEventsChange'
			},

			/**
			 * How to parse the event data.
			 * @type {('json'|'text')}
			 */
			handleAs: {
				type: String,
				value: 'json'
			},
			/**
			 * Whether CORS should include credentials.
			 */
			withCredentials: {
				type: Boolean,
				value: false
			}
		};
	}

	static get observers() {
		return [
			'reconnect(url, _configuration)'
		];
	}

	constructor() {
		super();
		this._boundOnMessage = this._onMessage.bind(this);
		this._boundOnEvent = this._onEvent.bind(this);
		this._boundOnOpen = this._onOpen.bind(this);
		this._boundOnError = this._onError.bind(this);
	}

	/**
	 * Connects to the SSE endpoint.
	 *
	 * @return {void}
	 */
	connect() {
		if (!this.url || this._source) {
			return;
		}

		this._source = new EventSource(this.url, this._configuration);
		this._source.addEventListener('message', this._boundOnMessage);
		this._source.addEventListener('open', this._boundOnOpen);
		this._source.addEventListener('error', this._boundOnError);

		this._subscribeToEvents(this.events);
	}

	/**
	 * Disconnects from the SSE endpoint.
	 *
	 * @return {void}
	 */
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

	_computeConfiguration(withCredentials) {
		return {
			withCredentials
		};
	}

	/**
	 * Disconnects and connects again (to handle URL or configuration changes).
	 *
	 * @return {void}
	 */
	reconnect() {
		this.disconnect();
		this.connect();
	}

	/**
	 * Subscribes to the named events when the property changes.
	 *
	 * @param	 {String[]} events		The named events to subscribe to.
	 * @param	 {String[]} oldEvents The events previously subscribed to.
	 * @return {void}
	 */
	_onEventsChange(events, oldEvents) {
		this._unsubscribeFromEvents(oldEvents);
		this._subscribeToEvents(events);
	}

	/**
	 * Subscribes to named events.
	 *
	 * @param	 {String[]} events The named events to subscribe to.
	 * @return {void}
	 */
	_subscribeToEvents(events) {
		if (!this._source || !Array.isArray(events)) {
			return;
		}

		events.forEach(e => this._source.addEventListener(e, this._boundOnEvent));
	}

	/**
	 * Unsubscribes from named events.
	 *
	 * @param	 {String[]} events The events to unsubscribe from.
	 * @return {void}
	 */
	_unsubscribeFromEvents(events) {
		if (!this._source || !Array.isArray(events)) {
			return;
		}

		events.forEach(e =>
			this._source.removeEventListener(e, this._boundOnEvent)
		);
	}

	/**
	 * Event handler for `message` events.
	 *
	 * Dispatches EventSource `message` events as CustomEvents.
	 *
	 * @param	 {Event} event The `message` event.
	 * @return {void}
	 */
	_onMessage(event) {
		const { data } = event;
		this.dispatchEvent(new CustomEvent('message', { detail: { data } }));
	}

	/**
	 * Event handler for named events.
	 *
	 * Dispatches named events data as CustomEvents based on the event's type.
	 * @param	 {Event} event The event.
	 * @return {void}
	 */
	_onEvent(event) {
		const { data, type } = event;
		const handler = SSEHandlers[this.handleAs];

		this.dispatchEvent(
			new CustomEvent(type, {
				detail: { data: handler(data) }
			})
		);
	}

	/**
	 * Event handler for `open` events.
	 *
	 * @return {void}
	 */
	_onOpen() {
		this.dispatchEvent(new CustomEvent('open'));
	}

	/**
	 * Event handler for `error` events.
	 *
	 * @return {void}
	 */
	_onError() {
		this.dispatchEvent(new CustomEvent('error'));
	}
}

customElements.define(CosmozSSE.is, CosmozSSE);
