function banURL(url) {
    chrome.storage.local.get({"banned_urls": []}, function(items) {
        banned_urls = items['banned_urls'];
        banned_urls.push(url);
        chrome.storage.local.set({"banned_urls": banned_urls});
        alert("banned " + url)
    });
}

function unbanURL(url) {
    chrome.storage.local.get({"banned_urls": []}, function(items) {
        banned_urls = items['banned_urls'];
        new_banned_urls = []; 
        for(var i = 0 ; i < banned_urls.length ; i++) {
            if(banned_urls[i] !== url) {
                new_banned_urls.push(banned_urls[i])
            }
        }
        chrome.storage.local.set({"banned_urls": new_banned_urls});
    });
}

function setSavedURL(url) {
    console.log("setting save url: " + url)
    now = new Date().getTime();
    chrome.storage.local.set({
        "saved_url": url,
        "saved_url_time": now
    });
}

function checkURL(parts) {
    if(parts.length < 2) return; 
    
    url = parts[1];

    console.log("checkURL: " + url)

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if(xhr.status !== 200) {
                banURL(url);
            } else {
                setSavedURL(url);
            }
        }
    } 
    xhr.open('GET', url);
    xhr.timeout = 5000;
    xhr.send(null);
}

chrome.runtime.onInstalled.addListener(function() {
    chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
        chrome.declarativeContent.onPageChanged.addRules([{
          conditions: [new chrome.declarativeContent.PageStateMatcher({
            pageUrl: {urlContains: ''},
          })
          ],
              actions: [new chrome.declarativeContent.ShowPageAction()]
        }]);
      });
  });

chrome.extension.onConnect.addListener(function(port) {
    port.onMessage.addListener(function(msg) {
        parts = msg.split("$$");
        if(parts[0] === "checkURL") {
            checkURL(parts);
        } else if(parts[0] === "unbanURL") {
            unbanURL(parts[1]);
        }
    });
});