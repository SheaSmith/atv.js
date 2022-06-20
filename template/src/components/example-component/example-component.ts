import { Component } from "atv-legacy.js/dist/component";
import ExamplePageTemplate from '!!raw-loader!./example-component.xml';
import Q from "atv-legacy-q";

export class ExampleComponent extends Component {
    protected loadTemplateSource(): any {
        const promise = Q.defer<string>();
        console.log('loadcomponent');

        promise.resolve(ExamplePageTemplate);
        console.log('loadcomponent2');

        return promise.promise;

    }

    constructor() {
        super('example-component');
    }
}