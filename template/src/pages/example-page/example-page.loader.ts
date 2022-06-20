import { Page } from "atv-legacy.js/dist/page";
import ExamplePageTemplate from '!!raw-loader!./example-page.xml';
import { ExampleComponent } from "../../components/example-component/example-component";
import Q from "atv-legacy-q";

export class ExamplePage extends Page {
    protected loadTemplateSource(): Q.Promise<string> {
        const deferred = Q.defer<string>();
        deferred.resolve(ExamplePageTemplate);

        return deferred.promise;
    }
    constructor() {
        super([new ExampleComponent()]);
    }

    protected loadData(): Q.Promise<any> {
        const deferred = Q.defer<any>();
        deferred.resolve({'test': ['Test 1', 'Test 2']});

        return deferred.promise;
    }



}