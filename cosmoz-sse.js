// @license Copyright (C) 2020 Neovici AB - Apache 2 License
import { component, useEffect, useMemo, useState } from '@pionjs/pion';

const getJson = (input) => {
		try {
			return JSON.parse(input);
		} catch (e) {
			// eslint-disable-next-line no-console
			console.error('cant parse JSON:', input);
		}
	},
	SSEHandlers = {
		text: (data) => data,
		json: (data) => getJson(data),
	},
	// eslint-disable-next-line max-lines-per-function
	CosmozSSE = function ({
		events,
		withCredentials = false,
		handleAs = 'json',
		url,
	}) {
		const isAttached = this.parentNode != null,
			fireEvent = (type, eventInit) => {
				this.dispatchEvent(new CustomEvent(type, eventInit));
			},
			configuration = useMemo(
				() => ({
					withCredentials,
				}),
				[withCredentials]
			),
			[source, setSource] = useState(null),
			eventTypes = useMemo(() => (events && getJson(events)) || [], [events]),
			onEvent = (event) => {
				const handler = SSEHandlers[handleAs];

				fireEvent(event.type, {
					detail: {
						data: handler(event.data),
					},
				});
			},
			unsubscribeFromEvents = () => {
				if (source == null || !Array.isArray(eventTypes)) {
					return;
				}
				eventTypes.forEach((eventType) =>
					source.removeEventListener(eventType, onEvent)
				);
			};

		useEffect(() => {
			if (!isAttached || !url) {
				return;
			}
			const source = new EventSource(url, configuration),
				onMessage = (event) =>
					fireEvent('message', { detail: { data: event.data } }),
				onOpen = () => fireEvent('open'),
				onError = (event) =>
					fireEvent('error', { detail: { data: event.data } });

			source.addEventListener('message', onMessage);
			source.addEventListener('open', onOpen);
			source.addEventListener('error', onError);
			setSource(source);

			return () => {
				unsubscribeFromEvents();
				source.close();
				source.removeEventListener('message', onMessage);
				source.removeEventListener('open', onOpen);
				source.removeEventListener('error', onError);
				setSource(null);
			};
		}, [isAttached, url, configuration]);

		useEffect(() => {
			if (!source || !Array.isArray(eventTypes)) {
				return;
			}

			eventTypes.forEach((eventType) =>
				source.addEventListener(eventType, onEvent)
			);
			return unsubscribeFromEvents;
		}, [source, eventTypes]);
	};

CosmozSSE.observedAttributes = [
	'events',
	'handle-as',
	'url',
	'with-credentials',
];

customElements.define('cosmoz-sse', component(CosmozSSE));
