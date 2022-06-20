import Q from 'atv-legacy-q';

/**
 * A service to facilitate the running of HTTP requests.
 */
export class HttpService {
    /**
     * Internal storage for the headers to send.
     */
    private readonly _headers: { [key: string]: string } = {};

    /**
     * Internal storage for the body.
     */
    private _body: any;

    /**
     * Internal storage for the interceptors.
     */
    private _interceptors: Interceptor[] = [];

    private _pipes: ((response: any) => any)[] = [];

    /**
     * Create a new instance of the HttpService.
     * @param url The URL to request.
     * @param method The method to use.
     */
    constructor(private url: string, private method: string) { }

    /**
     * Add single header to the request.
     * @param key The key of the header.
     * @param value The value of the header.
     * @returns The HttpService, to assist with chaining.
     */
    public header(key: string, value: string): HttpService {
        // Update the header internally to the new value.
        this._headers[key] = value;
        // Return the instance of HttpService.
        return this;
    }

    /**
     * Add multiple headers to the request.
     * @param headers The headers to add.
     * @returns The HttpService, to assist with chaining.
     */
    public headers(headers: { [key: string]: string }): HttpService {
        // Iterate through the new headers and update or set new headers internally.
        Object.keys(headers).forEach((k) => this._headers[k] = headers[k]);
        // Return the instance of HttpService.
        return this;
    }

    /**
     * Set the body for this request.
     * @param body The body to set.
     * @returns The HttpService, to assist with chaining.
     */
    public body(body: any): HttpService {
        // Set the body internally.
        this._body = body;
        // Return the instance of HttpService.
        return this;
    }

    /**
     * Add an interceptor to the request.
     * @param interceptor The interceptor to add.
     * @returns The HttpService, to assist with chaining.
     */
    public interceptor(interceptor: Interceptor): HttpService {
        // Add the interceptor internally.
        this._interceptors.push(interceptor);
        // Return the instance of HttpService.
        return this;
    }

    /**
     * Merge multiple HttpService's together, for use with the interceptors.
     * @param service The service to merge into this one, overriding values if necessary.
     * @returns The merged service.
     */
    public merge(service: HttpService): HttpService {
        // Update the URL.
        this.url = service.url;
        // Update the method.
        this.method = service.method;
        // Update each header, by iterating through the keys and then updating / adding all headers from the new service.
        Object.keys(service.headers).forEach((k) => this._headers[k] = service._headers[k]);
        // Update the body.
        this._body = service._body;
        // Return the (now merged) service.
        return this;
    }

    /**
     * Pipe the response to modify or add values to it.
     * @param pipe The function you wish to run on the body.
     * @returns The HttpService, to assist with chaining.
     */
    public pipe(pipe: (body: any) => any): HttpService {
        this._pipes.push(pipe);
        return this;
    }

