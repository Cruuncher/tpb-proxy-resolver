let openTPB = document.getElementById('openTPB');
let error = document.getElementById('error');

let bannedLoaded = false; 
let bannedList = []

function loadBanned() {
    chrome.storage.local.get({"banned_urls": []}, function(items) {
        bannedLoaded = true;
        bannedList = items['banned_urls']
        console.log("banlist: " + bannedList)
    });
}

function popupLoad() {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if(xhr.status === 200) {
                handleProxyBayDocument(xhr.responseXML);
            } else {
                error.innerText = "Proxy Site Down"
                error.style = "display: block";
            }
        }
    } 
    xhr.open('GET', 'https://proxybay.github.io/');
    xhr.responseType = "document"
    xhr.send(null);
}

function handleProxyBayDocument(doc) {
    if(!bannedLoaded) {
        console.log("how the fuck did this not load from local storage yet?");
    }
    proxyList = doc.getElementById('proxyList').rows;
    fastestTime = 999999;
    fastestProxy = "";
    for(var i = 1 ; i < proxyList.length ; i++) {
        theRow = proxyList[i];
        speed = theRow.getElementsByClassName('speed')[0].innerText 
        if(speed === 'N/A') {
            console.log("no speed")
            continue;
        }

        proxyUrl = theRow.cells[0].getElementsByTagName('a')[0].href;

        if(bannedList.indexOf(proxyUrl) !== -1) {
            console.log("skipping banned proxy: " + proxyUrl);
            continue;
        }

        if(speed < fastestTime) {
            fastestTime = speed;
            fastestProxy = proxyUrl
            console.log("new fastest proxy: " + fastestProxy);
        } else {
            console.log("current speed: " + fastestTime + " not beat with " + speed)
        }
    }

    if(fastestProxy === "") {
        error.innerText = "No available proxies";
        error.style = "display: block;";
    } else {
        advanceToTPB(fastestProxy)
    }
}

function advanceToTPB(url) {
    chrome.tabs.create({
        url: url
    });
    checkURL(url);
}

function checkURL(url) {
    message = "checkURL$$" + url

    port = chrome.extension.connect({
        name: "url_check"
    });
    port.postMessage(message);
}

loadBanned();
popupLoad();

