// Get some elements
const versionInput = document.getElementById("version-input");
const versionSelect = document.getElementById("version-select");
const downloadButton = document.getElementById("download-button");

(async () => {
    // Attempt to fetch latest versions
    let latestVersions;

    try {
        const data = await (await fetch("https://tracker.vendetta.rocks/tracker/index")).json();
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
})();
