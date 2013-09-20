function getHotkeys(url) {
    var sets = getSetsForCurrentUrl(url);
    var hotkeys = [];

    for (var i = 0; i < sets.length; i++) {
        if (!sets[i].hotkey) {
            continue;
        }

        hotkeys.push(sets[i].hotkey);
    }

    return hotkeys;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    var hotkeys = getHotkeys(request.url);

    switch (request.action) {
        case 'gethotkeys':
            sendResponse(hotkeys);
            break;

        case 'hotkey':
            var sets = getSetsForCurrentUrl(request.url);
            for (var i = 0; i < sets.length; i++) {
                if (sets[i].hotkey == request.code) {
                    sendResponse(sets[i]);
                }
            }
            break;
    }

    return true;
});