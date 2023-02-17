var tab_url;

function getAllSets() {
    var sets = [];

    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key == 'filter') {
            continue;
        }

        var settings = JSON.parse(localStorage.getItem(key));
        settings.key = key;
        sets.push(settings);
    }

    return sets;
}

function sortBy(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}

function refreshSetsList(url) {
    var table = $('#sets');
    var sets;

    table.find('tbody tr').remove();

    if (table.hasClass('allsets')) {
        sets = getAllSets();
        sets.sort(sortBy('url'));
    } else {
        sets = getSetsForCurrentUrl(url);
        sets.sort(sortBy('name'));
    }

    if (sets.length) {
        $('#sets').show();
        $('#nosets').hide();
        $('#clearall').removeClass('disabled');
    } else {
        $('#sets').hide();
        $('#nosets').show();
        //$('#nosets_url').text(url);
        $('#clearall').addClass('disabled');
        return;
    }

    renderSets(sets);

    if (table.hasClass('allsets')) {
        $('#clearall').addClass('disabled');
        renderAdditionalInfo(sets);
    }
}

function renderSets(sets) {
    for (var i = 0; i < sets.length; i++) {
        var set = sets[i];
        var newRow = $('<tr data-key="' + set.key + '"></tr>');
        newRow.append('<td class="restore"><i class="icon-arrow-up"></i> Restore</td>');
        newRow.append('<td class="setName">' + set.name + '</td>');

        var isChecked = set.autoSubmit ? "checked" : "";
        var submitHtml = isChecked
            ? '<i class="icon-ok"></i> <span>Yes</span>'
            : '<i class="icon-remove"></i> <span>No</span>';

        newRow.append('<td class="submit ' + (isChecked ? 'active' : '') + '">' + submitHtml + '</td>');
        newRow.append('<td class="remove"><i class="icon-trash"></i></td>');
        newRow.append('<td class="export"><i class="icon-share-alt"></i></td>');

        var hotkey = set.hotkey;
        newRow.append('<td class="hotkey">' + (hotkey ? hotkey : 'none') + '</a></td>');

        $('#sets').append(newRow);
    }
}

function renderAdditionalInfo(sets) {
    var table = $('#sets');

    if (!table.find('th.url').length) {
        table.find('thead tr').append('<th class="url">URL</th>');
    }

    for (var i = 0; i < sets.length; i++) {
        var set = sets[i];
        var row = table.find('tr[data-key=' + set.key + ']');
        var substrHref = set.url.length > 40 ? set.url.substring(0, 40) + '...' : set.url;
        row.append('<td class="url"><a target="_blank" href="' + set.url + '">' + substrHref + '</a></td>');
        row.find('td.restore').addClass('disabled').find('i').remove();
    }
}

function saveValue(tr, property, value) {
    var key = tr.data('key');
    var setSettings = JSON.parse(localStorage.getItem(key));
    setSettings[property] = value;
    localStorage.setItem(key, JSON.stringify(setSettings));
}

function getValue(tr, property) {
    var key = tr.data('key');
    var setSettings = JSON.parse(localStorage.getItem(key));
    return setSettings[property];
}

function sendMessage(obj, callback) {
    chrome.tabs.query({'active': true, 'currentWindow': true}, function (tab) {
        chrome.tabs.sendMessage(tab[0].id, obj, callback);
    });
}

function setCurrentFilter() {
    var value = localStorage.getItem('filter');

    if (!value) {
        localStorage.setItem('filter', FILTER_BY_FULL);
        value = FILTER_BY_FULL;
    }

    var link = $('a.filter[id=' + value + ']');
    link.prepend('<i class="icon-ok"></i> ');
}

function getRandomStorageId() {
    var key = Math.floor((Math.random() * 1000000000) + 1);
    if (localStorage.getItem(key)) {
        return Math.floor((Math.random() * 1000000000) + 1);
    }
    return key;
}

function validateImportedItems(items) {
    items.forEach(item => {
        if (!item.url || !item.content || !item.name) {
            throw new Error("Invalid JSON format");
        }
    })
}

chrome.tabs.query({'active': true, 'currentWindow': true}, function (tab) {
    tab_url = tab[0].url;
    refreshSetsList(tab_url);
});

