#! /usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';

const CURR_DIR = process.cwd();

function cli(args: string[]) {
    if (args.length >= 2) {
        if (args[0] == 'init') {

        }
        else if (args[0] == 'component') {

        }
        else if (args[0] == 'page') {

        }
        else {
            help();
        }
    }
    else {
        help();
    }
}

function help() {
    console.log("Usage: atv init|component|page [name]");
}

const SKIP_FILES = ['node_modules', '.template.json'];

function init(name: string) {
    if (fs.existsSync(name)) {
        console.error(`Folder ${name} already exists`);
        return;
    }

    fs.mkdirSync(name);

    
}

function createDirectoryContents(name: string) {
    const filesToCreate = fs.readdirSync('template');
    filesToCreate.forEach(file => {
        const origFilePath = path.join('template', file);

        const stats = fs.statSync(origFilePath);

        if (SKIP_FILES.indexOf(file) > -1) return;

        if (stats.isFile()) {
            // read file content and transform it using template engine
            let contents = fs.readFileSync(origFilePath, 'utf8');            // write file to destination folder
            const writePath = path.join(CURR_DIR, name, file);
            fs.writeFileSync(writePath, contents, 'utf8');
        } else if (stats.isDirectory()) {
            // create folder in destination folder
            fs.mkdirSync(path.join(CURR_DIR, name, file));            // copy files/folder inside current folder recursively
            createDirectoryContents(path.join(name, file), path.join(name, file));
        }
    });
}