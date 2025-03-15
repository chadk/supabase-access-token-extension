document.addEventListener('DOMContentLoaded', function() {
    const extractButton = document.getElementById('extractToken');
    const copyButton = document.getElementById('copyButton');
    const resultDiv = document.getElementById('result');
    const copySuccess = document.getElementById('copySuccess');
    
    // Cookie and key information (hardcoded as requested)
    const COOKIE_REGEX = /sb-.*?-auth-token/;
    const JSON_KEY = 'access_token';
    const PREFIX = 'base64-';
  
    extractButton.addEventListener('click', function() {
      // Get the current tab
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs.length === 0) {
          showError("No active tab found");
          return;
        }
        
        const currentTab = tabs[0];
        const url = new URL(currentTab.url);
        
        // Get all cookies and find matching ones
        chrome.cookies.getAll({
          url: url.origin
        }, function(cookies) {
          // Find the first cookie that matches our regex
          const cookie = cookies.find(c => COOKIE_REGEX.test(c.name));

          if (!cookie) {
            showError(`No cookie matching "${COOKIE_REGEX.toString()}" found on this site`);
            return;
          }
          
          try {
            let cookieValue = cookie.value;
            
            // Remove the prefix
            if (cookieValue.startsWith(PREFIX)) {
              cookieValue = cookieValue.substring(PREFIX.length);
            } else {
              showError(`Expected prefix "${PREFIX}" not found in cookie value`);
              return;
            }
            
            // Decode base64
            const decodedValue = atob(cookieValue);
            
            // Parse JSON
            const parsedJson = JSON.parse(decodedValue);
            
            // Extract the specific key
            if (JSON_KEY in parsedJson) {
              const accessToken = parsedJson[JSON_KEY];
              resultDiv.textContent = accessToken;
              copyButton.classList.remove('hidden');
            } else {
              showError(`Key "${JSON_KEY}" not found in the cookie JSON`);
            }
          } catch (e) {
            if (e.name === 'InvalidCharacterError') {
              showError("Error: Cookie value is not valid base64");
            } else if (e instanceof SyntaxError) {
              showError("Error: Decoded value is not valid JSON");
            } else {
              showError(`Error: ${e.message}`);
            }
          }
        });
      });
    });
    
    copyButton.addEventListener('click', function() {
      const textToCopy = resultDiv.textContent;
      navigator.clipboard.writeText(textToCopy).then(function() {
        copySuccess.classList.remove('hidden');
        setTimeout(function() {
          copySuccess.classList.add('hidden');
        }, 2000);
      }).catch(function(error) {
        console.error('Could not copy text: ', error);
      });
    });
    
    function showError(message) {
      resultDiv.textContent = message;
      resultDiv.classList.add('error');
      copyButton.classList.add('hidden');
    }
  });