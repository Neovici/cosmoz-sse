export type EventSourceFactory = (
	url: string,
	options: EventSourceInit,
) => Pick<EventSource, 'addEventListener' | 'removeEventListener' | 'close'>;

/** Configure before mounting subscribers. Returns a function restoring the prior factory. */
export declare const setEventSourceFactory: (
	factory: EventSourceFactory,
) => () => void;