$(document).ready(function () {
    setCurrentFilter();

    $('.donatelink').click(function () {
        $('#donate').toggle();
    });

    $("#check").click(function () {

    });

    $("#viewSets").click(function () {
        $('#sets').addClass('allsets');
        refreshSetsList();
    });

    $("#import").click(function () {
        var importBlock = $('#importBlock');

        if (importBlock.is(':visible')) {
            importBlock.hide();
            return;
        }

        importBlock.show();
        importBlock.find('#txtImportFormJson').focus();
    });

    $("#btnImportSave").click(function () {
        var json = $('#txtImportFormJson').val();

        try {
            var importedForm = JSON.parse(json);

            if (!Array.isArray(importedForm)) {
                importedForm = [importedForm]
            }

            validateImportedItems(importedForm)

            importedForm.forEach(item => {
                if (item.url === '*') {
                    item.name += '-global';
                }

                var key = getRandomStorageId();
                localStorage.setItem(key, JSON.stringify(item));
            })
        } catch (err) {
            alert('Got an error: ' + err.message);
        }

        refreshSetsList(tab_url);
        $('#importBlock').hide();
    });

    $("#clearall").click(function () {
        if ($(this).hasClass("disabled")) {
            return;
        }

        var sets = getSetsForCurrentUrl(tab_url);

        for (var i = 0; i < sets.length; i++) {
            localStorage.removeItem(sets[i].key);
        }

        refreshSetsList(tab_url);
    });

    $("#store").click(function () {
        sendMessage({"action": 'store'}, function readResponse(obj) {
            var error = $('#error');
            if (!obj || chrome.runtime.lastError || obj.error) {

                if (chrome.runtime.lastError) {
                    error.html('<h6>Error :( Something wrong with current tab. Try to reload it.</h6>');
                } else if (!obj) {
                    error.html('<h6>Error :( Null response from content script</h6>');
                } else if (obj.error) {
                    error.html('<h6>Error :\'( ' + obj.message + '</h6>');
                }

                error.show();
                return;
            } else {
                error.hide();
            }

            var key = getRandomStorageId();

            var setSettings = {
                url: tab_url,
                autoSubmit: false,
                submitQuery: '',
                content: obj.content,
                name: key,
                hotkey: ''
            };

            localStorage.setItem(key, JSON.stringify(setSettings));
            refreshSetsList(tab_url);
        });
    });

    var sets = $('#sets');

    sets.on("click", 'td', function (event) {
        $('div.block').hide();
    });

    sets.on("click", 'td.restore:not(.disabled)', function (event) {
        var key = $(this).parents('tr').data('key');
        var setSettings = JSON.parse(localStorage.getItem(key));

        sendMessage({action: 'fill', setSettings: setSettings}, function (response) {
            window.close();
        });
    });

    sets.on("click", 'td.submit', function (event) {
        var td = $(this);
        var tr = td.parents('tr');

        try {

            if (td.hasClass('active')) {
                saveValue(tr, 'autoSubmit', false);
                td.removeClass('active');
                return;
            }

            var oldQuery = getValue(tr, 'submitQuery');
            oldQuery = oldQuery ? oldQuery : 'input[type=submit]';

            var query = prompt('Enter jquery selector for submit button to auto click', oldQuery);
            if (query) {
                saveValue(tr, 'submitQuery', query);
                saveValue(tr, 'autoSubmit', true);
                td.addClass('active');
            } else {
                td.removeClass('active');
            }

        } finally {
            refreshSetsList(tab_url);
        }

    });

    sets.on("click", 'td.remove', function (event) {
        var tr = $(this).parents('tr');
        var key = tr.data('key');

        localStorage.removeItem(key);
        refreshSetsList(tab_url);
    });

    sets.on("click", 'td.export', function (event) {
        var exportBlock = $('#exportBlock');

        if (exportBlock.is(':visible')) {
            exportBlock.hide();
            return;
        }

        var td = $(this);
        var tr = td.parents('tr');
        var key = tr.data('key');
        var formJson = localStorage.getItem(key);

        td.addClass('active');
        exportBlock.show();

        exportBlock.find('#txtFormJson').val(formJson).focus().select();
    });

    sets.on("click", 'td.hotkey', function (event) {
        var hotkeyBlock = $('#hotkeyBlock');

        if (hotkeyBlock.is(':visible')) {
            hotkeyBlock.hide();
            return;
        }

        var td = $(this);
        var tr = td.parents('tr');
        var value = getValue(tr, 'hotkey');

        td.addClass('active');
        hotkeyBlock.show();
        hotkeyBlock.find('#txtHotkey').val(value).focus().select();
    });

    sets.on("click", 'td.setName', function (event) {
        var td = $(this);
        if (td.find('input').length) {
            return;
        }

        var tr = td.parents('tr');
        var input = $('<input type="text" class="span1 txtSetName" />');
        input.val(getValue(tr, 'name'));

        td.empty().append(input).find('input').focus().select();
    });

    sets.on("keyup", 'input.txtSetName', function (e) {
        var textbox = $(this);
        var value = textbox.val();

        if (!value) {
            return;
        }

        var code = e.keyCode || e.which;
        var tr = textbox.parents('tr');

        if (code == 13) { //Enter keycode
            var td = textbox.parents('td');
            saveValue(tr, 'name', value);
            td.html(value);
        } else {
            saveValue(tr, 'name', value);
        }
    });

    $('#hotkeyBlock').on("keyup", '#txtHotkey', function (e) {
        var code = e.keyCode || e.which;
        if (code == 13) { //Enter keycode
            $('#btnHotkeySave').click();
        }
    });

    $('#btnHotkeySave').click(function () {
        $('#hotkeyBlock').hide();
        var tr = $('#sets td.hotkey.active').parents('tr');
        var hotkey = $('#hotkeyBlock #txtHotkey').val();
        saveValue(tr, 'hotkey', hotkey);
        refreshSetsList(tab_url);
        sendMessage({"action": 'rebind'}, function (response) {
        });
    });

    $('#btnHotkeyCancel').click(function () {
        $('#hotkeyBlock').hide();
    });

    $('#btnExportClose').click(function () {
        $('#exportBlock').hide();
    });

    $('#btnImportClose').click(function () {
        $('#importBlock').hide();
    });

    $('a.filter').click(function () {
        var link = $(this);
        var value = link.attr('id');
        $('a.filter').not(link).find('i').remove();

        localStorage.setItem('filter', value);
        link.prepend('<i class="icon-ok"></i> ');

        refreshSetsList(tab_url);
    });

    sets
        .on("mousedown", 'tbody td', function (event) {
            $(this).addClass('clicked');
        }).on("mouseup", 'tbody td', function (event) {
        $(this).removeClass('clicked');
    });

});
