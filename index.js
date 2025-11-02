// Imports
import { Zip, ZipDeflate } from "https://esm.sh/fflate@0.8.2";

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
	const res = await fetch(CORS_PROXY + url, options);
	if (!res.ok) throw new Error("Response gave non-ok status code");

	return res;
}

// Love me some file downloading (I hate this)
function downloadFile(data, fileName) {
	const downloadable = document.createElement("a");
	downloadable.href = URL.createObjectURL(new Blob([data]));
	downloadable.download = fileName;
	downloadable.click();
	downloadable.remove();
}

// Split APK creation logic
const createAPKZip = (version) =>
	new Promise(async (resolve, reject) => {
		const parts = [];

		const zip = new Zip((err, data, done) => {
			if (err) reject(err);
			parts.push(data);

			if (done) {
				const final = new Uint8Array(parts.map((i) => i.length).reduce((a, b) => a + b, 0));
				let offset = 0;

				for (const part of parts) {
					final.set(part, offset);
					offset += part.length;
				}

				resolve(final);
			}
		});

		const responses = await Promise.all(
			FILE_NAMES.map(async (fileName) => [await mFetch(TRACKER_URL + `/download/${version}/${fileName}`), fileName]),
		);

		let done = 0;
		const max = responses.map(([r]) => r.headers.get("Content-Length")).reduce((a, b) => a + parseInt(b), 0);

		await Promise.all(responses.map(async ([response, fileName]) => {
			const apkFile = new ZipDeflate(`${fileName}.apk`, { level: 9 });
			zip.add(apkFile);

			for await (const chunk of response.body) {
				done += chunk.length;
				apkFile.push(chunk);
				downloadBar.style.width = `${done / max * 100}%`;
			}
			apkFile.push("", true);

			console.log(`downloaded ${fileName}`);
			return apkFile;
		}));

		zip.end();
	});

// Get some elements
const versionInput = document.getElementById("version-input");
const versionSelect = document.getElementById("version-select");
const downloadButton = document.getElementById("download-button");
const downloadStatus = document.getElementById("download-status");
const downloadBar = document.getElementById("download-bar");

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
	const version = versionInput.value;

	downloadButton.disabled = true;
	downloadStatus.innerText = `downloading ${version}...`;
	downloadBar.style.display = "initial";

	createAPKZip(version).then((zip) => {
		downloadFile(zip, `Discord-${version}.zip`);
		downloadStatus.innerText = "success :D";
	}).catch((err) => {
		console.error(err);
		alert("failed - check the console?");
		downloadStatus.innerText = "failed :<";
	}).finally(() => {
		setTimeout(() => {
			downloadStatus.innerText = "download";
			downloadBar.style.width = null;
			downloadBar.style.display = "none";
		}, 2000);
		downloadButton.disabled = false;
	});
});
