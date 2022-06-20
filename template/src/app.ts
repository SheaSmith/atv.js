import { initialise } from "atv-legacy.js"
import { ExamplePage } from "./pages/example-page/example-page.loader";

atv.config.doesJavaScriptLoadRoot = true

atv.onAppEntry = () => {
    initialise(new ExamplePage());
}