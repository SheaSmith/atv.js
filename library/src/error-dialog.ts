import {TemplateLoader} from "./template-loader";
import {Environment} from "nunjucks";

export function generateErrorDialog(errorMessage: string, errorDescription: string): atv.Document {
    const env = new Environment(new TemplateLoader());

    const template = '<?xml version="1.0" encoding="UTF-8"?>'
        + '<atv><body>'
        + '<dialog id="error">'
        + '<title>{{message}}</title>'
        + '<description>{{description}}</description>'
        + '</dialog>'
        + '</body></atv>';
    const compiledTemplate = env.renderString(template, { message: errorMessage, description: errorDescription });
    return atv.parseXML(compiledTemplate);
}
