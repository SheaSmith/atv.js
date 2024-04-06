import vento from 'ventojs/esm/mod';
import {TemplateLoader} from "./template-loader";

export function generateErrorDialog(errorMessage: string, errorDescription: string): atv.Document {
    const env = vento({ includes: new TemplateLoader() })

    const template = '<?xml version="1.0" encoding="UTF-8"?>'
        + '<atv><body>'
        + '<dialog id="error">'
        + '<title>{{message}}</title>'
        + '<description>{{description}}</description>'
        + '</dialog>'
        + '</body></atv>';
    const compiledTemplate = env.runStringSync(template, { message: errorMessage, description: errorDescription });
    return atv.parseXML(compiledTemplate.content);
}
