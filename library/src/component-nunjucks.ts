import {Environment, Extension} from "nunjucks";

export class ComponentExtension implements Extension {
    tags: string[] = ['component'];
    public autoescape = false;

    constructor(private environment: Environment) {

    }

    run(context: any, name: any, data: any): any {
        const result = this.environment.render(name, data);
        console.log('renderedComponent', result);
        return result;
    }

    parse(parser: any, nodes: any, lexer: any): any {
        const token = parser.nextToken();

        const args = parser.parseSignature(null, true);
        parser.advanceAfterBlockEnd(token.value);

        const returnObj = new nodes.CallExtension(this, 'run', args);
        return returnObj;
    }

}
