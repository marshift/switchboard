// Imports
import JSZip from "https://esm.sh/@progress/jszip-esm@1.0.3";
import FileSaver from "https://esm.sh/file-saver@2.0.5";

// Constants
const CORS_PROXY = "https://shcors.uwu.network/"; // TODO: Use my own proxy
const TRACKER_URL = "https://tracker.vendetta.rocks/tracker";
const FILE_NAMES = [
    "base",
    "config.arm64_v8a",
    "config.armeabi_v7a",
    "config.x86_64",
    "config.x86",
    "config.hdpi",
    "config.xxhdpi",
    "config.de",
    "config.en",
];

// Little fetch wrapper
async function mFetch(url, options) {
    const req = await fetch(CORS_PROXY + url, options);
    if (!req.ok) throw new Error("Request returned non-ok status code");

    return req;
}

// Get some elements
const versionInput = document.getElementById("version-input");
const versionSelect = document.getElementById("version-select");
const downloadButton = document.getElementById("download-button");

// Attempt to fetch latest versions
let latestVersions;

try {
    const data = await (await mFetch(TRACKER_URL + "/index")).json();
    latestVersions = data.latest;
} catch {
    alert("failed to fetch latest versions from tracker, try reloading?");
}

// Set the version string textbox to the latest stable if we have it
versionInput.value = latestVersions.stable;

// Add select handlers
versionSelect.addEventListener("change", () => {
    if (!latestVersions) return;

    const versionType = versionSelect.options[versionSelect.selectedIndex].value;
    versionInput.value = latestVersions[versionType];
});

// Download handler
downloadButton.addEventListener("click", async () => {
    const zip = new JSZip();
    const version = versionInput.value;
    let failed = false;

    downloadButton.disabled = true;
    downloadButton.value = `starting download for ${version}`;

    for (let fileName of FILE_NAMES) {
        const fileWithExt = `${fileName}.apk`;
        downloadButton.value = `downloading ${fileWithExt}`;
        
        try {
            const fileReq = await mFetch(TRACKER_URL + `/download/${version}/${fileName}`);
            const fileData = await fileReq.arrayBuffer();
            zip.file(`${fileWithExt}`, fileData);
            console.log(`downloaded ${fileName} for ${version}`);
        } catch(error) {
            failed = true;
            
            const msg = `failed to download ${fileWithExt} for ${version}!\n${error}`;
            console.error(msg);
            alert(msg);
            break;
        }
    };

    if (!failed) {
        downloadButton.value = `generating zip...`;
        const zipData = await zip.generateAsync({ type: "arraybuffer" });
        const zipFile = new File([zipData], `Discord-${version}.zip`);
        FileSaver.saveAs(zipFile);
    }

    downloadButton.disabled = false;
    downloadButton.value = failed ? "failed :<" : "success :D";
    setTimeout(() => downloadButton.value = "download", 2000);
});
