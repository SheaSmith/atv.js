import Handlebars from "handlebars";

export function generateErrorDialog(errorMessage: string, errorDescription: string): atv.Document {
    const template = '<?xml version="1.0" encoding="UTF-8"?>'
        + '<atv><body>'
        + '<dialog id="error">'
        + '<title>{{message}}</title>'
        + '<description>{{description}}</description>'
        + '</dialog>'
        + '</body></atv>';
    const compiledTemplate = Handlebars.compile(template)({ message: errorMessage, description: errorDescription });
    return atv.parseXML(compiledTemplate);
}