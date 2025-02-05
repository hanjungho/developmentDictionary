document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector("#container");
  const form = document.querySelector("#controller");
  const resetButton = document.querySelector("#resetButton");

  resetButton.addEventListener("click", () => {
    data.length = 0;
    updateStorage(data);
  });

  const data = new Proxy([], {
    set(target, property, value) {
      target[property] = value;
      updateContainer();
      updateStorage(target);
      return true;
    },
  });

  function onMounted() {
    data.push(...(JSON.parse(localStorage.getItem("myData")) ?? []));
  }
  onMounted();

  function parseCodeBlocks(text) {
    return text.replace(/(`{3,4})([\s\S]*?)\1/g, (match, ticks, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });
  }

  function updateContainer() {
    container.innerHTML = "";
    for (const d of data) {
      const entry = document.createElement("div");
      entry.classList.add("entry");

      // 백틱 코드 블록 변환
      const parsedText = parseCodeBlocks(d.text);
      entry.innerHTML = `<p>${parsedText}</p>`;

      if (d.reply) {
        const replyBox = document.createElement("div");
        replyBox.classList.add("code-block");
        replyBox.innerHTML = `<pre>${marked.parse(d.reply)}</pre>`;
        entry.appendChild(replyBox);
      }

      // 📌 버튼 그룹 컨테이너 추가
      const buttonGroup = document.createElement("div");
      buttonGroup.classList.add("button-group");

      // 📌 저장 버튼 생성
      const saveButton = document.createElement("button");
      saveButton.textContent = "저장";
      saveButton.addEventListener("click", () => saveToFile(d));

      // 📌 삭제 버튼 생성
      const deleteButton = document.createElement("button");
      deleteButton.textContent = "삭제";
      deleteButton.addEventListener("click", () => {
        const filtered = data.filter((value) => value.id !== d.id);
        data.length = 0;
        data.push(...filtered);
      });

      // 버튼들을 그룹에 추가
      buttonGroup.appendChild(saveButton);
      buttonGroup.appendChild(deleteButton);

      // 버튼 그룹을 entry에 추가
      entry.appendChild(buttonGroup);
      container.appendChild(entry);
    }
  }

  function saveToFile(entry) {
    const content = `질문:\n${entry.text}\n\n답변:\n${entry.reply}`;
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = `data_${entry.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function updateStorage(target) {
    localStorage.setItem("myData", JSON.stringify(target));
  }

  async function handleForm(event) {
    event.preventDefault();
    const formData = new FormData(form);
    const text = formData.get("textData");

    let reply;
    switch (formData.get("modelOption")) {
      case "1":
        reply = `**Gemini :**
${await makeReply1(text)}`;
        break;
      case "2":
        reply = `**DeepSeek :**
${await makeReply2(text)}`;
        break;
      default:
        alert("비정상적인 접근!");
        throw new Error("알 수 없는 에러!");
        break;
    }

    const displayData = {
      id: Date.now(),
      text,
      reply,
    };

    data.push(displayData);
  }

  async function makeReply1(text) {
    // const GEMINI_API_KEY = "";
    // const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const url = "https://quartz-ruddy-cry.glitch.me/1";

    const response = await fetch(url, {
      method: "POST",
      // body: JSON.stringify({
      //   contents: [
      //     {
      //       parts: [
      //         {
      //           text: `너는 웹 개발자야. {${text}} 이게 뭔지 설명해. 개발 입문자도 알아듣기 쉽게 한글로 마크다운 문법으로 설명해.`,
      //         },
      //       ],
      //     },
      //   ],
      // }),
      body: JSON.stringify({
        text: `너는 웹 개발자야. "${text}" 이게 뭔지 설명해. 개발 입문자도 알아듣기 쉽게 한글로 사전과 같이 제목을 활용하여 마크다운 문법으로 설명해. 내가 입력한 프롬프트는 내용에 적지마. 너무 길지않게 요약해서 적어.`,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await response.json();
    // return json.candidates[0].content.parts[0].text;
    return json.reply;
  }

  async function makeReply2(text) {
    // const GROQ_API_KEY =
    //   "";
    // const url = "https://api.groq.com/openai/v1/chat/completions";
    const url = "https://quartz-ruddy-cry.glitch.me/2";
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        text: `너는 웹 개발자야. "${text}" 이게 뭔지 설명해. 개발 입문자도 알아듣기 쉽게 한글로 사전과 같이 제목을 활용하여 마크다운 문법으로 설명해. 내가 입력한 프롬프트는 내용에 적지마. 너무 길지않게 요약해서 적어.`,
      }),
      headers: {
        // Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
    const json = await response.json();
    //   return json.choices[0].message.content.split("</think>")[1].trim();
    return json.reply;
  }

  form.addEventListener("submit", handleForm);
});
