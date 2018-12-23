function remove(url) {
    message = "unbanURL$$" + url

    port = chrome.extension.connect({
        name: "unbanURL"
    });
    port.postMessage(message);

    window.location.reload();
}

function addTableRow(url) {
    rowEle = document.createElement('tr');
    data1Ele = document.createElement('td');
    data2Ele = document.createElement('td');
    removeButton = document.createElement('button');
    removeButton.innerText = "remove";
    removeButton.onclick = function() { remove(url); };
    data1Ele.innerText = url;

    data2Ele.appendChild(removeButton);
    rowEle.appendChild(data1Ele);
    rowEle.appendChild(data2Ele);

    tbody = document.getElementById("bannedTableBody");
    tbody.appendChild(rowEle);
}

function loadTable(bannedUrls) {
    for(var i = 0 ; i < bannedUrls.length ; i++) {
        addTableRow(bannedUrls[i]);
    }
}

function loadBanned() {
    chrome.storage.local.get({"banned_urls": []}, function(items) {
        bannedLoaded = true;
        bannedList = items['banned_urls']
        console.log("banlist: " + bannedList)
        loadTable(bannedList);
    });
}

loadBanned();