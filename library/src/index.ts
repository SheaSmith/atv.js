import { Page } from "./page";

export function initialise(firstPage: Page) {
    firstPage.loadPage(undefined, false);
}