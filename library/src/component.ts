import Q from "atv-legacy-q";

/**
 * A reusable component that can be used inside of pages.
 */
export abstract class Component {
    /**
     * Create a new component.
     * @param componentKey The name of the XML file, along with the name used for the handlebars partial.
     */
    protected constructor(public componentKey: string) { }

    /**
     * Load the template.
     * @returns A promise containing the component key and the template.
     */
    loadTemplate(): Q.Promise<ComponentPromiseResponse> {
        const promise = Q.defer<ComponentPromiseResponse>();

        // Get the XML template from the url. We want to return a string.
        this.loadTemplateSource()
            // We've got the template, so construct a new object to return.
            .then((templateSource) => promise.resolve(new ComponentPromiseResponse(this.componentKey, templateSource)))
            // Otherwise we've got an error, so return this to the caller.
            .catch((e) => promise.reject(e));

        return promise.promise;
    }

    /**
     * Load the template. Whether this is from HTTP, or via webpack is up to the implementor.
     */
    protected abstract loadTemplateSource(): Q.Promise<string>;
}

/**
 * The return result of a component promise.
 */
export class ComponentPromiseResponse {
    /**
     * Construct a new promise response.
     * @param componentKey The key of the component.
     * @param template The template, including handlebars variables.
     */
    constructor(public componentKey: string, public template: string) { }
}