    /**
     * Run the request.
     * @returns A promise of the type HttpResponse with body type T.
     */
    public run<T>(): Q.Promise<HttpResponse<T>> {
        // Create the promise to return.
        const deferred = Q.defer<HttpResponse<T>>();
        // Get the promises from the interceptor.
        const promises = this._interceptors.map(m => m.aboutToRequest(this));

        // Run all promises from the interceptors.
        Q.all(promises).then((services) => {
            if (services.length == 0) {
                services.push(this);
            }

            // Merge the services together so there is a single object.
            const service = services.reduce((previous, current) => {
                return previous.merge(current);
            });

            // Create the request.
            const xmlHttpRequest = new XMLHttpRequest();
            // Open the request, allowing us to specify headers.
            xmlHttpRequest.open(service.method, service.url, false);

            // Set the headers.
            Object.keys(service._headers).forEach((k) => {
                xmlHttpRequest.setRequestHeader(k, service._headers[k]);
            });

            // Set the callback for when the request finishes.
            xmlHttpRequest.onreadystatechange = () => {
                // Only continue when the state is done.
                if (xmlHttpRequest.readyState == 4) {
                    // Get all of the header pairs, by splitting on new lines.
                    const headerPairs = xmlHttpRequest.getAllResponseHeaders()?.split(/\r?\n/);

                    // Split the headers by the colon, and fill out the key-value pairs.
                    const headers: { [value: string]: string } = {};
                    headerPairs?.forEach((h) => {
                        const keyValue = h.split(': ');
                        headers[keyValue[0]] = keyValue[1];
                    });

                    // The body is either T, or object or string for errors.
                    let body: T | object | string;
                    // If the content type is JSON then we can parse it.
                    if (headers['Content-Type'].indexOf('application/json') != -1) {
                        // If the request code is below 400 then we assume it isn't an error.
                        if (xmlHttpRequest.status < 400) {
                            // Parse the json and then cast it to the correct type.
                            try {
                                if (xmlHttpRequest.responseText.trim() != '') {
                                    body = JSON.parse(xmlHttpRequest.responseText) as T;
                                } else {
                                    body = {};
                                }
                            }
                            catch (e: any) {
                                // Catch any errors and return them in the promise.
                                const error = new HttpError<object>(xmlHttpRequest.status, xmlHttpRequest.statusText, headers, JSON.parse(xmlHttpRequest.responseText), xmlHttpRequest.responseDataAsBase64);
                                error.exception = e;
                                deferred.reject(error);
                                return;
                            }
                        }
                        else
                            // Otherwise, it's an error, so parse the json by itself.
                            if (xmlHttpRequest.responseText.trim() != '') {
                                body = JSON.parse(xmlHttpRequest.responseText);
                            } else {
                                body = {};
                            }
                    }
                    else {
                        // Otherwise we just treat it as a plain string.
                        try {
                            // If the status code is below 400, then we count it as a success.
                            if (xmlHttpRequest.status < 400)
                                // Cast the body to the correct type
                                body = xmlHttpRequest.responseText as unknown as T;
                            else
                                // Don't cast, just treat as a plain string.
                                body = xmlHttpRequest.responseText;
                        } catch (e: any) {
                            // Catch any errors and return them in the promise with extra data.
                            const error = new HttpError<string>(xmlHttpRequest.status, xmlHttpRequest.statusText, headers, xmlHttpRequest.responseText, xmlHttpRequest.responseDataAsBase64);
                            error.exception = e;
                            deferred.reject(error);
                            return;
                        }
                    }

                    // Overall if there's no error, return a normal promise.
                    if (xmlHttpRequest.status < 400) {
                        this._pipes.forEach((pipe) => {
                            body = pipe(body);
                        });

                        const response = new HttpResponse<T>(xmlHttpRequest.status, xmlHttpRequest.statusText, headers, body as T, xmlHttpRequest.responseDataAsBase64);

                        deferred.resolve(response);
                    }
                    else {
                        // Return an error to the promise.
                        const response = new HttpError<object | string>(xmlHttpRequest.status, xmlHttpRequest.statusText, headers, body as object | string, xmlHttpRequest.responseDataAsBase64);
                        deferred.reject(response);
                    }
                }
            }

            // Run the request.
            xmlHttpRequest.send(service._body);
        }).catch((error) => {
            // Return any errors from the interceptors.
            deferred.reject(error);
        });

        return deferred.promise;
    }
}

/**
 * A method to intercept requests, e.g. to provide authentication.
 */
export interface Interceptor {
    /**
     * The request is about to run, so make any changes necessary.
     * @param service The HttpService instance, which will allow any changes to be made.
     */
    aboutToRequest(service: HttpService): Q.Promise<HttpService>;
}

/**
 * The response from a HTTP request
 */
export class HttpResponse<T> {
    /**
     * The status code of the response.
     */
    public statusCode: number;

    /**
     * A description of the status code.
     */
    public statusText: string;

    /**
     * The headers on the request.
     */
    public headers: { [key: string]: string };

    /**
     * The body of the request.
     */
    public body: T;

    /**
     * The body as a base64 string.
     */
    public bodyAsBase64: string;

    constructor(statusCode: number, statusText: string, headers: { [key: string]: string }, body: T, bodyAsBase64: string) {
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.headers = headers;
        this.body = body;
        this.bodyAsBase64 = bodyAsBase64;
    }
}

/**
 * A HTTP request that has resulted in an error.
 */
export class HttpError<T> {
    /**
     * The status code of the response.
     */
    public statusCode?: number;

    /**
     * A description of the status code.
     */
    public statusText?: string;

    /**
     * The headers on the request.
     */
    public headers?: { [key: string]: string };

    /**
    * The body of the request.
    */
    public body?: T;

    /**
     * The body as a base64 string.
     */
    public bodyAsBase64?: string;

    /**
     * Any exceptions associated with the request.
     */
    public exception?: any;

    constructor(statusCode?: number, statusText?: string, headers?: { [key: string]: string }, body?: T, bodyAsBase64?: string) {
        this.statusCode = statusCode;
        this.statusText = statusText;
        this.headers = headers;
        this.body = body;
        this.bodyAsBase64 = bodyAsBase64;
    }
}