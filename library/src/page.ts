import { Component } from "./component";
import { generateErrorDialog } from "./error-dialog";
import Q from 'atv-legacy-q';
import { HttpResponse } from "./http-service";
import vento from 'ventojs/esm/mod';
import {TemplateLoader} from "./template-loader";
import {Environment} from "ventojs/esm/src/environment";

/**
 * A top-level page that can be loaded directly by the Apple TV.
 */
export abstract class Page {
    /**
     * The proxy document to use, when a proxy document is needed (e.g. in most situations).
     */
    protected proxyDocument?: atv.ProxyDocument;

    /**
     * The navigation event to use, e.g. when loading a page through the onNavigate event.
     */
    protected navigationEvent?: ATVNavigateEvent;

    /**
     * The error message to use when an error occurs.
     */
    protected errorMessage = 'Unable to load page';

    /**
     * The error description to use when an error occurs.
     */
    protected errorDescription = 'Unable to load page. Please try again later.'

    /**
     * Create a new component.
     * @param components The subcomponents to use.
     */
    protected constructor(protected components: Component[] = []) { }

    /**
     * Whether the document should be swapped, rather than stacked ontop of the previous page.
     */
    protected swap = false;

    /**
     * Load a page by downloading the template and filling in the data.
     * @param environment The rendering environment to use.
     * @param data The data to use to compile the template.
     */
    protected renderXml(environment: Environment, data?: any) {
        // Get the XML template from the url. We want to return a string.
        this.loadTemplateSource()
            .then((templateSource) => {

                // Substitute the data
                const templateWithData = environment.runStringSync(templateSource, data);
                try {
                    // Parse the XML.
                    const xml = atv.parseXML(templateWithData.content);

                    // If we have a proxy document, we need to load the XML into that.
                    if (this.proxyDocument != null) {
                        // Load the XML and register the success callback.
                        if (this.swap) {
                            this.proxyDocument.cancel();
                            atv.loadAndSwapXML(xml, (success) => {
                                if (!success) {
                                    console.error('Parse XML failed', templateWithData);
                                    // If the XML was not loaded successfully, show an error dialog.
                                    atv.loadXML(generateErrorDialog(this.errorMessage, this.errorDescription));
                                }
                            })
                        }
                        this.proxyDocument.loadXML(xml, (success) => {
                            if (!success) {
                                console.error('Parse XML failed', templateWithData);
                                // If the XML was not loaded successfully, show an error dialog.
                                this.proxyDocument?.loadXML(generateErrorDialog(this.errorMessage, this.errorDescription));
                            }
                        });
                    }
                    // We've got a onNavigate callback, so use that instead.
                    else if (this.navigationEvent != null) {
                        console.log(templateWithData);
                        // Load the XML. There is no callback for this, so we don't know if there has been an error or not.
                        this.navigationEvent.success(xml);
                    }
                    // Otherwise, it's probably something like the first page loaded, so we don't need a ProxyDocument or a onNavigate event.
                    else {
                        if (this.swap) {
                            // Load the XML and register the callback.
                            atv.loadAndSwapXML(xml, (success) => {
                                if (!success) {
                                    console.error('Parse XML failed', templateWithData);
                                    // If the XML was not loaded successfully, show an error dialog.
                                    atv.loadXML(generateErrorDialog(this.errorMessage, this.errorDescription));
                                }
                            });
                        }
                        else {
                            // Load the XML and register the callback.
                            atv.loadXML(xml, (success) => {
                                if (!success) {
                                    console.error('Parse XML failed', templateWithData);
                                    // If the XML was not loaded successfully, show an error dialog.
                                    atv.loadXML(generateErrorDialog(this.errorMessage, this.errorDescription));
                                }
                            });
                        }
                    }
                }
                // Catch any errors. This would probably be a parse error for the XML.
                catch (e) {
                    this.loadError(e);
                }
            })
            .catch((error) => {
                // Catch any errors from the promise.
                this.loadError(error);
            });
    }

    /**
     * Load the template. Whether this is from HTTP, or via webpack is up to the implementor.
     */
    protected abstract loadTemplateSource(): Q.Promise<string>;

    /**
     * Load the data and show the loader.
     * 
     * By default this creates and shows a proxy document, but if the super method isn't called, then it won't be.
     */
    public loadPage(event?: ATVNavigateEvent, useProxyDocument = true, swap = false) {
        const loader = new TemplateLoader();
        const env = vento({ includes: loader })

        this.registerCustomHelpers(env);

        this.swap = swap;

        // We've got a navigation event, so specify that.
        this.navigationEvent = event;
        // We need to use a ProxyDocument and not a navigation event, so generate and show a loader.
        if (useProxyDocument && this.navigationEvent == null) {
            this.showLoader();
        }

        // Load the component templates, if necessary.
        this.loadComponents(loader)
            .then(() => {
                // Successfully loaded the components, so we can load data.
                this.loadData()
                    .then(d => {
                        // Successfully got the data, so render the XML.
                        if (d instanceof HttpResponse) {
                            this.renderXml(env, d.body);
                        } else {
                            this.renderXml(env, d);
                        }
                    })
                    .catch((e) => {
                        // Otherwise, display an error.
                        this.loadError(e);
                    });
            })
            // We couldn't load a component so show an error.
            .catch((e) => this.loadError(e));
    }

    /**
     * Load any subcomponents used by this page.
     * @returns A promise indicating that all the components have finished loading.
     */
    protected loadComponents(templateLoader: TemplateLoader): Q.Promise<void> {
        // Create a new promise.
        const deferred = Q.defer<void>();
        /// Get all the promises for the components list.
        const promises = this.components.map(c => c.loadTemplate());

        Q.all(promises)
            .then((c) => {
                // All the promises are complete.
                c.forEach(res => {
                    // Iterate through each of the components and register it in Handlebars.
                    templateLoader.registerTemplate(res.componentKey, res.template);
                });

                // Tell the promise we're done.
                deferred.resolve();
            })
            // There was an error, so tell the caller.
            .catch((e) => deferred.reject(e));

        return deferred.promise;
    }

    /**
     * Load the data for the page.
     */
    protected abstract loadData(): Q.Promise<any>;

    /**
     * Show the loader while the page is loading.
     */
    protected showLoader() {
        // Create and show a new proxy document.
        this.proxyDocument = new atv.ProxyDocument();
        this.proxyDocument.show();
    }

    /**
     * Show an error dialog and post the error to the console.
     * @param error The error to post to the console.
     */
    protected loadError(error: any) {
        console.error(error);

        if (this.proxyDocument != null) {
            this.proxyDocument?.loadXML(generateErrorDialog(this.errorMessage, this.errorDescription));
        }
        else if (this.navigationEvent != null) {
            this.navigationEvent.failure(this.errorMessage);
        }
        else {
            atv.loadXML(generateErrorDialog(this.errorMessage, this.errorDescription));
        }
    }

    /**
     * Any additional helpers that should be registered by the app.
     */
    protected registerCustomHelpers(environment: Environment) {}
}
