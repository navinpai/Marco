chrome.tabs.onUpdated.addListener( function (tabId, changeInfo, tab) {
  if (changeInfo.status == 'complete' && tab.active) {
    $.post("http://ec2-52-207-219-42.compute-1.amazonaws.com/addToMarco", {url: tab.url}, function(data, status){
      console.log("Marco keeps looking for adventure!")
    });
  }
})

