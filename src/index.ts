import { ipcRenderer, remote } from "electron";
import * as fs from "fs";
import * as path from "path";

window.addEventListener("contextmenu", (e: MouseEvent) => {
    e.preventDefault();

    const menu = new remote.Menu();
    menu.append(new remote.MenuItem({
        label: "撤消",
        role: "undo",
        enabled: document.queryCommandEnabled("undo")
    }));
    menu.append(new remote.MenuItem({
        type: "separator"
    }));
    menu.append(new remote.MenuItem({
        label: "剪切",
        role: "cut",
        enabled: document.queryCommandEnabled("cut")
    }));
    menu.append(new remote.MenuItem({
        label: "复制",
        role: "copy",
        enabled: document.queryCommandEnabled("copy")
    }));
    menu.append(new remote.MenuItem({
        label: "粘贴",
        role: "paste",
        enabled: document.queryCommandEnabled("paste")
    }));
    menu.append(new remote.MenuItem({
        label: "删除",
        role: "delete",
        enabled: document.getSelection().toString().length > 0
    }));
    menu.append(new remote.MenuItem({
        type: "separator"
    }));
    menu.append(new remote.MenuItem({
        label: "全选",
        role: "selectall",
        enabled: document.queryCommandEnabled("selectAll")
    }));
    menu.popup({ window: remote.getCurrentWindow() });
});

let body = document.getElementById("body");
body.addEventListener("input", () => {
    ipcRenderer.send("changed");
});

ipcRenderer.on("new", (event: any) => {
    body.innerText = "";
});

ipcRenderer.on("open", (event: any, file: string) => {
    console.log(path.basename(file));

    const data = fs.readFileSync(file, "utf8");
    body.innerText = data.toString();
});

ipcRenderer.on("save", (event: any, file: string) => {
    const data = body.innerText;
    fs.writeFileSync(file, data);
});