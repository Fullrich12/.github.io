var ajaxCall = (key, url, prompt) => {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: url,
      type: "POST",
      dataType: "json",
      data: JSON.stringify({
        //Define model
        model: "gpt-4o-mini",
        //Define message prompt is the promt given by the user
        messages: [{"role": "user", "content": prompt}],
        //limit maximum number of tokens, the higher the more data can get send
        max_tokens: 2500,
        n: 1,
        temperature: 0.4,
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${key}`,
      },
      crossDomain: true,
      success: function (response, status, xhr) {
        resolve({ response, status, xhr });
      },
      error: function (xhr, status, error) {
        const err = new Error('xhr error');
        err.status = xhr.status;
        reject(err);
      },
    });
  });
};

const url = "https://api.openai.com/v1/chat/completions";
const makeRequestWithRetry = async (apiKey, prompt, maxRetries = 5) => {
  let attempt = 0;

  while (attempt < maxRetries) {
      try {
          return await ajaxCall(apiKey, url, prompt);
      } catch (error) {
          if (error.status === 429) {
              const waitTime = Math.pow(2, attempt) * 1000;
              console.warn(`Rate limit exceeded. Retrying in ${waitTime} ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              attempt++;
          } else {
              throw error;
          }
      }
  }

  throw new Error('Max retries exceeded');
};



(function () {
  const template = document.createElement("template");
  template.innerHTML = `
      <style>
      </style>
      <div id="root" style="width: 100%; height: 100%;">
      </div>
    `;
  class MainWebComponent extends HTMLElement {
    async post(apiKey, prompt) {
      try {
        const { response } = await makeRequestWithRetry(apiKey, prompt);
        console.log(response.choices[0].message.content);
        //string choices = responseObj.choices[0].message.content;
        return response.choices[0].message.content;
      } catch (error) {
        console.error("Request failed:", error);
        throw error;
      }
    }
  }
  customElements.define("custom-widget", MainWebComponent);
})();
