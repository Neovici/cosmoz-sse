import {
	expect, fixture, html
} from '@open-wc/testing';

import sinon from 'sinon';

import '../cosmoz-sse.js';

const originalEventSource = window.EventSource,
	eventWithData = (event, data) => {
		const e = new CustomEvent(event);
		e.data = data;
		return e;
	},
	basicTestFixture = html`<cosmoz-sse url="https://localhost:8000"></cosmoz-sse>`;

suite('cosmoz-sse', () => {
	let eventSourceInstance;

	setup(() => {
		// stubbing EventSource with sinon.createStubInstance does not work,
		// so we have to manually create the stub class
		const __events = document.createDocumentFragment();
		eventSourceInstance = {
			__dispatch: __events.dispatchEvent.bind(__events),
			addEventListener: __events.addEventListener.bind(__events),
			removeEventListener: __events.removeEventListener.bind(__events),
			close: sinon.spy()
		};

		const StubEventSource = sinon.spy(() => eventSourceInstance);
		window.EventSource = StubEventSource;
	});

	teardown(() => {
		window.EventSource = originalEventSource;
	});

	test('connects to the provided url', async () => {
		await fixture(basicTestFixture);

		expect(window.EventSource).to.have.been.called;
		expect(window.EventSource).to.have.been.calledWith(
			'https://localhost:8000'
		);
	});

	test('does not connect if no url is specified', async () => {
		await fixture(html`<cosmoz-sse></cosmoz-sse>`);

		expect(window.EventSource).to.not.have.been.called;
	});

	test('fires the `open` event when the connection is established', async () => {
		const spy = sinon.spy(),
			element = await fixture(basicTestFixture);
		element.addEventListener('open', spy);

		eventSourceInstance.__dispatch(new CustomEvent('open'));
		expect(spy).to.have.been.called;
	});

	test('fires the `error` event when the connection fails', async () => {
		const spy = sinon.spy(),
			element = await fixture(basicTestFixture);
		element.addEventListener('error', spy);

		eventSourceInstance.__dispatch(new CustomEvent('error'));
		expect(spy).to.have.been.called;
	});

	test('allows subscribing to message events', async () => {
		const spy = sinon.spy(),
			element = await fixture(basicTestFixture);
		element.addEventListener('message', spy);

		eventSourceInstance.__dispatch(eventWithData('message', 'x1'));
		eventSourceInstance.__dispatch(eventWithData('message', 'x2'));
		eventSourceInstance.__dispatch(eventWithData('message', 'x3'));

		expect(spy).to.have.been.calledThrice;
		expect(spy.firstCall).to.have.been.calledWithMatch({
			detail: { data: 'x1' }
		});
		expect(spy.secondCall).to.have.been.calledWithMatch({
			detail: { data: 'x2' }
		});
		expect(spy.thirdCall).to.have.been.calledWithMatch({
			detail: { data: 'x3' }
		});
	});

	test('allows subscribing to named events', async () => {
		const spy = sinon.spy(),
			element = await fixture(html`
				<cosmoz-sse url="https://localhost:8000" events="[&quot;ping&quot;]"></cosmoz-sse>
			`);
		element.addEventListener('ping', spy);

		eventSourceInstance.__dispatch(
			eventWithData('ping', '{"test": true}')
		);

		expect(spy).to.have.been.calledOnce;
		expect(spy.firstCall).to.have.been.calledWithMatch({
			detail: { data: { test: true }}
		});
	});

	test('allows handling named events as text', async () => {
		const spy = sinon.spy(),
			element = await fixture(html`
				<cosmoz-sse
					url="https://localhost:8000"
					events="[&quot;ping&quot;]"
					handle-as="text"
				></cosmoz-sse>
			`);
		element.addEventListener('ping', spy);

		eventSourceInstance.__dispatch(eventWithData('ping', 'thisistext'));

		expect(spy).to.have.been.calledOnce;
		expect(spy.firstCall).to.have.been.calledWithMatch({
			detail: { data: 'thisistext' }
		});
	});

	test('closes the sse connection when removed from DOM and restores it when added back', async () => {
		const spy = sinon.spy(),
			element = await fixture(basicTestFixture),
			parent = element.parentNode;
		element.addEventListener('message', spy);

		eventSourceInstance.__dispatch(eventWithData('message', 'x1'));

		parent.removeChild(element);

		eventSourceInstance.__dispatch(eventWithData('message', 'x2'));

		parent.appendChild(element);

		eventSourceInstance.__dispatch(eventWithData('message', 'x3'));

		expect(spy).to.have.been.calledTwice;
		expect(spy.firstCall).to.have.been.calledWithMatch({
			detail: { data: 'x1' }
		});
		expect(spy.secondCall).to.have.been.calledWithMatch({
			detail: { data: 'x3' }
		});
	});
});
