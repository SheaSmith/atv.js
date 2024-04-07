import {ILoader, Loader, LoaderSource} from "nunjucks";

export class TemplateLoader extends Loader implements ILoader {
    private templates = new Map<string, string>();


    resolve(from: string, to: string): string {
        console.log('resolvedTemplate', from, to)
        return to;
    }

    registerTemplate(templateKey: string, template: string) {
        this.templates.set(templateKey, template);
        console.log('registeredTemplate', templateKey);
    }

    async: false | undefined;

    getSource(name: string): LoaderSource {
        console.log('getSourceTemplate', name, this.templates.get(name));
        return {
            src: this.templates.get(name)!,
            path: name,
            noCache: false
        }
    }



}
