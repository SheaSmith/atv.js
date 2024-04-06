import {Loader, TemplateSource} from "ventojs/esm/src/loader";

export class TemplateLoader implements Loader {
    private templates = new Map<string, string>();

    load(file: string): TemplateSource {
        return {
            source: this.templates.get(file)!
        }
    }

    resolve(from: string, file: string): string {
        return `${from}-${file}`;
    }

    registerTemplate(templateKey: string, template: string) {
        this.templates.set(templateKey, template);
    }

}
