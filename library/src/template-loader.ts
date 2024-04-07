import {ILoader, Loader, LoaderSource} from "nunjucks";

export class TemplateLoader extends Loader implements ILoader {
    private templates = new Map<string, string>();


    resolve(from: string, to: string): string {
        return to;
    }

    registerTemplate(templateKey: string, template: string) {
        this.templates.set(templateKey, template);
    }

    async: false | undefined;

    getSource(name: string): LoaderSource {
        return {
            src: this.templates.get(name)!,
            path: name,
            noCache: false
        }
    }



}
