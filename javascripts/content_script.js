$.fn.serializeForm = function () {
    //Create an object to hold the data, this is the same type of object that is expected by $.post
    var formparams = {};
    this.each(function () {
        $(":input", this).not('button, input[type=image], input[type=submit], input[type=hidden], input[type=button]').each(function () {

            var input = $(this);
			
			if (!input.attr("id") && !input.attr("name")){
				console.error('Filler error: an input does not have id or name attribute. Skipping');
				return true;
			}			

            var name = input.attr("id");
            name = (name) ? name : input.attr("name"); //If the ID isn't valid, use the name attribute
            var value = input.val();

            if (!value) {
                return;
            }

            var type = input.attr("type");

            if ("checkbox" == type) {
                formparams[name] = this.checked ? "true" : "false";
            }
            else if ("radio" == type) {
                //Radio buttons only care about the checked one
                if (this.checked) {
                    formparams[name] = value;
                }
            }
            else {
                //Ignore ASP.NET Crap
                if (!name)
                    return;

                if (name.match(/__.+/))
                    return;

                //Do we already have a value for this?
                if (formparams[name] === undefined) {
                    formparams[name] = value;
                } else {
                    formparams[name] += "," + value;
                }
            }
        });
    });
    return formparams;
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (typeof (localStorage) == 'undefined') {
        alert("WebFormFiller: Your browser does not support HTML5 local storage feature. This extension will not work without this feature.");
        return;
    }

    switch (request.action) {
        case 'store':
            try {
                var inputs = $('body').serializeForm();
                sendResponse({ content: JSON.stringify(inputs) });
            } catch(e) {
                sendResponse({ error: true, message: e.message });
            } 
            break;

        case 'fill':
            fillForm(request.setSettings);
            sendResponse({});
            break;

        case 'rebind':
            bindHotkeys();
            break;
    }
});

bindHotkeys();

function bindHotkeys() {
    chrome.runtime.sendMessage({ "action": "gethotkeys", url: location.href }, function (hotkeys) {
        console.debug('Bind hotkeys ' + hotkeys);
        
        Mousetrap.reset();
        Mousetrap.bind(hotkeys, function (e, code) {
            chrome.runtime.sendMessage({ "action": "hotkey", code: code, url: location.href }, function (setSettings) {
                if (!setSettings) {
                    alert('Hotkey not found');
                }

                fillForm(setSettings);
            });

            return false;
        });
    });
}

function fillForm(setSettings) {
    $('body').deserialize(JSON.parse(setSettings.content));

    if (setSettings.autoSubmit) {
        try {
            var submitButton = $(setSettings.submitQuery);
            if (submitButton.length) {
                submitButton.click();
            } else {
                alert('Submit button query returned no results');
            }
        } catch (e) {
            alert('Error in submit query:' + e.message);
        }
    }
}
